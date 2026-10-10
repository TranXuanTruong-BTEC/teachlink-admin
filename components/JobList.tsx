"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  JOB_EDIT_ROLES,
  JOB_STATUS_COLORS,
  JOB_STATUS_LABELS,
  JobStatus,
  isLiveOnWeb,
} from "@/lib/staff";

type SchoolRef = { name: string } | { name: string }[] | null;
type Job = {
  id: string;
  title: string;
  subject: string | null;
  quantity: number;
  province: string | null;
  status: JobStatus;
  is_published: boolean;
  deadline: string | null;
  created_at: string;
  schools: SchoolRef;
};

function schoolName(s: SchoolRef) {
  const o = Array.isArray(s) ? s[0] : s;
  return o?.name ?? "—";
}

export default function JobList() {
  const staff = useStaff();
  const canEdit = JOB_EDIT_ROLES.includes(staff.role);
  const [rows, setRows] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"" | JobStatus>("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("job_openings")
      .select(
        "id, title, subject, quantity, province, status, is_published, deadline, created_at, schools(name)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as unknown as Job[]);
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
      return [r.title, r.subject, r.province, schoolName(r.schools)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [rows, q, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tin tuyển dụng</h1>
        {canEdit && (
          <Link
            href="/jobs/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Thêm tin tuyển dụng
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo vị trí, môn, trường, tỉnh..."
          className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | JobStatus)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {loaded ? `${shown.length} tin` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Vị trí</th>
              <th className="px-4 py-3">Trường</th>
              <th className="px-4 py-3">Số lượng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Trên website</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/jobs/${r.id}`} className="text-blue-700 hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs font-normal text-slate-500">
                    {[r.subject, r.province].filter(Boolean).join(" · ")}
                  </div>
                </td>
                <td className="px-4 py-3">{schoolName(r.schools)}</td>
                <td className="px-4 py-3">{r.quantity}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${JOB_STATUS_COLORS[r.status]}`}>
                    {JOB_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {isLiveOnWeb(r) ? (
                    <span className="font-medium text-emerald-700">● Đang hiển thị</span>
                  ) : (
                    <span className="text-slate-500">Không hiển thị</span>
                  )}
                </td>
              </tr>
            ))}
            {loaded && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có tin tuyển dụng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
