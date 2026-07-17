const SHEET_ID = "1UzeoUMZRoeraxghGGcrii3w4X0wnKzBnd4fwJsWo73Q";
const RSVP_SHEET_NAME = "RSVP Responses";
const WISHES_SHEET_NAME = "Wedding Wishes";
const MAX_WISH_LENGTH = 180;

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const action = String(data.action || "submitRsvp").trim();

    if (action === "submitWish") {
      return submitWish(data);
    }

    if (action === "getApprovedWishes") {
      return getApprovedWishes();
    }

    if (action === "submitRsvp") {
      return submitRsvp(data);
    }

    return jsonResponse({ status: "error", message: "Unknown action." });
  } catch (error) {
    return jsonResponse({ status: "error", message: error.message });
  }
}

function doGet() {
  return jsonResponse({
    status: "success",
    message: "Wedding RSVP and Wishes endpoint is running."
  });
}

function submitRsvp(data) {
  const names = cleanText(data.names);
  const attendance = cleanText(data.attendance);

  if (!names || !attendance) {
    return jsonResponse({
      status: "error",
      message: "Name and attendance are required."
    });
  }

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(
    spreadsheet,
    RSVP_SHEET_NAME,
    ["Timestamp", "Name(s)", "Attendance", "Message", "Submitted At"]
  );

  sheet.appendRow([
    new Date(),
    names,
    attendance,
    cleanText(data.message || ""),
    cleanText(data.submittedAt || "")
  ]);

  return jsonResponse({ status: "success" });
}

function submitWish(data) {
  const name = cleanText(data.name);
  const wish = cleanText(data.wish);
  const publicPermission = data.publicPermission === true;

  if (!name) {
    return jsonResponse({ status: "error", message: "Name is required." });
  }

  if (!wish) {
    return jsonResponse({ status: "error", message: "Wish is required." });
  }

  if (wish.length > MAX_WISH_LENGTH) {
    return jsonResponse({
      status: "error",
      message: "Wish must be 180 characters or fewer."
    });
  }

  if (!publicPermission) {
    return jsonResponse({
      status: "error",
      message: "Public permission is required."
    });
  }

  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(
    spreadsheet,
    WISHES_SHEET_NAME,
    ["Submitted At", "Name", "Wish", "Public Permission", "Approved"]
  );

  sheet.appendRow([
    cleanText(data.submittedAt || new Date().toISOString()),
    name,
    wish,
    "YES",
    "NO"
  ]);

  return jsonResponse({ status: "success" });
}

function getApprovedWishes() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(
    spreadsheet,
    WISHES_SHEET_NAME,
    ["Submitted At", "Name", "Wish", "Public Permission", "Approved"]
  );
  const values = sheet.getDataRange().getValues();
  const wishes = [];

  for (let index = 1; index < values.length; index += 1) {
    const row = values[index];
    const approved = String(row[4] || "").trim().toUpperCase();
    const name = cleanText(row[1] || "");
    const wish = cleanText(row[2] || "");

    if (approved === "YES" && name && wish) {
      wishes.push({
        name: name,
        wish: wish.slice(0, MAX_WISH_LENGTH)
      });
    }
  }

  return jsonResponse({ status: "success", wishes: wishes });
}

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function cleanText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
