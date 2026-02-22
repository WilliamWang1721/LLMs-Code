import { useEffect, useState } from "react";
import type React from "react";
import { ArrowUpDown, LayoutGrid, Navigation, Search, SlidersHorizontal, Store, Wifi, X } from "lucide-react";

import type { SidebarTab } from "@/components/fluxa-sidebar";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
  const isMap = activeTab === "map";
  const isBrands = activeTab === "brands";
  const [brandStatus, setBrandStatus] = useState<"online" | "offline">("online");
  const [brandView, setBrandView] = useState<"grid" | "list">("grid");
  const [listSort, setListSort] = useState<"distance" | "updated">("distance");
  const [filtersEnabled, setFiltersEnabled] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (activeTab !== "brands") {
      setBrandStatus("online");
      setBrandView("grid");
    }
    if (activeTab !== "list") {
      setListSort("distance");
    }
    if (activeTab !== "map") {
      setLocating(false);
    }
    setFiltersEnabled(false);
  }, [activeTab]);

  return (
    <header className="flex w-full min-w-0 flex-col gap-3 lg:h-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex h-8 w-full min-w-0 items-center gap-2 px-0 py-1.5 lg:max-w-[560px]">
        <Search className="h-4 w-4 text-[var(--foreground)]" />
        <span className="flex-1 truncate text-sm leading-[1.4286] text-[var(--foreground)]">
          {t(SEARCH_PLACEHOLDER[activeTab])}
        </span>
        <X className="h-4 w-4 text-[var(--foreground)]" />
      </div>

      {isBrands ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <button
            className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a293336] ${
              brandStatus === "online"
                ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
                : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]"
            }`}
            onClick={() => setBrandStatus("online")}
            type="button"
          >
            <Wifi className="h-4 w-4" />
            <span>{t("Online")}</span>
          </button>
          <button
            className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a29332e] ${
              brandStatus === "offline"
                ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
                : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]"
            }`}
            onClick={() => setBrandStatus("offline")}
            type="button"
          >
            <Store className="h-4 w-4" />
            <span>{t("Offline")}</span>
          </button>
          <button
            className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a29332e] ${
              brandView === "grid"
                ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
                : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]"
            }`}
            onClick={() => setBrandView((prev) => (prev === "grid" ? "list" : "grid"))}
            type="button"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>{brandView === "grid" ? t("Grid") : t("List")}</span>
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
            onClick={() => {
              if (isMap) {
                setLocating((prev) => !prev);
                return;
              }
              setListSort((prev) => (prev === "distance" ? "updated" : "distance"));
            }}
            type="button"
          >
            {isMap ? <Navigation className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
            <span>{isMap ? (locating ? t("Locating...") : t("Locate")) : listSort === "distance" ? t("Sort: Distance") : t("Sort: Updated")}</span>
          </button>

          <button
            className={`ui-hover-shadow flex h-10 min-w-[100px] items-center justify-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a293336] ${
              filtersEnabled
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
                : "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
            }`}
            onClick={() => setFiltersEnabled((prev) => !prev)}
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{filtersEnabled ? t("Filters On") : t("Filters")}</span>
          </button>
        </div>
      )}
    </header>
  );
}
