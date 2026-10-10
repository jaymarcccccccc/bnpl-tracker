"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import InstallmentBar from "@/components/InstallmentBar";
import { ErrorNotice, Loading } from "@/components/Notice";
import PaymentButton from "@/components/PaymentButton";
import { PurchaseBadge, StatusBadge } from "@/components/StatusBadge";
import { deletePurchase, getPurchase, updatePurchase } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

export default function PurchaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data, error, reload } = useLoad(() => getPurchase(id), [id]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (error && !data) {
    return (
      <>
        <Link href="/purchases" className="back">
          Back to purchases
        </Link>
        <ErrorNotice message={error} />
      </>
    );
  }
  if (!data) return <Loading />;

  function startEdit() {
    if (!data) return;
    setName(data.item_name);
    setProvider(data.provider);
    setNotes(data.notes ?? "");
    setFormError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await updatePurchase(id, { item_name: name, provider, notes });
      setEditing(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  async function remove() {
    if (!data || !window.confirm(`Delete "${data.item_name}" and its whole payment schedule?`)) return;
    try {
      await deletePurchase(id);
      router.push("/purchases");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete this purchase.");
    }
  }

  return (
    <>
      <div>
        <Link href="/purchases" className="back">
          Back to purchases
        </Link>
        <div className="page-head">
          <div>
            <h1>{data.item_name}</h1>
            <p className="muted">
              {data.provider}, first payment {formatDate(data.first_due_date)}
            </p>
          </div>
          <PurchaseBadge status={data.status} />
        </div>
      </div>

      <section>
        <InstallmentBar installments={data.installments} tall />
        <dl className="facts" style={{ marginTop: 20 }}>
          <div className="fact">
            <dt>Total</dt>
            <dd>{money(data.total_amount)}</dd>
          </div>
          <div className="fact">
            <dt>Paid</dt>
            <dd>{money(data.paid_amount)}</dd>
          </div>
          <div className="fact">
            <dt>Left to pay</dt>
            <dd>{money(data.remaining_amount)}</dd>
          </div>
          <div className="fact">
            <dt>Payments made</dt>
            <dd>
              {data.paid_count} of {data.num_installments}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <div className="section-head">
          <h2>Payment schedule</h2>
        </div>
        <div className="panel table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Due</th>
                <th className="right">Amount</th>
                <th>Status</th>
                <th>Paid on</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.installments.map((i) => (
                <tr key={i.id} className={i.status === "overdue" ? "row-overdue" : undefined}>
                  <td>
                    {i.number} of {i.num_installments}
                  </td>
                  <td className="num">{formatDate(i.due_date)}</td>
                  <td className="num right">{money(i.amount)}</td>
                  <td>
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="num">{i.paid_on ? formatDate(i.paid_on) : ""}</td>
                  <td className="right">
                    <PaymentButton installment={i} onChanged={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Details</h2>
          {!editing && (
            <button className="btn btn-quiet btn-sm" onClick={startEdit}>
              Edit details
            </button>
          )}
        </div>
        <div className="panel panel-pad">
          {editing ? (
            <form className="form" onSubmit={save}>
              <div className="field">
                <label htmlFor="name">Item</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="prov">Provider</label>
                <input id="prov" value={provider} onChange={(e) => setProvider(e.target.value)} required />
              </div>
              <div className="field field-wide">
                <label htmlFor="n">Notes</label>
                <input id="n" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <span className="hint">
                  To change the amount or number of payments, delete this purchase and add it again.
                </span>
              </div>
              {formError && (
                <p className="notice notice-error field-wide" role="alert">
                  {formError}
                </p>
              )}
              <div className="actions field-wide">
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <p>{data.notes || <span className="muted">No notes.</span>}</p>
              <div>
                <button className="btn btn-danger btn-sm" onClick={remove}>
                  Delete purchase
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
