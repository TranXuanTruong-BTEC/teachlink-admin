"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  REFERRAL_EDIT_ROLES,
  REFERRAL_LABELS,
  REFERRAL_ORDER,
  REFERRAL_VIEW_ROLES,
  ReferralStatus,
  one,
} from "@/lib/staff";

type Detail = {
  id: string;
  status: ReferralStatus;
  sent_at: string | null;
  interview_at: string | null;
  result_note: string | null;
  teachers: { id: string; full_name: string; phone: string | null; email: string | null } | { id: string; full_name: string; phone: string | null; email: string | null }[] | null;
  job_openings:
    | {
        id: string;
        title: string;
        schools:
          | { id: string; name: string; contact_name: string | null; contact_phone: string | null }
          | { id: string; name: string; contact_name: string | null; contact_phone: string | null }[]
          | null;
      }
    | {
        id: string;
        title: string;
        schools:
          | { id: string; name: string; contact_name: string | null; contact_phone: string | null }
          | { id: string; name: string; contact_name: string | null; contact_phone: string | null }[]
          | null;
      }[]
    | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100";

export default function ReferralDetail({ id }: { id: string }) {
  const staff = useStaff();
  const canView = REFERRAL_VIEW_ROLES.includes(staff.role);
  const canEdit = REFERRAL_EDIT_ROLES.includes(staff.role);
  const [d, setD] = useState<Detail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [status, setStatus] = useState<ReferralStatus>("proposed");
  const [interviewAt, setInterviewAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("referrals")
      .select(
        "id, status, sent_at, interview_at, result_note, teachers(id, full_name, phone, email), job_openings(id, title, schools(id, name, contact_name, contact_phone))"
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
    setStatus(x.status);
    setInterviewAt(toLocalInput(x.interview_at));
    setNote(x.result_note ?? "");
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function save() {
    if (!d) return;
    setSaving(true);
    setMsg(null);
    const payload: Record<string, unknown> = {
      status,
      interview_at: interviewAt ? new Date(interviewAt).toISOString() : null,
      result_note: note.trim() || null,
    };
    if (status === "sent" && !d.sent_at) payload.sent_at = new Date().toISOString();
    const { error } = await supabase.from("referrals").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Không lưu được: " + error.message });
      return;
    }
    setMsg({ type: "ok", text: "Đã lưu." });
    await load();
  }

  if (!canView) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Phòng ban của bạn không có quyền xem lượt giới thiệu.
      </p>
    );
  }
  if (loadErr)
    return (
      <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Không tải được lượt giới thiệu: {loadErr}
      </p>
    );
  if (notFound) return <p className="text-slate-600">Không tìm thấy lượt giới thiệu.</p>;
  if (!d) return <p className="text-slate-500">Đang tải...</p>;

  const t = one(d.teachers);
  const job = one(d.job_openings);
  const school = one(job?.schools);

  return (
    <div className="max-w-3xl">
      <Link href="/referrals" className="text-sm text-blue-700 hover:underline">
        ← Danh sách giới thiệu
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Lượt giới thiệu</h1>

      <section className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-slate-500">Giáo viên</p>
          {t ? (
            <>
              <Link href={`/teachers/${t.id}`} className="font-medium text-blue-700 hover:underline">
                {t.full_name}
              </Link>
              <p className="text-sm text-slate-600">{t.phone}</p>
              <p className="text-sm text-slate-600">{t.email}</p>
            </>
          ) : (
            <p>—</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Vị trí và nhà trường</p>
          <p className="font-medium">{job?.title ?? "—"}</p>
          {school && (
            <>
              <Link href={`/schools/${school.id}`} className="text-sm text-blue-700 hover:underline">
                {school.name}
              </Link>
              <p className="text-sm text-slate-600">
                {[school.contact_name, school.contact_phone].filter(Boolean).join(" · ")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Tiến độ</h2>
        <fieldset disabled={!canEdit || saving} className="mt-3 space-y-4">
          <label className="block text-sm">
            Trạng thái
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as ReferralStatus)}
            >
              {REFERRAL_ORDER.map((s) => (
                <option key={s} value={s}>
                  {REFERRAL_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Lịch phỏng vấn
            <input
              type="datetime-local"
              className={inputCls}
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Ghi chú kết quả (nội bộ)
            <textarea
              rows={4}
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Khi đổi sang “Đã gửi hồ sơ”, “Trường mời phỏng vấn” hoặc “Đã nhận việc”, trạng
            thái hồ sơ giáo viên tự cập nhật theo. “Trường không nhận” chỉ là thông tin
            nội bộ, giáo viên không nhìn thấy.
          </p>
          {d.sent_at && (
            <p className="text-xs text-slate-500">
              Đã gửi hồ sơ cho trường lúc {new Date(d.sent_at).toLocaleString("vi-VN")}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </fieldset>
        {!canEdit && (
          <p className="mt-3 text-xs text-slate-500">
            Phòng ban của bạn chỉ được xem, không sửa được tiến độ.
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
    </div>
  );
}
