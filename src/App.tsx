import type React from "react";
import { useState } from "react";

import { FluxaHeader } from "@/components/fluxa-header";
import { FluxaMapCanvas } from "@/components/fluxa-map-canvas";
import { FluxaSidebar, type SidebarTab } from "@/components/fluxa-sidebar";

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SidebarTab>("list");
  const isFullCanvasPage = activeTab === "profile" || activeTab === "history";

  return (
    <div className="h-screen w-screen bg-[var(--background)] font-sans text-[var(--foreground)]">
      <main className="flex h-full w-full min-w-0 bg-[var(--background)]">
        <FluxaSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <section className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          {!isFullCanvasPage ? <FluxaHeader activeTab={activeTab} /> : null}

          <div className="flex min-h-0 w-full flex-1">
            <div className="tab-switch-enter flex min-h-0 w-full flex-1" key={activeTab}>
              <FluxaMapCanvas activeTab={activeTab} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
