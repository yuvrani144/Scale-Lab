import React from 'react';
import { BookOpen, X, ExternalLink, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DoiBadge } from './DoiBadge';

interface MethodologyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep?: number;
  onCheckDoi?: (doi: string) => void;
}

export const METHODOLOGY_GUIDES: Record<number, {
  title: string;
  foundation: string;
  purpose: string;
  requiredInputs: string[];
  tasks: string[];
  outputs: string[];
  completionVsEvidence: string;
  commonMistakes: string[];
  citations: { author: string; year: string; title: string; quoteOrRule: string; doi?: string }[];
}> = {
  1: {
    title: 'Project Setup & Scope',
    foundation: 'Churchill (1979); Boateng et al. (2018)',
    purpose: 'Clarify the exact conceptual target, target population, and whether an existing instrument already satisfies the research question.',
    requiredInputs: ['Working title', 'Discipline', 'Target population', 'Intended use of scores (diagnostic vs predictive vs descriptive)'],
    tasks: ['Conduct systematic literature review of existing scales', 'Document why existing instruments are insufficient', 'Specify new vs adapted pathway'],
    outputs: ['Documented project charter', 'Existing instrument audit with verified DOIs'],
    completionVsEvidence: 'Completing the setup forms documents research intent; evidence sufficiency will require demonstrating that scores behave as intended in the target population.',
    commonMistakes: [
      'Developing a new scale when an existing well-validated instrument already exists.',
      'Failing to specify whether scores will be interpreted at an individual or team level.',
    ],
    citations: [
      {
        author: 'Churchill, G. A.',
        year: '1979',
        title: 'A Paradigm for Developing Better Measures of Marketing Constructs',
        doi: '10.1177/002224377901600110',
        quoteOrRule: 'The researcher must specify what is included in the definition and what is excluded.',
      },
      {
        author: 'Boateng, G. O., et al.',
        year: '2018',
        title: 'Best Practices for Developing and Validating Scales',
        doi: '10.3389/fpubh.2018.00149',
        quoteOrRule: 'Phase 1: Item Development begins with clear identification of the domain and target audience.',
      },
    ],
  },
  2: {
    title: 'Construct Definition & Boundaries',
    foundation: 'Clark & Watson (1995/2019); Churchill (1979)',
    purpose: 'Delineate clear conceptual boundaries, proposed sub-dimensions, and determine whether the measurement model is reflective or formative.',
    requiredInputs: ['Conceptual definition', 'Included/excluded boundaries', 'Theoretical framework', 'Dimension list'],
    tasks: ['Draft conceptual definition grounded in theory', 'Map dimensions and operational facets', 'Determine reflective vs formative specification'],
    outputs: ['Construct-to-dimension map', 'Discriminant boundaries against related constructs'],
    completionVsEvidence: 'A clear definition is conceptually complete, but construct validity is never established solely by definition—it is an ongoing evidentiary argument.',
    commonMistakes: [
      'Conflating reflective (effect) and formative (causal) indicators. Applying factor analysis or Cronbach’s alpha to formative items is mathematically invalid.',
      'Defining a construct too narrowly (construct under-representation) or too broadly (construct-irrelevant variance).',
    ],
    citations: [
      {
        author: 'Clark, L. A., & Watson, D.',
        year: '2019',
        title: 'Constructing Validity: New Developments in Creating Objective Measuring Instruments',
        doi: '10.1037/pas0000626',
        quoteOrRule: 'Begin with a clear, concise conceptual definition that delineates the boundaries of the construct.',
      },
      {
        author: 'Bollen, K., & Lennox, R.',
        year: '1991',
        title: 'Conventional Wisdom on Measurement: A Structural Equation Perspective',
        doi: '10.1037/0033-2909.110.2.305',
        quoteOrRule: 'In reflective models, indicators are effects of the latent construct; in formative models, indicators cause the construct.',
      },
    ],
  },
  3: {
    title: 'Item Generation & Item Bank',
    foundation: 'Hinkin (1998); Clark & Watson (1995)',
    purpose: 'Generate an initial broad item pool (typically 2-3x the target final length) using both deductive and inductive techniques, screening for psychometric flaws.',
    requiredInputs: ['Construct definition', 'Dimension definitions', 'Literature sources or qualitative interview transcripts'],
    tasks: ['Generate candidate items', 'Tag generation method (deductive vs inductive)', 'Inspect for double-barrelled, leading, or extreme wording', 'Assign stable item IDs'],
    outputs: ['Item bank with audit trail', 'Heuristic quality flags'],
    completionVsEvidence: 'Having a large item pool completes generation; evidence of content coverage requires independent expert panel review.',
    commonMistakes: [
      'Generating double-barrelled items that ask two questions in one sentence.',
      'Over-relying on reverse-scored items, which frequently create artificial methodological method factors in factor analysis.',
    ],
    citations: [
      {
        author: 'Hinkin, T. R.',
        year: '1998',
        title: 'A Brief Tutorial on the Development of Measures for Use in Survey Questionnaires',
        doi: '10.1177/109442819800100106',
        quoteOrRule: 'Items should be clear, concise, and address a single issue. The initial pool should be at least twice as large as the intended final measure.',
      },
      {
        author: 'Clark, L. A., & Watson, D.',
        year: '1995',
        title: 'Constructing Validity: Basic Issues in Objective Scale Development',
        doi: '10.1037/1040-3590.7.3.309',
        quoteOrRule: 'Systematic domain sampling is required to prevent construct under-representation.',
      },
    ],
  },
  4: {
    title: 'Expert Content Review',
    foundation: 'Lynn (1986); Polit & Beck (2006); Lawshe (1975)',
    purpose: 'Quantify content validity via independent subject-matter and psychometric expert panellists assessing relevance, clarity, and representativeness.',
    requiredInputs: ['Candidate item bank', 'Panel of 5-10 qualified domain experts'],
    tasks: ['Administer 4-point rating grid', 'Calculate Item-level CVI (I-CVI) and Scale-level CVI (S-CVI/Ave, S-CVI/UA)', 'Record researcher decision and rationale for each item'],
    outputs: ['Content validity index table', 'Purified item bank with documented retention/revision/exclusion decisions'],
    completionVsEvidence: 'High CVI shows content relevance as judged by experts, but does not prove empirical unidimensionality or structural validity.',
    commonMistakes: [
      'Automatically deleting items based on arbitrary cutoffs without qualitative consideration.',
      'Confusing CVI (proportion of experts rating 3 or 4) with Lawshe’s CVR (essential vs non-essential).',
    ],
    citations: [
      {
        author: 'Polit, D. F., & Beck, C. T.',
        year: '2006',
        title: 'The Content Validity Index: Are You Sure You Know What\'s Being Reported?',
        doi: '10.1002/nur.20147',
        quoteOrRule: 'For a panel of 6 or more experts, I-CVI should be at least 0.78, and S-CVI/Ave should be 0.90 or higher.',
      },
      {
        author: 'Lawshe, C. H.',
        year: '1975',
        title: 'A Quantitative Approach to Content Validity',
        doi: '10.1111/j.1744-6570.1975.tb01393.x',
        quoteOrRule: 'Content Validity Ratio (CVR) establishes whether more than half the panellists judge an item as essential.',
      },
    ],
  },
  11: {
    title: 'Exploratory Factor Analysis (EFA)',
    foundation: 'Clark & Watson (2019); Boateng et al. (2018); Horn (1965)',
    purpose: 'Examine latent dimensional structure on a calibration sample, extract common factors, and identify poorly performing or cross-loading items.',
    requiredInputs: ['Cleaned calibration dataset snapshot (N >= 150-200)', 'Retained items'],
    tasks: ['Check factorability (KMO >= .60, Bartlett p < .05)', 'Determine factors using Parallel Analysis and Scree Plot', 'Apply oblique rotation (Promax) if factors are correlated', 'Purify items with cross-loadings >= .32 or primary loading < .40'],
    outputs: ['Pattern matrix', 'Structure matrix', 'Factor correlations', 'Variance explained'],
    completionVsEvidence: 'Finding a clean 3-factor structure in EFA is an exploratory discovery, not confirmatory evidence. Confirmation requires testing the model on an independent holdout sample.',
    commonMistakes: [
      'Using Principal Component Analysis (PCA) instead of true common Factor Analysis (PAF). PCA mixes common and unique variance.',
      'Relying solely on Kaiser\'s criterion (eigenvalue > 1), which notoriously over-extracts factors. Always check Horn\'s Parallel Analysis.',
      'Performing EFA and CFA on the same dataset (capitalization on chance).',
    ],
    citations: [
      {
        author: 'Horn, J. L.',
        year: '1965',
        title: 'A rationale and technique for estimating the number of factors in factor analysis',
        doi: '10.1007/BF02289447',
        quoteOrRule: 'Compare empirical eigenvalues to the 95th percentile of eigenvalues from random synthetic correlation matrices.',
      },
      {
        author: 'Clark, L. A., & Watson, D.',
        year: '2019',
        title: 'Constructing Validity: New Developments',
        doi: '10.1037/pas0000626',
        quoteOrRule: 'Never use the same data to both develop and confirm a factor structure.',
      },
    ],
  },
  12: {
    title: 'Confirmatory Factor Analysis (CFA)',
    foundation: 'Hu & Bentler (1999); Boateng et al. (2018)',
    purpose: 'Test whether the hypothesized measurement model reproduces the covariance structure of an independent validation sample.',
    requiredInputs: ['Independent validation dataset snapshot', 'Specified factor-to-item mapping'],
    tasks: ['Fit measurement model', 'Examine global fit indices (CFI, TLI, RMSEA with 90% CI, SRMR)', 'Evaluate standardized loadings (> .50)'],
    outputs: ['CFA fit summary table', 'Modification indices diagnostics'],
    completionVsEvidence: 'Meeting fit thresholds indicates the model is plausible, not that it is the uniquely correct truth. Always consider competing theoretical models.',
    commonMistakes: [
      'Treating Hu & Bentler cutoffs (CFI >= .95, RMSEA <= .06) as golden universal pass/fail rules. They vary with sample size, estimators, and model complexity.',
      'Freely adding post-hoc error covariances without theoretical justification merely to improve fit.',
    ],
    citations: [
      {
        author: 'Hu, L., & Bentler, P. M.',
        year: '1999',
        title: 'Cutoff criteria for fit indexes in covariance structure analysis',
        doi: '10.1080/10705519909540118',
        quoteOrRule: 'A combination of CFI >= .95 and SRMR <= .08, or RMSEA <= .06 and SRMR <= .08, indicates acceptable model fit.',
      },
    ],
  },
  13: {
    title: 'Reliability & Construct Validity',
    foundation: 'Cronbach (1951); McDonald (1999); Henseler et al. (2015)',
    purpose: 'Quantify internal consistency (Omega & Alpha), convergent validity (AVE, CR), discriminant validity (HTMT, Fornell-Larcker), and test-retest stability.',
    requiredInputs: ['Scored validation dataset', 'Pre-formulated validity hypotheses'],
    tasks: ['Compute McDonald’s Omega total and Cronbach’s Alpha', 'Calculate AVE (>= .50) and CR (>= .70)', 'Calculate HTMT ratios (< .85)', 'Test preregistered validation hypotheses'],
    outputs: ['Multi-trait validity matrix', 'Hypothesis testing verification log'],
    completionVsEvidence: 'High alpha does NOT establish unidimensionality or validity. Alpha simply measures item covariance given test length.',
    commonMistakes: [
      'Equating Cronbach’s alpha with construct validity.',
      'Ignoring tau-equivalence assumptions when reporting alpha. McDonald’s omega total is psychometrically superior.',
    ],
    citations: [
      {
        author: 'McDonald, R. P.',
        year: '1999',
        title: 'Test Theory: A Unified Treatment',
        doi: '10.4324/9781410601087',
        quoteOrRule: 'Omega total reflects the proportion of total test variance due to all common sources of variation.',
      },
      {
        author: 'Henseler, J., et al.',
        year: '2015',
        title: 'A new criterion for assessing discriminant validity: HTMT',
        doi: '10.1007/s11747-014-0403-8',
        quoteOrRule: 'HTMT values above 0.85 indicate potential discriminant validity violations.',
      },
    ],
  },
};

