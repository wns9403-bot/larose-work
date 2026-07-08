"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="site-nav">
      <span className="site-nav-brand">larosée</span>
      <div className="site-nav-links">
        <Link href="/dashboard" className={`site-nav-link ${path === "/dashboard" ? "site-nav-active" : ""}`}>
          매출 대시보드
        </Link>
        <a href="/team.html" className="site-nav-link">
          팀 업무 보드
        </a>
      </div>
    </nav>
  );
}
