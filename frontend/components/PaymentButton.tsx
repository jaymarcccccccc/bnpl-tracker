"use client";

import { useState } from "react";
import { markPaid, markUnpaid } from "@/lib/api";
import type { Installment } from "@/lib/types";

export default function PaymentButton({
  installment,
  onChanged,
}: {
  installment: Installment;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const paid = installment.status === "paid";

  async function toggle() {
    setBusy(true);
    try {
      if (paid) await markUnpaid(installment.id);
      else await markPaid(installment.id);
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update this payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={paid ? "btn btn-quiet btn-sm" : "btn btn-primary btn-sm"}
      onClick={toggle}
      disabled={busy}
    >
      {paid ? "Undo" : "Mark paid"}
    </button>
  );
}
