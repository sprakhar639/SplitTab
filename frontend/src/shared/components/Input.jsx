export default function Input({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="cursor-default select-none text-sm font-semibold text-[#234536]"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className={`
          w-full rounded-xl
          border border-[#DCE8DF]
          bg-white/80
          px-4 py-2.5
          text-sm font-medium text-[#183A2B]
          shadow-[0_3px_12px_rgba(20,65,47,0.025)]
          outline-none
          backdrop-blur-xl
          transition-all duration-200
          placeholder:text-[#9AA99F]
          hover:border-[#8BAF98]
          focus:border-[#397C5B]
          focus:bg-white
          focus:ring-4 focus:ring-[#397C5B]/10
          disabled:cursor-not-allowed disabled:opacity-60
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : ""
          }
        `}
        {...props}
      />

      {error ? (
        <span id={`${id}-error`} className="text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="text-xs text-[#788B7F]">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
