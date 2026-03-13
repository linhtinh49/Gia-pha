import config from "@/app/config";
import HeaderMenu from "@/components/HeaderMenu";
import Link from "next/link";
import React from "react";

interface DashboardHeaderProps {
  isAdmin: boolean;
  userEmail?: string;
  familyName?: string;
  joinCode?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  isAdmin,
  userEmail,
  familyName,
  joinCode,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="group flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
              {familyName || config.siteName}
            </h1>
          </Link>
          {joinCode && (
            <div className="hidden sm:flex items-center bg-stone-100 rounded-md px-3 py-1 text-sm border border-stone-200">
              <span className="text-stone-500 mr-2">Mã tham gia:</span>
              <span className="font-mono font-bold text-amber-700 tracking-wider">
                {joinCode}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {children}
          <HeaderMenu isAdmin={isAdmin} userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
