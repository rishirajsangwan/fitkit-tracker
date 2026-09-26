import { cn } from "@/lib/utils";
import { Activity, BarChart2, Clock } from "lucide-react";

export type AppTab = "live" | "history" | "stats";

interface NavTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: "live", label: "Ride", icon: <Activity className="w-4 h-4" /> },
  { id: "history", label: "History", icon: <Clock className="w-4 h-4" /> },
  { id: "stats", label: "Stats", icon: <BarChart2 className="w-4 h-4" /> },
];

export function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav
      className="flex items-center gap-0.5 bg-black/[0.04] rounded-xl p-1 border border-black/10"
      role="tablist"
      data-ocid="nav.tabs"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          data-ocid={`nav.${tab.id}.tab`}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-200",
            active === tab.id
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5",
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
