import React, { useState } from 'react';
import { ScaleProject, DatasetSnapshot } from '../../types/scale';
import { runCFA, CfaFactorSpec, CfaResult } from '../../lib/statsEngine';
import { CheckCircle2, AlertTriangle, ShieldCheck, Layers, HelpCircle, FileCheck, Split } from 'lucide-react';

interface Step12Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenDecisionLog: () => void;
}

export const Step12ConfirmatoryFactorAnalysis: React.FC<Step12Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenDecisionLog,
}) => {
  // Prefer independent validation snapshot (e.g. N = 220)
  const validationSnapshot = project.datasetSnapshots.find(
    s => s.purpose === 'independent_validation_study' || s.id.includes('cfa')
  ) || project.datasetSnapshots[project.datasetSnapshots.length - 1];

  const calibrationSnapshot = project.datasetSnapshots.find(
    s => s.purpose === 'main_development_study' || s.id.includes('efa')
  );

  const [selectedSnapshotId, setSelectedSnapshotId] = useState(
    validationSnapshot?.id || project.datasetSnapshots[0]?.id || ''
  );
  const [confirmedModelNotice, setConfirmedModelNotice] = useState(false);

  const activeSnapshot = project.datasetSnapshots.find(s => s.id === selectedSnapshotId) || validationSnapshot;

  const isSameAsEfa = calibrationSnapshot && activeSnapshot && calibrationSnapshot.id === activeSnapshot.id;

  // Build factor specification from dimensions and retained items
  const retainedItems = project.items.filter(i => i.status === 'retained');
  const factorSpecs: CfaFactorSpec[] = project.dimensions.map(dim => {
    const dimItems = retainedItems
      .filter(it => it.dimensionId === dim.id)
      .map(it => it.id.replace(/-/g, '_'));
    return {
      factorId: dim.id,
      factorName: dim.name,
      itemIds: dimItems,
    };
  });

  const datasetRows = activeSnapshot?.scoredRows || [];
  const cfaResults: CfaResult = runCFA(datasetRows, factorSpecs);

  const handleConfirmModel = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        12: {
          isCompleted: true,
          isEvidenceSufficient: cfaResults.fitEvaluation.isCfiGood && cfaResults.fitEvaluation.isRmseaGood,
          notes: `CFA evaluated on N=${cfaResults.sampleSize}. CFI=${cfaResults.cfi}, RMSEA=${cfaResults.rmsea}, SRMR=${cfaResults.srmr}.`,
        },
      },
    });

    fetch(`/api/projects/${project.id}/decision-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: 12,
        stageName: 'Confirmatory Factor Analysis',
        decisionType: 'model_respecification',
        title: `CFA Measurement Model Confirmed (CFI = ${cfaResults.cfi}, RMSEA = ${cfaResults.rmsea})`,
        rationalSummary: `Tested ${factorSpecs.length}-factor reflective measurement model on holdout dataset (${activeSnapshot?.name}, N=${cfaResults.sampleSize}). Fit indices: CFI = ${cfaResults.cfi}, TLI = ${cfaResults.tli}, RMSEA = ${cfaResults.rmsea} [90% CI: ${cfaResults.rmsea90CI.join(' - ')}], SRMR = ${cfaResults.srmr}.`,
        methodologicalJustification: 'Adhering to Hu & Bentler (1999) combinatorial fit standards without post-hoc cherry-picking.',
        evidenceReference: `Chi-sq(${cfaResults.degreesOfFreedom}) = ${cfaResults.chiSquare}, p = ${cfaResults.pValue}`,
        author: 'Lead Researcher',
      }),
    });

    setConfirmedModelNotice(true);
    setTimeout(() => setConfirmedModelNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 12 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 3: Statistical Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Confirmatory Factor Analysis (CFA)</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Confirm factor dimensionality on an independent holdout sample using Maximum Likelihood covariance modeling and evaluate global fit indices (Hu &amp; Bentler, 1999; Boateng et al., 2018).
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

      {/* Snapshot Selection & Data Separation Warning */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Split className="w-5 h-5 text-teal-600" />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Evaluation Dataset (Must be Independent from EFA)
            </label>
            <select
              value={selectedSnapshotId}
              onChange={e => setSelectedSnapshotId(e.target.value)}
              className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {project.datasetSnapshots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (N = {s.sampleSize}) [{s.purpose.replace(/_/g, ' ')}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {isSameAsEfa && (
          <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Warning: You are running CFA on the same dataset used for EFA. Clark &amp; Watson (2019) mandate an independent validation holdout to avoid capitalization on chance.
            </span>
          </div>
        )}
      </div>

      {/* Fit Indices Summary Table */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Model &chi;&sup2; / df</div>
          <div className="text-lg font-black text-slate-900 mt-1">
            {cfaResults.degreesOfFreedom > 0 ? (cfaResults.chiSquare / cfaResults.degreesOfFreedom).toFixed(2) : '-'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            &chi;&sup2; = {cfaResults.chiSquare} (df={cfaResults.degreesOfFreedom})
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">CFI</div>
          <div className={`text-lg font-black mt-1 ${cfaResults.cfi >= 0.95 ? 'text-emerald-700' : cfaResults.cfi >= 0.90 ? 'text-teal-700' : 'text-rose-600'}`}>
            {cfaResults.cfi.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt;= .95 good, &gt;= .90 accept</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">TLI (NNFI)</div>
          <div className={`text-lg font-black mt-1 ${cfaResults.tli >= 0.95 ? 'text-emerald-700' : cfaResults.tli >= 0.90 ? 'text-teal-700' : 'text-rose-600'}`}>
            {cfaResults.tli.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt;= .95 good, &gt;= .90 accept</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">RMSEA</div>
          <div className={`text-lg font-black mt-1 ${cfaResults.rmsea <= 0.06 ? 'text-emerald-700' : cfaResults.rmsea <= 0.08 ? 'text-teal-700' : 'text-rose-600'}`}>
            {cfaResults.rmsea.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">&lt;= .06 good, &lt;= .08 accept</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">RMSEA 90% CI</div>
          <div className="text-xs font-bold font-mono text-slate-800 mt-2">
            [{cfaResults.rmsea90CI[0].toFixed(3)} - {cfaResults.rmsea90CI[1].toFixed(3)}]
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Confidence interval</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">SRMR</div>
          <div className={`text-lg font-black mt-1 ${cfaResults.srmr <= 0.08 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {cfaResults.srmr.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">&lt;= .08 benchmark</div>
        </div>
      </div>

      {/* Plain Language Interpretation (Rule 1 & 7) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-teal-600" /> Methodological Evaluation (Hu &amp; Bentler, 1999 Joint Criteria)
        </div>
        <p className="text-slate-700 leading-relaxed">
          {cfaResults.fitEvaluation.overallSummary}
        </p>
        <p className="text-slate-500 text-[11px]">
          Rule 7: Numerical thresholds are not rigid mechanical pass/fail laws. Model fit must be interpreted in conjunction with theoretical plausibility, sample size, and indicator loadings.
        </p>
      </div>

      {/* Standardized Loadings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Standardized Factor Loadings (&lambda;) &amp; Measurement Parameters
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Sample N = {cfaResults.sampleSize}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item ID</th>
                <th className="py-2.5 px-3">Factor / Dimension</th>
                <th className="py-2.5 px-3 text-right">Standardized Loading (&lambda;)</th>
                <th className="py-2.5 px-3 text-right">Std Error (SE)</th>
                <th className="py-2.5 px-3 text-right">p-value</th>
                <th className="py-2.5 px-3 text-right">R&sup2; (Communality)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {cfaResults.standardizedLoadings.map(sl => {
                const dim = project.dimensions.find(d => d.id === sl.factorId);
                const isGoodLoading = sl.loading >= 0.70;
                return (
                  <tr key={sl.itemId} className="hover:bg-slate-50 font-sans">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{sl.itemId}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {dim?.name || sl.factorId}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-bold ${
                      isGoodLoading ? 'text-teal-700' : 'text-slate-700'
                    }`}>
                      {sl.loading.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{sl.standardError.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                      {sl.pValue < 0.001 ? '< .001' : sl.pValue.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{sl.rSquared.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latent Factor Correlations */}
      {cfaResults.factorCorrelations.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs space-y-2">
          <div className="font-bold text-slate-900">Latent Factor Correlations (&Phi;)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cfaResults.factorCorrelations.map((fc, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-medium text-slate-800">{fc.factor1} &harr; {fc.factor2}</span>
                <span className="font-mono font-bold text-teal-800 text-sm">r = {fc.correlation.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          {confirmedModelNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmatory model results saved &amp; logged!
            </span>
          )}
        </div>
        <button
          onClick={handleConfirmModel}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <FileCheck className="w-4 h-4" /> Confirm Model &amp; Proceed to Reliability &amp; Validity (Step 12)
        </button>
      </div>
    </div>
  );
};
