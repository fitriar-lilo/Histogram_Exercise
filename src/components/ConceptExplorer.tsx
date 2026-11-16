import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ClassInterval, GridConfig } from '../types/histogram';
import { InteractiveHistogramGrid } from './InteractiveHistogramGrid';

type LearningStage = 1 | 2 | 3 | 4;

const DEFAULT_FREQUENCIES = [20, 25, 30, 20];

export const ConceptExplorer: React.FC = () => {
  const [stage, setStage] = useState<LearningStage>(1);
  const [plotMode, setPlotMode] = useState<'density' | 'frequency'>('density');
  const [frequencies, setFrequencies] = useState<number[]>(DEFAULT_FREQUENCIES);
  const [splitWidth, setSplitWidth] = useState<number>(5); // Width of second bar [10, 10+splitWidth)
  const [thresholdX, setThresholdX] = useState<number>(22);

  const intervals: ClassInterval[] = useMemo(() => {
    const b1End = 10;
    const b2End = 10 + splitWidth;
    const b3End = 30;
    const b4End = 50;

    const specs = [
      { id: 'ce-1', start: 0, end: b1End, freq: frequencies[0] },
      { id: 'ce-2', start: b1End, end: b2End, freq: frequencies[1] },
      { id: 'ce-3', start: b2End, end: b3End, freq: frequencies[2] },
      { id: 'ce-4', start: b3End, end: b4End, freq: frequencies[3] },
    ];

    return specs.map((s) => {
      const width = s.end - s.start;
      return {
        id: s.id,
        label: `${s.start} ≤ t < ${s.end}`,
        start: s.start,
        end: s.end,
        width,
        frequency: s.freq,
        frequencyDensity: Number((s.freq / width).toFixed(2)),
        frequencyGiven: true,
        barGiven: true,
      };
    });
  }, [frequencies, splitWidth]);

  const maxFd = Math.max(...intervals.map((i) => i.frequencyDensity), 4);
  const yMax = Math.ceil(maxFd + 1);

  const grid: GridConfig = {
    xMin: 0,
    xMax: 50,
    xMajorStep: 5,
    xMinorPerMajor: 5,
    xAxisLabel: 'Continuous variable, t (minutes)',
    yMax,
    yMajorStep: yMax > 8 ? 2 : 1,
    yMinorPerMajor: 5,
    yAxisLabel: plotMode === 'frequency' ? 'Raw Frequency (INCORRECT for unequal widths)' : 'Frequency density',
    snapStep: 0.1,
  };

  // Partial area calculation for t >= thresholdX
  const thresholdEstimate = useMemo(() => {
    return intervals.reduce((sum, interval) => {
      if (interval.end <= thresholdX) return sum;
      const effectiveStart = Math.max(interval.start, thresholdX);
      const effectiveWidth = interval.end - effectiveStart;
      return sum + effectiveWidth * interval.frequencyDensity;
    }, 0);
  }, [intervals, thresholdX]);

  const totalFreq = frequencies.reduce((a, b) => a + b, 0);

  const handleStageSelect = (nextStage: LearningStage) => {
    setStage(nextStage);
    if (nextStage === 1) {
      setPlotMode('frequency');
    } else {
      setPlotMode('density');
    }
  };

  const resetSandbox = () => {
    setFrequencies(DEFAULT_FREQUENCIES);
    setSplitWidth(5);
    setThresholdX(22);
    setPlotMode('density');
  };

  const stages: { id: LearningStage; title: string; summary: string }[] = [
    {
      id: 1,
      title: 'Stage 1: Why Raw Frequency Fails',
      summary:
        'When class widths are unequal, plotting frequency on the vertical axis exaggerates wide classes and shrinks narrow ones. Toggle between Frequency and Frequency Density to see the distortion.',
    },
    {
      id: 2,
      title: 'Stage 2: Frequency Density Formula',
      summary:
        'Frequency Density = Frequency ÷ Class Width. Adjust each class frequency below and watch the bar heights scale inversely with class width.',
    },
    {
      id: 3,
      title: 'Stage 3: Area Equals Frequency',
      summary:
        'Changing the boundary between Bar 2 and Bar 3 alters their widths while keeping frequencies constant—proving that Bar Area (Width × Height) always equals Frequency.',
    },
    {
      id: 4,
      title: 'Stage 4: Partial-Interval Estimation',
      summary:
        'Paper 4 often asks how many values exceed a boundary inside a bar. Drag the threshold cut line to slice the shaded area proportionally.',
    },
  ];

  const activeStageMeta = stages.find((s) => s.id === stage)!;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Interactive Histogram Concept Explorer
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manipulate class frequencies, unequal boundaries, and threshold cuts to verify how bar area represents frequency.
          </p>
        </div>

        <button
          type="button"
          onClick={resetSandbox}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset Sandbox
        </button>
      </div>

      {/* Stage Progression Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stages.map((s) => {
          const active = stage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStageSelect(s.id)}
              className={`text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className={`text-xs font-semibold ${active ? 'text-sky-300' : 'text-sky-700'}`}>
                {s.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone (65%): Live Interactive Graph & Computed Area Table */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {plotMode === 'density'
                    ? 'True Histogram (Y-axis = Frequency Density)'
                    : 'Common Error: Bar Chart (Y-axis = Raw Frequency)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {plotMode === 'density'
                    ? 'Notice how Area = Width × Frequency Density matches the exact frequency of every class.'
                    : 'Notice how the wide 30 ≤ t < 50 bar looks visually huge even though it has the same frequency as 0 ≤ t < 10.'}
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPlotMode('density')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    plotMode === 'density'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Frequency Density (Correct)
                </button>
                <button
                  type="button"
                  onClick={() => setPlotMode('frequency')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    plotMode === 'frequency'
                      ? 'bg-white text-amber-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw Frequency (Error)
                </button>
              </div>
            </div>

            <InteractiveHistogramGrid
              intervals={intervals}
              grid={grid}
              interactive={false}
              plotRawFrequency={plotMode === 'frequency'}
              thresholdHighlight={
                stage === 4 && plotMode === 'density'
                  ? {
                      from: thresholdX,
                      to: 50,
                      caption: `Shaded area t ≥ ${thresholdX}: Estimated frequency = ${thresholdEstimate.toFixed(1)} out of ${totalFreq} (${((thresholdEstimate / totalFreq) * 100).toFixed(1)}%)`,
                    }
                  : null
              }
            />
          </div>

          {/* Live Computed Verification Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-700">
                  <th className="py-2 px-3">Class Interval</th>
                  <th className="py-2 px-3 text-right">Width</th>
                  <th className="py-2 px-3 text-right">Frequency (f)</th>
                  <th className="py-2 px-3 text-right">Frequency Density (f ÷ w)</th>
                  <th className="py-2 px-3 text-right">Bar Area (w × FD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-data">
                {intervals.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 font-medium text-slate-900">{row.label}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{row.width}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">{row.frequency}</td>
                    <td className="py-2 px-3 text-right font-semibold text-sky-700">
                      {row.frequencyDensity.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                      {(row.width * row.frequencyDensity).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Zone (35%): Concept Deck & Parameter Sliders */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="text-xs font-semibold text-sky-700">
              {activeStageMeta.title}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {activeStageMeta.summary}
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-data text-xs text-slate-800 space-y-1">
              <div>Frequency Density = Frequency ÷ Class Width</div>
              <div>Frequency = Area = Class Width × Height</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Interactive Parameter Controls
            </h3>

            {/* Boundary Width Slider */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="split-width" className="font-medium text-slate-700">
                  Class 2 Width (10 to {10 + splitWidth})
                </label>
                <span className="font-data font-semibold text-sky-700">
                  {splitWidth} min
                </span>
              </div>
              <input
                id="split-width"
                type="range"
                min={2}
                max={15}
                step={1}
                value={splitWidth}
                onChange={(e) => setSplitWidth(Number(e.target.value))}
                className="w-full accent-sky-700 cursor-pointer"
              />
            </div>

            {/* Threshold Cut Slider */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="threshold-cut" className="font-medium text-slate-700">
                  Threshold Estimate (t ≥ k)
                </label>
                <span className="font-data font-semibold text-amber-700">
                  k = {thresholdX} min
                </span>
              </div>
              <input
                id="threshold-cut"
                type="range"
                min={0}
                max={50}
                step={1}
                value={thresholdX}
                onChange={(e) => {
                  setStage(4);
                  setPlotMode('density');
                  setThresholdX(Number(e.target.value));
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="text-xs font-data text-slate-600">
                Estimated values ≥ {thresholdX}:{' '}
                <strong className="text-slate-900">{thresholdEstimate.toFixed(1)}</strong> / {totalFreq}
              </div>
            </div>

            {/* Class Frequency Sliders */}
            <div className="space-y-3.5">
              {intervals.map((interval, idx) => (
                <div key={interval.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`freq-slider-${idx}`}
                      className="font-data text-slate-700"
                    >
                      {interval.label}
                    </label>
                    <span className="font-data font-semibold text-slate-900">
                      f = {frequencies[idx]} values
                    </span>
                  </div>
                  <input
                    id={`freq-slider-${idx}`}
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={frequencies[idx]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFrequencies((prev) => prev.map((f, i) => (i === idx ? val : f)));
                    }}
                    className="w-full accent-slate-800 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
