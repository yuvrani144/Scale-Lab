import React, { useState, useEffect } from 'react';
import { ScaleProject } from './types/scale';
import { createDemoProject } from './lib/demoData';
import { Header } from './components/Header';
import { Sidebar, NavView } from './components/Sidebar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { MethodologyDrawer } from './components/MethodologyDrawer';
import { DecisionLogModal } from './components/DecisionLogModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { ParticipantSurveyView } from './components/ParticipantSurveyView';
import { DoiReferenceModal } from './components/DoiReferenceModal';

// Workflow steps
import { Step1ProjectSetup } from './components/workflow/Step1ProjectSetup';
import { Step2ConstructDefinition } from './components/workflow/Step2ConstructDefinition';
import { Step3ItemBank } from './components/workflow/Step3ItemBank';
import { Step4ExpertReview } from './components/workflow/Step4ExpertReview';
import { Step5CognitivePretest } from './components/workflow/Step5CognitivePretest';
import { Step6ValidationPlan } from './components/workflow/Step6ValidationPlan';
import { Step7SurveyBuilder } from './components/workflow/Step7SurveyBuilder';
import { Step8PublishCollection } from './components/workflow/Step8PublishCollection';
import { Step9CollectionDashboard } from './components/workflow/Step9CollectionDashboard';
import { Step10DataPreparation } from './components/workflow/Step10DataPreparation';
import { Step11ExploratoryFactorAnalysis } from './components/workflow/Step11ExploratoryFactorAnalysis';
import { Step12ConfirmatoryFactorAnalysis } from './components/workflow/Step12ConfirmatoryFactorAnalysis';
import { Step13ReliabilityValidity } from './components/workflow/Step13ReliabilityValidity';
import { Step14FinalScaleScoring } from './components/workflow/Step14FinalScaleScoring';
import { Step15ReportsExports } from './components/workflow/Step15ReportsExports';

