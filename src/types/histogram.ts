export type AppView = 'practice' | 'explorer' | 'syllabus' | 'print';

export interface ClassInterval {
  id: string;
  label: string;
  start: number;
  end: number;
  width: number;
  frequency: number;
  frequencyDensity: number;
  /** Whether the frequency value is pre-filled in the student's table */
  frequencyGiven: boolean;
  /** Whether the frequency density column is shown or editable */
  showFdColumn?: boolean;
  fdGiven?: boolean;
  /** Whether the bar is already plotted on the student's histogram */
  barGiven: boolean;
}

export interface GridConfig {
  xMin: number;
  xMax: number;
  xMajorStep: number;
  xMinorPerMajor: number;
  xAxisLabel: string;
  yMax: number;
  yMajorStep: number;
  yMinorPerMajor: number;
  yAxisLabel: string;
  /** When true, numeric labels on Y-axis are hidden and replaced by major grid unit markers */
  yScaleHidden?: boolean;
  /** Multiplier to convert FD into grid Y units when yScaleHidden is true (gridUnits = fd / fdPerMajorUnit) */
  fdPerMajorUnit?: number;
  /** Snap step in FD units when drawing bars */
  snapStep: number;
}

export type SubPartKind = 'table-fill' | 'histogram-draw' | 'numeric' | 'essay';

export interface MarkSchemeStep {
  code: string; // e.g., 'M1', 'A1', 'B1', 'FT1'
  description: string;
}

export interface QuestionSubPart {
  id: string;
  label: string; // e.g., '(a)', '(b)', '(c)', '(d)'
  marks: number;
  kind: SubPartKind;
  prompt: string;
  /** For numeric parts */
  expectedNumber?: number;
  tolerance?: number;
  alternativeAccepted?: number[];
  unit?: string;
  answerHint?: string;
  /** For essay/reasoning parts */
  modelAnswer?: string;
  rubricKeywords?: { label: string; patterns: string[] }[];
  /** Optional partial-interval highlight shown in solution mode */
  thresholdHighlight?: {
    from: number;
    to: number;
    caption: string;
  };
  markScheme: MarkSchemeStep[];
  workedSolution: string[];
}

export interface HistogramQuestion {
  id: string;
  number: number;
  title: string;
  subtopic: string;
  difficulty: 'Core / Extended Bridge' | 'Extended Paper 4' | 'Extended Paper 4 · Synthesis';
  totalMarks: number;
  totalFrequency: number;
  variableSymbol: string;
  contextProse: string;
  secondaryContext?: string;
  examinerNote: string;
  intervals: ClassInterval[];
  /** Optional second dataset (e.g. Question 5 comparison) */
  referenceHistogram?: {
    title: string;
    intervals: ClassInterval[];
    grid: GridConfig;
  };
  grid: GridConfig;
  /** Shows an editable Frequency Density column in the table */
  hasFdColumn: boolean;
  parts: QuestionSubPart[];
}

export interface QuestionUserState {
  tableFrequencies: Record<string, string>;
  tableFds: Record<string, string>;
  drawnBars: Record<string, number>; // intervalId -> FD value in grid coordinates
  numericAnswers: Record<string, string>;
  essayAnswers: Record<string, string>;
  checkedParts: Record<string, boolean>;
  revealedSolutions: Record<string, boolean>;
}
