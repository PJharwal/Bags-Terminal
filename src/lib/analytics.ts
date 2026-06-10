// Privacy-light, env-gated analytics. No-ops unless a provider is configured
// (NEXT_PUBLIC_PLAUSIBLE_DOMAIN). Never sends PII or full wallet addresses.

export const EVENTS = {
  LAUNCH_SUCCESS: "launch_success",
  FEE_CLAIM: "fee_claim",
  SHARE_CLICK: "share_click",
  REFERRAL_VISIT: "referral_visit",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
  }
}

// Truncate anything that looks like a wallet / long id so we never log PII.
function sanitize(props?: Props): Props | undefined {
  if (!props) return undefined;
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    out[k] = typeof v === "string" && v.length > 16 ? `${v.slice(0, 4)}…${v.slice(-4)}` : v;
  }
  return out;
}

export function track(event: AnalyticsEvent | string, props?: Props) {
  if (typeof window === "undefined") return;
  const clean = sanitize(props);
  if (typeof window.plausible === "function") {
    window.plausible(event, clean ? { props: clean } : undefined);
  }
  // No provider configured → no-op (safe to call anywhere).
}
