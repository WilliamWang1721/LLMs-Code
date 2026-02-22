import type React from "react";
import { ArrowUpDown, LayoutGrid, Navigation, Search, SlidersHorizontal, Store, Wifi, X } from "lucide-react";

import type { SidebarTab } from "@/components/fluxa-sidebar";

interface FluxaHeaderProps {
  activeTab: SidebarTab;
}

const SEARCH_PLACEHOLDER: Record<SidebarTab, string> = {
  map: "Search Location / Card BIN / Brand...",
  list: "Search merchant / address / card / Location ID...",
  brands: "Search brand / category / website...",
  profile: "Search profile activity...",
  history: "Search history..."
};

export function FluxaHeader({ activeTab }: FluxaHeaderProps): React.JSX.Element {
  const isMap = activeTab === "map";
  const isBrands = activeTab === "brands";

  return (
    <header className="flex w-full min-w-0 flex-col gap-3 lg:h-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex h-8 w-full min-w-0 items-center gap-2 px-0 py-1.5 lg:max-w-[560px]">
        <Search className="h-4 w-4 text-[var(--foreground)]" />
        <span className="flex-1 truncate text-sm leading-[1.4286] text-[var(--foreground)]">
          {SEARCH_PLACEHOLDER[activeTab]}
        </span>
        <X className="h-4 w-4 text-[var(--foreground)]" />
      </div>

      {isBrands ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
            type="button"
          >
            <Wifi className="h-4 w-4" />
            <span>Online</span>
          </button>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--muted)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
            type="button"
          >
            <Store className="h-4 w-4" />
            <span>Offline</span>
          </button>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--muted)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
            type="button"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Grid</span>
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <button
            className={`ui-hover-shadow flex h-10 items-center justify-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] ${
              isMap
                ? "min-w-[104px] border border-[var(--input)] bg-white transition-colors duration-200 hover:bg-[var(--muted-hover)] hover:border-[var(--border-hover)] [--hover-outline:#2a293336]"
                : "min-w-[153px] bg-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent-hover)] [--hover-outline:#2a29332e]"
            }`}
            type="button"
          >
            {isMap ? <Navigation className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
            <span>{isMap ? "Locate" : "Sort: Distance"}</span>
          </button>

          <button
            className="ui-hover-shadow flex h-10 min-w-[100px] items-center justify-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      )}
    </header>
  );
}
