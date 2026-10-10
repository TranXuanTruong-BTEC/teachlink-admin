"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import {
  JOB_EDIT_ROLES,
  JOB_STATUS_LABELS,
  JobStatus,
  LEVEL_OPTIONS,
  isLiveOnWeb,
} from "@/lib/staff";

type Form = {
  school_id: string;
  title: string;
  subject: string;
  level: string;
  quantity: string;
  province: string;
  salary_min: string; // triệu đồng
  salary_max: string; // triệu đồng
  requirements: string;
  description: string;
  deadline: string;
  status: JobStatus;
  is_published: boolean;
};

const EMPTY: Form = {
  school_id: "",
  title: "",
  subject: "",
  level: "",
  quantity: "1",
  province: "",
  salary_min: "",
  salary_max: "",
  requirements: "",
  description: "",
  deadline: "",
  status: "draft",
  is_published: false,
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100";

const toMillion = (n: number | null) => (n ? String(n / 1_000_000) : "");
const fromMillion = (s: string) => (s ? Math.round(Number(s) * 1_000_000) : null);

// id không có: thêm mới. Có id: xem/sửa.
export default function JobForm({ id }: { id?: string }) {
  const staff = useStaff();
  const router = useRouter();
  const canEdit = JOB_EDIT_ROLES.includes(staff.role);
  const [form, setForm] = useState<Form>(EMPTY);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data: sc } = await supabase
      .from("schools")
      .select("id, name")
      .order("name");
    setSchools((sc ?? []) as { id: string; name: string }[]);

    if (id) {
      const { data } = await supabase
        .from("job_openings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
        return;
      }
      setForm({
        school_id: data.school_id ?? "",
        title: data.title ?? "",
        subject: data.subject ?? "",
        level: data.level ?? "",
        quantity: String(data.quantity ?? 1),
        province: data.province ?? "",
        salary_min: toMillion(data.salary_min),
        salary_max: toMillion(data.salary_max),
        requirements: data.requirements ?? "",
        description: data.description ?? "",
        deadline: data.deadline ?? "",
        status: data.status as JobStatus,
        is_published: !!data.is_published,
      });
    }
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.school_id) {
      setMsg({ type: "err", text: "Vui lòng chọn nhà trường." });
      return;
    }
    if (!form.title.trim()) {
      setMsg({ type: "err", text: "Vui lòng nhập tên vị trí." });
      return;
    }
    const qty = Number(form.quantity);
    if (!qty || qty < 1) {
      setMsg({ type: "err", text: "Số lượng cần tuyển phải từ 1 trở lên." });
      return;
    }
    const smin = fromMillion(form.salary_min);
    const smax = fromMillion(form.salary_max);
    if (smin && smax && smax < smin) {
      setMsg({ type: "err", text: "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu." });
      return;
    }
    const payload = {
      school_id: form.school_id,
      title: form.title.trim(),
      subject: form.subject.trim() || null,
      level: form.level || null,
      quantity: qty,
      province: form.province.trim() || null,
      salary_min: smin,
      salary_max: smax,
      requirements: form.requirements.trim() || null,
      description: form.description.trim() || null,
      deadline: form.deadline || null,
      status: form.status,
      is_published: form.is_published,
    };
    setSaving(true);
    const { error } = id
      ? await supabase.from("job_openings").update(payload).eq("id", id)
      : await supabase.from("job_openings").insert(payload);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Không lưu được: " + error.message });
      return;
    }
    if (id) {
      setMsg({ type: "ok", text: "Đã lưu tin tuyển dụng." });
    } else {
      router.push("/jobs");
    }
  }

  if (notFound) return <p className="text-slate-600">Không tìm thấy tin tuyển dụng.</p>;
  if (!loaded) return <p className="text-slate-500">Đang tải...</p>;

  const live = isLiveOnWeb({
    is_published: form.is_published,
    status: form.status,
    deadline: form.deadline || null,
  });

  return (
    <div className="max-w-3xl">
      <Link href="/jobs" className="text-sm text-blue-700 hover:underline">
        ← Danh sách tin tuyển dụng
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {id ? "Sửa tin tuyển dụng" : "Thêm tin tuyển dụng"}
      </h1>

      {!canEdit && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Phòng ban của bạn chỉ được xem, không sửa được tin tuyển dụng.
        </p>
      )}
      {schools.length === 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Chưa có nhà trường nào. Hãy thêm nhà trường ở mục “Nhà trường” trước.
        </p>
      )}

      <form onSubmit={save} className="mt-4">
        <fieldset
          disabled={!canEdit || saving}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="block text-sm sm:col-span-2">
            Nhà trường *
            <select className={inputCls} value={form.school_id} onChange={(e) => set("school_id", e.target.value)}>
              <option value="">— Chọn nhà trường —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            Tên vị trí * (hiển thị trên website)
            <input className={inputCls} placeholder="Giáo viên Toán lớp 4" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block text-sm">
            Môn dạy
            <input className={inputCls} value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          </label>
          <label className="block text-sm">
            Cấp học
            <select className={inputCls} value={form.level} onChange={(e) => set("level", e.target.value)}>
              <option value="">—</option>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Số lượng cần tuyển
            <input className={inputCls} type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </label>
          <label className="block text-sm">
            Địa điểm (tỉnh/thành)
            <input className={inputCls} value={form.province} onChange={(e) => set("province", e.target.value)} />
          </label>
          <label className="block text-sm">
            Lương tối thiểu (triệu/tháng)
            <input className={inputCls} type="number" min={0} step="0.5" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} />
          </label>
          <label className="block text-sm">
            Lương tối đa (triệu/tháng)
            <input className={inputCls} type="number" min={0} step="0.5" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Yêu cầu
            <textarea className={inputCls} rows={3} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Mô tả công việc
            <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="block text-sm">
            Hạn nộp hồ sơ
            <input className={inputCls} type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </label>
          <label className="block text-sm">
            Trạng thái tuyển
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as JobStatus)}>
              {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-slate-50 p-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
              />
              Đăng lên website cho giáo viên xem
            </label>
            <p className={`mt-2 ${live ? "text-emerald-700" : "text-slate-600"}`}>
              {live
                ? "● Với cài đặt hiện tại, tin sẽ hiển thị trên website."
                : "Tin chỉ hiển thị trên website khi đã tick đăng, trạng thái là “Đang tuyển” và chưa quá hạn nộp hồ sơ. Tên trường và thông tin liên hệ không bao giờ hiển thị công khai."}
            </p>
          </div>

          <div className="sm:col-span-2">
            <button className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Đang lưu..." : id ? "Lưu thay đổi" : "Thêm tin tuyển dụng"}
            </button>
          </div>
        </fieldset>
      </form>

      {msg && (
        <p
          className={`mt-4 rounded-lg p-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
