/**
 * ScaleLab Data Models
 * Grounded in Churchill (1979), Clark & Watson (1995/2019), Hinkin (1998), Boateng et al. (2018)
 */

export type MeasurementModelType = 'reflective' | 'formative' | 'uncertain';

export type ScaleCategory = 
  | 'Social Sciences'
  | 'Psychology'
  | 'Management & Organizational Behavior'
  | 'Education'
  | 'Health & Nursing'
  | 'Marketing & Consumer Research'
  | 'Interdisciplinary';

export type ScaleType = 'new_scale' | 'adaptation';

export type ItemStatus = 'draft' | 'retained' | 'revised' | 'removed';

export type ResponseFormatType = 
  | 'likert_5'
  | 'likert_7'
  | 'likert_6_forced'
  | 'frequency_5'
  | 'intensity_5'
  | 'bipolar_semantic_7'
  | 'binary_yes_no'
  | 'custom_numeric';

export interface ResponseAnchor {
  value: number;
  label: string;
}

export interface Dimension {
  id: string;
  name: string;
  code: string; // e.g. "VS" for Voice Safety
  description: string;
  includedAspects: string;
  excludedAspects: string;
  itemCountTarget?: number;
}

export interface ItemRevision {
  id: string;
  timestamp: string;
  previousWording: string;
  newWording: string;
  rationale: string;
  author: string;
}

export interface HeuristicFlag {
  type: 'double_barrelled' | 'leading' | 'ambiguous' | 'unnecessary_complexity' | 'repetition' | 'extreme_wording' | 'poor_fit';
  severity: 'warning' | 'info' | 'caution';
  message: string;
  suggestion?: string;
}

export interface ScaleItem {
  id: string; // Stable item ID e.g. "WPSS-01"
  wording: string;
  dimensionId: string;
  sourceOrRationale: string;
  generationMethod: 'deductive_literature' | 'inductive_qualitative' | 'expert_panel' | 'ai_suggested_adapted';
  responseFormat: ResponseFormatType;
  customAnchors?: ResponseAnchor[];
  recallPeriod?: string; // e.g. "Past 4 weeks" or "General / trait"
  isReverseScored: boolean;
  reverseRationale?: string;
  status: ItemStatus;
  statusRationale?: string;
  heuristicFlags: HeuristicFlag[];
  revisions: ItemRevision[];
  order: number;
  isAiSuggestion?: boolean;
}

export interface PanellistRating {
  panellistId: string;
  panellistName: string;
  expertise: string;
  itemId: string;
  relevance: 1 | 2 | 3 | 4; // 1 = Not relevant, 2 = Somewhat, 3 = Quite relevant, 4 = Highly relevant
  clarity: 1 | 2 | 3 | 4;   // 1 = Unclear, 2 = Needs major revision, 3 = Minor revision, 4 = Clear
  essentialForCVR?: boolean; // For Lawshe's CVR: Essential vs Useful vs Not necessary
  qualitativeComments?: string;
}

export interface ExpertReviewPanel {
  id: string;
  name: string;
  targetCount: number;
  description: string;
  panellists: {
    id: string;
    name: string;
    affiliation: string;
    role: string;
    submittedAt?: string;
  }[];
  ratings: PanellistRating[];
  overallComments?: { panellistId: string; comment: string; constructCoverage: string }[];
}

export interface CognitiveInterviewNote {
  id: string;
  participantCode: string;
  itemId: string;
  paraphrasedMeaning: string;
  retrievalStrategy: string;
  judgmentDifficulty: 'easy' | 'moderate' | 'difficult';
  responseMappingDifficulty: string;
  unclearTerms: string[];
  recommendedRevision?: string;
  timestamp: string;
}

export interface ValidationHypothesis {
  id: string;
  constructTarget: string; // e.g. "Team Psychological Safety"
  externalConstruct: string; // e.g. "Team Learning Behavior" or "Employee Silence"
  type: 'convergent' | 'discriminant' | 'criterion_concurrent' | 'criterion_predictive' | 'known_groups';
  predictedDirection: 'positive' | 'negative' | 'null_or_low';
  predictedMagnitude?: string; // e.g. "Moderate to high (r >= .40)"
  rationale: string;
  empiricalResult?: {
    observedValue: number;
    statisticType: 'r' | 'beta' | 'd' | 'HTMT';
    pValue?: number;
    interpretation: string;
    supportsHypothesis: boolean;
  };
}

export interface SurveyQuestion {
  id: string;
  itemId?: string; // Links to stable ScaleItem.id if it's a scale item
  type: 'scale_item' | 'demographic' | 'external_criterion' | 'screening' | 'free_text' | 'attention_check';
  prompt: string;
  helpText?: string;
  required: boolean;
  allowPreferNotToAnswer?: boolean;
  responseFormat: ResponseFormatType | 'single_choice' | 'multiple_choice' | 'text' | 'number';
  options?: { value: string | number; label: string }[];
  isSensitive?: boolean;
  sectionId: string;
  order: number;
}

