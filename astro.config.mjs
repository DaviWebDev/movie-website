import { defineConfig } from "astro/config";
import icon from "astro-icon";
import node from "@astrojs/node";

export default defineConfig({
  integrations: [icon()],
  image: {
    domains: ["image.tmdb.org"],
  },
  adapter: node({ mode: "standalone" }),
  vite: {
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
});
