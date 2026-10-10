"use client";

import Link from "next/link";
import { useState } from "react";
import InstallmentBar from "@/components/InstallmentBar";
import { ErrorNotice, Loading } from "@/components/Notice";
import PurchaseForm from "@/components/PurchaseForm";
import { PurchaseBadge } from "@/components/StatusBadge";
import { deletePurchase, getPurchases } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

type Filter = "all" | "progress" | "paid_off";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "progress", label: "In progress" },
  { value: "paid_off", label: "Paid off" },
];

export default function PurchasesPage() {
  const { data, error, reload } = useLoad(getPurchases);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  if (error && !data) return <ErrorNotice message={error} />;
  if (!data) return <Loading />;

  const shown = data.filter((p) =>
    filter === "all" ? true : filter === "paid_off" ? p.status === "completed" : p.status !== "completed"
  );

  async function remove(id: number, name: string) {
    if (!window.confirm(`Delete "${name}" and its whole payment schedule?`)) return;
    try {
      await deletePurchase(id);
      reload();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not delete this purchase.");
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Purchases</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add purchase
          </button>
        )}
      </div>

      {showForm && (
        <section className="panel panel-pad" aria-label="Add a purchase">
          <PurchaseForm
            onCancel={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              reload();
            }}
          />
        </section>
      )}

      <section>
        <div className="section-head">
          <div className="filters" role="group" aria-label="Filter purchases">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className="pill"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="panel empty">
            <p className="muted">
              {data.length === 0
                ? "No purchases yet. Add one to build its payment schedule."
                : "No purchases match this filter."}
            </p>
          </div>
        ) : (
          <div className="panel">
            {shown.map((p) => (
              <div className="item" key={p.id}>
                <div className="item-top">
                  <div>
                    <Link href={`/purchases/${p.id}`} className="item-title">
                      {p.item_name}
                    </Link>
                    <div className="item-sub">
                      {p.provider}, {p.paid_count} of {p.num_installments} paid
                    </div>
                  </div>
                  <div className="item-amount">
                    <strong>{money(p.total_amount)}</strong>
                    <div className="item-sub">
                      {p.status === "completed"
                        ? "Fully paid"
                        : `${money(p.remaining_amount)} left`}
                    </div>
                  </div>
                </div>
                <InstallmentBar installments={p.installments} />
                <div className="item-foot">
                  <div className="item-actions">
                    <PurchaseBadge status={p.status} />
                    {p.next_due_date && (
                      <span className="item-sub">Next payment {formatDate(p.next_due_date)}</span>
                    )}
                  </div>
                  <div className="item-actions">
                    <Link href={`/purchases/${p.id}`} className="btn btn-quiet btn-sm">
                      View payments
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(p.id, p.item_name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
