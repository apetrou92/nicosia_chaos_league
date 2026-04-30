import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
        path.resolve(__dirname, "../shared")
      ]
    }
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@src": path.resolve(__dirname, "src")
    }
  }
});
