import {
  UserPlus,
  Search,
  Shield,
  Calculator,
  MessageSquare,
  Users,
  FolderOpen,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export interface WizardDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  phase: string;
}

export const WORKFLOW_WIZARDS: WizardDefinition[] = [
  {
    id: "lead-intake",
    title: "New Lead Intake",
    description: "Add or import a property lead with transfer type, source, value, and urgency.",
    href: "/wizards/lead-intake",
    icon: UserPlus,
    phase: "Discovery",
  },
  {
    id: "probate-research",
    title: "Probate & Inherited Property Research",
    description: "Confirm owner history, transfer path, heirs, record sources, and next research steps.",
    href: "/wizards/probate-research",
    icon: Search,
    phase: "Research",
  },
  {
    id: "compliance",
    title: "Compliance Wizard",
    description: "State rules, outreach methods, disclosures, DNC checks, and safe-to-contact status.",
    href: "/wizards/compliance",
    icon: Shield,
    phase: "Compliance",
  },
  {
    id: "deal-offer",
    title: "Offer & Assignment Deal",
    description: "ARV, repairs, investor buy price, assignment fee, spread, and deal confidence.",
    href: "/wizards/deal-offer",
    icon: Calculator,
    phase: "Deal Analysis",
  },
  {
    id: "seller-outreach",
    title: "Seller Outreach",
    description: "Respectful call, SMS, email, and mailer scripts with follow-up schedule.",
    href: "/wizards/seller-outreach",
    icon: MessageSquare,
    phase: "Outreach",
  },
  {
    id: "buyer-match",
    title: "Buyer Match",
    description: "Match disposition buyers by type, market, deal size, and contact history.",
    href: "/wizards/buyer-match",
    icon: Users,
    phase: "Disposition",
  },
  {
    id: "document-packet",
    title: "Document Packet",
    description: "Assemble lead summary, research sheet, compliance checklist, and deal printout.",
    href: "/wizards/document-packet",
    icon: FolderOpen,
    phase: "Documents",
  },
  {
    id: "state-setup",
    title: "State Setup",
    description: "Configure state/county record sources, probate lookup, outreach rules, and workflow.",
    href: "/wizards/state-setup",
    icon: MapPin,
    phase: "Market Setup",
  },
];
