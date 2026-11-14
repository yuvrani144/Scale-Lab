import React, { useState } from 'react';
import { ScaleProject, Dimension, MeasurementModelType } from '../../types/scale';
import {
  Save,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  BookOpen,
  HelpCircle,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { DoiBadge } from '../DoiBadge';

interface Step2Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenDoiChecker?: (doi?: string) => void;
  onOpenAiAssistant?: (initialPrompt?: string) => void;
}

export const Step2ConstructDefinition: React.FC<Step2Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenDoiChecker,
  onOpenAiAssistant,
}) => {
  const [conceptualDefinition, setConceptualDefinition] = useState(
    project.constructDefinition.conceptualDefinition
  );
  const [theoreticalFramework, setTheoreticalFramework] = useState(
    project.constructDefinition.theoreticalFramework
  );
  const [supportingLiterature, setSupportingLiterature] = useState(
    project.constructDefinition.supportingLiterature || []
  );
  const [measurementModel, setMeasurementModel] = useState<MeasurementModelType>(
    project.measurementModel
  );
  const [measurementModelJustification, setMeasurementModelJustification] = useState(
    project.measurementModelJustification || ''
  );
  const [dimensions, setDimensions] = useState<Dimension[]>(project.dimensions);

  const [includedAspectsText, setIncludedAspectsText] = useState(
    project.constructDefinition.includedAspects.join('\n')
  );
  const [excludedAspectsText, setExcludedAspectsText] = useState(
    project.constructDefinition.excludedAspects.join('\n')
  );

  // New literature entry state
  const [newLitCitation, setNewLitCitation] = useState('');
  const [newLitProposition, setNewLitProposition] = useState('');
  const [newLitDoi, setNewLitDoi] = useState('');
  const [isVerifyingLitDoi, setIsVerifyingLitDoi] = useState(false);
  const [litDoiError, setLitDoiError] = useState<string | null>(null);

  const [newDimName, setNewDimName] = useState('');
  const [newDimCode, setNewDimCode] = useState('');
  const [newDimDesc, setNewDimDesc] = useState('');
  const [newDimTarget, setNewDimTarget] = useState(4);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleLookupLitDoi = async () => {
    if (!newLitDoi.trim()) return;
    setIsVerifyingLitDoi(true);
    setLitDoiError(null);
    try {
      const clean = newLitDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
      const res = await fetch(`/api/references/check-doi?doi=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        if (data.apaCitation) setNewLitCitation(data.apaCitation);
        if (!newLitProposition && data.title) setNewLitProposition(`Establishes foundations for: ${data.title}`);
      } else {
        setLitDoiError(data.error || 'DOI could not be resolved via CrossRef.');
      }
    } catch (e: any) {
      setLitDoiError(e.message || 'Lookup failed.');
    } finally {
      setIsVerifyingLitDoi(false);
    }
  };

  const handleAddLiterature = () => {
    if (!newLitCitation.trim()) return;
    setSupportingLiterature([
      ...supportingLiterature,
      {
        citation: newLitCitation.trim(),
        keyProposition: newLitProposition.trim() || 'Theoretical and empirical foundation for construct definition.',
        doi: newLitDoi.trim() || undefined,
      },
    ]);
    setNewLitCitation('');
    setNewLitProposition('');
    setNewLitDoi('');
    setLitDoiError(null);
  };

  const handleRemoveLiterature = (idx: number) => {
    setSupportingLiterature(supportingLiterature.filter((_, i) => i !== idx));
  };

  const handleAddDimension = () => {
    if (!newDimName.trim()) return;
    const newDim: Dimension = {
      id: `dim-${Date.now()}`,
      name: newDimName,
      code: newDimCode.trim() || newDimName.substring(0, 2).toUpperCase(),
      description: newDimDesc,
      includedAspects: '',
      excludedAspects: '',
      itemCountTarget: newDimTarget,
    };
    setDimensions([...dimensions, newDim]);
    setNewDimName('');
    setNewDimCode('');
    setNewDimDesc('');
  };

  const handleRemoveDimension = (id: string) => {
    setDimensions(dimensions.filter(d => d.id !== id));
  };

  const handleSave = () => {
    const included = includedAspectsText.split('\n').map(s => s.trim()).filter(Boolean);
    const excluded = excludedAspectsText.split('\n').map(s => s.trim()).filter(Boolean);

    onUpdateProject({
      measurementModel,
      measurementModelJustification,
      constructDefinition: {
        ...project.constructDefinition,
        conceptualDefinition,
        theoreticalFramework,
        supportingLiterature,
        includedAspects: included,
        excludedAspects: excluded,
      },
      dimensions,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        2: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: `Construct boundaries, theoretical foundations, ${supportingLiterature.length} supporting literature citations with DOIs, and dimension map established.`,
        },
      },
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Stage Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 2 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 1: Item Development</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Construct Definition, Boundaries &amp; Measurement Model</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Establish conceptual boundaries, specify included and excluded facets, and define the mathematical nature of your measurement model (Churchill, 1979; Clark &amp; Watson, 2019).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMethodology}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              Methodological Basis
            </button>
            {onOpenAiAssistant && (
              <button
                onClick={() =>
                  onOpenAiAssistant(
                    `Let's refine the conceptual boundaries and theoretical framework for "${conceptualDefinition || project.intendedConstruct}". How do we prevent construct under-representation?`
                  )
                }
                className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" /> Consult Cognitive Partner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Conceptual Definition Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          1. Conceptual Definition &amp; Theoretical Basis
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Formal Conceptual Definition of the Construct
          </label>
          <textarea
            rows={3}
            value={conceptualDefinition}
            onChange={e => setConceptualDefinition(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Provide a precise, unambiguous definition of the construct..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Underlying Theoretical Framework
          </label>
          <input
            type="text"
            value={theoreticalFramework}
            onChange={e => setTheoreticalFramework(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="e.g. Social Information Processing Theory, Job Demands-Resources, Conservation of Resources..."
          />
        </div>

        {/* Boundaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80">
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Included Aspects (Domain Boundaries)
            </label>
            <p className="text-[11px] text-emerald-700 mb-2">One aspect per line:</p>
            <textarea
              rows={4}
              value={includedAspectsText}
              onChange={e => setIncludedAspectsText(e.target.value)}
              className="w-full p-2.5 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-none"
            />
          </div>

          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
            <label className="block text-xs font-bold text-rose-900 mb-1">
              Excluded Aspects (What This Scale Does NOT Measure)
            </label>
            <p className="text-[11px] text-rose-700 mb-2">One aspect per line:</p>
            <textarea
              rows={4}
              value={excludedAspectsText}
              onChange={e => setExcludedAspectsText(e.target.value)}
              className="w-full p-2.5 text-xs border border-rose-300 rounded-lg bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Supporting Literature & Theoretical Foundations with DOIs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" /> 2. Supporting Literature &amp; Verified DOIs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical papers and theoretical foundations supporting your construct definition. Every reference can be verified via its DOI.
            </p>
          </div>
          {onOpenDoiChecker && (
            <button
              type="button"
              onClick={() => onOpenDoiChecker()}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 flex items-center gap-1 transition"
            >
              <Search className="w-3 h-3 text-teal-600" /> Check Any DOI
            </button>
          )}
        </div>

        {/* Existing Supporting Sources */}
        <div className="space-y-2.5">
          {supportingLiterature.length === 0 ? (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No supporting theoretical literature added yet. Add foundational citations below with verified DOIs.
            </div>
          ) : (
            supportingLiterature.map((lit, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-900">{lit.citation}</div>
                    {lit.doi && (
                      <DoiBadge doi={lit.doi} onVerify={onOpenDoiChecker} />
                    )}
                  </div>
                  <div className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 text-[11px]">
                    <strong className="text-slate-800">Key Theoretical Proposition: </strong>
                    {lit.keyProposition}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLiterature(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
                  title="Remove literature"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Literature with DOI Lookup */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Supporting Literature Reference
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="DOI (e.g. 10.1177/002224377901600110 or https://doi.org/...)"
              value={newLitDoi}
              onChange={e => setNewLitDoi(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono placeholder:font-sans"
            />
            <button
              type="button"
              onClick={handleLookupLitDoi}
              disabled={!newLitDoi.trim() || isVerifyingLitDoi}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5 text-teal-700" />
              {isVerifyingLitDoi ? 'Checking CrossRef...' : 'Verify & Auto-fill'}
            </button>
          </div>

          {litDoiError && (
            <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{litDoiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              placeholder="Full APA Citation (Author, Year, Title, Journal/Book)"
              value={newLitCitation}
              onChange={e => setNewLitCitation(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            <textarea
              rows={2}
              placeholder="Key theoretical proposition supporting this construct definition..."
              value={newLitProposition}
              onChange={e => setNewLitProposition(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddLiterature}
              disabled={!newLitCitation.trim()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Supporting Reference
            </button>
          </div>
        </div>
      </div>

      {/* 3. Measurement Model Specification (Reflective vs Formative) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" /> 3. Measurement Model Specification
          </h3>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
            Methodological Requirement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => setMeasurementModel('reflective')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition ${
              measurementModel === 'reflective'
                ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Reflective (Effect Indicators)</span>
              {measurementModel === 'reflective' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Items are manifestations of the latent construct ($Construct \to Item$). Items are expected to inter-correlate. Factor analysis, Cronbach's alpha, and McDonald's omega apply.
            </p>
          </div>

          <div
            onClick={() => setMeasurementModel('formative')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition ${
              measurementModel === 'formative'
                ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Formative (Causal Indicators)</span>
              {measurementModel === 'formative' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Items form or define the construct ($Items \to Construct$). Items need not correlate. Internal-consistency reliability and classical factor analysis DO NOT apply.
            </p>
          </div>

          <div
            onClick={() => setMeasurementModel('uncertain')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition ${
              measurementModel === 'uncertain'
                ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Uncertain / Exploratory</span>
              {measurementModel === 'uncertain' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Requires conceptual clarification before proceeding to statistical analysis. Revisit Bollen &amp; Lennox (1991) criteria.
            </p>
          </div>
        </div>

        {measurementModel === 'formative' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Formative Measurement Notice: </span>
              As highlighted by Churchill (1979) and Boateng et al. (2018), factor-analytic item pruning and internal consistency (Alpha/Omega) assume reflective indicators. For formative constructs, multicollinearity diagnostics (VIF) and external validity mapping should be used instead.
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Measurement Model Justification
          </label>
          <textarea
            rows={2}
            value={measurementModelJustification}
            onChange={e => setMeasurementModelJustification(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Explain why items are reflective manifestations of the unobserved trait..."
          />
        </div>
      </div>

      {/* Dimensions Mapping */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          4. Construct-to-Dimension Map
        </h3>

        <div className="space-y-3">
          {dimensions.map(dim => {
            const itemCount = project.items.filter(i => i.dimensionId === dim.id).length;
            return (
              <div key={dim.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded">
                      {dim.code}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{dim.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">
                      Current Items: <strong className="text-slate-800">{itemCount}</strong> / Target: {dim.itemCountTarget || 4}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDimension(dim.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-slate-600">{dim.description}</div>
              </div>
            );
          })}
        </div>

        {/* Add Dimension */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-800">Add Proposed Dimension</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Dimension Name (e.g. Voice Safety)"
              value={newDimName}
              onChange={e => setNewDimName(e.target.value)}
              className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <input
              type="text"
              placeholder="Code (e.g. VS)"
              value={newDimCode}
              onChange={e => setNewDimCode(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <input
              type="number"
              placeholder="Target Items (e.g. 4)"
              value={newDimTarget}
              onChange={e => setNewDimTarget(parseInt(e.target.value, 10) || 4)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Operational definition and scope of this sub-dimension..."
            value={newDimDesc}
            onChange={e => setNewDimDesc(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddDimension}
              disabled={!newDimName.trim()}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add Dimension
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {savedNotice && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Construct definition and dimensions saved!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Save &amp; Mark Step 2 Completed
          </button>
        </div>
      </div>
    </div>
  );
};
