import React, { useState, useEffect } from "react";
import { GraduationCap, Users, Sparkles, BookOpen, User, BookCheck, Clock } from "lucide-react";
import Dashboard from "./components/Dashboard";
import StudyRoom from "./components/StudyRoom";
import QuizEngine from "./components/QuizEngine";
import TutorMarketplace from "./components/TutorMarketplace";
import { Tutor, Booking } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);

  // Synchronize WebSocket URL dynamically matching browser protocol
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;

  // Fetch initial REST data from Express API
  useEffect(() => {
    fetchTutors();
    fetchBookings();

    // Setup an incremental listener to match live presence counts from general study room
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sync:init" || data.type === "presence:update") {
          const users = data.payload?.users || [];
          setActiveUsersCount(Math.max(1, users.length + 1));
        }
      } catch (err) {
        // Safe fail
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchTutors = async () => {
    try {
      const res = await fetch("/api/tutors");
      if (res.ok) {
        const data = await res.json();
        setTutors(data);
      }
    } catch (e) {
      console.error("Failed to load tutors:", e);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error("Failed to load bookings:", e);
    }
  };

  const handleBookSession = async (bookingData: {
    tutorId: string;
    tutorName: string;
    dateTime: string;
    subject: string;
    studentName: string;
    notes: string;
  }) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        const newBooking = await res.json();
        setBookings((prev) => [...prev, newBooking]);
      }
    } catch (e) {
      console.error("Failed to post booking:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="studysync-main-app">
      {/* Dynamic Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-950 block leading-none">
                StudySync
              </span>
              <span className="text-[10px] text-indigo-600 font-mono tracking-widest uppercase font-medium">
                Active Peer Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 text-xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 font-semibold rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
              id="tab-btn-dashboard"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Overview Cockpit
            </button>
            <button
              onClick={() => setActiveTab("study-room")}
              className={`px-4 py-2 font-semibold rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${activeTab === "study-room" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
              id="tab-btn-study-room"
            >
              <Users className="w-3.5 h-3.5" />
              Synced Whiteboard & Chat
            </button>
            <button
              onClick={() => setActiveTab("quizzing")}
              className={`px-4 py-2 font-semibold rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${activeTab === "quizzing" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
              id="tab-btn-quizzing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              AI Quiz & Flashcards
            </button>
            <button
              onClick={() => setActiveTab("tutors")}
              className={`px-4 py-2 font-semibold rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${activeTab === "tutors" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
              id="tab-btn-tutors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Tutor Matches
            </button>
          </nav>

          {/* Active indicator badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-mono hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{activeUsersCount} student online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main active layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "dashboard" && (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            tutors={tutors}
            bookings={bookings}
            activeUsersCount={activeUsersCount}
          />
        )}
        {activeTab === "study-room" && <StudyRoom wsUrl={wsUrl} />}
        {activeTab === "quizzing" && <QuizEngine />}
        {activeTab === "tutors" && (
          <TutorMarketplace
            tutors={tutors}
            bookings={bookings}
            onBookSession={handleBookSession}
          />
        )}
      </main>

      {/* Humble literal footer credits (No margin clutter and anti AI slop) */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} StudySync. Real-time active learning system.</p>
        <p className="text-[10px] text-slate-400">Built for student groups, AP preparation, and active diagnostics.</p>
      </footer>
    </div>
  );
}
