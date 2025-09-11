### Admin Project Submission Guide

Use this checklist when adding a new portfolio project in the admin page. Required fields are marked as bold.

### What gets published
- Card/grid info: title, description, hero image, tags, project types, project URL
- Case study page: all additional fields below (testimonial, media, results, etc.)

### Required fields
- **Title**: Project name as you want it shown.
- **Description**: 1–2 sentence summary for the card and intro.
- **Hero Image URL**: Primary image for the project. You can upload a file in the form; it stores to Storage and fills this URL automatically.
- **Tags**: Comma‑separated, e.g., "Next.js, Firebase, UI/UX".
- **Date Completed**: YYYY‑MM‑DD (e.g., 2025-08-22).
- **Project Goal**: What you set out to achieve.
- **Solution**: How you addressed the goal.

### Recommended (surface and SEO)
- Project URL: Live link to the project site/app.
- Project Types (hidden filters): select any of [Websites, Apps, Software, Firmware]. Used for filtering on the portfolio grid.
- Featured: Toggle to optionally feature.

### Client & Social
- Client Name
- Client LinkedIn (URL)
- Client Instagram (URL)
- Client X/Twitter (URL)

### Content: Case Study Body
- Key Features: Comma‑separated list of highlights.
- Challenges: Problems encountered.
- Results: Tangible outcomes/metrics.
- Founder Story: Narrative about the founder/company.
- Scalability, Defensibility, Barriers To Entry, Tech Advantages: Strategic/technical positioning.

### Media
- Gallery Images: Comma‑separated URLs. Use the gallery uploader to push images; URLs are auto-filled.
- Video URL: Optional solution/demo video URL (YouTube/Vimeo, etc.).
- Client Logo URL: Use the client logo uploader if available; URL fills in here.
- Investor Logos: Comma‑separated logo URLs (use investor logos uploader).

### SEO
- SEO Title: Defaults to Title if blank.
- SEO Description: Defaults to Description if blank.
- SEO Keywords: Comma‑separated, defaults to Tags if blank.

### Market & Opportunity
- Industry, Company Stage, Funding Raised, Location
- Target Audience, Why Now, Market Size, Industry Trends, Competitive Landscape, Time Constraints

### Partners & Integrations
- Partners: Comma‑separated.
- Integrations: Comma‑separated.
- Strategic Partnerships: Comma‑separated.
- Accelerators: Comma‑separated.

### Funding & Credibility
- Funding & Partner Impact
- Valuation Change
- Media Coverage: One per line as "Title|URL" (see example below)
- Awards: Comma‑separated

### Team & Delivery
- Role: Our role in the project
- Deliverables: Comma‑separated (e.g., Wireframes, Design System, Frontend)
- Technology Stack: Comma‑separated (e.g., Next.js, React, Firebase)
- Innovations: Notable techniques/novelty
- Process Outline: High‑level process notes

### Results & Impact
- Business Results, Technical Results
- Investors: Comma‑separated list of investor names
- Growth Potential, Why Critical

### Formatting examples
```text
Tags: Next.js, Firebase, UI/UX
Project Types: Websites, Apps
Key Features: Dark mode, Admin dashboard, Stripe billing
Media Coverage (lines):
  TechCrunch|https://techcrunch.com/article
  Hacker News|https://news.ycombinator.com/item?id=123456
Awards: Webby Awards, Awwwards Honorable Mention
Date Completed: 2025-08-22
```

### Image upload notes
- The admin form provides uploaders for Hero, Gallery, Client Logo, and Investor Logos.
- Files are stored under `portfolio/{slug}/...` in Cloud Storage and their public URLs are auto‑inserted into the form.
- Recommended: 1600×1000 (or higher) for hero; use optimized JPG/WEBP. Keep each image under ~10–15 MB.

### Validation & defaults
- Required server‑side: Title, Description, Hero Image URL, Tags (array), Date Completed (YYYY‑MM‑DD), Project Goal, Solution.
- SEO fields default to Title/Description if left blank.
- Project Types are normalized to one of: Websites, Apps, Software, Firmware.

### Quick pre‑submit checklist
- [ ] Title, description, hero uploaded
- [ ] Tags added (3–6 recommended)
- [ ] Date completed set (YYYY‑MM‑DD)
- [ ] Project URL (if live)
- [ ] Goal and Solution filled
- [ ] At least 3 key features
- [ ] Gallery images uploaded (2–6 recommended)
- [ ] SEO title/description reviewed

