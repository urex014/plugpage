/**
 * PlugPage lead capture -> Google Sheet.
 *
 * Paste this into Extensions > Apps Script of the Google Sheet that should
 * receive leads, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). See README.md in this folder.
 *
 * Columns: timestamp | name | whatsapp | shop/handle | category | message | source page
 */

var SHEET_NAME = "Leads";
var HEADERS = ["timestamp", "name", "whatsapp", "shop/handle", "category", "message", "source page"];
var MAX_LEN = { name: 80, whatsapp: 20, shop: 80, category: 60, message: 500, page: 200 };

function doPost(e) {
  try {
    var p = readParams_(e);

    // Honeypot: the hidden "website" field is only ever filled by bots.
    // Answer "ok" so bots don't retry, but store nothing.
    if (p.website) return json_({ ok: true });

    var row = {
      name: clean_(p.name, MAX_LEN.name),
      whatsapp: clean_(p.whatsapp, MAX_LEN.whatsapp),
      shop: clean_(p.shop, MAX_LEN.shop),
      category: clean_(p.category, MAX_LEN.category),
      message: clean_(p.message, MAX_LEN.message),
      page: clean_(p.page, MAX_LEN.page),
    };
    if (!row.name || !row.whatsapp || !row.shop || !row.category) {
      return json_({ ok: false, error: "missing_fields" });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet_();
      sheet.appendRow([
        new Date(),
        row.name,
        row.whatsapp,
        row.shop,
        row.category,
        row.message,
        row.page,
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server_error" });
  }
}

// Visiting the /exec URL in a browser shows this; handy to check the deploy works.
function doGet() {
  return json_({ ok: true, service: "plugpage-lead-capture" });
}

function readParams_(e) {
  var p = (e && e.parameter) || {};
  // Also accept a JSON body (e.g. text/plain or application/json POSTs).
  if (e && e.postData && e.postData.contents && !Object.keys(p).length) {
    try {
      p = JSON.parse(e.postData.contents) || {};
    } catch (ignore) {}
  }
  return p;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

// Trim, cap length, and stop spreadsheet formula injection (=, +, -, @).
function clean_(v, max) {
  var s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim();
  if (s.length > max) s = s.slice(0, max);
  if (/^[=+\-@]/.test(s) && !/^\+\d[\d\s]*$/.test(s)) s = "'" + s; // keep +234... numbers as-is
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Optional: run once from the editor to add the header row and test writing.
function setupAndTest() {
  getSheet_().appendRow([new Date(), "TEST - delete me", "+2340000000000", "@test", "Other", "setup test", "/"]);
}
