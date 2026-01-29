"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";

type PaymentMethod = {
  id: string;
  brand?: string | null;
  nameOnCard?: string | null;
  last4?: string | null;
  cardNumber?: string | null;
  cvv?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
};

export default function PaymentMethodsPage() {
  const { status } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    nameOnCard: "",
    cardNumber: "",
    cvv: "",
    expMonth: "",
    expYear: "",
    isDefault: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const formatMonth = (val?: number | null) =>
    val === null || val === undefined ? "--" : String(val).padStart(2, "0");

  const formatYear = (val?: number | null) =>
    val === null || val === undefined ? "--" : String(val).padStart(2, "0");

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        const res = await fetch("/api/payment-methods");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.message || "Failed to load payments");
        setPaymentMethods(data || []);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  const addPaymentMethod = async () => {
    if (
      !paymentForm.nameOnCard ||
      !paymentForm.cardNumber ||
      !paymentForm.cvv
    ) {
      setMessage("Fill in card name, number, and CVV");
      return;
    }
    const sanitizedCard = paymentForm.cardNumber.replace(/\s+/g, "");
    if (sanitizedCard.length < 4) {
      setMessage("Card number must include at least last 4 digits");
      return;
    }

    const derivedLast4 = sanitizedCard.slice(-4);
    const derivedBrand = "Card";
    const expMonth = Number(paymentForm.expMonth) || undefined;
    const expYear = Number(paymentForm.expYear) || undefined;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: derivedBrand,
          last4: derivedLast4,
          cardNumber: sanitizedCard,
          cvv: paymentForm.cvv,
          nameOnCard: paymentForm.nameOnCard,
          expMonth,
          expYear,
          isDefault: paymentForm.isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Could not save payment method");
      setPaymentMethods((prev) => [
        { ...data, nameOnCard: paymentForm.nameOnCard || null },
        ...prev,
      ]);
      setPaymentForm({
        nameOnCard: "",
        cardNumber: "",
        cvv: "",
        expMonth: "",
        expYear: "",
        isDefault: false,
      });
      setMessage("Payment method saved");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save payment method",
      );
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPayment = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    );
  };

  const deletePayment = async (id: string) => {
    await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-700 shadow-sm max-w-md w-full">
          <p className="mb-4">Please log in to view your payment methods.</p>
          <Link
            href="/login"
            className="bg-[#1f4b99] text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-colors font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                Payments
              </p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                Payment methods
              </h1>
              <p className="text-slate-600 mt-2">
                Manage saved cards and choose a default.
              </p>
            </div>
            <Link
              href="/profile"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#1f4b99]"
            >
              Back to profile
            </Link>
          </div>

          {message && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          )}

          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : (
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No payment methods yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">
                          {(pm.brand || pm.nameOnCard || "Card").trim()} ••••{" "}
                          {pm.last4 || "----"}
                        </p>
                        {pm.isDefault && (
                          <span className="text-xs rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1 font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">
                        Expires {formatMonth(pm.expMonth)}/
                        {formatYear(pm.expYear)}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {!pm.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultPayment(pm.id)}
                            className="text-xs rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:border-[#1f4b99]"
                          >
                            Make default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deletePayment(pm.id)}
                          className="text-xs rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="font-semibold text-slate-900">Add payment method</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Name on card"
                value={paymentForm.nameOnCard}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, nameOnCard: e.target.value })
                }
              />
              <Input
                placeholder="Card number"
                value={paymentForm.cardNumber}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, cardNumber: e.target.value })
                }
              />
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <Input
                  placeholder="CVV"
                  value={paymentForm.cvv}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, cvv: e.target.value })
                  }
                  className="w-full sm:w-28"
                />
                <Input
                  placeholder="Exp month"
                  value={paymentForm.expMonth}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, expMonth: e.target.value })
                  }
                  className="w-[120px] sm:w-24"
                />
                <Input
                  placeholder="Exp year"
                  value={paymentForm.expYear}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, expYear: e.target.value })
                  }
                  className="w-[120px] sm:w-24"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={paymentForm.isDefault}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    isDefault: e.target.checked,
                  })
                }
              />
              Set as default
            </label>
            <div className="flex gap-3">
              <Button
                onClick={addPaymentMethod}
                disabled={saving}
                className="px-6"
              >
                {saving ? "Saving..." : "Save payment method"}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  setPaymentForm({
                    nameOnCard: "",
                    cardNumber: "",
                    cvv: "",
                    expMonth: "",
                    expYear: "",
                    isDefault: false,
                  })
                }
                className="px-6 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Enter your card details securely. CVV is not stored.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
