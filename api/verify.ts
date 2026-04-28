import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { usn, dob } = req.body;

    if (!usn || !dob) {
      return res.status(400).json({ error: 'USN and Date of Birth are required.' });
    }

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME || 'Certificates';

    if (!apiKey || !spreadsheetId) {
      return res.status(200).json({ 
        error: 'Google Sheets integration not configured on Vercel. Please add GOOGLE_SHEETS_API_KEY and SPREADSHEET_ID to your Vercel project environment variables.',
        configNeeded: true
      });
    }

    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    
    // 1. List sheets to find correct one (handle case where user didn't name it exactly)
    let targetSheetName = sheetName;
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[];
      
      if (!sheetNames.includes(targetSheetName)) {
        const fallback = sheetNames.find(n => n.toLowerCase().includes('cert')) || sheetNames[0];
        targetSheetName = fallback;
      }
    } catch (metaError: any) {
      console.error('Metadata fetch failed:', metaError?.message || metaError);
      // Proceeding with original sheetName if metadata fails
    }

    // 2. Fetch records
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetSheetName}!A:D`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.status(404).json({ error: 'The certificate database appears to be empty.' });
    }

    const searchUsn = usn.trim().toUpperCase();
    const searchDob = dob.trim();

    const student = rows.slice(1).find(row => {
      const sheetUsn = (row[0] || '').toString().trim().toUpperCase();
      const sheetDob = (row[2] || '').toString().trim(); 
      return sheetUsn === searchUsn && sheetDob === searchDob;
    });

    if (student) {
      return res.json({
        name: student[1],
        pdfLink: student[3]
      });
    } else {
      return res.status(404).json({ error: 'No certificate found for the provided details. Check USN and DOB.' });
    }

  } catch (error: any) {
    console.error('API Handler Error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    return res.status(500).json({ 
      error: 'Internal Server Error while verifying certificate.',
      details: error?.message 
    });
  }
}
