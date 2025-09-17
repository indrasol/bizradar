// components/Auth/AuthLoginTracker.tsx
import { useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { useTrack } from "@/logging";

export default function AuthLoginTracker() {
  const track = useTrack();
  const didTrackThisSession = useRef(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && !didTrackThisSession.current) {
        const provider = (session?.user?.app_metadata as any)?.provider || "password";
        const payload = { event_name: "login-success", event_type: "button_click", metadata: {query: null, stage: null, opportunity_id: null, naics_code: null, rfp_title: null}};
        console.log("[track]", payload);
        try { await track(payload); } catch {}
        didTrackThisSession.current = true;
      }
      if (event === "SIGNED_OUT") didTrackThisSession.current = false;
    });
    return () => sub.subscription.unsubscribe();
  }, [track]);

  return null;
}
