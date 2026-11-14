import React, { useState } from 'react';
import { ScaleProject, PanellistRating } from '../../types/scale';
import { calculateCVI, CviResult } from '../../lib/statsEngine';
import { Users, CheckCircle2, AlertTriangle, Calculator, FileCheck, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface Step4Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step4ExpertReview: React.FC<Step4Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const panel = project.expertPanels[0];
  const panellists = panel?.panellists || [];
  const ratings = panel?.ratings || [];
  const items = project.items;

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Compute CVI using authentic statistical engine
  const cviResults: CviResult = calculateCVI(
    ratings,
    items.map(i => i.id),
    panellists.length
  );

  const handleItemExclusion = (itemId: string, itemCviVal: number) => {
    const updatedItems = project.items.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          status: 'removed' as const,
          statusRationale: `Exclusion based on Expert Content Review: I-CVI of ${itemCviVal.toFixed(2)} fell below the recommended benchmark.`,
        };
      }
      return i;
    });

    onUpdateProject({ items: updatedItems });

    // Append to decision log
    fetch(`/api/projects/${project.id}/decision-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: 4,
        stageName: 'Expert Review',
        decisionType: 'item_exclusion',
        title: `Purified Item ${itemId} following Expert Content Validity evaluation`,
        rationalSummary: `Item ${itemId} demonstrated insufficient content relevance (I-CVI = ${itemCviVal.toFixed(2)}). Excluded to prevent construct-irrelevant noise.`,
        methodologicalJustification: 'Polit & Beck (2006) and Lynn (1986) require I-CVI >= 0.78 for panels of 6 or more experts.',
        impactedItemIds: [itemId],
        evidenceReference: `I-CVI = ${itemCviVal.toFixed(2)} (below 0.78 threshold)`,
        author: 'Lead Researcher',
      }),
    });
  };

  const handleMarkStepCompleted = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        4: {
          isCompleted: true,
          isEvidenceSufficient: cviResults.sCviAve >= 0.90,
          notes: `Expert panel evaluated (N=${panellists.length}); S-CVI/Ave = ${cviResults.sCviAve.toFixed(3)}.`,
        },
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 4 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 1: Item Development</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Expert Content Review &amp; CVI Analysis</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Quantify content validity using Lynn (1986) and Polit &amp; Beck (2006) Item-level CVI (I-CVI), Scale-level CVI (S-CVI/Ave), and Lawshe (1975) CVR.
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

      {/* Global Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Scale-Level CVI (S-CVI/Ave)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{cviResults.sCviAve.toFixed(3)}</div>
          <div className="text-[11px] mt-1 flex items-center gap-1 font-medium text-emerald-700">
            {cviResults.sCviAve >= 0.90 ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Meets &gt;= 0.90 benchmark</>
            ) : (
              <span className="text-amber-700">Below 0.90 benchmark</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Average of all item I-CVIs</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Universal Agreement (S-CVI/UA)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{cviResults.sCviUniversalAgreement.toFixed(3)}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {cviResults.universalAgreementCount} of {cviResults.totalItems} items with 100% agreement
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Proportion where all experts agreed (3 or 4)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Expert Panel Size</div>
          <div className="text-2xl font-black text-teal-800 mt-1">{panellists.length} Experts</div>
          <div className="text-[11px] text-slate-600 mt-1">
            I-CVI Cutoff: <strong className="text-slate-900">{panellists.length >= 6 ? '0.78' : '1.00'}</strong>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Polit &amp; Beck (2006) criteria</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Content Validation Verdict</div>
          <div className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
            {cviResults.benchmarkMet ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Evidence Sufficient
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Revision Advised
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {cviResults.benchmarkMet ? 'Scale demonstrates strong content coverage.' : 'Some items need revision or removal.'}
          </div>
        </div>
      </div>

      {/* Formulas & Denominators Card */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-teal-600" /> Exact Formulas &amp; Methodological Rules (Rule 4)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-semibold text-slate-800">Item Content Validity Index (I-CVI):</span>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mt-0.5">
              I-CVI = A / N (where A = count of experts rating 3 or 4 on 4-point relevance scale)
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              For panel of 6-10 experts, I-CVI must be &gt;= 0.78 (Lynn 1986).
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-800">Lawshe's Content Validity Ratio (CVR):</span>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mt-0.5">
              CVR = (n_e - N/2) / (N/2) (where n_e = count of experts rating item "Essential")
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Ranges from -1.0 to +1.0. Zero indicates exactly half the panel considered it essential.
            </div>
          </div>
        </div>
      </div>

      {/* Item-by-Item Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Item-Level CVI &amp; Expert Evaluation Grid
          </h3>
          <span className="text-xs text-slate-500">
            {items.length} items evaluated by {panellists.length} experts
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {cviResults.itemCvi.map(itemRes => {
            const item = items.find(i => i.id === itemRes.itemId);
            if (!item) return null;
            const itemRatings = ratings.filter(r => r.itemId === item.id);
            const isExpanded = expandedItemId === item.id;

            return (
              <div key={item.id} className="p-4 hover:bg-slate-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-slate-900 text-xs">{item.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        item.status === 'removed' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.status}
                      </span>
                      {item.isReverseScored && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 rounded">
                          Reverse-Scored
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-900">{item.wording}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">I-CVI</div>
                      <div className={`text-base font-black ${
                        itemRes.meetsRecommendedCutoff ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {itemRes.iCvi.toFixed(2)}
                      </div>
                    </div>

                    {itemRes.cvr !== undefined && (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Lawshe CVR</div>
                        <div className="text-base font-bold text-slate-700">
                          {itemRes.cvr > 0 ? `+${itemRes.cvr.toFixed(2)}` : itemRes.cvr.toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div className="pl-2 flex items-center gap-1.5">
                      {!itemRes.meetsRecommendedCutoff && item.status !== 'removed' && (
                        <button
                          onClick={() => handleItemExclusion(item.id, itemRes.iCvi)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold shadow-xs"
                          title="Exclude this item from active instrument and log decision"
                        >
                          Exclude Item
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Panellist Breakdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="font-semibold text-slate-700">Individual Panellist Ratings:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {itemRatings.map((r, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="font-medium text-slate-900">{r.panellistName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Relevance: <strong className="text-slate-800">{r.relevance} / 4</strong> | Clarity: <strong className="text-slate-800">{r.clarity} / 4</strong>
                          </div>
                          {r.qualitativeComments && (
                            <div className="mt-1 text-[11px] text-teal-800 italic">
                              "{r.qualitativeComments}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Rule 4: Do not automatically delete an item based on one numerical cutoff alone. All exclusions are audited in the Decision Log.
        </div>
        <button
          onClick={handleMarkStepCompleted}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <FileCheck className="w-4 h-4" /> Finalize Step 4 Review
        </button>
      </div>
    </div>
  );
};
