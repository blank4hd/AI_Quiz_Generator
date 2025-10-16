const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini AI
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("ERROR: GOOGLE_GEMINI_API_KEY environment variable is not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "quiz-generator-backend",
    timestamp: new Date().toISOString(),
  });
});

// Generate quiz endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { content, type, options } = req.body;

    // Validation
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!type || !["generate", "add", "regenerate"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be: generate, add, or regenerate" });
    }

    // Validate and truncate content if too long
    const maxContentLength = 30000;
    let processedContent = content;
    if (content.length > maxContentLength) {
      processedContent =
        content.substring(0, maxContentLength) +
        "\n\n[Content truncated for processing]";
      console.log(
        `Content truncated from ${content.length} to ${maxContentLength} characters`
      );
    }

    const count = options?.count || 5;
    const questionType = options?.questionType || "mixed";
    const difficulty = options?.difficulty || "mixed";

    console.log(`Processing ${type} request:`, {
      contentLength: processedContent.length,
      count,
      questionType,
      difficulty,
    });

    // Build system prompt
    let systemPrompt = `You are an expert quiz generator. Generate educational quiz questions based on the provided content.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Return ONLY a valid JSON array starting with [ and ending with ]
2. Do NOT include any markdown formatting, code blocks, or extra text
3. Do NOT wrap the response in backticks or any other formatting
4. START YOUR RESPONSE WITH [ AND END WITH ]
5. Generate EXACTLY ${count} questions

Each question MUST follow this exact structure:
{
  "type": "mcq" | "true-false" | "short-answer",
  "stem": "question text here",
  "options": [
    {"text": "option text", "isCorrect": true/false}
  ],
  "explanation": "detailed explanation",
  "difficulty": "easy" | "medium" | "hard"
}

QUESTION TYPE RULES:`;

    if (questionType === "mixed") {
      systemPrompt += `\n- Generate a mix of question types (mcq, true-false, short-answer)`;
    } else {
      systemPrompt += `\n- Generate ALL questions as '${questionType}' type ONLY. Do not mix question types.`;
    }

    systemPrompt += `\n\nDIFFICULTY RULES:`;

    if (difficulty === "mixed") {
      systemPrompt += `\n- Mix difficulty levels (easy, medium, hard)`;
    } else {
      systemPrompt += `\n- Generate ALL questions as '${difficulty}' difficulty ONLY.`;
    }

    systemPrompt += `\n\nOPTION RULES:
- Multiple choice (mcq): Provide exactly 4 options, mark ONE as correct
- True/False: Provide exactly 2 options ("True" and "False"), mark ONE as correct
- Short answer: Provide 1 option with the correct answer text

Remember: Return ONLY the JSON array, nothing else. START WITH [ AND END WITH ]`;

    // Build user prompt based on type
    let userPrompt = "";

    if (type === "generate") {
      userPrompt = `Generate ${count} quiz questions from this content:\n\n${processedContent}`;
    } else if (type === "add") {
      userPrompt = `Generate ${count} additional quiz questions from this content. Make them different from any existing questions:\n\n${processedContent}`;
    } else if (type === "regenerate") {
      const existingQuestion = options.existingQuestion;
      if (!existingQuestion || !existingQuestion.stem) {
        return res
          .status(400)
          .json({ error: "existingQuestion is required for regenerate type" });
      }
      userPrompt = `Regenerate this question to be different but on the same topic:\n\nOriginal question: ${existingQuestion.stem}\n\nContent: ${processedContent}`;
    }

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    console.log("Calling Gemini API...");
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response;
    const text = response.text();

    console.log("Gemini response preview:", text.substring(0, 500));

    // Extract JSON from response
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Try to find JSON array in the text
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonText = arrayMatch[0];
    }

    console.log("Extracted JSON preview:", jsonText.substring(0, 500));

    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed JSON text:", jsonText);
      throw new Error("AI returned invalid JSON. Please try again.");
    }

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    if (questions.length === 0) {
      throw new Error("No questions generated");
    }

    // Validate and enhance questions
    const validatedQuestions = questions.map((q, index) => {
      if (!q.type || !q.stem || !q.options || !q.difficulty) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      if (!Array.isArray(q.options)) {
        throw new Error(`Question ${index + 1} options must be an array`);
      }

      return {
        ...q,
        id: `${Date.now()}-${index}`,
      };
    });

    console.log(
      `Successfully generated ${validatedQuestions.length} questions`
    );

    res.json({ questions: validatedQuestions });
  } catch (error) {
    console.error("Error generating quiz:", error);

    const statusCode = error.message.includes("invalid JSON") ? 422 : 500;
    const requestType = req.body.type || "unknown";

    res.status(statusCode).json({
      error: "Failed to generate quiz",
      details: error.message,
      type: requestType,
    });
  }
});

// YouTube Data API transcript endpoint
app.post("/api/youtube-transcript", async (req, res) => {
  try {
    const { url, apiKey: youtubeApiKey } = req.body;

    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    // Use provided API key or fall back to Gemini API key
    const ytApiKey = youtubeApiKey || apiKey;

    if (!ytApiKey) {
      return res.status(400).json({
        error:
          "API key is required. Either provide it or set GOOGLE_GEMINI_API_KEY environment variable.",
      });
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/
    );
    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const videoId = videoIdMatch[1];

    console.log(`Fetching YouTube transcript for video: ${videoId}`);

    // Get video details
    const videoResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "snippet",
          id: videoId,
          key: ytApiKey,
        },
      }
    );

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoTitle = videoResponse.data.items[0].snippet.title;

    // Get captions list
    const captionsResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/captions`,
      {
        params: {
          part: "snippet",
          videoId: videoId,
          key: ytApiKey,
        },
      }
    );

    if (
      !captionsResponse.data.items ||
      captionsResponse.data.items.length === 0
    ) {
      return res.status(404).json({
        error:
          "No captions available for this video. Try using the Python API method instead.",
      });
    }

    // Find English caption
    const englishCaption =
      captionsResponse.data.items.find(
        (item) =>
          item.snippet.language === "en" ||
          item.snippet.language.startsWith("en-")
      ) || captionsResponse.data.items[0];

    // Note: YouTube Data API v3 doesn't provide direct access to caption content
    // This requires OAuth2 authentication for caption downloads
    // For simplicity, we'll return video info and suggest using Python API

    return res.status(200).json({
      message: "Video found with captions",
      videoId,
      title: videoTitle,
      captionTrack: englishCaption.snippet.language,
      note: "YouTube Data API v3 requires OAuth2 for caption download. Please use the Python API method for transcript extraction, or set up OAuth2 authentication.",
      availableCaptions: captionsResponse.data.items.map((item) => ({
        language: item.snippet.language,
        name: item.snippet.name,
        trackKind: item.snippet.trackKind,
      })),
    });
  } catch (error) {
    console.error("YouTube API error:", error.response?.data || error.message);

    if (error.response?.status === 403) {
      return res.status(403).json({
        error:
          "YouTube Data API access denied. Please ensure the API is enabled in Google Cloud Console.",
        details: error.response.data.error?.message,
        setupGuide:
          "Visit https://console.cloud.google.com/apis/library/youtube.googleapis.com",
      });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({
        error: "Invalid API key or request",
        details: error.response.data.error?.message,
      });
    }

    res.status(500).json({
      error: "Failed to fetch YouTube data",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Quiz Generator Backend Server                         ║
║  Port: ${PORT}                                         ║
║  Environment: ${process.env.NODE_ENV || "development"} ║
║  Gemini API: ${apiKey ? "Configured ✓" : "Not configured ✗"}           ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
