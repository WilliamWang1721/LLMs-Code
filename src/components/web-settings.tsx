import { useState } from "react";
import type React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

import { LANGUAGE_OPTIONS, type Language, useI18n } from "@/i18n";

interface WebSettingsProps {
  onExplore: () => void;
}

function Toggle({
  checked,
  onClick,
  ariaLabel
}: {
  checked: boolean;
  onClick: () => void;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <button
      aria-label={ariaLabel}
      className={`ui-hover-shadow relative inline-flex h-5 w-[34px] items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[var(--primary)]" : "bg-[#D9D9DB]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function SelectControl({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <div className="relative w-[220px]">
      <select
        className="h-8 w-full appearance-none rounded-pill border border-[var(--input)] bg-[var(--secondary)] px-3 pr-8 text-xs text-[var(--foreground)] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
    </div>
  );
}

function SettingRow({
  title,
  description,
  control
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-[1.3] text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-[11px] leading-[1.3] text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function WebSettings({ onExplore }: WebSettingsProps): React.JSX.Element {
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState("Auto (System Default)");
  const [locationPermission, setLocationPermission] = useState(true);
  const [showLocationNames, setShowLocationNames] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const themeOptions = [
    { value: "Auto (System Default)", label: t("Auto (System Default)") },
    { value: "Light", label: t("Light") },
    { value: "Dark", label: t("Dark") }
  ];

  return (
    <section className="tab-switch-enter flex min-h-0 min-w-0 flex-1 flex-col bg-[#FAFAFA] p-[18px]">
      <header className="flex items-center justify-between px-10 py-3">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold leading-[1.2] text-[var(--foreground)]">{t("Settings")}</h1>
          <p className="text-sm leading-[1.3] text-[var(--muted-foreground)]">{t("Manage your system preferences and billing configuration")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="ui-hover-shadow inline-flex h-8 items-center gap-1 rounded-pill border border-[var(--input)] bg-white px-3 text-xs font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--muted-hover)]"
            onClick={onExplore}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("Explore")}</span>
          </button>

          <button
            className="ui-hover-shadow inline-flex h-8 items-center gap-1 rounded-pill bg-[var(--primary)] px-3 text-xs font-medium text-[var(--primary-foreground)] transition-colors duration-200 hover:bg-[var(--primary-hover)]"
            onClick={() => setIsSaved(true)}
            type="button"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isSaved ? t("Saved") : t("Save Changes")}</span>
          </button>
        </div>
      </header>

      <div className="h-px w-full bg-[var(--input)]" />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-10 py-5">
        <article className="rounded-[24px] border border-[var(--input)] bg-white p-6">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--foreground)]">{t("Language & Interface")}</h2>
          <div className="mt-4 flex flex-col gap-4">
            <SettingRow
              control={
                <SelectControl
                  onChange={(value) => {
                    setTheme(value);
                    setIsSaved(false);
                  }}
                  options={themeOptions}
                  value={theme}
                />
              }
              description={t("Set your dashboard theme, light, dark and auto themes")}
              title={t("Theme")}
            />
            <SettingRow
              control={
                <SelectControl
                  onChange={(value) => {
                    setLanguage(value as Language);
                    setIsSaved(false);
                  }}
                  options={LANGUAGE_OPTIONS.map((option) => ({ label: option.label, value: option.code }))}
                  value={language}
                />
              }
              description=""
              title={t("Language")}
            />
          </div>
        </article>

        <article className="rounded-[24px] border border-[var(--input)] bg-white p-6">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--foreground)]">{t("Map Experience")}</h2>
          <div className="mt-4 flex flex-col gap-4">
            <SettingRow
              control={
                <Toggle
                  ariaLabel="Toggle location permission"
                  checked={locationPermission}
                  onClick={() => {
                    setLocationPermission((prev) => !prev);
                    setIsSaved(false);
                  }}
                />
              }
              description={t("Allow the app to access your location")}
              title={t("Location Permission")}
            />
            <SettingRow
              control={
                <Toggle
                  ariaLabel="Toggle show location names"
                  checked={showLocationNames}
                  onClick={() => {
                    setShowLocationNames((prev) => !prev);
                    setIsSaved(false);
                  }}
                />
              }
              description={t("Display the names of places on the map")}
              title={t("Show Location Names")}
            />
          </div>
        </article>

      </div>
    </section>
  );
}
