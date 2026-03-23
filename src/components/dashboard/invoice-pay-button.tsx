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
  const [success, setSuccess] = useState<string | null>(null);

  async function markPaid() {
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pay`, {
        method: "POST",
        credentials: "include",
      });
      const responseText = await res.text();
      let data: { error?: string } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText) as { error?: string };
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        const fallback = responseText?.trim()
          ? responseText.slice(0, 180)
          : "Could not mark invoice as paid.";
        setError(`HTTP ${res.status}: ${data.error ?? fallback}`);
        return;
      }

      setSuccess("Invoice marked paid. Refreshing...");
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 250);
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
      {success ? <p className="text-xs text-emerald-700">{success}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
