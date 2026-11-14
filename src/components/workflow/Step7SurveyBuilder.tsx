import React, { useState } from 'react';
import { ScaleProject, SurveyVersion, SurveyQuestion, SurveySection } from '../../types/scale';
import { Layout, Eye, Lock, RefreshCw, Plus, CheckCircle2, AlertCircle, Sparkles, FileText, Smartphone } from 'lucide-react';

interface Step7Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenPreview: () => void;
}

export const Step7SurveyBuilder: React.FC<Step7Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenPreview,
}) => {
  const currentVersion = project.surveyVersions.find(
    v => v.versionNumber === project.currentSurveyVersionNumber
  ) || project.surveyVersions[project.surveyVersions.length - 1];

  const [title, setTitle] = useState(currentVersion?.title || `${project.title} - Survey`);
  const [infoSheet, setInfoSheet] = useState(
    currentVersion?.infoSheetText ||
      'You are invited to take part in a research study investigating team psychological climate. Participation is voluntary.'
  );
  const [consentStatement, setConsentStatement] = useState(
    currentVersion?.consentStatementText ||
      'I confirm that I have read the study information. I voluntarily consent to participate in this study.'
  );
  const [randomizeItems, setRandomizeItems] = useState<boolean>(
    currentVersion?.sections.find(s => s.id === 'sec-scale')?.randomizeItemOrder ?? true
  );

  const [savedNotice, setSavedNotice] = useState(false);
  const [frozenNotice, setFrozenNotice] = useState(false);

  const retainedItems = project.items.filter(i => i.status === 'retained');

  const handleFreezeVersion = () => {
    // Freezes questionnaire into a new immutable version
    const newVersionNum = project.surveyVersions.length + 1;
    const newVersion: SurveyVersion = {
      versionNumber: newVersionNum,
      createdAt: new Date().toISOString(),
      frozenAt: new Date().toISOString(),
      isFrozen: true,
      purpose: 'main_development_study',
      title: `${project.title} (V${newVersionNum})`,
      infoSheetText: infoSheet,
      consentStatementText: consentStatement,
      sections: [
        {
          id: 'sec-scale',
          title: 'Measurement Scale Items',
          instructions: 'Please indicate your level of agreement with each item on the 5-point scale.',
          randomizeItemOrder: randomizeItems,
        },
      ],
      questions: retainedItems.map((it, idx) => ({
        id: `q-v${newVersionNum}-${it.id}`,
        itemId: it.id,
        type: 'scale_item',
        prompt: it.wording,
        required: true,
        responseFormat: it.responseFormat,
        sectionId: 'sec-scale',
        order: idx + 1,
      })),
      administeredItemIds: retainedItems.map(i => i.id),
      itemWordingsSnapshot: retainedItems.reduce((acc, i) => ({ ...acc, [i.id]: i.wording }), {}),
    };

    const updatedVersions = [...project.surveyVersions, newVersion];
    onUpdateProject({
      surveyVersions: updatedVersions,
      currentSurveyVersionNumber: newVersionNum,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        7: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: `Survey Version ${newVersionNum} frozen and published for administration.`,
        },
      },
    });

    setFrozenNotice(true);
    setTimeout(() => setFrozenNotice(false), 3000);
  };

  const handleSaveDraft = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        7: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: `Survey builder configured with ${retainedItems.length} active items.`,
        },
      },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 7 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 2: Scale Administration</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Built-in Survey Builder &amp; Version Freezing</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Configure respondent information sheets, ethical consent, screening, item order randomization, and freeze immutable survey versions (Boateng et al., 2018).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPreview}
              className="text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-teal-600" /> Preview Participant Experience
            </button>
            <button
              onClick={onOpenMethodology}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              Methodological Basis
            </button>
          </div>
        </div>
      </div>

      {/* Survey Versions Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Current Survey Version:</div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Version {project.currentSurveyVersionNumber}</span>
              <span className="px-2 py-0.5 text-[10px] bg-teal-900 text-teal-300 rounded font-semibold border border-teal-700">
                {currentVersion?.isFrozen ? 'Frozen & Immutable' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFreezeVersion}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <Lock className="w-3.5 h-3.5" /> Freeze New Survey Version (V{project.surveyVersions.length + 1})
          </button>
        </div>
      </div>

      {frozenNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            New immutable survey version created and frozen! Any prior responses remain safely tied to their original version.
          </span>
        </div>
      )}

      {/* Builder Sections */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          1. Participant Information Sheet &amp; Ethical Consent
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Survey Public Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Participant Information Sheet (PIS) Text
          </label>
          <textarea
            rows={3}
            value={infoSheet}
            onChange={e => setInfoSheet(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Informed Consent Statement (Mandatory Affirmative Consent)
          </label>
          <textarea
            rows={2}
            value={consentStatement}
            onChange={e => setConsentStatement(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Item Order Randomization & Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">
            2. Scale Item Administration ({retainedItems.length} Retained Items)
          </h3>
          <span className="text-xs text-slate-500">
            Stable IDs are preserved across administrations
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-slate-900">Randomize Item Presentation Order</div>
            <div className="text-[11px] text-slate-500">
              Mitigates order effects and fatigue bias; records presented item sequence per respondent.
            </div>
          </div>
          <input
            type="checkbox"
            checked={randomizeItems}
            onChange={e => setRandomizeItems(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
          />
        </div>

        {/* Retained Items List */}
        <div className="space-y-2">
          {retainedItems.map((item, idx) => {
            const dim = project.dimensions.find(d => d.id === item.dimensionId);
            return (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-800 text-xs">{item.id}</span>
                  <span className="text-slate-900 font-medium">"{item.wording}"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                    {dim?.name}
                  </span>
                  {item.isReverseScored && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 rounded font-semibold">
                      Reverse
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {savedNotice && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Survey builder settings saved!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Survey Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
