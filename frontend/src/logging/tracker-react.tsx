import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useGeolocation } from "@uidotdev/usehooks";
import { postEvent, configureTracker, type ClientEvent } from "./tracker";

type TrackPayload = Omit<ClientEvent, "latitude" | "longitude" | "created_at">;

type TrackerCtxValue = {
  track: (e: TrackPayload) => void;
};

const TrackerCtx = createContext<TrackerCtxValue | null>(null);

export function TrackerProvider({
  children,
  endpoint = "/api/events",
}: {
  children: React.ReactNode;
  endpoint?: string;
}) {
  // Geolocation
  const geo = useGeolocation({ maximumAge: 300000, timeout: 5000 });

  const latitude = Number.isFinite(geo.latitude as number)
    ? (geo.latitude as number)
    : null;
  const longitude = Number.isFinite(geo.longitude as number)
    ? (geo.longitude as number)
    : null;

  // Configure tracker endpoint
  useEffect(() => {
    configureTracker({ endpoint });
  }, [endpoint]);

  // Attach UTC timestamp + lat/lon and send
  const track = useCallback(
    (e: TrackPayload) => {
      const ts = Number.isFinite(geo.timestamp as number)
        ? (geo.timestamp as number)
        : Date.now();
      const created_at = new Date(ts).toISOString(); // UTC
      postEvent({ ...e, latitude, longitude, created_at });
    },
    [latitude, longitude, geo.timestamp]
  );

  // Universal browser/tab close logging
  useEffect(() => {
    let sent = false;

    const send = (evt: Event) => {
      if (sent) return;
      sent = true;

      track({
        event_name: "window_closed",
        event_type: "button_click",
        metadata: {search_query: null, stage: null, section: null, opportunity_id: null, title: null, naics_code: null},
      });
    };

    window.addEventListener("pagehide", send, { capture: true });
    window.addEventListener("beforeunload", send, { capture: true });

    return () => {
      window.removeEventListener("pagehide", send, true);
      window.removeEventListener("beforeunload", send, true);
    };
  }, [track]);

  const value = useMemo(() => ({ track }), [track]);

  return <TrackerCtx.Provider value={value}>{children}</TrackerCtx.Provider>;
}

export function useTrack() {
  const ctx = useContext(TrackerCtx);
  if (!ctx) throw new Error("useTrack must be used within TrackerProvider");
  return ctx.track;
}

/** Convenience: bind an event name once, reuse with varying types/metadata */
export function useEventTracker(event_name: string) {
  const track = useTrack();
  return (event_type: string, metadata?: Record<string, unknown>) =>
    track({ event_name, event_type, metadata });
}
