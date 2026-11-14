import React, { useState } from 'react';
import { ScaleProject, CognitiveInterviewNote } from '../../types/scale';
import { calculateDescriptives } from '../../lib/statsEngine';
import { MessageSquare, Users, AlertCircle, Plus, CheckCircle2, FileText, BarChart2 } from 'lucide-react';

interface Step5Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step5CognitivePretest: React.FC<Step5Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const [activeTab, setActiveTab] = useState<'cognitive' | 'pilot_data'>('cognitive');
  const [interviews, setInterviews] = useState<CognitiveInterviewNote[]>(project.cognitiveInterviews || []);

  // Form for new interview note
  const [participantCode, setParticipantCode] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(project.items[0]?.id || '');
  const [paraphrasedMeaning, setParaphrasedMeaning] = useState('');
  const [retrievalStrategy, setRetrievalStrategy] = useState('');
  const [judgmentDifficulty, setJudgmentDifficulty] = useState<'easy' | 'moderate' | 'difficult'>('easy');
  const [responseMappingDifficulty, setResponseMappingDifficulty] = useState('');
  const [unclearTerms, setUnclearTerms] = useState('');
  const [recommendedRevision, setRecommendedRevision] = useState('');

  // Pilot dataset
  const pilotSnapshot = project.datasetSnapshots.find(s => s.purpose === 'pilot_study') || project.datasetSnapshots[0];
  const pilotDescriptives = pilotSnapshot
    ? calculateDescriptives(pilotSnapshot.scoredRows, pilotSnapshot.itemColumns)
    : null;

  const handleAddInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantCode || !paraphrasedMeaning) return;

    const newNote: CognitiveInterviewNote = {
      id: `cog-${Date.now()}`,
      participantCode,
      itemId: selectedItemId,
      paraphrasedMeaning,
      retrievalStrategy,
      judgmentDifficulty,
      responseMappingDifficulty,
      unclearTerms: unclearTerms.split(',').map(s => s.trim()).filter(Boolean),
      recommendedRevision: recommendedRevision.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    const updated = [...interviews, newNote];
    setInterviews(updated);
    onUpdateProject({
      cognitiveInterviews: updated,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        5: {
          isCompleted: true,
          isEvidenceSufficient: updated.length >= 3,
          notes: `${updated.length} cognitive interviews conducted.`,
        },
      },
    });

    setParticipantCode('');
    setParaphrasedMeaning('');
    setRetrievalStrategy('');
    setResponseMappingDifficulty('');
    setUnclearTerms('');
    setRecommendedRevision('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 5 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 1: Item Development</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Cognitive Pretesting &amp; Pilot Exploration</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Probe respondent interpretations via think-aloud protocols and inspect preliminary quantitative response distributions (Tourangeau et al., 2000; Boateng et al., 2018).
            </p>
          </div>
          <button
            onClick={onOpenMethodology}
            className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-medium px-3 py-1.5 rounded-lg border border-teal-200 transition"
          >
            Methodological Basis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('cognitive')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'cognitive'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Qualitative Cognitive Pretesting ({interviews.length} Notes)
        </button>
        <button
          onClick={() => setActiveTab('pilot_data')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'pilot_data'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Quantitative Pilot Descriptives (N = {pilotSnapshot?.sampleSize || 0})
        </button>
      </div>

      {activeTab === 'cognitive' ? (
        <div className="space-y-6">
          {/* Cognitive Interviews List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Documented Cognitive Interview Protocols</h3>

            <div className="space-y-3">
              {interviews.map(note => {
                const item = project.items.find(i => i.id === note.itemId);
                return (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{note.participantCode}</span>
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono font-bold rounded">
                          {note.itemId}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        note.judgmentDifficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                        note.judgmentDifficulty === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Judgment: {note.judgmentDifficulty}
                      </span>
                    </div>

                    <div className="text-slate-500 italic">Item: "{item?.wording}"</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="font-semibold text-slate-800">Paraphrased Interpretation: </span>
                        <p className="text-slate-700 mt-0.5">{note.paraphrasedMeaning}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Information Retrieval Strategy: </span>
                        <p className="text-slate-700 mt-0.5">{note.retrievalStrategy || 'Direct recall'}</p>
                      </div>
                    </div>

                    {note.unclearTerms && note.unclearTerms.length > 0 && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded">
                        <span className="font-bold">Confusing / Unclear terms flagged: </span>
                        {note.unclearTerms.join(', ')}
                      </div>
                    )}

                    {note.recommendedRevision && (
                      <div className="text-[11px] text-teal-800 bg-teal-50 p-1.5 rounded border border-teal-200">
                        <span className="font-bold">Revision Triggered: </span>
                        {note.recommendedRevision}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Interview Note Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Log Cognitive Interview Response</h3>
            <form onSubmit={handleAddInterview} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Participant Code / Profile</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COG-P4 (Nurse Manager)"
                    value={participantCode}
                    onChange={e => setParticipantCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Probed Item</label>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {project.items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.id}: {it.wording.substring(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Judgment Difficulty</label>
                  <select
                    value={judgmentDifficulty}
                    onChange={e => setJudgmentDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="easy">Easy (Immediate understanding)</option>
                    <option value="moderate">Moderate (Required re-reading)</option>
                    <option value="difficult">Difficult (Confusion / ambiguity)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Paraphrased Meaning ("In your own words, what is this asking?")
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Record participant's verbal interpretation verbatim or summarized..."
                  value={paraphrasedMeaning}
                  onChange={e => setParaphrasedMeaning(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unclear Words / Jargon</label>
                  <input
                    type="text"
                    placeholder="Comma-separated terms that caused hesitation"
                    value={unclearTerms}
                    onChange={e => setUnclearTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Recommended Wording Revision</label>
                  <input
                    type="text"
                    placeholder="Proposed simplification or context addition"
                    value={recommendedRevision}
                    onChange={e => setRecommendedRevision(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold text-xs shadow-xs"
                >
                  Save Cognitive Note
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Quantitative Pilot Descriptives */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Pilot Distribution Analysis ({pilotSnapshot?.name || 'Pilot Sample'})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect floor/ceiling effects, item skewness, and item-total correlations before main administration.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
              Mean Duration: ~3.2 minutes
            </div>
          </div>

          {pilotDescriptives && pilotDescriptives.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item ID</th>
                    <th className="py-2.5 px-3">Mean</th>
                    <th className="py-2.5 px-3">SD</th>
                    <th className="py-2.5 px-3">Range</th>
                    <th className="py-2.5 px-3">Skewness</th>
                    <th className="py-2.5 px-3">Item-Rest r</th>
                    <th className="py-2.5 px-3">Status / Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pilotDescriptives.items.map(it => {
                    const isExtremeSkew = Math.abs(it.skewness) > 1.5;
                    const isLowDiscrim = it.itemTotalCorrelation < 0.30;
                    return (
                      <tr key={it.itemId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.itemId}</td>
                        <td className="py-2 px-3">{it.mean.toFixed(2)}</td>
                        <td className="py-2 px-3">{it.stdDev.toFixed(2)}</td>
                        <td className="py-2 px-3">{it.min} - {it.max}</td>
                        <td className={`py-2 px-3 ${isExtremeSkew ? 'text-amber-700 font-bold' : ''}`}>
                          {it.skewness.toFixed(2)}
                        </td>
                        <td className={`py-2 px-3 ${isLowDiscrim ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}`}>
                          {it.itemTotalCorrelation.toFixed(2)}
                        </td>
                        <td className="py-2 px-3">
                          {isLowDiscrim ? (
                            <span className="px-1.5 py-0.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded">
                              Low r (&lt; .30)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No quantitative pilot responses loaded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