export interface SurveySection {
  id: string;
  title: string;
  instructions: string;
  randomizeItemOrder?: boolean;
}

export interface SurveyVersion {
  versionNumber: number;
  createdAt: string;
  frozenAt?: string;
  isFrozen: boolean;
  purpose: 'expert_review' | 'pilot_study' | 'main_development_study' | 'independent_validation_study' | 'test_retest_followup';
  title: string;
  infoSheetText: string;
  consentStatementText: string;
  sections: SurveySection[];
  questions: SurveyQuestion[];
  administeredItemIds: string[]; // List of ScaleItem IDs at this freeze
  itemWordingsSnapshot: Record<string, string>; // ItemId -> wording at time of freeze
}

export interface ParticipantSubmission {
  id: string;
  surveyId: string;
  surveyVersionNumber: number;
  purpose: SurveyVersion['purpose'];
  submittedAt: string;
  durationSeconds: number;
  participantCode?: string; // Pseudonymous code for test-retest
  cohort?: string;
  wave?: number; // 1 or 2
  answers: Record<string, number | string | string[]>; // questionId or itemId -> response
  isQualityFlagged: boolean;
  qualityFlags: string[]; // e.g. 'speeding', 'straightlining'
  isTestSubmission?: boolean;
}

export interface DatasetSnapshot {
  id: string;
  name: string;
  createdAt: string;
  purpose: SurveyVersion['purpose'];
  surveyVersionNumber: number;
  sampleSize: number;
  columns: string[]; // e.g. ['id', 'duration', 'WPSS_01', 'WPSS_02', ...]
  itemColumns: string[]; // Sub-list of columns that are scale items
  rawRows: Record<string, any>[];
  scoredRows: Record<string, any>[]; // After reverse-coding and cleaning
  reverseCodedColumns: string[];
  missingDataImputation: 'none_listwise' | 'pairwise' | 'mean_imputation';
  notes: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  stepNumber: number;
  stageName: string;
  decisionType: 'item_exclusion' | 'item_revision' | 'dimension_adjustment' | 'factor_retention' | 'model_respecification' | 'sample_exclusion' | 'methodological_divergence';
  title: string;
  rationalSummary: string;
  methodologicalJustification: string;
  impactedItemIds?: string[];
  evidenceReference?: string; // e.g. "I-CVI = 0.50 below threshold" or "Cross-loading = 0.42 on Factor 2"
  author: string;
}

export interface AnalysisRun {
  id: string;
  type: 'cvi_analysis' | 'pilot_descriptives' | 'efa' | 'cfa' | 'reliability_validity' | 'test_retest';
  timestamp: string;
  snapshotId: string;
  sampleSize: number;
  settings: Record<string, any>;
  isOutdated: boolean;
  outdatedReason?: string;
  results: Record<string, any>;
  warnings: string[];
}

export interface ScaleProject {
  id: string;
  title: string;
  description: string;
  discipline: ScaleCategory;
  intendedConstruct: string;
  targetPopulation: string;
  administrationLanguage: string;
  intendedInterpretation: string;
  scaleType: ScaleType;
  measurementModel: MeasurementModelType;
  measurementModelJustification: string;
  
  // Existing instrument search audit
  existingInstrumentsReviewed: {
    name: string;
    citation: string;
    whyInsufficient: string;
    doi?: string;
  }[];

  // Adaptation pathway (if scaleType === 'adaptation')
  adaptationDetails?: {
    originalScaleName: string;
    originalCitation: string;
    permissionObtained: boolean;
    permissionDetails: string;
    translationProtocol: string; // e.g. "Forward-backward translation by 2 independent bilingual experts"
    culturalAdaptationSteps: string;
    originalDoi?: string;
  };

  // Step 2: Construct Definition
  constructDefinition: {
    conceptualDefinition: string;
    theoreticalFramework: string;
    supportingLiterature: { citation: string; keyProposition: string; doi?: string }[];
    includedAspects: string[];
    excludedAspects: string[];
    relatedConstructsDiscriminant: { constructName: string; distinctionRationale: string }[];
  };

  dimensions: Dimension[];
  items: ScaleItem[];
  expertPanels: ExpertReviewPanel[];
  cognitiveInterviews: CognitiveInterviewNote[];
  validationHypotheses: ValidationHypothesis[];
  surveyVersions: SurveyVersion[];
  currentSurveyVersionNumber: number;
  isCollectionOpen: boolean;
  collectionSettings: {
    allowAnonymous: boolean;
    requirePseudonymCode: boolean;
    responseCap?: number;
    closingDate?: string;
    completionMessage: string;
    saveAndResumeAllowed: boolean;
  };

  submissions: ParticipantSubmission[];
  datasetSnapshots: DatasetSnapshot[];
  analysisRuns: AnalysisRun[];
  decisionLog: DecisionLogEntry[];

  // Methodological tracking
  workflowStepStatuses: Record<number, {
    isCompleted: boolean;
    isEvidenceSufficient: boolean;
    notes: string;
  }>;

  createdAt: string;
  updatedAt: string;
  isDemoProject?: boolean;
}
