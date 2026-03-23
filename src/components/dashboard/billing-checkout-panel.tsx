"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
};

type ChargeType = "build_fee" | "maintenance";

export function BillingCheckoutPanel({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [chargeType, setChargeType] = useState<ChargeType>("build_fee");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId) ?? null,
    [clients, clientId],
  );

  async function startCheckout() {
    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, chargeType }),
      });
      const data = (await res.json()) as {
        mode?: "mock" | "stripe";
        checkoutUrl?: string | null;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Checkout could not be started.");
        return;
      }

      if (data.mode === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setMessage(
        data.message ??
          "Mock checkout invoice created. Use Mark Paid (Dev) in invoice list.",
      );
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Checkout could not be started.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6">
      <h2 className="text-3xl font-semibold text-[#1f2f39]">Start Checkout</h2>
      <p className="mt-2 text-sm text-slate-600">
        Create a billing invoice and launch Stripe checkout when keys are configured.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Client</span>
          <select
            data-capability="billing-checkout"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            disabled={pending}
          >
            {!clients.length ? (
              <option value="">No clients available</option>
            ) : null}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600">Charge</span>
          <select
            data-capability="billing-checkout"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            value={chargeType}
            onChange={(event) => setChargeType(event.target.value as ChargeType)}
            disabled={pending}
          >
            <option value="build_fee">Build fee ($199 one-time)</option>
            <option value="maintenance">Maintenance ($19/month)</option>
          </select>
        </label>
      </div>

      {selectedClient?.email ? (
        <p className="mt-3 text-sm text-slate-500">
          Checkout customer email: {selectedClient.email}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

      <button
        type="button"
        data-capability="billing-checkout"
        onClick={startCheckout}
        disabled={pending || !clients.length}
        className="mt-4 rounded-xl bg-[#0a6f87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#095f73] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Starting..." : "Start Checkout"}
      </button>
    </section>
  );
}
