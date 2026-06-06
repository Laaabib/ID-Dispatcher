import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userMsg } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "API key is not configured." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userMsg,
      config: {
        systemInstruction: "You are 'Padma', a helpful AI assistant for the Padma AWT Rest House ID Manager application. Your primary language is Bengali (Bangla). You MUST respond to all queries in Bengali unless the user explicitly requests another language. When greeting, use 'Assalamualaikum' (আসসালামু আলাইকুম). Your sole purpose is to help users with tasks, policies, procedures, and information related to this specific application.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
      },
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel AI Route Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate response." });
  }
}
