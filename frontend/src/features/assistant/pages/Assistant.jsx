import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Loader from "../../../shared/components/Loader";
import { SUGGESTED_QUESTIONS } from "../../../services/mockAssistant";

import {
  askAssistant,
  getAssistantContext,
  getMessages,
} from "../assistant.service";

import ChatMessage from "../components/ChatMessage";

export default function Assistant() {
  const { user } = useAuth();
  const myId = user?.id ?? null;

  const [context, setContext] = useState(null);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const [showMore, setShowMore] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Load SplitTab context.
  useEffect(() => {
    if (!myId) return;

    getAssistantContext(myId)
      .then(setContext)
      .catch((err) => setError(err.message));
  }, [myId]);

  // Restore conversation after refresh.
  useEffect(() => {
    if (!myId) return;

    let cancelled = false;

    async function restoreConversation() {
      try {
        const savedId = localStorage.getItem(`splittab_conversation_${myId}`);

        if (!savedId) return;

        const result = await getMessages(savedId);

        if (cancelled) return;

        setConversationId(Number(savedId));

        setMessages(
          result.map((message) => ({
            role: message.role,
            text: message.content,
          })),
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Conversation restoration failed:", err);
          setError("Unable to restore your previous conversation.");
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    }

    restoreConversation();

    return () => {
      cancelled = true;
    };
  }, [myId]);

  // Scroll to latest message.
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, thinking]);

  // Send message.
  async function ask(question) {
    const text = question.trim();

    if (!text || thinking || !context) return;

    setDraft("");
    setError("");
    setShowTopics(false);

    setMessages((prev) => [...prev, { role: "user", text }]);

    setThinking(true);

    try {
      const result = await askAssistant(text, conversationId);

      setConversationId(result.conversationId);

      localStorage.setItem(
        `splittab_conversation_${myId}`,
        result.conversationId,
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.message.content,
        },
      ]);
    } catch (err) {
      setError(err.message);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Something went wrong: ${err.message}`,
        },
      ]);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ask(draft);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(draft);
    }
  }

  // Start a new analysis.
  function handleNewAnalysis() {
    if (thinking) return;

    localStorage.removeItem(`splittab_conversation_${myId}`);

    setMessages([]);
    setConversationId(null);
    setDraft("");
    setError("");
    setShowMore(false);
    setShowTopics(false);
  }

  const visibleQuestions = showMore
    ? SUGGESTED_QUESTIONS
    : SUGGESTED_QUESTIONS.slice(0, 3);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden px-4 pt-2 pb-0 sm:px-8">
      {/* Header */}
      <header className="mx-auto -mt-2 flex w-full max-w-[1050px] shrink-0 items-center justify-between py-0">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#16B86A]">✦</span>

          <h1 className="text-lg font-extrabold text-deep">Munshi AI</h1>

          <span className="rounded-md bg-lime/40 px-2 py-0.5 text-[10px] font-extrabold text-deep">
            BETA
          </span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleNewAnalysis}
            disabled={thinking}
            className="text-sm font-semibold text-mute transition hover:text-deep disabled:opacity-40"
          >
            New Analysis
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto flex min-h-0 w-full max-w-[1050px] flex-1 flex-col">
        {!context || restoring ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader label="Preparing Munshi AI..." />
          </div>
        ) : messages.length === 0 ? (
          /* Welcome screen */
          <section className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto py-6">
            {/* Animated Munshi identity */}
            <div className="munshi-brand-mark mb-5">
              <span className="munshi-brand-icon">₹</span>
              <span className="munshi-brand-spark">✦</span>
            </div>

            {/* Welcome text */}
            <div className="munshi-welcome text-center">
              <h2 className="text-xl font-bold tracking-tight text-deep">
                What would you like to know?
              </h2>

              <p className="mt-1 text-sm text-mute">
                Your personal financial assistant for smarter spending.
              </p>
            </div>
          </section>
        ) : (
          /* Conversation */
          <section className="min-h-0 flex-1 overflow-y-auto py-6">
            <div className="mx-auto flex w-full max-w-[850px] flex-col gap-6">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} onAsk={ask} />
              ))}

              {thinking && (
                <div className="flex items-center gap-3 text-sm text-mute">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-xs font-extrabold text-deep">
                    AI
                  </span>

                  <span className="munshi-thinking">
                    Munshi AI is thinking...
                  </span>
                </div>
              )}

              <div ref={endRef} />
            </div>
          </section>
        )}
      </main>

      {/* Error */}
      {messages.length > 0 && error && (
        <p className="mx-auto w-full max-w-[850px] pb-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Topics popup */}
      {showTopics && (
        <div className="relative mx-auto mb-2 w-full max-w-[1050px]">
          <div className="absolute bottom-0 left-0 z-20 w-[260px] rounded-xl border border-line bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">
              Explore topics
            </p>

            {[
              "Spending analysis",
              "Group expenses",
              "Balances and settlements",
              "Recent transactions",
            ].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setDraft(topic);
                  setShowTopics(false);
                  inputRef.current?.focus();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-deep transition hover:bg-canvas"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input footer */}
      <footer className="mx-auto mt-auto w-full max-w-[1050px] shrink-0 pb-0 pt-2">
        {/* Suggested questions */}
        {messages.length === 0 && !restoring && context && (
          <div className="mb-3 flex w-full flex-col items-end">
            {/* Fixed-height scrollable suggestions */}
            <div
              className={`flex w-full flex-col items-end gap-2 overflow-x-hidden pr-2 ${
                showMore ? "h-[156px] overflow-y-auto" : "overflow-y-hidden"
              }`}
            >
              {visibleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => ask(question)}
                  className="max-w-[95%] shrink-0 rounded-xl border border-line bg-white px-3.5 py-2 text-right text-[13px] font-medium text-deep shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9DDC9F] hover:shadow-md"
                >
                  {question}
                </button>
              ))}
            </div>

            {/* Show more / Show less */}
            {SUGGESTED_QUESTIONS.length > 3 && (
              <button
                type="button"
                onClick={() => setShowMore((prev) => !prev)}
                className="mt-2 px-2 py-1 text-xs font-semibold text-mute transition hover:text-deep"
              >
                {showMore ? "Show less ↑" : "Show more ↓"}
              </button>
            )}
          </div>
        )}

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="mt-auto flex h-[58px] shrink-0 items-center gap-3 rounded-2xl border border-line bg-white px-5 py-1.5 shadow-md"
        >
          <textarea
            ref={inputRef}
            id="assistant-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={!context || thinking || restoring}
            className="h-8 min-h-0 flex-1 resize-none self-center bg-transparent px-1 py-1 text-base leading-6 outline-none placeholder:text-mute/70"
          />

          <button
            type="submit"
            disabled={!draft.trim() || thinking || !context || restoring}
            aria-label="Send message"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-deep text-white transition hover:bg-deep-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <path d="M22 2 11 13" strokeLinecap="round" />
              <path d="m22 2-7 20-4-9-9-4 20-7Z" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-2 pb-1 text-center text-[10px] text-mute">
          Munshi AI can make mistakes. Verify important financial information.
        </p>
      </footer>
    </div>
  );
}
