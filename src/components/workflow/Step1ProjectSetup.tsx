import React, { useState, useEffect } from 'react';
import { ScaleProject, ScaleCategory, ScaleType } from '../../types/scale';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Check,
  RotateCcw,
  Layers,
  Filter,
} from 'lucide-react';
import {
  PUBLISHED_INSTRUMENTS_DATABASE,
  PublishedInstrument,
  searchPublishedInstruments,
} from '../../lib/instrumentLibrary';
import { DoiBadge } from '../DoiBadge';

interface Step1Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenAiAssistant?: (initialPrompt?: string) => void;
  onOpenDoiChecker?: (doi?: string) => void;
}

const DISCIPLINES: ScaleCategory[] = [
  'Management & Organizational Behavior',
  'Psychology',
  'Social Sciences',
  'Education',
  'Health & Nursing',
  'Marketing & Consumer Research',
  'Interdisciplinary',
];

export const Step1ProjectSetup: React.FC<Step1Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenAiAssistant,
  onOpenDoiChecker,
}) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [discipline, setDiscipline] = useState<ScaleCategory>(project.discipline);
  const [intendedConstruct, setIntendedConstruct] = useState(project.intendedConstruct);
  const [targetPopulation, setTargetPopulation] = useState(project.targetPopulation);
  const [administrationLanguage, setAdministrationLanguage] = useState(project.administrationLanguage);
  const [intendedInterpretation, setIntendedInterpretation] = useState(project.intendedInterpretation);
  const [scaleType, setScaleType] = useState<ScaleType>(project.scaleType);
  const [existingInstruments, setExistingInstruments] = useState(project.existingInstrumentsReviewed || []);

  // Instrument Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [allInstruments, setAllInstruments] = useState<PublishedInstrument[]>(PUBLISHED_INSTRUMENTS_DATABASE);

  // Manual Add Form State & DOI Lookup
  const [newInstName, setNewInstName] = useState('');
  const [newInstCitation, setNewInstCitation] = useState('');
  const [newInstWhy, setNewInstWhy] = useState('');
  const [newInstDoi, setNewInstDoi] = useState('');
  const [isVerifyingDoi, setIsVerifyingDoi] = useState(false);
  const [doiLookupError, setDoiLookupError] = useState<string | null>(null);

  const [savedNotice, setSavedNotice] = useState(false);

  // Sync state if project changes
  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
    setDiscipline(project.discipline);
    setIntendedConstruct(project.intendedConstruct);
    setTargetPopulation(project.targetPopulation);
    setAdministrationLanguage(project.administrationLanguage);
    setIntendedInterpretation(project.intendedInterpretation);
    setScaleType(project.scaleType);
    setExistingInstruments(project.existingInstrumentsReviewed || []);
  }, [project]);

  const handleSave = () => {
    onUpdateProject({
      title,
      description,
      discipline,
      intendedConstruct,
      targetPopulation,
      administrationLanguage,
      intendedInterpretation,
      scaleType,
      existingInstrumentsReviewed: existingInstruments,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        1: {
          isCompleted: true,
          isEvidenceSufficient: existingInstruments.length >= 2,
          notes: `Project charter, target context, and ${existingInstruments.length} published instruments audited.`,
        },
      },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDoiLookup = async () => {
    if (!newInstDoi.trim()) return;
    setIsVerifyingDoi(true);
    setDoiLookupError(null);
    try {
      const clean = newInstDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
      const res = await fetch(`/api/references/check-doi?doi=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        if (!newInstName.trim() && data.title) {
          setNewInstName(data.title);
        }
        if (data.apaCitation) {
          setNewInstCitation(data.apaCitation);
        }
      } else {
        setDoiLookupError(data.error || 'DOI could not be resolved via CrossRef.');
      }
    } catch (e: any) {
      setDoiLookupError(e.message || 'Lookup failed.');
    } finally {
      setIsVerifyingDoi(false);
    }
  };

  const addExistingInstrument = () => {
    if (!newInstName.trim()) return;
    setExistingInstruments([
      ...existingInstruments,
      {
        name: newInstName.trim(),
        citation: newInstCitation.trim(),
        whyInsufficient: newInstWhy.trim(),
        doi: newInstDoi.trim() || undefined,
      },
    ]);
    setNewInstName('');
    setNewInstCitation('');
    setNewInstWhy('');
    setNewInstDoi('');
    setDoiLookupError(null);
  };

  const removeExistingInstrument = (index: number) => {
    setExistingInstruments(existingInstruments.filter((_, i) => i !== index));
  };

  const handleAddFromLibrary = (inst: PublishedInstrument) => {
    // Avoid duplicate names
    if (existingInstruments.some(e => e.name.toLowerCase().includes(inst.name.toLowerCase()))) {
      return;
    }
    const updated = [
      ...existingInstruments,
      {
        name: `${inst.name} (${inst.year})`,
        citation: inst.citation,
        whyInsufficient: inst.limitationsAndGaps,
        doi: inst.doi,
      },
    ];
    setExistingInstruments(updated);
  };

  const handleDeepAiSearch = async () => {
    setIsAiSearching(true);
    try {
      const res = await fetch('/api/ai/search-instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery || intendedConstruct,
          targetConstruct: intendedConstruct,
          discipline,
          targetPopulation,
          categoryTag: selectedCategory,
        }),
      });
      const data = await res.json();
      if (data.instruments && Array.isArray(data.instruments)) {
        // Merge with existing
        const merged = [...allInstruments];
        for (const item of data.instruments) {
          if (!merged.some(m => m.name.toLowerCase() === item.name?.toLowerCase())) {
            merged.push(item);
          }
        }
        setAllInstruments(merged);
      }
    } catch (e) {
      console.error('Deep AI search failed:', e);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Filter instruments based on current search query and category
  const filteredInstruments = allInstruments.filter(inst => {
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Recent (2018-2024)' && inst.year < 2018) return false;
      if (selectedCategory !== 'Recent (2018-2024)' && inst.categoryTag !== selectedCategory) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.authors.toLowerCase().includes(q) ||
      inst.citation.toLowerCase().includes(q) ||
      inst.targetConstruct.toLowerCase().includes(q) ||
      inst.discipline.toLowerCase().includes(q) ||
      inst.dimensions.some(d => d.toLowerCase().includes(q)) ||
      inst.strengths.toLowerCase().includes(q) ||
      inst.limitationsAndGaps.toLowerCase().includes(q) ||
      inst.year.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Stage Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 1 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 1: Item Development &amp; Setup</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              Project Setup, Scope &amp; Published Instrument Audit
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Define the construct boundaries, target population, and intended interpretation of scores according to Churchill (1979) and Boateng et al. (2018). Verify whether existing published scales can meet the research need before developing a new instrument.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMethodology}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 transition"
            >
              Methodological Basis
            </button>
            {onOpenAiAssistant && (
              <button
                onClick={() =>
                  onOpenAiAssistant(
                    `Let's audit whether developing a new scale for "${intendedConstruct}" in "${targetPopulation}" is justified compared to published measures (Edmondson 1999, Clark 2020, Liang 2012, etc.).`
                  )
                }
                className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Consult Cognitive Partner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. General Project Information Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>1. General Project Specifications</span>
          <span className="text-[11px] font-normal text-slate-500">Churchill (1979) Step 1</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scale / Instrument Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Workplace Psychological Safety Scale (WPSS)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Research Discipline</label>
            <select
              value={discipline}
              onChange={e => setDiscipline(e.target.value as ScaleCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              {DISCIPLINES.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Development Pathway</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scaleType"
                  value="new_scale"
                  checked={scaleType === 'new_scale'}
                  onChange={() => setScaleType('new_scale')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="font-medium">New Scale (De Novo)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scaleType"
                  value="adaptation"
                  checked={scaleType === 'adaptation'}
                  onChange={() => setScaleType('adaptation')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="font-medium">Scale Adaptation / Translation</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Latent Construct</label>
            <input
              type="text"
              value={intendedConstruct}
              onChange={e => setIntendedConstruct(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Workplace Psychological Safety"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Population &amp; Context</label>
            <input
              type="text"
              value={targetPopulation}
              onChange={e => setTargetPopulation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Knowledge workers operating in cross-functional or hybrid teams"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administration Language</label>
            <input
              type="text"
              value={administrationLanguage}
              onChange={e => setAdministrationLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Interpretation of Scores</label>
            <input
              type="text"
              value={intendedInterpretation}
              onChange={e => setIntendedInterpretation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Diagnostic climate profiling and empirical structural modeling"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description &amp; Rationale</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Summarize the background, research objectives, and rationale for developing this scale..."
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive Published Instrument Search & Systematic Literature Audit */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600" />
              2. Published Instrument Search &amp; Necessity Audit
              <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                {allInstruments.length} SCALES INDEXED
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Churchill (1979) and Clark &amp; Watson (2019) mandate verifying that existing published scales cannot satisfy the measurement need before constructing a new instrument.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={() =>
                  onOpenAiAssistant(
                    `Let's systematically compare published psychological safety scales (Edmondson 1999, Clark 2020, Liang 2012, Kang 2023, O'Donovan 2020) against our intended construct "${intendedConstruct}". What are the critical gaps?`
                  )
                }
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Spar with Cognitive Partner
              </button>
            )}
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search published instruments by author, construct, year, or keyword (e.g. 'Edmondson', 'Clark', 'Digital', 'Healthcare', 'Voice')..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              />
            </div>

            <button
              type="button"
              onClick={handleDeepAiSearch}
              disabled={isAiSearching}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAiSearching ? 'Searching Literature...' : 'Deep AI Literature Search'}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              'All',
              'Recent (2018-2024)',
              'Multidimensional',
              'Healthcare & Clinical',
              'Digital & Hybrid Work',
              'Voice & Dissent',
              'Foundational',
            ].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
            <span>
              Found {filteredInstruments.length} peer-reviewed scales matching criteria:
            </span>
            <span className="text-slate-400 text-[11px]">Click "+ Add to Audit" to log why a scale is insufficient</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredInstruments.map(inst => {
              const isExpanded = expandedCardId === inst.id;
              const isAlreadyAudited = existingInstruments.some(e =>
                e.name.toLowerCase().includes(inst.name.toLowerCase()) ||
                e.citation.toLowerCase().includes(inst.authors.toLowerCase())
              );

              return (
                <div
                  key={inst.id}
                  className={`p-3.5 rounded-xl border transition text-xs flex flex-col justify-between space-y-2.5 ${
                    isAlreadyAudited
                      ? 'bg-emerald-50/30 border-emerald-300/80'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 leading-snug">{inst.name}</div>
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{inst.citation}</div>
                      </div>

                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded shrink-0 border border-slate-200">
                        {inst.year}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="bg-teal-50 text-teal-800 font-semibold px-1.5 py-0.5 rounded border border-teal-200">
                        {inst.itemCount} items
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {inst.categoryTag}
                      </span>
                      {inst.psychometrics.reportedAlpha && (
                        <span className="bg-purple-50 text-purple-700 font-semibold px-1.5 py-0.5 rounded border border-purple-200">
                          &alpha; = {inst.psychometrics.reportedAlpha}
                        </span>
                      )}
                      {inst.doi && (
                        <DoiBadge doi={inst.doi} onVerify={onOpenDoiChecker} />
                      )}
                    </div>

                    {/* Methodological Gap Callout */}
                    <div className="p-2 bg-amber-50/80 border border-amber-200/90 rounded-lg text-[11px] text-amber-950">
                      <span className="font-bold text-amber-900">Psychometric Limitation / Research Gap: </span>
                      {inst.limitationsAndGaps}
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-lg text-slate-700">
                        <div>
                          <strong>Sample Population: </strong>
                          {inst.samplePopulation}
                        </div>
                        <div>
                          <strong>Dimensions: </strong>
                          {inst.dimensions.join(', ')}
                        </div>
                        {inst.sampleItems && inst.sampleItems.length > 0 && (
                          <div>
                            <strong>Sample Items:</strong>
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
                              {inst.sampleItems.slice(0, 2).map((itm, itmIdx) => (
                                <li key={itmIdx}>"{itm}"</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCardId(isExpanded ? null : inst.id)}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-medium flex items-center gap-0.5"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {isExpanded ? 'Less' : 'Details'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {onOpenAiAssistant && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenAiAssistant(
                              `Why might ${inst.name} (${inst.year}) fail to adequately measure "${intendedConstruct}" in our target population "${targetPopulation}"?`
                            )
                          }
                          className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition"
                          title="Debate with Cognitive Partner"
                        >
                          <MessageSquare className="w-3 h-3 text-teal-600" /> Spar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddFromLibrary(inst)}
                        disabled={isAlreadyAudited}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                          isAlreadyAudited
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                            : 'bg-teal-700 hover:bg-teal-600 text-white shadow-2xs'
                        }`}
                      >
                        {isAlreadyAudited ? (
                          <>
                            <Check className="w-3 h-3" /> Added to Audit
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> Add to Audit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Researcher's Active Audit Log */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Documented Scale Audit Log ({existingInstruments.length} Scales Evaluated)
            </h4>
            <span className="text-[11px] text-slate-500">
              Required for peer-reviewed journal submission
            </span>
          </div>

          <div className="space-y-2.5">
            {existingInstruments.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  No existing instruments have been audited yet. Select scales from the library above or enter unlisted instruments below to establish that a new scale is warranted.
                </span>
              </div>
            ) : (
              existingInstruments.map((inst, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-slate-300 transition"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      {inst.doi && (
                        <DoiBadge doi={inst.doi} onVerify={onOpenDoiChecker} />
                      )}
                    </div>
                    <div className="text-slate-500 italic text-[11px]">{inst.citation}</div>
                    <div className="text-slate-700 mt-1.5 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <span className="font-bold text-slate-800">Why Insufficient / Research Gap: </span>
                      {inst.whyInsufficient}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingInstrument(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition self-start"
                    title="Remove from audit log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Manual Instrument with CrossRef DOI Auto-fill */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs mt-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Log Custom or Unlisted Published Scale
              </div>
              <span className="text-[11px] text-slate-500">Provide a DOI for automated CrossRef reference verification</span>
            </div>

            {/* DOI Input & Auto-fill Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="DOI (e.g. 10.1037/0021-9010.81.4.358 or https://doi.org/...)"
                  value={newInstDoi}
                  onChange={e => setNewInstDoi(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono placeholder:font-sans"
                />
              </div>
              <button
                type="button"
                onClick={handleDoiLookup}
                disabled={!newInstDoi.trim() || isVerifyingDoi}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5 text-teal-700" />
                {isVerifyingDoi ? 'Checking CrossRef...' : 'Verify & Auto-fill Metadata'}
              </button>
            </div>

            {doiLookupError && (
              <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{doiLookupError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Scale Name (e.g. Edmondson 1999 Team Psychological Safety)"
                value={newInstName}
                onChange={e => setNewInstName(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="Citation / Reference (Author, Year, Journal)"
                value={newInstCitation}
                onChange={e => setNewInstCitation(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Why is this existing instrument insufficient for your target population, dimensionality, or research context?"
              value={newInstWhy}
              onChange={e => setNewInstWhy(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addExistingInstrument}
                disabled={!newInstName.trim()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Audit Log
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Project setup and audit successfully saved!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Save Setup &amp; Mark Step 1 Completed
          </button>
        </div>
      </div>
    </div>
  );
};
