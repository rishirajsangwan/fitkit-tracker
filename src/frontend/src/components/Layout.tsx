import { ConnectionBadge } from "@/components/ConnectionBadge";
import { type AppTab, NavTabs } from "@/components/NavTabs";
import { useFitKitWithAutoSave } from "@/hooks/useFitKitWithAutoSave";
import { useState } from "react";

interface LayoutProps {
  children: (
    tab: AppTab,
    fitKit: ReturnType<typeof useFitKitWithAutoSave>,
  ) => React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("live");
  const fitKit = useFitKitWithAutoSave();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-black/8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 relative">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 12 L8 4 L13 12"
                  stroke="oklch(0.98 0.005 185)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 9h5"
                  stroke="oklch(0.98 0.005 185)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="font-display font-bold text-[15px] tracking-tight text-foreground">
              FitKit
              <span className="text-primary ml-0.5">Ride</span>
            </span>
          </div>

          <NavTabs active={activeTab} onChange={setActiveTab} />

          <ConnectionBadge
            state={fitKit.connectionState}
            onConnect={fitKit.connect}
            onDisconnect={fitKit.disconnect}
          />
        </div>
      </header>

      {/* Content */}
      {/* Resume banner */}
      {fitKit.partialRide && !fitKit.isRiding && (
        <div className="bg-accent/20 border-b border-accent/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-foreground font-medium">
                Ride in progress — {fitKit.partialRide.elapsedSeconds}s elapsed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-ocid="ride.resume_button"
                onClick={fitKit.resumeRide}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                data-ocid="ride.discard_button"
                onClick={fitKit.clearPartialRide}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {children(activeTab, fitKit)}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/60 border-t border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">
            © {new Date().getFullYear()} FitKit Ride
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-200"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
