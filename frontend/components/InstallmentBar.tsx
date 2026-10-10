import type { Installment } from "@/lib/types";
import { STATUS_LABEL, formatDate, money } from "@/lib/format";

/** One segment per payment, coloured by status. */
export default function InstallmentBar({
  installments,
  tall = false,
}: {
  installments: Installment[];
  tall?: boolean;
}) {
  const paid = installments.filter((i) => i.status === "paid").length;
  return (
    <div
      className={tall ? "bar bar-tall" : "bar"}
      role="img"
      aria-label={`${paid} of ${installments.length} payments made`}
    >
      {installments.map((i) => (
        <span
          key={i.id}
          className={`seg seg-${i.status}`}
          title={`Payment ${i.number} of ${i.num_installments}, ${formatDate(i.due_date)}, ${money(i.amount)} (${STATUS_LABEL[i.status]})`}
        />
      ))}
    </div>
  );
}
