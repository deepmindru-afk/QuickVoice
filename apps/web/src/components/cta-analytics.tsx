"use client";

import { useEffect } from "react";
import { CONTACT_URL, DEMO_BOOKING_URL, LOGIN_URL, REGISTER_URL } from "@/lib/links";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const CTA_DESTINATIONS = [
  { type: "contact", href: CONTACT_URL },
  { type: "demo", href: DEMO_BOOKING_URL },
  { type: "login", href: LOGIN_URL },
  { type: "signup", href: REGISTER_URL },
] as const;

function getCtaType(rawHref: string): string | null {
  const targetUrl = new URL(rawHref, window.location.origin);

  for (const destination of CTA_DESTINATIONS) {
    const destinationUrl = new URL(destination.href, window.location.origin);
    if (
      targetUrl.href === destinationUrl.href ||
      targetUrl.pathname === destinationUrl.pathname
    ) {
      return destination.type;
    }
  }

  return null;
}

export function CtaAnalytics() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!window.gtag || !(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href");
      if (!link || !href) return;

      const ctaType = getCtaType(href);
      if (!ctaType) return;

      window.gtag("event", "cta_click", {
        cta_type: ctaType,
        cta_destination: new URL(href, window.location.origin).href,
        link_text: link.textContent?.replace(/\s+/g, " ").trim().slice(0, 120),
        page_path: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
