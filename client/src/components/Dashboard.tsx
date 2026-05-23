import React from "react";
import { BookOpen, Calendar, Clock, Trophy, Users, Zap, ArrowRight, Star, Sparkles } from "lucide-react";
import { Tutor, Booking } from "../types";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  tutors: Tutor[];
  bookings: Booking[];
  activeUsersCount: number;
}

export default function Dashboard({ onNavigate, tutors, bookings, activeUsersCount }: DashboardProps) {
  // Preset study resources
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4 px-2" id="dashboard-root">
      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-650 via-indigo-800 to-slate-900 p-8 md:p-10 shadow-lg overflow-hidden border border-indigo-100/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.06),transparent)]" />
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 animate-pulse text-white" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white font-medium text-xs border border-white/20">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
            Midterm Preparation Mode Active
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight leading-none animate-fade-in">
            Accelerate Study Goals, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-indigo-200">
              Together or Automated.
            </span>
          </h1>
          <p className="text-indigo-100 text-sm md:text-base font-light max-w-lg leading-relaxed/80">
            Welcome to the ultimate synergy zone. Draw on live whiteboards with peers, deploy AI to quiz your recall, or consult leading PhD tutors instantly.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("study-room")}
              className="px-6 py-3 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-semibold transition duration-200 shadow-md flex items-center gap-2 cursor-pointer text-sm"
              id="hero-launch-room"
            >
              <Users className="w-4.5 h-4.5 text-indigo-600" />
              Join Live Study Room
            </button>
            <button
              onClick={() => onNavigate("quizzing")}
              className="px-6 py-3 rounded-xl bg-indigo-950/40 text-white hover:bg-indigo-900/50 font-semibold transition duration-200 border border-white/30 flex items-center gap-2 backdrop-blur-sm cursor-pointer text-sm"
              id="hero-generate-quiz"
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
              Generate AI Study Set
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Daily Streak</div>
            <div className="text-xl md:text-2xl font-bold font-display text-slate-900">5 Days</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Clock className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Focused Study</div>
            <div className="text-xl md:text-2xl font-bold font-display text-slate-900">14.8 hrs</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Quizzes Cleared</div>
            <div className="text-xl md:text-2xl font-bold font-display text-slate-900">9 Completed</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Online Peers</div>
            <div className="text-xl md:text-2xl font-bold font-display text-indigo-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {activeUsersCount} Live
            </div>
          </div>
        </div>
      </div>

      {/* Main split content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Upcoming events / bookings list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                 Tutor Bookings
              </h2>
              <button
                onClick={() => onNavigate("tutors")}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                Book Tutor <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
                <p className="text-slate-500 text-sm">No mentoring lessons scheduled right now.</p>
                <button
                  onClick={() => onNavigate("tutors")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition cursor-pointer shadow-sm"
                >
                  Browse Highly Rated Class Tutors
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const tutor = tutors.find(t => t.id === booking.tutorId);
                  return (
                    <div key={booking.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition shadow-xs">
                      <div className="flex gap-3">
                        <img
                          src={tutor?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=50&h=50&q=80"}
                          alt={booking.tutorName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{booking.tutorName}</h3>
                          <p className="text-xs text-indigo-650 font-medium">{booking.subject}</p>
                          <p className="text-slate-500 text-xs mt-1 italic">"{booking.notes}"</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-205 pt-2 md:pt-0">
                        <div className="text-right">
                          <p className="text-slate-700 text-xs font-semibold flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {booking.dateTime}
                          </p>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 mt-1 font-medium">
                            Booking Confirmed
                          </span>
                        </div>
                        <button
                          onClick={() => onNavigate("study-room")}
                          className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Join Study Call
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick interactive study cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 space-y-4 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition">
              <h3 className="text-md font-display font-bold text-slate-950 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                Struggling with a Topic?
              </h3>
              <p className="text-sm text-slate-650 font-light leading-relaxed">
                Unlock instant learning. Input any topic like "Mitosis" or "Fourier Transform" and Gemini will auto-generate interactive MCQs & review flashcards immediately. 
              </p>
              <button
                onClick={() => onNavigate("quizzing")}
                className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Go to AI Generator
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 space-y-4 shadow-sm hover:bg-emerald-50 hover:border-emerald-200 transition">
              <h3 className="text-md font-display font-bold text-slate-950 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-emerald-600" />
                Collaborative Space
              </h3>
              <p className="text-sm text-slate-650 font-light leading-relaxed">
                Connect with study group buddies in real-time. Share problems, scribble equations, and sketch system flows globally while keeping structured logs in the synced lobby chat.
              </p>
              <button
                onClick={() => onNavigate("study-room")}
                className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Enter Lobby and Canvas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Tutors spotlights & recommendations */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" />
              Featured Teachers
            </h2>

            <div className="space-y-4">
              {tutors.slice(0, 2).map((tutor) => (
                <div key={tutor.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{tutor.name}</h3>
                        <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                          ★ <span className="text-slate-600 text-[11px] font-semibold">{tutor.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                        "{tutor.bio}"
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tutor.subjects.map((sub, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium border border-slate-300/30">
                        {sub}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-800">
                      ${tutor.price} <span className="text-slate-500 font-normal">/ hour</span>
                    </div>
                    <button
                      onClick={() => onNavigate("tutors")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      Book Session <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
