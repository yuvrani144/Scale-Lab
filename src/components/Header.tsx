import React from 'react';
import { ScaleProject } from '../types/scale';
import {
  Layers,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Eye,
  RotateCcw,
  Plus,
  ChevronDown,
  Search,
} from 'lucide-react';

interface HeaderProps {
  project: ScaleProject;
  projectsList: { id: string; title: string; discipline: string; isDemoProject: boolean }[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onResetDemo: () => void;
  onOpenMethodology: () => void;
  onOpenDecisionLog: () => void;
  onOpenAiAssistant: () => void;
  onOpenPreview: () => void;
  onOpenDoiChecker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projectsList,
  onSelectProject,
  onNewProject,
  onResetDemo,
  onOpenMethodology,
  onOpenDecisionLog,
  onOpenAiAssistant,
  onOpenPreview,
  onOpenDoiChecker,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Branding & Project Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-sm font-black text-sm">
              &Sigma;
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                ScaleLab
                <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-1.5 py-0.2 rounded border border-teal-800">
                  PSYCHOMETRICS
                </span>
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Project Dropdown */}
          <div className="relative group hidden sm:block">
            <select
              value={project.id}
              onChange={e => {
                if (e.target.value === '__new__') onNewProject();
                else onSelectProject(e.target.value);
              }}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer max-w-[260px] truncate"
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.isDemoProject ? '(Demo)' : ''}
                </option>
              ))}
              <option value="__new__">+ Create New Scale Project...</option>
            </select>
          </div>
        </div>

        {/* Right: Quick Action Tools */}
        <div className="flex items-center gap-2">
          {project.isDemoProject && (
            <button
              onClick={onResetDemo}
              title="Reset demo project to pristine synthetic state"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          )}

          {/* Survey Preview Button */}
          <button
            onClick={onOpenPreview}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            title="Preview survey as a participant"
          >
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">Test Survey</span>
          </button>

          {/* Decision Log Modal Trigger */}
          <button
            onClick={onOpenDecisionLog}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition relative"
            title="Open research decision log & audit trail"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden lg:inline">Decision Log</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-teal-900 text-teal-300 rounded font-bold border border-teal-700">
              {project.decisionLog.length}
            </span>
          </button>

          {/* Methodology Constitution Drawer Trigger */}
          <button
            onClick={onOpenMethodology}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            title="View Churchill, Clark & Watson, and Boateng methodological guidelines"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden lg:inline">Methodology</span>
          </button>

          {/* Reference & DOI Checker Trigger */}
          {onOpenDoiChecker && (
            <button
              onClick={onOpenDoiChecker}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              title="Verify any academic reference, citation, or DOI via CrossRef registry"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Check DOI</span>
            </button>
          )}

          {/* Cognitive Partner Drawer Trigger */}
          <button
            onClick={onOpenAiAssistant}
            className="px-3 py-1.5 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition border border-teal-500/30"
            title="Open Psychometric Cognitive Partner for methodology sparring and literature audits"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>Cognitive Partner</span>
          </button>
        </div>
      </div>
    </header>
  );
};
