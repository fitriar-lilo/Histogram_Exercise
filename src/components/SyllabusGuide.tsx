import React from 'react';

export const SyllabusGuide: React.FC = () => {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <header className="border-b border-slate-200 pb-5">
        <div className="text-xs font-data text-sky-700 font-semibold">
          Cambridge IGCSE Mathematics (0580) · Chapter 20 Statistics
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Histograms: Formulas, Methods & Examiner Rules
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Essential definitions, area proportionality methods, and Paper 4 extended-response conventions required for full marks on Chapter 20 Histogram essay questions.
        </p>
      </header>

      {/* Core Formulas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="text-xs font-semibold text-sky-700">01. Frequency Density</div>
          <div className="font-data text-base font-semibold text-slate-900 py-1">
            FD = Frequency ÷ Class Width
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Always compute exact class widths using upper minus lower continuous boundary (e.g., 15 ≤ t &lt; 25 has width 25 − 15 = 10).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="text-xs font-semibold text-sky-700">02. Area Represents Frequency</div>
          <div className="font-data text-base font-semibold text-slate-900 py-1">
            Frequency = Width × FD
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            To read a histogram back into a table, multiply each bar’s horizontal width by its vertical frequency density height.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="text-xs font-semibold text-sky-700">03. Estimated Mean</div>
          <div className="font-data text-base font-semibold text-slate-900 py-1">
            Mean ≈ Σ(f × midpoint) ÷ Σf
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Midpoint = (Lower + Upper) ÷ 2. Remember to divide by total frequency Σf, never by the number of rows.
          </p>
        </div>
      </section>

      {/* Four Core Subtopic Protocols */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">
          Step-by-Step Protocols for IGCSE 0580 Paper 4 Subtopics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              A. Unlabeled Vertical Axis (Single Known Bar)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>Locate the single interval whose frequency is stated in the question text.</li>
              <li>Compute its true Frequency Density = Frequency ÷ Class Width.</li>
              <li>Count the bar’s height in major grid divisions (or small 2mm squares).</li>
              <li>Divide true FD by the number of grid divisions to lock in the vertical scale.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              B. Unlabeled Axis (Total Frequency Only)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>Measure each bar’s height in grid divisions and multiply by its class width.</li>
              <li>Sum all these grid-areas across every bar in the histogram.</li>
              <li>Divide the given total frequency by the total grid-area to obtain the scale factor k.</li>
              <li>Multiply each bar’s grid-area by k to recover every class frequency.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              C. Estimating Values Beyond a Cut-Off (Interpolation)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>Draw a vertical line at the required threshold inside the split class interval.</li>
              <li>Multiply the partial width inside that interval by its bar height (FD).</li>
              <li>Add any complete bars that lie entirely on the required side of the threshold.</li>
              <li>If asked why it is an estimate: state the uniform distribution assumption.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              D. Written Comparison Essays (2–3 Marks)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>Write one clear statement comparing an average (mean or median) with figures.</li>
              <li>Write a second statement comparing spread, concentration, or skewness in context.</li>
              <li>Always refer to the real-world variable (e.g., journey times, heights) rather than raw numbers alone.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="bg-slate-100 border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Top 4 Mistakes Highlighted in Cambridge Examiner Reports
        </h2>
        <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <li>
            <strong className="text-slate-900">1. Plotting Frequency instead of Frequency Density:</strong> Results in zero marks for bar heights when class widths vary.
          </li>
          <li>
            <strong className="text-slate-900">2. Leaving gaps between bars:</strong> Histograms represent continuous grouped data; adjacent intervals must touch cleanly at exact boundaries.
          </li>
          <li>
            <strong className="text-slate-900">3. Using discrete integer midpoints carelessly:</strong> For 10 ≤ t &lt; 20, the midpoint is 15; for 10 ≤ t &lt; 15, the midpoint is 12.5.
          </li>
          <li>
            <strong className="text-slate-900">4. Forgetting "without replacement" adjustment:</strong> When picking two items from n total with k qualifying, the second fraction must be (k − 1) ÷ (n − 1).
          </li>
        </ul>
      </section>
    </div>
  );
};
