import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

import { BadRequestError } from "../common/errors/badRequest.js";

type LookupAddress = {
  address: string;
  family: number;
};

type AssertSafeRemoteUrlOptions = {
  allowedProtocols?: string[];
  lookup?: (hostname: string) => Promise<LookupAddress[]>;
};

export async function assertSafeRemoteUrl(
  rawUrl: string,
  options: AssertSafeRemoteUrlOptions = {}
) {
  const allowedProtocols = options.allowedProtocols ?? ["https:"];
  const lookup = options.lookup ?? defaultLookup;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestError("URL must be valid");
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new BadRequestError("URL protocol is not allowed");
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestError("URL credentials are not allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    throw new BadRequestError("Private or local URLs are not allowed");
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookup(hostname);

  if (addresses.length === 0 || addresses.some((item) => isBlockedAddress(item.address))) {
    throw new BadRequestError("Private or local URLs are not allowed");
  }

  return parsed;
}

async function defaultLookup(hostname: string) {
  const result = await dnsLookup(hostname, { all: true, verbatim: true });
  return result.map((item) => ({ address: item.address, family: item.family }));
}

function isBlockedHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

function isBlockedAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
}

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b, c, d] = parts as [number, number, number, number];

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 ||
    (a === 255 && b === 255 && c === 255 && d === 255)
  );
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("ff")
  ) {
    return true;
  }

  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped?.[1] ? isBlockedIpv4(mapped[1]) : false;
}
