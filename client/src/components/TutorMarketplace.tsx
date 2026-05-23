import React, { useState } from "react";
import { Star, Shield, Clock, BookOpen, User, CheckCircle, Sparkles, Mail, Notebook, Calendar, Video, Play, PhoneOff, ArrowLeft } from "lucide-react";
import { Tutor, Booking } from "../types";

interface TutorMarketplaceProps {
  tutors: Tutor[];
  bookings: Booking[];
  onBookSession: (bookingData: {
    tutorId: string;
    tutorName: string;
    dateTime: string;
    subject: string;
    studentName: string;
    notes: string;
  }) => void;
}

export default function TutorMarketplace({ tutors, bookings, onBookSession }: TutorMarketplaceProps) {
  // Navigation & booking selection state
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("Kailash Suthar");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Active virtual classroom state
  const [activeVirtualBooking, setActiveVirtualBooking] = useState<Booking | null>(null);
  const [isInVideoRoom, setIsInVideoRoom] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCamMuted, setIsCamMuted] = useState<boolean>(false);

  // Filter out pending and past bookings
  const activeBookings = bookings.filter(b => b.status === 'confirmed');

  const handleOpenBookingModal = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setSelectedDay(tutor.availableDays[0] || "");
    setSelectedSlot(tutor.availableSlots[0] || "");
    setSelectedSubject(tutor.subjects[0] || "");
    setSessionNotes("");
    setBookingSuccess(false);
  };

  const handleConfirmReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutor || !selectedDay || !selectedSlot || !selectedSubject || !studentName) return;

    onBookSession({
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      dateTime: `${selectedDay}, ${selectedSlot}`,
      subject: selectedSubject,
      studentName,
      notes: sessionNotes || `General study session on ${selectedSubject}`
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedTutor(null);
      setBookingSuccess(false);
    }, 2200);
  };

  // Launch simulated video classroom
  const handleLaunchSimulationRoom = (booking: Booking) => {
    setActiveVirtualBooking(booking);
    setIsInVideoRoom(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-2 px-2 space-y-8" id="tutor-marketplace-root">
      
      {/* Simulation Video Room Layout overlay when active */}
      {isInVideoRoom && activeVirtualBooking && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-md animate-fade-in" id="virtual-classroom-simulation">
          {/* Header block */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Video className="w-5 h-5 text-indigo-650" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Interactive Class Session</h2>
                <p className="text-[11px] text-slate-500">Tutor: <span className="font-semibold text-indigo-700">{activeVirtualBooking.tutorName}</span> • Subject: <span className="font-semibold text-slate-700">{activeVirtualBooking.subject}</span></p>
              </div>
            </div>

            <button
              onClick={() => setIsInVideoRoom(false)}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-150 text-xs font-bold rounded-xl hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              id="disconnect-classroom-btn"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Disconnect Lesson
            </button>
          </div>

          {/* Sub Split Classroom layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left simulated tutor webcam stream screen (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-slate-950 rounded-2xl relative border-2 border-indigo-100 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Visual mockup of tutor camera */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,0.35),rgba(15,23,42,0.95))]" />
                <div className="relative text-center space-y-4 z-10 p-6">
                  {/* Avatar wrapper */}
                  <div className="relative w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-indigo-400 shadow-xl">
                    <img
                      src={tutors.find(t => t.id === activeVirtualBooking.tutorId)?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80"}
                      alt={activeVirtualBooking.tutorName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-white">{activeVirtualBooking.tutorName}</h3>
                    <p className="text-xs text-indigo-200">PHD Mentor connected via WebRTC HD Secure Stream</p>
                  </div>

                  {/* High Quality animated equalizer simulating voice audio */}
                  <div className="flex gap-1 justify-center items-end h-8">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 3, 5, 4, 2, 4, 5, 2].map((val, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-400 w-1 rounded-full animate-pulse"
                        style={{
                          height: `${val * 16}%`,
                          animationDelay: `${idx * 0.08}s`,
                          animationDuration: "0.7s"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Webcam HUD indicator in viewport corners */}
                <span className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-[10px] px-2.5 py-1 rounded-md text-slate-250 border border-slate-700 font-mono tracking-wider">
                  🔴 LIVE HD • 2440kbps
                </span>

                <span className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-[10px] px-2.5 py-1 rounded-md text-slate-250 border border-slate-700">
                  Audio Stereo: Core Filter Active
                </span>
              </div>

              {/* Media layout button controllers */}
              <div className="flex gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Classroom Time remaining: <span className="text-slate-905 font-bold font-mono">38m:14s</span></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer transition ${isMicMuted ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {isMicMuted ? "🎙️ Unmute Mic" : "🎙️ Mute Mic"}
                  </button>
                  <button
                    onClick={() => setIsCamMuted(!isCamMuted)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer transition ${isCamMuted ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {isCamMuted ? "📹 Enable Camera" : "📹 Disable Camera"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right lesson objectives scratchpad notes panel (1/3 width) */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-205 space-y-4 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-150 pb-3">
                  <BookOpen className="w-4 h-4 text-indigo-650" />
                  Active Lesson Objectives
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0 animate-ping" />
                    <span>
                      Reviewing session goals: <br />
                      <span className="text-indigo-700 font-semibold italic mt-0.5 block">"{activeVirtualBooking.notes}"</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Primary concept diagnostics
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Review whiteboard equations
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded-full border border-slate-200 inline-block flex-shrink-0" />
                    Practical active recall test set
                  </li>
                </ul>

                <div className="pt-2">
                  <textarea
                    placeholder="Scribble quick lesson notepad logs..."
                    className="w-full h-24 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main landing marketplace area if not in video caller */}
      {!isInVideoRoom && (
        <div className="space-y-8">
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 flex items-center justify-center gap-2">
              <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
              Tutor Marketplace & Workspace Scheduling
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
              Book live interactive sessions with PhDs and specialists. Enter video rooms directly to synchronize notebooks and outline whiteboard steps block by block.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Bookings Tracker Sidebar (1/3 screen) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-indigo-600" />
                  Your Active Bookings
                </h2>

                {activeBookings.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-250 p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-semibold">You don't have any lessons booked yet.</p>
                    <p className="text-[10px] text-slate-500 leading-normal font-light">
                      Click "Book Lesson Slot" on any featured mentor to line up a study session with automatic video call confirmation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings.map((b) => (
                      <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-indigo-300 transition duration-150 shadow-2xs">
                        <div className="flex gap-2 justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-905 text-xs">{b.tutorName}</h4>
                            <p className="text-[10px] text-indigo-700 font-semibold mt-0.5">{b.subject}</p>
                          </div>
                          <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold">
                            Booked
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 font-medium">
                          📅 {b.dateTime}
                        </div>

                        <button
                          onClick={() => handleLaunchSimulationRoom(b)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          id={`start-class-btn-${b.id}`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Enter Interactive Video Room
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tutors Grid (2/3 screen) */}
            <div className="lg:col-span-2 space-y-5">
              <h2 className="text-xs font-display uppercase tracking-wider text-indigo-700 font-bold border-b border-slate-200 pb-2">
                Featured PhD & Industry Experts
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutors.map((tutor) => (
                  <div key={tutor.id} className="bg-white rounded-3xl border border-slate-205 p-5 space-y-4 hover:border-slate-300 shadow-sm flex flex-col justify-between">
                    <div>
                      {/* Avatar name header */}
                      <div className="flex gap-3 items-center">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-100 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            <h3 className="font-semibold text-slate-900 text-sm">{tutor.name}</h3>
                            <Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-50/10" title="Verified Credential Portfolio" />
                          </div>
                          
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-amber-500 text-xs">★</span>
                            <span className="text-xs text-slate-700 font-bold">{tutor.rating}</span>
                            <span className="text-slate-400 text-[10px] font-medium">• 44 tutoring calls</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio text */}
                      <p className="text-xs text-slate-650 leading-relaxed font-light mt-4 line-clamp-3 italic">
                        "{tutor.bio}"
                      </p>

                      {/* Specialized Subjects list tagging */}
                      <div className="flex flex-wrap gap-1.5 pt-4">
                        {tutor.subjects.map((sub, idx) => (
                          <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-50 text-indigo-700 border border-slate-200 font-bold">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-150 flex justify-between items-center bg-slate-50/50 px-4 py-3 -mx-5 -mb-5 rounded-b-3xl">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Rate</span>
                        <span className="text-sm font-bold text-slate-900">${tutor.price} <span className="text-slate-400 font-normal text-xs">/ hour</span></span>
                      </div>

                      <button
                        onClick={() => handleOpenBookingModal(tutor)}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                        id={`open-booking-${tutor.id}`}
                      >
                        Book Lesson Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* POPUP booking schedule picker */}
      {selectedTutor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-40 transition-all" id="booking-modal-overlay">
          <div className="bg-white border border-slate-250 rounded-3xl p-6 md:p-8 max-w-lg w-full relative space-y-6 shadow-xl animate-fade-in">
            
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <img
                  src={selectedTutor.avatar}
                  alt={selectedTutor.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Book: {selectedTutor.name}</h3>
                  <p className="text-[11px] text-indigo-700 font-semibold">${selectedTutor.price}/hr • PHD Coach verified</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTutor(null)}
                className="text-slate-400 hover:text-slate-800 transition cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 mx-auto text-emerald-600 text-xl font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Class slot booked successfully!</h4>
                  <p className="text-xs text-slate-500 font-light">Redirecting to your study cockpit dashboard...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmReservationSubmit} className="space-y-4 text-left">
                
                {/* Select Specific Course Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Select Session Topic</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-650"
                    id="booking-subject-picker"
                  >
                    {selectedTutor.subjects.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Day picker */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Choose Day</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
                    >
                      {selectedTutor.availableDays.map((day, idx) => (
                        <option key={idx} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Available Time slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
                    >
                      {selectedTutor.availableSlots.map((slot, idx) => (
                        <option key={idx} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Student notes/topics checklist */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Student Study Notes (What do you want to cover?)</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="e.g., Struggling with double integral equations and coordinate transforms..."
                    className="w-full h-20 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                    required
                    id="booking-notes-entry"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-md transition cursor-pointer"
                  id="confirm-booking-btn"
                >
                  Confirm Reservation & Open Video Space
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
