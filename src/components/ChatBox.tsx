"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/client";
import { useApiMutation } from "@/lib/query";
import { personalityMeta } from "@/lib/constants";
import { Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatBox({
  prefs,
  initial,
}: {
  prefs: { aiName: string | null; avatar: string | null; personality: string | null; themeColor: string | null };
  initial: Msg[];
}) {
  const name = prefs.aiName || "Chloe";
  const avatar = prefs.avatar || "✨";
  const color = prefs.themeColor || "var(--accent)";
  const meta = personalityMeta(prefs.personality);

  const [messages, setMessages] = useState<Msg[]>(
    initial.length
      ? initial
      : [
          {
            role: "assistant",
            content: `Hi! I'm ${name}, your ${meta.name.toLowerCase()} life-assistant. I remember your goals, savings and shopping habits between sessions. Ask me anything — like "what should I focus on?" or "when will I reach my goals?".`,
          },
        ]
  );
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useApiMutation(
    (message: string) => api<{ reply: string }>("/api/assistant/chat", { method: "POST", body: { message } }),
    {
      onSuccess: (data) => {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      },
      onError: () => {
        setMessages((m) => [...m, { role: "assistant", content: "I hit a snag processing that. Please try again in a moment." }]);
      },
    }
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || chat.isPending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    chat.mutate(content);
  };

  const suggestions = ["What should I focus on?", "When will I reach my goals?", "Give me a savings plan", "Any price drops?", "Motivate me"];

  return (
    <div className="glass flex flex-col overflow-hidden fade-up" style={{ height: "calc(100vh - 150px)", minHeight: 460 }}>
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-11 h-11 rounded-xl grid place-items-center text-2xl shrink-0 floaty" style={{ background: color }}>{avatar}</div>
        <div className="flex-1">
          <div className="font-bold flex items-center gap-2">{name} <Sparkles size={14} style={{ color }} /></div>
          <div className="text-xs text-soft">{meta.emoji} {meta.name} · remembers everything</div>
        </div>
        <span className="chip"><span className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} /> online</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex gap-2.5 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg grid place-items-center text-lg shrink-0" style={{ background: color }}>{avatar}</div>
              <div className="glass-soft p-3 text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="p-3 text-sm rounded-2xl rounded-br-sm text-white max-w-[80%] whitespace-pre-wrap" style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #2563eb))" }}>
                {m.content}
              </div>
            </div>
          )
        )}
        {chat.isPending && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center text-lg" style={{ background: color }}>{avatar}</div>
            <div className="glass-soft p-3 typing flex gap-1">
              <span>·</span><span>·</span><span>·</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {suggestions.map((sug) => (
          <button key={sug} onClick={() => send(sug)} className="chip hover-lift" style={{ cursor: "pointer" }}>{sug}</button>
        ))}
      </div>

      <form
        className="p-3 border-t flex gap-2"
        style={{ borderColor: "var(--border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="input"
          placeholder={`Message ${name}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={chat.isPending || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
