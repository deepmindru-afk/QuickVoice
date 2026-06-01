const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

export const SERVER_URL = trimTrailingSlashes(
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:5000",
);

export const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL === undefined
    ? "/"
    : trimTrailingSlashes(process.env.NEXT_PUBLIC_LANDING_URL);

export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? "v1";

export const apiPath = (path: string) =>
  `${SERVER_URL}/api/${API_VERSION}${path}`;
