import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "라로제 HQ 통합 업무",
  description: "라로제 HQ 통합 업무 포털",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
