import Link from "next/link";

import { CapabilityPill } from "@/components/capability/capability-pill";
import { BillingCheckoutPanel } from "@/components/dashboard/billing-checkout-panel";
import { InvoicePayButton } from "@/components/dashboard/invoice-pay-button";
import { getBillingEnv } from "@/lib/billing/env";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
};

type InvoiceRow = {
  id: string;
  client_id: string;
  type: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
  paid_at: string | null;
};

function money(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

function invoiceStatusClasses(status: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "open") return "bg-amber-100 text-amber-700";
  if (status === "void" || status === "uncollectable") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-200 text-slate-700";
}

export default async function BillingPage() {
  const supabase = await createClient();
  const billingEnv = getBillingEnv();

  const [
    { data: clientsData, error: clientsError },
    { data: invoicesData, error: invoicesError },
  ] = await Promise.all([
    supabase.from("clients").select("id,name,email").order("name", { ascending: true }),
    supabase
      .from("invoices")
      .select("id,client_id,type,amount_cents,currency,status,description,created_at,paid_at")
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const clients = (clientsData ?? []) as ClientRow[];
  const invoices = (invoicesData ?? []) as InvoiceRow[];
  const clientById = new Map(clients.map((client) => [client.id, client]));

  const paidTotalCents = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount_cents, 0);
  const openTotalCents = invoices
    .filter((invoice) => invoice.status === "open" || invoice.status === "draft")
    .reduce((sum, invoice) => sum + invoice.amount_cents, 0);
  const activeSubscriptions = invoices.filter(
    (invoice) => invoice.type === "maintenance" && invoice.status === "paid",
  ).length;
  const unpaidInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== "paid" &&
      invoice.status !== "void" &&
      invoice.status !== "uncollectable",
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1b2832]">Billing</h1>
        <p className="mt-2 text-xl text-slate-600">
          Revenue controls, invoice automation, and subscription lifecycle.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/docs"
            className="text-sm font-semibold text-[#0a6f87] hover:underline"
          >
            Billing setup guide
          </Link>
          <Link
            href="/dashboard/support"
            className="text-sm font-semibold text-[#0a6f87] hover:underline"
          >
            Need help?
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CapabilityPill capabilityId="billing-checkout" />
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              billingEnv.stripeEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {billingEnv.stripeEnabled ? "Stripe configured" : "Mock mode"}
          </span>
        </div>
      </div>
      {clientsError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load clients: {clientsError.message}
        </div>
      ) : null}
      {invoicesError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load invoices: {invoicesError.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Revenue collected</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {money(paidTotalCents)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Open invoices</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {money(openTotalCents)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-[#eff4f8] px-6 py-5">
          <p className="text-xs font-medium text-slate-600">Active maintenance plans</p>
          <p className="mt-3 text-4xl font-semibold text-[#0a6f87]">
            {activeSubscriptions}
          </p>
        </article>
      </div>

      <BillingCheckoutPanel clients={clients} />
      {!billingEnv.stripeEnabled ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Dev payment actions</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mock mode is a status label. Use the buttons below to simulate invoice
            payments.
          </p>
          <div className="mt-4 grid gap-3">
            {unpaidInvoices.slice(0, 8).map((invoice) => {
              const client = clientById.get(invoice.client_id);
              return (
                <div
                  key={`dev-${invoice.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-800">
                      {client?.name ?? "Unknown client"} •{" "}
                      {(invoice.type ?? "unknown").replace("_", " ")}
                    </p>
                    <p>
                      {money(invoice.amount_cents)} • {invoice.status}
                    </p>
                  </div>
                  <InvoicePayButton invoiceId={invoice.id} />
                </div>
              );
            })}
            {!unpaidInvoices.length ? (
              <p className="text-sm text-slate-500">
                No unpaid invoices yet. Use Start Checkout first.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white">
        <div className="px-6 py-5">
          <h2 className="text-3xl font-semibold text-[#1f2f39]">Invoices</h2>
          <p className="text-sm text-slate-600">
            Build fees and maintenance billing records.
          </p>
          {!billingEnv.stripeEnabled ? (
            <p className="mt-1 text-xs text-slate-500">
              In mock mode, use the Action column to click Mark Paid (Dev) for unpaid
              invoices.
            </p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#ecf1f5]">
              <tr className="text-left text-xs font-medium text-slate-600">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const client = clientById.get(invoice.client_id);
                const isUnpaid =
                  invoice.status !== "paid" &&
                  invoice.status !== "void" &&
                  invoice.status !== "uncollectable";
                const actionEnabled = isUnpaid && !billingEnv.stripeEnabled;

                return (
                  <tr key={invoice.id} className="border-t border-slate-200">
                    <td className="px-6 py-5 text-sm text-slate-800">
                      {client?.name ?? "Unknown client"}
                    </td>
                    <td className="px-6 py-5 text-sm capitalize text-slate-700">
                      {(invoice.type ?? "unknown").replace("_", " ")}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-700">
                      {money(invoice.amount_cents)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${invoiceStatusClasses(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(invoice.created_at))}
                    </td>
                    <td className="px-6 py-5">
                      {actionEnabled ? (
                        <InvoicePayButton invoiceId={invoice.id} />
                      ) : (
                        <span className="text-xs text-slate-500">
                          {billingEnv.stripeEnabled
                            ? "Payment handled by Stripe"
                            : isUnpaid
                              ? "No action"
                              : "Closed"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!invoices.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-sm text-slate-500">
                    No invoices yet. Start checkout to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
