import { useEffect, useState } from 'react';
import { CHAPTER_20_QUESTIONS } from './data/questions';
import { AppView, QuestionUserState } from './types/histogram';
import { Header } from './components/Header';
import {
  QuestionWorkspace,
  emptyQuestionState,
} from './components/QuestionWorkspace';
import { ConceptExplorer } from './components/ConceptExplorer';
import { SyllabusGuide } from './components/SyllabusGuide';
import { PrintExamSheet } from './components/PrintExamSheet';

const STORAGE_KEY = 'igcse_0580_ch20_histogram_progress_v1';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('practice');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userStates, setUserStates] = useState<Record<string, QuestionUserState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore storage read errors
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userStates));
    } catch {
      // Ignore storage write errors
    }
  }, [userStates]);

  const handleUpdateQuestionState = (
    questionId: string,
    updater: (prev: QuestionUserState) => QuestionUserState
  ) => {
    setUserStates((prev) => {
      const current = prev[questionId] || emptyQuestionState();
      return {
        ...prev,
        [questionId]: updater(current),
      };
    });
  };

  const handleResetQuestion = (questionId: string) => {
    setUserStates((prev) => ({
      ...prev,
      [questionId]: emptyQuestionState(),
    }));
  };

  const handlePrintAction = () => {
    if (activeView === 'print') {
      window.print();
    } else {
      setActiveView('print');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        onPrintAction={handlePrintAction}
      />

      <main className="flex-1">
        {activeView === 'practice' && (
          <QuestionWorkspace
            questions={CHAPTER_20_QUESTIONS}
            activeQuestionIndex={activeQuestionIndex}
            onSelectQuestion={setActiveQuestionIndex}
            userStates={userStates}
            onUpdateState={handleUpdateQuestionState}
            onResetQuestion={handleResetQuestion}
          />
        )}

        {activeView === 'explorer' && <ConceptExplorer />}

        {activeView === 'syllabus' && <SyllabusGuide />}

        {activeView === 'print' && (
          <PrintExamSheet questions={CHAPTER_20_QUESTIONS} />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Cambridge IGCSE Mathematics (0580) · Chapter 20: Histograms & Statistical Diagrams
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView('practice')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Essay Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveView('explorer')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Concept Explorer
            </button>
            <button
              type="button"
              onClick={() => setActiveView('syllabus')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Formula Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

