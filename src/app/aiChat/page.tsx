"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Mode = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  greeting: string;
  system: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  deepThinking?: boolean;
  webSearching?: boolean;
};

type ChatStreamEvent = {
  type: "reasoning" | "text" | "error";
  delta?: string;
  message?: string;
};

const modes: Mode[] = [
  {
    id: "assistant",
    emoji: "🤖",
    name: "智能助手",
    desc: "通用英语学习助手",
    greeting: "我是一个智能助手，专门帮助你学习英语和回答问题。你有什么想了解的吗？",
    system: "你是一个通用英语学习助手，帮助用户学习英语并回答各类问题，回答简洁友好。",
  },
  {
    id: "master",
    emoji: "🎓",
    name: "英语大师",
    desc: "语法与写作专家",
    greeting: "我是英语大师，擅长语法讲解和写作润色。把你的句子发给我吧！",
    system: "你是一位英语语法与写作专家，擅长纠错、润色并解释语法要点，讲解清晰有条理。",
  },
  {
    id: "business",
    emoji: "💼",
    name: "商务英语",
    desc: "职场沟通与邮件",
    greeting: "我是商务英语教练，可以帮你练习职场对话、撰写商务邮件。",
    system: "你是一位商务英语教练，帮助用户练习职场沟通、撰写商务邮件，注重专业得体的表达。",
  },
  {
    id: "qilin",
    emoji: "🦒",
    name: "麒麟哥",
    desc: "口语陪练搭子",
    greeting: "嘿！我是麒麟哥，陪你轻松练口语，想聊点什么？",
    system: "你是麒麟哥，一个幽默随和的英语口语陪练，用轻松口语化的方式陪用户练习日常对话。",
  },
  {
    id: "xiaoman",
    emoji: "🐟",
    name: "小满模式",
    desc: "轻松趣味学习",
    greeting: "小满在这里～我们边玩边学英语吧！",
    system: "你是小满，一个活泼可爱的英语学习伙伴，通过趣味例子和小游戏帮用户轻松学英语。",
  },
];

const history = ["Vite 最新版本咨询", "商务邮件写作练习", "雅思口语 Part 2"];

