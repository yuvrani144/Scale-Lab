import React from 'react';
import { ScaleProject } from '../types/scale';
import {
  LayoutDashboard,
  Layers,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  Award,
  Globe,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'step-1'
  | 'step-2'
  | 'step-3'
  | 'step-4'
  | 'step-5'
  | 'step-6'
  | 'step-7'
  | 'step-8'
  | 'step-9'
  | 'step-10'
  | 'step-11'
  | 'step-12'
  | 'step-13'
  | 'step-14'
  | 'step-15'
  | 'items'
  | 'expert'
  | 'survey'
  | 'collection'
  | 'analysis'
  | 'decisions'
  | 'reports';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  project: ScaleProject;
}

export const WORKFLOW_STEPS = [
  { step: 1, name: 'Project Setup & Scope', phase: 1 },
  { step: 2, name: 'Construct Definition', phase: 1 },
  { step: 3, name: 'Item Generation & Bank', phase: 1 },
  { step: 4, name: 'Expert Content Review', phase: 1 },
  { step: 5, name: 'Cognitive Pretesting', phase: 1 },
  { step: 6, name: 'Study & Validation Plan', phase: 2 },
  { step: 7, name: 'Survey Builder & Freeze', phase: 2 },
  { step: 8, name: 'Publishing & Live Links', phase: 2 },
  { step: 9, name: 'Collection Dashboard', phase: 2 },
  { step: 10, name: 'Data Prep & Scored Layer', phase: 3 },
  { step: 11, name: 'Exploratory Factor Analysis', phase: 3 },
  { step: 12, name: 'Confirmatory Factor Analysis', phase: 3 },
  { step: 13, name: 'Reliability & Validity', phase: 3 },
  { step: 14, name: 'Final Scale & Scoring', phase: 3 },
  { step: 15, name: 'Reports & Exports', phase: 3 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  project,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto">
      <div className="p-4 space-y-6 flex-1 text-xs">
        {/* Main Dashboard Link */}
        <div>
          <button
            onClick={() => onSelectView('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition text-left ${
              currentView === 'dashboard'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'hover:bg-slate-800 text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Project Dashboard</span>
          </button>
        </div>

        {/* Guided 15-Step Workflow */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Guided Methodology (15 Steps)
          </div>

          <div className="space-y-0.5">
            {WORKFLOW_STEPS.map(({ step, name, phase }) => {
              const viewKey = `step-${step}` as NavView;
              const isActive = currentView === viewKey;
              const status = project.workflowStepStatuses[step];
              const isCompleted = status?.isCompleted;
              const isEvidenceSufficient = status?.isEvidenceSufficient;

              return (
                <button
                  key={step}
                  onClick={() => onSelectView(viewKey)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition group ${
                    isActive
                      ? 'bg-teal-800/80 text-white font-semibold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400 w-4">
                      {step}
                    </span>
                    <span className="truncate">{name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isEvidenceSufficient ? (
                      <span title="Evidence Sufficient" className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    ) : isCompleted ? (
                      <span title="Step Activity Completed" className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Workspace Areas */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Dedicated Workspaces
          </div>

          <button
            onClick={() => onSelectView('items')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'items' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Item Bank</span>
          </button>

          <button
            onClick={() => onSelectView('expert')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'expert' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>Expert Review Panel</span>
          </button>

          <button
            onClick={() => onSelectView('survey')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'survey' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>Survey Builder &amp; Freeze</span>
          </button>

          <button
            onClick={() => onSelectView('collection')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'collection' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>Collection &amp; Snapshots</span>
          </button>

          <button
            onClick={() => onSelectView('analysis')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'analysis' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Data &amp; Analysis Lab</span>
          </button>

          <button
            onClick={() => onSelectView('decisions')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'decisions' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Decision Log ({project.decisionLog.length})</span>
          </button>

          <button
            onClick={() => onSelectView('reports')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition ${
              currentView === 'reports' ? 'bg-teal-800/80 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>Reports &amp; Syntax</span>
          </button>
        </div>
      </div>

      {/* Footer Indicators */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Green = Evidence Sufficient</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
          <span>Teal = Activity Completed</span>
        </div>
      </div>
    </aside>
  );
};
