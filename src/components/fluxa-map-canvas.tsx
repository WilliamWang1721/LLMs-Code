import { useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CupSoda,
  ListFilter,
  MapPinned,
  MoreHorizontal,
  RefreshCw,
  ShoppingBag,
  SquarePen,
  Store,
  Trash2,
  Utensils
} from "lucide-react";

import type { SidebarTab } from "@/components/fluxa-sidebar";
import { useI18n } from "@/i18n";

interface MerchantCard {
  id: string;
  name: string;
  status: "active" | "inactive" | "unknown";
  address: string;
  distanceMeta: string;
  author: string;
}

const BASE_CARDS: Array<Omit<MerchantCard, "id">> = [
  {
    name: "Starbucks Jing'an",
    status: "active",
    address: "Nanjing W Rd, Jing'an, Shanghai",
    distanceMeta: "1.2 km · 12m ago",
    author: "by @william"
  },
  {
    name: "KFC Lujiazui",
    status: "inactive",
    address: "Century Ave, Pudong, Shanghai",
    distanceMeta: "4.8 km · 37m ago",
    author: "by @alice"
  },
  {
    name: "FamilyMart Xintiandi",
    status: "unknown",
    address: "Madang Rd, Huangpu, Shanghai",
    distanceMeta: "2.6 km · 1h ago",
    author: "by @tom"
  },
  {
    name: "McDonald's People Sq",
    status: "active",
    address: "People's Square, Huangpu, Shanghai",
    distanceMeta: "3.4 km · 9m ago",
    author: "by @jane"
  }
];

type BrandCategoryLabel = "Coffee" | "Fast Food" | "Retail" | "Convenience";
type BrandSegment = Exclude<BrandCategoryLabel, "Retail">;

interface BrandMerchantCard {
  id: string;
  brand: string;
  category: string;
  segment: BrandSegment;
  coverage: string;
  issues: string;
  owner: string;
}

const BASE_BRAND_CARDS: Array<Omit<BrandMerchantCard, "id">> = [
  {
    brand: "Starbucks",
    category: "Coffee & Beverage",
    segment: "Coffee",
    coverage: "Coverage 124 stores · 92% online",
    issues: "Issue stores 6 · Last sync 5m ago",
    owner: "Owner: Evelyn Chen"
  },
  {
    brand: "McDonald's",
    category: "Quick Service",
    segment: "Fast Food",
    coverage: "Coverage 198 stores · 89% online",
    issues: "Issue stores 14 · Last sync 12m ago",
    owner: "Owner: Jason Li"
  },
  {
    brand: "FamilyMart",
    category: "Convenience",
    segment: "Convenience",
    coverage: "Coverage 76 stores · 84% online",
    issues: "Issue stores 11 · Last sync 23m ago",
    owner: "Owner: Amber Zhao"
  }
];

interface BrandCategory {
  label: BrandCategoryLabel;
  icon: React.ComponentType<{ className?: string }>;
}

const BRAND_CATEGORIES: BrandCategory[] = [
  { label: "Coffee", icon: CupSoda },
  { label: "Fast Food", icon: Utensils },
  { label: "Retail", icon: ShoppingBag },
  { label: "Convenience", icon: Store }
];

const PROFILE_FIELDS = [
  { label: "Name", value: "Joe Doe" },
  { label: "Email", value: "joe@acmecorp.com" },
  { label: "Location", value: "San Francisco, CA" },
  { label: "Joined", value: "April 2024" }
];

const PROFILE_BIO =
  "Builder of payment mapping tools, loves observability systems, practical depth, and scalable UX.";

const PROFILE_STATS = [
  { value: "24", label: "Total Projects" },
  { value: "87", label: "Edits this month" },
  { value: "312", label: "Merged PRs" }
];

const QUICK_ACCESS_ITEMS = ["Favorites", "My Profile Photos", "Drafts"];

