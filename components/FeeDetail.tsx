"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import { FEE_LABELS, FEE_ORDER, FEE_ROLES, FeeStatus, one } from "@/lib/staff";

type Name = { name: string } | { name: string }[] | null;
type Detail = {
  id: string;
  referral_id: string;
  amount: number;
  status: FeeStatus;
  invoice_no: string | null;
  invoiced_at: string | null;
  paid_at: string | null;
  note: string | null;
  referrals:
    | {
        teachers: { full_name: string } | { full_name: string }[] | null;
        job_openings: { title: string; schools: Name } | { title: string; schools: Name }[] | null;
      }
    | {
        teachers: { full_name: string } | { full_name: string }[] | null;
        job_openings: { title: string; schools: Name } | { title: string; schools: Name }[] | null;
      }[]
    | null;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100";

const today = () => new Date().toISOString().slice(0, 10);

export default function FeeDetail({ id }: { id: string }) {
  const staff = useStaff();
  const allowed = FEE_ROLES.includes(staff.role);
  const [d, setD] = useState<Detail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<FeeStatus>("pending");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoicedAt, setInvoicedAt] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("fees")
      .select(
        "*, referrals(teachers(full_name), job_openings(title, schools(name)))"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      setLoadErr(error.message);
      return;
    }
    if (!data) {
      setNotFound(true);
      return;
    }
    const x = data as unknown as Detail;
    setD(x);
    setAmount(String(x.amount));
    setStatus(x.status);
    setInvoiceNo(x.invoice_no ?? "");
    setInvoicedAt(x.invoiced_at ?? "");
    setPaidAt(x.paid_at ?? "");
    setNote(x.note ?? "");
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function onStatusChange(s: FeeStatus) {
    setStatus(s);
    if (s === "invoiced" && !invoicedAt) setInvoicedAt(today());
    if (s === "paid") {
      if (!invoicedAt) setInvoicedAt(today());
      if (!paidAt) setPaidAt(today());
    }
  }

  async function save() {
    setMsg(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setMsg({ type: "err", text: "Số tiền phí phải lớn hơn 0." });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("fees")
      .update({
        amount: Math.round(value),
        status,
        invoice_no: invoiceNo.trim() || null,
        invoiced_at: invoicedAt || null,
        paid_at: paidAt || null,
        note: note.trim() || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Không lưu được: " + error.message });
      return;
    }
    setMsg({ type: "ok", text: "Đã lưu." });
    await load();
  }

  if (!allowed) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Chỉ Kinh doanh, Kế toán và Ban giám đốc được xem phí môi giới.
      </p>
    );
  }
  if (loadErr)
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Không tải được: {loadErr}</p>;
  if (notFound) return <p className="text-slate-600">Không tìm thấy khoản phí.</p>;
  if (!d) return <p className="text-slate-500">Đang tải...</p>;

  const ref = one(d.referrals);
  const job = one(ref?.job_openings);

  return (
    <div className="max-w-3xl">
      <Link href="/fees" className="text-sm text-blue-700 hover:underline">
        ← Danh sách phí
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Phí môi giới</h1>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <p>
          <span className="text-slate-500">Nhà trường:</span>{" "}
          <b>{one(job?.schools)?.name ?? "—"}</b>
        </p>
        <p className="mt-1">
          <span className="text-slate-500">Vị trí:</span> {job?.title ?? "—"}
        </p>
        <p className="mt-1">
          <span className="text-slate-500">Giáo viên:</span>{" "}
          {one(ref?.teachers)?.full_name ?? "—"}
        </p>
        <Link
          href={`/referrals/${d.referral_id}`}
          className="mt-2 inline-block text-blue-700 hover:underline"
        >
          Xem lượt giới thiệu
        </Link>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Số tiền phí (đồng)
            <input
              type="number"
              min={0}
              step={100000}
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Trạng thái
            <select
              className={inputCls}
              value={status}
              onChange={(e) => onStatusChange(e.target.value as FeeStatus)}
            >
              {FEE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {FEE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Số hóa đơn
            <input className={inputCls} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </label>
          <label className="block text-sm">
            Ngày xuất hóa đơn
            <input type="date" className={inputCls} value={invoicedAt} onChange={(e) => setInvoicedAt(e.target.value)} />
          </label>
          <label className="block text-sm">
            Ngày thu tiền
            <input type="date" className={inputCls} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Ghi chú
            <textarea rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </fieldset>
        {msg && (
          <p
            className={`mt-4 rounded-lg p-3 text-sm ${
              msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </p>
        )}
      </section>
    </div>
  );
}
