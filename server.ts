import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';
import { createDemoProject } from './src/lib/demoData.ts';
import { PUBLISHED_INSTRUMENTS_DATABASE, searchPublishedInstruments } from './src/lib/instrumentLibrary.ts';
import { ScaleProject, ParticipantSubmission, DatasetSnapshot, DecisionLogEntry } from './src/types/scale.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// ==========================================
// PERSISTENT STORAGE (./data/scalelab-db.json)
// ==========================================
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'scalelab-db.json');

interface DatabaseSchema {
  projects: Record<string, ScaleProject>;
}

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const demo = createDemoProject();
    const initialDb: DatabaseSchema = {
      projects: {
        [demo.id]: demo,
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.projects || Object.keys(parsed.projects).length === 0) {
      const demo = createDemoProject();
      parsed.projects = { [demo.id]: demo };
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    const demo = createDemoProject();
    const fallbackDb = { projects: { [demo.id]: demo } };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallbackDb, null, 2), 'utf-8');
    return fallbackDb;
  }
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

// ==========================================
// GEMINI CLIENT SETUP (Server-Side)
// ==========================================
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Project Management
app.get('/api/projects', (req, res) => {
  const db = ensureDb();
  const summaryList = Object.values(db.projects).map(p => ({
    id: p.id,
    title: p.title,
    discipline: p.discipline,
    intendedConstruct: p.intendedConstruct,
    scaleType: p.scaleType,
    updatedAt: p.updatedAt,
    isDemoProject: !!p.isDemoProject,
    itemsCount: p.items.length,
    retainedCount: p.items.filter(i => i.status === 'retained').length,
    submissionsCount: p.submissions.length,
  }));
  res.json(summaryList);
});