const RECENT_ACTIVITY = [
  "Signed in from San Francisco · 2 hours ago",
  "Updated profile banner and bio · yesterday",
  "Changed profile photo · 3 days ago"
];

interface HistoryVisit {
  title: string;
  meta: string;
  time: string;
}

const HISTORY_VISITS: HistoryVisit[] = [
  {
    title: "Visited page: Starbucks Xujiahui",
    meta: "Keyword: coffee · AI · Drive-thru",
    time: "2 h 19 m ago"
  },
  {
    title: "Visited page: UNIQLO Nanjing West Rd",
    meta: "Keyword: apparel · 1 result",
    time: "8 h 14 m ago"
  },
  {
    title: "Visited page: Apple Store Pudong",
    meta: "5 views in session · detail view",
    time: "18 h 46 m ago"
  },
  {
    title: "Visited page: KFC Lujiazui",
    meta: "Keyword: crispy · filters: deals",
    time: "22 h 07 m ago"
  }
];

const HISTORY_TRAFFIC_SOURCES = ["Search: 14", "Recommendations: 6", "Saved items: 4"];
const LIST_TOTAL_RECORDS = 324;
const LIST_PAGE_SIZE = 4;
const LIST_PAGE_COUNT = 3;
const BRAND_TOTAL_RECORDS = 186;
const BRAND_PAGE_SIZE = 3;

function statusClass(status: MerchantCard["status"]): string {
  if (status === "active") {
    return "bg-[var(--color-success)] text-[var(--color-success-foreground)]";
  }
  if (status === "inactive") {
    return "bg-[var(--color-warning)] text-[var(--color-warning-foreground)]";
  }
  return "bg-[var(--secondary)] text-[var(--secondary-foreground)]";
}

function statusLabel(status: MerchantCard["status"]): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  return "Unknown";
}

interface FluxaMapCanvasProps {
  activeTab: SidebarTab;
  brandDraftCount?: number;
  onOpenDetail?: () => void;
}

