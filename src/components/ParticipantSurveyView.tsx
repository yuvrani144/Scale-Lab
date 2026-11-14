import React, { useState, useEffect } from 'react';
import { ScaleProject, SurveyVersion, SurveyQuestion } from '../types/scale';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Send, Sparkles, Clock, Lock } from 'lucide-react';

interface ParticipantSurveyViewProps {
  surveyId: string;
  project?: ScaleProject;
  onExitPreview?: () => void;
}

export const ParticipantSurveyView: React.FC<ParticipantSurveyViewProps> = ({
  surveyId,
  project: initialProject,
  onExitPreview,
}) => {
  const [surveyData, setSurveyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Participant flow states
  const [stage, setStage] = useState<'info' | 'consent' | 'questions' | 'submitted'>('info');
  const [hasConsented, setHasConsented] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [participantCode, setParticipantCode] = useState('');
  const [startTime] = useState(Date.now());
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If initial project supplied in test/preview mode
    if (initialProject) {
      const activeVer = initialProject.surveyVersions.find(
        v => v.versionNumber === initialProject.currentSurveyVersionNumber
      ) || initialProject.surveyVersions[initialProject.surveyVersions.length - 1];

      setSurveyData({
        surveyId: initialProject.id,
        projectTitle: initialProject.title,
        isCollectionOpen: initialProject.isCollectionOpen,
        responseCap: initialProject.collectionSettings.responseCap,
        requirePseudonymCode: initialProject.collectionSettings.requirePseudonymCode,
        versionNumber: activeVer.versionNumber,
        title: activeVer.title,
        infoSheetText: activeVer.infoSheetText,
        consentStatementText: activeVer.consentStatementText,
        sections: activeVer.sections,
        questions: activeVer.questions,
      });
      setLoading(false);
      return;
    }

    // Fetch from real server endpoint
    fetch(`/api/surveys/${surveyId}`)
      .then(res => {
        if (!res.ok) throw new Error('Survey not found or collection closed.');
        return res.json();
      })
      .then(data => {
        setSurveyData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [surveyId, initialProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading research survey...</p>
        </div>
      </div>
    );
  }

  if (error || !surveyData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Survey Unavailable</h2>
          <p className="text-xs text-slate-600">{error || 'This research questionnaire is currently closed.'}</p>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="mt-2 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
            >
              Return to Researcher Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  const questions: SurveyQuestion[] = surveyData.questions || [];
  const currentSection = surveyData.sections?.[0];

  const handleSelectLikert = (qId: string, val: number) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const handleSelectChoice = (qId: string, val: string | number) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / Math.max(1, questions.length)) * 100);

  const handleSubmit = async () => {
    setSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await fetch(`/api/surveys/${surveyData.surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyVersionNumber: surveyData.versionNumber,
          answers,
          durationSeconds,
          participantCode: participantCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setReceiptId(data.receiptId || `REC-${Date.now().toString(36).toUpperCase()}`);
      setStage('submitted');
    } catch (err: any) {
      alert('Error submitting survey: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Academic Header */}
      <header className="bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">{surveyData.projectTitle}</h1>
            <p className="text-[11px] text-slate-400">Academic Research Study &bull; Version {surveyData.versionNumber}</p>
          </div>
        </div>

        {onExitPreview && (
          <button
            onClick={onExitPreview}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition"
          >
            Exit Test Preview
          </button>
        )}
      </header>

      {/* Progress Bar (when answering questions) */}
      {stage === 'questions' && (
        <div className="w-full bg-slate-200 h-1.5 sticky top-[53px] z-30">
          <div
            className="bg-teal-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Content Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 my-4">
        {/* STAGE 1: INFO SHEET */}
        {stage === 'info' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Participant Information
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{surveyData.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Please read before deciding whether to take part.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {surveyData.infoSheetText}
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Anonymity &amp; Confidentiality: </strong>
                  Your responses will be stored securely and analyzed in aggregated statistical forms. No identifying IP addresses or names are recorded.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Duration: </strong>
                  This questionnaire typically takes approximately 3 to 5 minutes to complete.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setStage('consent')}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                Continue to Consent <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: ETHICAL CONSENT */}
        {stage === 'consent' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Ethical Consent
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Informed Research Consent</h2>
              <p className="text-xs text-slate-500 mt-0.5">Affirmative consent is required to proceed.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {surveyData.consentStatementText}
            </div>

            {surveyData.requirePseudonymCode && (
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 space-y-1 text-xs">
                <label className="block font-bold text-teal-900">
                  Optional Pseudonymous Participant Code (For Test-Retest Studies)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Participant ID code given by your team or researcher"
                  value={participantCode}
                  onChange={e => setParticipantCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-teal-300 rounded-lg text-xs"
                />
              </div>
            )}

            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={e => setHasConsented(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-xs text-slate-800 leading-normal">
                  I confirm that I am 18 years of age or older, have read the study information, understand that my participation is voluntary, and consent to participate.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setStage('info')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                disabled={!hasConsented}
                onClick={() => setStage('questions')}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                Begin Questionnaire <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: QUESTIONS */}
        {stage === 'questions' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Section Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Questionnaire Section
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {currentSection?.title || 'Measurement Scale Items'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentSection?.instructions || 'Please indicate your level of agreement with each statement.'}
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const answerKey = q.itemId ? q.itemId.replace(/-/g, '_') : q.id;
                const currentAnswer = answers[answerKey];

                return (
                  <div
                    key={q.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 text-xs mt-0.5">{idx + 1}.</span>
                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.prompt}
                      </div>
                    </div>

                    {q.type === 'demographic' && q.options ? (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map(opt => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              currentAnswer === opt.value
                                ? 'bg-teal-50/70 border-teal-600 font-semibold text-teal-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.value}
                              checked={currentAnswer === opt.value}
                              onChange={() => handleSelectChoice(answerKey, opt.value)}
                              className="text-teal-600 focus:ring-teal-500"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      /* Likert Scale (5-Point) */
                      <div className="pt-2">
                        <div className="grid grid-cols-5 gap-1.5 text-center">
                          {[
                            { val: 1, label: 'Strongly Disagree' },
                            { val: 2, label: 'Disagree' },
                            { val: 3, label: 'Neutral' },
                            { val: 4, label: 'Agree' },
                            { val: 5, label: 'Strongly Agree' },
                          ].map(anchor => (
                            <button
                              key={anchor.val}
                              type="button"
                              onClick={() => handleSelectLikert(answerKey, anchor.val)}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center transition cursor-pointer ${
                                currentAnswer === anchor.val
                                  ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                                  : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-sm font-bold">{anchor.val}</span>
                              <span className="text-[10px] mt-0.5 hidden sm:inline leading-tight opacity-90">
                                {anchor.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Answered <strong className="text-slate-900">{answeredCount}</strong> of {questions.length} items
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={answeredCount < Math.min(questions.length, 5) || submitting}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : <><Send className="w-3.5 h-3.5" /> Submit Responses</>}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: SUBMISSION CONFIRMATION */}
        {stage === 'submitted' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">Submission Successful!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for contributing to this scientific research study. Your answers have been encrypted and logged into the study dataset.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-xs font-mono text-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">
                Submission Verification Receipt
              </span>
              <strong className="text-slate-900">{receiptId}</strong>
            </div>

            <div className="pt-4 text-xs text-slate-400">
              You may now safely close this browser window.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
