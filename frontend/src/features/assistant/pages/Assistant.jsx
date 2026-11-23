import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import Loader from "../../../shared/components/Loader";
import { SUGGESTED_QUESTIONS } from "../../../services/mockAssistant";
import { askAssistant, getAssistantContext } from "../assistant.service";
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

  const endRef = useRef(null);

  useEffect(() => {
    getAssistantContext(myId)
      .then(setContext)
      .catch((err) => setError(err.message));
  }, [myId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function ask(question) {
    const text = question.trim();

    if (!text || thinking || !context) return;

    setDraft("");
    setError("");

    // Immediately display the user's message.
    setMessages((prev) => [...prev, { role: "user", text }]);

    setThinking(true);

    try {
      // Send only the current message.
      const result = await askAssistant(text, conversationId);

      // Store the conversation ID returned by the backend.
      setConversationId(result.conversationId);
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
          text: `Failed to save your message: ${err.message}`,
        },
      ]);
    } finally {
      setThinking(false);
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

  function handleNewChat() {
    setMessages([]);
    setConversationId(null);
    setError("");
    setDraft("");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            Munshi AI
            <span className="rounded-md bg-lime/40 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-deep">
              BETA
            </span>
          </h1>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleNewChat}
            className="text-xs font-bold text-deep hover:underline"
          >
            New chat
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        {!context ? (
          <Loader label="Reading your expenses…" />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-line bg-white p-6">
            <span className="grid size-10 place-items-center rounded-full bg-lime text-sm font-extrabold text-deep">
              AI
            </span>

            <div>
              <h2 className="text-lg font-extrabold">
                What would you like to know?
              </h2>

              <p className="text-sm text-mute">
                I've read {context.expenses.length} expenses across{" "}
                {context.groups.length}{" "}
                {context.groups.length === 1 ? "group" : "groups"}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => ask(question)}
                  className="rounded-full border border-line px-3 py-1.5 text-left text-sm font-semibold text-deep hover:bg-canvas"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} onAsk={ask} />
          ))
        )}

        {thinking && (
          <div
            className="flex items-center gap-3 text-sm text-mute"
            role="status"
          >
            <span className="grid size-8 place-items-center rounded-full bg-lime text-xs font-extrabold text-deep">
              AI
            </span>
            Munshi AI is working it out…
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-4 flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-lg shadow-deep/5"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask a question
        </label>

        <textarea
          id="assistant-input"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Munshi AI..."
          disabled={!context || thinking}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-mute/70"
        />

        <button
          type="submit"
          disabled={!draft.trim() || thinking || !context}
          className="rounded-xl bg-deep px-4 py-2 text-sm font-bold text-white transition hover:bg-deep-2 disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
