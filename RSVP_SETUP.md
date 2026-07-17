# Native RSVP and Wedding Wishes Setup

The website now shows the RSVP form directly. Guests will not be redirected to Google Forms.

The website also supports moderated public wedding wishes. Guests can submit a wish, but it will not appear publicly until you approve it in Google Sheets.

## 1. Create a Google Sheet

Create a blank spreadsheet named:

`Alwin & Annmareena Wedding RSVP`

Copy its ID from:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

## 2. Add Apps Script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete the starter code.
3. Copy all code from `google-apps-script.js`.
4. Confirm `SHEET_ID` matches your spreadsheet ID.
5. Save.

## 3. Deploy

1. Click **Deploy → New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy and approve permissions.
6. Copy the Web App URL ending in `/exec`.

## 4. Connect the website

Open `script.js` and replace:

```javascript
const RSVP_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with your `/exec` URL.

## 5. Wedding Wishes moderation

The Apps Script creates a second tab named:

`Wedding Wishes`

Columns:

```text
Submitted At | Name | Wish | Public Permission | Approved
```

New wishes are saved with:

```text
Approved = NO
```

To publish a wish on the website, change the row to:

```text
Approved = YES
```

Only rows with `Approved = YES` are returned publicly. Submitted wishes are not shown immediately.

After updating `google-apps-script.js`, deploy a new Apps Script web app version so the live site uses the latest backend code.

## 6. Push the update

```bash
git add .
git commit -m "Add native RSVP and wedding wishes"
git push
```
