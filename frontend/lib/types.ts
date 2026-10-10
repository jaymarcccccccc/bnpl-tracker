export type InstallmentStatus = "paid" | "overdue" | "due_soon" | "upcoming";
export type PurchaseStatus = "active" | "overdue" | "completed";

export interface Installment {
  id: number;
  purchase_id: number;
  number: number;
  num_installments: number;
  item_name: string;
  provider: string;
  due_date: string; // YYYY-MM-DD
  amount: number;
  paid_on: string | null;
  status: InstallmentStatus;
}

export interface Purchase {
  id: number;
  item_name: string;
  provider: string;
  total_amount: number;
  num_installments: number;
  first_due_date: string;
  notes: string | null;
  paid_amount: number;
  remaining_amount: number;
  paid_count: number;
  status: PurchaseStatus;
  next_due_date: string | null;
  installments: Installment[];
}

export interface NewPurchase {
  item_name: string;
  provider: string;
  total_amount: number;
  num_installments: number;
  first_due_date: string;
  notes?: string;
}

export interface PurchasePatch {
  item_name?: string;
  provider?: string;
  notes?: string | null;
}

export interface Dashboard {
  total_remaining: number;
  total_paid: number;
  active_purchases: number;
  overdue_count: number;
  overdue_amount: number;
  month: string; // YYYY-MM
  month_total: number;
  month_paid: number;
  month_remaining: number;
  month_installments: Installment[];
  up_next: Installment[];
  active: Purchase[];
}

export interface MonthView {
  month: string;
  total: number;
  paid: number;
  remaining: number;
  items: Installment[];
  carried_over: Installment[];
}
