# Axatel CMS — Architecture, Database Connection & Dashboard Testing Guide

---

## 1. How the pieces fit together — explained simply

Think of the whole system like a restaurant:

| Restaurant | Axatel CMS |
|---|---|
| **The pantry/storage room** | **The database** — every page, image, theme setting, and chatbot answer is stored here as raw data. Nothing pretty, just ingredients. |
| **The kitchen** | **Django + Wagtail** (the "backend") — pulls raw data out of storage, applies the rules (this page belongs under that one, this image needs resizing, this content should only show if published), and plates it up as a clean package. |
| **The pass (where the kitchen hands off finished plates)** | **The API** — URLs starting with `/api/v2/...`. This is the *only* way the frontend is allowed to ask the kitchen for anything. It never goes into the pantry directly. |
| **The dining room / the waiter** | **Nuxt/Vue** (the "frontend") — takes what the kitchen hands over and presents it beautifully to the actual visitor: layout, colors, fonts, animations, the whole visual experience. |
| **A shelf near the pass holding today's most-ordered dishes, already made** | **Redis** — see section 3. |
| **The number of cooks working at once** | **Gunicorn workers** — see section 3. |

**Why this matters for your frontend colleague specifically:** they never touch the database, and they never touch Django/Python code. Their entire job is: call the API, get JSON back, turn it into a nice-looking page. If content is wrong on the site, the question is always "is the API returning the wrong data?" (backend problem) or "is the API returning correct data but displaying it wrong?" (frontend problem) — you can check which one it is by opening the API URL directly in a browser and reading the raw JSON.

Concretely, when someone visits `axatel.it/casi/qualche-caso`:
1. Nuxt (frontend) asks the API: *"give me the page at this URL."*
2. Django (backend) looks it up in the database, checks it's actually published, and returns it as JSON.
3. Nuxt turns that JSON into the actual page you see — headings, images, colors, everything.

---

## 2. Connecting to an external SQL database (on its own IP address)

Right now, in production, the database is meant to run as its own container (`db` in `docker-compose.yml`) sitting right next to the app. Moving to an external database — one hosted on its own server/IP — changes where the data physically lives, but changes almost nothing about how Django talks to it, because of one setting: `DATABASE_URL`.

**The connection string format** (already the mechanism this project uses, via `dj_database_url` in `settings/base.py`):
```
postgresql://USERNAME:PASSWORD@DATABASE_IP:5432/DATABASE_NAME
```
For example, a database at `203.0.113.50` called `axatel_prod`:
```
DATABASE_URL=postgresql://axatel_app:REAL_PASSWORD_HERE@203.0.113.50:5432/axatel_prod
```

**The actual steps:**
1. **On the external database server**, create a dedicated database and a dedicated user for this app — never use the database's root/admin account for the application itself. Grant that user access only to that one database, not the whole server.
2. **Firewall**: the database server must allow inbound connections from wherever Django actually runs (its IP or its network). By default, most database servers refuse all outside connections — this step is usually where people get stuck.
3. **Encryption in transit**: if the database is reachable over the public internet (not a private network), add `?sslmode=require` to the end of the `DATABASE_URL` so credentials and data aren't sent in plain text.
4. **Update `.env`** on the server running Django with the new `DATABASE_URL`, replacing whatever was there before.
5. **Remove the local `db` service** from `docker-compose.yml` (production) — if the real database now lives elsewhere, running a second, empty, unused Postgres container locally just wastes resources and could even confuse a future developer into thinking *that's* the real one. Also remove `web`'s `depends_on: db` line, since it no longer exists.
6. **Test the connection before going live**:
   ```bash
   docker compose exec web python manage.py dbshell
   ```
   If that connects and drops you into a `psql` prompt, the connection works. If it hangs or errors, it's almost always the firewall step above.
7. **Run migrations against the new database** — it starts empty:
   ```bash
   docker compose exec web python manage.py migrate
   ```
8. One thing worth deciding deliberately: will you **migrate the existing data** (everything currently in the local dev/staging database) to this new external one, or **start fresh**? If migrating real content, that's a `pg_dump` / `pg_restore` from the old database into the new one — a separate step from anything above, and one worth testing on a copy before doing it for real.

---

## 3. Redis and Gunicorn workers — what they actually do, in plain terms

**Redis** — a fast, temporary memory shelf. Some information gets asked for over and over by many visitors (site-wide settings, certain cached lookups) — instead of the kitchen (Django) re-preparing that same answer from scratch every single time, Redis keeps a ready-made copy sitting in fast memory. Nothing breaks without Redis — the site still works — it just does more repeated work than necessary, so pages could load slightly slower under real traffic. Redis holds nothing permanently; if it restarts, it just starts refilling itself from Django as normal.

**Gunicorn workers** — Gunicorn is what actually runs Django and keeps it listening for requests. A "worker" is one independent copy of that running Django app, able to handle one visitor's request at a time. `entrypoint.sh` fixes this at exactly **3 workers**, always — meaning this app can genuinely handle 3 requests at the *exact same instant*; a 4th arriving at that same instant briefly waits its turn (this happens in milliseconds normally, not something visitors notice under light traffic).

