"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  INTERNAL_LABELS,
  INTERNAL_ORDER,
  InternalStatus,
  LEVEL_OPTIONS,
  TEACHER_EDIT_ROLES,
  TEACHER_VIEW_ROLES,
} from "@/lib/staff";

type Internal = {
  status: InternalStatus;
  assigned_to: string | null;
  internal_note: string | null;
};

type Teacher = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  province: string | null;
  education_level: string | null;
  university: string | null;
  subjects: string[];
  teaching_levels: string[];
  experience_years: number | null;
  desired_province: string | null;
  expected_salary: number | null;
  bio: string | null;
  cv_path: string | null;
  created_at: string;
  teacher_internal: Internal | Internal[] | null;
};

const GENDER: Record<string, string> = { female: "Nữ", male: "Nam", other: "Khác" };

export default function TeacherDetail({ id }: { id: string }) {
  const staff = useStaff();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cvUrl, setCvUrl] = useState("");
  const [status, setStatus] = useState<InternalStatus>("submitted");
  const [note, setNote] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const canEdit = TEACHER_EDIT_ROLES.includes(staff.role);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select("*, teacher_internal(status, assigned_to, internal_note)")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      setNotFound(true);
      return;
    }
    const t = data as unknown as Teacher;
    setTeacher(t);
    const raw = t.teacher_internal;
    const it = Array.isArray(raw) ? raw[0] : raw;
    if (it) {
      setStatus(it.status);
      setNote(it.internal_note ?? "");
      setAssignedTo(it.assigned_to);
    }
    if (t.cv_path) {
      const { data: signed } = await supabase.storage
        .from("cv")
        .createSignedUrl(t.cv_path, 3600);
      setCvUrl(signed?.signedUrl ?? "");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function save(extra: Partial<Internal> = {}) {
    setSaving(true);
    setMsg(null);
    const payload = {
      status,
      internal_note: note.trim() || null,
      assigned_to: assignedTo,
      ...extra,
    };
    const { error } = await supabase
      .from("teacher_internal")
      .update(payload)
      .eq("teacher_id", id);
    if (error) {
      setMsg({ type: "err", text: "Không lưu được: " + error.message });
    } else {
      setMsg({ type: "ok", text: "Đã lưu. Giáo viên sẽ thấy trạng thái mới trên website." });
      if (extra.assigned_to !== undefined) setAssignedTo(extra.assigned_to);
    }
    setSaving(false);
  }

  if (!TEACHER_VIEW_ROLES.includes(staff.role)) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Phòng ban của bạn không có quyền xem hồ sơ giáo viên.
      </p>
    );
  }
  if (notFound) {
    return <p className="text-slate-600">Không tìm thấy hồ sơ.</p>;
  }
  if (!teacher) return <p className="text-slate-500">Đang tải...</p>;

  const levels = (teacher.teaching_levels ?? [])
    .map((v) => LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  const info: [string, string | null][] = [
    ["Số điện thoại", teacher.phone],
    ["Email", teacher.email],
    ["Ngày sinh", teacher.date_of_birth ? new Date(teacher.date_of_birth).toLocaleDateString("vi-VN") : null],
    ["Giới tính", teacher.gender ? GENDER[teacher.gender] ?? teacher.gender : null],
    ["Tỉnh/thành đang ở", teacher.province],
    ["Trình độ", teacher.education_level],
    ["Trường tốt nghiệp", teacher.university],
    ["Môn dạy", (teacher.subjects ?? []).join(", ") || null],
    ["Cấp học", levels || null],
    ["Kinh nghiệm", teacher.experience_years != null ? `${teacher.experience_years} năm` : null],
    ["Nơi muốn làm việc", teacher.desired_province],
    [
      "Lương mong muốn",
      teacher.expected_salary
        ? `${(teacher.expected_salary / 1_000_000).toLocaleString("vi-VN")} triệu/tháng`
        : null,
    ],
  ];

  const assignText =
    assignedTo === null
      ? "Chưa có người nhận xử lý"
      : assignedTo === staff.id
      ? "Bạn đang xử lý hồ sơ này"
      : "Đã có nhân viên khác nhận xử lý";

  return (
    <div>
      <Link href="/teachers" className="text-sm text-blue-700 hover:underline">
        ← Danh sách hồ sơ
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{teacher.full_name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Thông tin giáo viên</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {info
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase text-slate-500">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </div>
              ))}
          </dl>
          {teacher.bio && (
            <div className="mt-4">
              <p className="text-xs uppercase text-slate-500">Giới thiệu bản thân</p>
              <p className="mt-1 whitespace-pre-line text-sm">{teacher.bio}</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs uppercase text-slate-500">CV</p>
            {teacher.cv_path ? (
              cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  📎 Mở / tải CV
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Không tạo được liên kết CV (có thể phòng ban của bạn không có quyền xem CV).
                </p>
              )
            ) : (
              <p className="mt-1 text-sm text-slate-500">Giáo viên chưa tải CV.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Xử lý hồ sơ (nội bộ)</h2>
          <fieldset disabled={!canEdit || saving} className="mt-3 space-y-4">
            <label className="block text-sm">
              Trạng thái
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InternalStatus)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
              >
                {INTERNAL_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {INTERNAL_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            {status === "approved" && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Giáo viên sẽ thấy “Đã duyệt – sẵn sàng giới thiệu”. Đây chưa phải
                kết quả trúng tuyển.
              </p>
            )}
            <label className="block text-sm">
              Ghi chú nội bộ (giáo viên không thấy)
              <textarea
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
              />
            </label>
            <div className="text-sm">
              <p className="text-slate-600">{assignText}</p>
              {assignedTo !== staff.id && (
                <button
                  type="button"
                  onClick={() => save({ assigned_to: staff.id })}
                  className="mt-1 text-blue-700 hover:underline"
                >
                  Nhận xử lý hồ sơ này
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => save()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </fieldset>
          {!canEdit && (
            <p className="mt-3 text-xs text-slate-500">
              Phòng ban của bạn chỉ được xem, không sửa được trạng thái.
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
    </div>
  );
}
