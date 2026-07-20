import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import type { UserJSON } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// 从 Clerk 的用户数据里取主邮箱
function primaryEmail(data: UserJSON) {
  return (
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ?? data.email_addresses[0]?.email_address
  );
}

// 用户名优先取 Clerk 的 username,没有就拼 first/last name
function displayName(data: UserJSON) {
  if (data.username) return data.username;
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return name || null;
}

export async function POST(req: NextRequest) {
  // 验证请求确实来自 Clerk(需要 .env 里的 CLERK_WEBHOOK_SIGNING_SECRET)
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook 签名验证失败:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (evt.type) {
    // 注册和资料更新都走 upsert:webhook 可能重试或乱序,upsert 保证幂等
    case "user.created":
    case "user.updated": {
      const data = evt.data;
      const email = primaryEmail(data);
      if (!email) {
        // 没有邮箱的账号(如纯手机号注册)暂不入库,返回 200 避免 Clerk 反复重试
        return new Response("No email, skipped", { status: 200 });
      }
      await prisma.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email,
          username: displayName(data),
          imageUrl: data.image_url,
        },
        update: {
          email,
          username: displayName(data),
          imageUrl: data.image_url,
        },
      });
      break;
    }

    case "user.deleted": {
      if (evt.data.id) {
        // deleteMany:即使记录不存在也不会抛错
        await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
