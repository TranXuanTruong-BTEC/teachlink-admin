"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import { LEVEL_OPTIONS, SCHOOL_EDIT_ROLES } from "@/lib/staff";

type Form = {
  name: string;
  level: string;
  province: string;
  district: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  note: string;
};

const EMPTY: Form = {
  name: "",
  level: "tieu_hoc",
  province: "",
  district: "",
  address: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  note: "",
};

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100";

// id không có: thêm mới. Có id: xem/sửa.
export default function SchoolForm({ id }: { id?: string }) {
  const staff = useStaff();
  const router = useRouter();
  const canEdit = SCHOOL_EDIT_ROLES.includes(staff.role);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loaded, setLoaded] = useState(!id);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("schools").select("*").eq("id", id).maybeSingle();
    if (!data) {
      setNotFound(true);
      return;
    }
    setForm({
      name: data.name ?? "",
      level: data.level ?? "khac",
      province: data.province ?? "",
      district: data.district ?? "",
      address: data.address ?? "",
      contact_name: data.contact_name ?? "",
      contact_phone: data.contact_phone ?? "",
      contact_email: data.contact_email ?? "",
      note: data.note ?? "",
    });
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Vui lòng nhập tên trường." });
      return;
    }
    const payload = {
      name: form.name.trim(),
      level: form.level,
      province: form.province.trim() || null,
      district: form.district.trim() || null,
      address: form.address.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      note: form.note.trim() || null,
    };
    setSaving(true);
    const { error } = id
      ? await supabase.from("schools").update(payload).eq("id", id)
      : await supabase.from("schools").insert(payload);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Không lưu được: " + error.message });
      return;
    }
    if (id) {
      setMsg({ type: "ok", text: "Đã lưu thông tin nhà trường." });
    } else {
      router.push("/schools");
    }
  }

  if (notFound) return <p className="text-slate-600">Không tìm thấy nhà trường.</p>;
  if (!loaded) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="max-w-3xl">
      <Link href="/schools" className="text-sm text-blue-700 hover:underline">
        ← Danh sách nhà trường
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {id ? "Thông tin nhà trường" : "Thêm nhà trường"}
      </h1>

      {!canEdit && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Phòng ban của bạn chỉ được xem, không sửa được thông tin nhà trường.
        </p>
      )}

      <form onSubmit={save} className="mt-4">
        <fieldset
          disabled={!canEdit || saving}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="block text-sm sm:col-span-2">
            Tên trường *
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="block text-sm">
            Cấp học
            <select className={inputCls} value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Tỉnh/thành
            <input className={inputCls} value={form.province} onChange={(e) => set("province", e.target.value)} />
          </label>
          <label className="block text-sm">
            Quận/huyện
            <input className={inputCls} value={form.district} onChange={(e) => set("district", e.target.value)} />
          </label>
          <label className="block text-sm">
            Địa chỉ
            <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </label>
          <label className="block text-sm">
            Người liên hệ
            <input className={inputCls} value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </label>
          <label className="block text-sm">
            Số điện thoại liên hệ
            <input className={inputCls} value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Email liên hệ
            <input className={inputCls} type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Ghi chú nội bộ
            <textarea className={inputCls} rows={4} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Đang lưu..." : id ? "Lưu thay đổi" : "Thêm nhà trường"}
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
