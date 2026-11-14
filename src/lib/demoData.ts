import { ScaleProject, ScaleItem, Dimension, ExpertReviewPanel, CognitiveInterviewNote, ValidationHypothesis, SurveyVersion, DatasetSnapshot, DecisionLogEntry, AnalysisRun, ParticipantSubmission } from '../types/scale';

// Generate synthetic but realistic Likert data for WPSS dimensions
// Dimension 1 (Voice Safety): WPSS_01, WPSS_02, WPSS_03, WPSS_04
// Dimension 2 (Error Tolerance): WPSS_05, WPSS_06 (rev), WPSS_07, WPSS_08
// Dimension 3 (Support & Inclusion): WPSS_09, WPSS_10, WPSS_11, WPSS_12 (rev)
export function generateSyntheticDataset(
  n: number,
  prefix: string,
  wave = 1,
  seed = 42
): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  let s = seed;
  const pseudoRand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const sampleNormal = (mean = 0, sd = 1) => {
    const u1 = Math.max(1e-9, pseudoRand());
    const u2 = pseudoRand();
    return mean + sd * Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  const clampLikert = (val: number, min = 1, max = 5) => {
    return Math.max(min, Math.min(max, Math.round(val)));
  };

  for (let i = 1; i <= n; i++) {
    // Latent traits
    const thetaGeneral = sampleNormal(0, 0.9);
    const thetaVS = 0.7 * thetaGeneral + sampleNormal(0, 0.6); // Voice safety
    const thetaET = 0.65 * thetaGeneral + sampleNormal(0, 0.65); // Error tolerance
    const thetaSI = 0.72 * thetaGeneral + sampleNormal(0, 0.55); // Support & inclusion

    // Criterion variables for validation hypotheses
    const teamLearning = clampLikert(3.5 + 0.6 * thetaGeneral + sampleNormal(0, 0.55));
    const impressionManagement = clampLikert(2.8 + 0.15 * thetaGeneral + sampleNormal(0, 0.9));
    const employeeSilence = clampLikert(3.2 - 0.55 * thetaGeneral + sampleNormal(0, 0.6));

    const participantCode = `P-${String(i).padStart(4, '0')}`;

    // Item responses (5-point Likert: 1=Strongly Disagree to 5=Strongly Agree)
    // WPSS_06 and WPSS_12 are reverse-scored raw items (5 = high fear/disagreement)
    const row: Record<string, any> = {
      id: `${prefix}-${i}`,
      participantCode,
      wave,
      durationSeconds: Math.round(180 + pseudoRand() * 240),
      isQualityFlagged: false,
      // Voice Safety
      WPSS_01: clampLikert(3.6 + 0.85 * thetaVS + sampleNormal(0, 0.45)),
      WPSS_02: clampLikert(3.5 + 0.82 * thetaVS + sampleNormal(0, 0.48)),
      WPSS_03: clampLikert(3.7 + 0.88 * thetaVS + sampleNormal(0, 0.42)),
      WPSS_04: clampLikert(3.4 + 0.79 * thetaVS + sampleNormal(0, 0.50)),
      // Error Tolerance & Learning
      WPSS_05: clampLikert(3.5 + 0.80 * thetaET + sampleNormal(0, 0.46)),
      WPSS_06: clampLikert(3.2 - 0.78 * thetaET + sampleNormal(0, 0.49)), // Raw reverse item: "Mistakes are held against you"
      WPSS_07: clampLikert(3.6 + 0.83 * thetaET + sampleNormal(0, 0.44)),
      WPSS_08: clampLikert(3.4 + 0.76 * thetaET + sampleNormal(0, 0.52)),
      // Support & Inclusion
      WPSS_09: clampLikert(3.8 + 0.84 * thetaSI + sampleNormal(0, 0.43)),
      WPSS_10: clampLikert(3.9 + 0.86 * thetaSI + sampleNormal(0, 0.41)),
      WPSS_11: clampLikert(3.7 + 0.81 * thetaSI + sampleNormal(0, 0.47)),
      WPSS_12: clampLikert(3.0 - 0.75 * thetaSI + sampleNormal(0, 0.51)), // Raw reverse item: "People reject those who are different"
      // Validation criteria
      teamLearning,
      impressionManagement,
      employeeSilence,
    };

    rows.push(row);
  }

  return rows;
}

// Convert raw rows to scored rows (reverse scoring 6-val on 5-point scale)
export function scoreRows(rows: Record<string, any>[], reverseKeys: string[], maxScale = 5): Record<string, any>[] {
  return rows.map(r => {
    const scored = { ...r };
    for (const k of reverseKeys) {
      if (typeof scored[k] === 'number') {
        scored[k] = (maxScale + 1) - scored[k];
      }
    }
    return scored;
  });
}

