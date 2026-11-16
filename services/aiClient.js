import { GoogleGenAI } from "@google/genai";

const providerError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getProviderStatus = (error) => {
  const status = error?.status || error?.response?.status;
  const code = error?.code || error?.error?.code;
  const message = String(error?.message || "");
  const bodyCode = message.match(/"code"\s*:\s*(\d{3})/)?.[1];
  return {
    status: Number(status || bodyCode) || null,
    code: Number(code || bodyCode) || null,
    message,
  };
};

export const generateContent = async (params) => {
  if (!process.env.AI_API_KEY || !process.env.AI_MODEL) {
    throw providerError(502, "AI service is temporarily unavailable. Please try again.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
  const timeoutMs = Math.max(Number(process.env.AI_TIMEOUT_MS) || 15000, 1000);
  let attempts = 0;

  while (attempts < 2) {
    attempts += 1;
    try {
      return await Promise.race([
        ai.models.generateContent({ ...params, model: process.env.AI_MODEL }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(providerError(504, "AI request timed out")),
            timeoutMs,
          ),
        ),
      ]);
    } catch (error) {
      const provider = getProviderStatus(error);
      const status = provider.status;
      const code = provider.code;
      const trimmedMessage = provider.message.slice(0, 300);
      if (status === 400 || status === 403 || status === 404) {
        console.error(
          `Gemini configuration error status=${status} code=${code || "n/a"} model=${process.env.AI_MODEL} message=${trimmedMessage}`,
        );
      } else {
        console.error(
          `Gemini provider failure status=${status || "n/a"} code=${code || "n/a"} model=${process.env.AI_MODEL} message=${trimmedMessage}`,
        );
      }
      if (status === 429 || code === 429 || String(error?.message).includes("RESOURCE_EXHAUSTED")) {
        throw providerError(429, "AI is busy, try again in a minute");
      }
      if ((status === 503 || code === 503) && attempts === 1) {
        await sleep(250);
        continue;
      }
      if (status === 504) throw providerError(504, "AI request timed out");
      throw providerError(502, "AI service is temporarily unavailable. Please try again.");
    }
  }
  throw providerError(502, "AI service is temporarily unavailable. Please try again.");
};
