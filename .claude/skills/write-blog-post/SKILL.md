---
name: write-blog-post
description: Write and publish a new SEO blog post for the LiveSinger Shimla website. Use when asked to add, write or post a blog article.
---
# Write a LiveSinger Shimla blog post

Blog posts are Markdown files in `src/content/blog/<slug>.md`. The file name is the URL: `/blog/<slug>`.
The build pre-renders each post with its own title, description, canonical URL, Open Graph tags and
BlogPosting JSON-LD, adds it to `/blog` and to `sitemap.xml`. No code changes are needed.

## Audience
1. Hotels, resorts, cafes, wedding families and event planners in Shimla, Kufri, Mashobra, Chail, Naldehra, Narkanda who should **book a singer** (link to `/singers` and the `/shimla/<slug>` pages).
2. Singers and bands who should **register** on the site (link to `/join`).

## Steps
1. Pick one main keyword the post targets and 4 to 6 related ones. Do not reuse the main keyword of an existing post (check the `keywords:` line of the files in `src/content/blog/`).
   Keyword ideas: live singer Shimla, singer live show, live show singer, live singer for hotel in Shimla,
   wedding singer Shimla, Sufi singer Shimla, Bollywood singer Shimla, Pahari singer Shimla, band in Shimla,
   live music Shimla, book singer Shimla, New Year party singer Shimla, corporate event singer Shimla, singer in Kufri / Mashobra / Chail.
2. Create `src/content/blog/<short-keyword-slug>.md` with this front matter:
   ```
   ---
   title: <Main keyword near the start, under 65 characters if possible>
   description: <140 to 160 characters, includes the main keyword, says what the reader gets>
   date: <YYYY-MM-DD, today>
   keywords: <main keyword>, <related>, <related>
   ---
   ```
3. Write 700 to 1,100 words in simple English. Use the main keyword in the first paragraph and in one `##` heading, and the related keywords naturally. Never stuff keywords.
4. Supported Markdown: `##` and `###` headings, paragraphs, `-` lists, `1.` lists, `> quote`, `**bold**`, `*italic*`, `[text](/path)`. Keep each list or quote as its own block separated by blank lines.
5. Add 3 or more internal links: `/singers`, a matching `/shimla/<slug>` page (see `LANDINGS` in `src/data/catalog.ts`), `/join` for singer posts, and at least one other `/blog/<slug>` post.
6. Facts: prices must match the site (solo acoustic from about ₹8,000 for 2 hours, 30% advance, rest after the show). Do not invent hotel names, statistics or quotes.
7. Run `npm run build` and confirm `dist/blog/<slug>/index.html` exists and the post is in `dist/sitemap.xml`.
8. Commit on a branch and open a pull request. Once merged and deployed, the post is live.
