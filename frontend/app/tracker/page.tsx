"use client";

import Link from "next/link";
import { useState } from "react";
import InstallmentBar from "@/components/InstallmentBar";
import { ErrorNotice, Loading } from "@/components/Notice";
import PaymentButton from "@/components/PaymentButton";
import { StatusBadge } from "@/components/StatusBadge";
import { getMonth } from "@/lib/api";
import { currentMonth, formatDate, money, monthLabel, shiftMonth } from "@/lib/format";
import type { Installment } from "@/lib/types";
import { useLoad } from "@/lib/useLoad";

function PaymentTable({ rows, reload }: { rows: Installment[]; reload: () => void }) {
  return (
    <div className="panel table-wrap">
      <table className="ledger">
        <thead>
          <tr>
            <th>Purchase</th>
            <th>Due</th>
            <th className="right">Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id} className={i.status === "overdue" ? "row-overdue" : undefined}>
              <td>
                <Link href={`/purchases/${i.purchase_id}`} className="item-title">
                  {i.item_name}
                </Link>
                <div className="item-sub">
                  {i.provider}, payment {i.number} of {i.num_installments}
                </div>
              </td>
              <td className="num">{formatDate(i.due_date)}</td>
              <td className="num right">{money(i.amount)}</td>
              <td>
                <StatusBadge status={i.status} />
                {i.paid_on && <div className="item-sub">on {formatDate(i.paid_on)}</div>}
              </td>
              <td className="right">
                <PaymentButton installment={i} onChanged={reload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrackerPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, error, reload } = useLoad(() => getMonth(month), [month]);
  const isCurrent = month === currentMonth();

  return (
    <>
      <div className="page-head">
        <div className="month-nav">
          <button className="btn btn-quiet btn-sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            Prev
          </button>
          <h1>{monthLabel(month)}</h1>
          <button className="btn btn-quiet btn-sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
            Next
          </button>
        </div>
        {!isCurrent && (
          <button className="btn btn-quiet btn-sm" onClick={() => setMonth(currentMonth())}>
            Back to this month
          </button>
        )}
      </div>

      {error && !data ? (
        <ErrorNotice message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <section>
            {data.items.length > 0 && <InstallmentBar installments={data.items} tall />}
            <dl className="facts" style={{ marginTop: data.items.length > 0 ? 20 : 0 }}>
              <div className="fact">
                <dt>Due this month</dt>
                <dd>{money(data.total)}</dd>
              </div>
              <div className="fact">
                <dt>Paid</dt>
                <dd>{money(data.paid)}</dd>
              </div>
              <div className="fact">
                <dt>Left to pay</dt>
                <dd>{money(data.remaining)}</dd>
              </div>
            </dl>
          </section>

          {data.carried_over.length > 0 && (
            <section>
              <div className="section-head">
                <h2>Late from earlier months</h2>
                <span className="muted">
                  {money(data.carried_over.reduce((s, i) => s + i.amount, 0))} unpaid
                </span>
              </div>
              <PaymentTable rows={data.carried_over} reload={reload} />
            </section>
          )}

          <section>
            <div className="section-head">
              <h2>Payments due in {monthLabel(month)}</h2>
            </div>
            {data.items.length === 0 ? (
              <div className="panel empty">
                <p className="muted">No payments are due in this month.</p>
              </div>
            ) : (
              <PaymentTable rows={data.items} reload={reload} />
            )}
          </section>
        </>
      )}
    </>
  );
}
