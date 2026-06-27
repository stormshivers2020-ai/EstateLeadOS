import type { PlanId } from "@/lib/constants/plans";

export interface LocalPreviewOrganization {
  id: string;
  organizationName: string;
  planId: PlanId;
  activeStates: string[];
  activeCounties: string[];
  monthlyLeadLimit: number;
  monthlyImportLimit: number;
  monthlyExportLimit: number;
  buyerNetworkAccess: boolean;
  assignmentTrackerAccess: boolean;
  whiteLabelStatus: boolean;
  billingStatus: string;
  accountStatus: string;
}

export const LOCAL_PREVIEW_ORGANIZATIONS: LocalPreviewOrganization[] = [
  {
    id: "org-demo-scs",
    organizationName: "SCS Nova Demo Organization",
    planId: "team",
    activeStates: ["TX", "FL", "OH", "GA", "NC"],
    activeCounties: ["Harris, TX", "Duval, FL", "Franklin, OH"],
    monthlyLeadLimit: 2000,
    monthlyImportLimit: 500,
    monthlyExportLimit: 200,
    buyerNetworkAccess: true,
    assignmentTrackerAccess: true,
    whiteLabelStatus: false,
    billingStatus: "active",
    accountStatus: "active",
  },
  {
    id: "org-fresh-start",
    organizationName: "Fresh Start Organization",
    planId: "starter",
    activeStates: [],
    activeCounties: [],
    monthlyLeadLimit: 100,
    monthlyImportLimit: 25,
    monthlyExportLimit: 10,
    buyerNetworkAccess: false,
    assignmentTrackerAccess: false,
    whiteLabelStatus: false,
    billingStatus: "trial",
    accountStatus: "trial",
  },
  {
    id: "org-market-license",
    organizationName: "Market License Demo Organization",
    planId: "market_license",
    activeStates: ["TX", "AZ"],
    activeCounties: ["Harris, TX", "Maricopa, AZ"],
    monthlyLeadLimit: 10000,
    monthlyImportLimit: 2000,
    monthlyExportLimit: 500,
    buyerNetworkAccess: true,
    assignmentTrackerAccess: true,
    whiteLabelStatus: false,
    billingStatus: "active",
    accountStatus: "active",
  },
  {
    id: "org-enterprise",
    organizationName: "Enterprise Demo Organization",
    planId: "enterprise",
    activeStates: ["TX", "FL", "OH", "GA", "NC", "PA", "AZ"],
    activeCounties: [],
    monthlyLeadLimit: 50000,
    monthlyImportLimit: 10000,
    monthlyExportLimit: 5000,
    buyerNetworkAccess: true,
    assignmentTrackerAccess: true,
    whiteLabelStatus: true,
    billingStatus: "enterprise_invoice",
    accountStatus: "enterprise",
  },
];
