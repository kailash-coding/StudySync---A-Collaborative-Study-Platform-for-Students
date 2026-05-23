export interface User {
  id: string;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  color: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  color: string;
  width: number;
  points: StrokePoint[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Tutor {
  id: string;
  name: string;
  bio: string;
  subjects: string[];
  rating: number;
  price: number;
  availableDays: string[]; // e.g., ["Mondays", "Wednesdays"]
  availableSlots: string[]; // e.g., ["14:00 - 15:00", "16:00 - 17:00"]
  avatar: string;
}

export interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  dateTime: string;
  subject: string;
  studentName: string;
  notes?: string;
  status: 'confirmed' | 'pending';
}
