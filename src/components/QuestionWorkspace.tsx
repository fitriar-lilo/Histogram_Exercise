import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import {
  HistogramQuestion,
  QuestionSubPart,
  QuestionUserState,
} from '../types/histogram';
import { InteractiveHistogramGrid } from './InteractiveHistogramGrid';

interface QuestionWorkspaceProps {
  questions: HistogramQuestion[];
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  userStates: Record<string, QuestionUserState>;
  onUpdateState: (questionId: string, updater: (prev: QuestionUserState) => QuestionUserState) => void;
  onResetQuestion: (questionId: string) => void;
}

export const emptyQuestionState = (): QuestionUserState => ({
  tableFrequencies: {},
  tableFds: {},
  tableMidValues: {},
  tableFxProducts: {},
  drawnBars: {},
  numericAnswers: {},
  essayAnswers: {},
  checkedParts: {},
  revealedSolutions: {},
});

function parseNumericInput(raw: string): number | null {
  const cleaned = raw.trim().replace('%', '');
  if (!cleaned) return null;
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 2) {
      const num = Number(parts[0]);
      const den = Number(parts[1]);
      if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }
  const val = Number(cleaned);
  return Number.isNaN(val) ? null : val;
}

export function evaluatePartStatus(
  question: HistogramQuestion,
  part: QuestionSubPart,
  state: QuestionUserState
): { checked: boolean; passed: boolean; scoreText: string } {
  if (!state.checkedParts[part.id]) {
    return { checked: false, passed: false, scoreText: '' };
  }

  if (part.kind === 'table-fill') {
    if (question.hasFdColumn) {
      const targetIntervals = question.intervals.filter((i) => !i.fdGiven);
      const correctCount = targetIntervals.filter((i) => {
        const val = parseNumericInput(state.tableFds[i.id] || '');
        return val !== null && Math.abs(val - i.frequencyDensity) <= 0.05;
      }).length;
      const passed = correctCount === targetIntervals.length;
      return {
        checked: true,
        passed,
        scoreText: `${correctCount}/${targetIntervals.length} FD values correct`,
      };
    } else {
      const targetIntervals = question.intervals.filter((i) => !i.frequencyGiven);
      const correctCount = targetIntervals.filter((i) => {
        const val = parseNumericInput(state.tableFrequencies[i.id] || '');
        return val !== null && Math.abs(val - i.frequency) <= 0.2;
      }).length;
      const passed = correctCount === targetIntervals.length;
      return {
        checked: true,
        passed,
        scoreText: `${correctCount}/${targetIntervals.length} frequencies correct`,
      };
    }
  }

  if (part.kind === 'histogram-draw') {
    const targetIntervals = question.intervals.filter((i) => !i.barGiven);
    const tol = Math.max(0.15, question.grid.snapStep);
    const correctCount = targetIntervals.filter((i) => {
      const drawn = state.drawnBars[i.id] ?? 0;
      return Math.abs(drawn - i.frequencyDensity) <= tol;
    }).length;
    const passed = correctCount === targetIntervals.length;
    return {
      checked: true,
      passed,
      scoreText: `${correctCount}/${targetIntervals.length} bars plotted accurately`,
    };
  }

  if (part.kind === 'numeric') {
    const raw = state.numericAnswers[part.id] || '';
    const val = parseNumericInput(raw);
    if (val === null || part.expectedNumber === undefined) {
      return { checked: true, passed: false, scoreText: 'Enter a numeric value' };
    }
    const tol = part.tolerance ?? 0.05;
    const matchesPrimary = Math.abs(val - part.expectedNumber) <= tol;
    const matchesAlt = (part.alternativeAccepted || []).some(
      (alt) => Math.abs(val - alt) <= tol
    );
    const passed = matchesPrimary || matchesAlt;
    return {
      checked: true,
      passed,
      scoreText: passed ? 'Exact match' : 'Check method and rounding',
    };
  }

  // Essay rubric evaluation
  const text = (state.essayAnswers[part.id] || '').toLowerCase();
  const keywords = part.rubricKeywords || [];
  if (!text.trim()) {
    return { checked: true, passed: false, scoreText: 'Write your explanation first' };
  }
  const matched = keywords.filter((kw) =>
    kw.patterns.some((p) => text.includes(p.toLowerCase()))
  ).length;
  const passed = matched === keywords.length && keywords.length > 0;
  return {
    checked: true,
    passed,
    scoreText: `${matched}/${keywords.length} key marking criteria detected`,
  };
}

