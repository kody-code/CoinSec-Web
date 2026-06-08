import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'https://coinsec.site'

  return {
    base: "./",
    plugins: [vue()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": { target: proxyTarget, changeOrigin: true },
        "^/icons/.*": { target: proxyTarget, changeOrigin: true },
        "/uploads": { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
