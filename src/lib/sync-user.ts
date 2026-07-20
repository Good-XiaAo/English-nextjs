import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// 记录已同步过的 clerkId -> 同步时间。命中且未过期就跳过 upsert。
// 热更新时挂到 globalThis 上复用,和 prisma 单例同理。
const SYNC_TTL_MS = 60 * 60 * 1000; // 1 小时后重新同步一次,吸收资料变更
const globalForSync = globalThis as unknown as {
  syncedUsers?: Map<string, number>;
};
const syncedUsers = (globalForSync.syncedUsers ??= new Map());

/**
 * 懒同步:已登录用户访问时,确保数据库里存在对应记录。
 * 作为 webhook 的兜底 —— 本地开发没有公网隧道时也能入库;
 * 两者都是按 clerkId upsert,幂等,可共存。
 *
 * 每个用户在本进程内最多每 SYNC_TTL_MS 执行一次 upsert;
 * 缓存命中时连 currentUser()(一次 Clerk API 请求)都不会发起,
 * 只用 auth() 从请求里的 JWT 本地解析出用户 ID,零网络开销。
 */
export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return; // 未登录

  const syncedAt = syncedUsers.get(userId);
  if (syncedAt && Date.now() - syncedAt < SYNC_TTL_MS) return; // 已同步,跳过

  const user = await currentUser();
  if (!user) return;

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) return;

  const username =
    user.username ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null;

  await prisma.user.upsert({
    where: { clerkId: user.id },
    create: {
      clerkId: user.id,
      email,
      username,
      imageUrl: user.imageUrl,
    },
    update: {
      email,
      username,
      imageUrl: user.imageUrl,
    },
  });

  syncedUsers.set(userId, Date.now());

  // 防止长期运行时 Map 无限增长
  if (syncedUsers.size > 10_000) {
    const cutoff = Date.now() - SYNC_TTL_MS;
    for (const [id, at] of syncedUsers) {
      if (at < cutoff) syncedUsers.delete(id);
    }
  }
}