export default function AiChat() {
  const [activeMode, setActiveMode] = useState(modes[0]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: modes[0].greeting },
  ]);
  const [input, setInput] = useState("");
  const [deepThink, setDeepThink] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  function switchMode(mode: Mode) {
    setActiveMode(mode);
    setMessages([{ role: "assistant", content: mode.greeting }]);
  }

  function appendToLast(field: "content" | "reasoning", chunk: string) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] =
        field === "reasoning"
          ? { ...last, reasoning: (last.reasoning ?? "") + chunk }
          : { ...last, content: last.content + chunk };
      return next;
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const chatHistory = [...messages, { role: "user", content: text } as Message];
    setMessages([
      ...chatHistory,
      {
        role: "assistant",
        content: "",
        reasoning: "",
        deepThinking: deepThink,
        webSearching: webSearch,
      },
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory.map(({ role, content }) => ({ role, content })),
          system: activeMode.system,
          deepThink,
          webSearch,
        }),
      });
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorBody?.error ?? `请求失败：${res.status}`);
      }
      if (!res.body) {
        throw new Error("服务器没有返回可读取的响应");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;

        const event = JSON.parse(line) as ChatStreamEvent;
        if (event.type === "reasoning" && event.delta) {
          appendToLast("reasoning", event.delta);
        } else if (event.type === "text" && event.delta) {
          appendToLast("content", event.delta);
        } else if (event.type === "error") {
          throw new Error(event.message ?? "AI 服务请求失败");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(processLine);
      }
      buffer += decoder.decode();
      if (buffer) processLine(buffer);
    } catch (error) {
      appendToLast(
        "content",
        error instanceof Error
          ? `抱歉，${error.message}`
          : "抱歉，请求出错了，请稍后重试。"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 gap-6 bg-slate-50 p-8">
      {/* 左侧边栏 */}
      <aside className="flex w-[280px] shrink-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
        <p className="px-2 pb-2 text-xs font-bold tracking-wider text-slate-400">
          AI 模式
        </p>
        <div className="flex flex-col gap-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => switchMode(mode)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                mode.id === activeMode.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="text-lg">{mode.emoji}</span>
              {mode.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between px-2 pb-2">
          <p className="text-xs font-bold tracking-wider text-slate-400">
            历史会话
          </p>
          <button
            className="cursor-pointer rounded-md px-1 text-lg leading-none text-indigo-500 hover:bg-indigo-50"
            title="新建会话"
          >
            +
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {history.map((item) => (
            <button
              key={item}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <span>💬</span>
              {item}
            </button>
          ))}
        </div>
      </aside>

      {/* 右侧聊天区 */}
      <section className="flex flex-1 flex-col rounded-2xl bg-white shadow-sm">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeMode.emoji}</span>
            <div className="flex items-baseline gap-2">
              <h1 className="font-bold text-slate-800">{activeMode.name}</h1>
              <span className="text-sm text-slate-400">· {activeMode.desc}</span>
            </div>
          </div>
          <select className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
            <option>Qwen3.7plus</option>
            <option>Kimi-k2.7-code</option>
            <option>DeepSeek-v4-pro</option>
          </select>
        </div>

        {/* 消息列表 */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
          {messages.map((msg, i) => {
            const isAssistant = msg.role === "assistant";
            const isPending =
              loading && i === messages.length - 1 && isAssistant;
            const showReasoning =
              isAssistant &&
              (Boolean(msg.reasoning) ||
                (isPending && msg.deepThinking && !msg.webSearching));

            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                    isAssistant
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                      : "bg-slate-400"
                  )}
                >
                  {isAssistant ? "AI" : "我"}
                </span>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isAssistant
                      ? "border border-slate-100 bg-white shadow-sm"
                      : "bg-indigo-500 text-white"
                  )}
                >
                  {showReasoning && (
                    <div className="mb-3 border-l-2 border-slate-200 pl-3 text-slate-400">
                      <div className="mb-1 text-xs font-medium">
                        {isPending && !msg.content
                          ? "正在深度思考…"
                          : "深度思考过程"}
                      </div>
                      {msg.reasoning && (
                        <div className="whitespace-pre-wrap text-xs leading-relaxed">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}
                  {msg.content ? (
                    <div
                      className={cn(
                        "whitespace-pre-wrap",
                        isAssistant && "text-slate-700"
                      )}
                    >
                      {msg.content}
                    </div>
                  ) : isPending && (!msg.deepThinking || msg.webSearching) ? (
                    <span className="animate-pulse text-slate-400">
                      {msg.webSearching ? "正在联网搜索…" : "正在生成回复…"}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* 输入区 */}
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex gap-2 pb-3">
            <button
              onClick={() => setDeepThink((v) => !v)}
              disabled={loading}
              aria-pressed={deepThink}
              title={deepThink ? "关闭深度思考" : "开启深度思考"}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                deepThink
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              🧠 深度思考
            </button>
            <button
              onClick={() => setWebSearch((v) => !v)}
              disabled={loading}
              aria-pressed={webSearch}
              title={webSearch ? "关闭联网搜索" : "开启联网搜索"}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                webSearch
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              🔍 联网搜索
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="请输入内容...（Enter 发送）"
              className="h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              className="grid size-12 cursor-pointer place-items-center rounded-xl border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-50"
              title="上传附件"
            >
              +
            </button>
            <button
              onClick={send}
              className="grid size-12 cursor-pointer place-items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-500/30"
              title="发送"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5"
              >
                <path d="M3.4 20.4l17.8-8.4L3.4 3.6 3.4 10l12 2-12 2z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
