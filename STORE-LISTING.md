# Chrome Web Store Submission — Drop Your Phone

Everything you need to copy-paste into the Chrome Web Store developer console.

---

## Before You Submit

1. **Host the privacy policy** — push the repo to GitHub and make it public,
   then the privacy policy URL will be:
   `https://pieceofbobsmith-cell.github.io/drop-your-phone/privacy.html`
   (or deploy `privacy.html` anywhere and use that URL)

2. **Take screenshots** — load the extension unpacked in Chrome, then screenshot:
   - The popup open showing the protest manifesto + form
   - The popup after opt-out showing the two sections (manual/auto)
   - The game (open game.html, let the city render, screenshot the title screen)
   - The full webpage (optout-page.html open in browser, screenshot the hero)
   - Required size: **1280×800** (use Windows Snipping Tool, crop to exact size)

3. **Zip the folder** — select all files inside the extension folder, zip them
   (not the folder itself — the manifest.json must be at the root of the zip)

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
Required to open data broker opt-out pages in background tabs as part of the automated opt-out queue.
```

**host_permissions: <all_urls>**
```
The cookie banner blocker must run on any website the user visits, since cookie banners appear on all domains. The opt-out form filler also needs access to 107 specific data broker domains to auto-fill opt-out forms.
```

---

## What to Expect

- **Review time**: 1–7 days (usually 2–3)
- **Developer fee**: $5 one-time (pay at chrome.google.com/webstore/devconsole)
- **After approval**: users get updates automatically when you push new versions
- **To update**: bump version in manifest.json → re-zip → re-upload → re-review
```