app.get('/api/projects/:id', (req, res) => {
  const db = ensureDb();
  const project = db.projects[req.params.id];
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const db = ensureDb();
  const newProject: ScaleProject = req.body;
  if (!newProject.id || !newProject.title) {
    return res.status(400).json({ error: 'Project id and title are required' });
  }
  newProject.createdAt = new Date().toISOString();
  newProject.updatedAt = new Date().toISOString();
  db.projects[newProject.id] = newProject;
  saveDb(db);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const db = ensureDb();
  const id = req.params.id;
  if (!db.projects[id]) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const updated: ScaleProject = {
    ...db.projects[id],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  db.projects[id] = updated;
  saveDb(db);
  res.json(updated);
});

app.post('/api/projects/reset-demo', (req, res) => {
  const db = ensureDb();
  const pristineDemo = createDemoProject();
  db.projects[pristineDemo.id] = pristineDemo;
  saveDb(db);
  res.json({ message: 'Demo project successfully reset to default state.', project: pristineDemo });
});

// 2. Append Decision Log
app.post('/api/projects/:id/decision-log', (req, res) => {
  const db = ensureDb();
  const project = db.projects[req.params.id];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const entry: DecisionLogEntry = {
    id: `dec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: req.body.author || 'Researcher',
    ...req.body,
  };

  project.decisionLog.unshift(entry);
  project.updatedAt = new Date().toISOString();
  saveDb(db);
  res.status(201).json(entry);
});

// 3. Snapshot Creation
app.post('/api/projects/:id/snapshots', (req, res) => {
  const db = ensureDb();
  const project = db.projects[req.params.id];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const snapshot: DatasetSnapshot = {
    id: `snap-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  };

  project.datasetSnapshots.unshift(snapshot);
  project.updatedAt = new Date().toISOString();
  saveDb(db);
  res.status(201).json(snapshot);
});

// 4. Public Participant Survey Endpoints (Strict separation of respondent & researcher data)
app.get('/api/surveys/:surveyId', (req, res) => {
  const db = ensureDb();
  // Find project that hosts this survey
  const project = Object.values(db.projects).find(
    p => p.id === req.params.surveyId || p.surveyVersions.some(sv => `survey-${p.id}` === req.params.surveyId)
  );

  if (!project) {
    return res.status(404).json({ error: 'Survey not found or invalid access link.' });
  }

  const activeVersion = project.surveyVersions.find(
    sv => sv.versionNumber === project.currentSurveyVersionNumber
  ) || project.surveyVersions[project.surveyVersions.length - 1];

  if (!activeVersion) {
    return res.status(404).json({ error: 'No published version available for this survey.' });
  }

  // Return strictly participant-safe fields (NO researcher data, NO other responses)
  res.json({
    surveyId: project.id,
    projectTitle: project.title,
    isCollectionOpen: project.isCollectionOpen,
    closingDate: project.collectionSettings.closingDate,
    responseCap: project.collectionSettings.responseCap,
    currentCount: project.submissions.length,
    requirePseudonymCode: project.collectionSettings.requirePseudonymCode,
    versionNumber: activeVersion.versionNumber,
    title: activeVersion.title,
    infoSheetText: activeVersion.infoSheetText,
    consentStatementText: activeVersion.consentStatementText,
    sections: activeVersion.sections,
    questions: activeVersion.questions,
  });
});

app.post('/api/surveys/:surveyId/submit', (req, res) => {
  const db = ensureDb();
  const project = Object.values(db.projects).find(
    p => p.id === req.params.surveyId || p.surveyVersions.some(sv => `survey-${p.id}` === req.params.surveyId)
  );

  if (!project) {
    return res.status(404).json({ error: 'Survey not found.' });
  }

  if (!project.isCollectionOpen) {
    return res.status(403).json({ error: 'Response collection for this survey is currently closed.' });
  }

  if (project.collectionSettings.responseCap && project.submissions.length >= project.collectionSettings.responseCap) {
    return res.status(403).json({ error: 'Response cap for this study has been reached.' });
  }

  const { surveyVersionNumber, answers, durationSeconds, participantCode, cohort, wave } = req.body;

  // Basic quality check: speeding (< 2 seconds per item)
  const isSpeeding = durationSeconds && durationSeconds < (Object.keys(answers || {}).length * 1.5);
  const qualityFlags: string[] = [];
  if (isSpeeding) qualityFlags.push('speeding');

  const submission: ParticipantSubmission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    surveyId: project.id,
    surveyVersionNumber: surveyVersionNumber || project.currentSurveyVersionNumber,
    purpose: 'main_development_study',
    submittedAt: new Date().toISOString(),
    durationSeconds: durationSeconds || 120,
    participantCode,
    cohort,
    wave: wave || 1,
    answers: answers || {},
    isQualityFlagged: qualityFlags.length > 0,
    qualityFlags,
  };

  project.submissions.push(submission);
  project.updatedAt = new Date().toISOString();
  saveDb(db);

  res.status(201).json({
    success: true,
    receiptId: submission.id,
    completionMessage: project.collectionSettings.completionMessage || 'Thank you! Your response has been submitted.',
    timestamp: submission.submittedAt,
  });
});

// 5. QR Code Generator
app.get('/api/surveys/:surveyId/qr', async (req, res) => {
  try {
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const targetUrl = `${appUrl}/?surveyId=${req.params.surveyId}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    res.json({ qrDataUrl, targetUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR code', details: err.message });
  }
});

// 6. Gemini AI Assistance Endpoints
app.post('/api/ai/suggest-items', async (req, res) => {
  const { constructName, conceptualDefinition, dimensionName, dimensionDescription, existingItems } = req.body;

  try {
    const prompt = `You are an expert psychometrician following Churchill (1979) and Clark & Watson (2019) scale development principles.
Generate 4 candidate Likert items for the following construct dimension:

Construct: ${constructName}
Conceptual Definition: ${conceptualDefinition}
Dimension: ${dimensionName}
Dimension Scope: ${dimensionDescription}
Existing Item Pool Count: ${existingItems?.length || 0}

Rules for item wording:
1. Short, direct, clear behavioral or experiential statements.
2. Avoid double-barrelled questions (never combine two clauses with 'and' or two distinct concepts).
3. Avoid extreme words ("always", "never", "completely").
4. Formulate statements appropriate for a 5-point Likert agreement scale (1=Strongly Disagree to 5=Strongly Agree).
5. Include 1 reverse-worded candidate item.

Return a JSON array of objects with the exact schema:
[
  {
    "wording": "string",
    "isReverseScored": boolean,
    "reverseRationale": "string (or empty if false)",
    "sourceOrRationale": "string explaining how it captures the dimension"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ suggestions: parsed });
  } catch (err: any) {
    console.error('AI item suggestion error:', err);
    // Graceful fallback suggestions if key not present or network issues
    res.json({
      suggestions: [
        {
          wording: `Team members actively support my contributions regarding ${dimensionName}.`,
          isReverseScored: false,
          sourceOrRationale: 'Direct indicator of team support and valuation.',
        },
        {
          wording: `It is difficult to voice concerns regarding ${dimensionName} in this group.`,
          isReverseScored: true,
          reverseRationale: 'Captures hesitation and perceived barriers.',
          sourceOrRationale: 'Reverse indicator of interpersonal safety.',
        },
      ],
      notice: 'Generated via fallback rule set (Gemini API unavailable or key pending).',
    });
  }
});

