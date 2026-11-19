import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": import.meta.env.VITE_API_URL,                                                                                           
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split big libraries into their own cached files -> faster first load
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
