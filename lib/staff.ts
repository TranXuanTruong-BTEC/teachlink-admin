export type StaffRole =
  | "marketing"
  | "recruitment"
  | "sales"
  | "coordination"
  | "accounting"
  | "director"
  | "it";

export const ROLE_LABELS: Record<StaffRole, string> = {
  marketing: "Tiếp thị & nội dung",
  recruitment: "Tuyển dụng",
  sales: "Kinh doanh",
  coordination: "Điều phối",
  accounting: "Kế toán",
  director: "Ban giám đốc",
  it: "IT",
};

// Phòng ban được xem hồ sơ giáo viên (Marketing không được xem)
export const TEACHER_VIEW_ROLES: StaffRole[] = [
  "recruitment",
  "coordination",
  "sales",
  "accounting",
  "director",
  "it",
];

// Phòng ban được sửa trạng thái hồ sơ
export const TEACHER_EDIT_ROLES: StaffRole[] = [
  "recruitment",
  "coordination",
  "director",
  "it",
];

export type InternalStatus =
  | "draft"
  | "submitted"
  | "screening"
  | "need_more_info"
  | "approved"
  | "referred"
  | "interview"
  | "placed"
  | "rejected_by_school"
  | "not_suitable";

export const INTERNAL_LABELS: Record<InternalStatus, string> = {
  draft: "Nháp (chưa nộp)",
  submitted: "Mới nộp",
  screening: "Đang kiểm tra",
  need_more_info: "Cần bổ sung",
  approved: "Đã duyệt – sẵn sàng giới thiệu",
  referred: "Đã giới thiệu cho trường",
  interview: "Trường mời phỏng vấn",
  placed: "Đã được nhận",
  rejected_by_school: "Trường không nhận",
  not_suitable: "Chưa phù hợp",
};

export const INTERNAL_COLORS: Record<InternalStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-800",
  screening: "bg-amber-100 text-amber-800",
  need_more_info: "bg-orange-100 text-orange-800",
  approved: "bg-emerald-100 text-emerald-800",
  referred: "bg-teal-100 text-teal-800",
  interview: "bg-purple-100 text-purple-800",
  placed: "bg-green-200 text-green-900",
  rejected_by_school: "bg-rose-100 text-rose-800",
  not_suitable: "bg-slate-200 text-slate-700",
};

export const INTERNAL_ORDER = Object.keys(INTERNAL_LABELS) as InternalStatus[];

export const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "mam_non", label: "Mầm non" },
  { value: "tieu_hoc", label: "Tiểu học" },
  { value: "thcs", label: "THCS" },
  { value: "thpt", label: "THPT" },
  { value: "trung_tam", label: "Trung tâm" },
  { value: "khac", label: "Khác" },
];

// Phòng ban được thêm/sửa thông tin nhà trường
export const SCHOOL_EDIT_ROLES: StaffRole[] = [
  "sales",
  "coordination",
  "director",
  "it",
];

// Phòng ban được thêm/sửa tin tuyển dụng (Marketing được đăng tin)
export const JOB_EDIT_ROLES: StaffRole[] = [
  "marketing",
  "sales",
  "coordination",
  "director",
  "it",
];

export type JobStatus = "draft" | "open" | "closed" | "filled";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Nháp",
  open: "Đang tuyển",
  closed: "Đã đóng",
  filled: "Đã đủ người",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  open: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
  filled: "bg-blue-100 text-blue-800",
};

// Tin có hiện trên website công khai không?
export function isLiveOnWeb(j: {
  is_published: boolean;
  status: string;
  deadline: string | null;
}) {
  if (!j.is_published || j.status !== "open") return false;
  if (!j.deadline) return true;
  const today = new Date().toISOString().slice(0, 10);
  return j.deadline >= today;
}

// ---- Giới thiệu giáo viên cho nhà trường
export const REFERRAL_VIEW_ROLES: StaffRole[] = [
  "recruitment",
  "coordination",
  "sales",
  "accounting",
  "director",
  "it",
];

export const REFERRAL_EDIT_ROLES: StaffRole[] = [
  "recruitment",
  "coordination",
  "director",
  "it",
];

export type ReferralStatus =
  | "proposed"
  | "sent"
  | "interview"
  | "offered"
  | "accepted"
  | "rejected"
  | "withdrawn";

export const REFERRAL_LABELS: Record<ReferralStatus, string> = {
  proposed: "Đề xuất (chưa gửi)",
  sent: "Đã gửi hồ sơ cho trường",
  interview: "Trường mời phỏng vấn",
  offered: "Trường đề nghị nhận",
  accepted: "Đã nhận việc",
  rejected: "Trường không nhận",
  withdrawn: "Giáo viên rút lui",
};

export const REFERRAL_COLORS: Record<ReferralStatus, string> = {
  proposed: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-800",
  interview: "bg-purple-100 text-purple-800",
  offered: "bg-amber-100 text-amber-800",
  accepted: "bg-green-200 text-green-900",
  rejected: "bg-rose-100 text-rose-800",
  withdrawn: "bg-slate-200 text-slate-700",
};

export const REFERRAL_ORDER = Object.keys(REFERRAL_LABELS) as ReferralStatus[];

// Supabase có thể trả về 1 đối tượng hoặc mảng 1 phần tử cho quan hệ nhiều-1
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

// ---- Phí môi giới (chỉ Kinh doanh, Kế toán, Ban giám đốc)
export const FEE_ROLES: StaffRole[] = ["sales", "accounting", "director"];

export type FeeStatus = "pending" | "invoiced" | "paid" | "cancelled";

export const FEE_LABELS: Record<FeeStatus, string> = {
  pending: "Chờ xuất hóa đơn",
  invoiced: "Đã xuất hóa đơn",
  paid: "Đã thu tiền",
  cancelled: "Đã hủy",
};

export const FEE_COLORS: Record<FeeStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  invoiced: "bg-blue-100 text-blue-800",
  paid: "bg-green-200 text-green-900",
  cancelled: "bg-slate-200 text-slate-700",
};

export const FEE_ORDER = Object.keys(FEE_LABELS) as FeeStatus[];

export function formatVnd(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("vi-VN")} ₫`;
}

// ---- Quản lý tài khoản nhân viên (Ban giám đốc và IT)
export const STAFF_ADMIN_ROLES: StaffRole[] = ["director", "it"];

export const ROLE_ORDER = Object.keys(ROLE_LABELS) as StaffRole[];