app.post('/api/ai/heuristic-review', async (req, res) => {
  const { wording, dimensionName } = req.body;

  try {
    const prompt = `Analyze this candidate psychometric scale item for measurement flaws:
Item: "${wording}"
Target Dimension: "${dimensionName}"

Evaluate for:
1. Double-barrelled phrasing (multiple ideas).
2. Leading or socially desirable phrasing.
3. Ambiguity or vague referents.
4. Unnecessary linguistic complexity.
5. Absolute qualifiers ("never", "always").

Respond in JSON with schema:
{
  "flags": [
    {
      "type": "double_barrelled" | "leading" | "ambiguous" | "unnecessary_complexity" | "extreme_wording",
      "severity": "warning" | "info" | "caution",
      "message": "explanation",
      "suggestion": "improved wording"
    }
  ],
  "overallVerdict": "clean" | "minor_issues" | "major_issues",
  "recommendedWording": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err: any) {
    // Deterministic heuristic check fallback
    const flags: any[] = [];
    const lower = (wording || '').toLowerCase();
    if (lower.includes(' and ') && (lower.includes('?') || lower.length > 50)) {
      flags.push({
        type: 'double_barrelled',
        severity: 'warning',
        message: 'Contains "and", potentially asking two distinct questions simultaneously.',
        suggestion: 'Separate compound clauses into single specific actions.',
      });
    }
    if (lower.includes('never') || lower.includes('always')) {
      flags.push({
        type: 'extreme_wording',
        severity: 'caution',
        message: 'Absolute words ("always", "never") frequently cause ceiling or floor distortion.',
        suggestion: 'Soften the frequency anchor to improve variance.',
      });
    }

    res.json({
      flags,
      overallVerdict: flags.length > 0 ? 'minor_issues' : 'clean',
      recommendedWording: wording,
    });
  }
});

app.post('/api/ai/explain-step', async (req, res) => {
  const { stepNumber, stageName, constructContext } = req.body;

  try {
    const prompt = `You are an academic scale development mentor. Explain step ${stepNumber}: "${stageName}" in scale development for a researcher developing a scale for "${constructContext}".
Provide:
1. Methodological Purpose (grounded in Churchill 1979, Clark & Watson 2019, or Boateng et al. 2018).
2. Key Practical Tasks.
3. Common Mistakes Postgraduate Researchers Make.
4. Completion vs. Evidence Criteria (distinguishing completing the activity from having sufficient statistical evidence).

Keep formatting clean and academic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ explanation: response.text });
  } catch (err: any) {
    res.json({
      explanation: `Step ${stepNumber} (${stageName}) is a pivotal phase in psychometric instrument design according to Boateng et al. (2018). Focus on strict domain sampling, avoiding construct under-representation, and logging every decision transparently.`,
    });
  }
});

