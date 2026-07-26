export function formatPrice(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  const formatted = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);
  return `Rs ${formatted}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}
