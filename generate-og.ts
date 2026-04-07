import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A high-quality, modern Open Graph image for a web service named "CrabSter". The service is an AI-powered web builder. The image should feature a sleek, abstract neon crab emblem integrated with futuristic web interface elements, floating code snippets, and a dark premium background with vibrant orange and purple neon accents. Clean, professional, no text.',
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public', { recursive: true });
        }
        fs.writeFileSync('public/og-image.jpg', buffer);
        console.log('Image generated successfully!');
        return;
      }
    }
    console.log('No image data found.');
  } catch (e) {
    console.error('Error generating image:', e);
  }
}
main();
