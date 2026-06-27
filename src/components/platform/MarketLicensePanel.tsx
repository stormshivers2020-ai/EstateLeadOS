import { getSessionContext } from "@/lib/config/session";
import { isMarketLicensed } from "@/lib/engines/market-license-guard";
import { getMarketLicenses } from "@/lib/services/admin";
import { MARKET_ACCESS_MESSAGE } from "@/lib/types/platform";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const ACTIVE_STATUSES = new Set(["active", "trial"]);

export function MarketLicensePanel() {
  const session = getSessionContext();
  const licenses = getMarketLicenses().filter(
    (l) => l.organizationId === session.organizationId && ACTIVE_STATUSES.has(l.status)
  );

  if (licenses.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium">No active market licenses</p>
        <p className="mt-1">{MARKET_ACCESS_MESSAGE}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Licensed Markets ({licenses.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {licenses.map((l) => (
          <Badge key={l.id} variant="info">
            {l.state}
            {l.county ? ` · ${l.county}` : ""}
            {l.city ? ` · ${l.city}` : ""}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}

export function checkLeadMarketAccess(state: string, county?: string) {
  const session = getSessionContext();
  return isMarketLicensed(getMarketLicenses(), session.organizationId, state, county);
}
