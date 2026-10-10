"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  REFERRAL_COLORS,
  REFERRAL_LABELS,
  REFERRAL_ORDER,
  REFERRAL_VIEW_ROLES,
  ReferralStatus,
  one,
} from "@/lib/staff";

type Row = {
  id: string;
  status: ReferralStatus;
  interview_at: string | null;
  created_at: string;
  teachers: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  job_openings:
    | { title: string; schools: { name: string } | { name: string }[] | null }
    | { title: string; schools: { name: string } | { name: string }[] | null }[]
    | null;
};

export default function ReferralList() {
  const staff = useStaff();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState<"" | ReferralStatus>("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("referrals")
      .select(
        "id, status, interview_at, created_at, teachers(id, full_name), job_openings(title, schools(name))"
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

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter && r.status !== filter) return false;
      if (!kw) return true;
      const job = one(r.job_openings);
      return [one(r.teachers)?.full_name, job?.title, one(job?.schools)?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [rows, filter, q]);

  if (!REFERRAL_VIEW_ROLES.includes(staff.role)) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Phòng ban của bạn không có quyền xem danh sách giới thiệu.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Giới thiệu giáo viên</h1>
      <p className="mt-1 text-sm text-slate-500">
        Để thêm lượt giới thiệu mới, mở hồ sơ giáo viên và chọn tin tuyển dụng.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo giáo viên, vị trí, trường..."
          className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | ReferralStatus)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          {REFERRAL_ORDER.map((s) => (
            <option key={s} value={s}>
              {REFERRAL_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loadErr && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Không tải được danh sách: {loadErr}
        </p>
      )}
      <p className="mt-3 text-sm text-slate-500">
        {loaded ? `${shown.length} lượt giới thiệu` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Giáo viên</th>
              <th className="px-4 py-3">Vị trí / Trường</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Lịch phỏng vấn</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const t = one(r.teachers);
              const job = one(r.job_openings);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    {t ? (
                      <Link href={`/teachers/${t.id}`} className="text-blue-700 hover:underline">
                        {t.full_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{job?.title ?? "—"}</div>
                    <div className="text-xs text-slate-500">{one(job?.schools)?.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${REFERRAL_COLORS[r.status]}`}>
                      {REFERRAL_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.interview_at ? new Date(r.interview_at).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/referrals/${r.id}`} className="text-blue-700 hover:underline">
                      Cập nhật
                    </Link>
                  </td>
                </tr>
              );
            })}
            {loaded && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có lượt giới thiệu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
