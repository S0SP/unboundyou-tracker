import { googleDrive, driveFolderId } from "./client";
import { Readable } from "stream";

/**
 * Helper to convert a Buffer into a readable stream for Google API uploads.
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Gets or creates a subfolder inside a parent folder on Google Drive.
 */
export async function getOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<string> {
  const parent = parentId || driveFolderId || "root";

  try {
    // 1. Search for existing folder
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parent}' in parents and trashed = false`;
    const response = await googleDrive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    // 2. Create the folder if not found
    console.log(`Creating folder '${folderName}' under parent '${parent}'`);
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    };

    const folder = await googleDrive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    return folder.data.id!;
  } catch (error: any) {
    console.error(`Error in getOrCreateFolder for '${folderName}':`, error.message);
    throw error;
  }
}

/**
 * Uploads a PDF report buffer to Google Drive in the folder structure:
 * parentFolder / [Year] / [MonthName] / [StudentUUID] / [FileName].pdf
 */
export async function uploadReport(
  fileName: string,
  pdfBuffer: Buffer,
  studentUuid: string,
  year: string,
  month: string
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    // 1. Resolve folder hierarchy
    const yearFolderId = await getOrCreateFolder(year);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId);
    const studentFolderId = await getOrCreateFolder(studentUuid, monthFolderId);

    console.log(
      `Uploading ${fileName} to Drive under directory UBY Reports/${year}/${month}/${studentUuid}`
    );

    // 2. Upload file stream
    const fileMetadata = {
      name: fileName,
      parents: [studentFolderId],
      mimeType: "application/pdf",
    };

    const media = {
      mimeType: "application/pdf",
      body: bufferToStream(pdfBuffer),
    };

    const file = await googleDrive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileId = file.data.id!;
    let webViewLink = file.data.webViewLink || "";

    // 3. Make the uploaded file publicly viewable (view-only) so parents can access it
    try {
      await googleDrive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
      console.log(`Granted public read permission to file ID ${fileId}`);
    } catch (permError: any) {
      console.warn(
        `⚠️ Could not make file ID ${fileId} public. This is expected if the Service Account is restricted. Error:`,
        permError.message
      );
    }

    return {
      fileId,
      webViewLink,
    };
  } catch (error: any) {
    console.error("Error uploading report to Google Drive:", error.message);
    throw error;
  }
}