// Interactive Cognitive Partner Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { messages, projectContext, currentStep } = req.body;

  try {
    const systemPrompt = `You are an elite academic psychometrician and cognitive partner for a postgraduate/doctoral researcher working on the scale development platform "ScaleLab".
You follow the rigorous methodological foundations of:
- Churchill (1979), A Paradigm for Developing Better Measures
- Clark & Watson (1995, 2019), Constructing Validity
- Hinkin (1998), Development of Measures in Survey Questionnaires
- Boateng et al. (2018), Best Practices for Developing and Validating Scales
- Hu & Bentler (1999) and Wolf et al. (2013) on sample size and CFA fit

Your role as a COGNITIVE PARTNER:
1. Actively debate, critique, and spar with the researcher. Don't just be an agreeable yes-man.
2. Probe their construct definitions for construct under-representation and construct-irrelevant variance.
3. Challenge them if they are developing a new scale when valid published scales already exist (e.g. Edmondson 1999, Liang et al. 2012, Brown & Leigh 1996, May et al. 2004, Clark 2020 4-Stages, Carmeli & Gittell 2009). Discuss trade-offs between adapting an existing scale vs. creating a de novo measure.
4. Enforce reflective vs. formative measurement model clarity (Bollen & Lennox, 1991).
5. Critique item wording for subtle double-barrelled structure, extreme frequency anchors, and leading tones.
6. Help synthesize real statistical results (EFA eigenvalues, Scree vs Parallel Analysis, Promax loadings, CFA CFI/RMSEA/SRMR, Omega vs Alpha, AVE, HTMT) in plain academic language without treating cutoffs as rigid universal pass/fail rules.
7. NEVER invent statistical numbers. Always ground discussions in the real project context provided.

Current Project Context:
- Scale Title: ${projectContext?.title || 'ScaleLab Project'}
- Intended Construct: ${projectContext?.intendedConstruct || 'Not specified'}
- Discipline: ${projectContext?.discipline || 'Social Sciences'}
- Target Population: ${projectContext?.targetPopulation || 'General adults'}
- Measurement Model: ${projectContext?.measurementModel || 'reflective'}
- Current Active Step: Step ${currentStep || 1}
- Dimensions (${projectContext?.dimensions?.length || 0}): ${projectContext?.dimensions?.map((d: any) => `${d.name} (${d.code})`).join(', ') || 'None'}
- Retained Items (${projectContext?.items?.filter((i: any) => i.status === 'retained').length || 0}): ${projectContext?.items?.filter((i: any) => i.status === 'retained').map((i: any) => `[${i.id}] "${i.wording}"`).slice(0, 10).join('; ') || 'None'}
- Existing Reviewed Scales (${projectContext?.existingInstrumentsReviewed?.length || 0}): ${projectContext?.existingInstrumentsReviewed?.map((ins: any) => ins.name).join(', ') || 'None'}`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `As your psychometric cognitive partner, I recommend critically examining construct boundaries following Churchill (1979) and Clark & Watson (2019). 

In psychological safety and workplace climate research, many prominent instruments have been devised across recent years:
1. **Edmondson (1999)**: The 7-item team benchmark, but largely unidimensional and prone to reverse-coding method artifacts.
2. **Clark (2020)**: 4-Stages model (Inclusion, Learner, Contributor, Challenger Safety) providing a developmental progression.
3. **Edmondson (2018 FOAS)**: 4-facet operational index (Attitude to risk/failure, Open conversation, Willingness to help, Inclusivity).
4. **Liang, Farh & Farh (2012)**: Specific to promotive and prohibitive voice.
5. **Kang, Kim & Chang (2023)**: Digital Workplace Psychological Safety Scale for asynchronous chat and hybrid teams.
6. **O'Donovan & McAuliffe (2020) & Grailey et al. (2021)**: High-acuity healthcare and clinical hierarchy scales.

To justify developing a new scale for "${projectContext?.intendedConstruct || 'your construct'}" in "${projectContext?.targetPopulation || 'your target population'}", you must show why these 22+ published instruments either suffer from construct under-representation, lack domain-specific indicators, or confound distinct facets. Would you like to review the specific item wording or contrast your proposed dimensions against these published measures?`,
      });
    }

    // Format message history for Gemini
    const contents = (messages && Array.isArray(messages) && messages.length > 0)
      ? messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || '' }],
        }))
      : [{ role: 'user', parts: [{ text: 'Hello, please help me assess our scale development plan.' }] }];

    // Call Gemini with timeout
    const callPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out')), 8000)
    );

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;
    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('AI chat partner error:', err);
    res.json({
      reply: `As your psychometric cognitive partner, I recommend focusing closely on construct boundaries (Churchill, 1979). In psychological safety and organizational research, many instruments have emerged across recent years (Edmondson 1999, Clark 2020, Liang et al. 2012, Kang et al. 2023, Carmeli & Gittell 2009, O'Donovan & McAuliffe 2020). The crucial justification for a new scale lies in demonstrating that existing measures either confound dimensions, focus exclusively on voice, or fail to capture the specific operational facets of your target population. What specific limitation of Edmondson or Clark are you addressing?`,
    });
  }
});

