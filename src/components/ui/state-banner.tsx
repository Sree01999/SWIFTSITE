export function StateBanner({
  title,
  message,
  variant = "info",
}: {
  title: string;
  message: string;
  variant?: "info" | "warning" | "error";
}) {
  const tone =
    variant === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : variant === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
