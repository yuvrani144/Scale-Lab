import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Check,
  Loader2,
  BookOpen,
  Search,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy,
  Plus,
  RefreshCw,
  Award,
} from 'lucide-react';
import { ScaleProject, ScaleItem } from '../types/scale';
import {
  PUBLISHED_INSTRUMENTS_DATABASE,
  PublishedInstrument,
  searchPublishedInstruments,
} from '../lib/instrumentLibrary';
import { DoiBadge } from './DoiBadge';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: ScaleProject;
  currentStep: number;
  initialPrompt?: string;
  onApplyItemSuggestion?: (suggestion: {
    wording: string;
    isReverseScored: boolean;
    reverseRationale?: string;
    dimensionId: string;
  }) => void;
  onAddExistingInstrument?: (inst: { name: string; citation: string; whyInsufficient: string; doi?: string }) => void;
  onOpenDoiChecker?: (doi?: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  project,
  currentStep,
  initialPrompt,
  onApplyItemSuggestion,
  onAddExistingInstrument,
  onOpenDoiChecker,
}) => {
  const [selectedTask, setSelectedTask] = useState<'chat' | 'library' | 'suggest' | 'review_wording' | 'explain'>('chat');
  const [targetDimensionId, setTargetDimensionId] = useState(project.dimensions[0]?.id || '');
  const [wordingToReview, setWordingToReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [appliedItemIdx, setAppliedItemIdx] = useState<number | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I am your Psychometric Cognitive Partner for ScaleLab. I am grounded in the scale development methodology of Churchill (1979), Clark & Watson (1995, 2019), Hinkin (1998), and Boateng et al. (2018).

My role is to actively debate, critique, and spar with you:
- **Interrogating Construct Boundaries**: Challenging construct under-representation and construct-irrelevant variance.
- **Instrument Necessity Audit**: Examining whether published scales (e.g., Edmondson 1999, Liang et al. 2012, Clark 2020, Kang et al. 2023) truly leave an unaddressed empirical gap.
- **Measurement Model Clarity**: Enforcing reflective vs. formative conceptualization (Bollen & Lennox, 1991).
- **Item Quality**: Catching subtle double-barrelled wording, frequency extremes, and social desirability traps.

What methodological question or construct challenge shall we tackle?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Instrument Library State
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<string>('All');
  const [expandedInstId, setExpandedInstId] = useState<string | null>(null);
  const [addedAuditIds, setAddedAuditIds] = useState<Record<string, boolean>>({});

  // Auto-scroll chat
  useEffect(() => {
    if (selectedTask === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedTask, loading]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setSelectedTask('chat');
      setChatInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  // Send message to Cognitive Partner
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          projectContext: {
            title: project.title,
            intendedConstruct: project.intendedConstruct,
            discipline: project.discipline,
            targetPopulation: project.targetPopulation,
            measurementModel: project.measurementModel,
            dimensions: project.dimensions,
            items: project.items,
            existingInstrumentsReviewed: project.existingInstrumentsReviewed,
          },
          currentStep,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'I processed your query according to Clark & Watson (2019) guidelines.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Error connecting to AI Cognitive Partner: ${err.message}. Please check your connection or server status.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainStep = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepNumber: currentStep,
          stageName: `Step ${currentStep}`,
          constructContext: `${project.intendedConstruct} in ${project.targetPopulation}`,
        }),
      });
      const data = await res.json();
      setResult({ type: 'explanation', text: data.explanation });
    } catch (err: any) {
      setResult({ type: 'error', text: 'Failed to contact AI service: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestItems = async () => {
    setLoading(true);
    setResult(null);
    const dim = project.dimensions.find(d => d.id === targetDimensionId) || project.dimensions[0];
    try {
      const res = await fetch('/api/ai/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constructName: project.intendedConstruct,
          conceptualDefinition: project.constructDefinition.conceptualDefinition,
          dimensionName: dim?.name || 'General',
          dimensionDescription: dim?.description || '',
          existingItems: project.items.map(i => i.wording),
        }),
      });
      const data = await res.json();
      setResult({ type: 'items', items: data.suggestions || [], dimensionId: dim?.id });
    } catch (err: any) {
      setResult({ type: 'error', text: 'Failed to generate suggestions: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewWording = async () => {
    if (!wordingToReview.trim()) return;
    setLoading(true);
    setResult(null);
    const dim = project.dimensions.find(d => d.id === targetDimensionId) || project.dimensions[0];
    try {
      const res = await fetch('/api/ai/heuristic-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wording: wordingToReview,
          dimensionName: dim?.name || 'General',
        }),
      });
      const data = await res.json();
      setResult({ type: 'review', data });
    } catch (err: any) {
      setResult({ type: 'error', text: 'Review failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImportInstrument = (inst: PublishedInstrument) => {
    if (onAddExistingInstrument) {
      onAddExistingInstrument({
        name: `${inst.name} (${inst.year})`,
        citation: inst.citation,
        whyInsufficient: inst.limitationsAndGaps,
        doi: inst.doi,
      });
      setAddedAuditIds(prev => ({ ...prev, [inst.id]: true }));
    }
  };

  const handleDebateInstrumentInChat = (inst: PublishedInstrument) => {
    setSelectedTask('chat');
    const prompt = `Let's critique ${inst.name} (${inst.year}). Why might this existing measure be insufficient for our construct "${project.intendedConstruct}" in "${project.targetPopulation}", or should we adapt it rather than build a new scale?`;
    handleSendMessage(prompt);
  };

  const filteredInstruments = searchPublishedInstruments(libraryQuery, libraryCategory);

  const QUICK_PROMPTS = [
    {
      label: 'Edmondson vs Clark 2020',
      prompt: 'How does Edmondson (1999) 7-item scale compare to Clark (2020) 4-stages scale, and what are their respective psychometric limitations for research?',
    },
    {
      label: 'Recent Developments (2018-2024)',
      prompt: 'What major scales have been devised for measuring psychological safety in recent years (2018–2024), particularly for digital, hybrid, healthcare, or multidimensional contexts?',
    },
    {
      label: 'Critique My Construct',
      prompt: `Please critique our construct definition for "${project.intendedConstruct}": "${project.constructDefinition.conceptualDefinition}". Are we suffering from construct under-representation or construct-irrelevant variance?`,
    },
    {
      label: 'Reflective vs Formative',
      prompt: `We specified our scale as ${project.measurementModel}. How do we defend this against reviewers following Bollen & Lennox (1991) and Churchill (1979)?`,
    },
    {
      label: 'Justify Developing New Scale',
      prompt: `How do I write a defensible dissertation or journal paragraph justifying why we need a new scale for "${project.intendedConstruct}" instead of using published instruments?`,
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-xl text-slate-950 font-black shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Psychometric Cognitive Partner</h3>
              <span className="text-[10px] bg-teal-900 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-700">
                ACTIVE MENTOR
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Intellectual sparring &amp; literature audit grounded in Churchill (1979) and Clark &amp; Watson (2019)
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

      {/* Epistemological Boundary Notice */}
      <div className="p-2.5 bg-amber-50/90 border-b border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Cognitive Partner Rule:</strong> AI offers methodological sparring and conceptual critiques. Actual statistical calculations are performed by ScaleLab's internal stats engine.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-slate-200 flex gap-1.5 bg-slate-50 text-xs overflow-x-auto">
        <button
          onClick={() => setSelectedTask('chat')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
            selectedTask === 'chat'
              ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
          Cognitive Partner Chat
        </button>

        <button
          onClick={() => setSelectedTask('library')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
            selectedTask === 'library'
              ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-teal-600" />
          Instrument Library ({PUBLISHED_INSTRUMENTS_DATABASE.length})
        </button>

        <button
          onClick={() => setSelectedTask('suggest')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
            selectedTask === 'suggest'
              ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
          Suggest Items
        </button>

        <button
          onClick={() => setSelectedTask('review_wording')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
            selectedTask === 'review_wording'
              ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-teal-600" />
          Screen Item
        </button>

        <button
          onClick={() => setSelectedTask('explain')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
            selectedTask === 'explain'
              ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
          Step Guidance
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* TAB 1: COGNITIVE PARTNER CHAT */}
        {selectedTask === 'chat' && (
          <div className="flex-1 flex flex-col h-full">
            {/* Quick Prompt Starters */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Sparring &amp; Audit Starters:
                </div>
                {onOpenDoiChecker && (
                  <button
                    onClick={() => onOpenDoiChecker()}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-teal-300 transition"
                  >
                    <Search className="w-2.5 h-2.5" /> Check DOI Registry
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 font-medium rounded-lg border border-slate-200 transition shadow-2xs"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-teal-800 text-teal-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      &Sigma;
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-teal-700 text-white rounded-tr-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'Researcher' : 'Psychometric Cognitive Partner'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0">
                      R
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 text-xs justify-start items-center">
                  <div className="w-7 h-7 rounded-lg bg-teal-800 text-teal-100 flex items-center justify-center font-bold text-xs shrink-0">
                    &Sigma;
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-600 flex items-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Cognitive partner is formulating critique based on Churchill (1979) and published scales...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask a psychometric question, debate scale choice, or critique your items..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: INSTRUMENT LIBRARY & GAP BENCHMARK */}
        {selectedTask === 'library' && (
          <div className="p-4 space-y-4">
            <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 text-xs space-y-1">
              <div className="font-bold text-teal-950 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-teal-700" /> Systematic Published Instrument Repository
              </div>
              <p className="text-teal-800 text-[11px] leading-relaxed">
                Churchill (1979) and Clark &amp; Watson (2019) require reviewing published instruments to prove a new measure is necessary. Browse 22+ peer-reviewed psychological safety and climate scales devised from 1996 to 2024.
              </p>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by author (Edmondson, Clark, Liang), keyword, or setting..."
                  value={libraryQuery}
                  onChange={e => setLibraryQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {['All', 'Recent (2018-2024)', 'Multidimensional', 'Healthcare & Clinical', 'Digital & Hybrid Work', 'Voice & Dissent', 'Foundational'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLibraryCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      libraryCategory === cat
                        ? 'bg-teal-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing {filteredInstruments.length} of {PUBLISHED_INSTRUMENTS_DATABASE.length} published instruments</span>
            </div>

            {/* Instruments List */}
            <div className="space-y-3">
              {filteredInstruments.map(inst => {
                const isExpanded = expandedInstId === inst.id;
                const isAdded = addedAuditIds[inst.id] || project.existingInstrumentsReviewed.some(r => r.name.toLowerCase().includes(inst.name.toLowerCase()));

                return (
                  <div
                    key={inst.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900">{inst.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                            {inst.year}
                          </span>
                          <span className="text-[10px] bg-teal-50 text-teal-800 font-semibold px-2 py-0.5 rounded border border-teal-200">
                            {inst.itemCount} items
                          </span>
                          {inst.doi && (
                            <DoiBadge doi={inst.doi} onVerify={onOpenDoiChecker} />
                          )}
                        </div>
                        <div className="text-slate-500 italic text-[11px] mt-0.5">{inst.citation}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDebateInstrumentInChat(inst)}
                          className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition"
                          title="Debate this scale with the Cognitive Partner"
                        >
                          <MessageSquare className="w-3 h-3 text-teal-600" /> Spar
                        </button>

                        <button
                          onClick={() => handleImportInstrument(inst)}
                          disabled={isAdded}
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold flex items-center gap-1 transition ${
                            isAdded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-teal-700 hover:bg-teal-600 text-white shadow-2xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" /> Audited
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" /> Add to Audit
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dimensions & Target */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {inst.dimensions.map((dim, dIdx) => (
                        <span key={dIdx} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {dim}
                        </span>
                      ))}
                    </div>

                    {/* Gap / Limitation Highlight Box */}
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-950">
                      <span className="font-bold text-amber-900">Why Insufficient / Research Gap: </span>
                      {inst.limitationsAndGaps}
                    </div>

                    {/* Expandable Details */}
                    <div>
                      <button
                        onClick={() => setExpandedInstId(isExpanded ? null : inst.id)}
                        className="text-[11px] text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Hide psychometric parameters & sample items' : 'View psychometric stats & sample items'}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 text-[11px] bg-slate-50/70 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-semibold text-slate-700">Sample Population: </span>
                              <span className="text-slate-600">{inst.samplePopulation}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Reported Reliability: </span>
                              <span className="text-slate-600">&alpha; = {inst.psychometrics.reportedAlpha || 'N/A'} {inst.psychometrics.reportedOmega ? `| &omega; = ${inst.psychometrics.reportedOmega}` : ''}</span>
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-700">Factor Structure: </span>
                            <span className="text-slate-600">{inst.psychometrics.factorStructure || 'Unidimensional / Confirmatory'}</span>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-700">Core Strengths: </span>
                            <span className="text-slate-600">{inst.strengths}</span>
                          </div>

                          {inst.sampleItems && inst.sampleItems.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-700">Sample Items:</span>
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 mt-1">
                                {inst.sampleItems.map((sItem, sIdx) => (
                                  <li key={sIdx}>"{sItem}"</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SUGGEST ITEMS */}
        {selectedTask === 'suggest' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-900">Construct: </span>
              <span className="text-teal-700 font-bold">{project.intendedConstruct}</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Generate items following Clark &amp; Watson (2019) domain sampling, with explicit reverse-scored candidates.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Dimension</label>
              <select
                value={targetDimensionId}
                onChange={e => setTargetDimensionId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                {project.dimensions.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code}) - {d.description?.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSuggestItems}
              disabled={loading}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              Generate 4 Candidate Items (with 1 Reverse-Scored Item)
            </button>

            {result && result.type === 'items' && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>AI Suggestions (Requires Researcher Verification)</span>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                    Rule 3: Labelled as AI Suggestions
                  </span>
                </div>

                {result.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-medium text-slate-900">"{item.wording}"</div>
                    {item.isReverseScored && (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 rounded font-semibold">
                        Reverse-Scored Candidate
                      </span>
                    )}
                    <div className="text-[11px] text-slate-500 italic">{item.sourceOrRationale}</div>
                    {onApplyItemSuggestion && (
                      <button
                        onClick={() => {
                          onApplyItemSuggestion({
                            wording: item.wording,
                            isReverseScored: item.isReverseScored,
                            reverseRationale: item.reverseRationale,
                            dimensionId: result.dimensionId,
                          });
                          setAppliedItemIdx(idx);
                        }}
                        disabled={appliedItemIdx === idx}
                        className="mt-1 text-xs px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded-md flex items-center gap-1 font-semibold transition"
                      >
                        {appliedItemIdx === idx ? (
                          <>
                            <Check className="w-3 h-3" /> Added to Item Bank
                          </>
                        ) : (
                          '+ Add to Item Bank'
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SCREEN ITEM */}
        {selectedTask === 'review_wording' && (
          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Item Wording to Screen</label>
              <textarea
                rows={3}
                value={wordingToReview}
                onChange={e => setWordingToReview(e.target.value)}
                placeholder="Paste item statement (e.g. 'I feel comfortable raising difficult issues and asking for salary promotions')..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleReviewWording}
              disabled={loading || !wordingToReview.trim()}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              Screen for Double-Barreling, Leading &amp; Ambiguity
            </button>

            {result && result.type === 'review' && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1">
                    Verdict: <span className="uppercase text-teal-700 font-bold">{result.data.overallVerdict?.replace('_', ' ')}</span>
                  </div>
                  {result.data.flags && result.data.flags.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {result.data.flags.map((f: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-xs">
                          <div className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> [{f.severity?.toUpperCase()}] {f.type}
                          </div>
                          <div className="mt-0.5">{f.message}</div>
                          {f.suggestion && (
                            <div className="mt-1 text-[11px] text-teal-800 font-semibold bg-white/70 p-1.5 rounded">
                              Recommended Revision: {f.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-emerald-700 font-medium flex items-center gap-1 mt-1">
                      <Check className="w-4 h-4" /> No obvious double-barrelled or leading wording detected.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STEP GUIDANCE */}
        {selectedTask === 'explain' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              <span className="font-semibold text-slate-900">Active Workflow Stage: </span>
              Step {currentStep} for construct <span className="font-medium text-teal-700">"{project.intendedConstruct}"</span>.
            </div>

            <button
              onClick={handleExplainStep}
              disabled={loading}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Explain Methodology &amp; Common Pitfalls for Step {currentStep}
            </button>

            {result && result.type === 'explanation' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
