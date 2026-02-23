import { useEffect, useState } from "react";
import type React from "react";
import {
  ChevronRight,
  CircleCheck,
  CircleX,
  CreditCard,
  Edit2,
  Key,
  MapPin,
  PenTool,
  Plus,
  Radio,
  Settings2,
  TrendingUp,
  Wifi
} from "lucide-react";

import { useI18n } from "@/i18n";
import { TabsWarp } from "@/components/ui/tabs-warp";

type DetailContentTab = "overview" | "attempt" | "reviews";

interface NetworkRow {
  name: string;
  status: "supported" | "unknown";
  tags?: string[];
}

const NETWORK_ROWS: NetworkRow[] = [
  { name: "Mastercard", status: "supported", tags: ["CN Supported", "GL Supported"] },
  { name: "UnionPay", status: "supported" },
  { name: "Visa", status: "supported" },
  { name: "American Express", status: "supported", tags: ["CN Supported", "GL Supported"] },
  { name: "Discover", status: "unknown" },
  { name: "JCB", status: "supported" }
];

interface CvmRow {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "supported" | "limited";
}

const CVM_ROWS: CvmRow[] = [
  { name: "Physical Tap (No CVM)", icon: Wifi, status: "supported" },
  { name: "PIN", icon: Key, status: "supported" },
  { name: "Signature", icon: PenTool, status: "limited" }
];

interface PaymentAttemptRow {
  dateTime: string;
  addedBy: string;
  cardNetwork: string;
  method: string;
  status: "success" | "declined" | "failed";
}

const ATTEMPT_ROWS: PaymentAttemptRow[] = [
  {
    dateTime: "Oct 24, 14:32",
    addedBy: "Alan Lee",
    cardNetwork: "Visa 招行经典白金卡",
    method: "Contactless",
    status: "success"
  },
  {
    dateTime: "Oct 24, 14:28",
    addedBy: "Emma Lin",
    cardNetwork: "MasterCard 世界之极卡",
    method: "Insert",
    status: "declined"
  },
  {
    dateTime: "Oct 24, 13:12",
    addedBy: "Sam Johnson",
    cardNetwork: "银联中信万豪联名金卡",
    method: "Swipe",
    status: "success"
  },
  {
    dateTime: "Oct 24, 11:45",
    addedBy: "Maria Chen",
    cardNetwork: "Visa 汇丰瑞玺卡",
    method: "Apple Pay",
    status: "success"
  },
  {
    dateTime: "Oct 24, 10:02",
    addedBy: "David Kim",
    cardNetwork: "Amex 百夫长黑金卡",
    method: "Google Pay",
    status: "failed"
  }
];

interface ReviewItem {
  initials: string;
  name: string;
  time: string;
  content: string;
}

const REVIEW_ITEMS: ReviewItem[] = [
  {
    initials: "AL",
    name: "Alex Lee",
    time: "Oct 24, 14:32",
    content: "The payment process was very smooth, no issues at all using international Visa. Staff was also helpful when the first tap didn't trigger immediately."
  },
  {
    initials: "EL",
    name: "Emma Lin",
    time: "Oct 19, 16:22",
    content: "Customer requested DCC for their UK card. We had a bit of confusion regarding the actual conversion rate displayed on the terminal screen compared to what they expected, but after reading the prompt carefully, they agreed. The transaction went through eventually."
  },
  {
    initials: "SJ",
    name: "Sam Johnson",
    time: "Oct 21, 18:40",
    content: "Tried to use Discover, declined. Switched to Alipay."
  },
  {
    initials: "MC",
    name: "Maria Chen",
    time: "Oct 23, 09:15",
    content: "My Apple Pay took a bit longer than usual to process. The customer was staring at their phone, and the terminal timed out. So we tried a second time, and it worked."
  },
  {
    initials: "DK",
    name: "David Kim",
    time: "Oct 20, 12:15",
    content: "Terminal connection dropped during the lunch rush. We had to restart the POS machine which took about 2 minutes."
  },
  {
    initials: "RW",
    name: "Rachel Wang",
    time: "Oct 18, 10:05",
    content: "Refund process was completely seamless. Done."
  }
];

const DETAIL_TABS: Array<{ key: DetailContentTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "attempt", label: "Attempt" },
  { key: "reviews", label: "Reviews" }
];

