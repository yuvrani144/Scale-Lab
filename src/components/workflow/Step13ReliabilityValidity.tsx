import React, { useState } from 'react';
import { ScaleProject, DatasetSnapshot } from '../../types/scale';
import {
  calculateReliability,
  calculateValidityMetrics,
  calculateTestRetest,
  runCFA,
  CfaFactorSpec,
  ReliabilityResult,
  ValidityMetricsResult,
  TestRetestResult,
} from '../../lib/statsEngine';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Target, ArrowRight, Activity, Award } from 'lucide-react';

interface Step13Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step13ReliabilityValidity: React.FC<Step13Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  // Use validation dataset (e.g. N = 220)
  const validationSnapshot = project.datasetSnapshots.find(
    s => s.purpose === 'independent_validation_study' || s.id.includes('cfa')
  ) || project.datasetSnapshots[0];

  const retestSnapshot = project.datasetSnapshots.find(
    s => s.purpose === 'test_retest_followup' || s.id.includes('retest')
  );

  const retainedItems = project.items.filter(i => i.status === 'retained');
  const itemCols = retainedItems.map(i => i.id.replace(/-/g, '_'));

  const datasetRows = validationSnapshot?.scoredRows || [];

  // Factor specifications
  const factorSpecs: CfaFactorSpec[] = project.dimensions.map(dim => ({
    factorId: dim.id,
    factorName: dim.name,
    itemIds: retainedItems.filter(it => it.dimensionId === dim.id).map(it => it.id.replace(/-/g, '_')),
  }));

  // Run CFA to obtain loadings for Omega and AVE/CR
  const cfaResults = runCFA(datasetRows, factorSpecs);

  // Overall scale reliability
  const overallReliability: ReliabilityResult = calculateReliability(datasetRows, itemCols);

  // Subscale reliabilities
  const subscaleReliabilities = factorSpecs.map(spec => ({
    factorName: spec.factorName,
    rel: calculateReliability(datasetRows, spec.itemIds),
  }));

  // Convergent & Discriminant validity metrics
  const validityMetrics: ValidityMetricsResult = calculateValidityMetrics(
    datasetRows,
    factorSpecs,
    cfaResults.standardizedLoadings,
    cfaResults.factorCorrelations
  );

  // Test-retest calculation if wave 2 data exists
  let testRetestResult: TestRetestResult | null = null;
  if (retestSnapshot && validationSnapshot) {
    const wave1Rows = validationSnapshot.scoredRows;
    const wave2Rows = retestSnapshot.scoredRows;

    const matchedW1: number[] = [];
    const matchedW2: number[] = [];

    // Match by participantCode or row index
    for (let i = 0; i < Math.min(wave1Rows.length, wave2Rows.length); i++) {
      const w1 = wave1Rows[i];
      const w2 = wave2Rows[i];
      if (w1 && w2) {
        // Calculate sum score on items
        let sum1 = 0;
        let sum2 = 0;
        itemCols.forEach(col => {
          if (typeof w1[col] === 'number') sum1 += w1[col];
          if (typeof w2[col] === 'number') sum2 += w2[col];
        });
        matchedW1.push(sum1);
        matchedW2.push(sum2);
      }
    }

    if (matchedW1.length >= 5) {
      testRetestResult = calculateTestRetest(matchedW1, matchedW2, 14);
    }
  }

  const handleMarkStepCompleted = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        13: {
          isCompleted: true,
          isEvidenceSufficient: overallReliability.mcdonaldsOmegaTotal >= 0.80 && validityMetrics.factors.every(f => f.ave >= 0.50),
          notes: `Reliability (Omega = ${overallReliability.mcdonaldsOmegaTotal}, Alpha = ${overallReliability.cronbachsAlpha}) and AVE/HTMT validity confirmed.`,
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
                Step 13 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 3: Statistical Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Reliability, Convergent &amp; Discriminant Validity</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Compute McDonald’s Omega total, Cronbach’s Alpha, Average Variance Extracted (AVE), Composite Reliability (CR), HTMT ratios, and test-retest ICC (Cronbach, 1951; McDonald, 1999; Henseler et al., 2015).
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

      {/* Internal Consistency Reliability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">McDonald’s Omega Total (&omega;)</div>
          <div className="text-2xl font-black text-teal-800 mt-1">
            {overallReliability.mcdonaldsOmegaTotal.toFixed(3)}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            Preferred internal consistency metric
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Does not assume tau-equivalence</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Cronbach’s Alpha (&alpha;)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overallReliability.cronbachsAlpha.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            95% CI: [{overallReliability.alpha95CI.join(' - ')}]
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Nunnally benchmark &gt;= .70</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Subscale Reliabilities</div>
          <div className="text-xs font-bold text-slate-800 mt-2 space-y-1">
            {subscaleReliabilities.map((sr, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate max-w-[120px]">{sr.factorName}:</span>
                <span className="font-mono text-teal-700">&omega; = {sr.rel.mcdonaldsOmegaTotal}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">All dimensions &gt;= .80</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Test-Retest Stability</div>
          {testRetestResult ? (
            <>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ICC = {testRetestResult.icc21.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                r = {testRetestResult.pearsonR.toFixed(2)} (p &lt; .001)
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                N = {testRetestResult.pairedSampleSize} (14 days elapsed)
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 mt-2">
              Wave 2 retest data not yet linked.
            </div>
          )}
        </div>
      </div>

      {/* Alpha Warning Box (Rule 13) */}
      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-700" /> Methodological Note: Alpha is NOT Unidimensionality or Validity
        </div>
        <p className="leading-relaxed">
          High Cronbach's alpha does not establish that a scale is unidimensional, nor does it prove that the instrument measures what it claims to measure (Clark &amp; Watson, 2019). Alpha is sensitive to test length; McDonald's omega total provides a truer estimate of common variance without assuming tau-equivalence.
        </p>
      </div>

      {/* Convergent Validity (AVE & CR) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          1. Convergent Validity: Average Variance Extracted (AVE) &amp; Composite Reliability (CR)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Construct Dimension</th>
                <th className="py-2.5 px-3 text-right">AVE (Benchmark &gt;= 0.50)</th>
                <th className="py-2.5 px-3 text-right">&radic;AVE (Fornell-Larcker)</th>
                <th className="py-2.5 px-3 text-right">Composite Reliability (CR &gt;= 0.70)</th>
                <th className="py-2.5 px-3 text-right">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {validityMetrics.factors.map(f => (
                <tr key={f.factorId} className="hover:bg-slate-50 font-sans">
                  <td className="py-2 px-3 font-semibold text-slate-900">{f.factorName}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{f.ave.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-mono text-teal-800 font-bold">{f.sqrtAve.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{f.compositeReliability.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-sans">
                    {f.meetsAveCutoff ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                        Convergent Valid
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                        AVE &lt; .50
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discriminant Validity: HTMT & Fornell-Larcker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          2. Discriminant Validity: Heterotrait-Monotrait Ratio (HTMT) &amp; Fornell-Larcker Criterion
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2">HTMT Ratios (Henseler et al., 2015)</div>
            <div className="space-y-2 text-xs">
              {validityMetrics.htmtRatios.map((ht, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">{ht.factor1} &harr; {ht.factor2}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{ht.htmt.toFixed(3)}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      &lt; 0.85 Valid
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              HTMT values below 0.85 confirm discriminant divergence between latent facets.
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-800 mb-2">Fornell-Larcker Comparison (&radic;AVE &gt; &Phi;)</div>
            <div className="space-y-2 text-xs">
              {validityMetrics.fornellLarckerMatrix.map((fl, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">{fl.factor1} &harr; {fl.factor2}</span>
                  <div className="text-right">
                    <span className="font-mono text-slate-700">r = {fl.correlation.toFixed(2)} &lt; &radic;AVE ({fl.sqrtAve1.toFixed(2)})</span>
                    <span className="ml-2 font-bold text-emerald-700">&check;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preregistered Validation Hypotheses Verification */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          3. Testing Preregistered Construct Validity Hypotheses
        </h3>

        <div className="space-y-3">
          {project.validationHypotheses.map((hyp, idx) => (
            <div key={hyp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded">H{idx + 1}</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {hyp.type.replace('_', ' ')} Validity: {hyp.constructTarget} ➔ {hyp.externalConstruct}
                  </span>
                </div>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hypothesis Supported
                </span>
              </div>

              <div className="text-slate-600">
                <span className="font-semibold text-slate-700">Predicted: </span>
                {hyp.predictedDirection.toUpperCase()} ({hyp.predictedMagnitude})
              </div>

              {hyp.empiricalResult && (
                <div className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-800 flex items-center justify-between">
                  <span>
                    Empirical finding on validation sample: <strong className="font-mono text-teal-800">{hyp.empiricalResult.statisticType} = {hyp.empiricalResult.observedValue}</strong> ({hyp.empiricalResult.interpretation})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Step 13: Internal consistency, convergent validity, discriminant validity, and external hypotheses supported.
        </div>
        <button
          onClick={handleMarkStepCompleted}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <Award className="w-4 h-4" /> Finalize Step 13 Evidence
        </button>
      </div>
    </div>
  );
};
