import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar"
import { CalendarSearch, CircleUserRound, FileStack, Heart, House, Settings } from "lucide-react" 
import Image from "next/image"
import Link from "next/link"

export function AppSidebar() {
  return (
    <Sidebar 
      collapsible="none"
      className="w-[50px] border-r bg-white h-screen">
      <SidebarContent className="flex flex-col items-center py-4">
    <SidebarMenu className="gap-4">
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/"><Image src="/Rag-Diary-Logo.png" width={35} height={35} alt="Home" /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/search"><CalendarSearch /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/historyBoard"><FileStack /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/favorite"><Heart /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>

  
  <SidebarFooter className="flex flex-col items-center py-4">
    <SidebarMenu className="gap-4">
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/user"><CircleUserRound /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild className="justify-center">
          <Link href="/setting"><Settings /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
    </Sidebar>
  )
}