function StatusPill({
  label,
  kind = "supported"
}: {
  label: string;
  kind?: "supported" | "unknown" | "limited" | "declined";
}): React.JSX.Element {
  const { t } = useI18n();
  const cls =
    kind === "supported"
      ? "bg-[var(--color-success)] text-[var(--color-success-foreground)]"
      : kind === "declined"
        ? "bg-[var(--color-warning)] text-[var(--color-warning-foreground)]"
        : kind === "limited"
          ? "bg-[#FFBFB2] text-[#590F00]"
          : "bg-[var(--secondary)] text-[var(--secondary-foreground)]";

  return (
    <span className={`inline-flex h-8 items-center justify-center rounded-pill px-3 text-sm font-medium leading-[1.142857] ${cls}`}>
      {t(label)}
    </span>
  );
}

function SectionHeader({
  title,
  buttonLabel,
  onAction
}: {
  title: string;
  buttonLabel: string;
  onAction: () => void;
}): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[20px] font-bold leading-[1.2] tracking-[-0.2px] text-[var(--foreground)]">{t(title)}</h3>
      <button
        className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)]"
        onClick={onAction}
        type="button"
      >
        <Settings2 className="h-4 w-4" />
        <span>{t(buttonLabel)}</span>
      </button>
    </div>
  );
}

