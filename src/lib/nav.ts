import {
  LayoutDashboard,
  Map,
  BrainCircuit,
  ActivitySquare,
  Radar,
  Wrench,
  KanbanSquare,
  Leaf,
  FileText,
  Database,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Network command center" },
  { label: "Road Network", href: "/road-network", icon: Map, description: "GIS road intelligence" },
  { label: "AI Insights", href: "/ai-insights", icon: BrainCircuit, description: "Model performance & explainability" },
  { label: "Condition Monitoring", href: "/condition-monitoring", icon: ActivitySquare, description: "Distress & sensor telemetry" },
  { label: "Risk & Prediction", href: "/risk-prediction", icon: Radar, description: "Where will the road fail next" },
  { label: "Repair Recommendations", href: "/repair-recommendations", icon: Wrench, description: "AI repair intelligence" },
  { label: "Repair Planning", href: "/repair-planning", icon: KanbanSquare, description: "Pipeline & scheduling" },
  { label: "Sustainability Impact", href: "/sustainability", icon: Leaf, description: "CO₂, material & waste impact" },
  { label: "Reports", href: "/reports", icon: FileText, description: "Generate & export reports" },
  { label: "Data & Analytics", href: "/data-analytics", icon: Database, description: "Trends & data quality" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Roles, preferences, system" },
];
