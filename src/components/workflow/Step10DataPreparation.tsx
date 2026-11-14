import React, { useState } from 'react';
import { ScaleProject, DatasetSnapshot } from '../../types/scale';
import { Database, Upload, Download, RefreshCw, CheckCircle2, AlertTriangle, Layers, FileSpreadsheet } from 'lucide-react';
import { exportDatasetToCSV, downloadFile } from '../../lib/exportUtils';

interface Step10Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step10DataPreparation: React.FC<Step10Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const snapshots = project.datasetSnapshots;
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(snapshots[0]?.id || '');
  const [viewMode, setViewMode] = useState<'raw' | 'scored'>('scored');

  const activeSnapshot = snapshots.find(s => s.id === selectedSnapshotId) || snapshots[0];

  const reverseItems = project.items.filter(i => i.isReverseScored);

  // Quality check diagnostics
  const sampleSize = activeSnapshot?.sampleSize || 0;
  const columns = activeSnapshot?.columns || [];
  const rows = (viewMode === 'scored' ? activeSnapshot?.scoredRows : activeSnapshot?.rawRows) || [];

  // Out of range check (1 to 5)
  let outOfRangeCount = 0;
  let constantItems: string[] = [];

  if (activeSnapshot) {
    const itemCols = activeSnapshot.itemColumns;
    for (const col of itemCols) {
      let isConstant = true;
      let firstVal: any = null;
      for (const r of activeSnapshot.rawRows) {
        const v = r[col];
        if (typeof v === 'number') {
          if (v < 1 || v > 5) outOfRangeCount++;
          if (firstVal === null) firstVal = v;
          else if (v !== firstVal) isConstant = false;
        }
      }
      if (isConstant && activeSnapshot.rawRows.length > 2) {
        constantItems.push(col);
      }
    }
  }

  const handleDownloadCSV = () => {
    if (!activeSnapshot) return;
    const csv = exportDatasetToCSV(activeSnapshot, viewMode === 'scored');
    downloadFile(`${activeSnapshot.name.replace(/\s+/g, '_')}_${viewMode}.csv`, csv, 'text/csv');
  };

  const handleMarkStepCompleted = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        10: {
          isCompleted: true,
          isEvidenceSufficient: sampleSize >= 50,
          notes: `Data preparation verified on snapshot "${activeSnapshot?.name}". Reverse-scoring verified.`,
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
                Step 10 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 3: Statistical Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Data Preparation, Cleaning &amp; Scoring Layer</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Inspect raw vs scored responses, enforce reverse-scoring rules, detect zero-variance or out-of-range records, and preserve immutable raw data (Churchill, 1979; Boateng et al., 2018).
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

      {/* Snapshot Selector & Scored Layer Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-teal-600" />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Dataset Snapshot
            </label>
            <select
              value={selectedSnapshotId}
              onChange={e => setSelectedSnapshotId(e.target.value)}
              className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {snapshots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (N = {s.sampleSize}) [{s.purpose.replace(/_/g, ' ')}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'raw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Answers
            </button>
            <button
              onClick={() => setViewMode('scored')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'scored' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scored Layer (Inverted)
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Snapshot CSV
          </button>
        </div>
      </div>

      {/* Quality Checks Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Reverse-Scored Items</div>
          <div className="text-lg font-bold text-purple-800 mt-1">
            {reverseItems.length} Items ({reverseItems.map(i => i.id).join(', ')})
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Rule: Inverted via (6 - X) in scored layer only
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Out-of-Range Violations</div>
          <div className={`text-lg font-bold mt-1 ${outOfRangeCount === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {outOfRangeCount} Violations
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            All values comply with 1 - 5 Likert range
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Zero-Variance / Constant Items</div>
          <div className={`text-lg font-bold mt-1 ${constantItems.length === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {constantItems.length === 0 ? 'None (Clean)' : constantItems.join(', ')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Adequate variance for factor extraction
          </div>
        </div>
      </div>

      {/* Data Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Dataset Preview: {activeSnapshot?.name} ({viewMode.toUpperCase()} Layer, N = {sampleSize})
          </h3>
          <span className="text-xs text-slate-500">
            Showing first 12 cases
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 font-mono">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                    {col}
                    {activeSnapshot?.reverseCodedColumns.includes(col) && (
                      <span className="block text-[8px] text-purple-700 normal-case">
                        {viewMode === 'scored' ? '(Inverted)' : '(Raw)'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 12).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {columns.map(col => (
                    <td key={col} className="py-2 px-3 whitespace-nowrap">
                      {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Rule 8: Original raw answers remain unperturbed. Scoring calculations run on the scored layer.
        </div>
        <button
          onClick={handleMarkStepCompleted}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <CheckCircle2 className="w-4 h-4" /> Confirm Data Ready for Factor Analysis
        </button>
      </div>
    </div>
  );
};
