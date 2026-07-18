const ENGAGEMENT_SHEET_ID = "1YbhCwchYSzVEFQrBNmpNaj_7i3P8pqMhmg3OAJPuI74";
const ENGAGEMENT_RSVP_SHEET_NAME = "Engagement RSVP Responses";

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const action = String(data.action || "").trim();

    if (action === "submitEngagementRsvp") {
      return submitEngagementRsvp(data);
    }

    return jsonResponse({ status: "error", message: "Unknown action." });
  } catch (error) {
    return jsonResponse({ status: "error", message: error.message });
  }
}

function doGet() {
  return jsonResponse({
    status: "success",
    message: "Engagement RSVP endpoint is running."
  });
}

function submitEngagementRsvp(data) {
  const names = cleanText(data.names);
  const attendance = cleanText(data.attendance);

  if (!names || !attendance) {
    return jsonResponse({
      status: "error",
      message: "Name and attendance are required."
    });
  }

  if (attendance !== "Joyfully accept" && attendance !== "Unable to attend") {
    return jsonResponse({
      status: "error",
      message: "Please choose a valid response."
    });
  }

  const spreadsheet = SpreadsheetApp.openById(ENGAGEMENT_SHEET_ID);
  const sheet = getOrCreateSheet(
    spreadsheet,
    ENGAGEMENT_RSVP_SHEET_NAME,
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
  return String(value || "").replace(/\s+/g, " ").trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