// 7. Published Instruments Database Direct Endpoint
app.get('/api/instruments', (req, res) => {
  const query = (req.query.q as string) || '';
  const category = (req.query.category as string) || 'All';
  const results = searchPublishedInstruments(query, category);
  res.json({
    totalCount: PUBLISHED_INSTRUMENTS_DATABASE.length,
    matchedCount: results.length,
    instruments: results,
  });
});

// 8. DOI Reference Checker & CrossRef Verification Endpoints
function cleanDoiString(doi: string): string {
  if (!doi) return '';
  return doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

function formatCrossrefApa(item: any, doi: string): string {
  const authors = Array.isArray(item.author)
    ? item.author
        .map((a: any) => {
          if (a.family && a.given) {
            const initials = a.given
              .split(' ')
              .map((g: string) => (g ? `${g[0]}.` : ''))
              .join(' ');
            return `${a.family}, ${initials}`;
          }
          return a.name || a.family || '';
        })
        .filter(Boolean)
    : [];

  let authorsStr = authors.length > 0 ? authors.join(', ') : 'Unknown Authors';
  if (authors.length > 2) {
    authorsStr = `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}`;
  } else if (authors.length === 2) {
    authorsStr = `${authors[0]} & ${authors[1]}`;
  }

  const year =
    item['published-print']?.['date-parts']?.[0]?.[0] ||
    item['published-online']?.['date-parts']?.[0]?.[0] ||
    item['published']?.['date-parts']?.[0]?.[0] ||
    item['created']?.['date-parts']?.[0]?.[0] ||
    'n.d.';

  const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled';
  const journal = Array.isArray(item['container-title'])
    ? item['container-title'][0]
    : item['container-title'] || '';
  const volume = item.volume ? `${item.volume}` : '';
  const issue = item.issue ? `(${item.issue})` : '';
  const page = item.page ? `, ${item.page}` : '';

  let publicationDetails = '';
  if (journal) {
    publicationDetails = `${journal}${volume ? `, ${volume}` : ''}${issue}${page}.`;
  }

  return `${authorsStr} (${year}). ${title}. ${publicationDetails} https://doi.org/${doi}`.trim();
}

app.get('/api/references/check-doi', async (req, res) => {
  const rawDoi = (req.query.doi as string) || '';
  const cleanDoi = cleanDoiString(rawDoi);

  if (!cleanDoi) {
    return res.status(400).json({ valid: false, error: 'A valid DOI string or URL is required.' });
  }

  // First check if it matches a known instrument in our local database
  const localMatch = PUBLISHED_INSTRUMENTS_DATABASE.find(
    inst => inst.doi && cleanDoiString(inst.doi).toLowerCase() === cleanDoi.toLowerCase()
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const response = await fetch(crossrefUrl, {
      headers: {
        'User-Agent': 'ScaleLab-Psychometrics/1.0 (mailto:reference-audit@scalelab.app)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      const item = data.message;
      const authors = Array.isArray(item.author)
        ? item.author.map((a: any) => `${a.given ? a.given + ' ' : ''}${a.family || a.name || ''}`)
        : [];
      const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled';
      const containerTitle = Array.isArray(item['container-title'])
        ? item['container-title'][0]
        : item['container-title'] || '';
      const year =
        item['published-print']?.['date-parts']?.[0]?.[0] ||
        item['published-online']?.['date-parts']?.[0]?.[0] ||
        item['created']?.['date-parts']?.[0]?.[0] ||
        'n.d.';

      const apaCitation = formatCrossrefApa(item, cleanDoi);

      return res.json({
        valid: true,
        source: 'crossref',
        doi: cleanDoi,
        doiUrl: `https://doi.org/${cleanDoi}`,
        title,
        authors,
        containerTitle,
        year,
        volume: item.volume || '',
        issue: item.issue || '',
        page: item.page || '',
        publisher: item.publisher || '',
        citationCount: item['is-referenced-by-count'] ?? null,
        type: item.type || 'journal-article',
        apaCitation,
        localInstrumentMatch: localMatch ? { id: localMatch.id, name: localMatch.name } : null,
      });
    } else {
      // Crossref returned non-200 (e.g. 404)
      if (localMatch) {
        return res.json({
          valid: true,
          source: 'local_database',
          doi: cleanDoi,
          doiUrl: `https://doi.org/${cleanDoi}`,
          title: localMatch.name,
          authors: [localMatch.authors],
          containerTitle: localMatch.citation,
          year: localMatch.year,
          publisher: 'Peer-reviewed academic press',
          citationCount: null,
          type: 'scale_instrument',
          apaCitation: `${localMatch.citation} https://doi.org/${cleanDoi}`,
          localInstrumentMatch: { id: localMatch.id, name: localMatch.name },
        });
      }

      return res.status(404).json({
        valid: false,
        doi: cleanDoi,
        doiUrl: `https://doi.org/${cleanDoi}`,
        error: `DOI "${cleanDoi}" was not found in the CrossRef registry. Verify the identifier or check directly on doi.org.`,
      });
    }
  } catch (err: any) {
    // Fallback to local instrument if present or valid format
    if (localMatch) {
      return res.json({
        valid: true,
        source: 'local_database_fallback',
        doi: cleanDoi,
        doiUrl: `https://doi.org/${cleanDoi}`,
        title: localMatch.name,
        authors: [localMatch.authors],
        containerTitle: localMatch.citation,
        year: localMatch.year,
        publisher: 'Peer-reviewed academic press',
        citationCount: null,
        type: 'scale_instrument',
        apaCitation: `${localMatch.citation} https://doi.org/${cleanDoi}`,
        localInstrumentMatch: { id: localMatch.id, name: localMatch.name },
      });
    }

    // Standard DOI syntax pattern check: 10.xxxx/...
    const isStandardDoiSyntax = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(cleanDoi);

    res.json({
      valid: isStandardDoiSyntax,
      source: 'offline_syntax_verification',
      doi: cleanDoi,
      doiUrl: `https://doi.org/${cleanDoi}`,
      title: 'Syntactically Valid DOI (External CrossRef registry unreachable)',
      authors: [],
      containerTitle: '',
      year: null,
      publisher: '',
      citationCount: null,
      type: 'unknown',
      apaCitation: `Available via https://doi.org/${cleanDoi}`,
      notice: 'Network connection to CrossRef API timed out. You can still open the link directly on doi.org.',
    });
  }
});

// Search CrossRef by query string to find candidate DOIs
app.get('/api/references/search-doi', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query parameter (q) is required.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=6`;
    const response = await fetch(crossrefUrl, {
      headers: {
        'User-Agent': 'ScaleLab-Psychometrics/1.0 (mailto:reference-audit@scalelab.app)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      const items = (data.message?.items || []).map((item: any) => {
        const cleanDoi = item.DOI || '';
        const authors = Array.isArray(item.author)
          ? item.author.map((a: any) => `${a.given ? a.given + ' ' : ''}${a.family || a.name || ''}`)
          : [];
        const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled';
        const containerTitle = Array.isArray(item['container-title'])
          ? item['container-title'][0]
          : item['container-title'] || '';
        const year =
          item['published-print']?.['date-parts']?.[0]?.[0] ||
          item['published-online']?.['date-parts']?.[0]?.[0] ||
          item['created']?.['date-parts']?.[0]?.[0] ||
          'n.d.';

        return {
          doi: cleanDoi,
          doiUrl: `https://doi.org/${cleanDoi}`,
          title,
          authors,
          containerTitle,
          year,
          publisher: item.publisher || '',
          citationCount: item['is-referenced-by-count'] ?? null,
          apaCitation: formatCrossrefApa(item, cleanDoi),
        };
      });

      return res.json({ results: items });
    }
    res.json({ results: [] });
  } catch (err: any) {
    // Search local database as fallback
    const qLower = query.toLowerCase();
    const matched = PUBLISHED_INSTRUMENTS_DATABASE.filter(
      inst =>
        inst.name.toLowerCase().includes(qLower) ||
        inst.citation.toLowerCase().includes(qLower) ||
        inst.authors.toLowerCase().includes(qLower)
    ).map(inst => ({
      doi: inst.doi || '',
      doiUrl: inst.doi ? `https://doi.org/${cleanDoiString(inst.doi)}` : '',
      title: inst.name,
      authors: [inst.authors],
      containerTitle: inst.citation,
      year: inst.year,
      publisher: 'Academic Press',
      citationCount: null,
      apaCitation: `${inst.citation} ${inst.doi ? 'https://doi.org/' + cleanDoiString(inst.doi) : ''}`,
    }));

    res.json({ results: matched, notice: 'Returned from local instrument database (CrossRef query timed out).' });
  }
});

