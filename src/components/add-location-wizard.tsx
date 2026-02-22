import { useState } from "react";
import type React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  Clock3,
  CreditCard,
  Globe,
  Hash,
  HelpCircle,
  LocateFixed,
  MapPinned,
  MinusCircle,
  Nfc,
  PenTool,
  PlayCircle,
  ScanFace,
  Smartphone,
  StopCircle,
  User,
  Wallet,
  Wifi,
  Wrench,
  XCircle
} from "lucide-react";

import { useI18n } from "@/i18n";

type WizardStep = 1 | 2 | 3;

interface AddLocationWizardProps {
  onCancel: () => void;
  onComplete: () => void;
}

const STEP_SUBTITLE: Record<WizardStep, string> = {
  1: "Step 1 of 3: Base Information",
  2: "Step 2 of 3: Transaction Record",
  3: "Step 3 of 3: Device & Acquirer Information"
};

const BRAND_OPTIONS = ["McDonald's", "Starbucks", "KFC", "Subway", "UNIQLO"];
const NETWORK_OPTIONS = ["Visa", "MasterCard", "UnionPay", "American Express", "Discover", "JCB"];
const YEAR_OPTIONS = ["2024", "2025", "2026", "2027", "2028"];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const ACQUIRER_OPTIONS = ["Lakala (拉卡拉)", "Global Payments", "Fiserv", "Adyen", "Stripe"];
const POS_MODEL_OPTIONS = ["Ingenico Move 5000", "Verifone V200c", "PAX A920", "Sunmi P2"];

