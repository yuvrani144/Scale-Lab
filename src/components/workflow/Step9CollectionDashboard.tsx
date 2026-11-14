import React, { useState } from 'react';
import { ScaleProject, ParticipantSubmission, DatasetSnapshot } from '../../types/scale';
import { Activity, Clock, ShieldAlert, Download, Camera, CheckCircle2, AlertTriangle, Users, Layers } from 'lucide-react';
import { exportDatasetToCSV, downloadFile } from '../../lib/exportUtils';

interface Step9Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step9CollectionDashboard: React.FC<Step9Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const [selectedSnapshotName, setSelectedSnapshotName] = useState('');
  const [snapshotPurpose, setSnapshotPurpose] = useState<DatasetSnapshot['purpose']>('main_development_study');
  const [snapshotCreatedNotice, setSnapshotCreatedNotice] = useState(false);

  const submissions = project.submissions;
  const totalSubmissions = submissions.length;

  // Completion durations
  const durations = submissions.map(s => s.durationSeconds || 0).filter(d => d > 0);
  const avgDurationSeconds = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const speedersCount = submissions.filter(s => s.isQualityFlagged && s.qualityFlags.includes('speeding')).length;

  // Retained item IDs
  const retainedItemIds = project.items.filter(i => i.status === 'retained').map(i => i.id);

  // Freeze Snapshot Handler
  const handleCreateSnapshot = () => {
    if (totalSubmissions === 0) return;

    const rawRows = submissions.map(s => ({
      id: s.id,
      participantCode: s.participantCode || s.id,
      wave: s.wave || 1,
      durationSeconds: s.durationSeconds,
      ...s.answers,
    }));

    const reverseKeys = project.items.filter(i => i.isReverseScored).map(i => i.id.replace(/-/g, '_'));

    // Score rows
    const scoredRows = rawRows.map(row => {
      const scored: Record<string, any> = { ...row };
      for (const k of reverseKeys) {
        if (typeof scored[k] === 'number') {
          scored[k] = 6 - scored[k]; // 5-point scale inversion
        }
      }
      return scored;
    });

    const columns = ['id', 'participantCode', 'durationSeconds', ...retainedItemIds.map(id => id.replace(/-/g, '_'))];

    const snapshot: DatasetSnapshot = {
      id: `snap-${Date.now()}`,
      name: selectedSnapshotName.trim() || `Snapshot_${new Date().toISOString().substring(0, 10)}_N${totalSubmissions}`,
      createdAt: new Date().toISOString(),
      purpose: snapshotPurpose,
      surveyVersionNumber: project.currentSurveyVersionNumber,
      sampleSize: totalSubmissions,
      columns,
      itemColumns: retainedItemIds.map(id => id.replace(/-/g, '_')),
      rawRows,
      scoredRows,
      reverseCodedColumns: reverseKeys,
      missingDataImputation: 'none_listwise',
      notes: `Frozen snapshot of ${totalSubmissions} live survey responses.`,
    };

    const updatedSnapshots = [snapshot, ...project.datasetSnapshots];
    onUpdateProject({
      datasetSnapshots: updatedSnapshots,
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        9: {
          isCompleted: true,
          isEvidenceSufficient: totalSubmissions >= 30,
          notes: `${totalSubmissions} responses recorded; snapshot created.`,
        },
      },
    });

    setSelectedSnapshotName('');
    setSnapshotCreatedNotice(true);
    setTimeout(() => setSnapshotCreatedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Step 9 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 2: Scale Administration</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Response Collection Dashboard &amp; Quality Screening</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Monitor live participant submissions, inspect completion-time distributions, flag low-quality patterns, and freeze analysis snapshots (Boateng et al., 2018).
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across Version {project.currentSurveyVersionNumber}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Average Duration</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {Math.floor(avgDurationSeconds / 60)}m {avgDurationSeconds % 60}s
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target: 3 - 6 minutes
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Quality Review Flags</div>
          <div className={`text-2xl font-black mt-1 ${speedersCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {speedersCount} Flags
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {speedersCount > 0 ? 'Speeding flagged (< 1.5s/item)' : 'No speeding anomalies detected'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Frozen Snapshots</div>
          <div className="text-2xl font-black text-teal-800 mt-1">{project.datasetSnapshots.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Preserved for statistical modeling
          </div>
        </div>
      </div>

      {/* Freeze Snapshot Section (Critical for Rule 8 & Step 9) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-600" /> Freeze Analysis Snapshot
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lock current data for reproducible analysis while live collection continues. Analysis results stay tied to this frozen snapshot.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Snapshot Name</label>
            <input
              type="text"
              placeholder={`e.g. Main_Study_Holdout_N${totalSubmissions}`}
              value={selectedSnapshotName}
              onChange={e => setSelectedSnapshotName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Study Purpose / Split</label>
            <select
              value={snapshotPurpose}
              onChange={e => setSnapshotPurpose(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
            >
              <option value="main_development_study">Main Development / Calibration (EFA)</option>
              <option value="independent_validation_study">Independent Validation Holdout (CFA)</option>
              <option value="pilot_study">Pilot Study Exploration</option>
              <option value="test_retest_followup">Test-Retest Wave 2 Follow-up</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateSnapshot}
              disabled={totalSubmissions === 0}
              className="w-full py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Freeze Dataset Snapshot (N = {totalSubmissions})
            </button>
          </div>
        </div>

        {snapshotCreatedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Analysis snapshot successfully locked and archived! It is now available in Step 10 (Data Preparation) and Steps 11-13 (Factor Analysis &amp; Validity).
            </span>
          </div>
        )}
      </div>

      {/* Recent Submissions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Live Submissions Log ({submissions.length} Total)
          </h3>
          <span className="text-xs text-slate-500">
            Raw respondent data (Direct identifiers excluded)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Receipt ID</th>
                <th className="py-2.5 px-3">Submitted At</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Version</th>
                <th className="py-2.5 px-3">Participant Code</th>
                <th className="py-2.5 px-3">Quality Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No submissions received yet. Open collection and share your survey link.
                  </td>
                </tr>
              ) : (
                submissions.slice(0, 15).map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{sub.id.substring(0, 14)}...</td>
                    <td className="py-2 px-3">{new Date(sub.submittedAt).toLocaleTimeString()}</td>
                    <td className="py-2 px-3">{sub.durationSeconds}s</td>
                    <td className="py-2 px-3">V{sub.surveyVersionNumber}</td>
                    <td className="py-2 px-3 font-mono">{sub.participantCode || 'Anonymous'}</td>
                    <td className="py-2 px-3">
                      {sub.isQualityFlagged ? (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-semibold">
                          {sub.qualityFlags.join(', ')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Clean</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
