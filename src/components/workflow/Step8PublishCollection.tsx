import React, { useState, useEffect } from 'react';
import { ScaleProject } from '../../types/scale';
import { Globe, QrCode, Copy, Check, ExternalLink, Shield, Users, Clock, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface Step8Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
  onOpenPreview: () => void;
}

export const Step8PublishCollection: React.FC<Step8Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
  onOpenPreview,
}) => {
  const [isCollectionOpen, setIsCollectionOpen] = useState(project.isCollectionOpen);
  const [responseCap, setResponseCap] = useState(project.collectionSettings.responseCap || 300);
  const [allowAnonymous, setAllowAnonymous] = useState(project.collectionSettings.allowAnonymous);
  const [requirePseudonymCode, setRequirePseudonymCode] = useState(project.collectionSettings.requirePseudonymCode);
  const [completionMessage, setCompletionMessage] = useState(project.collectionSettings.completionMessage);

  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const appOrigin = window.location.origin;
  const surveyUrl = `${appOrigin}/?surveyId=${project.id}`;

  useEffect(() => {
    // Fetch real QR code from server
    fetch(`/api/surveys/${project.id}/qr`)
      .then(res => res.json())
      .then(data => {
        if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
      })
      .catch(() => {});
  }, [project.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleCollection = () => {
    const newState = !isCollectionOpen;
    setIsCollectionOpen(newState);
    onUpdateProject({
      isCollectionOpen: newState,
      collectionSettings: {
        ...project.collectionSettings,
        responseCap,
        allowAnonymous,
        requirePseudonymCode,
        completionMessage,
      },
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        8: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: `Response collection ${newState ? 'opened' : 'closed'} at ${new Date().toLocaleTimeString()}.`,
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
                Step 8 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 2: Scale Administration</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Publishing &amp; Live Participant Collection</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Distribute live shareable links and QR codes, configure anonymous or pseudonymous collection, and manage participation caps.
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

      {/* Collection Status Control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isCollectionOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Collection Status: </span>
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider ${
                isCollectionOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {isCollectionOpen ? 'Active & Receiving Submissions' : 'Closed'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Current Submissions: <strong className="text-slate-800">{project.submissions.length}</strong> / Cap: {responseCap}
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleCollection}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
            isCollectionOpen
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
          }`}
        >
          {isCollectionOpen ? 'Close Survey Collection' : 'Open Survey Collection'}
        </button>
      </div>

      {/* Shareable Link & QR Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Shareable Participant Link &amp; Access Controls
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Live Participant URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                {copiedLink ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
              </button>
              <button
                onClick={onOpenPreview}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Test Link
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-semibold text-xs text-slate-900">Pseudonymous Participant Codes</div>
                <div className="text-[11px] text-slate-500">
                  Required for linking Wave 1 and Wave 2 in test-retest reliability designs without storing names or emails.
                </div>
              </div>
              <input
                type="checkbox"
                checked={requirePseudonymCode}
                onChange={e => setRequirePseudonymCode(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Response Cap (Quota)</label>
                <input
                  type="number"
                  value={responseCap}
                  onChange={e => setResponseCap(parseInt(e.target.value, 10) || 300)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Custom Completion Message</label>
                <input
                  type="text"
                  value={completionMessage}
                  onChange={e => setCompletionMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-teal-600" /> Participant QR Code
          </div>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Survey QR Code"
              className="w-44 h-44 rounded-xl border border-slate-200 shadow-xs p-1"
            />
          ) : (
            <div className="w-44 h-44 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
              Generating QR...
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Scan via smartphone camera to test mobile participant layout.
          </p>
        </div>
      </div>
    </div>
  );
};
