import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // المسار (Endpoint) لي غتولي الإضافة تصيفط ليه الداتا
  app.post("/api/generate-outreach", async (req, res) => {
    try {
      const leadData = req.body;
      console.log("📥 New Lead Received:", leadData.business_name || leadData);

      // الـ Prompt الديناميكي (تقدر تبدلو من بعد باش يجي من الـ Dashboard)
      const systemPrompt = `Tu es un expert digital. Rédige un message court (4 phrases max) et prestigieux pour proposer une amélioration de la présence en ligne. Ne mentionne pas d'agence.`;
      
      const prompt = `INSTRUCTIONS: ${systemPrompt}\n\nDONNÉES CLIENT: ${JSON.stringify(leadData)}\n\nRédige uniquement le message final.`;

      // التواصل مع Gemini API باستخدام الـ SDK المثبت فالسيرفر
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const generatedMessage = response.text?.trim();
      
      // إرسال الميساج الواجد كـ Response
      res.status(200).json({ 
        success: true, 
        lead: leadData,
        message: generatedMessage 
      });

    } catch (error: any) {
      console.error("❌ API Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { systemPrompt, leadData } = req.body;

      const prompt = `INSTRUCTIONS: ${systemPrompt}\n\nDONNÉES CLIENT: ${leadData}\n\nRédige uniquement le message final.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ message: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
