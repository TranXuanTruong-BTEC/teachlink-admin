"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/components/AdminShell";
import { ROLE_LABELS, ROLE_ORDER, STAFF_ADMIN_ROLES, StaffRole } from "@/lib/staff";

type Member = {
  id: string;
  full_name: string;
  role: StaffRole;
  active: boolean;
  email: string | null;
  created_at: string;
};

type Edit = Partial<Pick<Member, "full_name" | "role" | "active">>;

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100";

export default function StaffManager() {
  const me = useStaff();
  const allowed = STAFF_ADMIN_ROLES.includes(me.role);
  const isDirector = me.role === "director";

  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("recruitment");
  const [adding, setAdding] = useState(false);

  // IT không được cấp quyền giám đốc
  const roleChoices = ROLE_ORDER.filter((r) => isDirector || r !== "director");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_staff");
    setMembers((data ?? []) as Member[]);
    setLoadErr(error?.message ?? "");
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, allowed]);

  function edit(id: string, patch: Edit) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  }

  async function saveRow(m: Member) {
    const e = edits[m.id];
    if (!e) return;
    if (e.full_name !== undefined && !e.full_name.trim()) {
      setMsg({ type: "err", text: "Họ tên không được để trống." });
      return;
    }
    setBusyId(m.id);
    setMsg(null);
    const payload: Edit = { ...e };
    if (payload.full_name !== undefined) payload.full_name = payload.full_name.trim();
    const { error } = await supabase.from("staff_profiles").update(payload).eq("id", m.id);
    setBusyId("");
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setEdits((all) => {
      const copy = { ...all };
      delete copy[m.id];
      return copy;
    });
    setMsg({ type: "ok", text: `Đã lưu thay đổi cho ${payload.full_name ?? m.full_name}.` });
    await load();
  }

  async function addMember(ev: React.FormEvent) {
    ev.preventDefault();
    setMsg(null);
    if (!email.trim() || !fullName.trim()) {
      setMsg({ type: "err", text: "Vui lòng nhập email và họ tên." });
      return;
    }
    setAdding(true);
    const { error } = await supabase.rpc("add_staff_by_email", {
      p_email: email.trim(),
      p_full_name: fullName.trim(),
      p_role: role,
    });
    setAdding(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: `Đã thêm ${fullName.trim()} vào danh sách nhân viên.` });
    setEmail("");
    setFullName("");
    await load();
  }

  if (!allowed) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Chỉ Ban giám đốc và IT được quản lý tài khoản nhân viên.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Nhân viên</h1>

      {msg && (
        <p
          className={`mt-4 rounded-lg p-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Thêm nhân viên</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>
            Vào Supabase, mục <b>Authentication, Users, Add user</b>, tạo tài khoản bằng email và
            mật khẩu cho nhân viên (tick “Auto Confirm User”).
          </li>
          <li>Nhập đúng email đó vào form dưới đây, chọn phòng ban rồi bấm Thêm.</li>
        </ol>
        <form onSubmit={addMember} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            type="email"
            placeholder="Email đăng nhập"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={adding}
            className={inputCls}
          />
          <input
            placeholder="Họ tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={adding}
            className={inputCls}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            disabled={adding}
            className={inputCls}
          >
            {roleChoices.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            disabled={adding}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {adding ? "Đang thêm..." : "Thêm nhân viên"}
          </button>
        </form>
      </section>

      {loadErr && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Không tải được danh sách nhân viên: {loadErr}
          {loadErr.toLowerCase().includes("list_staff") &&
            " (Có thể bạn chưa chạy file 0002_staff_admin.sql trong Supabase.)"}
        </p>
      )}
      <p className="mt-5 text-sm text-slate-500">
        {loaded ? `${members.length} nhân viên` : "Đang tải..."}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phòng ban</th>
              <th className="px-4 py-3">Hoạt động</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const e = edits[m.id] ?? {};
              const isMe = m.id === me.id;
              // IT không được đụng vào tài khoản giám đốc
              const locked = !isDirector && m.role === "director";
              const dirty = Object.keys(e).length > 0;
              const curRole = e.role ?? m.role;
              const curActive = e.active ?? m.active;
              return (
                <tr key={m.id} className="border-t border-slate-100 align-middle">
                  <td className="px-4 py-3">
                    <input
                      value={e.full_name ?? m.full_name}
                      onChange={(ev) => edit(m.id, { full_name: ev.target.value })}
                      disabled={locked || busyId === m.id}
                      className={inputCls}
                    />
                    {isMe && <span className="text-xs text-blue-700">Tài khoản của bạn</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={curRole}
                      onChange={(ev) => edit(m.id, { role: ev.target.value as StaffRole })}
                      disabled={isMe || locked || busyId === m.id}
                      className={inputCls}
                    >
                      {ROLE_ORDER.filter((r) => isDirector || r !== "director" || r === m.role).map(
                        (r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={curActive}
                        onChange={(ev) => edit(m.id, { active: ev.target.checked })}
                        disabled={isMe || locked || busyId === m.id}
                      />
                      {curActive ? "Đang hoạt động" : "Đã khóa"}
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    {dirty && (
                      <button
                        onClick={() => saveRow(m)}
                        disabled={busyId === m.id}
                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {busyId === m.id ? "Đang lưu..." : "Lưu"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Nhân viên bị khóa không còn vào được trang quản lý. Bạn không tự đổi được phòng ban
        hay khóa tài khoản của chính mình. Chỉ Ban giám đốc được cấp hoặc thu hồi quyền giám
        đốc, và hệ thống luôn giữ lại ít nhất một giám đốc đang hoạt động.
      </p>
    </div>
  );
}
