"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight group">
          <span className="text-accent group-hover:scale-110 transition-transform">◆</span>
          <span>Miyamoto Labs</span>
          <span className="text-[10px] text-white/20 font-mono ml-1 hidden sm:inline">SOFTWARE FACTORY</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href ? "text-accent font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/checkout" className="text-sm bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg transition-colors font-medium">
            Buy Now
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={open ? "M6 6l12 12M6 18L18 6" : "M4 8h16M4 16h16"} />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block text-sm py-1 ${pathname === l.href ? "text-accent font-medium" : "text-white/60 hover:text-white"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/checkout" onClick={() => setOpen(false)} className="block text-sm bg-accent text-white px-4 py-2 rounded-lg text-center font-medium mt-2">
            Buy Now
          </Link>
        </div>
      )}
    </nav>
  );
}
