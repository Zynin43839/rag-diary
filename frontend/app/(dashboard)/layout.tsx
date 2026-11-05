'use client'

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { MobileNav } from "@/components/sidebar/mobile-nav"
import { TopBar } from "@/components/layout/top-bar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-pa-paper">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10">
          <div className="mx-auto w-full max-w-6xl xl:max-w-7xl">{children}</div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
