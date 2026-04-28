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
    const { usn } = req.body;

    if (!usn) {
      return res.status(400).json({ error: 'USN is required.' });
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
      range: `${targetSheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.status(404).json({ error: 'The certificate database appears to be empty.' });
    }

    // Dynamic Column Discovery from Header Row
    const headers = (rows[0] || []).map(h => (h || '').toString().toLowerCase().trim());
    const usnIdx = headers.findIndex(h => h.includes('usn') || h.includes('id') || h.includes('roll'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h === 'student');
    const linkIdx = headers.findIndex(h => h.includes('link') || h.includes('pdf') || h.includes('drive') || h.includes('url') || h.includes('certificate'));

    // Fallback strategies
    const fUsnIdx = usnIdx !== -1 ? usnIdx : 0;
    const fNameIdx = nameIdx !== -1 ? nameIdx : 1;
    const fLinkIdx = linkIdx !== -1 ? linkIdx : 3;

    const searchUsn = usn.trim().toUpperCase();

    const student = rows.slice(1).find(row => {
      const sheetUsn = (row[fUsnIdx] || '').toString().trim().toUpperCase();
      return sheetUsn === searchUsn;
    });

    if (student) {
      const pdfLink = student[fLinkIdx];
      if (!pdfLink) {
        return res.status(404).json({ error: 'Record found, but the certificate link is missing in the database.' });
      }
      return res.json({
        name: student[fNameIdx] || 'Student',
        pdfLink: pdfLink
      });
    } else {
      return res.status(404).json({ error: 'No certificate found for the provided details. Check USN.' });
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
