"use client";

import { FormEvent, useState } from "react";
import { createPurchase } from "@/lib/api";
import { addMonths, formatDate, money, parseDate, toISODate } from "@/lib/format";

const PROVIDERS = [
  "Atome",
  "SPayLater",
  "Billease",
  "GGives",
  "Home Credit",
  "Klarna",
  "Affirm",
  "Afterpay",
  "Credit card installment",
];

export default function PurchaseForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [itemName, setItemName] = useState("");
  const [provider, setProvider] = useState("");
  const [total, setTotal] = useState("");
  const [count, setCount] = useState("4");
  const [firstDue, setFirstDue] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalNum = Number(total);
  const countNum = Number(count);
  const validPreview =
    totalNum > 0 && Number.isInteger(countNum) && countNum >= 1 && countNum <= 60 && firstDue;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPurchase({
        item_name: itemName,
        provider,
        total_amount: totalNum,
        num_installments: countNum,
        first_due_date: firstDue,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this purchase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field field-wide">
        <label htmlFor="item">What did you buy?</label>
        <input
          id="item"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Laptop"
          maxLength={200}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="provider">Pay-later provider</label>
        <input
          id="provider"
          list="providers"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Atome"
          maxLength={100}
          required
        />
        <datalist id="providers">
          {PROVIDERS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label htmlFor="total">Total to repay</label>
        <input
          id="total"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="12000"
          required
        />
        <span className="hint">Include any fees or interest.</span>
      </div>

      <div className="field">
        <label htmlFor="count">Number of monthly payments</label>
        <input
          id="count"
          type="number"
          min="1"
          max="60"
          step="1"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="first">First payment due</label>
        <input
          id="first"
          type="date"
          value={firstDue}
          onChange={(e) => setFirstDue(e.target.value)}
          required
        />
      </div>

      <div className="field field-wide">
        <label htmlFor="notes">Notes (optional)</label>
        <input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
        />
      </div>

      {validPreview && (
        <p className="preview field-wide">
          {countNum} {countNum === 1 ? "payment" : "payments"} of about{" "}
          <strong>{money(totalNum / countNum)}</strong>, the last one on{" "}
          {formatDate(toISODate(addMonths(parseDate(firstDue), countNum - 1)))}.
        </p>
      )}

      {error && (
        <p className="notice notice-error field-wide" role="alert">
          {error}
        </p>
      )}

      <div className="actions field-wide">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save purchase"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
