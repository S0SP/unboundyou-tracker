import { google } from "googleapis";

// Load service credentials from environment variables
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
export const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
export const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!clientEmail || !privateKey) {
  // We log a warning so it doesn't crash during build if env variables aren't set yet.
  console.warn(
    "⚠️ Google Workspace environment variables are missing! API integration will fail."
  );
}

// Format the private key to handle literal '\n' replacement from env strings
const formattedPrivateKey = privateKey
  ? privateKey.replace(/\\n/g, "\n")
  : undefined;

// Scopes required for both Google Sheets and Google Drive manipulation
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

// Initialize Google OAuth2 Service Account client
const auth = new google.auth.JWT({
  email: clientEmail,
  key: formattedPrivateKey,
  scopes: SCOPES,
});

export const googleSheets = google.sheets({ version: "v4", auth });
export const googleDrive = google.drive({ version: "v3", auth });
