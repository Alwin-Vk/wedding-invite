# SD's BETHLEHEM: Google Sheets backend setup

This integration is separate from the wedding site's Sheets, Apps Script and assets.

## Spreadsheet (already created)

[Open the Bethlehem spreadsheet](https://docs.google.com/spreadsheets/d/1uo-cbWaOznfu8DdgmCbxzaFo0RCJtmworBswaLTh6Xg/edit)

- **RSVP Responses**: Timestamp, Guest Name, Attendance, Message, Client Submitted At, Submission ID.
- **Wishes**: Timestamp, Name, Wish, Submission ID.

The spreadsheet should remain **private**. Only the Apps Script web app should access it.

## One-time Google Apps Script deployment

1. Open the Bethlehem spreadsheet (not the wedding spreadsheet).
2. Select **Extensions > Apps Script**.
3. Replace the starter code in **Code.gs** with the entire contents of [google-apps-script.js](./google-apps-script.js).
4. Click **Save** and name the project **Bethlehem Housewarming Backend**.
5. Select **Deploy > New deployment > Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**.
7. Authorize access to this dedicated spreadsheet and complete the deployment.
8. Copy the web app URL ending in **/exec** and send it back in chat. The invitation is not live-connected until this is provided and tested.

## API

- GET /exec — backend health check.
- GET /exec?action=getWishes&callback=bethlehemWishes_test — public read-only JSONP feed.
- POST /exec with Content-Type text/plain and JSON {"action":"submitRsvp", "name":"...", "attendance":"yes|no", "message":"...", "submittedAt":"...", "submissionId":"unique-id"} — private RSVP.
- POST /exec with JSON {"action":"submitWish", "name":"...", "wish":"...", "submissionId":"unique-id"} — immediately public wish.

*Wishes are public as soon as submitted*. Inform guests that their name and wish are publicly displayed. RSVP names and attendance are not publicly exposed.

## Important

- No Apps Script URL from the wedding website is reused.
- The wedding homepage and its Google Sheets backend must not be modified.
- This script requires a public web app deployment so guests can submit without a Google account.
- Do not enable link-sharing on the actual spreadsheet.
- Avoid announcing full deployment until an iPhone, Android, and desktop browser test successfully saves and retrieves an RSVP and a Wish.
- Basic input limits and duplicate request detection are included, but a public unmoderated wishes wall can still receive spam. Hosts can manually remove offending rows from the sheet if needed.
