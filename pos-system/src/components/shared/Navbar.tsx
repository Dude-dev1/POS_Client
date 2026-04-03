"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, User, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useShiftStore } from "@/store/shiftStore";
import { ShiftManagementModal } from "../pos/ShiftManagementModal";
import { ThemeToggle } from "./ThemeToggle";
import { AIInventoryAssistant } from "../pos/AIInventoryAssistant";
import { ConnectivityStatus } from "./ConnectivityStatus";
import { NotificationDropdown } from "./NotificationDropdown";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { navItems } from "./Sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { profile, signOut } = useAuthStore();
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentShift } = useShiftStore();

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    signOut();
    router.push("/login");
  };

  const filteredNavItems = navItems.filter((item) =>
    profile?.role ? item.roles.includes(profile.role) : false
  );

  return (
    <nav className="h-16 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Main Navigation Menu</SheetDescription>
            <div className="flex items-center justify-start gap-3 h-16 border-b border-border w-full px-4">
              <span className="font-bold text-xl text-popover-foreground">
                Cortex POS
              </span>
              <ShoppingCart className="h-5 w-5 shrink-0" />
            </div>
            <ul className="p-4 space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium whitespace-nowrap">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`hidden sm:flex gap-2 items-center h-8 ${
            currentShift
              ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
              : "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
          }`}
          onClick={() => setIsShiftModalOpen(true)}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              currentShift ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs font-bold">
            {currentShift ? "Shift Active" : "No Active Shift"}
          </span>
        </Button>

        <div className="hidden lg:block ml-1">
          <ConnectivityStatus />
        </div>

        <ThemeToggle />
        {profile?.role !== "CASHIER" && <AIInventoryAssistant />}

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ml-2"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={profile?.avatar_url || ""}
                  alt={profile?.full_name || "User"}
                />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || "Staff Member"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </nav>
  );
}
