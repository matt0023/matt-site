# America First list

A static [Astro](https://astro.build) site: a filterable list of US politicians who do not support America First policies. Hosted on [Vercel](https://vercel.com).

The criteria are not written yet. `src/data/politicians.json` currently lists real people. Set `example` to `true` only on a fake sample row; the site badges those. Every reason needs a real public-record URL, and the build fails without one.

## Prerequisites

Node.js 22.23.4 or newer (see `engines` in `package.json`).

## Run locally

```bash
npm install
npm run dev
```

The dev server prints a local URL. The default is http://localhost:4321.

## Build

```bash
npm run check
npm run build
```

`npm run check` runs `astro check`. `npm run build` writes the static site to `dist/` and fails if `src/data/politicians.json` is invalid (including a reason with no source URL). Preview that output:

```bash
npm run preview
```

## Add, edit, or remove a politician

Edit the array in `src/data/politicians.json`. One object per person:

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | The page slug is this name, lowercased, with punctuation turned into hyphens. Renaming changes `/p/…`. |
| `party` | yes | `R`, `D`, `I`, or `other`. |
| `state` | yes | Two-letter USPS code, including `DC`. |
| `chamber` | yes | `senate`, `house`, or `other`. If `office` contains “Senate” or “House,” `chamber` has to match. |
| `office` | yes | For example `Senate`, `Senate Majority Leader`, or `House`. |
| `district` | no | House district or other short label. |
| `x_handle` | no | X handle without `@`. The site links to `https://x.com/{handle}`. |
| `featured_post_url` | no | An `x.com` or `twitter.com` post URL. When set, that person's page embeds it with X's `widgets.js`. |
| `reasons` | yes | Array of `{ "text", "source" }`. `source` is required on every reason and must be an `http(s)` URL to a public record (vote, bill, statement, or their own post). The build fails if a reason lacks one. |
| `last_updated` | yes | `YYYY-MM-DD`. |
| `example` | no | Set `true` for fake sample rows. The site badges those entries. Omit it for a real person. |

State pages (`/state/ca`) are generated for states that have at least one entry. Removing the last person in a state removes that page. `/senate` and `/house` list that chamber. The House block stays on “coming soon” until a `chamber: "house"` entry exists.

To remove someone, delete their object and run `npm run build`.

## Deploy

Import this repository in Vercel (Hobby plan). Vercel detects Astro. Leave the defaults:

- Build command: `astro build` (or `npm run build`)
- Output directory: `dist`

No `vercel.json` and no Vercel adapter are required for this fully static site. Set the project's Node.js version to 22.x.

Before launch, set `site` in `astro.config.mjs` to the production origin (`https://…`). Until then, `@astrojs/sitemap` skips sitemap generation, and canonical / `og:url` tags are omitted so the build does not advertise a guessed URL. After `site` is set, add the sitemap URL to `public/robots.txt`.

Home filters use `?chamber=`, `?party=`, `?state=`, and `?q=` (name search). The full list is in the HTML; a small script hides non-matches and keeps those query params in the URL so a filtered view can be shared. With no chamber selected, the Senate section is first and the House section follows.
