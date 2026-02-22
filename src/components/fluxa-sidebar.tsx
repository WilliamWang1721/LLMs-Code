import type React from "react";
import { BadgeDollarSign, EllipsisVertical, History, Images, List, LogOut, Map, PanelLeft, Plus, Settings, UserRound } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type SidebarTab = "map" | "list" | "brands" | "profile" | "history";

interface FluxaSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export function FluxaSidebar({ activeTab, onTabChange }: FluxaSidebarProps): React.JSX.Element {
  return (
    <aside className="flex h-full w-[72px] shrink-0 flex-col rounded-l-none rounded-r-m border border-[var(--sidebar-border)] bg-[var(--sidebar)] md:w-56 lg:w-[240px]">
      <div className="flex items-center gap-2 p-6">
        <div className="flex flex-1 items-center justify-center gap-2 md:justify-start">
          <div className="relative h-10 w-10">
            <svg
              aria-hidden="true"
              className="absolute left-1 top-1 h-8 w-8 fill-[var(--sidebar-primary-foreground)]"
              viewBox="0 0 32 32"
            >
              <path d="M16 26c1.65686 0 3 1.34314 3 3 0 1.65686-1.34314 3-3 3-1.65686 0-3-1.34314-3-3 0-1.65686 1.34314-3 3-3z m-10-2c1.10457 0 2 0.89543 2 2 0 1.10457-0.89543 2-2 2-1.10457 0-2-0.89543-2-2 0-1.10457 0.89543-2 2-2z m20 0c1.10457 0 2 0.89543 2 2 0 1.10457-0.89543 2-2 2-1.10457 0-2-0.89543-2-2 0-1.10457 0.89543-2 2-2z m-10-12c2.20914 0 4 1.79086 4 4 0 2.20914-1.79086 4-4 4-2.20914 0-4-1.79086-4-4 0-2.20914 1.79086-4 4-4z m-13 1c1.65685 0 3 1.34314 3 3 0 1.65686-1.34315 3-3 3-1.65685 0-3-1.34314-3-3 0-1.65686 1.34315-3 3-3z m26 0c1.65686 0 3 1.34314 3 3 0 1.65686-1.34314 3-3 3-1.65686 0-3-1.34314-3-3 0-1.65686 1.34314-3 3-3z m-23-9c1.10457 0 2 0.89543 2 2 0 1.10457-0.89543 2-2 2-1.10457 0-2-0.89543-2-2 0-1.10457 0.89543-2 2-2z m20 0c1.10457 0 2 0.89543 2 2 0 1.10457-0.89543 2-2 2-1.10457 0-2-0.89543-2-2 0-1.10457 0.89543-2 2-2z m-10-4c1.65686 0 3 1.34315 3 3 0 1.65685-1.34314 3-3 3-1.65686 0-3-1.34315-3-3 0-1.65685 1.34314-3 3-3z" />
            </svg>
          </div>
          <p className="hidden text-sm font-semibold leading-[1.5] text-[var(--sidebar-primary-foreground)] md:block">FLUXA</p>
        </div>

        <button
          aria-label="Collapse sidebar"
          className="ui-hover-shadow hidden h-10 w-10 place-items-center rounded-pill border border-[var(--input)] bg-white text-[var(--sidebar-foreground)] transition-colors duration-200 hover:bg-[var(--muted-hover)] hover:border-[var(--border-hover)] [--hover-outline:#2a293333] md:grid"
          type="button"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2 md:px-4" aria-label="Main navigation">
        <p className="hidden h-8 text-xs font-medium leading-8 text-[var(--sidebar-foreground)] md:block">Discover</p>

        <button
          className={`ui-hover-shadow flex h-12 w-full items-center justify-center gap-2 rounded-[24px] px-0 py-3 text-left transition-colors duration-200 hover:bg-[var(--sidebar-accent-hover)] [--hover-outline:#2a293340] [--hover-outline-active:#2a293352] md:justify-start md:px-6 ${
            activeTab === "map" ? "bg-[var(--sidebar-accent)]" : ""
          }`}
          onClick={() => onTabChange("map")}
          type="button"
        >
          <span className="hidden flex-1 text-left text-base font-medium leading-6 text-[var(--sidebar-accent-foreground)] md:block">Map</span>
          <Map className={`h-6 w-6 transition-colors ${activeTab === "map" ? "text-[var(--sidebar-accent-foreground)]" : "text-[var(--sidebar-foreground)]"}`} />
        </button>

        <button
          className={`ui-hover-shadow flex h-12 w-full items-center justify-center gap-2 rounded-[24px] px-0 py-3 text-left transition-colors duration-200 hover:bg-[var(--sidebar-accent-hover)] [--hover-outline:#2a293340] [--hover-outline-active:#2a293352] md:justify-start md:px-6 ${
            activeTab === "list" ? "bg-[var(--sidebar-accent)]" : ""
          }`}
          onClick={() => onTabChange("list")}
          type="button"
        >
          <span className="hidden flex-1 text-left text-base font-medium leading-6 text-[var(--sidebar-accent-foreground)] md:block">List</span>
          <List className={`h-6 w-6 transition-colors ${activeTab === "list" ? "text-[var(--sidebar-accent-foreground)]" : "text-[var(--sidebar-foreground)]"}`} />
        </button>

        <button
          className={`ui-hover-shadow flex h-12 w-full items-center justify-center gap-2 rounded-[24px] px-0 py-3 text-left transition-colors duration-200 hover:bg-[var(--sidebar-accent-hover)] [--hover-outline:#2a293340] [--hover-outline-active:#2a293352] md:justify-start md:px-6 ${
            activeTab === "brands" ? "bg-[var(--sidebar-accent)]" : ""
          }`}
          onClick={() => onTabChange("brands")}
          type="button"
        >
          <span className="hidden flex-1 text-left text-base font-medium leading-6 text-[var(--sidebar-accent-foreground)] md:block">Brands</span>
          <BadgeDollarSign className={`h-6 w-6 transition-colors ${activeTab === "brands" ? "text-[var(--sidebar-accent-foreground)]" : "text-[var(--sidebar-foreground)]"}`} />
        </button>

        <button
          className="ui-hover-shadow mt-1.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-[var(--primary)] px-2 py-2.5 text-sm font-medium leading-[1.4286] text-[var(--primary-foreground)] transition-colors duration-200 hover:bg-[var(--primary-hover)] [--hover-outline:#4134cc73] [--hover-outline-active:#372cb8a6] md:px-4"
          type="button"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">{activeTab === "brands" ? "Add Brand" : "Add Location"}</span>
        </button>
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Open user menu"
            className="ui-hover-shadow group flex w-full cursor-pointer items-start justify-center gap-2 rounded-m p-3 text-left transition-colors duration-200 hover:bg-[var(--muted)] [--hover-outline:#2a293338] [--hover-outline-active:#2a29334d] md:justify-start md:p-6"
            type="button"
          >
            <div className="hidden flex-1 md:block">
              <p className="text-base font-semibold leading-6 text-[var(--sidebar-accent-foreground)]">Joe Doe</p>
              <p className="text-base leading-6 text-[var(--sidebar-foreground)]">joe@acmecorp.com</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center text-[var(--sidebar-accent-foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)]">
              <EllipsisVertical className="h-6 w-6" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width)] !rounded-m overflow-hidden border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--foreground)] !shadow-[0_4px_12px_-4px_#0000001A] flex flex-col gap-1.5"
          side="top"
          sideOffset={8}
        >
          <DropdownMenuItem
            className="flex h-10 cursor-pointer items-center gap-2.5 !rounded-xs px-3.5 py-2.5 text-sm font-medium leading-[1.4286] text-[var(--foreground)] outline-none transition-colors data-[highlighted]:!rounded-m data-[highlighted]:bg-[var(--accent)]"
            onSelect={() => onTabChange("profile")}
          >
            <UserRound className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex h-10 cursor-pointer items-center gap-2.5 !rounded-xs px-3.5 py-2.5 text-sm font-medium leading-[1.4286] text-[var(--foreground)] outline-none transition-colors data-[highlighted]:!rounded-m data-[highlighted]:bg-[var(--accent)]"
            onSelect={() => onTabChange("history")}
          >
            <History className="h-4 w-4" />
            History
          </DropdownMenuItem>
          <DropdownMenuItem className="flex h-10 cursor-pointer items-center gap-2.5 !rounded-xs px-3.5 py-2.5 text-sm font-medium leading-[1.4286] text-[var(--foreground)] outline-none transition-colors data-[highlighted]:!rounded-m data-[highlighted]:bg-[var(--accent)]">
            <Images className="h-4 w-4" />
            Album
          </DropdownMenuItem>
          <DropdownMenuItem className="flex h-10 cursor-pointer items-center gap-2.5 !rounded-xs px-3.5 py-2.5 text-sm font-medium leading-[1.4286] text-[var(--foreground)] outline-none transition-colors data-[highlighted]:!rounded-m data-[highlighted]:bg-[var(--accent)]">
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-3 my-1.5 h-px bg-[var(--border)]" />
          <DropdownMenuItem className="flex h-10 cursor-pointer items-center gap-2.5 !rounded-xs px-3.5 py-2.5 text-sm font-medium leading-[1.4286] text-[#f04f38] outline-none data-[highlighted]:bg-[#f04f3814] data-[highlighted]:text-[#f04f38]">
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}
