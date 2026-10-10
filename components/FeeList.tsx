"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  FEE_COLORS,
  FEE_LABELS,
  FEE_ORDER,
  FEE_ROLES,
  FeeStatus,
  formatVnd,
  one,
} from "@/lib/staff";

type Name = { name: string } | { name: string }[] | null;
type Row = {
  id: string;
  amount: number;
  status: FeeStatus;
  invoice_no: string | null;
  created_at: string;
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

function parts(r: Row) {
  const ref = one(r.referrals);
  const job = one(ref?.job_openings);
  return {
    teacher: one(ref?.teachers)?.full_name ?? "—",
    job: job?.title ?? "—",
    school: one(job?.schools)?.name ?? "—",
  };
}

export default function FeeList() {
  const staff = useStaff();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState<"" | FeeStatus>("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("fees")
      .select(
        "id, amount, status, invoice_no, created_at, referrals(teachers(full_name), job_openings(title, schools(name)))"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as unknown as Row[]);
    setLoadErr(error?.message ?? "");
    setLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const totals = useMemo(() => {
    const t: Record<FeeStatus, number> = { pending: 0, invoiced: 0, paid: 0, cancelled: 0 };
    rows.forEach((r) => {
      t[r.status] += Number(r.amount);
    });
    return t;
  }, [rows]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter && r.status !== filter) return false;
      if (!kw) return true;
      const p = parts(r);
      return [p.teacher, p.job, p.school, r.invoice_no]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [rows, filter, q]);

  if (!FEE_ROLES.includes(staff.role)) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Chỉ Kinh doanh, Kế toán và Ban giám đốc được xem phí môi giới.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Phí môi giới</h1>
      <p className="mt-1 text-sm text-slate-500">
        Để tạo phí mới, mở một lượt giới thiệu trong mục “Giới thiệu”.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(["pending", "invoiced", "paid"] as FeeStatus[]).map((s) => (
          <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
            <span className={`rounded-full px-3 py-1 text-xs ${FEE_COLORS[s]}`}>{FEE_LABELS[s]}</span>
            <p className="mt-3 text-xl font-bold">{formatVnd(totals[s])}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo giáo viên, trường, vị trí, số hóa đơn..."
          className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | FeeStatus)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          {FEE_ORDER.map((s) => (
            <option key={s} value={s}>
              {FEE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loadErr && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Không tải được danh sách phí: {loadErr}
        </p>
      )}
      <p className="mt-3 text-sm text-slate-500">
        {loaded ? `${shown.length} khoản phí` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nhà trường / Vị trí</th>
              <th className="px-4 py-3">Giáo viên</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const p = parts(r);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.school}</div>
                    <div className="text-xs text-slate-500">{p.job}</div>
                  </td>
                  <td className="px-4 py-3">{p.teacher}</td>
                  <td className="px-4 py-3 font-medium">{formatVnd(r.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${FEE_COLORS[r.status]}`}>
                      {FEE_LABELS[r.status]}
                    </span>
                    {r.invoice_no && (
                      <div className="mt-1 text-xs text-slate-500">HĐ: {r.invoice_no}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/fees/${r.id}`} className="text-blue-700 hover:underline">
                      Cập nhật
                    </Link>
                  </td>
                </tr>
              );
            })}
            {loaded && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có khoản phí nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
