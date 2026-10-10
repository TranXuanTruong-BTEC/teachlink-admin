import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeachLink Admin",
  description: "Hệ thống quản lý nội bộ TeachLink",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
