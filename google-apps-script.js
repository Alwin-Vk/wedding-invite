const SHEET_ID = "1UzeoUMZRoeraxghGGcrii3w4X0wnKzBnd4fwJsWo73Q";
const SHEET_NAME = "RSVP Responses";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");

    if (!data.names || !data.attendance) {
      return jsonResponse({ status: "error", message: "Name and attendance are required." });
    }

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name(s)", "Attendance", "Message", "Submitted At"]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      String(data.names).trim(),
      String(data.attendance).trim(),
      String(data.message || "").trim(),
      String(data.submittedAt || "")
    ]);

    return jsonResponse({ status: "success" });
  } catch (error) {
    return jsonResponse({ status: "error", message: error.message });
  }
}

function doGet() {
  return jsonResponse({ status: "success", message: "Wedding RSVP endpoint is running." });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
