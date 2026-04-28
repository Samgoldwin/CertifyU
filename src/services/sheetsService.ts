import { google } from 'googleapis';

export async function verifyCertificate(usn: string, dob: string) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Certificates';

  if (!apiKey || !spreadsheetId) {
    return { 
      error: 'Google Sheets integration is not configured yet. The administrator needs to set GOOGLE_SHEETS_API_KEY and SPREADSHEET_ID.',
      configNeeded: true
    };
  }

  const sheets = google.sheets({ version: 'v4', auth: apiKey });
  
  // Attempt to get spreadsheet metadata to list sheets
  let targetSheetName = sheetName;
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[];
    
    if (!sheetNames.includes(targetSheetName)) {
      const fallback = sheetNames.find(n => n.toLowerCase().includes('cert')) || sheetNames[0];
      console.warn(`Sheet "${targetSheetName}" not found. Falling back to "${fallback}".`);
      targetSheetName = fallback;
    }
  } catch (metaError) {
    console.error('Metadata fetch failed:', metaError);
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${targetSheetName}!A:D`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    throw new Error('The certificate database appears to be empty.');
  }

  const searchUsn = usn.trim().toUpperCase();
  const searchDob = dob.trim();

  const student = rows.slice(1).find(row => {
    const sheetUsn = (row[0] || '').toString().trim().toUpperCase();
    const sheetDob = (row[2] || '').toString().trim(); 
    return sheetUsn === searchUsn && sheetDob === searchDob;
  });

  if (student) {
    return {
      name: student[1],
      pdfLink: student[3]
    };
  } else {
    return null;
  }
}