function CardFrame({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  const { t } = useI18n();

  return (
    <article className="rounded-m border border-[var(--border)] bg-[var(--card)] p-6">
      <h3 className="text-lg font-semibold leading-[1.2] text-[var(--foreground)]">{t(title)}</h3>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </article>
  );
}

function Field({
  label,
  placeholder,
  isSelect = false,
  multiline = false,
  options = []
}: {
  label: string;
  placeholder: string;
  isSelect?: boolean;
  multiline?: boolean;
  options?: string[];
}): React.JSX.Element {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const hasValue = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium leading-[1.35] text-[var(--foreground)]">{t(label)}</p>
      <div className={`flex items-center gap-2 border border-[var(--border)] bg-[var(--accent)] px-6 text-sm ${multiline ? "rounded-m py-3" : "rounded-pill py-4"}`}>
        {isSelect ? (
          <>
            <select
              className={`h-6 w-full appearance-none bg-transparent outline-none ${hasValue ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              onChange={(event) => setValue(event.target.value)}
              value={value}
            >
              <option value="">{t(placeholder)}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          </>
        ) : multiline ? (
          <textarea
            className="w-full resize-none bg-transparent text-sm leading-[1.35] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            onChange={(event) => setValue(event.target.value)}
            placeholder={t(placeholder)}
            rows={3}
            value={value}
          />
        ) : (
          <input
            className="w-full bg-transparent text-sm leading-[1.35] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            onChange={(event) => setValue(event.target.value)}
            placeholder={t(placeholder)}
            type="text"
            value={value}
          />
        )}
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const { t } = useI18n();

  return (
    <button
      aria-pressed={active}
      className={`ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill px-4 text-sm font-medium leading-[1.4286] transition-colors duration-200 ${
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] [--hover-outline:#4134cc73]"
          : "border border-[var(--input)] bg-white text-[var(--foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      <span>{t(label)}</span>
    </button>
  );
}

function StepOneContent(): React.JSX.Element {
  const { t } = useI18n();
  const [locationTitle, setLocationTitle] = useState("McDonald's (GT Land Plaza)");
  const [locationAddress, setLocationAddress] = useState("No. 85 Huacheng Ave, Tianhe District, Guangzhou");
  const [locateCount, setLocateCount] = useState(0);

  const handleLocate = (): void => {
    const nextCount = locateCount + 1;
    setLocateCount(nextCount);
    setLocationTitle(`${t("Pinned Location")} #${nextCount}`);
    setLocationAddress(`${t("Auto-located around Tianhe District")} · ${nextCount} ${t(nextCount > 1 ? "times" : "time")}`);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-8 px-12 pb-8 pt-6">
      <div className="flex w-[440px] shrink-0 flex-col gap-6">
        <CardFrame title="Basic Information & Address">
          <Field label="Merchant Name" placeholder="e.g. McDonald's" />
          <Field label="Address" placeholder="Select on map" />
        </CardFrame>

        <CardFrame title="Billing Settings">
          <Field label="Statement Descriptor" placeholder="e.g. McDonald's Beijing" />
          <Field label="MCC Code" placeholder="e.g. 5812" />
          <Field isSelect label="Brand" options={BRAND_OPTIONS} placeholder="Select brand" />
        </CardFrame>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-m border border-[var(--border)] bg-[var(--card)]">
        <div className="absolute left-6 top-6 z-10 rounded-m border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-[13px] font-medium leading-[1.3] text-[var(--muted-foreground)]">{t("Selected Location")}</p>
          <p className="mt-1 text-base font-semibold leading-[1.2] text-[var(--foreground)]">{locationTitle}</p>
          <p className="mt-1 text-[13px] leading-[1.3] text-[var(--muted-foreground)]">{locationAddress}</p>
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-2">
          <MapPinned className="h-11 w-11 text-[var(--muted-foreground)]" />
          <h3 className="text-[22px] font-bold leading-[1.2] text-[var(--foreground)]">{t("AMap Live Layer")}</h3>
          <p className="max-w-[520px] px-4 text-center text-[13px] leading-[1.35] text-[var(--muted-foreground)]">
            {t("Cluster / marker click / double-click to create Location with prefilled coordinate and address.")}
          </p>
        </div>

        <div className="absolute bottom-6 right-6">
          <button
            className="ui-hover-shadow inline-flex h-10 w-10 items-center justify-center rounded-m border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            onClick={handleLocate}
            type="button"
          >
            <LocateFixed className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepTwoContent(): React.JSX.Element {
  const [transactionStatus, setTransactionStatus] = useState("Success");
  const [cvm, setCvm] = useState("PIN");
  const [paymentMethod, setPaymentMethod] = useState("Apple Pay");
  const [acquirerMode, setAcquirerMode] = useState("DCC");
  const [walletSelected, setWalletSelected] = useState(false);

  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 px-16 pb-8 pt-10 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        <CardFrame title="1. Transaction Status">
          <div className="flex flex-wrap gap-3">
            <Chip active={transactionStatus === "Success"} icon={CheckCircle} label="Success" onClick={() => setTransactionStatus("Success")} />
            <Chip active={transactionStatus === "Fault"} icon={XCircle} label="Fault" onClick={() => setTransactionStatus("Fault")} />
            <Chip active={transactionStatus === "Unknown"} icon={HelpCircle} label="Unknown" onClick={() => setTransactionStatus("Unknown")} />
          </div>
        </CardFrame>

        <CardFrame title="2. Card Info">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <Field isSelect label="Network" options={NETWORK_OPTIONS} placeholder="Visa" />
            <Field label="Card Info / Token" placeholder="e.g. •••• 4242" />
          </div>
          <div className="pt-1">
            <Chip active={walletSelected} icon={Wallet} label="Select from Wallet" onClick={() => setWalletSelected((prev) => !prev)} />
          </div>
        </CardFrame>

        <CardFrame title="3. CVM Validation">
          <div className="flex flex-wrap gap-3">
            <Chip active={cvm === "No CVM"} icon={MinusCircle} label="No CVM" onClick={() => setCvm("No CVM")} />
            <Chip active={cvm === "PIN"} icon={Hash} label="PIN" onClick={() => setCvm("PIN")} />
            <Chip active={cvm === "Signature"} icon={PenTool} label="Signature" onClick={() => setCvm("Signature")} />
          </div>
        </CardFrame>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <CardFrame title="4. Payment Method">
          <div className="flex flex-wrap gap-3">
            <Chip active={paymentMethod === "Apple Pay"} icon={Smartphone} label="Apple Pay" onClick={() => setPaymentMethod("Apple Pay")} />
            <Chip active={paymentMethod === "Google Pay"} icon={Smartphone} label="Google Pay" onClick={() => setPaymentMethod("Google Pay")} />
            <Chip active={paymentMethod === "Tap"} icon={Wifi} label="Tap" onClick={() => setPaymentMethod("Tap")} />
            <Chip active={paymentMethod === "Insert"} icon={CreditCard} label="Insert" onClick={() => setPaymentMethod("Insert")} />
            <Chip active={paymentMethod === "Swipe"} icon={CreditCard} label="Swipe" onClick={() => setPaymentMethod("Swipe")} />
            <Chip active={paymentMethod === "HCE"} icon={Nfc} label="HCE" onClick={() => setPaymentMethod("HCE")} />
          </div>
        </CardFrame>

        <CardFrame title="5. Transaction Time">
          <div className="grid grid-cols-3 gap-3">
            <Field isSelect label="Year" options={YEAR_OPTIONS} placeholder="2026" />
            <Field isSelect label="Month" options={MONTH_OPTIONS} placeholder="02" />
            <Field isSelect label="Day" options={DAY_OPTIONS} placeholder="22" />
          </div>
        </CardFrame>

        <CardFrame title="6. Acquirer Mode">
          <div className="flex flex-wrap gap-3">
            <Chip active={acquirerMode === "EDC"} icon={Building2} label="EDC" onClick={() => setAcquirerMode("EDC")} />
            <Chip active={acquirerMode === "DCC"} icon={Globe} label="DCC" onClick={() => setAcquirerMode("DCC")} />
            <Chip active={acquirerMode === "Unknown"} icon={HelpCircle} label="Unknown" onClick={() => setAcquirerMode("Unknown")} />
          </div>
        </CardFrame>
      </div>
    </div>
  );
}

function StepThreeContent(): React.JSX.Element {
  const { t } = useI18n();
  const [deviceStatus, setDeviceStatus] = useState<"Active" | "Inactive">("Inactive");
  const [inactiveReason, setInactiveReason] = useState("Temporary Unavailable");
  const [checkoutMode, setCheckoutMode] = useState("Staffed Checkout");

  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 px-16 pb-8 pt-10 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        <CardFrame title="1. Device Status">
          <div className="flex flex-wrap gap-3">
            <Chip active={deviceStatus === "Active"} icon={PlayCircle} label="Active" onClick={() => setDeviceStatus("Active")} />
            <Chip active={deviceStatus === "Inactive"} icon={StopCircle} label="Inactive" onClick={() => setDeviceStatus("Inactive")} />
          </div>

          {deviceStatus === "Inactive" ? (
            <>
              <p className="text-xs font-medium leading-[1.3] text-[var(--muted-foreground)]">{t("↳ Please select Inactive Reason:")}</p>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-3">
                  <Chip
                    active={inactiveReason === "Temporary Unavailable"}
                    icon={Clock3}
                    label="Temporary Unavailable"
                    onClick={() => setInactiveReason("Temporary Unavailable")}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Chip active={inactiveReason === "Maintenance (维修)"} icon={Wrench} label="Maintenance (维修)" onClick={() => setInactiveReason("Maintenance (维修)")} />
                  <Chip active={inactiveReason === "Unknown"} icon={HelpCircle} label="Unknown" onClick={() => setInactiveReason("Unknown")} />
                </div>
              </div>
            </>
          ) : null}
        </CardFrame>

        <CardFrame title="2. Acquirer">
          <Field isSelect label="Select Acquirer" options={ACQUIRER_OPTIONS} placeholder="Lakala (拉卡拉)" />
          <Field label="Custom Acquirer (Optional)" placeholder="Enter acquirer name if not in list..." />
        </CardFrame>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <CardFrame title="3. Checkout Info">
          <div className="flex flex-wrap gap-3">
            <Chip active={checkoutMode === "Staffed Checkout"} icon={User} label="Staffed Checkout" onClick={() => setCheckoutMode("Staffed Checkout")} />
            <Chip active={checkoutMode === "Self-checkout"} icon={ScanFace} label="Self-checkout" onClick={() => setCheckoutMode("Self-checkout")} />
          </div>
        </CardFrame>

        <CardFrame title="4. POS Configuration">
          <Field isSelect label="Select POS Model" options={POS_MODEL_OPTIONS} placeholder="Ingenico Move 5000" />
          <Field label="Custom POS Model (Optional)" placeholder="Enter model name if not in list..." />
        </CardFrame>

        <CardFrame title="5. Additional Remarks">
          <Field label="Notes / Internal Comments" multiline placeholder="Enter any additional information or internal notes here..." />
        </CardFrame>
      </div>
    </div>
  );
}

export function AddLocationWizard({ onCancel, onComplete }: AddLocationWizardProps): React.JSX.Element {
  const { t } = useI18n();
  const [step, setStep] = useState<WizardStep>(1);
  const isLastStep = step === 3;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 bg-[#FAFAFA] p-[18px]">
      <header className="flex items-center justify-between gap-3 px-10 py-3">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.4px] text-[var(--foreground)]">{t("Add Location")}</h1>
          <p className="text-sm leading-[1.4] text-[var(--muted-foreground)]">{t(STEP_SUBTITLE[step])}</p>
        </div>

        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] px-4 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
              onClick={() => setStep((prev) => (prev - 1) as WizardStep)}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("Previous")}</span>
            </button>
          ) : null}

          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill border border-[var(--input)] px-4 text-sm font-medium leading-[1.4286] text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)] [--hover-outline:#2a293333]"
            onClick={onCancel}
            type="button"
          >
            <Ban className="h-4 w-4" />
            <span>{t("Cancel")}</span>
          </button>

          <button
            className="ui-hover-shadow inline-flex h-10 items-center gap-1.5 rounded-pill bg-[var(--primary)] px-4 text-sm font-medium leading-[1.4286] text-[var(--primary-foreground)] transition-colors duration-200 hover:bg-[var(--primary-hover)] [--hover-outline:#4134cc73]"
            onClick={() => {
              if (isLastStep) {
                onComplete();
                return;
              }
              setStep((prev) => (prev + 1) as WizardStep);
            }}
            type="button"
          >
            {isLastStep ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            <span>{isLastStep ? t("Submit") : t("Next Step")}</span>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {step === 1 ? <StepOneContent /> : null}
        {step === 2 ? <StepTwoContent /> : null}
        {step === 3 ? <StepThreeContent /> : null}
      </div>
    </section>
  );
}
