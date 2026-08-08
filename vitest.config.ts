import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Scoped to the units that are under test today. Widen this list as more
      // modules get covered, and raise the thresholds with it.
      include: [
        "src/lib/calendarEvents.ts",
        "src/components/dashboard/**/*.tsx",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      all: true,
      // The build fails when coverage drops below these numbers.
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