**Why this number specifically matters for this project**: the chatbot's language model gets loaded into memory **separately, once per worker** (a deliberate design choice made earlier, so each worker can pick up knowledge-base edits without needing a restart). 3 workers means roughly **3× the chatbot's memory footprint** — likely 1–2GB of RAM just for the chatbot feature, on top of everything else Django needs. This is the main reason the production server needs to be sized with real memory headroom, not the smallest/cheapest tier available.

---

## 4. CMS Dashboard — full testing walkthrough

Log in at `/cms/`. Here's a complete pass through everything worth checking, organized as your colleague or a marketing editor would actually encounter it.

### Pages
- **Pagine** in the sidebar → the page tree, structured exactly like the site's URL hierarchy.
- **Add child page**: navigate into a parent (e.g. "Home"), use the "..." menu or the add-page button — only page types allowed as children of that parent will be offered (e.g. only `CasoSuccessoPage` under `CasiIndexPage`).
- **Edit → Save draft vs Publish**: "Salva bozza" saves without making it live; "Pubblica" makes it visible on the real site immediately (no separate moderation step is currently configured — see Groups below for how to change that).
- **Unpublish**: open a live page → "..." menu → "Unpublish" — instantly removes it from the live site without deleting it.
- **Scheduled publishing**: in the page editor's right-hand panel (the clock/info icon), a page can be set to go live automatically at a future date/time, and/or expire automatically — useful for announcements or time-limited content.
- **Revision history**: the clock icon in the page editor shows every past saved version, with the ability to view or restore an old one — a real undo history, separate from the theme's one-step undo built earlier this session.
- **Preview**: the eye/phone icon lets you see a draft exactly as it will look live, before publishing.
- **Comments**: the speech-bubble icon enables inline commenting on specific fields — useful for a reviewer leaving feedback for an editor without touching the actual content.

### Groups & permissions (the "moderator" question from earlier)
*Impostazioni → Gruppi*: Wagtail ships two built-in groups.
- **Editors** — can create/edit pages, but publishing requires review (submits into a workflow instead of going live immediately).
- **Moderators** — can publish directly.
For your marketing colleague: create their account under *Impostazioni → Utenti*, add them to **Editors** (not superuser — that would also give Django admin and user management access, more than they need). Add them to **Moderators** too if you want them publishing without anyone reviewing first. For finer control, build a custom group here with only the specific permissions needed (e.g., can edit `casi` pages but not `services` pages).

### Images & Documents
- **Immagini**: the shared media library — upload once, reuse across any page/block. Wagtail auto-generates resized versions ("renditions") as needed.
- **Documenti**: same idea, for PDFs and downloadable files.

### Snippets
*Snippets* in the sidebar → currently holds **Voci chatbot** (the chatbot's editable knowledge base, built earlier this session) and **Temi** (if the older multi-theme model is still present — normally superseded by the single Tema settings panel now).

### Settings (*Impostazioni*)
- **Navigazione** — the header menu links and the header CTA button.
- **Footer** — contact info and company registration details (VAT/tax numbers).
- **Chatbot** — the widget's presentation: title, welcome message, placeholder text, suggested question chips (not its actual knowledge — that's the Snippets section above).
- **Tema** — site-wide colors, fonts, corner radius, shadow style, logo. This is what actually changes the live site's appearance.
- **SEO** — per-site defaults for Open Graph/Twitter cards and Schema.org Organization data. **Worth testing carefully**: I flagged earlier that this may be mostly disconnected from the actual frontend, since Nuxt currently only reads two SEO fields (title, meta description) per page — the rest of this panel may currently do nothing visible. Confirm with `Ctrl+U` on a live page (search for `og:title`, `application/ld+json`) before trusting it.
- **Siti** — Wagtail's multi-site configuration (which domain maps to which page tree root) — relevant only if this ever needs to serve more than one site/domain from the same install.
- **Reindirizzamenti** — set up 301/302 redirects from an old URL to a new one, entirely from the admin, no developer needed (useful whenever a page's slug changes and old links/bookmarks would otherwise 404).

### Reports
*Report* in the sidebar → built-in Wagtail reports: pages nearing their expiry date, locked pages, workflow activity — useful for a periodic "what needs attention" check without hunting through the whole page tree manually.

### Search
The search bar at the top searches pages, images, and documents together — faster than navigating the tree for a specific piece of content.

---

## 5. What's still outstanding — updated status

**Needs a decision from you before anything else, since it affects several answers above:**
- Which deployment path is real: the Docker Compose stack (what we've built and tested against all session), or the systemd + nginx + venv setup implied by `gunicorn.service`/`nginx.conf`? They're not compatible as currently written (see the port mismatch flagged at the top of this message).

**Carried over from earlier, still open:**
- No backup strategy yet for the production database, wherever it ends up living.
- `Guida-CMS-Axatel.docx` still has the outdated "you need a developer for theme changes" claim, and is missing sections for Tema/highlight/variants.
- Zero automated tests anywhere in the project.
- Image rendition (every image currently serves at full original resolution) — next up, per your own prioritization.
- The `Axatel012026`-looking password in `_env.example`, and three env files that disagree with each other.

**Resolved since last time:**
- Gunicorn worker count confirmed fixed at 3 (via `entrypoint.sh`) — the chatbot RAM planning from the last message is now based on a confirmed number, not a guess.
- `SECURE_PROXY_SSL_HEADER` (added to `production.py` last message) is now confirmed correct — `nginx.conf` does set `X-Forwarded-Proto https`, exactly matching what that Django setting expects.
