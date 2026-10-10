import { Suspense } from "react";
import TeacherDetail from "@/components/TeacherDetail";

// Trang nội bộ cần đăng nhập nên không cần kiểm tra "điều hướng tức thì".
export const instant = false;

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeacherDetail id={id} />;
}

export default function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-slate-500">Đang tải...</p>}>
      <Loader params={params} />
    </Suspense>
  );
}
