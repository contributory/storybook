import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client/web is pure web-standard JS (fetch) — bundle it inline so the
  // edge runtime never has to resolve it from node_modules (fixes the
  // ERR_MODULE_NOT_FOUND error for the external "@libsql/client-<hash>" stub).
  //
  // IMPORTANT: "@libsql/client" is on Next.js' DEFAULT server-external-packages
  // list (node_modules/next/dist/lib/server-external-packages.jsonc), so it is
  // externalized even when omitted from `serverExternalPackages`. Listing it in
  // `transpilePackages` removes it from that external list (see
  // next/dist/build/webpack-config.js: optOutBundlingPackages filters out
  // transpilePackages) and forces Turbopack to inline it into the server bundle.
  transpilePackages: ["@libsql/client"],
  // The native "libsql" package is no longer used at all.
  serverExternalPackages: ["@aws-sdk/client-s3"],
};

export default nextConfig;
