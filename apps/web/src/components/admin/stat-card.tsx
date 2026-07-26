export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "border-gold-300 bg-gold-50" : "border-neutral-200 bg-white"}`}>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-gold-800" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}
