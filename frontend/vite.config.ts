import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend read API base is injected at build time via VITE_API_BASE.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
