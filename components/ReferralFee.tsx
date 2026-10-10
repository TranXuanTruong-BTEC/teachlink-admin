"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  FEE_COLORS,
  FEE_LABELS,
  FEE_ROLES,
  FeeStatus,
  ReferralStatus,
  formatVnd,
} from "@/lib/staff";

type Fee = { id: string; amount: number; status: FeeStatus };

// Khung phí môi giới hiển thị trong trang một lượt giới thiệu
export default function ReferralFee({
  referralId,
  referralStatus,
}: {
  referralId: string;
  referralStatus: ReferralStatus;
}) {
  const staff = useStaff();
  const allowed = FEE_ROLES.includes(staff.role);
  const [fee, setFee] = useState<Fee | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("fees")
      .select("id, amount, status")
      .eq("referral_id", referralId)
      .maybeSingle();
    setFee((data as Fee | null) ?? null);
    setLoadErr(error?.message ?? "");
    setLoaded(true);
  }, [referralId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (!allowed) return null;

  async function create() {
    setMsg("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setMsg("Vui lòng nhập số tiền phí lớn hơn 0.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("fees").insert({
      referral_id: referralId,
      amount: Math.round(value),
      note: note.trim() || null,
    });
    setBusy(false);
    if (error) {
      setMsg(
        error.message.includes("duplicate")
          ? "Lượt giới thiệu này đã có phí rồi."
          : "Không tạo được phí: " + error.message
      );
      return;
    }
    await load();
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Phí môi giới</h2>

      {loadErr && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Không tải được phí: {loadErr}
        </p>
      )}
      {!loaded && <p className="mt-2 text-sm text-slate-500">Đang tải...</p>}

      {loaded && fee && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="text-lg font-semibold">{formatVnd(fee.amount)}</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs ${FEE_COLORS[fee.status]}`}>
              {FEE_LABELS[fee.status]}
            </span>
          </div>
          <Link href={`/fees/${fee.id}`} className="text-blue-700 hover:underline">
            Cập nhật phí
          </Link>
        </div>
      )}

      {loaded && !fee && !loadErr && (
        <div className="mt-3 space-y-3">
          {referralStatus !== "accepted" && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Lượt giới thiệu này chưa ở trạng thái “Đã nhận việc”. Thường chỉ tạo phí khi
              giáo viên đã được trường nhận.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Số tiền phí (đồng)
              <input
                type="number"
                min={0}
                step={100000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-sm">
              Ghi chú
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Đang tạo..." : "Tạo phí môi giới"}
          </button>
          {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
        </div>
      )}
    </section>
  );
}