export function createDemoProject(): ScaleProject {
  const dimensions: Dimension[] = [
    {
      id: 'dim-vs',
      name: 'Voice & Dissent Safety',
      code: 'VS',
      description: 'The shared belief that expressing candid disagreement, asking challenging questions, and raising constructive critique will not lead to personal penalties or humiliation.',
      includedAspects: 'Speaking up about team workflow issues, questioning prevailing group consensus, voicing dissenting views.',
      excludedAspects: 'General extroversion, interpersonal chattiness, aggressive confrontation.',
      itemCountTarget: 4,
    },
    {
      id: 'dim-et',
      name: 'Error Tolerance & Learning',
      code: 'ET',
      description: 'The perception that well-intentioned mistakes and procedural slip-ups are treated as learning opportunities rather than occasions for blame, scapegoating, or punitive action.',
      includedAspects: 'Acknowledging honest errors openly, learning collectively from project missteps, absence of scapegoating.',
      excludedAspects: 'Gross negligence, tolerating intentional misconduct or violation of safety rules.',
      itemCountTarget: 4,
    },
    {
      id: 'dim-si',
      name: 'Mutual Support & Inclusion',
      code: 'SI',
      description: 'The belief that team members value one another’s unique competencies, offer mutual assistance during difficulties, and avoid undermining or rejecting colleagues.',
      includedAspects: 'Valuing diverse perspectives, reciprocal help-seeking, feeling accepted as a whole person.',
      excludedAspects: 'Superficial friendliness, social popularity, off-work social cohesion.',
      itemCountTarget: 4,
    },
  ];

  const items: ScaleItem[] = [
    {
      id: 'WPSS-01',
      wording: 'I feel comfortable raising difficult issues and questions during team meetings.',
      dimensionId: 'dim-vs',
      sourceOrRationale: 'Deductive derivation from Edmondson (1999) voice safety definition and qualitative pilot themes.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 1,
      heuristicFlags: [],
      revisions: [
        {
          id: 'rev-01-1',
          timestamp: '2026-09-02T10:14:00Z',
          previousWording: 'I can speak up about problems without fear.',
          newWording: 'I feel comfortable raising difficult issues and questions during team meetings.',
          rationale: 'Specified behavioral context (team meetings) following cognitive interview feedback indicating ambiguity.',
          author: 'Lead Researcher',
        },
      ],
    },
    {
      id: 'WPSS-02',
      wording: 'In this team, it is acceptable to express disagreement with established opinions.',
      dimensionId: 'dim-vs',
      sourceOrRationale: 'Clark & Watson (2019) domain sampling for dissent tolerance.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 2,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-03',
      wording: 'I can challenge popular ideas on this team without worrying about being marginalized.',
      dimensionId: 'dim-vs',
      sourceOrRationale: 'Synthesized from focus group interviews with cross-functional project teams.',
      generationMethod: 'inductive_qualitative',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 3,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-04',
      wording: 'Team members actively encourage colleagues to share unconventional perspectives.',
      dimensionId: 'dim-vs',
      sourceOrRationale: 'Churchill (1979) proactive voice domain coverage.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 4,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-05',
      wording: 'When someone on this team makes an honest mistake, it is treated as a learning opportunity.',
      dimensionId: 'dim-et',
      sourceOrRationale: 'Adapted from organizational learning climate literature (Edmondson, 1999).',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 5,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-06',
      wording: 'Mistakes made during work are frequently held against you by team members.',
      dimensionId: 'dim-et',
      sourceOrRationale: 'Reverse-scored indicator capturing punitive blame culture.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: true,
      reverseRationale: 'Captures direct interpersonal threat and retaliatory blame; scored reversely so high scores reflect safety.',
      status: 'retained',
      order: 6,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-07',
      wording: 'Team members freely admit their procedural errors without fearing ridicule.',
      dimensionId: 'dim-et',
      sourceOrRationale: 'Grounded in psychological safety error transparency dimensions.',
      generationMethod: 'inductive_qualitative',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 7,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-08',
      wording: 'Our team focuses on resolving issues rather than assigning personal blame.',
      dimensionId: 'dim-et',
      sourceOrRationale: 'Hinkin (1998) guideline for clear behavioral referents.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 8,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-09',
      wording: 'My team members value and utilize the unique skills that each person brings.',
      dimensionId: 'dim-si',
      sourceOrRationale: 'Construct coverage for perceived team member valuation.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 9,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-10',
      wording: 'It is easy to ask colleagues on this team for help when encountering a roadblock.',
      dimensionId: 'dim-si',
      sourceOrRationale: 'Derived from vulnerability disclosure indicators (Edmondson 1999).',
      generationMethod: 'inductive_qualitative',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 10,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-11',
      wording: 'Members of this team genuinely support one another during high-pressure periods.',
      dimensionId: 'dim-si',
      sourceOrRationale: 'Clark & Watson (2019) inclusion/support facet.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'retained',
      order: 11,
      heuristicFlags: [],
      revisions: [],
    },
    {
      id: 'WPSS-12',
      wording: 'People in this team sometimes reject colleagues who think or act differently.',
      dimensionId: 'dim-si',
      sourceOrRationale: 'Reverse-scored indicator capturing social ostracism/exclusion.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: true,
      reverseRationale: 'Captures social rejection; inverted during scoring so high values indicate high mutual inclusion.',
      status: 'retained',
      order: 12,
      heuristicFlags: [],
      revisions: [],
    },
    // Excluded items showing methodological rigor
    {
      id: 'WPSS-13',
      wording: 'I feel comfortable asking questions and requesting promotions from team leadership.',
      dimensionId: 'dim-vs',
      sourceOrRationale: 'Initial candidate item generated during brainstorming.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'removed',
      statusRationale: 'Removed following expert review and cognitive testing: double-barrelled prompt conflating routine questions with career advancement requests (I-CVI = 0.50).',
      order: 13,
      heuristicFlags: [
        {
          type: 'double_barrelled',
          severity: 'warning',
          message: 'Item combines two distinct inquiries ("asking questions" vs "requesting promotions").',
          suggestion: 'Separate into distinct questions or eliminate career advancement inquiry.',
        },
      ],
      revisions: [],
    },
    {
      id: 'WPSS-14',
      wording: 'No one on this team ever makes mistakes or experiences project failure.',
      dimensionId: 'dim-et',
      sourceOrRationale: 'Initial candidate item tested for negative contrast.',
      generationMethod: 'deductive_literature',
      responseFormat: 'likert_5',
      isReverseScored: false,
      status: 'removed',
      statusRationale: 'Removed due to extreme absolute wording ("never") causing ceiling/floor distortion and theoretical mismatch with psychological safety concept.',
      order: 14,
      heuristicFlags: [
        {
          type: 'extreme_wording',
          severity: 'warning',
          message: 'Absolute qualifier "never" distorts variance and reduces item discrimination.',
        },
      ],
      revisions: [],
    },
  ];

  // 6 Expert Panellists
  const expertPanels: ExpertReviewPanel[] = [
    {
      id: 'panel-01',
      name: 'Content Validity Panel (Psychometrics & Org Psych)',
      targetCount: 6,
      description: 'Expert evaluation of item relevance, linguistic clarity, and construct coverage in organizational teams.',
      panellists: [
        { id: 'exp-1', name: 'Prof. Sarah Jenkins, PhD', affiliation: 'Institute for Work Psychology', role: 'Professor of Organizational Behavior', submittedAt: '2026-09-08T14:20:00Z' },
        { id: 'exp-2', name: 'Dr. Marcus Thorne', affiliation: 'Center for Measurement & Psychometrics', role: 'Senior Psychometrician', submittedAt: '2026-09-09T09:15:00Z' },
        { id: 'exp-3', name: 'Dr. Elena Rostova', affiliation: 'Department of Psychology', role: 'Associate Professor', submittedAt: '2026-09-10T11:45:00Z' },
        { id: 'exp-4', name: 'Prof. David Chen', affiliation: 'School of Management', role: 'Team Dynamics Specialist', submittedAt: '2026-09-11T16:00:00Z' },
        { id: 'exp-5', name: 'Dr. Amira Patel', affiliation: 'Health Care Systems Research Group', role: 'Safety Culture Lead', submittedAt: '2026-09-12T13:30:00Z' },
        { id: 'exp-6', name: 'Dr. Thomas Lindqvist', affiliation: 'Behavioral Sciences Institute', role: 'Survey Methodology Specialist', submittedAt: '2026-09-13T10:00:00Z' },
      ],
      ratings: [
        // WPSS-01 (All 4s)
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-01', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-01', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-01', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-01', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-01', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-01', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-02
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-02', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-02', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-02', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-02', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-02', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-02', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-03
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-03', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-03', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-03', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-03', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-03', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-03', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-04
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-04', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-04', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-04', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-04', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-04', relevance: 3, clarity: 4, essentialForCVR: false },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-04', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-05
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-05', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-06 (Reverse item - high relevance, clarity minor note)
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-06', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-06', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-06', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-06', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-06', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-06', relevance: 4, clarity: 3, essentialForCVR: true },

        // WPSS-07
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-07', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-07', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-07', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-07', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-07', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-07', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-08
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-08', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-08', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-08', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-08', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-08', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-08', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-09
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-09', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-09', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-09', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-09', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-09', relevance: 3, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-09', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-10
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-10', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-11
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-11', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-11', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-11', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-11', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-11', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-11', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-12
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-12', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-12', relevance: 4, clarity: 3, essentialForCVR: true },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-12', relevance: 3, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-12', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-12', relevance: 4, clarity: 4, essentialForCVR: true },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-12', relevance: 4, clarity: 4, essentialForCVR: true },

        // WPSS-13 (Low relevance 2s and 1s - candidate for exclusion)
        { panellistId: 'exp-1', panellistName: 'Prof. Jenkins', expertise: 'Org Behavior', itemId: 'WPSS-13', relevance: 2, clarity: 2, essentialForCVR: false, qualitativeComments: 'Conflates psychological safety with formal promotional negotiations.' },
        { panellistId: 'exp-2', panellistName: 'Dr. Thorne', expertise: 'Psychometrics', itemId: 'WPSS-13', relevance: 1, clarity: 2, essentialForCVR: false, qualitativeComments: 'Classic double-barrelled statement.' },
        { panellistId: 'exp-3', panellistName: 'Dr. Rostova', expertise: 'Psychology', itemId: 'WPSS-13', relevance: 2, clarity: 2, essentialForCVR: false },
        { panellistId: 'exp-4', panellistName: 'Prof. Chen', expertise: 'Team Dynamics', itemId: 'WPSS-13', relevance: 2, clarity: 3, essentialForCVR: false },
        { panellistId: 'exp-5', panellistName: 'Dr. Patel', expertise: 'Safety Culture', itemId: 'WPSS-13', relevance: 3, clarity: 2, essentialForCVR: false },
        { panellistId: 'exp-6', panellistName: 'Dr. Lindqvist', expertise: 'Survey Methodology', itemId: 'WPSS-13', relevance: 2, clarity: 2, essentialForCVR: false },
      ],
      overallComments: [
        { panellistId: 'exp-1', comment: 'Strong theoretical alignment with Edmondson’s foundational conceptualization. The 3 proposed dimensions cover the core operational facets cleanly.', constructCoverage: 'Comprehensive' },
        { panellistId: 'exp-2', comment: 'Recommend deleting WPSS-13 as it violates psychometric single-idea rules. All other 12 items demonstrate high content clarity.', constructCoverage: 'Excellent' },
      ],
    },
  ];

  // Cognitive interviews
  const cognitiveInterviews: CognitiveInterviewNote[] = [
    {
      id: 'cog-01',
      participantCode: 'COG-P1 (Senior Software Engineer)',
      itemId: 'WPSS-01',
      paraphrasedMeaning: 'Understood as feeling secure when questioning the team sprint priorities or calling out code architecture flaws.',
      retrievalStrategy: 'Recalled specific team retrospectives from last month.',
      judgmentDifficulty: 'easy',
      responseMappingDifficulty: 'No difficulty mapping to 5-point scale.',
      unclearTerms: [],
      timestamp: '2026-09-14T10:00:00Z',
    },
    {
      id: 'cog-02',
      participantCode: 'COG-P2 (Clinical Research Nurse)',
      itemId: 'WPSS-06',
      paraphrasedMeaning: 'Understood as whether reporting a near-miss or medication logging delay leads to informal punishment or disciplinary threats.',
      retrievalStrategy: 'Reflected on unit incident reporting policies.',
      judgmentDifficulty: 'easy',
      responseMappingDifficulty: 'Noted that this item is reversed compared to others, but easily comprehensible.',
      unclearTerms: [],
      timestamp: '2026-09-14T14:30:00Z',
    },
    {
      id: 'cog-03',
      participantCode: 'COG-P3 (Secondary School Teacher)',
      itemId: 'WPSS-13',
      paraphrasedMeaning: 'Confused between asking advice on lesson plans versus demanding salary increases from the principal.',
      retrievalStrategy: 'Expressed hesitation: "Those are two completely different things in our school."',
      judgmentDifficulty: 'difficult',
      responseMappingDifficulty: 'Could not choose a single rating.',
      unclearTerms: ['requesting promotions'],
      recommendedRevision: 'Drop item or eliminate promotion reference.',
      timestamp: '2026-09-15T11:00:00Z',
    },
  ];

  // Validation hypotheses
  const validationHypotheses: ValidationHypothesis[] = [
    {
      id: 'hyp-1',
      constructTarget: 'Workplace Psychological Safety',
      externalConstruct: 'Team Learning Behavior',
      type: 'convergent',
      predictedDirection: 'positive',
      predictedMagnitude: 'Moderate to high (r >= .45)',
      rationale: 'Edmondson (1999) theoretical model establishes psychological safety as the primary psychological antecedent enabling teams to engage in collective experimentation, error analysis, and feedback-seeking.',
      empiricalResult: {
        observedValue: 0.58,
        statisticType: 'r',
        pValue: 0.0001,
        interpretation: 'Strong positive correlation supporting convergent construct validity (r = .58, p < .001).',
        supportsHypothesis: true,
      },
    },
    {
      id: 'hyp-2',
      constructTarget: 'Workplace Psychological Safety',
      externalConstruct: 'Impression Management (Social Desirability)',
      type: 'discriminant',
      predictedDirection: 'null_or_low',
      predictedMagnitude: 'Low or negligible (|r| <= .30)',
      rationale: 'Psychological safety is a climate-level shared belief, not an individual self-enhancement or response bias trait. Correlation with social desirability scales should be negligible.',
      empiricalResult: {
        observedValue: 0.16,
        statisticType: 'r',
        pValue: 0.038,
        interpretation: 'Weak, non-consequential correlation (|r| = .16 <= .30) supporting discriminant divergence from response bias.',
        supportsHypothesis: true,
      },
    },
    {
      id: 'hyp-3',
      constructTarget: 'Workplace Psychological Safety',
      externalConstruct: 'Employee Silence',
      type: 'criterion_concurrent',
      predictedDirection: 'negative',
      predictedMagnitude: 'Moderate to high negative (r <= -.40)',
      rationale: 'Higher climate safety should substantially reduce intentional withholding of critical ideas, feedback, or error disclosures (Detert & Edmondson, 2011).',
      empiricalResult: {
        observedValue: -0.54,
        statisticType: 'r',
        pValue: 0.0001,
        interpretation: 'Significant negative concurrent criterion correlation (r = -.54, p < .001) as hypothesized.',
        supportsHypothesis: true,
      },
    },
  ];

  // Survey Versions (Frozen historical V1 and active V2)
  const surveyVersions: SurveyVersion[] = [
    {
      versionNumber: 1,
      createdAt: '2026-09-18T10:00:00Z',
      frozenAt: '2026-09-18T12:00:00Z',
      isFrozen: true,
      purpose: 'pilot_study',
      title: 'Workplace Team Dynamics Pilot Survey (V1)',
      infoSheetText: 'This pilot questionnaire tests preliminary item wording on team interpersonal dynamics and communication patterns.',
      consentStatementText: 'I voluntarily consent to take part in this pilot scale evaluation. I understand my responses are anonymous.',
      sections: [
        {
          id: 'sec-v1-items',
          title: 'Workplace Communication and Team Climate',
          instructions: 'Please indicate your level of agreement with each of the following statements regarding your primary work team.',
          randomizeItemOrder: false,
        },
      ],
      questions: items.map((it, idx) => ({
        id: `q-v1-${it.id}`,
        itemId: it.id,
        type: 'scale_item',
        prompt: it.wording,
        required: true,
        responseFormat: 'likert_5',
        sectionId: 'sec-v1-items',
        order: idx + 1,
      })),
      administeredItemIds: items.map(i => i.id),
      itemWordingsSnapshot: items.reduce((acc, i) => ({ ...acc, [i.id]: i.wording }), {}),
    },
    {
      versionNumber: 2,
      createdAt: '2026-09-25T09:00:00Z',
      frozenAt: '2026-09-25T11:00:00Z',
      isFrozen: true,
      purpose: 'main_development_study',
      title: 'Workplace Psychological Safety Scale (WPSS) - Main Research Survey (V2)',
      infoSheetText: 'You are invited to participate in a research study on team psychological climate, learning practices, and communication patterns. The study takes approximately 5 minutes. No personally identifiable details are collected without explicit permission.',
      consentStatementText: 'I confirm that I have read the study information sheet. I consent freely to participate and understand that aggregated findings may be published in scholarly research.',
      sections: [
        {
          id: 'sec-screener',
          title: 'Eligibility & Primary Work Context',
          instructions: 'Please answer these brief qualifying questions about your current professional role.',
        },
        {
          id: 'sec-scale',
          title: 'Team Interpersonal Climate',
          instructions: 'Think of your primary day-to-day team. Rate how strongly you agree or disagree with each statement on the 1 to 5 scale.',
          randomizeItemOrder: true,
        },
        {
          id: 'sec-validation',
          title: 'Team Practices & Communication Patterns',
          instructions: 'These additional questions help us evaluate how team climate relates to work outcomes.',
        },
      ],
      questions: [
        {
          id: 'q-role',
          type: 'demographic',
          prompt: 'Which best describes your role in your team?',
          required: true,
          responseFormat: 'single_choice',
          options: [
            { value: 'individual_contributor', label: 'Individual Contributor / Specialist' },
            { value: 'team_lead', label: 'Team Lead / Project Manager' },
            { value: 'department_manager', label: 'Department / Unit Head' },
            { value: 'other', label: 'Other' },
          ],
          sectionId: 'sec-screener',
          order: 1,
        },
        // Only the 12 retained items are in Survey V2
        ...items.filter(i => i.status === 'retained').map((it, idx) => ({
          id: `q-v2-${it.id}`,
          itemId: it.id,
          type: 'scale_item' as const,
          prompt: it.wording,
          helpText: it.isReverseScored ? 'Notice reverse phrasing.' : undefined,
          required: true,
          responseFormat: 'likert_5' as const,
          sectionId: 'sec-scale',
          order: idx + 2,
        })),
        {
          id: 'q-crit-learning',
          type: 'external_criterion',
          prompt: 'Our team regularly takes time to reflect on what we did well and what can be improved (Team Learning Behavior).',
          required: true,
          responseFormat: 'likert_5',
          sectionId: 'sec-validation',
          order: 14,
        },
        {
          id: 'q-crit-silence',
          type: 'external_criterion',
          prompt: 'At times, I choose to remain silent on issues rather than raise concerns with my team (Employee Silence).',
          required: true,
          responseFormat: 'likert_5',
          sectionId: 'sec-validation',
          order: 15,
        },
      ],
      administeredItemIds: items.filter(i => i.status === 'retained').map(i => i.id),
      itemWordingsSnapshot: items.filter(i => i.status === 'retained').reduce((acc, i) => ({ ...acc, [i.id]: i.wording }), {}),
    },
  ];

  // Generate synthetic data
  const rawPilotRows = generateSyntheticDataset(30, 'pilot', 1, 101);
  const rawEfaRows = generateSyntheticDataset(200, 'efa', 1, 202);
  const rawCfaRows = generateSyntheticDataset(220, 'cfa-valid', 1, 303);
  const rawTestRetestRows = generateSyntheticDataset(45, 'retest', 2, 404);

  const reverseKeys = ['WPSS_06', 'WPSS_12'];
  const scoredPilotRows = scoreRows(rawPilotRows, reverseKeys);
  const scoredEfaRows = scoreRows(rawEfaRows, reverseKeys);
  const scoredCfaRows = scoreRows(rawCfaRows, reverseKeys);
  const scoredTestRetestRows = scoreRows(rawTestRetestRows, reverseKeys);

  const itemCols = ['WPSS_01', 'WPSS_02', 'WPSS_03', 'WPSS_04', 'WPSS_05', 'WPSS_06', 'WPSS_07', 'WPSS_08', 'WPSS_09', 'WPSS_10', 'WPSS_11', 'WPSS_12'];

  const datasetSnapshots: DatasetSnapshot[] = [
    {
      id: 'snap-pilot',
      name: 'Pilot Study Sample (N = 30)',
      createdAt: '2026-09-20T16:00:00Z',
      purpose: 'pilot_study',
      surveyVersionNumber: 1,
      sampleSize: 30,
      columns: ['id', 'participantCode', 'durationSeconds', ...itemCols],
      itemColumns: itemCols,
      rawRows: rawPilotRows,
      scoredRows: scoredPilotRows,
      reverseCodedColumns: reverseKeys,
      missingDataImputation: 'none_listwise',
      notes: 'Initial feasibility and distribution check on 30 knowledge workers across healthcare and tech.',
    },
    {
      id: 'snap-efa',
      name: 'Calibration Sample for EFA (N = 200)',
      createdAt: '2026-09-28T18:00:00Z',
      purpose: 'main_development_study',
      surveyVersionNumber: 2,
      sampleSize: 200,
      columns: ['id', 'participantCode', 'durationSeconds', ...itemCols, 'teamLearning', 'impressionManagement', 'employeeSilence'],
      itemColumns: itemCols,
      rawRows: rawEfaRows,
      scoredRows: scoredEfaRows,
      reverseCodedColumns: reverseKeys,
      missingDataImputation: 'none_listwise',
      notes: 'Reserved calibration split for exploratory factor structure discovery and item reduction.',
    },
    {
      id: 'snap-cfa',
      name: 'Independent Validation Sample for CFA (N = 220)',
      createdAt: '2026-10-02T14:00:00Z',
      purpose: 'independent_validation_study',
      surveyVersionNumber: 2,
      sampleSize: 220,
      columns: ['id', 'participantCode', 'durationSeconds', ...itemCols, 'teamLearning', 'impressionManagement', 'employeeSilence'],
      itemColumns: itemCols,
      rawRows: rawCfaRows,
      scoredRows: scoredCfaRows,
      reverseCodedColumns: reverseKeys,
      missingDataImputation: 'none_listwise',
      notes: 'Strictly independent holdout sample to confirm factor dimensionality without data reuse (Clark & Watson, 2019).',
    },
    {
      id: 'snap-retest',
      name: 'Test-Retest Wave 2 Follow-up Sample (N = 45)',
      createdAt: '2026-10-12T11:00:00Z',
      purpose: 'test_retest_followup',
      surveyVersionNumber: 2,
      sampleSize: 45,
      columns: ['id', 'participantCode', 'durationSeconds', ...itemCols],
      itemColumns: itemCols,
      rawRows: rawTestRetestRows,
      scoredRows: scoredTestRetestRows,
      reverseCodedColumns: reverseKeys,
      missingDataImputation: 'none_listwise',
      notes: 'Administered 14 days after Wave 1 to assess temporal stability via Intraclass Correlation Coefficient (ICC).',
    },
  ];

  // Decisions
  const decisionLog: DecisionLogEntry[] = [
    {
      id: 'dec-01',
      timestamp: '2026-09-01T09:30:00Z',
      stepNumber: 1,
      stageName: 'Project Setup',
      decisionType: 'methodological_divergence',
      title: 'New Instrument Development Justification over Existing Scales',
      rationalSummary: 'Existing scales (e.g. Edmondson 1999) were designed for cross-team aggregate comparisons and lack granular multi-dimensional coverage of psychological safety facets for modern remote and cross-functional teams.',
      methodologicalJustification: 'Complies with Churchill (1979) requirement to clearly define construct boundaries before developing a de novo measure.',
      author: 'Lead Researcher',
    },
    {
      id: 'dec-02',
      timestamp: '2026-09-03T14:15:00Z',
      stepNumber: 2,
      stageName: 'Construct Definition',
      decisionType: 'dimension_adjustment',
      title: 'Formal Specification of Reflective Measurement Model',
      rationalSummary: 'The three dimensions (Voice Safety, Error Tolerance, Support & Inclusion) are conceptualized as reflective manifestations of a common team interpersonal climate rather than formative ingredients.',
      methodologicalJustification: 'Applying factor analysis and Cronbach’s alpha is mathematically justified only under reflective specifications (Bollen & Lennox, 1991; Boateng et al., 2018).',
      author: 'Lead Researcher',
    },
    {
      id: 'dec-03',
      timestamp: '2026-09-13T16:45:00Z',
      stepNumber: 4,
      stageName: 'Expert Review',
      decisionType: 'item_exclusion',
      title: 'Exclusion of Candidate Item WPSS-13 (Double-Barrelled)',
      rationalSummary: 'Item WPSS-13 ("asking questions and requesting promotions") received an I-CVI of 0.50 (well below the 0.78 cutoff for 6 panellists). Reviewers unanimously flagged double-barrelled structure.',
      methodologicalJustification: 'Polit & Beck (2006) and Clark & Watson (1995) emphasize that double-barrelled items undermine content validity and confound latent scores.',
      impactedItemIds: ['WPSS-13'],
      evidenceReference: 'I-CVI = 0.50; Panellist consensus = 6/6 flagged',
      author: 'Lead Researcher',
    },
    {
      id: 'dec-04',
      timestamp: '2026-09-14T11:20:00Z',
      stepNumber: 5,
      stageName: 'Cognitive Pretesting',
      decisionType: 'item_revision',
      title: 'Rephrasing Item WPSS-01 for Behavioral Specificity',
      rationalSummary: 'Cognitive interview subject P1 hesitated over "without fear." Revised to "feel comfortable raising difficult issues and questions during team meetings" to anchor the question in tangible behavioral settings.',
      methodologicalJustification: 'Tourangeau, Rips & Rasinski (2000) cognitive model of survey responding indicates clear situational referents improve retrieval accuracy.',
      impactedItemIds: ['WPSS-01'],
      author: 'Lead Researcher',
    },
    {
      id: 'dec-05',
      timestamp: '2026-09-17T15:00:00Z',
      stepNumber: 6,
      stageName: 'Study Plan',
      decisionType: 'sample_exclusion',
      title: 'Split-Sample Validation Strategy Preregistered',
      rationalSummary: 'To avoid capitalization on chance, the recruited pool was formally designated for split-sample cross-validation: N=200 allocated to EFA, and an independent N=220 held out exclusively for CFA.',
      methodologicalJustification: 'Clark & Watson (2019) and Hinkin (1998) mandate testing factor structure on an independent sample rather than performing EFA and CFA on the same dataset.',
      author: 'Lead Researcher',
    },
    {
      id: 'dec-06',
      timestamp: '2026-09-29T10:00:00Z',
      stepNumber: 11,
      stageName: 'Exploratory Factor Analysis',
      decisionType: 'factor_retention',
      title: 'Extraction of 3 Correlated Factors Using Promax Oblique Rotation',
      rationalSummary: 'Horn’s Parallel Analysis and Kaiser criterion both supported a 3-factor solution explaining 62.4% of total variance. Oblique Promax rotation was selected given that psychological climate facets are theoretically correlated.',
      methodologicalJustification: 'Boateng et al. (2018) recommend oblique rotation over orthogonal Varimax when psychological dimensions are expected to correlate in the population.',
      evidenceReference: 'Eigenvalues = 4.82, 1.48, 1.18 (all exceeding parallel analysis threshold)',
      author: 'Lead Researcher',
    },
    {
      id: 'dec-07',
      timestamp: '2026-10-03T16:30:00Z',
      stepNumber: 12,
      stageName: 'Confirmatory Factor Analysis',
      decisionType: 'model_respecification',
      title: 'Confirmation of 3-Factor First-Order Correlated Model on Independent Sample',
      rationalSummary: 'The 3-factor model demonstrated excellent fit on the N=220 validation sample (CFI = .964, TLI = .952, RMSEA = .048 [90% CI: .032 - .063], SRMR = .044). No post-hoc correlated errors were introduced.',
      methodologicalJustification: 'Adhering to Hu & Bentler (1999) combinatorial fit criteria without post-hoc cherry-picking preserves confirmatory integrity.',
      evidenceReference: 'Chi-sq(51) = 82.6, p = .003, CFI = .964, RMSEA = .048',
      author: 'Lead Researcher',
    },
  ];

  // Submissions (combining some from EFA and CFA for live dashboard representation)
  const submissions: ParticipantSubmission[] = rawEfaRows.slice(0, 40).map((r, idx) => ({
    id: `sub-${r.id}`,
    surveyId: 'survey-main',
    surveyVersionNumber: 2,
    purpose: 'main_development_study',
    submittedAt: new Date(Date.now() - (40 - idx) * 3600 * 1000).toISOString(),
    durationSeconds: r.durationSeconds,
    participantCode: r.participantCode,
    answers: {
      ...r,
    },
    isQualityFlagged: false,
    qualityFlags: [],
  }));

  // Workflow step completion states
  const workflowStepStatuses: Record<number, { isCompleted: boolean; isEvidenceSufficient: boolean; notes: string }> = {
    1: { isCompleted: true, isEvidenceSufficient: true, notes: 'Project scope, target context, and rationale documented.' },
    2: { isCompleted: true, isEvidenceSufficient: true, notes: 'Construct definition and reflective dimension mapping established.' },
    3: { isCompleted: true, isEvidenceSufficient: true, notes: '14 initial candidate items generated; 12 retained with revision history.' },
    4: { isCompleted: true, isEvidenceSufficient: true, notes: '6-member expert panel completed; S-CVI/Ave = 0.92.' },
    5: { isCompleted: true, isEvidenceSufficient: true, notes: 'Cognitive interviews (N=3) conducted; item 1 reworded.' },
    6: { isCompleted: true, isEvidenceSufficient: true, notes: 'Sample size plan and validation hypotheses preregistered.' },
    7: { isCompleted: true, isEvidenceSufficient: true, notes: 'Survey V2 built, screened, and frozen.' },
    8: { isCompleted: true, isEvidenceSufficient: true, notes: 'Survey published with shareable links and QR code.' },
    9: { isCompleted: true, isEvidenceSufficient: true, notes: 'Response collection monitored; quality checks verified.' },
    10: { isCompleted: true, isEvidenceSufficient: true, notes: 'Data prepared, reverse scoring executed on WPSS-06 and WPSS-12.' },
    11: { isCompleted: true, isEvidenceSufficient: true, notes: 'EFA run on N=200 calibration sample; 3 factors extracted.' },
    12: { isCompleted: true, isEvidenceSufficient: true, notes: 'CFA confirmed on independent N=220 holdout (CFI=.964, RMSEA=.048).' },
    13: { isCompleted: true, isEvidenceSufficient: true, notes: 'Cronbach Alpha (.89), Omega (.91), AVE, HTMT, and Test-Retest ICC (.85) established.' },
    14: { isCompleted: true, isEvidenceSufficient: true, notes: 'Scoring instructions, subscale formulas, and norm bounds specified.' },
    15: { isCompleted: true, isEvidenceSufficient: true, notes: 'Academic scale development report compiled and exportable.' },
  };

  return {
    id: 'demo-wpss-project',
    title: 'Workplace Psychological Safety Scale (WPSS)',
    description: 'Development and psychometric validation of a 12-item multidimensional measure of workplace psychological safety for contemporary cross-functional work teams.',
    discipline: 'Management & Organizational Behavior',
    intendedConstruct: 'Workplace Psychological Safety',
    targetPopulation: 'Employed adults working in team-based knowledge and service settings',
    administrationLanguage: 'English',
    intendedInterpretation: 'Diagnostic and empirical assessment of team psychological safety climate to inform organizational development and research modeling.',
    scaleType: 'new_scale',
    measurementModel: 'reflective',
    measurementModelJustification: 'Psychological safety is conceptualized as an unobserved shared climate trait causing observable indicators (comfortable speaking up, error admission, mutual support). If safety increases, all indicators are expected to shift positively.',
    
    existingInstrumentsReviewed: [
      {
        name: 'Edmondson (1999) 7-Item Team Psychological Safety Scale',
        citation: 'Edmondson, A. (1999). Psychological safety and learning behavior in work teams. Administrative Science Quarterly, 44(2), 350-383.',
        doi: '10.2307/2666999',
        whyInsufficient: 'Predominantly unidimensional and concise (7 items); incorporates 3 reverse-coded items that frequently produce method-effect artifacts in EFA; does not differentiate between voice safety, error tolerance, and peer support dimensions required for granular workplace intervention diagnostics.',
      },
      {
        name: 'Brown & Leigh (1996) Psychological Safety Climate Scale',
        citation: 'Brown, S. P., & Leigh, T. W. (1996). A new look at psychological climate. Journal of Applied Psychology, 81(4), 358-368.',
        doi: '10.1037/0021-9010.81.4.358',
        whyInsufficient: 'Focuses heavily on management/supervisory flexibility and supportive management style rather than lateral peer-to-peer psychological vulnerability among team colleagues.',
      },
      {
        name: 'Liang, Farh & Farh (2012) Psychological Safety for Voice Scale',
        citation: 'Liang, J., Farh, C. I., & Farh, J. L. (2012). Psychological antecedents of promotive and prohibitive voice. Academy of Management Journal, 55(1), 71-92.',
        doi: '10.5465/amj.2010.0397',
        whyInsufficient: 'Concentrates specifically on oral speaking-up and vocal dissent; omits collaborative error reporting, asking for help, and behavioral experimentation facets.',
      },
      {
        name: 'May, Gilson & Harter (2004) Engagement Psychological Safety Scale',
        citation: 'May, D. R., Gilson, R. L., & Harter, L. M. (2004). The psychological conditions of meaningfulness, safety and availability. Journal of Occupational and Organizational Psychology, 77(1), 11-37.',
        doi: '10.1348/096317904322915892',
        whyInsufficient: 'Contains only 3 items with borderline internal consistency (alpha .71); lacks sufficient bandwidth for multi-dimensional diagnostic assessment in team contexts.',
      },
      {
        name: 'Carmeli & Gittell (2009) Relational Psychological Safety Scale',
        citation: 'Carmeli, A., & Gittell, J. H. (2009). High-quality relationships, psychological safety, and learning from failures. Journal of Organizational Behavior, 30(6), 709-729.',
        doi: '10.1002/job.562',
        whyInsufficient: 'Assumes co-located relational coordination and does not capture dissent safety or psychological safety in contemporary asynchronous digital team communication.',
      },
      {
        name: 'Clark (2020) 4 Stages of Psychological Safety Framework',
        citation: 'Clark, T. R. (2020). The 4 Stages of Psychological Safety: Defining the Path to Inclusion and Innovation. Berrett-Koehler Publishers.',
        doi: '10.5860/choice.189518',
        whyInsufficient: 'Widely used in executive coaching but originally conceptualized as a practitioner model; lacks peer-reviewed cross-cultural CFA invariance validation and published item parameters in open science repositories.',
      },
    ],

    constructDefinition: {
      conceptualDefinition: 'A shared psychological belief held by members of a work team that the team environment is safe for interpersonal risk-taking, characterized by confidence that one will not be humiliated, rejected, or blamed for speaking up with ideas, questions, concerns, or mistakes.',
      theoreticalFramework: 'Social Information Processing Theory (Salancik & Pfeffer, 1978) combined with Edmondson’s (1999) Team Psychological Safety Framework.',
      supportingLiterature: [
        { citation: 'Churchill, G. A. (1979). A paradigm for developing better measures of marketing constructs. JMR.', doi: '10.1177/002224377901600110', keyProposition: 'Requires conceptual boundary delimitation, rigorous domain sampling, and item purification.' },
        { citation: 'Clark, L. A., & Watson, D. (2019). Constructing validity: New developments in creating objective measuring instruments. Assessment.', doi: '10.1037/pas0000626', keyProposition: 'Stresses distinct factor identification and testing on independent cross-validation samples.' },
        { citation: 'Boateng, G. O., et al. (2018). Best practices for developing and validating scales. Frontiers in Public Health.', doi: '10.3389/fpubh.2018.00149', keyProposition: 'Systematizes the 9-phase scale development roadmap from item pool to invariance.' },
      ],
      includedAspects: [
        'Willingness and perceived freedom to voice constructive critique',
        'Tolerance and constructive learning orientation toward errors',
        'Perceived interpersonal acceptance and reciprocal peer assistance',
      ],
      excludedAspects: [
        'General personal extroversion or sociability',
        'Satisfaction with physical workplace environment or compensation',
        'Toleration of malicious negligence or intentional policy violations',
      ],
      relatedConstructsDiscriminant: [
        { constructName: 'Team Trust', distinctionRationale: 'Trust is expectation of benign behavior by others; psychological safety is the climate in which one feels safe to act vulnerably.' },
        { constructName: 'Impression Management', distinctionRationale: 'Deliberate individual self-presentation versus shared collective social climate.' },
        { constructName: 'Employee Silence', distinctionRationale: 'Silence is behavioral withholding; safety is the cognitive/affective perception that makes silence unnecessary.' },
      ],
    },

    dimensions,
    items,
    expertPanels,
    cognitiveInterviews,
    validationHypotheses,
    surveyVersions,
    currentSurveyVersionNumber: 2,
    isCollectionOpen: true,
    collectionSettings: {
      allowAnonymous: true,
      requirePseudonymCode: false,
      responseCap: 300,
      completionMessage: 'Thank you for contributing to the Workplace Psychological Safety Scale validation study. Your response has been securely recorded.',
      saveAndResumeAllowed: false,
    },

    submissions,
    datasetSnapshots,
    analysisRuns: [],
    decisionLog,
    workflowStepStatuses,

    createdAt: '2026-08-20T08:00:00Z',
    updatedAt: '2026-10-15T17:00:00Z',
    isDemoProject: true,
  };
}
