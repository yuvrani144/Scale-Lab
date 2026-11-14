import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  BookOpen,
  ShieldCheck,
  FileText,
  BookmarkPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cleanDoi } from './DoiBadge';

interface DoiReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoi?: string;
  onImportReference?: (ref: {
    citation: string;
    doi: string;
    title: string;
    authors: string[];
    year: string;
  }) => void;
}

interface DoiResult {
  valid: boolean;
  source?: string;
  doi: string;
  doiUrl: string;
  title: string;
  authors: string[];
  containerTitle: string;
  year: number | string | null;
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  citationCount?: number | null;
  type?: string;
  apaCitation: string;
  localInstrumentMatch?: { id: string; name: string } | null;
  error?: string;
  notice?: string;
}

interface SearchCandidate {
  doi: string;
  doiUrl: string;
  title: string;
  authors: string[];
  containerTitle: string;
  year: number | string;
  publisher: string;
  citationCount: number | null;
  apaCitation: string;
}

const SEMINAL_FOUNDATION_DOIS = [
  {
    citation: 'Churchill, G. A. (1979)',
    title: 'A Paradigm for Developing Better Measures of Marketing Constructs',
    journal: 'Journal of Marketing Research, 16(1), 64-73',
    doi: '10.1177/002224377901600110',
    role: 'Construct boundary definition & domain sampling foundation',
  },
  {
    citation: 'Clark, L. A., & Watson, D. (1995)',
    title: 'Constructing Validity: Basic Issues in Objective Scale Development',
    journal: 'Psychological Assessment, 7(3), 309-319',
    doi: '10.1037/1040-3590.7.3.309',
    role: 'Item purification & factor dimensionality foundation',
  },
  {
    citation: 'Clark, L. A., & Watson, D. (2019)',
    title: 'Constructing Validity: New Developments in Creating Objective Measuring Instruments',
    journal: 'Psychological Assessment, 31(12), 1412-1427',
    doi: '10.1037/pas0000626',
    role: 'Independent holdout cross-validation & modern psychometrics',
  },
  {
    citation: 'Hinkin, T. R. (1998)',
    title: 'A Brief Tutorial on the Development of Measures for Use in Survey Questionnaires',
    journal: 'Organizational Research Methods, 1(1), 104-121',
    doi: '10.1177/109442819800100106',
    role: 'Item generation, sample ratio & item retention standards',
  },
  {
    citation: 'Boateng, G. O., et al. (2018)',
    title: 'Best Practices for Developing and Validating Scales for Health, Social, and Behavioral Research: A Primer',
    journal: 'Frontiers in Public Health, 6, 149',
    doi: '10.3389/fpubh.2018.00149',
    role: '9-Phase scale validation roadmap',
  },
  {
    citation: 'Bollen, K., & Lennox, R. (1991)',
    title: 'Conventional Wisdom on Measurement: A Structural Equation Perspective',
    journal: 'Psychological Bulletin, 110(2), 305-314',
    doi: '10.1037/0033-2909.110.2.305',
    role: 'Reflective vs. formative measurement model distinction',
  },
  {
    citation: 'Hu, L., & Bentler, P. M. (1999)',
    title: 'Cutoff criteria for fit indexes in covariance structure analysis',
    journal: 'Structural Equation Modeling, 6(1), 1-55',
    doi: '10.1080/10705519909540118',
    role: 'Confirmatory Factor Analysis combinatorial fit criteria',
  },
  {
    citation: 'Polit, D. F., & Beck, C. T. (2006)',
    title: 'The Content Validity Index: Are You Sure You Know What\'s Being Reported?',
    journal: 'Research in Nursing & Health, 29(5), 489-497',
    doi: '10.1002/nur.20147',
    role: 'Item-level & scale-level CVI computation standard',
  },
  {
    citation: 'Henseler, J., Ringle, C. M., & Sarstedt, M. (2015)',
    title: 'A new criterion for assessing discriminant validity in variance-based structural equation modeling: HTMT',
    journal: 'Journal of the Academy of Marketing Science, 43(1), 115-135',
    doi: '10.1007/s11747-014-0403-8',
    role: 'Heterotrait-Monotrait (HTMT) discriminant validity ratio',
  },
];

