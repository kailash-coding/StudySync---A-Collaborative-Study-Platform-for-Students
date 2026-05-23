import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Tutor, Booking, ChatMessage, WhiteboardStroke } from "../client/src/types";

dotenv.config();

// Memory store for persistence across websocket/REST requests
const messages: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "Alex (Physics Mentor)",
    text: "Welcome to StudySync! Feel free to ask questions here or draw on the whiteboard.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    color: "#3B82F6"
  },
  {
    id: "msg-2",
    sender: "Sophia (Biology Expert)",
    text: "Hi everyone! Ready to crack the exam code together?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    color: "#EAB308"
  }
];

const drawings: WhiteboardStroke[] = [];
const activeUsers = new Map<string, { name: string; color: string }>();

// Initial tutors data
const tutors: Tutor[] = [
  {
    id: "tutor-1",
    name: "Dr. Elena Rostova",
    bio: "PhD in Theoretical Physics. MIT Alumna. Passionate about helping students grasp quantum mechanics and high-level calculus in record time.",
    subjects: ["Quantum Mechanics", "Advanced Calculus", "Thermodynamics"],
    rating: 4.9,
    price: 45,
    availableDays: ["Mondays", "Wednesdays", "Fridays"],
    availableSlots: ["10:00 - 11:30", "14:00 - 15:30", "16:00 - 17:30"],
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "tutor-2",
    name: "Caleb O'Connor",
    bio: "Lead Software Architect at a tier-1 tech firm. Specializes in React, Express, Full-Stack NodeJS, and Database design. Extremely pragmatic lessons.",
    subjects: ["Web Engineering", "Data Structures", "TypeScript & React"],
    rating: 4.95,
    price: 55,
    availableDays: ["Tuesdays", "Thursdays", "Saturdays"],
    availableSlots: ["13:00 - 14:30", "15:00 - 16:30", "19:00 - 20:30"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "tutor-3",
    name: "Sarah Jenkins",
    bio: "Biomedical researcher of 8 years. Experienced in simplifying complex bioenergetics, genetics pathways, and molecular chemistry for AP/College state exams.",
    subjects: ["Biochemistry", "Molecular Genetics", "Organic Chemistry"],
    rating: 4.85,
    price: 40,
    availableDays: ["Mondays", "Thursdays", "Saturdays"],
    availableSlots: ["09:00 - 10:30", "11:00 - 12:30", "15:00 - 16:30"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "tutor-4",
    name: "Prof. Michael Hayes",
    bio: "Retired History Faculty with a focus on Modern European Conflict and Democratic Theory. Let's make historical context vivid, exciting, and memorable.",
    subjects: ["Modern European History", "Political Philosophy", "AP US History"],
    rating: 4.92,
    price: 35,
    availableDays: ["Tuesdays", "Wednesdays", "Thursdays"],
    availableSlots: ["10:30 - 12:00", "14:00 - 15:30", "16:30 - 18:00"],
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80"
  }
];

const bookings: Booking[] = [
  {
    id: "booking-1",
    tutorId: "tutor-1",
    tutorName: "Dr. Elena Rostova",
    dateTime: "Wednesdays, 14:00 - 15:30",
    subject: "Quantum Mechanics",
    studentName: "Kailash Suthar",
    notes: "Review double slit experiment equations and wave packet derivation.",
    status: "confirmed"
  }
];

// Lazy initiate Gemini Client to handle missing secrets gracefully and keep server healthy
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in environment. AI features will fallback to structured local quiz sets.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Fallback quizzes when API is unconfigured
const fallbackQuizzes: Record<string, any> = {
  "Quantum Physics": {
    title: "Quantum Physics basics (Local Fallback)",
    description: "Learn the core basics of quantum state, wave function, and Planck constant.",
    questions: [
      {
        question: "Who proposed the concept of light quanta (photons) to explain the photoelectric effect?",
        options: ["Albert Einstein", "Niels Bohr", "Max Planck", "Werner Heisenberg"],
        correctAnswerIndex: 0,
        explanation: "Albert Einstein proposed that light consists of packets of energy called quanta (or photons) in 1905, for which he won the Nobel Prize."
      },
      {
        question: "What does Heisenberg's Uncertainty Principle state?",
        options: [
          "Energy and mass are interchangeable.",
          "You cannot simultaneously know both the exact position and momentum of a particle.",
          "Objects remain in motion unless acted upon.",
          "Perfect vacuum has zero energy state."
        ],
        correctAnswerIndex: 1,
        explanation: "Heisenberg's Uncertainty Principle asserts a fundamental limit to the precision with which certain pairs of physical properties, such as position and momentum, can be known."
      }
    ]
  },
  "Biochemistry": {
    title: "Biochemistry & Cellular Energy (Local Fallback)",
    description: "Active recall study set of Mitochondria energy pathways.",
    questions: [
      {
        question: "Which organelle is primarily responsible for ATP production via oxidative phosphorylation?",
        options: ["Golgi Apparatus", "Mitochondria", "Lysosome", "Endoplasmic Reticulum"],
        correctAnswerIndex: 1,
        explanation: "Mitochondria are the powerhouses of the cell, generating most of the chemical energy needed to power the cell's biochemical reactions."
      },
      {
        question: "What are the primary products of glycolysis?",
        options: [
          "Glucose and Carbon Dioxide",
          "2 Pyruvate, 2 ATP, and 2 NADH",
          "Acetyl-CoA and Water",
          "Oxygen and Glucose"
        ],
        correctAnswerIndex: 1,
        explanation: "Glycolysis breaks down one glucose molecule into two pyruvate, yielding a net of 2 adenosine triphosphate (ATP) molecules and 2 NADH."
      }
    ]
  }
};

const fallbackFlashcards: Record<string, any[]> = {
  "quantum physics": [
    { front: "Wave-Particle Duality", back: "The concept that every particle or quantum entity may be described as either a particle or a wave." },
    { front: "Planck Constant (h)", back: "The fundamental physical constant formulated by Max Planck, linking electromagnetic energy to its frequency. Value is approx 6.626e-34 J·s." },
    { front: "Schrödinger Equation", back: "A linear partial differential equation that governs the wave function of a quantum-mechanical system." },
    { front: "Quantum Entanglement", back: "A phenomenon where physical particles become correlated such that the state of one instantly dictates the state of another, regardless of distance." }
  ],
  "biochemistry": [
    { front: "ATP (Adenosine Triphosphate)", back: "The primary energy carrier in all living organisms used to fuel cellular processes." },
    { front: "Enzme Catalyst", back: "A biological macromolecule (mostly proteins) that accelerates chemical reactions by lowering activation energy." },
    { front: "Kreb's Cycle (Citric Acid Cycle)", back: "A series of chemical reactions used by all aerobic organisms to release stored energy through the oxidation of acetyl-CoA." }
  ]
};

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const PORT = 3000;

  // Custom logging middleware
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // REST API: Get system data
  app.get("/api/tutors", (req, res) => {
    res.json(tutors);
  });

  app.get("/api/bookings", (req, res) => {
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const { tutorId, tutorName, dateTime, subject, studentName, notes } = req.body;
    if (!tutorId || !tutorName || !dateTime || !subject || !studentName) {
      res.status(400).json({ error: "Missing required fields for booking" });
      return;
    }
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      tutorId,
      tutorName,
      dateTime,
      subject,
      studentName,
      notes,
      status: 'confirmed' // Instant confirmation for rich student UX
    };
    bookings.push(newBooking);
    res.status(201).json(newBooking);
  });

  // AI Endpoint: Generate custom quiz based on user topic
  app.post("/api/generate-quiz", async (req, res) => {
    const { topic } = req.body;
    if (!topic || topic.trim() === "") {
      res.status(400).json({ error: "Please provide a valid study topic." });
      return;
    }

    const ai = getGemini();
    if (!ai) {
      // Return beautiful fallback or mock data
      const keyword = Object.keys(fallbackQuizzes).find(k => topic.toLowerCase().includes(k.toLowerCase())) || "Quantum Physics";
      const fallback = fallbackQuizzes[keyword];
      res.json({ ...fallback, title: `Study Quiz: ${topic} (Demo Mode)` });
      return;
    }

    try {
      console.log(`[AI] Generating Quiz via Gemini for topic: "${topic}"...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a highly premium, accurate multiple choice trivia quiz about the topic: "${topic}". Provide exactly 5 essential high-yield educational questions, each with 4 distinct options, the correct answer index (0-3), and a complete, helpful explanation.`,
        config: {
          systemInstruction: "You are an elite academic educator. Output absolute precision, correct details, and well-justified options.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Engaging title of study quiz" },
              description: { type: Type.STRING, description: "A brief, encouraging summary of what the quiz covers" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctAnswerIndex", "explanation"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Empty response received from AI model.");
      }
      const data = JSON.parse(rawText.trim());
      res.json(data);
    } catch (e: any) {
      console.error("[AI ERROR] Failed to generate Quiz:", e?.message || e);
      // Fallback
      res.json({
        title: `Quiz: ${topic} (Local Fallback)`,
        description: "An automated quiz helper created locally due to a processing issue.",
        questions: [
          {
            question: `What is the core fundamental principle governing "${topic}"?`,
            options: [
              "The law of dynamic systemic entropy",
              "Observation-induced quantum state transition",
              "Conservation of matter and thermodynamic balance",
              "A multifaceted framework of interdependent elements"
            ],
            correctAnswerIndex: 3,
            explanation: `Our study of ${topic} focuses on how different systems or factors interact in an structured, interdependent system.`
          },
          {
            question: `Which of the following is most commonly associated with "${topic}"?`,
            options: [
              "Standard structural analysis and experimental modeling",
              "Thermodynamic phase change coefficients",
              "Deterministic chemical catalysts",
              "Historical documentation and cultural metrics"
            ],
            correctAnswerIndex: 0,
            explanation: `Detailed analysis and experimental modeling form the backbone of investigating ${topic} in both collegiate and professional fields.`
          }
        ]
      });
    }
  });

  // AI Endpoint: Generate custom active recall flashcards based on user topic
  app.post("/api/generate-flashcards", async (req, res) => {
    const { topic } = req.body;
    if (!topic || topic.trim() === "") {
      res.status(400).json({ error: "Please provide a valid study topic." });
      return;
    }

    const ai = getGemini();
    if (!ai) {
      const keyword = Object.keys(fallbackFlashcards).find(k => topic.toLowerCase().includes(k)) || "quantum physics";
      const cards = fallbackFlashcards[keyword] || fallbackFlashcards["quantum physics"];
      res.json(cards);
      return;
    }

    try {
      console.log(`[AI] Generating Flashcards via Gemini for topic: "${topic}"...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate exactly 6 premium, active-recall style flashcards studying the topic: "${topic}". The 'front' must be a concise question or trigger term. The 'back' must be a high-yield, memorable, 1-2 sentence core concept explanation.`,
        config: {
          systemInstruction: "You are a professional instructor. Output a clean list of flashcards. Do not generate overly long cards; make them concise and optimized for memorization.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING, description: "Review prompt, question, or key terminology" },
                back: { type: Type.STRING, description: "Concise, precise study breakdown answer" }
              },
              required: ["front", "back"]
            }
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Empty response received from AI model.");
      }
      const data = JSON.parse(rawText.trim());
      res.json(data);
    } catch (e: any) {
      console.error("[AI ERROR] Failed to generate Flashcards:", e?.message || e);
      res.json([
        { front: `Core aspect of ${topic}`, back: "An essential component that defines the primary characteristics of the topic." },
        { front: `Practical Application of ${topic}`, back: "How this topic functions in real-world professional, engineering, or research scenarios." },
        { front: `Key Theoretical Framework`, back: "The underlying principles that support and validate concepts within this research." }
      ]);
    }
  });

  // WebSocket support
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentUserId = "";

    console.log("[WS] New client connection established");

    // Send history when connecting
    ws.send(JSON.stringify({
      type: "sync:init",
      payload: {
        messages,
        drawings,
        activeUsersCount: activeUsers.size + 1
      }
    }));

    ws.on("message", (messageStr: string) => {
      try {
        const data = JSON.parse(messageStr);
        const { type, payload } = data;

        switch (type) {
          case "join": {
            currentUserId = `user-${Date.now()}`;
            activeUsers.set(currentUserId, { name: payload.name, color: payload.color });

            console.log(`[WS] ${payload.name} joined the study room.`);

            // Broadcast message that user joined
            const botMessage: ChatMessage = {
              id: `msg-join-${Date.now()}`,
              sender: "StudySync System",
              text: `${payload.name} has joined the workspace! 🤝`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: "#6B7280"
            };
            messages.push(botMessage);

            broadcast({
              type: "presence:update",
              payload: {
                users: Array.from(activeUsers.values()),
                systemMessage: botMessage
              }
            });
            break;
          }

          case "chat:send": {
            const user = activeUsers.get(currentUserId);
            if (!user) return;

            const newMsg: ChatMessage = {
              id: `msg-user-${Date.now()}`,
              sender: user.name,
              text: payload.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: user.color
            };
            messages.push(newMsg);
            if (messages.length > 50) messages.shift(); // Keep history size small

            broadcast({
              type: "chat:message",
              payload: newMsg
            });
            break;
          }

          case "whiteboard:draw": {
            // Guard and store drawing stroke
            const stroke = payload.stroke;
            drawings.push(stroke);
            if (drawings.length > 100) drawings.shift(); // Bound memory consumption gently

            // Broadcast drawing change to all other connections
            broadcastExcept(ws, {
              type: "whiteboard:draw",
              payload: stroke
            });
            break;
          }

          case "whiteboard:clear": {
            drawings.length = 0;
            broadcast({
              type: "whiteboard:clear",
              payload: {}
            });
            break;
          }

          default:
            console.warn(`[WS] Received unknown event type: ${type}`);
        }
      } catch (err) {
        console.error("[WS EVENT ERROR]", err);
      }
    });

    ws.on("close", () => {
      const user = activeUsers.get(currentUserId);
      if (user) {
        console.log(`[WS] ${user.name} disconnected.`);
        activeUsers.delete(currentUserId);

        const botMessage: ChatMessage = {
          id: `msg-leave-${Date.now()}`,
          sender: "StudySync System",
          text: `${user.name} left the room.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: "#9CA3AF"
        };
        messages.push(botMessage);

        broadcast({
          type: "presence:update",
          payload: {
            users: Array.from(activeUsers.values()),
            systemMessage: botMessage
          }
        });
      }
    });
  });

  // Helper: Broadcast to all
  function broadcast(obj: any) {
    const raw = JSON.stringify(obj);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });
  }

  // Helper: Broadcast to everyone except current client
  function broadcastExcept(excludeWs: WebSocket, obj: any) {
    const raw = JSON.stringify(obj);
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });
  }

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), 'client'),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully powered up at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Critical: Express dev server failed to start!", e);
});
