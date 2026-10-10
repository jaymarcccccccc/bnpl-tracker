import type { InstallmentStatus, PurchaseStatus } from "@/lib/types";
import { PURCHASE_STATUS_LABEL, STATUS_LABEL } from "@/lib/format";

export function StatusBadge({ status }: { status: InstallmentStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

const PURCHASE_TONE = {
  active: "upcoming",
  overdue: "overdue",
  completed: "paid",
} as const;

export function PurchaseBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span className={`badge badge-${PURCHASE_TONE[status]}`}>
      {PURCHASE_STATUS_LABEL[status]}
    </span>
  );
}
