import formatCurrency from "../../../shared/utils/formatCurrency";

const TONES = {
  positive: "text-success",
  negative: "text-danger",
};

export default function ChatMessage({ message, onAsk }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-deep px-5 py-3 text-sm leading-6 text-white shadow-sm">
          {message.text}
        </p>
      </div>
    );
  }

  const largest = Math.max(
    1,
    ...(message.items ?? []).map((item) => item.value),
  );

  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-xs font-extrabold text-deep">
        AI
      </span>

      <div className="flex max-w-[88%] min-w-0 flex-col gap-3 rounded-2xl rounded-tl-sm border border-line bg-white px-5 py-4 shadow-sm">
        <p className="whitespace-pre-wrap text-sm leading-7 text-ink">
          {message.text}
        </p>

        {message.items?.length > 0 && (
          <ul className="flex flex-col gap-3">
            {message.items.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="flex flex-col gap-1"
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">
                    {item.label}
                    {item.note && (
                      <span className="ml-1.5 text-xs font-normal text-mute">
                        {item.note}
                      </span>
                    )}
                  </span>

                  <span
                    className={`font-bold tabular-nums ${TONES[item.tone] ?? ""}`}
                  >
                    {formatCurrency(item.value)}
                  </span>
                </div>

                <span className="h-1.5 overflow-hidden rounded-full bg-canvas">
                  <span
                    className={`block h-full rounded-full ${
                      item.tone === "negative" ? "bg-danger" : "bg-success"
                    }`}
                    style={{
                      width: `${(item.value / largest) * 100}%`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        {message.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onAsk(suggestion)}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-deep transition hover:border-[#9DDC9F] hover:bg-canvas"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
