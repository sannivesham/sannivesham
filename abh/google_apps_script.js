/**
 * =========================================================================
 * ABHAY HINDU SENA - OFFICIAL SEVAK REGISTRATION GOOGLE APPS SCRIPT
 * =========================================================================
 * 
 * INSTRUCTIONS FOR GOOGLE SHEETS:
 * 1. Open Google Sheets (https://sheets.new) and create a new sheet named "Abhay Hindu Sena - Sevaks".
 * 2. Click "Extensions" -> "Apps Script" in the top menu.
 * 3. Delete any code in the editor, paste THIS ENTIRE SCRIPT, and click the Save icon (Ctrl+S).
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set:
 *    - Description: "AHS Sevak Registration API"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (CRITICAL: Must be "Anyone" so the website can submit without login)
 * 7. Click "Deploy" and grant permissions.
 * 8. Copy the "Web app URL" (ends in /exec).
 * 9. Paste that URL in index.html (or inside the Admin Dashboard Settings).
 * =========================================================================
 */

// ABHAY HINDU SENA - OFFICIAL GOOGLE SHEET ID
var SPREADSHEET_ID = "1Xgm56f2L8AZIduz_6kR24WYA6_QtTYFhdx9Pg2epPOA";

function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch(e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other concurrent requests to avoid row collision
  lock.tryLock(30000);

  try {
    var doc = getSpreadsheet();
    var sheet = doc.getSheetByName("Sevaks");
    if (!sheet) {
      sheet = doc.getActiveSheet();
      sheet.setName("Sevaks");
    }

    // Set up headers if first row is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Sevak ID",
        "Full Name (పేరు)",
        "WhatsApp Mobile (మొబైల్)",
        "State (రాష్ట్రం)",
        "District / City (జిల్లా)",
        "Mandal / Area (మండలం)",
        "Referred By (రిఫరల్)",
        "Email (ఈమెయిల్)",
        "Instagram ID (ఇన్‌స్టాగ్రామ్)",
        "Any Question (ప్రశ్న)",
        "Any Suggestion (సలహా)",
        "Registered Date & Time",
        "Submission Source"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#FF6B1A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    // Calculate Kali Yugam Year if not supplied
    var kaliYear = getKaliYugamYear(new Date());
    var rowNum = sheet.getLastRow(); // Current rows count including header
    var autoSeq = 999 + rowNum; // Row 2 = 1000, Row 3 = 1001, etc.
    
    var sevakId = data.sevakId || (kaliYear + "-ahs-" + autoSeq);
    var name = data.name || "";
    var phone = data.phone || "";
    var state = data.state || "";
    var district = data.district || "";
    var mandal = data.mandal || "";
    var referral = data.referral || data.referredBy || "Direct";
    var email = data.email || "N/A";
    var instagram = data.instagram || "N/A";
    var question = data.question || "N/A";
    var suggestion = data.suggestion || "N/A";
    var timestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    var source = data.source || "Website Portal";

    // Append registration row
    sheet.appendRow([
      sevakId,
      name,
      phone,
      state,
      district,
      mandal,
      referral,
      email,
      instagram,
      question,
      suggestion,
      timestamp,
      source
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        sevakId: sevakId,
        message: "Dharma Sevak successfully enlisted!",
        row: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "online",
      organization: "Abhay Hindu Sena",
      service: "Sevak Registration API",
      founder: "Shri Radha Manohar Das",
      kaliYugaYear: getKaliYugamYear(new Date())
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Calculates Kali Yugam Year:
 * Calibrated so 2026 is 5127, advancing to 5128 after Ugadi 2027 (April 7, 2027).
 */
function getKaliYugamYear(date) {
  var d = date || new Date();
  var year = d.getFullYear();
  
  // Approximate Ugadi dates for reference
  var ugadiDates = {
    2026: new Date(2026, 2, 19), // Mar 19, 2026
    2027: new Date(2027, 3, 7),  // Apr 7, 2027
    2028: new Date(2028, 2, 27), // Mar 27, 2028
    2029: new Date(2029, 3, 14), // Apr 14, 2029
    2030: new Date(2030, 3, 3)   // Apr 3, 2030
  };
  
  // Before Ugadi in 2027, it remains 5127
  if (d < ugadiDates[2027]) {
    return 5127;
  }
  
  // Subsequent years calculate based on Ugadi
  var nextUgadi = ugadiDates[year] || new Date(year, 2, 25);
  var base = 5128 + (year - 2027);
  if (d < nextUgadi) {
    base -= 1;
  }
  return base;
}
