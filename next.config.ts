import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / heavy server-only packages must not be bundled by the compiler
  serverExternalPackages: ["@libsql/client", "libsql", "@aws-sdk/client-s3"],
};

export default nextConfig;
