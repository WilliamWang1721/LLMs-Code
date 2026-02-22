export type ViewMode = "map" | "list" | "brands";

export type LocationStatus = "active" | "inactive";

export interface LocationRecord {
  id: string;
  name: string;
  brand: string;
  bin: string;
  city: string;
  status: LocationStatus;
  lat: number;
  lng: number;
}
