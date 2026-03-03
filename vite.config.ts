import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Allow external access to dev server
    host: "0.0.0.0",
    port: 5174,
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: "http://127.0.0.1:8002",
              changeOrigin: true,
            },
          }
        : undefined,
  },
}));
