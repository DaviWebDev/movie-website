import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.local(),
      name: "urbanistLatin",
      cssVariable: "--font-urbanist-latin",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/urbanist-latin-400-normal.woff2"],
            weight: 400,
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/urbanist-latin-600-normal.woff2"],
            weight: 600,
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/urbanist-latin-800-normal.woff2"],
            weight: 800,
            style: "normal",
          },
        ],
      },
    },
  ],
});
