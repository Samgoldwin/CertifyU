import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCertificate } from '../src/services/sheetsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { usn, dob } = req.body;

  if (!usn || !dob) {
    return res.status(400).json({ error: 'USN and Date of Birth are required.' });
  }

  try {
    const result = await verifyCertificate(usn, dob);

    if (!result) {
      return res.status(404).json({ error: 'No certificate found for the provided details.' });
    }

    if ('configNeeded' in result) {
      return res.status(200).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'System error while fetching records.' });
  }
}
