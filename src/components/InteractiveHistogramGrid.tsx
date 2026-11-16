import React, { useRef, useState } from 'react';
import { ClassInterval, GridConfig } from '../types/histogram';

interface InteractiveHistogramGridProps {
  intervals: ClassInterval[];
  grid: GridConfig;
  drawnBars?: Record<string, number>;
  onBarChange?: (intervalId: string, newFd: number) => void;
  interactive?: boolean;
  showSolutionOverlay?: boolean;
  thresholdHighlight?: {
    from: number;
    to: number;
    caption: string;
  } | null;
  /** Optional override for Concept Explorer frequency-vs-FD mistake demonstration */
  plotRawFrequency?: boolean;
  compact?: boolean;
}

export const InteractiveHistogramGrid: React.FC<InteractiveHistogramGridProps> = ({
  intervals,
  grid,
  drawnBars = {},
  onBarChange,
  interactive = true,
  showSolutionOverlay = false,
  thresholdHighlight = null,
  plotRawFrequency = false,
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIntervalId, setDraggingIntervalId] = useState<string | null>(null);
  const [hoveredIntervalId, setHoveredIntervalId] = useState<string | null>(null);

  const width = 760;
  const height = compact ? 340 : 410;
  const padLeft = 68;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 56;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const xSpan = grid.xMax - grid.xMin;
  const effectiveYMax = plotRawFrequency
    ? Math.max(...intervals.map((i) => i.frequency), 10) * 1.15
    : grid.yMax;

  const xToPx = (x: number) => padLeft + ((x - grid.xMin) / xSpan) * plotWidth;
  const yToPx = (y: number) => padTop + plotHeight - (y / effectiveYMax) * plotHeight;
  const pxToY = (py: number) => {
    const ratio = (padTop + plotHeight - py) / plotHeight;
    return Math.max(0, Math.min(effectiveYMax, ratio * effectiveYMax));
  };

  const snapValue = (val: number) => {
    const step = grid.snapStep || 0.1;
    const snapped = Math.round(val / step) * step;
    return Number(Math.max(0, Math.min(grid.yMax, snapped)).toFixed(2));
  };

  // Generate grid lines
  const xMinorStep = grid.xMajorStep / grid.xMinorPerMajor;
  const xMinorLines: number[] = [];
  for (let x = grid.xMin; x <= grid.xMax + 1e-6; x += xMinorStep) {
    xMinorLines.push(Number(x.toFixed(4)));
  }

  const xMajorLines: number[] = [];
  for (let x = grid.xMin; x <= grid.xMax + 1e-6; x += grid.xMajorStep) {
    xMajorLines.push(Number(x.toFixed(4)));
  }

  const yMajorStep = plotRawFrequency
    ? Math.max(5, Math.ceil(effectiveYMax / 6 / 5) * 5)
    : grid.yMajorStep;
  const yMinorStep = yMajorStep / grid.yMinorPerMajor;

  const yMinorLines: number[] = [];
  for (let y = 0; y <= effectiveYMax + 1e-6; y += yMinorStep) {
    yMinorLines.push(Number(y.toFixed(4)));
  }

  const yMajorLines: number[] = [];
  for (let y = 0; y <= effectiveYMax + 1e-6; y += yMajorStep) {
    yMajorLines.push(Number(y.toFixed(4)));
  }

  const getPointerValue = (clientY: number) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleY = height / rect.height;
    const svgY = (clientY - rect.top) * scaleY;
    return snapValue(pxToY(svgY));
  };

  const handlePointerDown = (interval: ClassInterval, e: React.PointerEvent) => {
    if (!interactive || interval.barGiven || !onBarChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingIntervalId(interval.id);
    const val = getPointerValue(e.clientY);
    onBarChange(interval.id, val);
  };

  const handlePointerMove = (interval: ClassInterval, e: React.PointerEvent) => {
    if (draggingIntervalId !== interval.id || !onBarChange) return;
    const val = getPointerValue(e.clientY);
    onBarChange(interval.id, val);
  };

  const handlePointerUp = () => {
    setDraggingIntervalId(null);
  };

  const activeInspectInterval = intervals.find(
    (i) => i.id === (draggingIntervalId || hoveredIntervalId)
  );

  const editableIntervals = intervals.filter((i) => !i.barGiven);

  const getDisplayedValue = (interval: ClassInterval) => {
    if (plotRawFrequency) return interval.frequency;
    if (interval.barGiven) return interval.frequencyDensity;
    return drawnBars[interval.id] ?? 0;
  };

  const formatGridDivisionLabel = (yVal: number, index: number) => {
    if (grid.yScaleHidden && grid.fdPerMajorUnit) {
      return `${index}`;
    }
    return Number.isInteger(yVal) ? String(yVal) : yVal.toFixed(1);
  };

  return (
    <div className="space-y-3">
      {/* Live Coordinate & Area Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        {activeInspectInterval ? (
          <div className="flex flex-wrap items-center gap-3 font-data">
            <span className="font-semibold text-slate-900">{activeInspectInterval.label}</span>
            <span aria-hidden="true">·</span>
            <span>Width: {activeInspectInterval.width}</span>
            <span aria-hidden="true">·</span>
            {grid.yScaleHidden && grid.fdPerMajorUnit ? (
              <span>
                Grid Height:{' '}
                <strong className="text-sky-700">
                  {(getDisplayedValue(activeInspectInterval) / grid.fdPerMajorUnit).toFixed(1)} major div
                </strong>{' '}
                ({Math.round((getDisplayedValue(activeInspectInterval) / grid.fdPerMajorUnit) * grid.yMinorPerMajor)} small ticks)
              </span>
            ) : (
              <span>
                {plotRawFrequency ? 'Frequency' : 'Plotted FD'}:{' '}
                <strong className="text-sky-700">
                  {getDisplayedValue(activeInspectInterval).toFixed(1)}
                </strong>
                {!plotRawFrequency && (
                  <>
                    {' '}
                    · Bar Area ={' '}
                    <strong className="text-slate-900">
                      {(activeInspectInterval.width * getDisplayedValue(activeInspectInterval)).toFixed(1)}
                    </strong>
                  </>
                )}
              </span>
            )}
          </div>
        ) : (
          <span>
            {editableIntervals.length > 0 && interactive
              ? 'Click or drag vertically inside dashed intervals to plot bar heights. Hover any bar to inspect grid coordinates.'
              : 'Hover or tap any bar to measure its exact class width and vertical grid height.'}
          </span>
        )}
        <span className="font-data text-slate-500 shrink-0">
          {grid.yScaleHidden
            ? `1 major y-div = ${grid.yMinorPerMajor} minor ticks`
            : `Snap: ${grid.snapStep}`}
        </span>
      </div>

      {/* Graph Paper SVG Canvas */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 sm:p-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-auto select-none touch-none"
          role="img"
          aria-label={`Histogram grid for ${grid.xAxisLabel}`}
        >
          {/* Graph paper background */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotWidth}
            height={plotHeight}
            fill="#ffffff"
          />

          {/* Minor Grid Lines */}
          {xMinorLines.map((x) => (
            <line
              key={`xmin-${x}`}
              x1={xToPx(x)}
              y1={padTop}
              x2={xToPx(x)}
              y2={padTop + plotHeight}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}
          {yMinorLines.map((y) => (
            <line
              key={`ymin-${y}`}
              x1={padLeft}
              y1={yToPx(y)}
              x2={padLeft + plotWidth}
              y2={yToPx(y)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}

          {/* Major Grid Lines */}
          {xMajorLines.map((x) => (
            <line
              key={`xmaj-${x}`}
              x1={xToPx(x)}
              y1={padTop}
              x2={xToPx(x)}
              y2={padTop + plotHeight}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          ))}
          {yMajorLines.map((y) => (
            <line
              key={`ymaj-${y}`}
              x1={padLeft}
              y1={yToPx(y)}
              x2={padLeft + plotWidth}
              y2={yToPx(y)}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          ))}

          {/* Bars */}
          {intervals.map((interval) => {
            const x1 = xToPx(interval.start);
            const x2 = xToPx(interval.end);
            const barW = x2 - x1;
            const val = getDisplayedValue(interval);
            const barY = yToPx(val);
            const barH = Math.max(0, padTop + plotHeight - barY);
            const isEditable = !interval.barGiven && interactive && !plotRawFrequency;
            const isHovered = hoveredIntervalId === interval.id || draggingIntervalId === interval.id;

            return (
              <g key={interval.id}>
                {/* Interactive full-height hit zone for editable bars */}
                {isEditable && (
                  <rect
                    x={x1}
                    y={padTop}
                    width={barW}
                    height={plotHeight}
                    fill={isHovered ? 'rgba(14, 165, 233, 0.05)' : 'transparent'}
                    className="cursor-ns-resize"
                    onPointerDown={(e) => handlePointerDown(interval, e)}
                    onPointerMove={(e) => handlePointerMove(interval, e)}
                    onPointerUp={handlePointerUp}
                    onPointerEnter={() => setHoveredIntervalId(interval.id)}
                    onPointerLeave={() => setHoveredIntervalId(null)}
                  />
                )}

                {/* Empty dashed guide outline if editable bar has height 0 */}
                {isEditable && val === 0 && (
                  <rect
                    x={x1 + 1}
                    y={padTop + plotHeight - 16}
                    width={Math.max(0, barW - 2)}
                    height={16}
                    fill="rgba(2, 132, 199, 0.06)"
                    stroke="#0284c7"
                    strokeDasharray="4 3"
                    strokeWidth={1.25}
                    pointerEvents="none"
                  />
                )}

                {/* Plotted Bar */}
                {val > 0 && (
                  <rect
                    x={x1}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={
                      plotRawFrequency
                        ? 'rgba(217, 119, 6, 0.24)'
                        : interval.barGiven
                        ? 'rgba(15, 23, 42, 0.14)'
                        : 'rgba(2, 132, 199, 0.24)'
                    }
                    stroke={
                      plotRawFrequency
                        ? '#b45309'
                        : interval.barGiven
                        ? '#0f172a'
                        : '#0369a1'
                    }
                    strokeWidth={isHovered ? 2 : 1.5}
                    className={isEditable ? 'cursor-ns-resize' : 'cursor-pointer'}
                    onPointerDown={isEditable ? (e) => handlePointerDown(interval, e) : undefined}
                    onPointerMove={isEditable ? (e) => handlePointerMove(interval, e) : undefined}
                    onPointerUp={isEditable ? handlePointerUp : undefined}
                    onPointerEnter={() => setHoveredIntervalId(interval.id)}
                    onPointerLeave={() => setHoveredIntervalId(null)}
                  />
                )}

                {/* Drag handle bar top indicator */}
                {isEditable && (
                  <g pointerEvents="none">
                    <line
                      x1={x1 + 4}
                      y1={val > 0 ? barY : padTop + plotHeight}
                      x2={x2 - 4}
                      y2={val > 0 ? barY : padTop + plotHeight}
                      stroke="#0284c7"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Threshold Partial-Interval Highlight Overlay */}
                {thresholdHighlight &&
                  interval.end > thresholdHighlight.from &&
                  interval.start < thresholdHighlight.to && (
                    <rect
                      x={xToPx(Math.max(interval.start, thresholdHighlight.from))}
                      y={yToPx(interval.frequencyDensity)}
                      width={
                        xToPx(Math.min(interval.end, thresholdHighlight.to)) -
                        xToPx(Math.max(interval.start, thresholdHighlight.from))
                      }
                      height={padTop + plotHeight - yToPx(interval.frequencyDensity)}
                      fill="rgba(217, 119, 6, 0.34)"
                      stroke="#b45309"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      pointerEvents="none"
                    />
                  )}

                {/* Solution Overlay */}
                {showSolutionOverlay && !interval.barGiven && (
                  <rect
                    x={x1 + 1}
                    y={yToPx(interval.frequencyDensity)}
                    width={Math.max(0, barW - 2)}
                    height={padTop + plotHeight - yToPx(interval.frequencyDensity)}
                    fill="rgba(5, 150, 105, 0.14)"
                    stroke="#059669"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {/* Threshold Vertical Cut Line */}
          {thresholdHighlight && (
            <g pointerEvents="none">
              {thresholdHighlight.from > grid.xMin && (
                <line
                  x1={xToPx(thresholdHighlight.from)}
                  y1={padTop}
                  x2={xToPx(thresholdHighlight.from)}
                  y2={padTop + plotHeight}
                  stroke="#b45309"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              )}
              {thresholdHighlight.to < grid.xMax && (
                <line
                  x1={xToPx(thresholdHighlight.to)}
                  y1={padTop}
                  x2={xToPx(thresholdHighlight.to)}
                  y2={padTop + plotHeight}
                  stroke="#b45309"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              )}
            </g>
          )}

          {/* Primary Axes */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotHeight}
            stroke="#0f172a"
            strokeWidth={1.75}
          />
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={padLeft + plotWidth}
            y2={padTop + plotHeight}
            stroke="#0f172a"
            strokeWidth={1.75}
          />

          {/* X-axis tick labels */}
          {xMajorLines.map((x) => (
            <text
              key={`xlab-${x}`}
              x={xToPx(x)}
              y={padTop + plotHeight + 18}
              textAnchor="middle"
              className="fill-slate-700 text-[11px] font-data"
            >
              {x}
            </text>
          ))}

          {/* Y-axis tick labels */}
          {yMajorLines.map((y, idx) => (
            <text
              key={`ylab-${y}`}
              x={padLeft - 10}
              y={yToPx(y) + 4}
              textAnchor="end"
              className="fill-slate-700 text-[11px] font-data"
            >
              {formatGridDivisionLabel(y, idx)}
            </text>
          ))}

          {/* X Axis Title */}
          <text
            x={padLeft + plotWidth / 2}
            y={height - 10}
            textAnchor="middle"
            className="fill-slate-900 text-xs font-semibold"
          >
            {grid.xAxisLabel}
          </text>

          {/* Y Axis Title */}
          <text
            x={18}
            y={padTop + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${padTop + plotHeight / 2})`}
            className="fill-slate-900 text-xs font-semibold"
          >
            {grid.yScaleHidden ? 'Major vertical grid divisions (unlabeled FD)' : grid.yAxisLabel}
          </text>
        </svg>
      </div>

      {/* Threshold Caption Banner (when active) */}
      {thresholdHighlight && (
        <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-900 flex items-center justify-between gap-2">
          <span>▲ {thresholdHighlight.caption}</span>
        </div>
      )}

      {/* Accessible Fine-Adjustment Stepper Strip for Editable Bars */}
      {interactive && editableIntervals.length > 0 && !plotRawFrequency && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {editableIntervals.map((interval) => {
            const currentVal = drawnBars[interval.id] ?? 0;
            const step = grid.snapStep || 0.1;
            return (
              <div
                key={`ctrl-${interval.id}`}
                className="flex flex-col gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <span className="text-[11px] font-data font-medium text-slate-700 truncate">
                  {interval.label}
                </span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onBarChange?.(
                        interval.id,
                        Number(Math.max(0, currentVal - step).toFixed(2))
                      )
                    }
                    aria-label={`Decrease height for ${interval.label}`}
                    className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-data text-sm cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-data text-sm font-semibold text-sky-700">
                    {currentVal.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onBarChange?.(
                        interval.id,
                        Number(Math.min(grid.yMax, currentVal + step).toFixed(2))
                      )
                    }
                    aria-label={`Increase height for ${interval.label}`}
                    className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-data text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
