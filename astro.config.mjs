import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // TODO: set the production origin once a domain exists, then uncomment.
  // @astrojs/sitemap writes the sitemap only after `site` is set. Canonical
  // and og:url tags stay off until then so the build does not publish a
  // guessed URL. Hosting target is Vercel.
  // site: "https://example.com",
  output: "static",
  integrations: [sitemap()],
});
