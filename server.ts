import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// In production, we run on the platform-mandated port 3000.
// In development, we can run on 3001 and let Vite proxy requests to it.
const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3001;

app.use(cors());
app.use(express.json());

// API Route for verification
app.post('/api/verify', async (req, res) => {
  const { usn, dob } = req.body;

  if (!usn || !dob) {
    return res.status(400).json({ error: 'USN and Date of Birth are required.' });
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Certificates';

  if (!apiKey || !spreadsheetId) {
    return res.status(200).json({ 
      error: 'Google Sheets integration is not configured yet. The administrator needs to set GOOGLE_SHEETS_API_KEY and SPREADSHEET_ID.',
      configNeeded: true
    });
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    
    // Attempt to get spreadsheet metadata to list sheets
    let targetSheetName = sheetName;
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[];
      
      if (!sheetNames.includes(targetSheetName)) {
        // If specified name is missing, try common patterns or just use the first sheet
        const fallback = sheetNames.find(n => n.toLowerCase().includes('cert')) || sheetNames[0];
        console.warn(`Sheet "${targetSheetName}" not found. Falling back to "${fallback}". Available: ${sheetNames.join(', ')}`);
        targetSheetName = fallback;
      }
    } catch (metaError) {
      console.error('Metadata fetch failed, proceeding with default name:', metaError);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetSheetName}!A:D`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.status(404).json({ error: 'The certificate database appears to be empty. Please contact the administrator.' });
    }

    // Normalizing inputs for comparison
    const searchUsn = usn.trim().toUpperCase();
    const searchDob = dob.trim();

    // Row format expected: [USN, Name, DOB, PDF Link]
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
      return res.status(404).json({ error: 'No certificate found for the provided USN and Date of Birth. Please verify your details.' });
    }
  } catch (error: any) {
    // Log the full error structure for debugging
    console.error('Sheets API Detail:', {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
      response: error.response?.data
    });
    
    let message = 'System error while fetching records.';
    
    if (error.code === 403) {
      message = 'Permission Denied: Ensure the Google Sheet is shared as "Anyone with the link can view".';
    } else if (error.message.includes('API key')) {
      message = 'Invalid Google Sheets API Key.';
    } else if (error.code === 404) {
      message = 'Spreadsheet not found. Verify the SPREADSHEET_ID.';
    } else if (error.message.includes('Unable to parse range')) {
      message = `Sheet tab not found: "${sheetName}". Ensure the tab name in Google Sheets matches exactly.`;
    }
    
    return res.status(error.code || 500).json({ error: message });
  }
});

// Production: Serve static files from the Vite build directory
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const host = '0.0.0.0';
app.listen(Number(PORT), host, () => {
  console.log(`Server running at http://${host}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
