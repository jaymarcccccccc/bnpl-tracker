import type {
  Dashboard,
  Installment,
  MonthView,
  NewPurchase,
  Purchase,
  PurchasePatch,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
      }
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const getDashboard = () => request<Dashboard>("/dashboard");

export const getPurchases = () => request<Purchase[]>("/purchases");
export const getPurchase = (id: number) => request<Purchase>(`/purchases/${id}`);
export const createPurchase = (body: NewPurchase) =>
  request<Purchase>("/purchases", { method: "POST", body: JSON.stringify(body) });
export const updatePurchase = (id: number, body: PurchasePatch) =>
  request<Purchase>(`/purchases/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deletePurchase = (id: number) =>
  request<void>(`/purchases/${id}`, { method: "DELETE" });

export const getMonth = (month: string) =>
  request<MonthView>(`/installments?month=${month}`);

export const markPaid = (id: number) =>
  request<Installment>(`/installments/${id}/pay`, { method: "POST", body: "{}" });
export const markUnpaid = (id: number) =>
  request<Installment>(`/installments/${id}/unpay`, { method: "POST" });
