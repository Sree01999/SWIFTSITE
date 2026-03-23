"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvoicePayButton({
  invoiceId,
  disabled = false,
}: {
  invoiceId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pay`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not mark invoice as paid.");
        return;
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not mark invoice as paid.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        data-capability="billing-checkout"
        onClick={markPaid}
        disabled={disabled || pending}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? "Marking..." : "Mark Paid (Dev)"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
