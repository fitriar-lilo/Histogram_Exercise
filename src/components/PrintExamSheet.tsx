import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { HistogramQuestion } from '../types/histogram';
import { InteractiveHistogramGrid } from './InteractiveHistogramGrid';

interface PrintExamSheetProps {
  questions: HistogramQuestion[];
}

export const PrintExamSheet: React.FC<PrintExamSheetProps> = ({ questions }) => {
  const [includeMarkScheme, setIncludeMarkScheme] = useState(true);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      {/* Print Controls Toolbar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Printable IGCSE 0580 Chapter 20 Exam Booklet
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Formatted with clean examination typography, blank grids where required, and an optional separate Mark Scheme section.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMarkScheme}
              onChange={(e) => setIncludeMarkScheme(e.target.checked)}
              className="w-4 h-4 accent-sky-700 rounded"
            />
            Include Mark Scheme Pages
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Exam Cover Header */}
      <section className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl print:border-none print:p-0 space-y-4">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <div className="text-xs font-data text-slate-600">
              CAMBRIDGE IGCSE MATHEMATICS · 0580
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Chapter 20: Statistics (Histograms) — Structured Essay Paper
            </h2>
          </div>
          <div className="text-right font-data text-xs text-slate-700">
            <div>Total Marks: {questions.reduce((s, q) => s + q.totalMarks, 0)}</div>
            <div>Recommended Time: 65 minutes</div>
          </div>
        </div>
        <p className="text-xs text-slate-700">
          Answer all questions. Show all working clearly; essential steps must be shown for method marks (M1). Calculators are permitted.
        </p>
      </section>

      {/* Questions Booklet */}
      <div className="space-y-8">
        {questions.map((q) => (
          <article
            key={q.id}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5 print:border-slate-300 print-break-inside-avoid"
          >
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Question {q.number}: {q.title}
              </h3>
              <span className="font-data text-xs font-semibold text-slate-600">
                [{q.totalMarks} marks]
              </span>
            </div>

            <p className="font-exam text-[15px] leading-relaxed text-slate-900">
              {q.contextProse}
            </p>

            {/* Table */}
            <table className="w-full border-collapse text-xs font-data">
              <thead>
                <tr className="border-y border-slate-400 bg-slate-50 text-left">
                  <th className="py-2 px-3">Class Interval</th>
                  <th className="py-2 px-3 text-right">Frequency</th>
                  {q.hasFdColumn && <th className="py-2 px-3 text-right">Frequency Density</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {q.intervals.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 px-3">{row.label}</td>
                    <td className="py-2 px-3 text-right">
                      {row.frequencyGiven ? row.frequency : '............'}
                    </td>
                    {q.hasFdColumn && (
                      <td className="py-2 px-3 text-right">
                        {row.fdGiven ? row.frequencyDensity : '............'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Reference Histogram if Q5 */}
            {q.referenceHistogram && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  {q.referenceHistogram.title}
                </div>
                <InteractiveHistogramGrid
                  intervals={q.referenceHistogram.intervals}
                  grid={q.referenceHistogram.grid}
                  interactive={false}
                  compact={true}
                />
              </div>
            )}

            {/* Main Grid (Blank for missing bars, plotted for given bars) */}
            <InteractiveHistogramGrid
              intervals={q.intervals}
              grid={q.grid}
              interactive={false}
              compact={true}
            />

            {/* Sub-parts */}
            <div className="space-y-4 pt-2">
              {q.parts.map((part) => (
                <div key={part.id} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-exam text-sm text-slate-900">
                      <span className="font-data font-semibold mr-2">{part.label}</span>
                      {part.prompt}
                    </p>
                    <span className="font-data text-xs text-slate-600 shrink-0">
                      [{part.marks}]
                    </span>
                  </div>
                  {(part.kind === 'numeric' || part.kind === 'essay') && (
                    <div className="pt-3 border-b border-dotted border-slate-400" />
                  )}
                  {part.kind === 'essay' && (
                    <div className="pt-5 border-b border-dotted border-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Mark Scheme Section */}
      {includeMarkScheme && (
        <section className="print-page-break bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-900 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Official Mark Scheme & Worked Solutions
            </h2>
          </div>

          <div className="space-y-6">
            {questions.map((q) => (
              <div key={`ms-${q.id}`} className="space-y-3 border-b border-slate-200 pb-5 last:border-none">
                <h3 className="text-sm font-bold text-slate-900">
                  Question {q.number}: {q.title} [{q.totalMarks} marks]
                </h3>
                {q.parts.map((part) => (
                  <div key={`ms-${part.id}`} className="pl-3 space-y-1">
                    <div className="text-xs font-semibold text-slate-800">
                      {part.label} [{part.marks}]
                    </div>
                    {part.markScheme.map((ms, idx) => (
                      <div key={idx} className="text-xs text-slate-700 flex gap-2">
                        <span className="font-data font-semibold text-emerald-700 w-7 shrink-0">
                          {ms.code}
                        </span>
                        <span>{ms.description}</span>
                      </div>
                    ))}
                    <div className="text-xs font-data text-slate-600 pt-0.5">
                      {part.workedSolution.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
