"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  REFERRAL_COLORS,
  REFERRAL_EDIT_ROLES,
  REFERRAL_LABELS,
  REFERRAL_VIEW_ROLES,
  ReferralStatus,
  one,
} from "@/lib/staff";

type Ref = {
  id: string;
  status: ReferralStatus;
  job_opening_id: string;
  job_openings: { title: string; schools: { name: string } | { name: string }[] | null } | { title: string; schools: { name: string } | { name: string }[] | null }[] | null;
};

type OpenJob = {
  id: string;
  title: string;
  schools: { name: string } | { name: string }[] | null;
};

export default function TeacherReferrals({ teacherId }: { teacherId: string }) {
  const staff = useStaff();
  const canView = REFERRAL_VIEW_ROLES.includes(staff.role);
  const canEdit = REFERRAL_EDIT_ROLES.includes(staff.role);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [jobId, setJobId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data: r, error: e1 } = await supabase
      .from("referrals")
      .select("id, status, job_opening_id, job_openings(title, schools(name))")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setRefs((r ?? []) as unknown as Ref[]);

    const { data: j, error: e2 } = await supabase
      .from("job_openings")
      .select("id, title, schools(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setJobs((j ?? []) as unknown as OpenJob[]);
    setLoadErr(e1?.message ?? e2?.message ?? "");
    setLoaded(true);
  }, [teacherId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (!canView) return null;

  const referred = new Set(refs.map((r) => r.job_opening_id));
  const available = jobs.filter((j) => !referred.has(j.id));

  async function add() {
    if (!jobId) {
      setMsg({ type: "err", text: "Vui lòng chọn một tin tuyển dụng." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase
      .from("referrals")
      .insert({ teacher_id: teacherId, job_opening_id: jobId });
    setBusy(false);
    if (error) {
      setMsg({
        type: "err",
        text: error.message.includes("duplicate")
          ? "Giáo viên này đã được giới thiệu vào tin này rồi."
          : "Không thêm được: " + error.message,
      });
      return;
    }
    setJobId("");
    setMsg({ type: "ok", text: "Đã thêm vào danh sách giới thiệu." });
    await load();
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Giới thiệu đến nhà trường</h2>

      {loadErr && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Không tải được dữ liệu giới thiệu: {loadErr}
        </p>
      )}
      {!loaded && <p className="mt-2 text-sm text-slate-500">Đang tải...</p>}

      {loaded && refs.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Hồ sơ này chưa được giới thiệu vào tin tuyển dụng nào.
        </p>
      ) : loaded ? (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {refs.map((r) => {
            const job = one(r.job_openings);
            const school = one(job?.schools);
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{job?.title ?? "—"}</p>
                  <p className="text-xs text-slate-500">{school?.name ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${REFERRAL_COLORS[r.status]}`}>
                    {REFERRAL_LABELS[r.status]}
                  </span>
                  <Link href={`/referrals/${r.id}`} className="text-blue-700 hover:underline">
                    Cập nhật
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={busy}
            className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Chọn tin tuyển dụng để giới thiệu —</option>
            {available.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} — {one(j.schools)?.name ?? "?"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Đang thêm..." : "Giới thiệu"}
          </button>
        </div>
      )}
      {canEdit && loaded && available.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Không còn tin “Đang tuyển” nào để giới thiệu thêm.
        </p>
      )}

      {msg && (
        <p
          className={`mt-3 rounded-lg p-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}
