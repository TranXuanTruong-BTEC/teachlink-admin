import { Suspense } from "react";
import FeeDetail from "@/components/FeeDetail";

export const instant = false;

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeeDetail id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-slate-500">Đang tải...</p>}>
      <Loader params={params} />
    </Suspense>
  );
}
