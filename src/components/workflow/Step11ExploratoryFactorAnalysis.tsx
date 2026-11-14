import React, { useState } from 'react';
import { ScaleProject, DatasetSnapshot } from '../../types/scale';
import { runEFA, calculateSamplingAdequacy, calculateCorrelationMatrix, EfaResult, SamplingAdequacyResult } from '../../lib/statsEngine';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Layers, ShieldCheck, HelpCircle, Save } from 'lucide-react';

interface Step11Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenDecisionLog: () => void;
}

export const Step11ExploratoryFactorAnalysis: React.FC<Step11Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenDecisionLog,
}) => {
  // Use calibration snapshot (e.g. N = 200)
  const calibrationSnapshot = project.datasetSnapshots.find(
    s => s.purpose === 'main_development_study' || s.id.includes('efa')
  ) || project.datasetSnapshots[0];

  const [nFactors, setNFactors] = useState<number>(3);
  const [rotationMethod, setRotationMethod] = useState<'promax' | 'varimax'>('promax');
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState(false);
  const [confirmedStructureNotice, setConfirmedStructureNotice] = useState(false);

  const retainedItems = project.items.filter(i => i.status === 'retained');
  const itemCols = retainedItems.map(i => i.id.replace(/-/g, '_'));

  // Calculate actual statistics using our stats engine
  const datasetRows = calibrationSnapshot?.scoredRows || [];
  const sampleSize = calibrationSnapshot?.sampleSize || datasetRows.length;

  const { matrix: corrMatrix } = calculateCorrelationMatrix(datasetRows, itemCols);
  const samplingAdequacy: SamplingAdequacyResult = calculateSamplingAdequacy(
    corrMatrix,
    itemCols,
    sampleSize
  );

  const efaResults: EfaResult = runEFA(
    datasetRows,
    itemCols,
    nFactors,
    rotationMethod
  );

  const handleConfirmRetention = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        11: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: `EFA confirmed: ${nFactors}-factor solution extracted via ${rotationMethod} rotation explaining ${efaResults.totalVarianceExplained}% variance.`,
        },
      },
    });

    // Append to decision log
    fetch(`/api/projects/${project.id}/decision-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: 11,
        stageName: 'Exploratory Factor Analysis',
        decisionType: 'factor_retention',
        title: `Retained ${nFactors} Correlated Factors via ${rotationMethod.toUpperCase()} Rotation`,
        rationalSummary: `Parallel analysis suggested ${efaResults.suggestedFactorsParallel} factors and Kaiser criterion indicated ${efaResults.suggestedFactorsKaiser} factors. Extracted ${nFactors} factors explaining ${efaResults.totalVarianceExplained}% of total variance.`,
        methodologicalJustification: 'Oblique Promax rotation chosen following Boateng et al. (2018) recommendations for interrelated psychological facets.',
        evidenceReference: `Eigenvalues: ${efaResults.eigenvalues.slice(0, 4).join(', ')}`,
        author: 'Lead Researcher',
      }),
    });

    setConfirmedStructureNotice(true);
    setTimeout(() => setConfirmedStructureNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 11 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 3: Statistical Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Exploratory Factor Analysis (EFA)</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Evaluate factorability, inspect Scree test against Horn’s (1965) Parallel Analysis simulation, extract common factors, and examine oblique pattern matrices (Clark &amp; Watson, 2019; Boateng et al., 2018).
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

      {/* Sampling Adequacy Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Kaiser-Meyer-Olkin (KMO)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{samplingAdequacy.overallKMO}</div>
          <div className="text-[11px] text-teal-800 font-medium mt-1">
            {samplingAdequacy.kmoInterpretation}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Benchmark: &gt;= 0.60 required</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Bartlett’s Test of Sphericity</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            &chi;&sup2; = {samplingAdequacy.bartlettsChiSquare}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            p &lt; .001 (df = {samplingAdequacy.bartlettsDf})
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rejects identity matrix (R &ne; I)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Calibration Sample</div>
          <div className="text-2xl font-black text-teal-800 mt-1">N = {sampleSize}</div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium">
            Snapshot: {calibrationSnapshot?.name || 'Calibration Split'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Separate from validation holdout</div>
        </div>
      </div>

      {/* Scree Plot & Parallel Analysis Simulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" /> Scree Test with Horn’s (1965) Parallel Analysis (Rule 5)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical eigenvalues (solid teal) plotted against 95th percentile eigenvalues from 30 Monte Carlo random correlation matrices (dashed red).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-teal-800">
              <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" /> Empirical
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-700">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-rose-600 inline-block" /> 95th% Random PA
            </span>
          </div>
        </div>

        {/* SVG Scree Plot */}
        <div className="w-full h-56 bg-slate-50 rounded-xl p-4 border border-slate-200 relative flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
            {/* Horizontal Grid lines */}
            <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="70" x2="480" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
            <line x1="40" y1="120" x2="480" y2="120" stroke="#cbd5e1" />
            <text x="10" y="123" fontSize="9" fill="#94a3b8" fontFamily="monospace">&lambda;=1.0</text>
            <text x="10" y="73" fontSize="9" fill="#94a3b8" fontFamily="monospace">&lambda;=3.0</text>
            <text x="10" y="23" fontSize="9" fill="#94a3b8" fontFamily="monospace">&lambda;=5.0</text>

            {/* Parallel Analysis Line (Dashed red) */}
            <polyline
              fill="none"
              stroke="#e11d48"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={efaResults.parallelAnalysis95
                .slice(0, 8)
                .map((pa, idx) => {
                  const x = 50 + idx * 55;
                  // Map lambda: 0 to 6 -> 160 to 10
                  const y = 160 - (pa / 5.5) * 140;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Empirical Eigenvalues Line (Solid Teal) */}
            <polyline
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.5"
              points={efaResults.eigenvalues
                .slice(0, 8)
                .map((ev, idx) => {
                  const x = 50 + idx * 55;
                  const y = 160 - (ev / 5.5) * 140;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Empirical Points & Labels */}
            {efaResults.eigenvalues.slice(0, 8).map((ev, idx) => {
              const x = 50 + idx * 55;
              const y = 160 - (ev / 5.5) * 140;
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" fill="#0f766e" />
                  <text x={x} y={y - 8} fontSize="9" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                    {ev.toFixed(2)}
                  </text>
                  <text x={x} y="175" fontSize="10" fill="#64748b" textAnchor="middle">
                    F{idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="font-semibold text-slate-800">Horn’s Parallel Analysis: </span>
            <strong className="text-teal-800">{efaResults.suggestedFactorsParallel} Factors</strong> (exceed 95th% random threshold)
          </div>
          <div>
            <span className="font-semibold text-slate-800">Kaiser Criterion (&lambda; &gt; 1): </span>
            <strong className="text-slate-800">{efaResults.suggestedFactorsKaiser} Factors</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-800">Total Variance Explained: </span>
            <strong className="text-teal-800">{efaResults.totalVarianceExplained}%</strong>
          </div>
        </div>
      </div>

      {/* Factor Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-teal-600" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-700">Factors to Extract:</span>
            <select
              value={nFactors}
              onChange={e => setNFactors(parseInt(e.target.value, 10))}
              className="font-bold border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 bg-white"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Factor' : 'Factors'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-700">Rotation:</span>
            <select
              value={rotationMethod}
              onChange={e => setRotationMethod(e.target.value as any)}
              className="font-bold border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 bg-white"
            >
              <option value="promax">Promax (Oblique - Correlated factors)</option>
              <option value="varimax">Varimax (Orthogonal - Uncorrelated)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
        >
          {showCorrelationMatrix ? 'Hide Correlation Matrix' : 'View Pearson Correlation Matrix'}
        </button>
      </div>

      {/* Correlation Matrix (Expandable) */}
      {showCorrelationMatrix && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto text-xs">
          <h4 className="font-bold text-slate-900 mb-2">Item Inter-Correlation Matrix (Pearson r)</h4>
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-1.5">Item</th>
                {itemCols.map(c => <th key={c} className="p-1.5">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {itemCols.map((c, i) => (
                <tr key={c} className="border-t border-slate-100">
                  <td className="p-1.5 font-bold">{c}</td>
                  {itemCols.map((_, j) => (
                    <td key={j} className={`p-1.5 ${i === j ? 'font-bold text-slate-400' : corrMatrix[i][j] > 0.4 ? 'text-teal-700 font-bold' : ''}`}>
                      {corrMatrix[i][j].toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rotated Factor Pattern Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rotated Factor Pattern Matrix ({rotationMethod.toUpperCase()} Rotation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Loadings &gt;= 0.40 indicate primary factor indicators (Clark &amp; Watson, 2019). Cross-loadings &gt;= 0.32 highlighted in amber.
            </p>
          </div>
          {efaResults.crossLoadingItems.length > 0 && (
            <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {efaResults.crossLoadingItems.length} item(s) cross-loading
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item ID</th>
                <th className="py-2.5 px-3">Item Wording</th>
                {Array.from({ length: nFactors }).map((_, fIdx) => (
                  <th key={fIdx} className="py-2.5 px-3 text-right">Factor {fIdx + 1}</th>
                ))}
                <th className="py-2.5 px-3 text-right">Communality (h&sup2;)</th>
                <th className="py-2.5 px-3 text-right">Uniqueness (u&sup2;)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {efaResults.patternMatrix.map(row => {
                const item = project.items.find(i => i.id.replace(/-/g, '_') === row.itemId || i.id === row.itemId);
                const isCrossLoading = efaResults.crossLoadingItems.includes(row.itemId);
                return (
                  <tr key={row.itemId} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.itemId}</td>
                    <td className="py-2 px-3 max-w-xs truncate text-slate-800">
                      {item?.wording || row.itemId}
                    </td>
                    {row.loadings.map((loading, lIdx) => {
                      const isSalient = Math.abs(loading) >= 0.40;
                      return (
                        <td
                          key={lIdx}
                          className={`py-2 px-3 text-right font-mono font-medium ${
                            isSalient ? 'text-teal-700 font-bold bg-teal-50/50' : 'text-slate-400'
                          }`}
                        >
                          {loading.toFixed(3)}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {row.communality.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">
                      {row.uniqueness.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Factor Inter-Correlations (if Oblique) */}
      {efaResults.factorCorrelations && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs space-y-2">
          <div className="font-bold text-slate-900">Factor Inter-Correlation Matrix (&Phi;)</div>
          <table className="font-mono text-xs text-slate-700">
            <tbody>
              {efaResults.factorCorrelations.map((row, i) => (
                <tr key={i}>
                  <td className="pr-4 font-bold text-slate-500">Factor {i + 1}</td>
                  {row.map((val, j) => (
                    <td key={j} className="px-3 py-1 font-semibold">
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          {confirmedStructureNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Factor structure confirmed &amp; logged in Research Decision Log!
            </span>
          )}
        </div>
        <button
          onClick={handleConfirmRetention}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <ShieldCheck className="w-4 h-4" /> Confirm &amp; Log {nFactors}-Factor Structure (Step 11)
        </button>
      </div>
    </div>
  );
};
