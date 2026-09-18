import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { assistantStatusQuery } from "@/lib/queries";
import { useAssistantChat } from "@/lib/actions";
import type { AssistantMessage } from "@/lib/types";
import {
  ChromeButton,
  EmptyState,
  ErrorNote,
  Loading,
  PageHeader,
  Panel,
  Tag,
  TextInput,
} from "@/components/control";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Railway AI Block Planner" },
      {
        name: "description",
        content:
          "Ask about asset risk, station status, or the current maintenance plan — grounded in real data.",
      },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Why is AST000001 high risk?",
  "Summarize the maintenance history for AST000001",
  "What's the status of station AA?",
  "What does the current shadow-block plan look like?",
];

/** Render the small, safe Markdown subset returned by the chat model. */
function InlineAnswer({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-cream">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-ink px-1.5 py-0.5 text-xs text-signal">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="text-signal underline underline-offset-2 hover:text-signalsoft">{link[1]}</a>;
    }
    return part;
  });
}

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function AssistantAnswer({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let codeLines: string[] = [];
  let inCode = false;

  const addCode = (index: number) => {
    if (!codeLines.length) return;
    blocks.push(
      <pre key={`code-${index}`} className="overflow-x-auto rounded-md border border-line bg-ink px-3 py-2 text-xs leading-5 text-signal">
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.trim().startsWith("```")) {
      if (inCode) addCode(index);
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) continue;

    // A Markdown table always has a header, divider, and one or more data rows.
    if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && (lines[index] ?? "").includes("|")) {
        rows.push(tableCells(lines[index] ?? ""));
        index += 1;
      }
      index -= 1;
      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto rounded-md border border-line bg-ink/60">
          <table className="min-w-full text-left text-xs leading-5">
            <thead className="bg-ink3 text-[10px] uppercase tracking-wide text-steel">
              <tr>{headers.map((header, cellIndex) => <th key={cellIndex} className="whitespace-nowrap px-3 py-2 font-semibold"><InlineAnswer text={header} /></th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="text-cream hover:bg-ink3/50">
                  {headers.map((_, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top"><InlineAnswer text={row[cellIndex] ?? "—"} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (heading) {
      blocks.push(<h3 key={index} className="border-l-2 border-signal pl-2.5 pt-1 font-display text-xs font-semibold uppercase tracking-wide text-signal"><InlineAnswer text={heading[1] ?? ""} /></h3>);
    } else if (bullet) {
      blocks.push(<div key={index} className="flex gap-2.5 rounded-r-md border-l border-line/80 pl-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-signal" /><span><InlineAnswer text={bullet[1] ?? ""} /></span></div>);
    } else if (ordered) {
      blocks.push(<div key={index} className="flex gap-2.5 rounded-r-md border-l border-line/80 pl-2.5"><span className="font-display font-semibold text-signal">{ordered[1] ?? ""}.</span><span><InlineAnswer text={ordered[2] ?? ""} /></span></div>);
    } else {
      blocks.push(<p key={index}><InlineAnswer text={line} /></p>);
    }
  }
  if (inCode) addCode(lines.length);

  return <div className="min-w-0 space-y-2.5 break-words text-sm leading-6 text-cream">{blocks}</div>;
}

function AssistantPage() {
  const status = useQuery(assistantStatusQuery);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const chat = useAssistantChat();

  const send = (text: string) => {
    if (!text.trim() || chat.isPending) return;

    const next: AssistantMessage[] = [...messages, { role: "user", content: text }];

    setMessages(next);
    setInput("");

    chat.mutate(next, {
      onSuccess: (result) => {
        if (result?.reply) {
          setMessages((cur) => [...cur, { role: "assistant", content: result.reply }]);
        }
      },
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="AI · ASSISTANT"
        title="Ask about risk, history or the plan"
        intro="Grounded in this system's real data — every answer about a specific asset, station or plan comes from a live lookup, not a guess. It never changes an ML prediction, only explains it."
      />

      {status.data && !status.data.configured ? (
        <Panel title="Not configured">
          <p className="break-words text-sm leading-6 text-steel">
            The assistant needs an API key. Set <code className="text-signal">AI_API_KEY</code> (and
            optionally <code className="text-signal">AI_BASE_URL</code> /{" "}
            <code className="text-signal">AI_MODEL</code>) in{" "}
            <code className="text-signal">Backend/.env</code> — see{" "}
            <code className="text-signal">.env.example</code>. Any OpenAI-compatible provider works
            (Grok, Groq, OpenAI).
          </p>
        </Panel>
      ) : (
        <Panel title="Conversation">
          <div className="min-h-[16rem] min-w-0 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <EmptyState
                  title="No messages yet"
                  hint="Try one of these, or ask your own question."
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="w-full rounded-md border border-line px-3 py-2 text-left text-[11px] leading-5 text-steel transition hover:bg-ink3 hover:text-cream sm:w-auto sm:py-1.5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex min-w-0 items-start gap-2 sm:gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" ? (
                    <div className="shrink-0">
                      <Tag tone="signal">AI</Tag>
                    </div>
                    ) : null}

                    <div className={`min-w-0 max-w-[90%] rounded-lg border px-3 py-2.5 shadow-sm sm:max-w-[82%] ${m.role === "user" ? "border-steel/40 bg-ink3" : "border-line bg-ink2"}`}>
                      {m.role === "user" ? (
                        <p className="break-words whitespace-pre-wrap text-sm leading-6 text-cream">{m.content}</p>
                      ) : (
                        <>
                          <div className="-mx-3 -mt-2.5 mb-3 flex items-center justify-between border-b border-line bg-ink3/70 px-3 py-2">
                            <span className="label-mono text-[9px] tracking-widest text-steel">AI OPERATIONS BRIEF</span>
                            <span className="rounded bg-signal/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-signal">DATA-GROUNDED</span>
                          </div>
                          <AssistantAnswer content={m.content} />
                        </>
                      )}
                    </div>

                    {m.role === "user" ? (
                      <div className="shrink-0"><Tag tone="steel">You</Tag></div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {chat.isPending ? <Loading label="Looking up real data and thinking…" /> : null}

            {chat.error ? <ErrorNote error={chat.error} title="Assistant failed" /> : null}
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="min-w-0 flex-1">
              <TextInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about an asset, station, or the current plan…"
                disabled={chat.isPending}
              />
            </div>

            <ChromeButton
              type="submit"
              disabled={chat.isPending || !input.trim()}
              className="w-full sm:w-auto"
            >
              Send
            </ChromeButton>
          </form>
        </Panel>
      )}
    </div>
  );
}
