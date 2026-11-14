import React, { useState } from 'react';
import { ScaleProject, ScaleItem, ItemStatus, ResponseFormatType, HeuristicFlag } from '../../types/scale';
import { Plus, Filter, Search, AlertTriangle, History, Check, X, Sparkles, Download, Upload, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { exportItemBankToCSV, downloadFile } from '../../lib/exportUtils';

interface Step3Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenAiAssistant: () => void;
}

export const Step3ItemBank: React.FC<Step3Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenAiAssistant,
}) => {
  const [filterDimension, setFilterDimension] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New item form
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemWording, setItemWording] = useState('');
  const [dimensionId, setDimensionId] = useState(project.dimensions[0]?.id || '');
  const [sourceOrRationale, setSourceOrRationale] = useState('');
  const [generationMethod, setGenerationMethod] = useState<ScaleItem['generationMethod']>('deductive_literature');
  const [responseFormat, setResponseFormat] = useState<ResponseFormatType>('likert_5');
  const [isReverseScored, setIsReverseScored] = useState(false);
  const [reverseRationale, setReverseRationale] = useState('');

  // Item status edit modal
  const [selectedItemForStatus, setSelectedItemForStatus] = useState<ScaleItem | null>(null);
  const [newStatus, setNewStatus] = useState<ItemStatus>('retained');
  const [statusRationale, setStatusRationale] = useState('');

  // Revision history modal
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<ScaleItem | null>(null);

  // Real-time client-side heuristic check
  const checkHeuristics = (text: string): HeuristicFlag[] => {
    const flags: HeuristicFlag[] = [];
    const lower = text.toLowerCase();

    if (lower.includes(' and ') && (lower.length > 55 || lower.includes(' or '))) {
      flags.push({
        type: 'double_barrelled',
        severity: 'warning',
        message: 'May contain multiple propositions joined by "and".',
        suggestion: 'Focus on a single specific action or thought.',
      });
    }

    if (lower.includes('never') || lower.includes('always') || lower.includes('completely')) {
      flags.push({
        type: 'extreme_wording',
        severity: 'caution',
        message: 'Absolute words ("always", "never") skew variance and reduce discrimination.',
      });
    }

    if (lower.includes('should') || lower.includes('ought')) {
      flags.push({
        type: 'leading',
        severity: 'info',
        message: 'Prescriptive language ("should", "ought") may elicit social desirability bias.',
      });
    }

    return flags;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemWording.trim()) return;

    const prefix = project.title ? project.title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'ITEM';
    const nextNum = project.items.length + 1;
    const stableId = `${prefix || 'SCL'}-${String(nextNum).padStart(2, '0')}`;

    const flags = checkHeuristics(itemWording);

    const newItem: ScaleItem = {
      id: stableId,
      wording: itemWording.trim(),
      dimensionId,
      sourceOrRationale: sourceOrRationale.trim() || 'Deductively formulated based on construct scope.',
      generationMethod,
      responseFormat,
      isReverseScored,
      reverseRationale: isReverseScored ? reverseRationale.trim() : undefined,
      status: 'retained',
      heuristicFlags: flags,
      revisions: [],
      order: project.items.length + 1,
    };

    const updatedItems = [...project.items, newItem];
    onUpdateProject({
      items: updatedItems,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        3: {
          isCompleted: true,
          isEvidenceSufficient: updatedItems.length >= 6,
          notes: `${updatedItems.length} items logged in item bank.`,
        },
      },
    });

    // Reset
    setItemWording('');
    setSourceOrRationale('');
    setIsReverseScored(false);
    setReverseRationale('');
    setShowAddModal(false);
  };

  const handleUpdateItemStatus = () => {
    if (!selectedItemForStatus || !statusRationale.trim()) return;

    const updatedItems = project.items.map(it => {
      if (it.id === selectedItemForStatus.id) {
        return {
          ...it,
          status: newStatus,
          statusRationale: statusRationale.trim(),
        };
      }
      return it;
    });

    onUpdateProject({
      items: updatedItems,
    });

    // Also append to decision log!
    fetch(`/api/projects/${project.id}/decision-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: 3,
        stageName: 'Item Bank',
        decisionType: newStatus === 'removed' ? 'item_exclusion' : 'item_revision',
        title: `Item ${selectedItemForStatus.id} status changed to ${newStatus.toUpperCase()}`,
        rationalSummary: statusRationale.trim(),
        methodologicalJustification: 'Researcher judgment required for item modifications according to Clark & Watson (2019).',
        impactedItemIds: [selectedItemForStatus.id],
        author: 'Researcher',
      }),
    });

    setSelectedItemForStatus(null);
    setStatusRationale('');
  };

  const filteredItems = project.items.filter(item => {
    if (filterDimension !== 'all' && item.dimensionId !== filterDimension) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.id.toLowerCase().includes(q) || item.wording.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'retained':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'revised':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'removed':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Stage Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 3 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 1: Item Development</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Item Generation &amp; Central Item Bank</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Store stable item IDs, wording, dimensions, response formats, reverse-scoring rationale, and heuristic quality checks (Hinkin, 1998; Boateng et al., 2018).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiAssistant}
              className="text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Item Suggestions
            </button>
            <button
              onClick={onOpenMethodology}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              Methodological Basis
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search items by ID or wording..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterDimension}
            onChange={e => setFilterDimension(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Dimensions</option>
            {project.dimensions.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="retained">Retained</option>
            <option value="revised">Revised</option>
            <option value="removed">Removed / Excluded</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = exportItemBankToCSV(project.items);
              downloadFile(`${project.title.replace(/\s+/g, '_')}_item_bank.csv`, csv, 'text/csv');
            }}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> + New Item
          </button>
        </div>
      </div>

      {/* Item Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-24">ID</th>
                <th className="py-3 px-4">Item Wording</th>
                <th className="py-3 px-3 w-32">Dimension</th>
                <th className="py-3 px-3 w-28">Method / Scoring</th>
                <th className="py-3 px-3 w-24">Status</th>
                <th className="py-3 px-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const dim = project.dimensions.find(d => d.id === item.dimensionId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.id}
                        {item.isAiSuggestion && (
                          <span className="block text-[9px] text-teal-700 font-sans font-medium">AI Suggestion</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 leading-snug">{item.wording}</div>
                        {item.heuristicFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.heuristicFlags.map((flag, idx) => (
                              <span
                                key={idx}
                                title={flag.message}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-800 border border-amber-200"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {flag.type.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.statusRationale && item.status === 'removed' && (
                          <div className="text-[11px] text-rose-700 mt-1 italic">
                            Exclusion rationale: {item.statusRationale}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                          {dim?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-3 space-y-0.5">
                        <div className="text-[11px] text-slate-500 capitalize">
                          {item.generationMethod.replace('_', ' ')}
                        </div>
                        {item.isReverseScored ? (
                          <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Reverse-Scored
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Direct</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedItemForStatus(item);
                            setNewStatus(item.status);
                            setStatusRationale(item.statusRationale || '');
                          }}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded transition"
                          title="Change item status / log decision"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {item.revisions.length > 0 && (
                          <button
                            onClick={() => setSelectedItemForHistory(item)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded transition"
                            title="View revision history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Scale Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Item Wording</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter exact declarative statement..."
                  value={itemWording}
                  onChange={e => setItemWording(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                {itemWording && checkHeuristics(itemWording).length > 0 && (
                  <div className="mt-1 text-amber-700 text-[11px] bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-bold">Heuristic flag detected: </span>
                    {checkHeuristics(itemWording).map(f => f.message).join(' ')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Dimension</label>
                  <select
                    value={dimensionId}
                    onChange={e => setDimensionId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {project.dimensions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Generation Method</label>
                  <select
                    value={generationMethod}
                    onChange={e => setGenerationMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="deductive_literature">Deductive (Literature/Theory)</option>
                    <option value="inductive_qualitative">Inductive (Interviews/Focus Groups)</option>
                    <option value="expert_panel">Expert Panel Proposition</option>
                    <option value="ai_suggested_adapted">AI-Assisted Suggestion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Theoretical Source or Rationale</label>
                <input
                  type="text"
                  placeholder="e.g. Edmondson (1999) error discussion facet"
                  value={sourceOrRationale}
                  onChange={e => setSourceOrRationale(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isReverseScored}
                    onChange={e => setIsReverseScored(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-800">Reverse-Scored Item</span>
                </label>

                {isReverseScored && (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Reverse Scoring Rationale (Why is inverted wording necessary?):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Measures punitive blame; high rating indicates absence of safety"
                      value={reverseRationale}
                      onChange={e => setReverseRationale(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status & Decision Modal */}
      {selectedItemForStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Update Status for {selectedItemForStatus.id}
              </h3>
              <button
                onClick={() => setSelectedItemForStatus(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              "{selectedItemForStatus.wording}"
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ItemStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="retained">Retained (Active in measurement instrument)</option>
                  <option value="revised">Revised (Wording altered)</option>
                  <option value="removed">Removed / Excluded (Purified out)</option>
                  <option value="draft">Draft (Under discussion)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Required Methodological Rationale (Audited in Decision Log)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this item is being retained, revised, or removed (e.g. low I-CVI, cross-loading, cognitive ambiguity)..."
                  value={statusRationale}
                  onChange={e => setStatusRationale(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForStatus(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!statusRationale.trim()}
                  onClick={handleUpdateItemStatus}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  Confirm &amp; Log Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {selectedItemForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Revision History: {selectedItemForHistory.id}
              </h3>
              <button
                onClick={() => setSelectedItemForHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
              {selectedItemForHistory.revisions.map((rev, idx) => (
                <div key={rev.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{new Date(rev.timestamp).toLocaleString()}</span>
                    <span>{rev.author}</span>
                  </div>
                  <div className="text-slate-500 line-through">"{rev.previousWording}"</div>
                  <div className="font-medium text-slate-900">"{rev.newWording}"</div>
                  <div className="text-[11px] text-teal-800 italic mt-1">
                    Rationale: {rev.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
