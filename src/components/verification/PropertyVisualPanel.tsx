import type { PropertyMedia } from "@/lib/types/verification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MapPin, Image } from "lucide-react";

interface PropertyVisualPanelProps {
  media: PropertyMedia[];
}

export function PropertyVisualPanel({ media }: PropertyVisualPanelProps) {
  const map = media.find((m) => m.mediaType === "static_map");
  const street = media.find((m) => m.mediaType === "street_view");
  const county = media.find((m) => m.mediaType === "county_photo");
  const screenshot = media.find((m) => m.mediaType === "source_screenshot");

  if (media.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Property Visuals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {county && <MediaTile media={county} label="View Property Photo" />}
          {map && <MediaTile media={map} label="View Map" />}
          {street && <MediaTile media={street} label="Street View" />}
          {screenshot && <MediaTile media={screenshot} label="Source Screenshot" />}
        </div>
        <p className="text-xs text-slate-500">
          Attribution is required and always shown. EstateLeadOS stores source and retrieval time for each image.
        </p>
      </CardContent>
    </Card>
  );
}

function MediaTile({ media, label }: { media: PropertyMedia; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.mediaUrl}
        alt={label}
        className="h-44 w-full object-cover sm:h-40"
      />
      <div className="space-y-1 p-3 text-xs">
        <p className="font-medium text-slate-200">{label}</p>
        <p className="text-slate-500">{media.sourceName}</p>
        {media.attribution && <p className="text-slate-500">{media.attribution}</p>}
        <p className="text-slate-500">Retrieved {new Date(media.retrievedAt).toLocaleString()}</p>
        <a
          href={media.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
        >
          <Image className="h-3 w-3" />
          Open full image
        </a>
      </div>
    </div>
  );
}
