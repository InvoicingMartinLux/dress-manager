# 👗 Dress Manager

A digital wardrobe web app: photograph your clothes, let AI catalog them, and
get outfit recommendations — e.g. which of your shirts go with your blue
trousers, and why.

## Features

- **Accounts** — email/password sign-up; each user has their own wardrobe
- **AI photo analysis** — upload a garment photo and Claude vision detects the
  type, colors, pattern, formality and seasons (you can adjust before saving)
- **Digital wardrobe** — browse and filter your items by category
- **Outfit matching** — rule-based color-theory engine scores every
  complementary item in your wardrobe (0–100) with human-readable reasons:
  neutrals, analogous/complementary hues, clash detection, pattern mixing,
  formality and season alignment

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Neon Postgres](https://vercel.com/marketplace/neon) via Drizzle ORM
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for garment photos
- [Anthropic API](https://platform.claude.com) (Claude vision) for photo analysis
- Session auth with signed JWT cookies (jose + bcryptjs)

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) and select
   this repository. The framework preset (Next.js) is detected automatically.

2. **Add a Postgres database**: in the Vercel project → *Storage* tab →
   *Create Database* → **Neon (Postgres)**. Connecting it sets `DATABASE_URL`
   automatically.

3. **Add a Blob store**: *Storage* tab → *Create Database* → **Blob**.
   Connecting it sets `BLOB_READ_WRITE_TOKEN` automatically.

4. **Set the remaining environment variables** (Project → *Settings* →
   *Environment Variables*):

   | Variable | Value |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | API key from [platform.claude.com](https://platform.claude.com) |
   | `AUTH_SECRET` | Any long random string — `openssl rand -base64 32` |

5. **Create the database tables** (once). From your machine, with the
   `DATABASE_URL` from step 2 (copy it from the Vercel dashboard):

   ```bash
   npm install
   DATABASE_URL="postgres://…" npm run db:push
   ```

   (Alternatively run the SQL in `drizzle/0000_*.sql` in the Neon console.)

6. **Deploy** — push to the repo or click *Deploy*. Done!

## Local development

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run db:push              # create tables
npm run dev                  # http://localhost:3000
```

## How matching works

Every garment stores its dominant colors (as hex), pattern, formality (1–5)
and seasons. When you open an item, the app scores all complementary
categories (e.g. for trousers: tops, shoes, outerwear) with a color-theory
rule set:

- **Neutrals** (black, white, grey, navy, beige, denim) pair with everything
- **Analogous hues** (≤ 25° apart on the color wheel) read as tone-on-tone
- **Complementary hues** (≥ 150° apart) give deliberate contrast
- Saturated colors 25–100° apart are flagged as potential **clashes**
- Two patterned pieces, formality gaps and non-overlapping seasons reduce
  the score

Scores ≥ 75 are "great matches", below 45 items are hidden as risky.
