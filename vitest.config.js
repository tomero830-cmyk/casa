import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for pure logic (no Base44 plugin, no browser).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["src/**/*.test.{js,jsx}"] },
});