export const QuestionWorkspace: React.FC<QuestionWorkspaceProps> = ({
  questions,
  activeQuestionIndex,
  onSelectQuestion,
  userStates,
  onUpdateState,
  onResetQuestion,
}) => {
  const question = questions[activeQuestionIndex];
  const state = userStates[question.id] || emptyQuestionState();

  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [activeRefTab, setActiveRefTab] = useState<'main' | 'reference'>('main');
  const [activeThresholdPartId, setActiveThresholdPartId] = useState<string | null>(null);

  const handleSelectQuestion = (idx: number) => {
    setActiveRefTab('main');
    setActiveThresholdPartId(null);
    onSelectQuestion(idx);
  };

  const totalEarnedEstimate = question.parts.reduce((acc, part) => {
    const status = evaluatePartStatus(question, part, state);
    return acc + (status.passed ? part.marks : 0);
  }, 0);

  const activeThresholdPart = question.parts.find(
    (p) =>
      p.thresholdHighlight &&
      (p.id === activeThresholdPartId || state.revealedSolutions[p.id])
  );

  const anyDrawSolutionRevealed = question.parts.some(
    (p) => p.kind === 'histogram-draw' && state.revealedSolutions[p.id]
  );

  const tablePart = question.parts.find((p) => p.kind === 'table-fill');
  const isTableChecked = tablePart ? state.checkedParts[tablePart.id] : false;

  const meanPart = question.parts.find(
    (p) => p.kind === 'numeric' && p.prompt.toLowerCase().includes('mean')
  );
  const isMeanChecked = meanPart ? !!state.checkedParts[meanPart.id] : false;

  const fxEnteredValues = question.intervals.map((i) =>
    parseNumericInput(state.tableFxProducts?.[i.id] || '')
  );
  const hasAnyFx = fxEnteredValues.some((v) => v !== null);
  const fxRunningSum = fxEnteredValues.reduce<number>((sum, v) => sum + (v ?? 0), 0);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Question Selector Bar */}
      <section aria-label="Question selector" className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Chapter 20: Histograms — Structured Paper 4 Practice
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Six multi-part IGCSE 0580 examination questions covering frequency density, unknown scales, interpolation, and written comparison.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 font-data shrink-0">
            <span>
              Paper Progress:{' '}
              <strong className="text-slate-900">
                {totalEarnedEstimate} / {question.totalMarks} marks
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onResetQuestion(question.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Question
            </button>
          </div>
        </div>

        {/* Question Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {questions.map((q, idx) => {
            const qState = userStates[q.id] || emptyQuestionState();
            const qMarks = q.parts.reduce(
              (sum, p) => sum + (evaluatePartStatus(q, p, qState).passed ? p.marks : 0),
              0
            );
            const isSelected = idx === activeQuestionIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(idx)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-data">
                  <span className={isSelected ? 'text-sky-300 font-semibold' : 'text-sky-700 font-semibold'}>
                    Q{q.number}
                  </span>
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                    {qMarks}/{q.totalMarks}m
                  </span>
                </div>
                <div
                  className={`text-xs font-medium mt-1 truncate ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {q.title}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Two-Zone Examination Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT STAGE (60%): Question Prompt, Frequency Table & Interactive Grid */}
        <div className="lg:col-span-7 space-y-6">
          {/* Exam Context Header */}
          <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">Question {question.number}</span>
              <span aria-hidden="true">·</span>
              <span className="font-data">{question.totalMarks} Marks</span>
              <span aria-hidden="true">·</span>
              <span>{question.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>{question.subtopic}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {question.title}
            </h2>

            <p className="font-exam text-[16px] leading-relaxed text-slate-800">
              {question.contextProse}
            </p>

            {/* Interactive Frequency Distribution Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs font-semibold text-slate-700">
                    <th className="py-2.5 px-3">Class Interval</th>
                    <th className="py-2.5 px-3 text-right">Class Width</th>
                    <th className="py-2.5 px-3 text-right">Frequency</th>
                    {question.hasFdColumn && (
                      <th className="py-2.5 px-3 text-right">Frequency Density</th>
                    )}
                    {question.hasMeanColumns && (
                      <>
                        <th className="py-2.5 px-3 text-right">Mid Value (x)</th>
                        <th className="py-2.5 px-3 text-right">f × x</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-data">
                  {question.intervals.map((interval) => {
                    const userFreq = state.tableFrequencies[interval.id] || '';
                    const userFd = state.tableFds[interval.id] || '';
                    const userMid = state.tableMidValues?.[interval.id] || '';
                    const userFx = state.tableFxProducts?.[interval.id] || '';

                    const freqNum = parseNumericInput(userFreq);
                    const freqCorrect =
                      freqNum !== null && Math.abs(freqNum - interval.frequency) <= 0.2;

                    const fdNum = parseNumericInput(userFd);
                    const fdCorrect =
                      fdNum !== null && Math.abs(fdNum - interval.frequencyDensity) <= 0.05;

                    const expectedMid = (interval.start + interval.end) / 2;
                    const midNum = parseNumericInput(userMid);
                    const midCorrect =
                      midNum !== null && Math.abs(midNum - expectedMid) <= 0.05;

                    const expectedFx = interval.frequency * expectedMid;
                    const fxNum = parseNumericInput(userFx);
                    const fxCorrect =
                      fxNum !== null && Math.abs(fxNum - expectedFx) <= 0.5;

                    return (
                      <tr key={interval.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {interval.label}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {interval.width}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {interval.frequencyGiven ? (
                            <span className="font-semibold text-slate-900">
                              {interval.frequency}
                            </span>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={userFreq}
                                onChange={(e) =>
                                  onUpdateState(question.id, (prev) => ({
                                    ...prev,
                                    tableFrequencies: {
                                      ...prev.tableFrequencies,
                                      [interval.id]: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="?"
                                aria-label={`Frequency for ${interval.label}`}
                                className={`w-20 px-2.5 py-1.5 text-right text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                                  isTableChecked
                                    ? freqCorrect
                                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                                      : 'border-red-400 bg-red-50/40 text-red-900'
                                    : 'border-slate-300 text-slate-900'
                                }`}
                              />
                              {isTableChecked && (
                                <span
                                  className={`text-[11px] font-sans font-medium ${
                                    freqCorrect ? 'text-emerald-700' : 'text-red-700'
                                  }`}
                                >
                                  {freqCorrect ? 'OK' : 'Check'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        {question.hasFdColumn && (
                          <td className="py-2.5 px-3 text-right">
                            {interval.fdGiven ? (
                              <span className="font-semibold text-slate-900">
                                {interval.frequencyDensity.toFixed(1)}
                              </span>
                            ) : (
                              <div className="inline-flex items-center justify-end gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={userFd}
                                  onChange={(e) =>
                                    onUpdateState(question.id, (prev) => ({
                                      ...prev,
                                      tableFds: {
                                        ...prev.tableFds,
                                        [interval.id]: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="?"
                                  aria-label={`Frequency density for ${interval.label}`}
                                  className={`w-16 sm:w-20 px-2 py-1.5 text-right text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                                    isTableChecked
                                      ? fdCorrect
                                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                                        : 'border-red-400 bg-red-50/40 text-red-900'
                                      : 'border-slate-300 text-slate-900'
                                  }`}
                                />
                                {isTableChecked && (
                                  <span
                                    className={`text-[11px] font-sans font-medium ${
                                      fdCorrect ? 'text-emerald-700' : 'text-red-700'
                                    }`}
                                  >
                                    {fdCorrect ? 'OK' : 'Check'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        {question.hasMeanColumns && (
                          <>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={userMid}
                                  onChange={(e) =>
                                    onUpdateState(question.id, (prev) => ({
                                      ...prev,
                                      tableMidValues: {
                                        ...(prev.tableMidValues || {}),
                                        [interval.id]: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="x"
                                  aria-label={`Mid value for ${interval.label}`}
                                  className={`w-16 sm:w-20 px-2 py-1.5 text-right text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                                    isMeanChecked && userMid.trim() !== ''
                                      ? midCorrect
                                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                                        : 'border-red-400 bg-red-50/40 text-red-900'
                                      : 'border-slate-300 text-slate-900'
                                  }`}
                                />
                                {isMeanChecked && userMid.trim() !== '' && (
                                  <span
                                    className={`text-[11px] font-sans font-medium ${
                                      midCorrect ? 'text-emerald-700' : 'text-red-700'
                                    }`}
                                  >
                                    {midCorrect ? 'OK' : 'Check'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={userFx}
                                  onChange={(e) =>
                                    onUpdateState(question.id, (prev) => ({
                                      ...prev,
                                      tableFxProducts: {
                                        ...(prev.tableFxProducts || {}),
                                        [interval.id]: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="f × x"
                                  aria-label={`Product of frequency and mid value for ${interval.label}`}
                                  className={`w-20 sm:w-22 px-2 py-1.5 text-right text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 ${
                                    isMeanChecked && userFx.trim() !== ''
                                      ? fxCorrect
                                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                                        : 'border-red-400 bg-red-50/40 text-red-900'
                                      : 'border-slate-300 text-slate-900'
                                  }`}
                                />
                                {isMeanChecked && userFx.trim() !== '' && (
                                  <span
                                    className={`text-[11px] font-sans font-medium ${
                                      fxCorrect ? 'text-emerald-700' : 'text-red-700'
                                    }`}
                                  >
                                    {fxCorrect ? 'OK' : 'Check'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-300 bg-slate-50 font-semibold text-slate-900">
                    <td className="py-2 px-3">Total</td>
                    <td className="py-2 px-3 text-right text-slate-400">—</td>
                    <td className="py-2 px-3 text-right">{question.totalFrequency}</td>
                    {question.hasFdColumn && (
                      <td className="py-2 px-3 text-right text-slate-400">—</td>
                    )}
                    {question.hasMeanColumns && (
                      <>
                        <td className="py-2 px-3 text-right text-slate-400">—</td>
                        <td className="py-2 px-3 text-right text-sky-700">
                          {hasAnyFx ? `Σ = ${Number(fxRunningSum.toFixed(2))}` : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          {/* Interactive Histogram Stage */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {question.referenceHistogram && activeRefTab === 'reference'
                    ? question.referenceHistogram.title
                    : 'Examination Graph Grid'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {question.grid.yScaleHidden
                    ? 'Scale-deduction problem: vertical numbers are intentionally hidden.'
                    : 'Area of each bar equals the class frequency.'}
                </p>
              </div>

              {question.referenceHistogram && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveRefTab('reference')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeRefTab === 'reference'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Morning (Given)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRefTab('main')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeRefTab === 'main'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Afternoon (Draw)
                  </button>
                </div>
              )}
            </div>

            {question.referenceHistogram && activeRefTab === 'reference' ? (
              <InteractiveHistogramGrid
                intervals={question.referenceHistogram.intervals}
                grid={question.referenceHistogram.grid}
                interactive={false}
              />
            ) : (
              <InteractiveHistogramGrid
                intervals={question.intervals}
                grid={question.grid}
                drawnBars={state.drawnBars}
                onBarChange={(intervalId, newFd) =>
                  onUpdateState(question.id, (prev) => ({
                    ...prev,
                    drawnBars: {
                      ...prev.drawnBars,
                      [intervalId]: newFd,
                    },
                  }))
                }
                interactive={true}
                showSolutionOverlay={anyDrawSolutionRevealed}
                thresholdHighlight={activeThresholdPart?.thresholdHighlight || null}
              />
            )}
          </section>

          {/* Examiner Pitfall Note */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-2 text-xs">
              <BookOpen className="w-4 h-4 text-sky-700" aria-hidden="true" />
              Cambridge Examiner Report Note
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{question.examinerNote}</p>
          </div>
        </div>

        {/* RIGHT ZONE (40%): Multi-Part Essay Questions & Mark Schemes */}
        <div className="lg:col-span-5 space-y-4">
          {question.parts.map((part) => {
            const status = evaluatePartStatus(question, part, state);
            const isSolutionOpen = !!state.revealedSolutions[part.id];
            const isHintOpen = !!showHints[part.id];

            return (
              <section
                key={part.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                {/* Part Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-data text-sm font-semibold text-sky-700">
                      {part.label}
                    </span>
                    <span className="font-data text-xs text-slate-500">
                      [{part.marks} {part.marks === 1 ? 'mark' : 'marks'}]
                    </span>
                  </div>
                  {status.checked && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        status.passed ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {status.passed ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      {status.scoreText}
                    </span>
                  )}
                </div>

                {/* Part Question Prose */}
                <p className="font-exam text-[15px] leading-relaxed text-slate-900">
                  {part.prompt}
                </p>

                {/* Input Control by Part Kind */}
                {part.kind === 'numeric' && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      value={state.numericAnswers[part.id] || ''}
                      onChange={(e) =>
                        onUpdateState(question.id, (prev) => ({
                          ...prev,
                          numericAnswers: {
                            ...prev.numericAnswers,
                            [part.id]: e.target.value,
                          },
                        }))
                      }
                      placeholder="Enter answer"
                      aria-label={`Answer for ${part.label}`}
                      className="w-40 px-3 py-2 text-sm font-data border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    {part.unit && (
                      <span className="text-xs font-medium text-slate-500">
                        {part.unit}
                      </span>
                    )}
                  </div>
                )}

                {part.kind === 'essay' && (
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      value={state.essayAnswers[part.id] || ''}
                      onChange={(e) =>
                        onUpdateState(question.id, (prev) => ({
                          ...prev,
                          essayAnswers: {
                            ...prev.essayAnswers,
                            [part.id]: e.target.value,
                          },
                        }))
                      }
                      placeholder="Write your mathematical explanation clearly in full sentences..."
                      aria-label={`Written explanation for ${part.label}`}
                      className="w-full px-3.5 py-2.5 text-sm leading-relaxed border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />

                    {/* Rubric Keyword Feedback when checked */}
                    {status.checked && part.rubricKeywords && (
                      <div className="space-y-1.5 pt-1">
                        {part.rubricKeywords.map((kw) => {
                          const txt = (state.essayAnswers[part.id] || '').toLowerCase();
                          const hit = kw.patterns.some((p) => txt.includes(p.toLowerCase()));
                          return (
                            <div
                              key={kw.label}
                              className={`flex items-center gap-2 text-xs ${
                                hit ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {hit ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              )}
                              <span>
                                {hit ? 'Included: ' : 'Missing point: '}
                                {kw.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(part.kind === 'table-fill' || part.kind === 'histogram-draw') && (
                  <p className="text-xs text-slate-500">
                    {part.kind === 'table-fill'
                      ? 'Fill in the missing cells directly in the Frequency Table on the left, then check your entries.'
                      : 'Plot the required bars on the Examination Graph Grid on the left, then check your plotted heights.'}
                  </p>
                )}

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (part.thresholdHighlight) {
                        setActiveThresholdPartId(part.id);
                      }
                      onUpdateState(question.id, (prev) => ({
                        ...prev,
                        checkedParts: { ...prev.checkedParts, [part.id]: true },
                      }));
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {part.kind === 'table-fill'
                      ? 'Check Table'
                      : part.kind === 'histogram-draw'
                      ? 'Check Histogram'
                      : part.kind === 'essay'
                      ? 'Check Reasoning'
                      : 'Check Answer'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = !isSolutionOpen;
                      if (part.thresholdHighlight) {
                        setActiveThresholdPartId(nextOpen ? part.id : null);
                      }
                      onUpdateState(question.id, (prev) => ({
                        ...prev,
                        revealedSolutions: {
                          ...prev.revealedSolutions,
                          [part.id]: nextOpen,
                        },
                      }));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isSolutionOpen ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        Hide Mark Scheme
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        Mark Scheme
                      </>
                    )}
                  </button>

                  {part.answerHint && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowHints((prev) => ({ ...prev, [part.id]: !prev[part.id] }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                      {isHintOpen ? 'Hide Hint' : 'Hint'}
                    </button>
                  )}
                </div>

                {/* Hint Drawer */}
                {isHintOpen && part.answerHint && (
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Method Hint: </span>
                    {part.answerHint}
                  </div>
                )}

                {/* Official Mark Scheme & Worked Solution */}
                {isSolutionOpen && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-900">
                        Cambridge Mark Scheme
                      </div>
                      {part.markScheme.map((ms, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <span className="font-data font-semibold text-emerald-700 shrink-0 w-7">
                            {ms.code}
                          </span>
                          <span>{ms.description}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                      <div className="text-xs font-semibold text-slate-900">
                        Worked Solution
                      </div>
                      {part.workedSolution.map((line, i) => (
                        <div key={i} className="font-data text-xs text-slate-700 leading-relaxed">
                          {line}
                        </div>
                      ))}
                      {part.modelAnswer && (
                        <div className="pt-2 mt-2 border-t border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                          <span className="font-semibold text-slate-900">Model Essay Response: </span>
                          {part.modelAnswer}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {/* Next Question Footer Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={activeQuestionIndex === 0}
              onClick={() => handleSelectQuestion(activeQuestionIndex - 1)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous Question
            </button>
            <button
              type="button"
              disabled={activeQuestionIndex === questions.length - 1}
              onClick={() => handleSelectQuestion(activeQuestionIndex + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next Question
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
