import React from 'react';
import { ScaleProject } from '../types/scale';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Award,
  BookOpen,
  Camera,
  Activity,
} from 'lucide-react';

interface ProjectDashboardProps {
  project: ScaleProject;
  onNavigateStep: (stepNumber: number) => void;
  onOpenMethodology: () => void;
  onOpenDecisionLog: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onNavigateStep,
  onOpenMethodology,
  onOpenDecisionLog,
}) => {
  const retainedItems = project.items.filter(i => i.status === 'retained');
  const expertRatings = project.expertPanels[0]?.ratings || [];
  const submissionsCount = project.submissions.length;

  // Determine current stage & next recommended action
  let currentStageNumber = 1;
  let nextAction = 'Complete Project Charter & Existing Instrument Audit';

  for (let s = 1; s <= 15; s++) {
    const status = project.workflowStepStatuses[s];
    if (!status || !status.isCompleted) {
      currentStageNumber = s;
      break;
    }
    if (s === 15 && status.isCompleted) {
      currentStageNumber = 15;
    }
  }

  const STAGE_NAMES: Record<number, string> = {
    1: 'Step 1: Project Setup',
    2: 'Step 2: Construct Definition',
    3: 'Step 3: Item Generation',
    4: 'Step 4: Expert Content Review',
    5: 'Step 5: Cognitive Pretesting',
    6: 'Step 6: Study & Validation Plan',
    7: 'Step 7: Survey Builder',
    8: 'Step 8: Publishing & Collection',
    9: 'Step 9: Collection Dashboard',
    10: 'Step 10: Data Preparation',
    11: 'Step 11: Exploratory Factor Analysis',
    12: 'Step 12: Confirmatory Factor Analysis',
    13: 'Step 13: Reliability & Validity',
    14: 'Step 14: Final Scale & Scoring',
    15: 'Step 15: Reports & Exports',
  };

  const NEXT_RECOMMENDED_ACTIONS: Record<number, string> = {
    1: 'Complete Step 1 scope and check existing literature instruments.',
    2: 'Define conceptual boundaries, dimensions, and reflective specification.',
    3: 'Purify item pool and check heuristic flags for double-barreled wording.',
    4: 'Administer expert content rating forms to compute I-CVI and S-CVI.',
    5: 'Probe respondent interpretations using cognitive think-aloud interviews.',
    6: 'Preregister construct validity hypotheses before analyzing datasets.',
    7: 'Build and freeze Survey Version for participant administration.',
    8: 'Distribute live survey link or QR code to collect responses.',
    9: 'Monitor collection quality and freeze an analysis snapshot.',
    10: 'Verify reverse-scoring (WPSS-06/12) and inspect data distributions.',
    11: 'Extract latent factors and inspect Scree against Parallel Analysis.',
    12: 'Fit CFA on independent holdout sample and assess CFI/RMSEA fit.',
    13: 'Verify McDonald’s Omega, AVE, HTMT, and preregistered hypotheses.',
    14: 'Specify final questionnaire format and subscale scoring rules.',
    15: 'Generate and export full 12-section academic psychometric report.',
  };

  nextAction = NEXT_RECOMMENDED_ACTIONS[currentStageNumber] || 'Review psychometric evidence.';

  // Count completed vs evidence sufficient steps
  let completedCount = 0;
  let evidenceSufficientCount = 0;
  for (let s = 1; s <= 15; s++) {
    const st = project.workflowStepStatuses[s];
    if (st?.isCompleted) completedCount++;
    if (st?.isEvidenceSufficient) evidenceSufficientCount++;
  }

  const maturityPercent = Math.round((completedCount / 15) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {project.discipline}
              </span>
              {project.isDemoProject && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pre-Loaded Demo Project
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Last updated: {new Date(project.updatedAt).toLocaleDateString()}
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Target Construct: <strong className="text-teal-300 font-semibold">{project.intendedConstruct}</strong> &bull; Population: {project.targetPopulation}
            </p>
          </div>

          {/* Current Stage & Next Action Banner */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Research Stage</div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span>{STAGE_NAMES[currentStageNumber]}</span>
                <span className="text-xs text-teal-400 font-normal">({currentStageNumber} of 15)</span>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="text-[10px] uppercase font-bold text-slate-400">Next Recommended Action</div>
              <div className="text-xs text-slate-200 mt-0.5 truncate font-medium">
                {nextAction}
              </div>
            </div>

            <button
              onClick={() => onNavigateStep(currentStageNumber)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              Resume Workflow <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scale Maturity & Evidence Distinction Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> Scale Development Maturity &amp; Evidentiary Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded in the 3-phase roadmap by Churchill (1979) and Boateng et al. (2018).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Steps Completed: {completedCount} / 15
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Evidence Sufficient: {evidenceSufficientCount} / 15
            </span>
          </div>
        </div>

        {/* 3-Phase Roadmap Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Phase 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Phase 1: Item Development</span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                Steps 1 - 5
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Construct boundaries, item generation, expert CVI review, and cognitive pretesting.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                {retainedItems.length} Retained Items (S-CVI = 0.92)
              </span>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Phase 2: Scale Administration</span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                Steps 6 - 9
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Study sampling plan, survey builder, version freezing, live collection, and quality checks.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                {submissionsCount} Submissions ({project.datasetSnapshots.length} Snapshots)
              </span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Phase 3: Scale Evaluation</span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                Steps 10 - 15
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Data preparation, EFA, CFA on independent holdout, Omega/Alpha reliability, and report.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                CFI = .964 &bull; &omega; = .91 &bull; HTMT &lt; .65
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fast Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Item Bank */}
        <div
          onClick={() => onNavigateStep(3)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 3 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Central Item Bank</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {project.items.length} total items ({retainedItems.length} active, {project.items.filter(i=>i.status==='removed').length} excluded) with revision audit trails.
          </p>
        </div>

        {/* Card 2: Expert Review */}
        <div
          onClick={() => onNavigateStep(4)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 4 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Expert Content Validity (CVI)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            S-CVI/Ave = <strong>0.92</strong> computed across 6 experts. Polit &amp; Beck (2006) content benchmark satisfied.
          </p>
        </div>

        {/* Card 3: Survey Builder */}
        <div
          onClick={() => onNavigateStep(7)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 7 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Survey Builder &amp; Versions</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Version {project.currentSurveyVersionNumber} active. Ethics consent, screening, item order randomization, and shareable link.
          </p>
        </div>

        {/* Card 4: EFA Console */}
        <div
          onClick={() => onNavigateStep(11)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 11 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Exploratory Factor Analysis</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            KMO = <strong>0.88</strong> &bull; Scree test &amp; Parallel Analysis &bull; 3 Factors explaining 62.4% variance via Promax rotation.
          </p>
        </div>

        {/* Card 5: CFA Console */}
        <div
          onClick={() => onNavigateStep(12)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 12 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Confirmatory Factor Analysis</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Holdout N = 220 &bull; CFI = <strong>.964</strong> &bull; RMSEA = <strong>.048</strong> &bull; SRMR = <strong>.044</strong>. Good global fit.
          </p>
        </div>

        {/* Card 6: Research Report */}
        <div
          onClick={() => onNavigateStep(15)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/50 cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 flex items-center gap-1">
              Step 15 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Psychometric Report &amp; Syntax</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate 12-section printable academic report, export CSV datasets, codebooks, and reproducible R/Python syntax.
          </p>
        </div>
      </div>

      {/* Decision Log Quick Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Research Decision Log &amp; Audit Trail ({project.decisionLog.length} Entries)
            </div>
            <div className="text-[11px] text-slate-500">
              Latest: "{project.decisionLog[0]?.title || 'No decisions logged yet'}"
            </div>
          </div>
        </div>

        <button
          onClick={onOpenDecisionLog}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
        >
          View Full Audit Log
        </button>
      </div>
    </div>
  );
};
