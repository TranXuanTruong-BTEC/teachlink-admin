"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ROLE_LABELS, StaffRole, TEACHER_VIEW_ROLES } from "@/lib/staff";

export type Staff = { id: string; full_name: string; role: StaffRole };

const StaffContext = createContext<Staff | null>(null);

export function useStaff() {
  const s = useContext(StaffContext);
  if (!s) throw new Error("useStaff phải dùng bên trong AdminShell");
  return s;
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }
    onDone();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Đăng nhập nhân viên</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
        <button
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "anon" | "notstaff" | "ok">(
    "loading"
  );
  const [staff, setStaff] = useState<Staff | null>(null);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setStaff(null);
      setState("anon");
      return;
    }
    const { data: sp } = await supabase
      .from("staff_profiles")
      .select("id, full_name, role, active")
      .eq("id", user.id)
      .maybeSingle();
    if (!sp || !sp.active) {
      setStaff(null);
      setState("notstaff");
      return;
    }
    setStaff({ id: sp.id, full_name: sp.full_name, role: sp.role as StaffRole });
    setState("ok");
  }, []);

  useEffect(() => {
    // Kiểm tra đăng nhập khi mở trang
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
  }, [check]);

  async function logout() {
    await supabase.auth.signOut();
    await check();
  }

  if (state === "loading") {
    return <p className="p-10 text-center text-slate-500">Đang tải...</p>;
  }
  if (state === "anon") return <LoginForm onDone={check} />;
  if (state === "notstaff" || !staff) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
          Tài khoản này không phải tài khoản nhân viên TeachLink.
        </p>
        <button
          onClick={logout}
          className="mt-4 text-sm text-blue-700 hover:underline"
        >
          Đăng xuất và đăng nhập tài khoản khác
        </button>
      </div>
    );
  }

  const canSeeTeachers = TEACHER_VIEW_ROLES.includes(staff.role);

  return (
    <StaffContext.Provider value={staff}>
      <div className="border-b border-slate-200 bg-slate-900 text-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav className="flex items-center gap-5 font-medium">
            <span className="font-bold text-white">
              Teach<span className="text-emerald-400">Link</span> Admin
            </span>
            <Link href="/" className="hover:text-white">
              Tổng quan
            </Link>
            {canSeeTeachers && (
              <Link href="/teachers" className="hover:text-white">
                Hồ sơ giáo viên
              </Link>
            )}
            <Link href="/schools" className="hover:text-white">
              Nhà trường
            </Link>
            <Link href="/jobs" className="hover:text-white">
              Tin tuyển dụng
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span>
              {staff.full_name} · {ROLE_LABELS[staff.role]}
            </span>
            <button onClick={logout} className="text-slate-300 hover:text-red-300">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </StaffContext.Provider>
  );
}