export default function App() {
  // Check if participant route via URL query param e.g. /?surveyId=demo-wpss-project
  const searchParams = new URLSearchParams(window.location.search);
  const surveyParam = searchParams.get('surveyId');

  // If accessed by participant directly
  if (surveyParam) {
    return <ParticipantSurveyView surveyId={surveyParam} />;
  }

  // Researcher Workspace State
  const [project, setProject] = useState<ScaleProject>(createDemoProject());
  const [projectsList, setProjectsList] = useState<any[]>([
    {
      id: 'demo-wpss-project',
      title: 'Workplace Psychological Safety Scale (WPSS)',
      discipline: 'Management & Organizational Behavior',
      isDemoProject: true,
    },
  ]);
  const [currentView, setCurrentView] = useState<NavView>('dashboard');

  // Modals & Drawers
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isDecisionLogOpen, setIsDecisionLogOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDoiModalOpen, setIsDoiModalOpen] = useState(false);
  const [selectedDoiForModal, setSelectedDoiForModal] = useState<string | undefined>(undefined);

  const handleOpenAiAssistant = (prompt?: string) => {
    setAiInitialPrompt(prompt);
    setIsAiAssistantOpen(true);
  };

  const handleOpenDoiChecker = (doi?: string) => {
    setSelectedDoiForModal(doi);
    setIsDoiModalOpen(true);
  };

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newConstruct, setNewConstruct] = useState('');
  const [newDiscipline, setNewDiscipline] = useState<any>('Management & Organizational Behavior');

  // Load project on mount from backend
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectsList(data);
          // Load first project
          fetch(`/api/projects/${data[0].id}`)
            .then(r => r.json())
            .then(p => {
              if (p && p.id) setProject(p);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fallback to local demo project
      });
  }, []);

  const handleSelectProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const p = await res.json();
        setProject(p);
      }
    } catch (e) {
      console.error('Error switching project:', e);
    }
  };

  const handleUpdateProject = (updates: Partial<ScaleProject>) => {
    const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
    setProject(updated);

    // Persist to server
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(err => console.error('Failed to sync project:', err));
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset the demo project to default synthetic state?')) return;
    try {
      const res = await fetch('/api/projects/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setCurrentView('dashboard');
      }
    } catch (err) {
      const freshDemo = createDemoProject();
      setProject(freshDemo);
    }
  };

  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newConstruct.trim()) return;

    const id = `proj-${Date.now()}`;
    const newProj: ScaleProject = {
      id,
      title: newTitle.trim(),
      description: `Development and psychometric validation of ${newTitle.trim()}.`,
      discipline: newDiscipline,
      intendedConstruct: newConstruct.trim(),
      targetPopulation: 'Adult target population',
      administrationLanguage: 'English',
      intendedInterpretation: 'Empirical measurement and diagnostic assessment',
      scaleType: 'new_scale',
      measurementModel: 'reflective',
      measurementModelJustification: 'Indicators are reflective manifestations of the latent trait.',
      existingInstrumentsReviewed: [],
      constructDefinition: {
        conceptualDefinition: `${newConstruct.trim()} is defined as...`,
        theoreticalFramework: 'Theory of Planned Behavior / Social Cognitive Theory',
        supportingLiterature: [],
        includedAspects: [],
        excludedAspects: [],
        relatedConstructsDiscriminant: [],
      },
      dimensions: [
        {
          id: `dim-1`,
          name: 'Core Facet 1',
          code: 'F1',
          description: 'Primary dimension of the construct.',
          includedAspects: '',
          excludedAspects: '',
          itemCountTarget: 4,
        },
      ],
      items: [],
      expertPanels: [
        {
          id: 'panel-01',
          name: 'Content Validity Panel',
          targetCount: 6,
          description: 'Independent expert panel evaluating relevance and clarity.',
          panellists: [],
          ratings: [],
        },
      ],
      cognitiveInterviews: [],
      validationHypotheses: [],
      surveyVersions: [
        {
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          isFrozen: false,
          purpose: 'pilot_study',
          title: `${newTitle.trim()} - Survey V1`,
          infoSheetText: 'Information for study participants.',
          consentStatementText: 'I voluntarily consent to take part in this study.',
          sections: [
            {
              id: 'sec-items',
              title: 'Scale Items',
              instructions: 'Please rate your agreement on the 5-point scale.',
              randomizeItemOrder: true,
            },
          ],
          questions: [],
          administeredItemIds: [],
          itemWordingsSnapshot: {},
        },
      ],
      currentSurveyVersionNumber: 1,
      isCollectionOpen: false,
      collectionSettings: {
        allowAnonymous: true,
        requirePseudonymCode: false,
        responseCap: 250,
        completionMessage: 'Thank you for your submission.',
        saveAndResumeAllowed: false,
      },
      submissions: [],
      datasetSnapshots: [],
      analysisRuns: [],
      decisionLog: [
        {
          id: `dec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stepNumber: 1,
          stageName: 'Project Setup',
          decisionType: 'methodological_divergence',
          title: `Project "${newTitle.trim()}" initialized`,
          rationalSummary: `Initiated development of measure for "${newConstruct.trim()}".`,
          methodologicalJustification: 'Follows Churchill (1979) and Boateng et al. (2018) methodology.',
          author: 'Researcher',
        },
      ],
      workflowStepStatuses: {
        1: { isCompleted: true, isEvidenceSufficient: true, notes: 'Project created.' },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoProject: false,
    };

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj),
    }).catch(() => {});

    setProjectsList([...projectsList, { id: newProj.id, title: newProj.title, discipline: newProj.discipline, isDemoProject: false }]);
    setProject(newProj);
    setIsNewProjectModalOpen(false);
    setCurrentView('step-1');
  };

  // Convert current view to step number for step-specific drawers
  const currentStepNum = currentView.startsWith('step-')
    ? parseInt(currentView.replace('step-', ''), 10)
    : 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        project={project}
        projectsList={projectsList}
        onSelectProject={handleSelectProject}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenDecisionLog={() => setIsDecisionLogOpen(true)}
        onOpenAiAssistant={() => handleOpenAiAssistant()}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenDoiChecker={handleOpenDoiChecker}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={v => {
            if (v === 'decisions') setIsDecisionLogOpen(true);
            else setCurrentView(v);
          }}
          project={project}
        />

        {/* Central Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <ProjectDashboard
              project={project}
              onNavigateStep={s => setCurrentView(`step-${s}` as NavView)}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenDecisionLog={() => setIsDecisionLogOpen(true)}
            />
          )}

          {currentView === 'step-1' && (
            <Step1ProjectSetup
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenAiAssistant={handleOpenAiAssistant}
              onOpenDoiChecker={handleOpenDoiChecker}
            />
          )}

          {currentView === 'step-2' && (
            <Step2ConstructDefinition
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenDoiChecker={handleOpenDoiChecker}
              onOpenAiAssistant={handleOpenAiAssistant}
            />
          )}

          {(currentView === 'step-3' || currentView === 'items') && (
            <Step3ItemBank
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
            />
          )}

          {(currentView === 'step-4' || currentView === 'expert') && (
            <Step4ExpertReview
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentView === 'step-5' && (
            <Step5CognitivePretest
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentView === 'step-6' && (
            <Step6ValidationPlan
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {(currentView === 'step-7' || currentView === 'survey') && (
            <Step7SurveyBuilder
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenPreview={() => setIsPreviewOpen(true)}
            />
          )}

          {currentView === 'step-8' && (
            <Step8PublishCollection
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenPreview={() => setIsPreviewOpen(true)}
            />
          )}

          {(currentView === 'step-9' || currentView === 'collection') && (
            <Step9CollectionDashboard
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentView === 'step-10' && (
            <Step10DataPreparation
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentView === 'step-11' && (
            <Step11ExploratoryFactorAnalysis
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenDecisionLog={() => setIsDecisionLogOpen(true)}
            />
          )}

          {currentView === 'step-12' && (
            <Step12ConfirmatoryFactorAnalysis
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenDecisionLog={() => setIsDecisionLogOpen(true)}
            />
          )}

          {(currentView === 'step-13' || currentView === 'analysis') && (
            <Step13ReliabilityValidity
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentView === 'step-14' && (
            <Step14FinalScaleScoring
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {(currentView === 'step-15' || currentView === 'reports') && (
            <Step15ReportsExports
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onImportBackup={imported => setProject(imported)}
              onOpenDoiChecker={handleOpenDoiChecker}
            />
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <MethodologyDrawer
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        currentStep={currentStepNum}
        onCheckDoi={handleOpenDoiChecker}
      />

      <DecisionLogModal
        isOpen={isDecisionLogOpen}
        onClose={() => setIsDecisionLogOpen(false)}
        entries={project.decisionLog}
        currentStep={currentStepNum}
        onAddEntry={entry => {
          const newEntry = {
            id: `dec-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...entry,
          };
          const updated = [newEntry, ...project.decisionLog];
          handleUpdateProject({ decisionLog: updated });
        }}
      />

      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => {
          setIsAiAssistantOpen(false);
          setAiInitialPrompt(undefined);
        }}
        project={project}
        currentStep={currentStepNum}
        initialPrompt={aiInitialPrompt}
        onOpenDoiChecker={handleOpenDoiChecker}
        onAddExistingInstrument={inst => {
          if (!project.existingInstrumentsReviewed.some(r => r.name.toLowerCase() === inst.name.toLowerCase())) {
            handleUpdateProject({
              existingInstrumentsReviewed: [...project.existingInstrumentsReviewed, inst],
            });
          }
        }}
        onApplyItemSuggestion={sugg => {
          const prefix = project.title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'ITEM';
          const stableId = `${prefix}-${String(project.items.length + 1).padStart(2, '0')}`;
          const newItem = {
            id: stableId,
            wording: sugg.wording,
            dimensionId: sugg.dimensionId,
            sourceOrRationale: 'Generated via Psychometric AI Assistant.',
            generationMethod: 'ai_suggested_adapted' as const,
            responseFormat: 'likert_5' as const,
            isReverseScored: sugg.isReverseScored,
            reverseRationale: sugg.reverseRationale,
            status: 'draft' as const,
            heuristicFlags: [],
            revisions: [],
            order: project.items.length + 1,
            isAiSuggestion: true,
          };
          handleUpdateProject({
            items: [...project.items, newItem],
          });
        }}
      />

      {/* Global Academic DOI & Reference Verification Modal */}
      <DoiReferenceModal
        isOpen={isDoiModalOpen}
        onClose={() => {
          setIsDoiModalOpen(false);
          setSelectedDoiForModal(undefined);
        }}
        initialDoi={selectedDoiForModal}
        onImportReference={ref => {
          if (!project.existingInstrumentsReviewed.some(r => r.name.toLowerCase() === ref.title.toLowerCase())) {
            handleUpdateProject({
              existingInstrumentsReviewed: [
                ...project.existingInstrumentsReviewed,
                {
                  name: `${ref.title} (${ref.year})`,
                  citation: ref.citation,
                  whyInsufficient: 'Imported via persistent DOI reference verification.',
                  doi: ref.doi,
                },
              ],
            });
          }
        }}
      />

      {/* Participant Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 overflow-y-auto">
          <ParticipantSurveyView
            surveyId={project.id}
            project={project}
            onExitPreview={() => setIsPreviewOpen(false)}
          />
        </div>
      )}

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Create New Scale Development Project
            </h3>
            <form onSubmit={handleCreateNewProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Scale / Instrument Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic Burnout Inventory (ABI)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Latent Construct</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Cognitive Exhaustion"
                  value={newConstruct}
                  onChange={e => setNewConstruct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Research Discipline</label>
                <select
                  value={newDiscipline}
                  onChange={e => setNewDiscipline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="Education">Education</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Management & Organizational Behavior">Management &amp; Organizational Behavior</option>
                  <option value="Health & Nursing">Health &amp; Nursing</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Marketing & Consumer Research">Marketing &amp; Consumer Research</option>
                  <option value="Interdisciplinary">Interdisciplinary</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
