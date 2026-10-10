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