export const MethodologyDrawer: React.FC<MethodologyDrawerProps> = ({
  isOpen,
  onClose,
  currentStep = 1,
  onCheckDoi,
}) => {
  if (!isOpen) return null;

  const guide = METHODOLOGY_GUIDES[currentStep] || METHODOLOGY_GUIDES[1];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-slate-100">Methodological Constitution</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 flex-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded mb-1">
            Step {currentStep} Guidance
          </div>
          <h2 className="text-xl font-bold text-slate-900">{guide.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Foundational literature: {guide.foundation}</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-1">Core Methodological Purpose</h4>
          <p className="text-slate-600 leading-relaxed">{guide.purpose}</p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Practical Tasks
          </h4>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600">
            {guide.tasks.map((t, idx) => (
              <li key={idx}><span className="text-slate-800">{t}</span></li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" /> "Step Completed" vs. "Evidence Sufficient"
          </h4>
          <p className="text-amber-800 text-xs leading-relaxed">{guide.completionVsEvidence}</p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Common Researcher Pitfalls</h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {guide.commonMistakes.map((m, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
                <span className="text-rose-500 font-bold">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Primary Methodological Citations &amp; DOIs</h4>
          <div className="space-y-3">
            {guide.citations.map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900">{c.author} ({c.year})</div>
                  {c.doi && (
                    <DoiBadge doi={c.doi} onVerify={onCheckDoi} />
                  )}
                </div>
                <div className="text-slate-600 italic text-[11px]">{c.title}</div>
                <div className="text-slate-700 border-l-2 border-teal-500 pl-2 text-[11px] bg-white/60 p-1.5 rounded-r">
                  "{c.quoteOrRule}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