export function FluxaMapCanvas({ activeTab, brandDraftCount = 0, onOpenDetail }: FluxaMapCanvasProps): React.JSX.Element {
  const { t } = useI18n();
  const [historyFilter, setHistoryFilter] = useState<"all" | "today">("all");
  const [historyCleared, setHistoryCleared] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFields, setProfileFields] = useState(PROFILE_FIELDS);
  const [profileBio, setProfileBio] = useState(PROFILE_BIO);
  const [quickAccessTarget, setQuickAccessTarget] = useState<string | null>(null);
  const [mapRefreshCount, setMapRefreshCount] = useState(0);
  const [brandCategory, setBrandCategory] = useState<BrandCategoryLabel>("Coffee");
  const [brandPage, setBrandPage] = useState(1);
  const [brandActionTarget, setBrandActionTarget] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);

  const listRecords = useMemo<MerchantCard[]>(
    () =>
      Array.from({ length: LIST_PAGE_SIZE * LIST_PAGE_COUNT }, (_, index) => {
        const base = BASE_CARDS[index % BASE_CARDS.length];
        return {
          ...base,
          id: `merchant-${index + 1}`,
          name: index < BASE_CARDS.length ? base.name : `${base.name} #${index + 1}`,
          distanceMeta: `${(1.1 + index * 0.2).toFixed(1)} km · ${8 + index}m ago`
        };
      }),
    []
  );

  const brandCards = useMemo<BrandMerchantCard[]>(
    () =>
      Array.from({ length: 9 }, (_, index) => {
        const base = BASE_BRAND_CARDS[index % BASE_BRAND_CARDS.length];
        return {
          ...base,
          id: `${base.brand.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`
        };
      }),
    []
  );

  const historyVisits = useMemo<HistoryVisit[]>(() => {
    if (historyCleared) {
      return [];
    }
    if (historyFilter === "today") {
      return HISTORY_VISITS.slice(0, 2);
    }
    return HISTORY_VISITS;
  }, [historyCleared, historyFilter]);

  const filteredBrandCards = useMemo<BrandMerchantCard[]>(() => {
    if (brandCategory === "Retail") {
      return brandCards;
    }
    return brandCards.filter((card) => card.segment === brandCategory);
  }, [brandCards, brandCategory]);

  const brandPageCount = Math.max(1, Math.ceil(filteredBrandCards.length / BRAND_PAGE_SIZE));
  const pagedBrandCards = filteredBrandCards.slice((brandPage - 1) * BRAND_PAGE_SIZE, brandPage * BRAND_PAGE_SIZE);

  const pagedListRecords = listRecords.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);
  const listStart = (listPage - 1) * LIST_PAGE_SIZE + 1;
  const listEnd = listStart + pagedListRecords.length - 1;
  const mapLocationsInView = 326 + mapRefreshCount * 2;

  useEffect(() => {
    setBrandPage(1);
  }, [brandCategory]);

  useEffect(() => {
    if (brandPage > brandPageCount) {
      setBrandPage(brandPageCount);
    }
  }, [brandPage, brandPageCount]);

  const handleProfileFieldChange = (label: string, value: string): void => {
    setProfileFields((prev) => prev.map((field) => (field.label === label ? { ...field, value } : field)));
  };

  if (activeTab === "history") {
    return (
      <section className="flex h-full w-full min-w-0 flex-col gap-2.5 bg-[var(--background)] px-6 py-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-[32px] font-semibold leading-[1.2] text-[var(--foreground)]">{t("Browsing History")}</h1>
            <p className="text-sm leading-[1.4] text-[var(--muted-foreground)]">{t("Recently visited pages and search history")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#4134cc73] [--hover-outline-active:#372cb8a6] ${
                historyFilter === "all"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
                  : "border border-[var(--input)] bg-white text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
              }`}
              onClick={() => {
                setHistoryFilter("all");
                setHistoryCleared(false);
              }}
              type="button"
            >
              <ListFilter className="h-4 w-4" />
              <span>{t("All")}</span>
            </button>
            <button
              className={`ui-hover-shadow inline-flex h-10 items-center rounded-pill border px-4 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a293333] ${
                historyFilter === "today"
                  ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
                  : "border-[var(--input)] bg-white text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
              }`}
              onClick={() => {
                setHistoryFilter("today");
                setHistoryCleared(false);
              }}
              type="button"
            >
              {t("Today")}
            </button>
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
              onClick={() => setHistoryCleared(true)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("Clear")}</span>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex w-full items-center justify-between gap-3">
              <h2 className="text-lg font-semibold leading-[1.3] text-[var(--foreground)]">{t("Recent Visits")}</h2>
              <span className="text-xs leading-[1.3] text-[var(--muted-foreground)]">{historyFilter === "today" ? t("Today") : t("Last 24 hours")}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {historyVisits.length > 0 ? (
                historyVisits.map((visit) => (
                  <article className="flex min-w-0 flex-col gap-1.5 rounded-m border border-[var(--border)] bg-[var(--card)] px-4 py-3.5" key={visit.title}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate text-sm font-medium leading-[1.3] text-[var(--foreground)]">{t(visit.title)}</h3>
                      <span className="shrink-0 text-xs leading-[1.3] text-[var(--muted-foreground)]">{visit.time}</span>
                    </div>
                    <p className="truncate text-xs leading-[1.3] text-[var(--muted-foreground)]">{t(visit.meta)}</p>
                  </article>
                ))
              ) : (
                <article className="flex min-h-[120px] items-center justify-center rounded-m border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-sm text-[var(--muted-foreground)]">
                  {t("No history data. Click All or Today to reload.")}
                </article>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2.5 xl:w-[320px]">
            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">{t("Visits Today")}</p>
              <p className="mt-1 text-4xl font-bold leading-[1.1] text-[var(--foreground)]">{historyVisits.length}</p>
              <p className="mt-1 text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">{historyCleared ? t("History cleared") : "+12% vs yesterday"}</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">{t("Peak Browsing Hour")}</p>
              <p className="mt-1 text-[22px] font-semibold leading-[1.2] text-[var(--foreground)]">20:00 - 21:00</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold leading-[1.3] text-[var(--foreground)]">{t("Traffic Sources")}</h3>
              <div className="mt-2 flex flex-col gap-1">
                {HISTORY_TRAFFIC_SOURCES.map((item) => (
                  <p className="text-[13px] leading-[1.4] text-[var(--muted-foreground)]" key={item}>
                    {t(item)}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === "profile") {
    return (
      <section className="flex h-full w-full min-w-0 flex-col gap-2 rounded-m bg-[var(--background)] p-4">
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-2xl font-semibold leading-[1.3] text-[var(--foreground)]">{t("Profile")}</h1>
            <p className="text-[13px] leading-[1.4286] text-[var(--muted-foreground)]">
              {t("View your profile, activity, and contributions.")}
            </p>
          </div>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] bg-white px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            onClick={() => setProfileEditing((prev) => !prev)}
            type="button"
          >
            <SquarePen className="h-4 w-4" />
            <span>{profileEditing ? t("Save Profile") : t("Edit Profile")}</span>
          </button>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
            <article className="flex min-h-[320px] min-w-0 flex-col gap-3 rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">{t("Account Information")}</h2>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {profileFields.map((field) => (
                  <div className="flex min-w-0 flex-col gap-1" key={field.label}>
                    <span className="text-xs leading-[1.2] text-[var(--muted-foreground)]">{t(field.label)}</span>
                    <div className="inline-flex min-h-9 items-center rounded-pill bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]">
                      {profileEditing ? (
                        <input
                          className="w-full bg-transparent outline-none"
                          onChange={(event) => handleProfileFieldChange(field.label, event.target.value)}
                          type="text"
                          value={field.value}
                        />
                      ) : (
                        <span className="truncate">{field.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs leading-[1.2] text-[var(--muted-foreground)]">{t("Bio")}</span>
                {profileEditing ? (
                  <textarea
                    className="min-h-[72px] rounded-m bg-[var(--muted)] px-3 py-2 text-sm leading-[1.4286] text-[var(--foreground)] outline-none"
                    onChange={(event) => setProfileBio(event.target.value)}
                    rows={3}
                    value={profileBio}
                  />
                ) : (
                  <p className="rounded-m bg-[var(--muted)] px-3 py-2 text-sm leading-[1.4286] text-[var(--foreground)]">{t(profileBio)}</p>
                )}
              </div>
            </article>

            <article className="flex min-h-[320px] min-w-0 flex-col gap-3 rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">{t("Your Stats")}</h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {PROFILE_STATS.map((item) => (
                  <div className="rounded-m bg-[var(--muted)] p-3" key={item.label}>
                    <p className="text-[28px] font-semibold leading-[1.15] text-[var(--foreground)]">{item.value}</p>
                    <p className="mt-1 text-xs leading-[1.2] text-[var(--muted-foreground)]">{t(item.label)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-m bg-[var(--muted)] px-3 py-2">
                <div className="flex items-center justify-between gap-4 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                  <span>{t("Activity score this week")}</span>
                  <span className="font-medium text-[var(--foreground)]">4.8</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-4 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                  <span>{t("Quality score this month")}</span>
                  <span className="font-medium text-[var(--foreground)]">+9</span>
                </div>
              </div>
            </article>
          </div>

          <div className="flex min-h-0 w-full shrink-0 flex-col gap-2.5 xl:w-[340px]">
            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">{t("Profile Photo")}</h2>
              <div className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--foreground)]">
                JD
              </div>
              <p className="mt-3 text-xs leading-[1.2] text-[var(--muted-foreground)]">{t("Profile settings and visibility controls.")}</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">{t("Quick Access")}</h2>
              <div className="mt-2 flex flex-col gap-1.5">
                {QUICK_ACCESS_ITEMS.map((item) => (
                  <button
                    className={`ui-hover-shadow inline-flex h-9 w-full items-center justify-between rounded-pill px-3 py-2 text-sm font-medium leading-[1.4286] transition-colors duration-200 [--hover-outline:#2a29332e] ${
                      quickAccessTarget === item
                        ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)]"
                        : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]"
                    }`}
                    key={item}
                    onClick={() => setQuickAccessTarget(item)}
                    type="button"
                  >
                    <span>{t(item)}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </button>
                ))}
              </div>
            </article>

            <article className="flex min-h-[170px] flex-1 flex-col rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">{t("Recent Activity")}</h2>
              {quickAccessTarget ? <p className="mt-2 text-xs leading-[1.2] text-[var(--muted-foreground)]">{t("Opened:")} {t(quickAccessTarget)}</p> : null}
              <ul className="mt-2 flex flex-col gap-2 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                {RECENT_ACTIVITY.map((item) => (
                  <li className="list-disc pl-1 marker:text-[var(--muted-foreground)]" key={item}>
                    {t(item)}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === "map") {
    return (
      <section className="flex h-full w-full min-w-0 flex-col justify-between gap-3 rounded-m border border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex min-h-10 w-full flex-wrap items-center justify-between gap-2">
          <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-success)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-success-foreground)]">
            {mapLocationsInView} {t("Locations in View")}
          </div>

          <button
            className="ui-hover-shadow flex h-10 items-center justify-center gap-1.5 rounded-pill bg-[var(--accent)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--accent-hover)] [--hover-outline:#2a29332e]"
            onClick={() => setMapRefreshCount((prev) => prev + 1)}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{mapRefreshCount > 0 ? t("Refreshed") : t("Refresh")}</span>
          </button>
        </div>

        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5">
          <MapPinned className="h-11 w-11 text-[var(--muted-foreground)]" />
          <h1 className="text-[22px] font-bold leading-[1.2] text-[var(--foreground)]">{t("AMap Live Layer")}</h1>
          <p className="w-full max-w-[520px] px-2 text-center text-[13px] font-normal text-[var(--muted-foreground)]">
            {t("Cluster / marker click / double-click to create Location with prefilled coordinate and address.")}
          </p>
        </div>
      </section>
    );
  }

  if (activeTab === "brands") {
    return (
      <section className="flex h-full w-full min-w-0 flex-col gap-[7px]">
        <div className="flex w-full flex-wrap items-center gap-2">
          {BRAND_CATEGORIES.map((item) => {
            const Icon = item.icon;
            const isActive = brandCategory === item.label;
            return (
              <button
                className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] ${
                  isActive
                    ? "bg-[var(--secondary)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
                    : "bg-[var(--muted)] transition-colors duration-200 hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
                }`}
                key={item.label}
                onClick={() => setBrandCategory(item.label)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
          {brandDraftCount > 0 ? (
            <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-info)] px-3 py-2 text-xs font-medium text-[var(--color-info-foreground)]">
              {brandDraftCount} {brandDraftCount > 1 ? t("Draft Brands") : t("Draft Brand")}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {pagedBrandCards.map((item) => (
            <article
              className="flex min-h-[182px] min-w-0 flex-col rounded-m border border-[var(--border)] bg-[var(--muted-hover)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--secondary)]"
              key={item.id}
            >
              <div className="flex min-h-20 flex-col justify-center gap-0.5 px-3 pb-1.5 pt-3">
                <h3 className="truncate text-base font-semibold leading-6 text-[var(--foreground)]">{item.brand}</h3>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{t(item.category)}</p>
              </div>

              <div className="flex flex-col gap-1 px-3 pb-2.5">
                <p className="truncate text-[13px] font-medium leading-[1.2] text-[var(--foreground)]">{t(item.coverage)}</p>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{t(item.issues)}</p>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{t(item.owner)}</p>
                {brandActionTarget === item.id ? <p className="truncate text-xs leading-[1.2] text-[var(--foreground)]">{t("Actions opened")}</p> : null}
              </div>

              <div className="mt-auto flex items-center justify-between px-3 pb-3">
                <span className="text-xs font-medium leading-[1.2] text-[var(--muted-foreground)]">{t("Trend")}</span>
                <button
                  aria-label={`More actions for ${item.brand}`}
                  className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill bg-[var(--secondary)] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
                  onClick={() => setBrandActionTarget((prev) => (prev === item.id ? null : item.id))}
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[13px] font-normal text-[var(--muted-foreground)]">
            {t("Showing")} {pagedBrandCards.length} {t("of")} {BRAND_TOTAL_RECORDS} {t("merchants")}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333] disabled:opacity-50"
              disabled={brandPage === 1}
              onClick={() => setBrandPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>{t("Previous")}</span>
            </button>

            {Array.from({ length: brandPageCount }, (_, index) => index + 1).map((page) => (
              <button
                className={`ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border text-sm transition-colors duration-200 [--hover-outline:#2a293336] ${
                  brandPage === page
                    ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--secondary-hover)]"
                }`}
                key={page}
                onClick={() => setBrandPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333] disabled:opacity-50"
              disabled={brandPage === brandPageCount}
              onClick={() => setBrandPage((prev) => Math.min(brandPageCount, prev + 1))}
              type="button"
            >
              <span>{t("Next")}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full w-full min-w-0 flex-col gap-[7px]">
      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-success)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-success-foreground)]">
          {LIST_TOTAL_RECORDS} {t("Results")}
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-info)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-info-foreground)]">
          219 {t("Active")}
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-warning)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-warning-foreground)]">
          27 {t("Issues")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        {pagedListRecords.map((card) => (
          <article
            className="flex min-h-[124px] min-w-0 flex-col rounded-m border border-[var(--border)] bg-[var(--card)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)]"
            key={card.id}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
              <h3 className="truncate text-base font-semibold leading-6 text-[var(--foreground)]">{card.name}</h3>
              <div className="ml-2 flex items-center gap-2">
                <span
                  className={`inline-flex h-8 items-center justify-center rounded-pill px-3 py-2 text-sm font-medium leading-[1.142857] ${statusClass(card.status)}`}
                >
                  {t(statusLabel(card.status))}
                </span>
                <button
                  className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-m border border-[var(--input)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
                  onClick={onOpenDetail}
                  type="button"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>{t("Detail")}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-5 pb-[18px]">
              <p className="truncate text-[13px] font-normal leading-[1.2] text-[var(--muted-foreground)]">{card.address}</p>
              <div className="flex items-center justify-between gap-3 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                <span className="truncate">{card.distanceMeta}</span>
                <span className="shrink-0">{card.author}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[13px] font-normal text-[var(--muted-foreground)]">
          {t("Showing")} {listStart}-{listEnd} {t("of")} {LIST_TOTAL_RECORDS} {t("records")}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333] disabled:opacity-50"
            disabled={listPage === 1}
            onClick={() => setListPage((prev) => Math.max(1, prev - 1))}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>{t("Previous")}</span>
          </button>

          {Array.from({ length: LIST_PAGE_COUNT }, (_, index) => index + 1).map((page) => (
            <button
              className={`ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border text-sm transition-colors duration-200 [--hover-outline:#2a293336] ${
                listPage === page
                  ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                  : "border-transparent text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
              }`}
              key={page}
              onClick={() => setListPage(page)}
              type="button"
            >
              {page}
            </button>
          ))}

          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333] disabled:opacity-50"
            disabled={listPage === LIST_PAGE_COUNT}
            onClick={() => setListPage((prev) => Math.min(LIST_PAGE_COUNT, prev + 1))}
            type="button"
          >
            <span>{t("Next")}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