function OverviewContent({
  showUnknownNetworksOnly,
  showLimitedCvmOnly,
  onToggleUnknownNetworks,
  onToggleLimitedCvm
}: {
  showUnknownNetworksOnly: boolean;
  showLimitedCvmOnly: boolean;
  onToggleUnknownNetworks: () => void;
  onToggleLimitedCvm: () => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const networkRows = showUnknownNetworksOnly ? NETWORK_ROWS.filter((row) => row.status === "unknown") : NETWORK_ROWS;
  const cvmRows = showLimitedCvmOnly ? CVM_ROWS.filter((row) => row.status === "limited") : CVM_ROWS;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <article className="flex min-w-0 flex-col rounded-[40px] border border-[var(--input)] bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-medium leading-[1.4] text-[var(--muted-foreground)]">{t("Auth Success Rate (7d)")}</p>
          <TrendingUp className="h-5 w-5 text-[#008A00]" />
        </div>
        <p className="mt-4 text-[48px] font-bold leading-[1.05] tracking-[-1px] text-[#006600]">98.4%</p>
        <div className="mt-4 flex items-center gap-2">
          <StatusPill label="Healthy" />
          <p className="text-[13px] leading-[1.3] text-[var(--muted-foreground)]">{t("Higher than avg. (92%)")}</p>
        </div>
      </article>

      <article className="flex min-w-0 flex-col rounded-[40px] border border-[var(--input)] bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-medium leading-[1.4] text-[var(--muted-foreground)]">{t("Device Status")}</p>
          <Radio className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <p className="mt-4 text-[48px] font-bold leading-[1.05] tracking-[-1px] text-[var(--foreground)]">{t("Stable")}</p>
        <div className="mt-4 flex items-center gap-2">
          <StatusPill label="Verified" />
          <p className="text-[13px] leading-[1.3] text-[var(--muted-foreground)]">{t("Uptime: 4,213 hrs seamless")}</p>
        </div>
      </article>

      <article className="rounded-[40px] border border-[var(--input)] bg-white p-8 xl:col-span-1">
        <SectionHeader
          buttonLabel={showUnknownNetworksOnly ? "Show All" : "Unknown Only"}
          onAction={onToggleUnknownNetworks}
          title="Supported Networks"
        />

        <div className="mt-6 flex flex-col">
          {networkRows.map((row, idx) => (
            <div
              className={`flex min-h-[64px] items-center justify-between gap-3 py-4 ${idx !== networkRows.length - 1 ? "border-b border-[var(--input)]" : ""}`}
              key={row.name}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#F5F5F7]">
                  <CreditCard className="h-4 w-4 text-[var(--foreground)]" />
                </span>
                <span className="truncate text-base font-semibold leading-[1.2] text-[var(--foreground)]">{row.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {row.tags?.map((tag) => <StatusPill key={tag} label={tag} />)}
                {!row.tags ? <StatusPill kind={row.status === "unknown" ? "unknown" : "supported"} label={row.status === "unknown" ? "Unknown" : "Supported"} /> : null}
              </div>
            </div>
          ))}
          {networkRows.length === 0 ? <p className="py-6 text-sm text-[var(--muted-foreground)]">{t("No network matched current filter.")}</p> : null}
        </div>
      </article>

      <article className="rounded-[40px] border border-[var(--input)] bg-white p-8 xl:col-span-1">
        <SectionHeader
          buttonLabel={showLimitedCvmOnly ? "Show All" : "Limited Only"}
          onAction={onToggleLimitedCvm}
          title="Common CVM Methods"
        />

        <div className="mt-6 flex flex-col">
          {cvmRows.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div
                className={`flex min-h-[64px] items-center justify-between gap-3 py-4 ${idx !== cvmRows.length - 1 ? "border-b border-[var(--input)]" : ""}`}
                key={row.name}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#F5F5F7]">
                    <Icon className="h-4 w-4 text-[var(--foreground)]" />
                  </span>
                  <span className="truncate text-base font-semibold leading-[1.2] text-[var(--foreground)]">{row.name}</span>
                </div>
                <StatusPill kind={row.status} label={row.status === "limited" ? "Limited" : "Supported"} />
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function AttemptContent({
  attemptRows,
  attemptPage,
  onAddAttempt,
  onPageChange
}: {
  attemptRows: PaymentAttemptRow[];
  attemptPage: number;
  onAddAttempt: () => void;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(attemptRows.length / pageSize));
  const currentPage = Math.min(attemptPage, pageCount);
  const currentRows = attemptRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const successCount = attemptRows.filter((row) => row.status === "success").length;
  const failedCount = attemptRows.length - successCount;
  const successRate = attemptRows.length > 0 ? ((successCount / attemptRows.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[20px] font-bold leading-[1.2] tracking-[-0.2px] text-[var(--foreground)]">{t("Payment Attempts")}</h3>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] px-6 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
            onClick={onAddAttempt}
            type="button"
          >
            <Plus className="h-5 w-5" />
            <span>{t("Add")}</span>
          </button>
        </div>
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.04em] text-[#A1A1AA]">{t("Total Attempts")}</p>
            <p className="text-lg font-semibold leading-[1.2] text-[var(--foreground)]">{attemptRows.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.04em] text-[#A1A1AA]">{t("Success / Failed")}</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-base font-semibold text-[var(--foreground)]">
                <CircleCheck className="h-[14px] w-[14px] text-[var(--color-success-foreground)]" />
                {successCount}
              </span>
              <span className="inline-flex items-center gap-1 text-base font-semibold text-[var(--foreground)]">
                <CircleX className="h-[14px] w-[14px] text-[#590F00]" />
                {failedCount}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.04em] text-[#A1A1AA]">{t("Success Rate")}</p>
            <p className="text-lg font-semibold leading-[1.2] text-[var(--foreground)]">{successRate}%</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E2E8] bg-white">
        <div className="flex items-center gap-4 border-b border-[#E2E2E8] bg-[#F9F9FB] px-6 py-4">
          <p className="w-[140px] text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">{t("Date & Time")}</p>
          <p className="w-[140px] text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">{t("Added By")}</p>
          <p className="w-[180px] text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">{t("Card & Network")}</p>
          <p className="w-[120px] text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">{t("Method")}</p>
          <p className="w-[120px] text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">{t("Status")}</p>
          <p className="w-[80px] text-right text-[13px] font-semibold leading-[1.2] text-[var(--muted-foreground)]">&nbsp;</p>
        </div>

        {currentRows.map((row, idx) => (
          <div className={`flex items-center gap-4 px-6 py-4 ${idx !== currentRows.length - 1 ? "border-b border-[#E2E2E8]" : ""}`} key={`${row.dateTime}-${row.addedBy}-${row.method}-${idx}`}>
            <p className="w-[140px] text-[13px] font-medium leading-[1.2] text-[var(--foreground)]">{row.dateTime}</p>
            <p className="w-[140px] text-[13px] font-medium leading-[1.2] text-[var(--muted-foreground)]">{row.addedBy}</p>
            <p className="w-[180px] truncate text-[13px] font-medium leading-[1.2] text-[var(--foreground)]">{row.cardNetwork}</p>
            <p className="w-[120px] text-[13px] font-medium leading-[1.2] text-[var(--muted-foreground)]">{t(row.method)}</p>
            <div className="w-[120px]">
              <StatusPill kind={row.status === "declined" ? "declined" : row.status === "failed" ? "limited" : "supported"} label={row.status === "success" ? "Success" : row.status === "declined" ? "Declined" : "Failed"} />
            </div>
            <div className="flex w-[80px] justify-end">
              <ChevronRight className="h-4 w-4 text-[#A1A1AA]" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-4">
        <p className="text-[13px] leading-[1.2] text-[var(--muted-foreground)]">
          {t("Showing")} {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, attemptRows.length)} {t("of")} {attemptRows.length} {t("attempts")}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="ui-hover-shadow inline-flex h-10 items-center rounded-pill border border-[var(--input)] px-4 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            type="button"
          >
            {t("Previous")}
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              className={`ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-pill border text-sm font-medium ${
                page === currentPage
                  ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                  : "border-[var(--input)] text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
              }`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className="ui-hover-shadow inline-flex h-10 items-center rounded-pill border border-[var(--input)] px-4 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] disabled:opacity-50"
            disabled={currentPage === pageCount}
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            type="button"
          >
            {t("Next")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewsContent({
  reviewItems,
  onAddReview
}: {
  reviewItems: ReviewItem[];
  onAddReview: () => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const leftReviews = reviewItems.filter((_, idx) => idx % 2 === 0);
  const rightReviews = reviewItems.filter((_, idx) => idx % 2 === 1);

  const renderReviewCard = (item: ReviewItem) => (
    <article className="rounded-2xl border border-[#E2E2E8] bg-white p-6" key={`${item.name}-${item.time}-${item.content}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E2E2E8] text-sm font-semibold text-[var(--muted-foreground)]">{item.initials}</span>
          <p className="truncate text-[15px] font-semibold leading-[1.2] text-[var(--foreground)]">{t(item.name)}</p>
        </div>
        <p className="shrink-0 text-[13px] leading-[1.2] text-[#A1A1AA]">{item.time}</p>
      </div>
      <p className="mt-4 text-sm leading-[1.6] text-[var(--foreground)]">{t(item.content)}</p>
    </article>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[20px] font-bold leading-[1.2] tracking-[-0.2px] text-[var(--foreground)]">{t("Reviews")}</h3>
        <button
          className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] px-6 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
          onClick={onAddReview}
          type="button"
        >
          <Plus className="h-5 w-5" />
          <span>{t("Add")}</span>
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">{leftReviews.map(renderReviewCard)}</div>
        <div className="flex min-w-0 flex-col gap-6">{rightReviews.map(renderReviewCard)}</div>
      </div>
    </div>
  );
}

interface PlaceDetailWebProps {
  onViewMap?: () => void;
}

export function PlaceDetailWeb({ onViewMap }: PlaceDetailWebProps): React.JSX.Element {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DetailContentTab>("overview");
  const [editable, setEditable] = useState(false);
  const [locationName, setLocationName] = useState("GT Land Plaza");
  const [locationAddress, setLocationAddress] = useState("Huangpu Ave West, Tianhe District, Guangzhou, GD");
  const [locationMeta, setLocationMeta] = useState("Acquirer: Global Payments  •  Location: B1 Front Desk  •  POS: Ingenico Move/5000");
  const [showUnknownNetworksOnly, setShowUnknownNetworksOnly] = useState(false);
  const [showLimitedCvmOnly, setShowLimitedCvmOnly] = useState(false);
  const [attemptRows, setAttemptRows] = useState(ATTEMPT_ROWS);
  const [attemptPage, setAttemptPage] = useState(1);
  const [reviewItems, setReviewItems] = useState(REVIEW_ITEMS);

  useEffect(() => {
    const pageSize = 5;
    const pageCount = Math.max(1, Math.ceil(attemptRows.length / pageSize));
    if (attemptPage > pageCount) {
      setAttemptPage(pageCount);
    }
  }, [attemptRows.length, attemptPage]);

  const addAttempt = (): void => {
    const now = new Date();
    const statuses: Array<PaymentAttemptRow["status"]> = ["success", "declined", "failed"];
    const methods = ["Contactless", "Insert", "Swipe", "Apple Pay", "Google Pay"];
    const nextIndex = attemptRows.length + 1;
    const newAttempt: PaymentAttemptRow = {
      dateTime: now.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }),
      addedBy: "Current User",
      cardNetwork: `Visa Test Card ${nextIndex}`,
      method: methods[nextIndex % methods.length],
      status: statuses[nextIndex % statuses.length]
    };
    setAttemptRows((prev) => [newAttempt, ...prev]);
    setAttemptPage(1);
  };

  const addReview = (): void => {
    const now = new Date();
    const nextIndex = reviewItems.length + 1;
    const newReview: ReviewItem = {
      initials: "NU",
      name: "New User",
      time: now.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }),
      content: `New feedback #${nextIndex}: payment flow validated successfully.`
    };
    setReviewItems((prev) => [newReview, ...prev]);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-auto bg-[#FAFAFA] px-12 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            {editable ? (
              <input
                className="h-11 min-w-[320px] rounded-pill border border-[var(--input)] px-4 text-[32px] font-bold leading-[1.1] tracking-[-0.5px] text-[var(--foreground)] outline-none"
                onChange={(event) => setLocationName(event.target.value)}
                type="text"
                value={locationName}
              />
            ) : (
              <h1 className="truncate text-[32px] font-bold leading-[1.1] tracking-[-0.5px] text-[var(--foreground)]">{locationName}</h1>
            )}
            <StatusPill label="Active" />
          </div>
          {editable ? (
            <>
              <input
                className="h-10 w-full rounded-pill border border-[var(--input)] px-4 text-sm leading-[1.4] text-[var(--foreground)] outline-none"
                onChange={(event) => setLocationAddress(event.target.value)}
                type="text"
                value={locationAddress}
              />
              <input
                className="h-10 w-full rounded-pill border border-[var(--input)] px-4 text-sm leading-[1.4] text-[var(--foreground)] outline-none"
                onChange={(event) => setLocationMeta(event.target.value)}
                type="text"
                value={locationMeta}
              />
            </>
          ) : (
            <>
              <p className="text-sm leading-[1.4] text-[var(--muted-foreground)]">{locationAddress}</p>
              <p className="text-sm leading-[1.4] text-[var(--muted-foreground)]">{locationMeta}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--secondary)] px-4 text-sm font-medium leading-[1.4286] text-[var(--secondary-foreground)] transition-colors duration-200 hover:bg-[var(--secondary-hover)]"
            onClick={() => setEditable((prev) => !prev)}
            type="button"
          >
            <Edit2 className="h-4 w-4" />
            <span>{editable ? t("Save Details") : t("Edit Details")}</span>
          </button>
          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--primary)] px-4 text-sm font-medium leading-[1.4286] text-[var(--primary-foreground)] transition-colors duration-200 hover:bg-[var(--primary-hover)]"
            onClick={() => onViewMap?.()}
            type="button"
          >
            <MapPin className="h-4 w-4" />
            <span>{t("View on Map")}</span>
          </button>
        </div>
      </header>

      <div className="border-b border-[var(--input)] pb-4">
        <TabsWarp
          items={DETAIL_TABS.map((tab) => ({
            key: tab.key,
            label: t(tab.label)
          }))}
          onValueChange={setActiveTab}
          value={activeTab}
        />
      </div>

      {activeTab === "overview" ? (
        <OverviewContent
          onToggleLimitedCvm={() => setShowLimitedCvmOnly((prev) => !prev)}
          onToggleUnknownNetworks={() => setShowUnknownNetworksOnly((prev) => !prev)}
          showLimitedCvmOnly={showLimitedCvmOnly}
          showUnknownNetworksOnly={showUnknownNetworksOnly}
        />
      ) : null}
      {activeTab === "attempt" ? (
        <AttemptContent attemptPage={attemptPage} attemptRows={attemptRows} onAddAttempt={addAttempt} onPageChange={setAttemptPage} />
      ) : null}
      {activeTab === "reviews" ? <ReviewsContent onAddReview={addReview} reviewItems={reviewItems} /> : null}
    </section>
  );
}
