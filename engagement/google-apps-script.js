/**
 * SD's BETHLEHEM: private RSVP sheet + immediately public Wishes sheet.
 * Install this script from the Bethlehem spreadsheet (Extensions > Apps Script).
 * Deploy as a Web App: Execute as Me; access Anyone.
 * This file is deliberately independent of the wedding website and its backend.
 */
const BETHLEHEM_SHEET_ID = "1uo-cbWaOznfu8DdgmCbxzaFo0RCJtmworBswaLTh6Xg";
const RSVP_TAB = "RSVP Responses";
const WISHES_TAB = "Wishes";
const MAX_PUBLIC_WISHES = 100;

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action !== "getWishes") {
      return output_({ status: "success", message: "Bethlehem RSVP and Wishes backend is running." });
    }
    const callback = String(p.callback || "");
    if (callback && !/^bethlehemWishes_[A-Za-z0-9_]{1,80}$/.test(callback)) {
      return output_({ status: "error", message: "Invalid callback." });
    }
    return output_({ status: "success", wishes: getWishes_() }, callback);
  } catch (error) {
    return output_({ status: "error", message: "Unable to load wishes." });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 4096) {
      return output_({ status: "error", message: "Invalid request." });
    }
    const data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return output_({ status: "error", message: "Invalid request data." });
    }
    if (data.website) { // Honeypot: real guests never fill this field.
      return output_({ status: "success" });
    }
    const action = String(data.action || "");
    if (action === "submitRsvp") return saveRsvp_(data);
    if (action === "submitWish") return saveWish_(data);
    return output_({ status: "error", message: "Unknown action." });
  } catch (error) {
    return output_({ status: "error", message: "We could not save this response. Please try again." });
  }
}

function clean_(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength + 1);
}

function safeCell_(value) {
  // Defend against Google Sheets formula injection.
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function submitId_(value) {
  const id = clean_(value, 80);
  return /^[A-Za-z0-9_-]{8,80}$/.test(id) ? id : "";
}

function getTab_(name) {
  const sheet = SpreadsheetApp.openById(BETHLEHEM_SHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error("Missing sheet: " + name);
  return sheet;
}

function wasSaved_(sheet, id, idColumn) {
  const n = sheet.getLastRow();
  if (n < 2) return false;
  const count = Math.min(n - 1, 200);
  return sheet.getRange(n - count + 1, idColumn, count, 1).getDisplayValues()
    .some(function(row) { return row[0] === id; });
}

function saveRsvp_(data) {
  const name = clean_(data.name, 80);
  const attendance = clean_(data.attendance, 8);
  const message = clean_(data.message || "", 400);
  const submissionId = submitId_(data.submissionId);
  const submittedAt = clean_(data.submittedAt || "", 40);
  if (!name || name.length > 80 || (attendance !== "yes" && attendance !== "no") ||
      message.length > 400 || !submissionId) {
    return output_({ status: "error", message: "Please enter your name and attendance." });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getTab_(RSVP_TAB);
    if (!wasSaved_(sheet, submissionId, 6)) {
      sheet.appendRow([new Date(), safeCell_(name), attendance, safeCell_(message), submittedAt, submissionId]);
      SpreadsheetApp.flush();
    }
    return output_({ status: "success" });
  } finally {
    lock.releaseLock();
  }
}

function saveWish_(data) {
  const name = clean_(data.name, 80);
  const wish = clean_(data.wish, 350);
  const submissionId = submitId_(data.submissionId);
  if (!name || name.length > 80 || !wish || wish.length > 350 || !submissionId) {
    return output_({ status: "error", message: "Please enter a name and wish (up to 350 characters)." });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getTab_(WISHES_TAB);
    if (!wasSaved_(sheet, submissionId, 4)) {
      // No manual approval: wishes are returned to everyone immediately.
      sheet.appendRow([new Date(), safeCell_(name), safeCell_(wish), submissionId]);
      SpreadsheetApp.flush();
    }
    return output_({ status: "success", wish: { name: name, wish: wish } });
  } finally {
    lock.releaseLock();
  }
}

function getWishes_() {
  const sheet = getTab_(WISHES_TAB);
  const n = sheet.getLastRow();
  if (n < 2) return [];
  const count = Math.min(n - 1, MAX_PUBLIC_WISHES);
  const rows = sheet.getRange(n - count + 1, 1, count, 4).getDisplayValues();
  return rows.reverse().map(function(row) {
    // Prepending a leading apostrophe is Sheets' escape syntax, not display content.
    return {
      name: clean_(row[1], 80),
      wish: clean_(row[2], 350)
    };
  }).filter(function(item) { return item.name && item.wish; });
}

function output_(payload, callback) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}