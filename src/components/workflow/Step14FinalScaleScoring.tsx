import React, { useState } from 'react';
import { ScaleProject } from '../../types/scale';
import { FileCheck, BookOpen, AlertCircle, CheckCircle2, Copy, Download, Check } from 'lucide-react';
import { downloadFile } from '../../lib/exportUtils';

interface Step14Props {
  project: ScaleProject;
  onUpdateProject: (updates: Partial<ScaleProject>) => void;
  onOpenMethodology: () => void;
}

export const Step14FinalScaleScoring: React.FC<Step14Props> = ({
  project,
  onUpdateProject,
  onOpenMethodology,
}) => {
  const retainedItems = project.items.filter(i => i.status === 'retained');
  const [copiedQuestionnaire, setCopiedQuestionnaire] = useState(false);

  const reverseItems = retainedItems.filter(i => i.isReverseScored);

  const getQuestionnaireText = () => {
    const lines: string[] = [];
    lines.push(`${project.title} (Final Instrument)`);
    lines.push(`Construct: ${project.intendedConstruct}`);
    lines.push(`Target Population: ${project.targetPopulation}`);
    lines.push(`Administration Language: ${project.administrationLanguage}`);
    lines.push('');
    lines.push('Instructions: Please indicate how strongly you agree or disagree with each statement regarding your primary team.');
    lines.push('Response Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree');
    lines.push('');

    retainedItems.forEach((it, idx) => {
      const dim = project.dimensions.find(d => d.id === it.dimensionId);
      lines.push(`${idx + 1}. [${it.id}] ${it.wording} (${dim?.name || 'General'}) ${it.isReverseScored ? '[Reverse-Scored]' : ''}`);
    });

    lines.push('');
    lines.push('SCORING INSTRUCTIONS:');
    lines.push('1. Reverse-score the following items prior to computing totals: ' + reverseItems.map(i => `${i.id} (New = 6 - Raw)`).join(', '));
    lines.push('2. Subscale Scores: Average of non-missing items within each dimension.');
    project.dimensions.forEach(dim => {
      const dimItems = retainedItems.filter(i => i.dimensionId === dim.id).map(i => i.id);
      lines.push(`   - ${dim.name} (${dim.code}): Mean(${dimItems.join(', ')})`);
    });
    lines.push('3. Overall Total Scale Score: Mean of all 12 scored items.');
    lines.push('4. Missing Data: Do not impute if more than 20% of items are missing. If <= 20% missing, compute person-mean across completed dimension items.');

    return lines.join('\n');
  };

  const handleCopyQuestionnaire = () => {
    navigator.clipboard.writeText(getQuestionnaireText());
    setCopiedQuestionnaire(true);
    setTimeout(() => setCopiedQuestionnaire(false), 2500);
  };

  const handleDownloadQuestionnaire = () => {
    downloadFile(`${project.title.replace(/\s+/g, '_')}_Final_Questionnaire.txt`, getQuestionnaireText(), 'text/plain');
  };

  const handleMarkStepCompleted = () => {
    onUpdateProject({
      workflowStepStatuses: {
        ...project.workflowStepStatuses,
        14: {
          isCompleted: true,
          isEvidenceSufficient: true,
          notes: 'Final instrument specification, scoring protocols, and interpretation boundaries approved.',
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
                Step 14 of 15
              </span>
              <span className="text-xs font-semibold text-slate-500">Phase 3: Statistical Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Final Scale Specification &amp; Scoring Protocols</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Compile the final instrument layout, subscale formulas, reverse-scoring directions, missing data rules, and explicit score interpretation boundaries (Boateng et al., 2018; Clark &amp; Watson, 2019).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyQuestionnaire}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              {copiedQuestionnaire ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Text</>}
            </button>
            <button
              onClick={handleDownloadQuestionnaire}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download TXT
            </button>
          </div>
        </div>
      </div>

      {/* Norm & Interpretation Warning (Rule 14) */}
      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-700" /> Psychometric Rule: Do Not Invent Diagnostic Cutoffs or Categorical Norms
        </div>
        <p className="leading-relaxed">
          Unless a nationally representative normative standardization study has been conducted with clinical or performance criteria, scores should be interpreted continuously. ScaleLab strictly prohibits creating arbitrary cutoffs (such as "Scores 1-15 = Low Safety, 16-30 = High Safety") without empirical criterion calibration (Clark &amp; Watson, 2019).
        </p>
      </div>

      {/* Final Questionnaire Preview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-sm">
            Final Instrument: {project.title} ({retainedItems.length} Retained Items)
          </h3>
          <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded">
            5-Point Agreement Scale (1 = Strongly Disagree, 5 = Strongly Agree)
          </span>
        </div>

        <div className="space-y-3">
          {project.dimensions.map(dim => {
            const dimItems = retainedItems.filter(i => i.dimensionId === dim.id);
            return (
              <div key={dim.id} className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold text-xs rounded">
                    {dim.code}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{dim.name}</span>
                </div>

                <div className="space-y-1.5">
                  {dimItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800 text-xs">{item.id}</span>
                        <span className="text-slate-900 font-medium">"{item.wording}"</span>
                      </div>
                      {item.isReverseScored && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 rounded font-bold uppercase">
                          Reverse-Scored (6 - Score)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Formulas & Missing Data Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Subscale Formulas &amp; Missing Response Protocols
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Dimension Score Calculations</div>
            {project.dimensions.map(dim => {
              const dimItems = retainedItems.filter(i => i.dimensionId === dim.id).map(i => i.id);
              return (
                <div key={dim.id} className="text-slate-700">
                  <span className="font-semibold text-slate-900">{dim.name} ({dim.code}):</span>
                  <div className="font-mono text-[11px] text-teal-800 mt-0.5 bg-white p-1.5 rounded border border-slate-200">
                    Mean({dimItems.join(', ')})
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Missing Response Handling Protocol</div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <span className="font-semibold text-slate-800">&le; 20% Missing within dimension: </span>
                Calculate the mean of completed items within the same dimension (person-mean substitution).
              </li>
              <li>
                <span className="font-semibold text-slate-800">&gt; 20% Missing: </span>
                Set subscale score to missing; do not compute total scale score for this case.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Structural Equation Modeling: </span>
                Use Full Information Maximum Likelihood (FIML) to handle missing data without imputation artifacts.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600">
          ScaleLab Version 1.0 Release Freeze: Questionnaire specification ready for reporting and distribution.
        </div>
        <button
          onClick={handleMarkStepCompleted}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <FileCheck className="w-4 h-4" /> Finalize Step 14 Scale Specification
        </button>
      </div>
    </div>
  );
};
