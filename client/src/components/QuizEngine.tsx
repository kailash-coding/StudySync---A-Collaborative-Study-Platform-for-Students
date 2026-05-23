import React, { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, Layers, CheckSquare, Trophy, Eye, CheckCircle, HelpCircle, AlertCircle, Bookmark, ArrowLeft } from "lucide-react";
import { Quiz, QuizQuestion, Flashcard } from "../types";

export default function QuizEngine() {
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<'quiz' | 'flashcards'>('quiz');
  
  // Data State
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentFlashcards, setCurrentFlashcards] = useState<Flashcard[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Quiz Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showScoreScreen, setShowScoreScreen] = useState<boolean>(false);

  // Active Flashcards Progress State
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [struggledCards, setStruggledCards] = useState<string[]>([]);
  const [showCardSummary, setShowCardSummary] = useState<boolean>(false);

  // Suggested quick topics
  const suggestedTopics = [
    "Quantum Physics",
    "Biochemistry",
    "TypeScript & React",
    "Modern European History"
  ];

  const handleQuickTopicSelect = (name: string) => {
    setTopic(name);
    triggerStudyGeneration(name, studyMode);
  };

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() === "") return;
    triggerStudyGeneration(topic, studyMode);
  };

  const triggerStudyGeneration = async (studyTopic: string, mode: 'quiz' | 'flashcards') => {
    setLoading(true);
    setErrorMessage(null);
    setCurrentQuiz(null);
    setCurrentFlashcards(null);
    
    // Reset progress states
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setShowScoreScreen(false);

    setCurrentCardIndex(0);
    setIsFlipped(false);
    setMasteredCards([]);
    setStruggledCards([]);
    setShowCardSummary(false);

    const endpoint = mode === 'quiz' ? '/api/generate-quiz' : '/api/generate-flashcards';

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: studyTopic })
      });

      if (!response.ok) {
        throw new Error("Failed to contact study assistant generator on the server.");
      }

      const data = await response.json();
      if (mode === 'quiz') {
        setCurrentQuiz(data);
      } else {
        setCurrentFlashcards(data);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage("Could not parse study set. Please verify server logs or retry soon.");
    } finally {
      setLoading(false);
    }
  };

  // Option Action triggers in Quiz mode
  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);

    const q = currentQuiz?.questions[currentQuestionIndex];
    if (q && q.correctAnswerIndex === idx) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuiz) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < currentQuiz.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setShowScoreScreen(true);
    }
  };

  // Flashcards Action triggers
  const handleFlashcardStatus = (status: 'mastered' | 'struggled') => {
    if (!currentFlashcards) return;
    const cardId = `card-${currentCardIndex}`;
    
    if (status === 'mastered') {
      setMasteredCards((prev) => [...prev.filter(id => id !== cardId), cardId]);
    } else {
      setStruggledCards((prev) => [...prev.filter(id => id !== cardId), cardId]);
    }

    setIsFlipped(false);
    // Timeout to coordinate flip back transition
    setTimeout(() => {
      const nextIdx = currentCardIndex + 1;
      if (nextIdx < currentFlashcards.length) {
        setCurrentCardIndex(nextIdx);
      } else {
        setShowCardSummary(true);
      }
    }, 150);
  };

  const currentQuestion: QuizQuestion | undefined = currentQuiz?.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto py-2 px-2 space-y-8" id="quizzing-engine-root">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-500 fill-current animate-pulse" />
          Active Recall & AI Quizzing Engine
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
          Unlock instant retention. Set memory triggers, test concept gaps, and study generated revision decks powered directly by Gemini-3.5.
        </p>
      </div>

      {/* Input query section if not loading and no active test in progress */}
      {!loading && !currentQuiz && !currentFlashcards && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-center border-b border-slate-150 pb-4">
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStudyMode('quiz')}
                className={`px-4 py-2 rounded-lg font-bold transition duration-150 flex items-center gap-1.5 cursor-pointer ${studyMode === 'quiz' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                id="mode-quiz-select"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Multiple-Choice Quiz
              </button>
              <button
                type="button"
                onClick={() => setStudyMode('flashcards')}
                className={`px-4 py-2 rounded-lg font-bold transition duration-150 flex items-center gap-1.5 cursor-pointer ${studyMode === 'flashcards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                id="mode-cards-select"
              >
                <Layers className="w-3.5 h-3.5" />
                Memory Flashcards Decks
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerateClick} className="space-y-4 max-w-2xl mx-auto">
            <div className="space-y-2 text-center md:text-left">
              <label className="text-xs text-slate-500 font-semibold tracking-wide">Enter Any Topic, Text, or Subject Area</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Mitochondria, Double Slit experiment, European Cold War..."
                  className="flex-1 bg-slate-50 border border-slate-250 px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm font-medium"
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={topic.trim() === ""}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  id="generator-trigger-btn"
                >
                  Generate Set
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Preset templates */}
          <div className="space-y-3 pt-4 border-t border-slate-150">
            <p className="text-xs text-slate-500 font-semibold text-center">Or click a recommended academic study area:</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {suggestedTopics.map((item) => (
                <button
                  key={item}
                  onClick={() => handleQuickTopicSelect(item)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-700 transition hover:border-slate-300 cursor-pointer shadow-xs"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state showing reassuring study progress */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6 shadow-sm" id="quizzing-loading-spinner">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse absolute inset-0 m-auto" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-display font-bold text-slate-900">Synthesizing High-Yield Learning Materials...</h3>
            <p className="text-xs text-indigo-750 max-w-sm mx-auto leading-relaxed">
              Gemini is assessing your topic, framing diagnostic questions, and writing detailed explanation summaries. Almost ready!
            </p>
          </div>
        </div>
      )}

      {/* Error Output */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-rose-800">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-600 underline mt-2 inline-block cursor-pointer"
            >
              Back to Topic Explorer
            </button>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC MCQ QUIZ MODE */}
      {currentQuiz && (
        <div className="space-y-6">
          {/* Header block with quiz statistics */}
          {!showScoreScreen ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentQuiz(null)}
                   className="p-1.5 rounded-lg bg-slate-50 text-slate-550 hover:text-slate-800 border border-slate-200 cursor-pointer"
                  title="Abandon and go back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs">{currentQuiz.title}</h3>
                  <p className="text-[10px] text-indigo-750 font-medium">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</p>
                </div>
              </div>
              
              {/* Progress metrics */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Score</span>
                  <span className="text-xs text-emerald-700 font-bold">{score} / {currentQuiz.questions.length} Correct</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quiz Content body */}
          {!showScoreScreen && currentQuestion && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 animate-pulse"
                  style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-650 uppercase tracking-widest font-mono">QUESTION {currentQuestionIndex + 1}</span>
                <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Multiple Choice Options List */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = currentQuestion.correctAnswerIndex === idx;
                  
                  let optionStyle = "bg-slate-50 hover:bg-slate-100/85 border-slate-200 text-slate-800 cursor-pointer hover:border-slate-350";
                  if (answered) {
                    if (isCorrect) {
                      optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs";
                    } else if (isSelected) {
                      optionStyle = "bg-rose-50 border-rose-400 text-rose-800 font-semibold shadow-2xs";
                    } else {
                      optionStyle = "bg-slate-50/50 border-slate-105 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={answered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition duration-150 flex items-center justify-between ${optionStyle}`}
                    >
                      <div className="flex gap-3 items-center">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-[11px] font-bold text-indigo-600">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-medium">{option}</span>
                      </div>
                      
                      {/* Check/X icons upon feedback status */}
                      {answered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel upon answering question */}
              {answered && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2 animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold">
                    <HelpCircle className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Conceptual Breakdown & Analysis
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-light">
                    {currentQuestion.explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                      id="next-question-btn"
                    >
                      {currentQuestionIndex + 1 < currentQuiz.questions.length ? "Next Question" : "Complete Quiz"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCORE SUMMARY CARD */}
          {showScoreScreen && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-md" id="quiz-score-summary">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100 mx-auto">
                <Trophy className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-slate-900">Study Block Completed!</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Excellent work analyzing the diagnostics. Check your metrics below to review knowledge retention score:
                </p>
              </div>

              {/* Accuracy score circular meter */}
              <div className="bg-slate-50 py-5 px-8 rounded-2xl border border-slate-200 max-w-md mx-auto grid grid-cols-2 gap-4">
                <div className="text-center border-r border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider font-mono">Accuracy</span>
                  <span className="text-2xl font-bold text-slate-900 block mt-1">
                    {Math.round((score / currentQuiz.questions.length) * 100)}%
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider font-mono">Solved</span>
                  <span className="text-2xl font-bold text-indigo-600 block mt-1">
                    {score} / {currentQuiz.questions.length}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentQuiz(null)}
                  className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 hover:text-slate-900 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-50 shadow-2xs"
                >
                  Browse Another Subject
                </button>
                <button
                  type="button"
                  onClick={() => triggerStudyGeneration(topic || "Quantum Physics", 'quiz')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry This Deck
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER DYNAMIC RECALL FLASHCARD DECKS */}
      {currentFlashcards && (
        <div className="space-y-6">
          {/* Header Progress Indicators */}
          {!showCardSummary ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentFlashcards(null)}
                  className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer"
                  title="Abandon and go back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Study Decks: {topic}</h3>
                  <p className="text-[10px] text-indigo-650 font-semibold">Flashcard {currentCardIndex + 1} of {currentFlashcards.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold">
                  Active Recall Mode
                </span>
              </div>
            </div>
          ) : null}

          {/* Flashcard Item Box */}
          {!showCardSummary && currentFlashcards[currentCardIndex] && (
            <div className="space-y-6" id="flashcard-deck-workspace">
              {/* Card visual flipper area */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer group perspective min-h-[280px]"
                id="flipper-card-click-area"
              >
                <div
                  className={`w-full min-h-[280px] rounded-3xl border p-8 shadow-md relative transition-all duration-300 ease-in-out transform flex flex-col justify-between ${isFlipped ? 'bg-indigo-50/70 border-indigo-200/80 shadow-indigo-100/30' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-center text-[10.5px] font-mono font-bold tracking-widest text-slate-450 uppercase pb-4">
                    <span>{isFlipped ? "💡 CONCEPT DEFINITION" : "🔍 DIAGNOSTIC TERM"}</span>
                    <span className="text-indigo-600">CLICK TO FLIP DECK</span>
                  </div>

                  <div className="text-center py-6">
                    {isFlipped ? (
                      <p className="text-base md:text-lg text-indigo-950 font-medium leading-relaxed animate-fade-in">
                        {currentFlashcards[currentCardIndex].back}
                      </p>
                    ) : (
                      <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                        {currentFlashcards[currentCardIndex].front}
                      </h2>
                    )}
                  </div>

                  <div className="flex justify-center text-slate-600 text-xs items-center gap-1.5 pt-4 border-t border-slate-100">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    Click anywhere to {isFlipped ? "reveal term" : "reveal answer"}
                  </div>
                </div>
              </div>

              {/* Confidence self-validation score buttons */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleFlashcardStatus('struggled')}
                  className="py-3 px-5 border border-rose-200/60 hover:bg-rose-100 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                  id="card-fail-button"
                >
                  ❌ Still Struggling
                </button>
                <button
                  type="button"
                  onClick={() => handleFlashcardStatus('mastered')}
                  className="py-3 px-5 border border-emerald-200/60 hover:bg-emerald-100 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                  id="card-success-button"
                >
                  ✅ I Got it! (Mastered)
                </button>
              </div>
            </div>
          )}

          {/* CARD REVIEWS COMPLETED SUMMARY */}
          {showCardSummary && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-sm" id="cards-completed-summary">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center border border-indigo-100 mx-auto">
                <Layers className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-slate-900">Flashcard Session Done!</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Active recall is the fastest path to durable memory patterns. Review your indicators below:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-center">
                  <span className="text-[10.5px] text-emerald-700 font-semibold uppercase block">Concepts Mastered</span>
                  <span className="text-2xl font-bold text-emerald-950 block mt-1">
                    {masteredCards.length} Cards
                  </span>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-center">
                  <span className="text-[10.5px] text-rose-700 font-semibold uppercase block">Needs Practice</span>
                  <span className="text-2xl font-bold text-rose-950 block mt-1">
                    {struggledCards.length} Cards
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentFlashcards(null)}
                  className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 hover:text-slate-900 font-bold rounded-xl text-xs cursor-pointer shadow-2xs hover:bg-slate-50"
                >
                  Back to Topics
                </button>
                <button
                  type="button"
                  onClick={() => triggerStudyGeneration(topic || "quantum physics", 'flashcards')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Review Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
