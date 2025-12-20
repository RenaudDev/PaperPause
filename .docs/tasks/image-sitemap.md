# Role
You are a Senior Hugo Developer and Technical SEO Specialist.

# Context
We are "PaperPause," a coloring page website using Hugo, Cloudflare Pages, and Cloudflare Images.
We need to upgrade our sitemap generation to include **Google Image Extensions**. This is critical because our primary content is visual (coloring pages), and we need Google Images to index the high-resolution versions served via Cloudflare, not just the thumbnails.

# Current Architecture
- **Config**: `hugo.toml` defines a custom output format `SECTION_SITEMAP` for sections.
- **Theme**: `themes/visual-sanctuary-theme/`
- **Existing Template**: The theme currently uses `layouts/_default/list.section_sitemap.xml` to generate sitemaps for collections like `/animals/butterflies/`.
- **Image Handling**: 
    - Images are hosted on Cloudflare Images.
    - Frontmatter contains `image_url` (full URL) AND/OR `cf_image_id` (UUID).
    - Global Account Hash is in `hugo.toml` under `params.cf_images_hash`.
    - Delivery URL pattern: `https://imagedelivery.net/<hash>/<id>/<variant>`
    - Preferred variant for SEO: `desktop` (1200x1600) or `public`.

# Task
Create a project-level override for the section sitemap to inject `<image:image>` tags.

# Implementation Details
1. **Target File**: Create/Override `layouts/_default/list.section_sitemap.xml` in the project root (do not modify the theme directly).
2. **Namespace**: Ensure the root `<urlset>` includes `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`.
3. **Logic Loop**:
   - Iterate through `.Data.Pages` (the coloring pages in that collection).
   - Skip if `.Params.private` is true.
   - **Image Resolution Strategy**:
     - **Priority 1**: Use `.Params.image_url` if it exists and is not empty.
     - **Priority 2**: Construct the URL using `.Site.Params.cf_images_hash` + `.Params.cf_image_id` + variant `desktop`.
       - Example: `https://imagedelivery.net/G92SwfasiUv-usR1s4VYvA/1234-uuid/desktop`
     - **Fallback**: If neither exists, skip the `<image:image>` block (but still render the `<url>`).
4. **Metadata**:
   - `<image:title>`: Use the page `.Title`.
   - `<image:caption>`: Use `.Params.description` or fall back to "Free printable coloring page of {{ .Title }}".
   - `<image:license>`: `https://paperpause.app/terms/` (optional but good for trust).

# Expected Code Output
Please provide the full XML code for `layouts/_default/list.section_sitemap.xml`.