export const CONTACT_URL = "/company/contact";
export const DEMO_BOOKING_URL = "https://tidycal.com/team/quickvoice/demo";

const DEFAULT_CONSOLE_URL = "https://console.quickvoice.co";
const consoleUrl =
  process.env.NEXT_PUBLIC_CONSOLE_URL?.replace(/\/+$/, "") ||
  DEFAULT_CONSOLE_URL;

const consolePath = (path: string) => `${consoleUrl}${path}`;

export const LOGIN_URL = consolePath("/login");
export const REGISTER_URL = consolePath("/register");

export const CTA_URLS = {
  contact: CONTACT_URL,
  demo: DEMO_BOOKING_URL,
  login: LOGIN_URL,
  register: REGISTER_URL,
} as const;
