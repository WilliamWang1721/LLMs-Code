import type React from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, CupSoda, ListFilter, MapPinned, MoreHorizontal, RefreshCw, ShoppingBag, SquarePen, Store, Trash2, Utensils } from "lucide-react";

import type { SidebarTab } from "@/components/fluxa-sidebar";

interface MerchantCard {
  name: string;
  status: "active" | "inactive" | "unknown";
  address: string;
  distanceMeta: string;
  author: string;
}

const CARDS: MerchantCard[] = [
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

interface BrandMerchantCard {
  brand: string;
  category: string;
  coverage: string;
  issues: string;
  owner: string;
}

const BRAND_CARDS: BrandMerchantCard[] = [
  {
    brand: "Starbucks",
    category: "Coffee & Beverage",
    coverage: "Coverage 124 stores · 92% online",
    issues: "Issue stores 6 · Last sync 5m ago",
    owner: "Owner: Evelyn Chen"
  },
  {
    brand: "McDonald's",
    category: "Quick Service",
    coverage: "Coverage 198 stores · 89% online",
    issues: "Issue stores 14 · Last sync 12m ago",
    owner: "Owner: Jason Li"
  },
  {
    brand: "FamilyMart",
    category: "Convenience",
    coverage: "Coverage 76 stores · 84% online",
    issues: "Issue stores 11 · Last sync 23m ago",
    owner: "Owner: Amber Zhao"
  }
];

interface BrandCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

const BRAND_CATEGORIES: BrandCategory[] = [
  { label: "Coffee", icon: CupSoda, active: true },
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
}

export function FluxaMapCanvas({ activeTab }: FluxaMapCanvasProps): React.JSX.Element {
  if (activeTab === "history") {
    return (
      <section className="flex h-full w-full min-w-0 flex-col gap-2.5 bg-[var(--background)] px-6 py-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-[32px] font-semibold leading-[1.2] text-[var(--foreground)]">Browsing History</h1>
            <p className="text-sm leading-[1.4] text-[var(--muted-foreground)]">Recently visited pages and search history</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--primary)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--primary-foreground)] transition-colors duration-200 hover:bg-[var(--primary-hover)] [--hover-outline:#4134cc73] [--hover-outline-active:#372cb8a6]"
              type="button"
            >
              <ListFilter className="h-4 w-4" />
              <span>All</span>
            </button>
            <button
              className="ui-hover-shadow inline-flex h-10 items-center rounded-pill border border-[var(--input)] bg-white px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
              type="button"
            >
              Today
            </button>
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex w-full items-center justify-between gap-3">
              <h2 className="text-lg font-semibold leading-[1.3] text-[var(--foreground)]">Recent Visits</h2>
              <span className="text-xs leading-[1.3] text-[var(--muted-foreground)]">Last 24 hours</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {HISTORY_VISITS.map((visit) => (
                <article className="flex min-w-0 flex-col gap-1.5 rounded-m border border-[var(--border)] bg-[var(--card)] px-4 py-3.5" key={visit.title}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate text-sm font-medium leading-[1.3] text-[var(--foreground)]">{visit.title}</h3>
                    <span className="shrink-0 text-xs leading-[1.3] text-[var(--muted-foreground)]">{visit.time}</span>
                  </div>
                  <p className="truncate text-xs leading-[1.3] text-[var(--muted-foreground)]">{visit.meta}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2.5 xl:w-[320px]">
            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">Visits Today</p>
              <p className="mt-1 text-4xl font-bold leading-[1.1] text-[var(--foreground)]">24</p>
              <p className="mt-1 text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">+12% vs yesterday</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">Peak Browsing Hour</p>
              <p className="mt-1 text-[22px] font-semibold leading-[1.2] text-[var(--foreground)]">20:00 - 21:00</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-sm font-semibold leading-[1.3] text-[var(--foreground)]">Traffic Sources</h3>
              <div className="mt-2 flex flex-col gap-1">
                {HISTORY_TRAFFIC_SOURCES.map((item) => (
                  <p className="text-[13px] leading-[1.4] text-[var(--muted-foreground)]" key={item}>
                    {item}
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
            <h1 className="text-2xl font-semibold leading-[1.3] text-[var(--foreground)]">Profile</h1>
            <p className="text-[13px] leading-[1.4286] text-[var(--muted-foreground)]">
              View your profile, activity, and contributions.
            </p>
          </div>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] bg-white px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            type="button"
          >
            <SquarePen className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
            <article className="flex min-h-[320px] min-w-0 flex-col gap-3 rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">Account Information</h2>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {PROFILE_FIELDS.map((field) => (
                  <div className="flex min-w-0 flex-col gap-1" key={field.label}>
                    <span className="text-xs leading-[1.2] text-[var(--muted-foreground)]">{field.label}</span>
                    <div className="inline-flex min-h-9 items-center rounded-pill bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]">
                      <span className="truncate">{field.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs leading-[1.2] text-[var(--muted-foreground)]">Bio</span>
                <p className="rounded-m bg-[var(--muted)] px-3 py-2 text-sm leading-[1.4286] text-[var(--foreground)]">{PROFILE_BIO}</p>
              </div>
            </article>

            <article className="flex min-h-[320px] min-w-0 flex-col gap-3 rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">Your Stats</h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {PROFILE_STATS.map((item) => (
                  <div className="rounded-m bg-[var(--muted)] p-3" key={item.label}>
                    <p className="text-[28px] font-semibold leading-[1.15] text-[var(--foreground)]">{item.value}</p>
                    <p className="mt-1 text-xs leading-[1.2] text-[var(--muted-foreground)]">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-m bg-[var(--muted)] px-3 py-2">
                <div className="flex items-center justify-between gap-4 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                  <span>Activity score this week</span>
                  <span className="font-medium text-[var(--foreground)]">4.8</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-4 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                  <span>Quality score this month</span>
                  <span className="font-medium text-[var(--foreground)]">+9</span>
                </div>
              </div>
            </article>
          </div>

          <div className="flex min-h-0 w-full shrink-0 flex-col gap-2.5 xl:w-[340px]">
            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">Profile Photo</h2>
              <div className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--foreground)]">
                JD
              </div>
              <p className="mt-3 text-xs leading-[1.2] text-[var(--muted-foreground)]">Profile settings and visibility controls.</p>
            </article>

            <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">Quick Access</h2>
              <div className="mt-2 flex flex-col gap-1.5">
                {QUICK_ACCESS_ITEMS.map((item) => (
                  <button
                    className="ui-hover-shadow inline-flex h-9 w-full items-center justify-between rounded-pill bg-[var(--muted)] px-3 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
                    key={item}
                    type="button"
                  >
                    <span>{item}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </button>
                ))}
              </div>
            </article>

            <article className="flex min-h-[170px] flex-1 flex-col rounded-m border border-[var(--border)] bg-[var(--card)] p-4">
              <h2 className="text-sm font-semibold leading-[1.4286] text-[var(--foreground)]">Recent Activity</h2>
              <ul className="mt-2 flex flex-col gap-2 text-xs leading-[1.2] text-[var(--muted-foreground)]">
                {RECENT_ACTIVITY.map((item) => (
                  <li className="list-disc pl-1 marker:text-[var(--muted-foreground)]" key={item}>
                    {item}
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
            326 Locations in View
          </div>

          <button
            className="ui-hover-shadow flex h-10 items-center justify-center gap-1.5 rounded-pill bg-[var(--accent)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--accent-hover)] [--hover-outline:#2a29332e]"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5">
          <MapPinned className="h-11 w-11 text-[var(--muted-foreground)]" />
          <h1 className="text-[22px] font-bold leading-[1.2] text-[var(--foreground)]">AMap Live Layer</h1>
          <p className="w-full max-w-[520px] px-2 text-center text-[13px] font-normal text-[var(--muted-foreground)]">
            Cluster / marker click / double-click to create Location with prefilled coordinate and address.
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
            return (
              <button
                className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] ${
                  item.active
                    ? "bg-[var(--secondary)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
                    : "bg-[var(--muted)] transition-colors duration-200 hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
                }`}
                key={item.label}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {BRAND_CARDS.map((item) => (
            <article
              className="ui-hover-shadow flex min-h-[182px] min-w-0 flex-col rounded-m border border-[var(--border)] bg-[var(--muted-hover)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--secondary)] [--hover-outline:#2a293329]"
              key={item.brand}
            >
              <div className="flex min-h-20 flex-col justify-center gap-0.5 px-3 pb-1.5 pt-3">
                <h3 className="truncate text-base font-semibold leading-6 text-[var(--foreground)]">{item.brand}</h3>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{item.category}</p>
              </div>

              <div className="flex flex-col gap-1 px-3 pb-2.5">
                <p className="truncate text-[13px] font-medium leading-[1.2] text-[var(--foreground)]">{item.coverage}</p>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{item.issues}</p>
                <p className="truncate text-xs leading-[1.2] text-[var(--muted-foreground)]">{item.owner}</p>
              </div>

              <div className="mt-auto flex items-center justify-between px-3 pb-3">
                <span className="text-xs font-medium leading-[1.2] text-[var(--muted-foreground)]">Trend</span>
                <button
                  aria-label={`More actions for ${item.brand}`}
                  className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill bg-[var(--secondary)] text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[13px] font-normal text-[var(--muted-foreground)]">Showing 3 of 186 merchants</p>
          <div className="flex items-center gap-2">
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>

            <button
              className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border border-[var(--border)] text-sm text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
              type="button"
            >
              1
            </button>

            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
              type="button"
            >
              <span>Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  // list tab
  return (
    <section className="flex h-full w-full min-w-0 flex-col gap-[7px]">
      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-success)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-success-foreground)]">
          324 Results
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-info)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-info-foreground)]">
          219 Active
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-pill bg-[var(--color-warning)] px-3 py-2 text-sm font-medium leading-[1.142857] text-[var(--color-warning-foreground)]">
          27 Issues
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        {CARDS.map((card) => (
          <article
            className="ui-hover-shadow flex min-h-[124px] min-w-0 flex-col rounded-m border border-[var(--border)] bg-[var(--card)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)] [--hover-outline:#2a293324]"
            key={card.name}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
              <h3 className="truncate text-base font-semibold leading-6 text-[var(--foreground)]">{card.name}</h3>
              <div className="ml-2 flex items-center gap-2">
                <span
                  className={`inline-flex h-8 items-center justify-center rounded-pill px-3 py-2 text-sm font-medium leading-[1.142857] ${statusClass(card.status)}`}
                >
                  {statusLabel(card.status)}
                </span>
                <button
                  className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-m border border-[var(--input)] px-4 py-2 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
                  type="button"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Jump</span>
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
        <p className="text-[13px] font-normal text-[var(--muted-foreground)]">Showing 1-3 of 324 records</p>
        <div className="flex items-center gap-2">
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>

          <button
            className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border border-[var(--border)] text-sm text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--secondary-hover)] [--hover-outline:#2a293336]"
            type="button"
          >
            1
          </button>
          <button
            className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border border-transparent text-sm text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
            type="button"
          >
            2
          </button>
          <button
            className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border border-transparent text-sm text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a29332e]"
            type="button"
          >
            3
          </button>

          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-2 rounded-pill border border-[var(--input)] px-[18px] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            type="button"
          >
            <span>Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
