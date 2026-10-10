import StaffManager from "@/components/StaffManager";

// Trang nội bộ cần đăng nhập nên không cần kiểm tra "điều hướng tức thì".
export const instant = false;

export default function Page() {
  return <StaffManager />;
}
