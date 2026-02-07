"use client";

import { usePathname } from 'next/navigation';
import { GalleryHorizontal, Wand2, PanelLeft } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold font-headline">VisionaryAI</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/generate"
                isActive={pathname.startsWith('/generate')}
                tooltip="Generate"
                className="transition-colors duration-200 hover:bg-accent"
              >
                <Wand2 />
                <span>Generate</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/gallery"
                isActive={pathname.startsWith('/gallery')}
                tooltip="Gallery"
                className="transition-colors duration-200 hover:bg-accent"
              >
                <GalleryHorizontal />
                <span>Gallery</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <SidebarTrigger asChild>
            <Button size="icon" variant="outline" className="md:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SidebarTrigger>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
