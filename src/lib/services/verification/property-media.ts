import type { PropertyMedia } from "@/lib/types/verification";

function encodeAddress(address: string): string {
  return encodeURIComponent(address.trim());
}

export function buildStaticMapMedia(
  leadId: string,
  organizationId: string,
  propertyAddress: string,
  propertyId?: string | null
): PropertyMedia {
  const now = new Date().toISOString();
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const encoded = encodeAddress(propertyAddress);

  let mediaUrl: string;
  let sourceName: string;
  let attribution: string;

  if (googleKey) {
    mediaUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=16&size=600x400&markers=color:red|${encoded}&key=${googleKey}`;
    sourceName = "Google Static Maps";
    attribution = "© Google";
  } else if (mapboxToken) {
    mediaUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+285A98(${encoded})/${encoded},14,0/600x400@2x?access_token=${mapboxToken}`;
    sourceName = "Mapbox Static Maps";
    attribution = "© Mapbox © OpenStreetMap";
  } else {
    mediaUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encoded}&zoom=16&size=600x400&markers=${encoded}`;
    sourceName = "OpenStreetMap Static Map";
    attribution = "© OpenStreetMap contributors";
  }

  return {
    id: `media-map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId,
    leadId,
    propertyId: propertyId ?? null,
    mediaType: "static_map",
    mediaUrl,
    sourceName,
    sourceUrl: mediaUrl,
    attribution,
    retrievedAt: now,
    createdAt: now,
  };
}

export function buildStreetViewMedia(
  leadId: string,
  organizationId: string,
  propertyAddress: string,
  propertyId?: string | null
): PropertyMedia | null {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) return null;

  const now = new Date().toISOString();
  const mediaUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeAddress(propertyAddress)}&key=${googleKey}`;

  return {
    id: `media-street-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId,
    leadId,
    propertyId: propertyId ?? null,
    mediaType: "street_view",
    mediaUrl,
    sourceName: "Google Street View",
    sourceUrl: mediaUrl,
    attribution: "© Google Street View",
    retrievedAt: now,
    createdAt: now,
  };
}

export function buildSourceScreenshotMedia(
  leadId: string,
  organizationId: string,
  screenshotUrl: string,
  sourceName: string,
  sourceUrl: string
): PropertyMedia {
  const now = new Date().toISOString();
  return {
    id: `media-screenshot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId,
    leadId,
    propertyId: null,
    mediaType: "source_screenshot",
    mediaUrl: screenshotUrl,
    sourceName,
    sourceUrl,
    attribution: sourceName,
    retrievedAt: now,
    createdAt: now,
  };
}
