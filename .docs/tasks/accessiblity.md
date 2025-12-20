# PageSpeed & Accessibility Remediation Plan

**Status:** Pending  
**Priority:** High  
**Objective:** Resolve Google PageSpeed Insights accessibility warnings (contrast, ARIA labels) and improve UX across all template types.

---

## 1. Global Components

### Header (`layouts/partials/header.html`)
- **Issue:** Mobile menu button lacks an accessible name.
- **Fix:** Add `aria-label="Toggle mobile menu"`.
- **Location:** `<button @click="mobileMenuOpen = !mobileMenuOpen" ...>`

### Footer (`layouts/partials/footer.html`)
- **Issue:** Copyright text (`text-slate-500`) has insufficient contrast against `bg-slate-900`.
- **Fix:** Change class to `text-slate-400`.

### Cookie Banner (`layouts/partials/cookie-banner.html`)
- **Issue 1 (ARIA):** `role="dialog"` missing `aria-labelledby`.
    - **Fix:** Add `id="pp-cookie-title"` to the "We value your privacy" text and reference it in the parent div.
- **Issue 2 (Links):** "Learn more" link is ambiguous.
    - **Fix:** Add `aria-label="Learn more about our cookie policy"`.
- **Issue 3 (Contrast):** Accept button teal background is too light.
    - **Fix:** Change background color in CSS/Style block to `#0d9488` (Teal 600/700 equiv) or darker.

### Search Modal (`layouts/partials/search-modal.html`)
- **Issue:** Close icon is decorative but visible to screen readers inside a button that already has a label.
- **Fix:** Ensure the `<svg>` inside the close button has `aria-hidden="true"`.

---

## 2. Homepage (`layouts/index.html`)

### Hero Section
- **Issue 1 (Contrast):** Subheading text `text-teal-50` on `bg-teal-600` is low contrast.
    - **Fix:** Change to `text-white`.
- **Issue 2 (Contrast):** Stats pills background `bg-white/15` is too light for white text.
    - **Fix:** Change to `bg-teal-800/50` with `border border-teal-500/30`.
- **Issue 3 (Accessibility):** Search button (magnifying glass) lacks a label.
    - **Fix:** Add `aria-label="Search"`.

---

## 3. List & Category Pages (`layouts/_default/list.html`)

### Header Section
- **Issue:** White text on `bg-teal-600` fails AA contrast for smaller text elements (breadcrumbs).
- **Fix:** Darken section background to `bg-teal-700`.

### Empty State
- **Issue:** "No pages found" text (`text-slate-500`) is too light.
- **Fix:** Change to `text-slate-600 font-medium`.

---

## 4. Single Coloring Pages (`layouts/_default/single.html`)

### Image Details Toggle
- **Issue:** Hardcoded `role="button"` and `aria-expanded` on a `<summary>` tag confuses screen readers.
- **Fix:** Remove manual `role` and `aria-expanded` attributes; let the browser handle the native semantic behavior.

### Placeholders
- **Issue:** "No Image" and "Ads" placeholder text is too faint.
- **Fix:** Change text color to `text-slate-500` and add `font-medium`.

---

## 5. Standard Pages (`layouts/page/single.html`)

### Header Section
- **Issue:** White text on `bg-teal-600`.
- **Fix:** Darken section background to `bg-teal-700`.

---

## 6. Contact Form (`layouts/shortcodes/contact-form.html`)

### Required Fields
- **Issue:** Red asterisk (`text-red-500`) falls slightly below 4.5:1 contrast ratio.
- **Fix:** Change to `text-red-600`.