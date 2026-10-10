import TeacherList from "@/components/TeacherList";

// Trang nội bộ cần đăng nhập nên không cần kiểm tra "điều hướng tức thì".
export const instant = false;

export default function Page() {
  return <TeacherList />;
}
