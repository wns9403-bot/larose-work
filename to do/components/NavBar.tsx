"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="site-nav">
      <span className="site-nav-brand">larosée</span>
      <div className="site-nav-links">
        <Link href="/team" className={`site-nav-link ${path === "/team" ? "site-nav-active" : ""}`}>
          팀 업무 보드
        </Link>
      </div>
    </nav>
  );
}
