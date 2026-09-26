import { cn } from "@/lib/utils";
import type { BikeConnectionState } from "@/types/ride";
import {
  Bluetooth,
  BluetoothOff,
  BluetoothSearching,
  Loader2,
} from "lucide-react";

interface ConnectionBadgeProps {
  state: BikeConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionBadge({
  state,
  onConnect,
  onDisconnect,
}: ConnectionBadgeProps) {
  const handleClick = () => {
    if (state === "connected") onDisconnect();
    else if (state !== "scanning") onConnect();
  };

  return (
    <button
      type="button"
      data-ocid="connection.toggle"
      onClick={handleClick}
      disabled={state === "scanning"}
      aria-label={state === "connected" ? "Disconnect bike" : "Connect bike"}
      className={cn(
        "flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold font-mono tracking-wide",
        "transition-all duration-200 select-none",
        state === "idle" &&
          "bg-black/5 text-muted-foreground border-black/10 hover:border-primary/40 hover:text-foreground hover:bg-primary/10",
        state === "scanning" &&
          "bg-primary/12 text-primary border-primary/30 cursor-wait",
        state === "connected" &&
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
        state === "disconnected" &&
          "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20",
        state === "error" &&
          "bg-destructive/10 text-destructive border-destructive/30",
      )}
    >
      {state === "scanning" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : state === "connected" ? (
        <BluetoothSearching className="w-3 h-3" />
      ) : state === "disconnected" ? (
        <BluetoothOff className="w-3 h-3" />
      ) : (
        <Bluetooth className="w-3 h-3" />
      )}
      <span>
        {state === "idle" && "Connect"}
        {state === "scanning" && "Pairing\u2026"}
        {state === "connected" && (
          <span className="flex items-center gap-1.5">
            FS-2980D8
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        )}
        {state === "disconnected" && "Reconnect"}
        {state === "error" && "BT Error"}
      </span>
    </button>
  );
}
