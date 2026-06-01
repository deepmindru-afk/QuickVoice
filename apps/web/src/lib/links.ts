export const DEMO_BOOKING_URL = "https://tidycal.com/team/quickvoice/demo";

const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL?.replace(/\/+$/, "");

const consolePath = (path: string) => `${consoleUrl ?? ""}${path}`;

export const LOGIN_URL = consolePath("/login");
export const REGISTER_URL = consolePath("/register");
