import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useGeolocation } from "@uidotdev/usehooks";
import { postEvent, configureTracker, type ClientEvent } from "./tracker";
import { extractSessionId } from "../utils/jwtUtils";
import { supabase } from "../utils/supabase";

type TrackPayload = Omit<ClientEvent, "latitude" | "longitude" | "created_at" | "session_id" | "user_agent">;

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

  // Track current session and session_id
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);

  // Configure tracker endpoint
  useEffect(() => {
    configureTracker({ endpoint });
  }, [endpoint]);

  // Listen for auth state changes and extract session_id
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          const sessionId = extractSessionId(session.access_token);
          setCurrentSessionId(sessionId);
          console.log('🔐 Session ID extracted for tracking:', sessionId);
        } else {
          setCurrentSessionId(null);
          console.log('🔐 No session, clearing session_id for tracking');
        }
      }
    );

    // Also check current session on mount
    const getCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const sessionId = extractSessionId(session.access_token);
        setCurrentSessionId(sessionId);
        console.log('🔐 Initial session ID extracted for tracking:', sessionId);
      }
    };
    
    getCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

   // Attach UTC timestamp + lat/lon + session_id + user_agent and send
  const track = useCallback(
    (e: TrackPayload) => {
      const ts = Number.isFinite(geo.timestamp as number)
        ? (geo.timestamp as number)
        : Date.now();
      const created_at = new Date(ts).toISOString(); // UTC
      const user_agent = navigator.userAgent;
      postEvent({ ...e, latitude, longitude, created_at, session_id: currentSessionId, user_agent });
    },
    [latitude, longitude, geo.timestamp, currentSessionId]
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
  if (!ctx) {
    // Return a no-op function if context is not available
    // This prevents errors during component initialization
    console.warn("useTrack called outside TrackerProvider, returning no-op function");
    return () => {}; // No-op function
  }
  return ctx.track;
}


/** Convenience: bind an event name once, reuse with varying types/metadata */
export function useEventTracker(event_name: string) {
  const track = useTrack();
  return (event_type: string, metadata?: Record<string, unknown>) =>
    track({ event_name, event_type, metadata });
}
