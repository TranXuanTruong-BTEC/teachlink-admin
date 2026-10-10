"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import { LEVEL_OPTIONS, SCHOOL_EDIT_ROLES } from "@/lib/staff";

type School = {
  id: string;
  name: string;
  level: string;
  province: string | null;
  district: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
};

export default function SchoolList() {
  const staff = useStaff();
  const canEdit = SCHOOL_EDIT_ROLES.includes(staff.role);
  const [rows, setRows] = useState<School[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("schools")
      .select("id, name, level, province, district, contact_name, contact_phone, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as School[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.name, r.province, r.district, r.contact_name, r.contact_phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [rows, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Nhà trường</h1>
        {canEdit && (
          <Link
            href="/schools/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Thêm nhà trường
          </Link>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo tên trường, tỉnh, người liên hệ..."
        className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
      />
      <p className="mt-3 text-sm text-slate-500">
        {loaded ? `${shown.length} trường` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tên trường</th>
              <th className="px-4 py-3">Cấp</th>
              <th className="px-4 py-3">Khu vực</th>
              <th className="px-4 py-3">Người liên hệ</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/schools/${r.id}`} className="text-blue-700 hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {LEVEL_OPTIONS.find((o) => o.value === r.level)?.label ?? r.level}
                </td>
                <td className="px-4 py-3">
                  {[r.district, r.province].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div>{r.contact_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.contact_phone}</div>
                </td>
              </tr>
            ))}
            {loaded && shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Chưa có nhà trường nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
