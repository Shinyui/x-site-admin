import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.VITE_BACKEND_API_BASE_URL) {
    throw new Error("Missing env: VITE_BACKEND_API_BASE_URL");
  }
  const backendApiBaseUrl = String(env.VITE_BACKEND_API_BASE_URL).replace(
    /\/+$/,
    ""
  );
  const backendProxyTarget = backendApiBaseUrl.replace(/\/api$/, "");

  return {
    envPrefix: ["VITE_", "CDN_"],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
