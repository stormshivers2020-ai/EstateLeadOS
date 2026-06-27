export interface ErrorStateDefinition {
  id: string;
  title: string;
  message: string;
  nextActions: string[];
  linkHref?: string;
  linkLabel?: string;
  supportTicket?: boolean;
}

export const ERROR_STATES: ErrorStateDefinition[] = [
  { id: "data_source_unavailable", title: "Data Source Unavailable", message: "The selected data source is temporarily unavailable or not approved for automated access.", nextActions: ["Try CSV import", "Check data source status", "Contact SCS Nova"], linkHref: "/market-search", linkLabel: "View Data Sources" },
  { id: "county_not_supported", title: "County Not Supported", message: "This county is not currently enabled for automated data access. You may use CSV import or manual research.", nextActions: ["Open CSV Import", "View County Status", "Contact SCS Nova"], linkHref: "/market-search", linkLabel: "Market Search" },
  { id: "state_research_only", title: "State Research-Only Access", message: "This state is configured for research-only access. Automated connectors are disabled.", nextActions: ["Use manual research", "Import CSV", "Contact SCS Nova"], linkHref: "/state-deal-kits", linkLabel: "State Deal Kits" },
  { id: "missing_lead_fields", title: "Missing Lead Fields", message: "Required lead fields are incomplete. Review the source record and add missing information.", nextActions: ["Open Lead Detail", "Review source records", "Re-import with mapping"], linkHref: "/lead-feed", linkLabel: "Lead Feed" },
  { id: "low_confidence_lead", title: "Low Confidence Lead", message: "This lead has a low confidence score. Verify property and ownership details before outreach.", nextActions: ["Review source records", "Run compliance check", "Add notes"], linkHref: "/compliance", linkLabel: "Compliance Center" },
  { id: "compliance_rule_unknown", title: "Compliance Rule Unknown", message: "No compliance rule is configured for this state or county. Proceed with caution and confirm requirements with a qualified professional.", nextActions: ["Open State Deal Kit", "Contact SCS Nova", "Log compliance question"], linkHref: "/compliance", linkLabel: "Compliance Center", supportTicket: true },
  { id: "document_template_missing", title: "Document Template Missing", message: "The requested document template is not available for this workflow.", nextActions: ["Select alternate template", "Open Document Center", "Contact SCS Nova"], linkHref: "/documents", linkLabel: "Document Center" },
  { id: "missing_document_variables", title: "Missing Document Variables", message: "Required variables are missing before this document can be generated.", nextActions: ["Complete lead fields", "Open document packet", "Review template requirements"], linkHref: "/documents", linkLabel: "Document Center" },
  { id: "unauthorized_access", title: "Unauthorized Access", message: "You do not have permission to access this area.", nextActions: ["Return to Dashboard", "Contact organization admin", "Contact SCS Nova"], linkHref: "/dashboard", linkLabel: "Dashboard" },
  { id: "api_failure", title: "Service Temporarily Unavailable", message: "A service request failed. Your data is preserved. Try again or contact support if the issue persists.", nextActions: ["Retry action", "Check system health", "Create support ticket"], linkHref: "/support", linkLabel: "Support", supportTicket: true },
  { id: "duplicate_lead", title: "Duplicate Lead Detected", message: "A lead with similar property or owner details already exists in your organization.", nextActions: ["Review existing lead", "Merge or archive duplicate", "Adjust import mapping"], linkHref: "/lead-feed", linkLabel: "Lead Feed" },
  { id: "invalid_csv", title: "Invalid CSV File", message: "The uploaded CSV could not be processed. Check column mapping, file format, and required fields.", nextActions: ["Review import errors", "Download template", "Fix and re-upload"], linkHref: "/market-search", linkLabel: "CSV Import" },
  { id: "missing_acknowledgement", title: "Acknowledgement Required", message: "Elevated compliance risk requires your acknowledgement before continuing.", nextActions: ["Review compliance panel", "Complete acknowledgement", "Contact compliance reviewer"], linkHref: "/compliance", linkLabel: "Compliance Center" },
  { id: "workflow_blocked", title: "Workflow Blocked", message: "A compliance or document blocker is preventing this workflow step.", nextActions: ["Review blockers", "Complete required documents", "Contact compliance reviewer"], linkHref: "/compliance", linkLabel: "Compliance Center" },
  { id: "dnc_active", title: "Do Not Contact Active", message: "This lead is marked Do Not Contact. Outreach actions are disabled.", nextActions: ["Review DNC record", "Update lead status", "Contact compliance reviewer"], linkHref: "/outreach", linkLabel: "Outreach CRM" },
  { id: "outreach_safety_blocked", title: "Outreach Safety Block", message: "This outreach content was blocked by the Outreach Safety Guard. Revise language to be respectful and compliant.", nextActions: ["Edit outreach message", "Use approved template", "Review outreach guidelines"], linkHref: "/outreach", linkLabel: "Outreach CRM" },
  { id: "buyer_match_unavailable", title: "Buyer Match Unavailable", message: "No buyer matches are available for this lead based on current criteria.", nextActions: ["Add buyers", "Adjust match criteria", "Open Buyer Network"], linkHref: "/buyer-network", linkLabel: "Buyer Network" },
  { id: "assignment_blocker", title: "Assignment Blocker Active", message: "Required documents or compliance items must be completed before this assignment step.", nextActions: ["Review document packet", "Complete checklist", "Open Assignment Tracker"], linkHref: "/assignments", linkLabel: "Assignment Tracker" },
  { id: "document_upload_failed", title: "Document Upload Failed", message: "The document could not be uploaded. Check file type, size, and connection.", nextActions: ["Retry upload", "Check file requirements", "Contact support"], linkHref: "/documents", linkLabel: "Document Center", supportTicket: true },
  { id: "unsupported_file_type", title: "Unsupported File Type", message: "This file type is not supported. Use PDF, DOCX, PNG, or JPG.", nextActions: ["Convert file format", "Review upload requirements", "Try again"], linkHref: "/documents", linkLabel: "Document Center" },
  { id: "organization_not_found", title: "Organization Not Found", message: "Organization context could not be loaded.", nextActions: ["Open Command Center", "Contact support"], linkHref: "/dashboard", linkLabel: "Command Center", supportTicket: true },
  { id: "user_suspended", title: "Account Suspended", message: "Your account has been suspended. Contact your organization admin or SCS Nova.", nextActions: ["Contact organization admin", "Create support ticket", "Review account status"], linkHref: "/support", linkLabel: "Support", supportTicket: true },
  { id: "market_license_expired", title: "Market License Expired", message: "This market is not active on your organization's license. Contact SCS Nova or your organization admin to enable access.", nextActions: ["View licensed markets", "Request license renewal", "Use CSV import if allowed"], linkHref: "/settings", linkLabel: "Organization Settings" },
  { id: "source_terms_not_reviewed", title: "Source Terms Not Reviewed", message: "Data source terms must be reviewed and approved before automated access is enabled.", nextActions: ["Review source terms", "Contact SCS Nova admin", "Use CSV import fallback"], linkHref: "/market-search", linkLabel: "Data Sources" },
  { id: "connector_credentials_missing", title: "Connector Credentials Missing", message: "Approved data connector credentials are not configured for this organization.", nextActions: ["Contact organization admin", "Configure credentials", "Use CSV import"], linkHref: "/settings", linkLabel: "Settings" },
  { id: "demo_unavailable", title: "Demo Mode Unavailable", message: "Demo mode is not enabled for this environment.", nextActions: ["Use fresh-start mode", "Open Command Center"], linkHref: "/dashboard", linkLabel: "Command Center" },
  { id: "fresh_start_empty", title: "Fresh Start — No Records Yet", message: "Your workspace is empty. Import CSV or add leads to begin.", nextActions: ["Import CSV", "Open Lead Feed", "Open Dashboard"], linkHref: "/dashboard", linkLabel: "Command Center" },
];

export function getErrorState(id: string): ErrorStateDefinition | undefined {
  return ERROR_STATES.find((e) => e.id === id);
}
