import React, { useState } from 'react';
import { ShieldCheck, Plus, X, Calendar, User, FileText, Tag } from 'lucide-react';
import { DecisionLogEntry } from '../types/scale';

interface DecisionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DecisionLogEntry[];
  onAddEntry: (entry: Omit<DecisionLogEntry, 'id' | 'timestamp'>) => void;
  currentStep?: number;
}

export const DecisionLogModal: React.FC<DecisionLogModalProps> = ({
  isOpen,
  onClose,
  entries,
  onAddEntry,
  currentStep = 1,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [stageName, setStageName] = useState(`Step ${currentStep}`);
  const [decisionType, setDecisionType] = useState<DecisionLogEntry['decisionType']>('item_revision');
  const [rationalSummary, setRationalSummary] = useState('');
  const [methodologicalJustification, setMethodologicalJustification] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [author, setAuthor] = useState('Lead Researcher');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rationalSummary) return;

    onAddEntry({
      stepNumber: currentStep,
      stageName,
      decisionType,
      title,
      rationalSummary,
      methodologicalJustification,
      evidenceReference: evidenceReference || undefined,
      author,
    });

    setTitle('');
    setRationalSummary('');
    setMethodologicalJustification('');
    setEvidenceReference('');
    setShowAddForm(false);
  };

  const getBadgeColor = (type: DecisionLogEntry['decisionType']) => {
    switch (type) {
      case 'item_exclusion':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'item_revision':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'factor_retention':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'model_respecification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Research Decision Log &amp; Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Transparently recording methodological judgments, exclusions, and factor decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> {showAddForm ? 'View Log' : 'Record Decision'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Record New Methodological Decision
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Decision Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Excluded item WPSS-09 due to cross-loading"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Decision Category</label>
                  <select
                    value={decisionType}
                    onChange={e => setDecisionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="item_exclusion">Item Exclusion</option>
                    <option value="item_revision">Item Revision</option>
                    <option value="dimension_adjustment">Dimension Adjustment</option>
                    <option value="factor_retention">Factor Retention (EFA)</option>
                    <option value="model_respecification">Model Respecification (CFA)</option>
                    <option value="sample_exclusion">Sample / Outlier Exclusion</option>
                    <option value="methodological_divergence">Methodological Divergence</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rationale Summary</label>
                <textarea
                  rows={2}
                  required
                  value={rationalSummary}
                  onChange={e => setRationalSummary(e.target.value)}
                  placeholder="Explain why this decision was made and what empirical or conceptual signals triggered it..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Methodological Justification (Citations / Rules)</label>
                <textarea
                  rows={2}
                  value={methodologicalJustification}
                  onChange={e => setMethodologicalJustification(e.target.value)}
                  placeholder="e.g. In accordance with Clark & Watson (2019) item purification criteria and Tabachnick & Fidell (2013)..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Evidence / Metric Reference</label>
                  <input
                    type="text"
                    value={evidenceReference}
                    onChange={e => setEvidenceReference(e.target.value)}
                    placeholder="e.g. I-CVI = 0.50, Primary loading = 0.31, Cross-loading = 0.44"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Recorded By</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300" />
                  <p className="text-sm">No researcher decisions recorded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Log item exclusions, factor retentions, and revisions here to preserve an academic audit trail.
                  </p>
                </div>
              ) : (
                entries.map(entry => (
                  <div
                    key={entry.id}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${getBadgeColor(
                              entry.decisionType
                            )}`}
                          >
                            {entry.decisionType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            Step {entry.stepNumber}: {entry.stageName}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{entry.title}</h4>
                      </div>
                      <div className="text-right text-xs text-slate-400 shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{entry.author}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-700 leading-relaxed">
                      {entry.rationalSummary}
                    </div>

                    {entry.methodologicalJustification && (
                      <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Methodological Basis: </span>
                        {entry.methodologicalJustification}
                      </div>
                    )}

                    {entry.evidenceReference && (
                      <div className="mt-2 text-xs font-mono text-teal-800 bg-teal-50 px-2 py-1 rounded inline-block">
                        Evidence Reference: {entry.evidenceReference}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
