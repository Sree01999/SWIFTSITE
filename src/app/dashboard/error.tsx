"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <h2 className="text-3xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-base">
        {error.message || "An unexpected dashboard error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </section>
  );
}
