import "dotenv/config";
import { generateAIResponse } from "./ai.service.js";

const response = await generateAIResponse(
  "what is my name."
);

console.log("Munshi AI:", response);