// Published Instrument Search & Gap Analysis Endpoint
app.post('/api/ai/search-instruments', async (req, res) => {
  const { query, targetConstruct, discipline, targetPopulation, categoryTag } = req.body;

  // Search local verified database
  const matchedLocal = searchPublishedInstruments(query || targetConstruct || '', categoryTag);

  try {
    const prompt = `You are a systematic literature search expert in psychometrics and survey measurement.
The researcher is investigating the construct: "${targetConstruct || query || 'Workplace Psychological Safety'}" in the field of "${discipline || 'Management & Organizational Behavior'}" targeting "${targetPopulation || 'Workplace teams'}".
Search query: "${query || targetConstruct || 'Psychological Safety'}".

Provide up to 4 real, published empirical instruments from peer-reviewed literature for this or closely related constructs (especially recent developments 2018-2024 or specialized adaptations).
For each instrument, provide:
1. Exact scale name and publication year
2. Complete academic citation (authors, year, journal, volume, pages)
3. Number of items and proposed dimensions
4. Response format (e.g. 5-point Likert)
5. Validation sample population
6. Psychometric properties (alpha, factor structure)
7. Core strengths
8. Methodological limitations or gaps relative to the researcher's context ("Why a researcher might need a new or adapted instrument")

Return valid JSON with schema:
[
  {
    "id": "string",
    "name": "string",
    "authors": "string",
    "year": number,
    "citation": "string",
    "targetConstruct": "string",
    "discipline": "string",
    "categoryTag": "Recent (2018-2024)" | "Multidimensional" | "Healthcare & Clinical" | "Digital & Hybrid Work" | "Voice & Dissent" | "Foundational",
    "itemCount": number,
    "dimensions": ["string"],
    "responseScale": "string",
    "samplePopulation": "string",
    "psychometrics": {
      "reportedAlpha": "string",
      "factorStructure": "string"
    },
    "sampleItems": ["string"],
    "strengths": "string",
    "limitationsAndGaps": "string"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const aiResults = JSON.parse(response.text?.trim() || '[]');
    // Combine local matched and AI results without duplicates
    const combined = [...matchedLocal];
    for (const air of aiResults) {
      if (!combined.some(c => c.name.toLowerCase() === air.name?.toLowerCase() || (air.id && c.id === air.id))) {
        combined.push({
          ...air,
          categoryTag: air.categoryTag || 'Recent (2018-2024)',
          sampleItems: air.sampleItems || [],
          psychometrics: air.psychometrics || {},
        });
      }
    }

    res.json({ instruments: combined, totalCount: combined.length });
  } catch (err: any) {
    console.error('Instrument search error:', err);
    res.json({
      instruments: matchedLocal.length > 0 ? matchedLocal : PUBLISHED_INSTRUMENTS_DATABASE,
      totalCount: matchedLocal.length > 0 ? matchedLocal.length : PUBLISHED_INSTRUMENTS_DATABASE.length,
    });
  }
});

// ==========================================
// STATIC ASSETS / VITE MIDDLEWARES
// ==========================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScaleLab full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
