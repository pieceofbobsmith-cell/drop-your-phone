# Chrome Web Store Submission — Drop Your Phone

Everything you need to copy-paste into the Chrome Web Store developer console.

---

## Before You Submit

1. **Host the privacy policy** — Enable GitHub Pages on this repo:
   - Go to github.com/pieceofbobsmith-cell/drop-your-phone → Settings → Pages
   - Source: Deploy from branch → main → / (root) → Save
   - Wait ~2 minutes. Privacy policy will live at:
     `https://pieceofbobsmith-cell.github.io/drop-your-phone/privacy.html`
   - Paste that URL in the Chrome Web Store "Privacy policy URL" field.

2. **Take screenshots** — load the extension unpacked in Chrome, then screenshot:
   - The popup open showing the protest manifesto + form
   - The popup after opt-out showing the two sections (manual/auto)
   - Open `optout-page.html` in a browser tab and screenshot the hero section
   - Required size: **1280×800** (use Windows Snipping Tool, crop to exact size)
   - You need at least 1 screenshot; 3-5 is ideal.

3. **Zip the extension** — open the folder `ice-surveillance-extension\`, select
   these files ONLY (do NOT include the whole folder, and exclude the files below):
   ```
   INCLUDE:
     background.js
     brokers.js
     content.js
     manifest.json
     optout.js
     popup.css
     popup.html
     popup.js
     privacy.html
     icons\  (the whole icons folder)

   EXCLUDE (do not zip these):
     .git\
     STORE-LISTING.md
     optout-page.html
     test-extension.js
     test-extension.mjs
   ```
   Right-click the selected files → Send to → Compressed (zipped) folder.
   Rename the zip to `drop-your-phone-1.0.0.zip`.

---

## Store Listing Fields

### Name
```
Drop Your Phone
```

### Short Description (132 chars max)
```
Block trackers. Erase yourself from 107 data broker databases. A social justice art piece about ICE surveillance.
```
*(113 chars)*

### Detailed Description
```
THEY SOLD YOU.

107 data broker companies are selling your name, address, phone number, relatives, and real-time location — to anyone willing to pay. ICE is a paying customer. In 2021 alone, ICE spent millions purchasing commercial location data to track and arrest immigrants, bypassing the warrant requirements that would otherwise protect them.

This is completely legal. And you can fight back.

DROP YOUR PHONE does three things:

⚡ ERASE YOURSELF FROM 107 DATABASES
Enter your name, email, and city/state once. The extension automatically opens each data broker's opt-out page, fills your information, and submits the removal request — all in the background, one site at a time. 103 sites are fully automated. 4 require a manual step (instructions provided).

🚫 BLOCK TRACKERS ON EVERY SITE
Automatically dismisses cookie consent banners on every website you visit, choosing the most privacy-protective option (necessary cookies only, or reject all). Tracks and displays how many trackers have been blocked this session.

🎮 PLAY: SIGNAL
A short first-person game about what it means to be tracked. You have errands to run. ICE is watching your phone. Every app is selling your location. Can you get home?

---

This extension is a social justice art project about surveillance, immigration, and the price of being connected. Inspired by Georgetown Law's "American Dragnet" report (2022), which documented how ICE built a mass surveillance system from commercial data broker purchases.

Sources: Georgetown Law Center on Privacy and Technology, Electronic Frontier Foundation, ACLU, Brennan Center for Justice.
```

### Category
```
Productivity
```
*(or "Social & Communication" — either works)*

### Language
```
English
```

### Privacy Policy URL
```
https://pieceofbobsmith-cell.github.io/drop-your-phone/privacy.html
```
*(update this to wherever you host privacy.html)*

---

## Permission Justifications

Google will ask you to justify each permission. Copy-paste these:

**activeTab**
```
Required to detect and dismiss cookie consent banners on the active tab.
```

**scripting**
```
Required to inject the cookie banner dismissal script and the opt-out form auto-filler into browser tabs.
```

**storage**
```
Required to save the user's opt-out profile (name, email, city, state) locally on their device so they don't have to re-enter it each time.
```

**tabs**
```
Required to open data broker opt-out pages in background tabs as part of the automated opt-out queue. The extension opens one tab at a time (never floods the browser) and closes each tab automatically after the opt-out form is submitted.
```

**alarms**
```
Required to guarantee opt-out tabs close within a fixed time window even if a site redirects unexpectedly, shows a CAPTCHA, or fails to load. Without alarms, the opt-out queue could stall indefinitely on a broken page. The alarm fires after 1 minute (background tabs) or 10 minutes (foreground tabs requiring user input) and closes the tab so the queue can continue.
```

**content_scripts match pattern: <all_urls>**
```
The cookie consent banner blocker must run on any website the user visits, since cookie banners appear across all domains and cannot be predicted in advance. The extension reads the current page only to detect and click the "reject all" or "necessary only" button on cookie banners. No page content is recorded or transmitted. The opt-out form filler additionally runs on 107 specific data broker opt-out pages (listed in the manifest) to pre-fill removal request forms.
```

---

## What to Expect

- **Review time**: 1–7 days (usually 2–3)
- **Developer fee**: $5 one-time (pay at chrome.google.com/webstore/devconsole)
- **After approval**: users get updates automatically when you push new versions
- **To update**: bump version in manifest.json → re-zip → re-upload → re-review
```
