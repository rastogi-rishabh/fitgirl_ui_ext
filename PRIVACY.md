# Privacy Policy for FitGirl Repacks - Modern UI

**Effective Date:** August 15, 2026

## 1. Overview
FitGirl Repacks - Modern UI ("the Extension") is committed to protecting your privacy. This document outlines our zero data collection policy and provides permission justifications required for the Chrome Web Store.

---

## 2. Zero Data Collection
The Extension **does not collect, track, transmit, or share any personal user data**.
- No personally identifiable information (name, email, IP address) is collected.
- No browsing history or user activity is tracked, stored, or monitored.
- No third-party telemetry, tracking pixels, or analytics tools are used.

---

## 3. Chrome Web Store Permission Justifications

### `unlimitedStorage`
> **Justification for Chrome Web Store Privacy Tab:**
> "The `unlimitedStorage` permission is required to store the full offline catalog index of over 3,800+ public game repack listings, genres, and metadata in local IndexedDB. This ensures fast client-side searching, filtering, and offline catalog browsing without hitting browser quota limits (5MB) or making redundant network requests on every page load."

### `storage`
> **Justification for Chrome Web Store Privacy Tab:**
> "Used to save local user preferences (such as enabling/disabling the Modern UI, default view mode, and search filter settings) in `chrome.storage.local`."

### `alarms`
> **Justification for Chrome Web Store Privacy Tab:**
> "Used to schedule periodic background checks for newly published game repack releases."

---

## 4. Third-Party Network Requests
The Extension communicates strictly with public endpoints:
- **`https://fitgirl-repacks.site/*`**: To fetch public game repack posts and update notifications.
- **`https://store.steampowered.com/*`**: To retrieve public review ratings and media trailers on individual game details pages.

No user cookies, authorization credentials, or analytics identifiers are transmitted with these requests.

---

## 5. Contact
For questions or support, please open an issue on the official GitHub repository.
