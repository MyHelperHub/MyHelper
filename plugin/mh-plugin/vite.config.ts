import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import fs from "fs";

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "copy-mhplugin-json",
      writeBundle() {
        // 确保dist目录存在
        if (!fs.existsSync("dist")) {
          fs.mkdirSync("dist");
        }
        // 复制mhPlugin.json到dist目录
        fs.copyFileSync("mhPlugin.json", "dist/mhPlugin.json");
      },
    },
  ],
  base: "./",
  server: {
    port: 1421,
  },
  resolve: {
    dedupe: ["vue"],
    alias: {
      "#": fileURLToPath(new URL("../../src", import.meta.url)),
      vue: fileURLToPath(new URL("../../node_modules/vue", import.meta.url)),
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("vue")) {
              return "vendor-vue";
            }
            return "vendor";
          }
        },
      },
    },
    minify: "esbuild",
    target: "esnext",
  },
});
