"use client";

import { useCallback, useEffect, useState } from "react";
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

type Notif = {
  id: string;
  title: string;
  teacher_id: string | null;
  created_at: string;
};

export default function Dashboard() {
  const staff = useStaff();
  const canSeeTeachers = TEACHER_VIEW_ROLES.includes(staff.role);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const load = useCallback(async () => {
    if (canSeeTeachers) {
      const { data } = await supabase.from("teacher_internal").select("status");
      const c: Record<string, number> = {};
      (data ?? []).forEach((r: { status: string }) => {
        c[r.status] = (c[r.status] ?? 0) + 1;
      });
      setCounts(c);
    }
    const { data: n } = await supabase
      .from("notifications")
      .select("id, title, teacher_id, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifs((n ?? []) as Notif[]);
  }, [canSeeTeachers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((list) => list.filter((n) => n.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Xin chào, {staff.full_name}</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Thông báo mới</h2>
        {notifs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Không có thông báo mới.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notifs.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex gap-3">
                  {n.teacher_id && canSeeTeachers && (
                    <Link
                      href={`/teachers/${n.teacher_id}`}
                      onClick={() => markRead(n.id)}
                      className="text-blue-700 hover:underline"
                    >
                      Mở hồ sơ
                    </Link>
                  )}
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-slate-500 hover:underline"
                  >
                    Đã đọc
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canSeeTeachers ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Hồ sơ giáo viên theo trạng thái</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTERNAL_ORDER.map((s: InternalStatus) => (
              <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
                <span className={`rounded-full px-3 py-1 text-xs ${INTERNAL_COLORS[s]}`}>
                  {INTERNAL_LABELS[s]}
                </span>
                <p className="mt-3 text-3xl font-bold">{counts[s] ?? 0}</p>
              </div>
            ))}
          </div>
          <Link
            href="/teachers"
            className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
          >
            Xem danh sách hồ sơ →
          </Link>
        </section>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Phòng ban của bạn không xem hồ sơ giáo viên. Bạn có thể quản lý và đăng
          tin ở mục{" "}
          <Link href="/jobs" className="font-medium text-blue-700 hover:underline">
            Tin tuyển dụng
          </Link>
          .
        </p>
      )}
    </div>
  );
}
