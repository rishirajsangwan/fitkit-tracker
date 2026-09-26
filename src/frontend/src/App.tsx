import { Layout } from "@/components/Layout";
import type { AppTab } from "@/components/NavTabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { useFitKitWithAutoSave } from "@/hooks/useFitKitWithAutoSave";
import { Suspense, lazy } from "react";

const LiveRidePage = lazy(() => import("@/pages/LiveRide"));
const HistoryPage = lazy(() => import("@/pages/History"));
const StatsPage = lazy(() => import("@/pages/Stats"));

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      {(tab: AppTab, fitKit: ReturnType<typeof useFitKitWithAutoSave>) => (
        <Suspense fallback={<PageFallback />}>
          {tab === "live" ? (
            <LiveRidePage fitKit={fitKit} />
          ) : tab === "history" ? (
            <HistoryPage />
          ) : (
            <StatsPage />
          )}
        </Suspense>
      )}
    </Layout>
  );
}
