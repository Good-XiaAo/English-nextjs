import Link from "next/link";
import { Nav } from "@/components/nav";
import { StatCounter } from "@/components/stat-counter";

const stats = [
  { to: 1000000, suffix: "+", label: "累计学员" },
  { to: 500, suffix: "+", label: "精选课程" },
  { to: 98, suffix: "%", label: "学员满意度" },
  { to: 5000000, suffix: "+", label: "学习时长(小时)" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Nav />

      <main className="mx-auto max-w-[1200px] px-5 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1c2b] via-[#20223a] to-[#181826] p-10 shadow-2xl md:p-14">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              🔥 免费 5 天沉浸式学习
            </span>
            <h1 className="mt-6 bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-3xl font-black leading-snug text-transparent md:text-4xl">
              通过跟 AI 对话，
              <br />
              提高你的英语水平
            </h1>
            <p className="mt-4 text-sm text-slate-300 md:text-base">
              超 1000000 学员的选择，提升您的英语能力
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/learn"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-500/30"
              >
                立即学习
              </Link>
              <Link
                href="/courses"
                className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                查看课程
              </Link>
            </div>
          </div>

          {/* 3D 装饰占位 */}
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="relative h-72 w-72">
              <div className="animate-float-3d absolute inset-0 grid place-items-center">
                <div className="h-40 w-40 rotate-[18deg] rounded-full border-8 border-rose-500/70" />
              </div>
              <div
                className="animate-float-3d absolute inset-0 grid place-items-center"
                style={{ animationDelay: "-1.3s" }}
              >
                <div className="h-24 w-52 -rotate-12 rounded-full border-4 border-amber-400/80" />
              </div>
              <div
                className="animate-float-3d absolute inset-0 grid place-items-center"
                style={{ animationDelay: "-2.6s" }}
              >
                <div className="h-24 w-24 rotate-45 rounded-lg border border-indigo-300/40 bg-gradient-to-br from-indigo-500/40 to-violet-600/40" />
              </div>
            </div>
          </div>
        </section>

        {/* 为什么选择我们 */}
        <section className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-slate-800">为什么选择我们？</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
            我们经过科学的验证，AI 学习英语的效果比传统学习方式更好、更高效。
          </p>
        </section>

        {/* 数据统计 */}
        <section className="mb-8 mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-slate-800 md:text-4xl">
                <StatCounter to={stat.to} />
                <span className="text-indigo-500">{stat.suffix}</span>
              </div>
              <div className="mt-2 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-slate-400">
        English App 
      </footer>
    </div>
  );
}
