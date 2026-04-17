import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RiskLevel } from './riskCalculator';

// Initialize the Gemini API using the provided key
// In a real production app, this should be done server-side to protect the API key.
const API_KEY = "AIzaSyB0nHGrBs04zNAEcQzlK0Ahu0fpCMYl67k";
const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiInsights = async (
    stateName: string,
    temp: number,
    discharge: number,
    seismic: number,
    overallRisk: RiskLevel
): Promise<string> => {
    try {
        // We use gemini-1.5-flash-latest for fast, textual generation
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
      You are an expert disaster management AI system analyzing real-time safety data for the Indian state of ${stateName}.
      
      Current Live Metrics:
      - Temperature: ${temp}°C
      - River Discharge: ${discharge} m³/s
      - Seismic Activity (Magnitude): ${seismic}
      - Calculated Overall Risk Status: ${overallRisk.toUpperCase()}

      Task: Provide a short (no more than 3-4 sentences), highly professional and urgent analysis of these specific conditions. 
      Tailor the advice specifically to the primary risk factor driving the ${overallRisk} status. 
      Do not repeat the numbers verbatim, but contextualize them (e.g., "The extreme heat wave conditions require...").
      Provide actionable, immediate advice for residents in ${stateName}.
      Write in plaintext without complex markdown like headers or bolding.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI Insights are currently unavailable due to a connection issue with the analysis server. Please rely on standard precautions.";
    }
};
