// src/logging/tracker-core.ts

/** Frontend event payload (backend maps `metadata` -> Extra_data JSONB) */
export type ClientEvent = {
  session_id?: string | null;           // extracted from JWT token
  event_name: string;                    // text in DB
  event_type: string;                    // text in DB
  user_agent?: string | null;           // browser user agent
  latitude?: number | null;              // optional, attached in Provider
  longitude?: number | null;             // optional, attached in Provider
  created_at?: string | null;            // ISO 8601 UTC, attached in Provider
  metadata?: Record<string, unknown>;    // e.g. { opportunity_id, keyword }
};

let ENDPOINT = "/api/events/one";

// ---- DEV logger (silent in prod) -------------------------------------------
const DEV = (import.meta as any)?.env?.DEV === true;
const log = (...args: any[]) => DEV && console.log("[Tracker]", ...args);
// ----------------------------------------------------------------------------

// log("init endpoint =", ENDPOINT);

export function configureTracker(opts: { endpoint?: string }) {
  if (opts.endpoint) ENDPOINT = opts.endpoint;
}

/** Fire-and-forget immediate POST (uses sendBeacon if tab is hiding/unloading). */
export function postEvent(payload: ClientEvent) {
  const body = JSON.stringify({
    session_id: payload.session_id ?? null,
    event_name: payload.event_name,
    event_type: payload.event_type,
    user_agent: payload.user_agent ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    created_at: payload.created_at ?? null,
    metadata: payload.metadata ?? {},
  });

  const blob = new Blob([body], { type: "application/json" });

  // Most reliable during unload / pagehide
  if (navigator.sendBeacon && document.visibilityState !== "visible") {
    navigator.sendBeacon(ENDPOINT, blob);
    return;
  }

  // Otherwise, standard POST (keepalive lets it run during navigations)
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // swallow network errors
  });
}
