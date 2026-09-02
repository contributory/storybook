import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client/web is pure web-standard JS (fetch) — bundle it inline so the
  // edge runtime never has to resolve it from node_modules (fixes the
  // ERR_MODULE_NOT_FOUND error for the external "@libsql/client-<hash>" stub).
  // The native "libsql" package is no longer used at all.
  serverExternalPackages: ["@aws-sdk/client-s3"],
};

export default nextConfig;
