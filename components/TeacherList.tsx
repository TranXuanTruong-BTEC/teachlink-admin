"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  INTERNAL_COLORS,
  INTERNAL_LABELS,
  INTERNAL_ORDER,
  InternalStatus,
  TEACHER_VIEW_ROLES,
} from "@/lib/staff";

type Internal = { status: InternalStatus; assigned_to: string | null };
type Row = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  province: string | null;
  subjects: string[];
  created_at: string;
  teacher_internal: Internal | Internal[] | null;
};

function internalOf(r: Row): Internal | null {
  const t = r.teacher_internal;
  return Array.isArray(t) ? t[0] ?? null : t;
}

export default function TeacherList() {
  const staff = useStaff();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"" | InternalStatus>("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("teachers")
      .select(
        "id, full_name, phone, email, province, subjects, created_at, teacher_internal(status, assigned_to)"
      )
      .order("created_at", { ascending: false })
      .limit(300);
    setRows((data ?? []) as unknown as Row[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      const st = internalOf(r)?.status;
      if (filter && st !== filter) return false;
      if (!kw) return true;
      return [r.full_name, r.phone, r.email, r.province, (r.subjects ?? []).join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [rows, filter, q]);

  if (!TEACHER_VIEW_ROLES.includes(staff.role)) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Phòng ban của bạn không có quyền xem hồ sơ giáo viên.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Hồ sơ giáo viên</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, số điện thoại, email, môn..."
          className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | InternalStatus)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          {INTERNAL_ORDER.map((s) => (
            <option key={s} value={s}>
              {INTERNAL_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {loaded ? `${shown.length} hồ sơ` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Liên hệ</th>
              <th className="px-4 py-3">Môn dạy</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const it = internalOf(r);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/teachers/${r.id}`} className="text-blue-700 hover:underline">
                      {r.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.phone ?? "—"}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{(r.subjects ?? []).join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    {it && (
                      <span className={`rounded-full px-3 py-1 text-xs ${INTERNAL_COLORS[it.status]}`}>
                        {INTERNAL_LABELS[it.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.created_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              );
            })}
            {loaded && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Không có hồ sơ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