export const DoiReferenceModal: React.FC<DoiReferenceModalProps> = ({
  isOpen,
  onClose,
  initialDoi,
  onImportReference,
}) => {
  const [activeTab, setActiveTab] = useState<'verify' | 'search' | 'foundations'>('verify');
  const [doiInput, setDoiInput] = useState(initialDoi || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [result, setResult] = useState<DoiResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedApa, setCopiedApa] = useState(false);
  const [copiedDoi, setCopiedDoi] = useState(false);
  const [imported, setImported] = useState(false);

  // Sync initialDoi when modal opens
  useEffect(() => {
    if (initialDoi && isOpen) {
      setDoiInput(initialDoi);
      setActiveTab('verify');
      handleVerifyDoi(initialDoi);
    }
  }, [initialDoi, isOpen]);

  if (!isOpen) return null;

  const handleVerifyDoi = async (doiToVerify?: string) => {
    const raw = (doiToVerify || doiInput).trim();
    const target = cleanDoi(raw);
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCopiedApa(false);
    setCopiedDoi(false);
    setImported(false);

    try {
      const res = await fetch(`/api/references/check-doi?doi=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok && !data.valid) {
        setError(data.error || `DOI "${target}" could not be resolved via CrossRef registry.`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(`Failed to verify DOI: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDoi = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/references/search-doi?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyApa = () => {
    if (!result?.apaCitation) return;
    navigator.clipboard.writeText(result.apaCitation);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const handleCopyDoi = () => {
    if (!result?.doiUrl) return;
    navigator.clipboard.writeText(result.doiUrl);
    setCopiedDoi(true);
    setTimeout(() => setCopiedDoi(false), 2000);
  };

  const handleImport = () => {
    if (!result || !onImportReference) return;
    onImportReference({
      citation: result.apaCitation,
      doi: result.doi,
      title: result.title,
      authors: result.authors,
      year: result.year ? String(result.year) : '',
    });
    setImported(true);
    setTimeout(() => setImported(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-xl text-slate-950 font-black shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">DOI Reference Checker &amp; Registry Verifier</h3>
                <span className="text-[10px] bg-teal-900 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-700">
                  CROSSREF VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verify persistent digital object identifiers (DOIs) and generate APA 7th citations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-2 bg-slate-50 text-xs">
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-2 rounded-t-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? 'bg-white text-teal-800 border-t border-x border-slate-200 font-bold -mb-px shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-teal-600" />
            Verify by DOI
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-2 rounded-t-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-white text-teal-800 border-t border-x border-slate-200 font-bold -mb-px shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Search CrossRef by Title / Author
          </button>

          <button
            onClick={() => setActiveTab('foundations')}
            className={`px-3 py-2 rounded-t-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'foundations'
                ? 'bg-white text-teal-800 border-t border-x border-slate-200 font-bold -mb-px shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            Core Methodology DOIs
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: VERIFY BY DOI */}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleVerifyDoi();
                }}
                className="space-y-2"
              >
                <label className="block text-xs font-semibold text-slate-700">
                  Enter DOI or URL to Verify
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">doi:</span>
                    <input
                      type="text"
                      placeholder="e.g. 10.2307/2666999 or https://doi.org/10.1177/002224377901600110"
                      value={doiInput}
                      onChange={e => setDoiInput(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !doiInput.trim()}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Check DOI
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts standard DOIs (10.xxxx/...), full doi.org URLs, or dx.doi.org links. Queries CrossRef official metadata API.
                </p>
              </form>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">{error}</div>
                    {result?.doiUrl && (
                      <a
                        href={result.doiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-700 underline font-medium flex items-center gap-1 text-[11px]"
                      >
                        Try opening directly on doi.org <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Verified Result Card */}
              {result && result.valid && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          VERIFIED CANONICAL DOI
                        </span>
                        <span className="text-slate-400 text-[10px]">{result.type}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{result.title}</h4>
                      {result.authors.length > 0 && (
                        <div className="text-slate-600 text-xs">
                          {result.authors.join(', ')}
                        </div>
                      )}
                    </div>

                    <a
                      href={result.doiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs"
                    >
                      <span>Open on doi.org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Journal / Source</span>
                      <span className="font-semibold text-slate-800">{result.containerTitle || 'Academic Press'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Year &amp; Volume</span>
                      <span className="font-semibold text-slate-800">
                        {result.year || 'N/A'} {result.volume ? `Vol. ${result.volume}` : ''} {result.issue ? `(${result.issue})` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Publisher</span>
                      <span className="font-semibold text-slate-800 truncate block">{result.publisher || 'Peer-reviewed'}</span>
                    </div>

                    {result.citationCount !== null && result.citationCount !== undefined && (
                      <div>
                        <span className="text-slate-400 block">CrossRef Citations</span>
                        <span className="font-semibold text-teal-700">{result.citationCount.toLocaleString()} citations</span>
                      </div>
                    )}

                    <div className="col-span-2">
                      <span className="text-slate-400 block">Persistent Identifier</span>
                      <span className="font-mono text-slate-700 font-medium">{result.doi}</span>
                    </div>
                  </div>

                  {/* APA 7 Citation Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>APA 7th Edition Citation</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyApa}
                          className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                        >
                          {copiedApa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedApa ? 'Copied Citation!' : 'Copy APA'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleCopyDoi}
                          className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                        >
                          {copiedDoi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedDoi ? 'Copied URL!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 text-[11px] font-serif leading-relaxed">
                      {result.apaCitation}
                    </div>
                  </div>

                  {/* Import Button */}
                  {onImportReference && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={imported}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          imported
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-white shadow-2xs'
                        }`}
                      >
                        {imported ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Imported into Project!
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" /> Import Reference into ScaleLab
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH CROSSREF BY TITLE / AUTHOR */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSearchDoi();
                }}
                className="space-y-2"
              >
                <label className="block text-xs font-semibold text-slate-700">
                  Search Peer-Reviewed Literature for Official DOI
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter article title, author, or keywords (e.g. 'Edmondson psychological safety 1999')..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </div>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Matches from CrossRef Registry ({searchResults.length}):
                  </div>

                  {searchResults.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 leading-snug">{cand.title}</div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded shrink-0">
                          {cand.year}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 italic">
                        {cand.authors.slice(0, 3).join(', ')} &bull; {cand.containerTitle}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          DOI: {cand.doi}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={cand.doiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100"
                          >
                            Open <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setDoiInput(cand.doi);
                              setActiveTab('verify');
                              handleVerifyDoi(cand.doi);
                            }}
                            className="px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-[11px] font-semibold transition"
                          >
                            Inspect &amp; Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CORE METHODOLOGY DOIS */}
          {activeTab === 'foundations' && (
            <div className="space-y-3">
              <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200 text-xs text-teal-950">
                <div className="font-bold mb-0.5 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  Canonical Methodological Citations &amp; DOIs
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  These peer-reviewed publications provide the epistemological foundations of ScaleLab. Every DOI is verified and links directly to the publisher's digital record.
                </p>
              </div>

              <div className="space-y-2">
                {SEMINAL_FOUNDATION_DOIS.map((sem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900">{sem.citation}: {sem.title}</div>
                      <a
                        href={`https://doi.org/${sem.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:text-teal-900 shrink-0 p-1 rounded hover:bg-teal-50"
                        title="Open on doi.org"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="text-[11px] text-slate-500 italic">{sem.journal}</div>

                    <div className="text-[11px] text-teal-800 bg-teal-50/50 p-1.5 rounded border border-teal-100">
                      <strong>Methodological Role: </strong>{sem.role}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-[10px] text-slate-600">DOI: {sem.doi}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDoiInput(sem.doi);
                          setActiveTab('verify');
                          handleVerifyDoi(sem.doi);
                        }}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" /> Check Registry Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
