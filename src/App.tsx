import type React from "react";
import { useState } from "react";

import { AddLocationSuccess } from "@/components/add-location-success";
import { AddLocationWizard } from "@/components/add-location-wizard";
import { CardsAlbumWeb } from "@/components/cards-album-web";
import { FluxaHeader } from "@/components/fluxa-header";
import { FluxaMapCanvas } from "@/components/fluxa-map-canvas";
import { PlaceDetailWeb } from "@/components/place-detail-web";
import { FluxaSidebar, type SidebarTab } from "@/components/fluxa-sidebar";
import { WebSettings } from "@/components/web-settings";

type AppView = SidebarTab | "detail" | "cards" | "addLocation" | "addLocationSuccess" | "webSettings";
type ReturnView = SidebarTab | "detail";

function isSidebarTab(view: AppView | ReturnView): view is SidebarTab {
  return view === "map" || view === "list" || view === "brands" || view === "profile" || view === "history";
}

export default function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState<AppView>("list");
  const [returnView, setReturnView] = useState<ReturnView>("list");
  const [brandDraftCount, setBrandDraftCount] = useState(0);

  const openAddLocation = (): void => {
    if (isSidebarTab(activeView) || activeView === "detail") {
      setReturnView(activeView);
    }
    setActiveView("addLocation");
  };

  const openWebSettings = (): void => {
    if (isSidebarTab(activeView)) {
      setReturnView(activeView);
    } else if (activeView === "detail") {
      setReturnView(activeView);
    }
    setActiveView("webSettings");
  };

  const openCards = (): void => {
    if (isSidebarTab(activeView)) {
      setReturnView(activeView);
    }
    setActiveView("cards");
  };

  const sidebarActiveTab: SidebarTab = isSidebarTab(activeView) ? activeView : isSidebarTab(returnView) ? returnView : "list";

  const isFullCanvasPage = activeView === "profile" || activeView === "history";

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
      <main className="flex h-full w-full min-w-0 overflow-hidden bg-[var(--background)]">
        <FluxaSidebar
          activeTab={sidebarActiveTab}
          onAddBrand={() => setBrandDraftCount((prev) => prev + 1)}
          onAddLocation={openAddLocation}
          onOpenAlbum={openCards}
          onOpenSettings={openWebSettings}
          onTabChange={setActiveView}
        />

        {activeView === "detail" ? (
          <div className="tab-switch-enter flex min-h-0 min-w-0 flex-1">
            <PlaceDetailWeb onViewMap={() => setActiveView("map")} />
          </div>
        ) : null}

        {activeView === "addLocation" ? (
          <div className="tab-switch-enter flex min-h-0 min-w-0 flex-1">
            <AddLocationWizard onCancel={() => setActiveView(returnView)} onComplete={() => setActiveView("addLocationSuccess")} />
          </div>
        ) : null}

        {activeView === "addLocationSuccess" ? (
          <div className="tab-switch-enter flex min-h-0 min-w-0 flex-1">
            <AddLocationSuccess onAddAnother={() => setActiveView("addLocation")} onBack={() => setActiveView(returnView)} onViewDetail={() => setActiveView("detail")} />
          </div>
        ) : null}

        {activeView === "webSettings" ? (
          <div className="tab-switch-enter flex min-h-0 min-w-0 flex-1">
            <WebSettings onExplore={() => setActiveView("map")} />
          </div>
        ) : null}

        {activeView === "cards" ? (
          <div className="tab-switch-enter flex min-h-0 min-w-0 flex-1">
            <CardsAlbumWeb />
          </div>
        ) : null}

        {isSidebarTab(activeView) ? (
          <section className="flex min-w-0 flex-1 flex-col gap-2 p-4">
            {!isFullCanvasPage ? <FluxaHeader activeTab={activeView} /> : null}

            <div className="flex min-h-0 w-full flex-1">
              <div className="tab-switch-enter flex min-h-0 w-full flex-1" key={activeView}>
                <FluxaMapCanvas activeTab={activeView} brandDraftCount={brandDraftCount} onOpenDetail={() => setActiveView("detail")} />
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
