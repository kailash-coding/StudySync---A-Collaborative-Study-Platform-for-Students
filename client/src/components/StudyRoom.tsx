import React, { useRef, useState, useEffect } from "react";
import { Users, Send, Trash, Sparkles, AlertCircle, Palette, Circle, ShieldCheck, HelpCircle } from "lucide-react";
import { ChatMessage, WhiteboardStroke, StrokePoint } from "../types";

interface StudyRoomProps {
  wsUrl: string;
}

export default function StudyRoom({ wsUrl }: StudyRoomProps) {
  // Chat Lobby State
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("studysync_username") || "Student " + Math.floor(Math.random() * 900 + 100);
  });
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [isJoinedSystem, setIsJoinedSystem] = useState<boolean>(false);
  const [chosenColor, setChosenColor] = useState<string>(() => {
    const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  const [messageInput, setMessageInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ name: string; color: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Whiteboard State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const strokeHistoryRef = useRef<WhiteboardStroke[]>([]);
  const [drawColor, setDrawColor] = useState<string>("#4F46E5"); // Sleek Interface: Indigo-600 default marker
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  // Active WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  const connectWebSocket = () => {
    setConnectionStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      console.log("[WS] Connected to study room server");

      // If user had already registered earlier in this screen, auto join again on reconnect
      if (isJoinedSystem) {
        ws.send(JSON.stringify({
          type: "join",
          payload: { name: username, color: chosenColor }
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case "sync:init":
            setMessages(payload.messages);
            strokeHistoryRef.current = payload.drawings;
            // Draw past strokes
            redrawCanvas();
            break;

          case "chat:message":
            setMessages((prev) => [...prev, payload]);
            break;

          case "presence:update":
            setActiveUsers(payload.users);
            if (payload.systemMessage) {
              setMessages((prev) => [...prev, payload.systemMessage]);
            }
            break;

          case "whiteboard:draw":
            // Draw remote stroke
            strokeHistoryRef.current.push(payload);
            drawRemoteStroke(payload);
            break;

          case "whiteboard:clear":
            strokeHistoryRef.current = [];
            clearLocalCanvas();
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Error processing incoming socket message:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      console.log("[WS] Disconnected from server. Reconnecting in 3s...");
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (e) => {
      console.error("[WS CLIENT ERROR]", e);
    };
  };

  // Redraw complete canvas from history
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokeHistoryRef.current.forEach((stroke) => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  // Draw a single stroke instantly (e.g. from websocket event)
  const drawRemoteStroke = (stroke: WhiteboardStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (stroke.points.length < 1) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Setup Canvas context on mount or resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fluid responsive resolution sizing based on parent client area bounding rect
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width || 600;
        canvas.height = height || 400;

        // Reset context properties on resize
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          contextRef.current = ctx;
        }

        // Re-buffer and render old draws
        redrawCanvas();
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);

  // Local drawing event triggers
  const currentLocalStrokeRef = useRef<WhiteboardStroke | null>(null);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Scale matching coordinate mapping
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasJoined) return;
    const coords = getCoordinates(e);
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingRef.current = true;

    const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    currentLocalStrokeRef.current = {
      id: strokeId,
      color: isEraser ? "#ffffff" : drawColor, // Map color to background for eraser
      width: isEraser ? 15 : drawWidth,
      points: [coords]
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !hasJoined) return;
    const coords = getCoordinates(e);
    const ctx = contextRef.current;
    if (!ctx || !currentLocalStrokeRef.current) return;

    ctx.strokeStyle = currentLocalStrokeRef.current.color;
    ctx.lineWidth = currentLocalStrokeRef.current.width;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    currentLocalStrokeRef.current.points.push(coords);
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Send completed stroke over WebSockets
    if (currentLocalStrokeRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      strokeHistoryRef.current.push(currentLocalStrokeRef.current);
      wsRef.current.send(JSON.stringify({
        type: "whiteboard:draw",
        payload: { stroke: currentLocalStrokeRef.current }
      }));
    }
    currentLocalStrokeRef.current = null;
  };

  // Submit trigger to clear blackboard
  const handleClearWhiteboard = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "whiteboard:clear",
        payload: {}
      }));
    }
  };

  // Join Room Event
  const formatJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "") return;

    localStorage.setItem("studysync_username", username);
    setHasJoined(true);
    setIsJoinedSystem(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "join",
        payload: { name: username, color: chosenColor }
      }));
    }
  };

  // Send message Event
  const formatSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() === "" || !hasJoined) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat:send",
        payload: { text: messageInput }
      }));
      setMessageInput("");
    }
  };

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto py-2 px-2 h-full" id="study-room-root">
      
      {/* Visual Workspace Canvas & Whiteboard section (3/4 Screen width) */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full min-h-[500px]">
        {/* Workspace Toolbar Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <h2 className="text-sm font-display font-bold text-slate-900 flex items-center gap-1.5 leading-none">
                Shared Drawing Whiteboard
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Live Sync Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1.5">Multi-user Canvas Workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Presence indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-700 font-semibold">Study Lobby: {activeUsers.length || 1} active</span>
            </div>

            {hasJoined && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                {/* Palette picker */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  {/* High readability colors on white backdrop */}
                  {[
                    { hex: "#4F46E5", name: "Deep Indigo" },
                    { hex: "#E11D48", name: "vibrant ruby" },
                    { hex: "#059669", name: "Forest Green" },
                    { hex: "#D97706", name: "Dark Orange" },
                    { hex: "#7C3AED", name: "Amethyst" },
                    { hex: "#0F172A", name: "Coal Black" }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.hex}
                      onClick={() => {
                        setDrawColor(colorObj.hex);
                        setIsEraser(false);
                      }}
                      title={colorObj.name}
                      className={`w-4 h-4 rounded-full transition transform hover:scale-125 cursor-pointer ${drawColor === colorObj.hex && !isEraser ? 'ring-2 ring-indigo-600 scale-110' : ''}`}
                      style={{ backgroundColor: colorObj.hex }}
                    />
                  ))}
                </div>

                {/* Eraser button */}
                <button
                  onClick={() => setIsEraser(!isEraser)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition duration-155 flex items-center gap-1 cursor-pointer ${isEraser ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  title="Eraser tool"
                  id="eraser-tool-toggle"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Eraser
                </button>

                {/* Pen size */}
                <select
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 px-2.5 rounded-xl cursor-pointer"
                  title="Draw stroke width"
                  id="stroke-width-select"
                >
                  <option value={1}>Fine (1px)</option>
                  <option value={3}>Medium (3px)</option>
                  <option value={6}>Bold (6px)</option>
                  <option value={12}>Extra (12px)</option>
                </select>

                {/* Clear local canvas for review */}
                <button
                  onClick={handleClearWhiteboard}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 font-semibold text-xs rounded-xl hover:bg-rose-100/75 transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Force wipe whiteboard state globally"
                  id="clear-whiteboard-btn"
                >
                  Clear Slate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Canvas Container */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 relative shadow-md overflow-hidden min-h-[450px] flex items-stretch">
          
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`w-full h-full block bg-white ${!hasJoined ? 'cursor-not-allowed filter blur-[1px]' : 'cursor-crosshair'}`}
            id="collaborative-whiteboard-canvas"
          />

          {/* Join overlay gating drawing action to authenticated socket names */}
          {!hasJoined && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center z-20">
              <div className="max-w-md bg-white rounded-3xl p-8 border border-slate-200 space-y-6 shadow-xl text-left">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 mx-auto">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-display font-bold text-slate-950">Enter Real-Time Study Space</h3>
                  <p className="text-xs text-slate-500">
                    To draw on the collaborative whiteboard, send live formulas to other students, and unlock real-time peer chats, choose your lobby username.
                  </p>
                </div>
                <form onSubmit={formatJoin} className="space-y-4">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter study moniker (e.g. Kailash)..."
                    className="w-full bg-slate-50 border border-slate-250 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
                    maxLength={20}
                  />

                  {/* Pick User Color */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs text-slate-500 font-semibold block">Choose Nickname Aura</label>
                    <div className="flex justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((col) => (
                        <button
                          type="button"
                          key={col}
                          onClick={() => setChosenColor(col)}
                          className={`w-6 h-6 rounded-full transition transform hover:scale-125 cursor-pointer ${chosenColor === col ? 'ring-2 ring-indigo-600 scale-110' : ''}`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md transition cursor-pointer"
                    id="join-study-room-submit"
                  >
                    Enter Synced Workspace
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Synced Chat Engine (1/4 Screen width) */}
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full min-h-[500px] shadow-sm">
        
        {/* Lobby Chat Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-650" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 leading-none">Lobby Chat</h3>
              <p className="text-[10px] text-slate-500 mt-1">WebSocket Sync Active</p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold">
            ONLINE
          </span>
        </div>

        {/* Chat List Dialog */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[480px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-4">
              <HelpCircle className="w-8 h-8 text-slate-400 opacity-60 mb-2" />
              <p className="text-xs text-slate-400 text-center font-light">No lobby chat logged yet.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.sender === "StudySync System";
              return (
                <div key={msg.id} className={`flex flex-col space-y-1 ${isSystem ? 'items-center text-center py-1' : ''}`}>
                  {isSystem ? (
                    <span className="text-[10px] px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 font-light">
                      {msg.text}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold" style={{ color: msg.color }}>
                          {msg.sender}
                        </span>
                        <span className="text-[8px] text-slate-450 font-mono">{msg.timestamp}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl rounded-tl-none text-xs text-slate-800 leading-normal border border-slate-200 overflow-hidden break-words">
                        {msg.text}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Text Area Gating Action */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          {hasJoined ? (
            <form onSubmit={formatSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Message active peers..."
                className="flex-1 bg-white border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                maxLength={400}
                id="message-input-textbox"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer shadow-xs"
                id="send-message-submit"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <p className="text-[10px] text-slate-400 text-center py-2 italic font-light">
              Choose a username first to chat with online peers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
