import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { verifyCertificate } from './src/services/sheetsService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for verification
  app.post('/api/verify', async (req, res) => {
    const { usn, dob } = req.body;

    if (!usn || !dob) {
      return res.status(400).json({ error: 'USN and Date of Birth are required.' });
    }

    try {
      const result = await verifyCertificate(usn, dob);

      if (!result) {
        return res.status(404).json({ error: 'No certificate found for the provided USN and Date of Birth. Please verify your details.' });
      }

      // Handle configNeeded case from service
      if ('configNeeded' in result && result.configNeeded) {
        return res.status(200).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Sheets API Error:', error);
      
      let message = 'System error while fetching records.';
      
      if (error.code === 403) {
        message = 'Permission Denied: Ensure the Google Sheet is shared as "Anyone with the link can view".';
      } else if (error.message.includes('API key')) {
        message = 'Invalid Google Sheets API Key.';
      } else if (error.code === 404) {
        message = 'Spreadsheet not found. Verify the SPREADSHEET_ID.';
      } else if (error.message.includes('Unable to parse range')) {
        message = 'Sheet tab not found. Ensure the tab name in Google Sheets matches exactly.';
      }
      
      return res.status(error.code || 500).json({ error: message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const host = '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`Server running at http://${host}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
