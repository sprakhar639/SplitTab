const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const RUPEE_PATTERN = /^\d+(\.\d{1,2})?$/;

// The backend stores every amount in paise.
export default function formatCurrency(paise) {
  return formatter.format((Number(paise) || 0) / 100);
}

// Same rule the expense controller uses: whole rupees or up to 2 decimals.
export function toPaise(value) {
  const text = String(value ?? "").trim();

  if (!RUPEE_PATTERN.test(text)) return null;

  return Math.round(Number(text) * 100);
}
