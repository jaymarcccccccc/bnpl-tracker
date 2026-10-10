"use client";

import Link from "next/link";
import InstallmentBar from "@/components/InstallmentBar";
import { ErrorNotice, Loading } from "@/components/Notice";
import PaymentButton from "@/components/PaymentButton";
import { PurchaseBadge, StatusBadge } from "@/components/StatusBadge";
import { getDashboard } from "@/lib/api";
import { formatDate, money, monthName } from "@/lib/format";
import { useLoad } from "@/lib/useLoad";

export default function DashboardPage() {
  const { data, error, reload } = useLoad(getDashboard);

  if (error && !data) return <ErrorNotice message={error} />;
  if (!data) return <Loading />;

  const month = monthName(data.month);
  const hasAnything = data.total_paid + data.total_remaining > 0;

  let headline: string;
  let subline: string;
  if (data.month_total === 0) {
    headline = `Nothing due in ${month}`;
    subline = "No payments are scheduled this month.";
  } else if (data.month_remaining === 0) {
    headline = `You're paid up for ${month}`;
    subline = `${money(data.month_paid)} paid across ${data.month_installments.length} ${
      data.month_installments.length === 1 ? "payment" : "payments"
    }.`;
  } else {
    headline = `${money(data.month_remaining)} left to pay in ${month}`;
    const made = data.month_installments.filter((i) => i.status === "paid").length;
    subline = `${made} of ${data.month_installments.length} payments made, ${money(data.month_paid)} paid so far.`;
  }

  if (!hasAnything) {
    return (
      <div className="panel empty">
        <h1>Start your ledger</h1>
        <p className="muted">
          Add a pay-later purchase and its monthly payments will show up here.
        </p>
        <Link href="/purchases" className="btn btn-primary">
          Add a purchase
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{headline}</h1>
        {data.month_installments.length > 0 && (
          <InstallmentBar installments={data.month_installments} tall />
        )}
        <p className="hero-meta">{subline}</p>
      </section>

      <dl className="facts">
        <div className="fact">
          <dt>Still to pay overall</dt>
          <dd>{money(data.total_remaining)}</dd>
        </div>
        <div className="fact">
          <dt>Paid so far</dt>
          <dd>{money(data.total_paid)}</dd>
        </div>
        <div className="fact">
          <dt>Purchases in progress</dt>
          <dd>{data.active_purchases}</dd>
        </div>
        <div className={data.overdue_count > 0 ? "fact fact-alert" : "fact"}>
          <dt>Overdue</dt>
          <dd>
            {data.overdue_count > 0
              ? `${money(data.overdue_amount)} (${data.overdue_count})`
              : "None"}
          </dd>
        </div>
      </dl>

      <section>
        <div className="section-head">
          <h2>Up next</h2>
          <Link href="/tracker" className="muted">
            See the full month
          </Link>
        </div>
        {data.up_next.length === 0 ? (
          <div className="panel empty">
            <p className="muted">Every payment is paid. Nice work.</p>
          </div>
        ) : (
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
                {data.up_next.map((i) => (
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
                    </td>
                    <td className="right">
                      <PaymentButton installment={i} onChanged={reload} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.active.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Purchases in progress</h2>
            <Link href="/purchases" className="muted">
              Manage purchases
            </Link>
          </div>
          <div className="panel">
            {data.active.map((p) => (
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
                    <strong>{money(p.remaining_amount)}</strong>
                    <div className="item-sub">left of {money(p.total_amount)}</div>
                  </div>
                </div>
                <InstallmentBar installments={p.installments} />
                <div className="item-foot">
                  <PurchaseBadge status={p.status} />
                  {p.next_due_date && (
                    <span className="item-sub">Next payment {formatDate(p.next_due_date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
