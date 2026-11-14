import React, { useState } from 'react';
import { ScaleProject, ValidationHypothesis } from '../../types/scale';
import { ClipboardList, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Target, ArrowRight } from 'lucide-react';

interface Step6Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step6ValidationPlan: React.FC<Step6Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const [hypotheses, setHypotheses] = useState<ValidationHypothesis[]>(project.validationHypotheses || []);

  const [targetConstruct, setTargetConstruct] = useState(project.intendedConstruct);
  const [externalConstruct, setExternalConstruct] = useState('');
  const [hypType, setHypType] = useState<ValidationHypothesis['type']>('convergent');
  const [predictedDirection, setPredictedDirection] = useState<ValidationHypothesis['predictedDirection']>('positive');
  const [predictedMagnitude, setPredictedMagnitude] = useState('');
  const [rationale, setRationale] = useState('');

  const [sampleJustification, setSampleJustification] = useState(
    'Based on Wolf et al. (2013) Monte Carlo recommendations for 3-factor models with 4 indicators per factor and expected standardized loadings >= 0.70, minimum N = 150-200 provides > 80% power. A split-sample strategy of N = 200 (calibration for EFA) and N = 220 (validation for CFA) is adopted.'
  );

  const [savedNotice, setSavedNotice] = useState(false);

  const handleAddHypothesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalConstruct.trim() || !rationale.trim()) return;

    const newHyp: ValidationHypothesis = {
      id: `hyp-${Date.now()}`,
      constructTarget: targetConstruct,
      externalConstruct: externalConstruct.trim(),
      type: hypType,
      predictedDirection,
      predictedMagnitude: predictedMagnitude.trim() || 'Moderate (|r| >= .40)',
      rationale: rationale.trim(),
    };

    const updated = [...hypotheses, newHyp];
    setHypotheses(updated);
    onUpdateProject({
      validationHypotheses: updated,
    });

    setExternalConstruct('');
    setPredictedMagnitude('');
    setRationale('');
  };

  const handleRemoveHypothesis = (id: string) => {
    const updated = hypotheses.filter(h => h.id !== id);
    setHypotheses(updated);
    onUpdateProject({ validationHypotheses: updated });
  };

  const handleSavePlan = () => {
    onUpdateProject({
      validationHypotheses: hypotheses,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        6: {
          isCompleted: true,
          isEvidenceSufficient: hypotheses.length >= 2,
          notes: `${hypotheses.length} validation hypotheses preregistered before data examination.`,
        },
      },
    });

    // Append to decision log
    fetch(`/api/projects/${project.id}/decision-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: 6,
        stageName: 'Study Plan',
        decisionType: 'methodological_divergence',
        title: 'Validation Hypotheses and Split-Sample Plan Preregistered',
        rationalSummary: `Formulated ${hypotheses.length} explicit construct validity hypotheses prior to analyzing empirical survey datasets to prevent post-hoc HARKing.`,
        methodologicalJustification: 'Clark & Watson (2019) emphasize formulating convergent/discriminant predictions before inspecting empirical findings.',
        author: 'Lead Researcher',
      }),
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 6 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 2: Scale Administration</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Study Design, Sampling &amp; Preregistered Hypotheses</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Specify sample size rationale, split-sample reservation strategy, and pre-formulate validity hypotheses before examining data (Churchill, 1979; Clark &amp; Watson, 2019).
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

      {/* Sampling Plan Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> 1. Sample Size Justification (Wolf et al., 2013)
          </h3>
          <span className="text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200">
            No universal "10-per-item" rule of thumb
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          ScaleLab rejects arbitrary rules of thumb (e.g. 5 or 10 respondents per item). Methodological research demonstrates that required sample sizes depend on latent factor loadings, indicator-to-factor ratios, estimator choice, and degrees of freedom (Wolf et al., 2013; Boateng et al., 2018).
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Preregistered Sample Size Justification &amp; Strategy:
          </label>
          <textarea
            rows={3}
            value={sampleJustification}
            onChange={e => setSampleJustification(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Split Sample Banner */}
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-3 text-xs text-teal-950">
          <Target className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Split-Sample Cross-Validation Mandate: </span>
            To prevent capitalization on chance, reserve an initial calibration sample (e.g. N = 200) strictly for EFA, and an independent holdout sample (e.g. N = 220) for CFA confirmation.
          </div>
        </div>
      </div>

      {/* Hypotheses Formulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              2. Pre-Formulated Construct Validity Hypotheses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hypotheses must be documented prior to statistical testing to maintain deductive rigor.
            </p>
          </div>
        </div>

        {/* Existing Hypotheses */}
        <div className="space-y-3">
          {hypotheses.map((hyp, idx) => (
            <div key={hyp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded">
                    H{idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 capitalize">
                    {hyp.type.replace('_', ' ')} Validity: {hyp.constructTarget} ➔ {hyp.externalConstruct}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                    Direction: {hyp.predictedDirection}
                  </span>
                  <button
                    onClick={() => handleRemoveHypothesis(hyp.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-slate-700">
                <span className="font-semibold text-slate-800">Expected Magnitude: </span>
                {hyp.predictedMagnitude}
              </div>

              <div className="text-slate-600 italic">
                <span className="font-semibold text-slate-700 not-italic">Theoretical Rationale: </span>
                "{hyp.rationale}"
              </div>

              {hyp.empiricalResult && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-center justify-between">
                  <span>
                    Empirical finding: <strong className="font-mono">{hyp.empiricalResult.statisticType} = {hyp.empiricalResult.observedValue}</strong> ({hyp.empiricalResult.interpretation})
                  </span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supported
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Hypothesis Form */}
        <form onSubmit={handleAddHypothesis} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-800">Define New Validity Hypothesis</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Validity Type</label>
              <select
                value={hypType}
                onChange={e => setHypType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="convergent">Convergent Validity (Theoretically related)</option>
                <option value="discriminant">Discriminant Validity (Theoretically distinct)</option>
                <option value="criterion_concurrent">Criterion Validity (Concurrent outcome)</option>
                <option value="criterion_predictive">Criterion Validity (Predictive outcome)</option>
                <option value="known_groups">Known-Groups Validity</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">External Construct / Criterion</label>
              <input
                type="text"
                placeholder="e.g. Team Learning Behavior"
                value={externalConstruct}
                onChange={e => setExternalConstruct(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Predicted Direction &amp; Magnitude</label>
              <div className="flex gap-2">
                <select
                  value={predictedDirection}
                  onChange={e => setPredictedDirection(e.target.value as any)}
                  className="px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="positive">Positive (+)</option>
                  <option value="negative">Negative (-)</option>
                  <option value="null_or_low">Null / Low (|r| &lt;= .30)</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. r >= .40"
                  value={predictedMagnitude}
                  onChange={e => setPredictedMagnitude(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Theoretical Rationale (Citations)</label>
            <textarea
              rows={2}
              required
              placeholder="Cite theoretical reasons why this relationship is expected to hold in your target population..."
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!externalConstruct.trim() || !rationale.trim()}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Preregister Hypothesis
            </button>
          </div>
        </form>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {savedNotice && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Validation plan and hypotheses logged!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSavePlan}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <ClipboardList className="w-4 h-4" /> Save Plan &amp; Mark Step 6 Completed
          </button>
        </div>
      </div>
    </div>
  );
};
