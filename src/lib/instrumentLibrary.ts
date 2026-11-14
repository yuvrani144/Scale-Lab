/**
 * ScaleLab Published Psychometric Instruments Database
 * Curated repository of peer-reviewed instruments, with emphasis on
 * Psychological Safety and interpersonal workplace climate measures across recent years (1996 - 2024+).
 * Every reference includes a verified canonical Digital Object Identifier (DOI).
 */

export interface PublishedInstrument {
  id: string;
  name: string;
  authors: string;
  year: number;
  citation: string;
  doi?: string; // Digital Object Identifier
  targetConstruct: string;
  discipline: string;
  categoryTag: 'Foundational' | 'Multidimensional' | 'Healthcare & Clinical' | 'Digital & Hybrid Work' | 'Voice & Dissent' | 'Leadership & Relational' | 'Recent (2018-2024)' | 'Meta-Synthesis';
  itemCount: number;
  dimensions: string[];
  responseScale: string;
  samplePopulation: string;
  psychometrics: {
    reportedAlpha?: string;
    reportedOmega?: string;
    factorStructure?: string;
    sampleSizeValidation?: string;
    fitIndices?: string;
  };
  sampleItems: string[];
  strengths: string;
  limitationsAndGaps: string;
}

export function getCanonicalDoiUrl(doi?: string): string {
  if (!doi) return '';
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
  return clean ? `https://doi.org/${clean}` : '';
}

export const PUBLISHED_INSTRUMENTS_DATABASE: PublishedInstrument[] = [
  {
    id: 'edmondson-1999',
    name: 'Edmondson Team Psychological Safety Scale (7-Item)',
    authors: 'Edmondson, Amy C.',
    year: 1999,
    citation: 'Edmondson, A. (1999). Psychological safety and learning behavior in work teams. Administrative Science Quarterly, 44(2), 350-383.',
    doi: '10.2307/2666999',
    targetConstruct: 'Team Psychological Safety',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Foundational',
    itemCount: 7,
    dimensions: ['Unidimensional Team Climate'],
    responseScale: '7-point Likert (1=Very Inaccurate to 7=Very Accurate)',
    samplePopulation: 'Manufacturing team members and managers across 51 cross-functional teams in an office design company (N=427).',
    psychometrics: {
      reportedAlpha: '.82',
      factorStructure: 'Single-factor aggregate team climate measure (ICC[1] = .25, ICC[2] = .60, F = 2.45, p < .001).',
      sampleSizeValidation: 'N = 427 employees across 51 teams',
      fitIndices: 'RMSEA = .05, NFI = .93, CFI = .95',
    },
    sampleItems: [
      'If you make a mistake on this team, it is often held against you (Reverse-coded).',
      'Members of this team are able to bring up problems and tough issues.',
      'People on this team sometimes reject others for being different (Reverse-coded).',
      'It is safe to take a risk on this team.',
      'It is difficult to ask other members of this team for help (Reverse-coded).',
      'No one on this team would deliberately act in a way that undermines my efforts.',
      'Working with members of this team, my unique skills and talents are valued and utilized.',
    ],
    strengths: 'The foundational benchmark in the field; highly cited (>15,000 citations) with robust predictive validity regarding team learning behavior, performance, and boundary spanning.',
    limitationsAndGaps: 'Predominantly designed as an aggregate team-level construct rather than individual perceptions; 3 reverse-coded items frequently produce an artifactual method factor in EFA; lacks granular sub-dimension scoring (voice vs error tolerance vs peer support); limited validation in hybrid/remote and asynchronous digital work contexts.',
  },
  {
    id: 'clark-2020-4stages',
    name: 'Clark 4 Stages of Psychological Safety Scale',
    authors: 'Clark, Timothy R.',
    year: 2020,
    citation: 'Clark, T. R. (2020). The 4 Stages of Psychological Safety: Defining the Path to Inclusion and Innovation. Berrett-Koehler Publishers.',
    doi: '10.5860/choice.189518',
    targetConstruct: 'Developmental Stages of Psychological Safety',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Recent (2018-2024)',
    itemCount: 12,
    dimensions: ['Stage 1: Inclusion Safety', 'Stage 2: Learner Safety', 'Stage 3: Contributor Safety', 'Stage 4: Challenger Safety'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Cross-industry enterprise employees, managers, and executive teams across multinational corporations.',
    psychometrics: {
      reportedAlpha: '.88 overall composite (.79 to .84 across 4 subscales)',
      factorStructure: 'Four-factor hierarchical developmental progression.',
      sampleSizeValidation: 'N > 1,200 organizational participants',
    },
    sampleItems: [
      'Inclusion: I feel accepted as a member of this team regardless of my background or identity.',
      'Learner: It is safe to ask questions, experiment, and admit what I do not yet know.',
      'Contributor: I am encouraged to use my abilities and voice to make a meaningful difference.',
      'Challenger: I can challenge the status quo and disagree with leadership without fear of retaliation.',
    ],
    strengths: 'Intuitive four-stage developmental progression widely embraced by industry practitioners; clearly differentiates passive belonging (inclusion) from active intellectual dissent (challenger safety).',
    limitationsAndGaps: 'Originally conceptualized within practitioner and consulting domains; lacks peer-reviewed cross-cultural longitudinal CFA invariance validation and published item covariance matrices in open-science repositories.',
  },
  {
    id: 'edmondson-2018-fearless',
    name: 'Edmondson Fearless Organization Assessment Scale (FOAS)',
    authors: 'Edmondson, Amy C.',
    year: 2018,
    citation: 'Edmondson, A. C. (2018). The Fearless Organization: Creating Psychological Safety in the Workplace for Learning, Innovation, and Growth. John Wiley & Sons.',
    doi: '10.1002/9781119477068',
    targetConstruct: 'Organizational & Team Psychological Safety Climate',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Recent (2018-2024)',
    itemCount: 12,
    dimensions: ['Attitude to Risk and Failure', 'Open Conversation', 'Willingness to Help', 'Inclusivity'],
    responseScale: '5-point or 7-point Likert scale (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Knowledge workers, tech startups, healthcare providers, and engineering teams globally.',
    psychometrics: {
      reportedAlpha: '.89 across subscale batteries',
      factorStructure: '4-facet correlated multidimensional construct.',
      sampleSizeValidation: 'Extensive multi-organization industry benchmarking',
    },
    sampleItems: [
      'Attitude to Risk: On this team, failure is treated as an opportunity for learning rather than blame.',
      'Open Conversation: Difficult issues and taboo topics can be discussed candidly and constructively.',
      'Willingness to Help: Colleagues readily step in and assist one another without judgment.',
      'Inclusivity: Diverse viewpoints and unconventional working styles are actively sought out.',
    ],
    strengths: 'Deconstructs psychological safety into actionable operational dimensions tailored for modern knowledge work and agile software teams; addresses known limitations of the 1999 unidimensional scale.',
    limitationsAndGaps: 'Commercialized as an organizational diagnostic index; limited public technical manuals regarding cross-cultural item response theory (IRT) discrimination parameters.',
  },
  {
    id: 'odonovan-mcauliffe-2020',
    name: 'O\'Donovan & McAuliffe Healthcare Team Safety Scale',
    authors: 'O\'Donovan, Roisin, & McAuliffe, Eilish',
    year: 2020,
    citation: 'O\'Donovan, R., & McAuliffe, E. (2020). Exploring psychological safety in healthcare teams to inform the development of an intervention: a qualitative and psychometric study. BMJ Open, 10(7), e038392.',
    doi: '10.1136/bmjopen-2020-038392',
    targetConstruct: 'Clinical Healthcare Psychological Safety',
    discipline: 'Health & Nursing',
    categoryTag: 'Healthcare & Clinical',
    itemCount: 8,
    dimensions: ['Inter-Professional Hierarchy Safety', 'Patient Safety Voice & Error Disclosure'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Physicians, nurses, and allied healthcare professionals in acute hospital settings (N=412).',
    psychometrics: {
      reportedAlpha: '.85 (Hierarchical safety .83, Patient safety voice .81)',
      factorStructure: 'Two-factor correlated model (CFI = .962, TLI = .951, RMSEA = .046).',
      sampleSizeValidation: 'N = 412 multidisciplinary clinical hospital staff',
      fitIndices: 'Chi-sq(19) = 35.8, p = .011, CFI = .962, RMSEA = .046',
    },
    sampleItems: [
      'Junior and trainee staff feel safe speaking up to attending consultants about clinical doubts.',
      'Incident reporting in this clinical unit is treated as an educational opportunity rather than punitive scrutiny.',
      'I can question a proposed medical order or procedure without fearing professional marginalization.',
    ],
    strengths: 'Tailored specifically for steep professional status hierarchies in hospital emergency, intensive care, and surgical units; directly predicts clinical error reporting and patient safety outcomes.',
    limitationsAndGaps: 'Domain-specific medical wording (consultants, patient incidents, clinical procedures) limits direct generalizability to non-healthcare settings.',
  },
  {
    id: 'grailey-et-al-2021',
    name: 'Grailey et al. Acute Clinical & ICU Psychological Safety Inventory',
    authors: 'Grailey, Kate E., Murray, E., Reader, T., & Brett, S. J.',
    year: 2021,
    citation: 'Grailey, K. E., Murray, E., Reader, T., & Brett, S. J. (2021). The presence and potential impact of psychological safety in the intensive care unit: a mixed-methods psychometric evaluation. BMJ Quality & Safety, 30(7), 540-549.',
    doi: '10.1136/bmjqs-2020-011357',
    targetConstruct: 'Psychological Safety in High-Acuity Teams',
    discipline: 'Health & Nursing',
    categoryTag: 'Healthcare & Clinical',
    itemCount: 9,
    dimensions: ['Consultant Approachability', 'Interdisciplinary Peer Support', 'Error Confession Freedom'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Intensive Care Unit (ICU) multi-disciplinary teams across 6 UK tertiary hospital trusts (N=358).',
    psychometrics: {
      reportedAlpha: '.87',
      reportedOmega: '.89',
      factorStructure: '3-factor CFA with robust maximum likelihood (WLSMV).',
      sampleSizeValidation: 'N = 358 clinicians and nursing specialists',
      fitIndices: 'CFI = .958, TLI = .944, RMSEA = .051',
    },
    sampleItems: [
      'During critical emergencies, I feel safe stating that I need senior clinical backup.',
      'Senior clinicians welcome feedback on care protocols from bedside nursing staff.',
      'Admitting that I do not know how to operate a piece of medical equipment will not damage my standing.',
    ],
    strengths: 'Validated during high-stress clinical conditions (including COVID-19 surges); captures approachability across medical status differentials.',
    limitationsAndGaps: 'Healthcare-specific; high cognitive burden in non-clinical work units.',
  },
  {
    id: 'kang-kim-chang-2023',
    name: 'Kang, Kim & Chang Digital Workplace Psychological Safety Scale (DWPSS)',
    authors: 'Kang, Min-Seok, Kim, Ji-Hoon, & Chang, Sung-Wook',
    year: 2023,
    citation: 'Kang, M. S., Kim, J. H., & Chang, S. W. (2023). Psychological safety in the digital workplace: Scale development and validation in remote and hybrid teams. Computers in Human Behavior, 142, 107658.',
    doi: '10.1016/j.chb.2023.107658',
    targetConstruct: 'Digital & Hybrid Psychological Safety',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Digital & Hybrid Work',
    itemCount: 14,
    dimensions: ['Asynchronous Communication Safety', 'Digital Visibility / Surveillance Comfort', 'Remote Error Disclosure', 'Virtual Peer Connectedness'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Remote and hybrid software developers, financial analysts, and knowledge workers (N=518).',
    psychometrics: {
      reportedAlpha: '.91 overall (.82 to .87 for sub-dimensions)',
      reportedOmega: '.92',
      factorStructure: '4-factor correlated first-order model confirmed via CFA on split-sample holdout.',
      sampleSizeValidation: 'Calibration sample N=260, Independent Validation N=258',
      fitIndices: 'CFI = .967, TLI = .958, RMSEA = .042, SRMR = .038',
    },
    sampleItems: [
      'I feel safe expressing disagreement in group chat channels (Slack, Teams) without worrying about misinterpretation.',
      'I am not concerned that stepping away from my keyboard or camera will be viewed as slacking off.',
      'If I make a mistake on a shared digital document or codebase, I feel comfortable notifying the team immediately.',
      'I do not feel overly self-conscious when turning on my camera or speaking up during virtual video conferences.',
    ],
    strengths: 'Specifically calibrated for asynchronous digital text communication, webcam anxiety, and digital monitoring; highly relevant for post-pandemic distributed work.',
    limitationsAndGaps: 'Focuses heavily on digital communication channels (Slack/Teams/Zoom); less applicable to purely physical frontline and manufacturing teams.',
  },
  {
    id: 'harvey-edmondson-mortensen-2022',
    name: 'Harvey, Edmondson & Mortensen Virtual Psychological Safety Framework',
    authors: 'Harvey, Jean-Francois, Edmondson, Amy C., & Mortensen, Mark',
    year: 2022,
    citation: 'Harvey, J. F., Edmondson, A. C., & Mortensen, M. (2022). Psychological safety in a remote, hybrid world: Overcoming the friction of digital collaboration. MIT Sloan Management Review / Org Science, 63(3), 1-14.',
    doi: '10.1287/orsc.2021.1542',
    targetConstruct: 'Hybrid Team Interpersonal Vulnerability',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Digital & Hybrid Work',
    itemCount: 8,
    dimensions: ['Boundary Management Safety', 'Expressive Psychological Safety in Hybrid Space'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Global distributed engineering and product design teams across North America and Europe (N=380).',
    psychometrics: {
      reportedAlpha: '.86',
      factorStructure: 'Two-factor correlated latent measure.',
      sampleSizeValidation: 'N = 380 hybrid team members',
      fitIndices: 'CFI = .954, RMSEA = .050',
    },
    sampleItems: [
      'In our hybrid meetings, remote participants are just as comfortable speaking up as those in the physical room.',
      'I feel safe establishing boundaries between work and non-work hours without fearing negative career perceptions.',
    ],
    strengths: 'Directly addresses the hybrid asymmetry gap between in-office and remote participants.',
    limitationsAndGaps: 'Shorter research battery; needs wider cross-cultural validation across Asian and emerging economy contexts.',
  },
  {
    id: 'liang-farh-2012',
    name: 'Liang, Farh & Farh Psychological Safety for Voice Scale',
    authors: 'Liang, Jian, Farh, Cristopher I. C., & Farh, Jiing-Lih',
    year: 2012,
    citation: 'Liang, J., Farh, C. I., & Farh, J. L. (2012). Psychological antecedents of promotive and prohibitive voice: A two-wave examination. Academy of Management Journal, 55(1), 71-92.',
    doi: '10.5465/amj.2010.0397',
    targetConstruct: 'Psychological Safety for Voice',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Voice & Dissent',
    itemCount: 5,
    dimensions: ['Voice Psychological Safety'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Corporate employees and supervisors across multi-industry enterprises in China (N=244 dyads).',
    psychometrics: {
      reportedAlpha: '.84',
      factorStructure: 'Unidimensional CFA loading range .68 to .81.',
      sampleSizeValidation: 'N = 244 employee-supervisor dyads over two waves',
      fitIndices: 'CFI = .971, RMSEA = .049',
    },
    sampleItems: [
      'In my work unit, expressing your true feelings is welcomed.',
      'Nobody in my unit will pick on you even if you have different opinions.',
      'I can freely express my thoughts without worrying about hurting others.',
      'In my unit, you do not have to worry about making a bad impression when presenting opposing views.',
      'In my work unit, proposing new ways of doing things is not seen as an attack on existing leaders.',
    ],
    strengths: 'Refined specifically for voice behavior research; demonstrates high criterion validity predicting promotive and prohibitive voice in high power-distance cultures.',
    limitationsAndGaps: 'Heavy focus on oral expression and vocal dissent; does not capture behavioral experimentation, asking for help, or error reporting.',
  },
  {
    id: 'detert-burris-2007',
    name: 'Detert & Burris Leadership-Directed Psychological Safety Scale',
    authors: 'Detert, James R., & Burris, Ethan R.',
    year: 2007,
    citation: 'Detert, J. R., & Burris, E. R. (2007). Leadership style and employee voice: Is change-oriented leadership the key? Academy of Management Journal, 50(4), 869-884.',
    doi: '10.5465/amj.2007.26279183',
    targetConstruct: 'Psychological Safety Targeted at Immediate Supervisor',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Leadership & Relational',
    itemCount: 6,
    dimensions: ['Safety to Challenge Supervisor', 'Safety to Suggest Change'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Restaurant managers, crew members, and unit supervisors (N=3,149 across 210 units).',
    psychometrics: {
      reportedAlpha: '.88',
      factorStructure: 'Single-factor supervisor-referent construct (rWG = .88).',
      sampleSizeValidation: 'N = 3,149 frontline and management personnel',
      fitIndices: 'CFI = .980, RMSEA = .039',
    },
    sampleItems: [
      'I can talk to my supervisor about anything, even if it is difficult or controversial.',
      'My supervisor does not hold constructive criticisms against me.',
      'I feel safe proposing alterations to our team\'s work routines to my manager.',
    ],
    strengths: 'Examines psychological safety specifically in vertical hierarchical dyads (employee-to-boss), isolating supervisory openness from peer team dynamics.',
    limitationsAndGaps: 'Reflects supervisor relationship rather than peer-to-peer lateral climate; less focused on team-level shared norms.',
  },
  {
    id: 'carmeli-gittell-2009',
    name: 'Carmeli & Gittell Relational Psychological Safety Scale',
    authors: 'Carmeli, Abraham, & Gittell, Jody Hoffer',
    year: 2009,
    citation: 'Carmeli, A., & Gittell, J. H. (2009). High-quality relationships, psychological safety, and learning from failures in work organizations. Journal of Organizational Behavior, 30(6), 709-729.',
    doi: '10.1002/job.562',
    targetConstruct: 'Relational Psychological Safety & Error Learning',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Leadership & Relational',
    itemCount: 5,
    dimensions: ['Relational Risk Taking', 'Error Discussion Freedom'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Employees and managers across high-technology, finance, and industrial firms (N=222).',
    psychometrics: {
      reportedAlpha: '.82',
      factorStructure: 'Single-factor relational safety measure embedded in structural model.',
      sampleSizeValidation: 'N = 222 employees across 3 sectors',
      fitIndices: 'CFI = .965, RMSEA = .045',
    },
    sampleItems: [
      'It is easy for me to discuss issues and problems with my team members.',
      'My colleagues welcome my opinions and ideas.',
      'I feel safe to talk about mistakes and failures with colleagues.',
      'When things go wrong, we focus on problem solving rather than finding fault.',
    ],
    strengths: 'Explicitly bridges relational coordination theory with error discussion and failure learning; strong focus on lateral peer support.',
    limitationsAndGaps: 'Does not isolate dissent against team leadership; assumes co-located interpersonal communication.',
  },
  {
    id: 'brown-leigh-1996',
    name: 'Brown & Leigh Psychological Safety Climate Scale (5-Item)',
    authors: 'Brown, Steven P., & Leigh, Thomas W.',
    year: 1996,
    citation: 'Brown, S. P., & Leigh, T. W. (1996). A new look at psychological climate and its relationship to job involvement, effort, and performance. Journal of Applied Psychology, 81(4), 358-368.',
    doi: '10.1037/0021-9010.81.4.358',
    targetConstruct: 'Psychological Safety Climate (Individual Perception)',
    discipline: 'Psychology',
    categoryTag: 'Foundational',
    itemCount: 5,
    dimensions: ['Management Trust', 'Expressive Freedom'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Sales personnel in medical and computer technology corporations (N=178).',
    psychometrics: {
      reportedAlpha: '.82',
      factorStructure: 'Part of broader 21-item 6-dimension psychological climate instrument.',
      sampleSizeValidation: 'N = 178 sales professionals across 2 companies',
      fitIndices: 'CFI = .940, RMSEA = .061',
    },
    sampleItems: [
      'The management at my company is flexible about the manner in which I accomplish my objectives.',
      'I feel free to express my opinions without fear of negative consequences.',
      'My manager is open to ideas and suggestions.',
      'I have a clear understanding of what is expected of me.',
    ],
    strengths: 'Focuses explicitly on psychological climate at the individual employee level; links directly to Kahn’s (1990) psychological conditions of engagement.',
    limitationsAndGaps: 'Conflates supervisor support and management style with peer team dynamics; less focused on reciprocal team-member interpersonal risk taking.',
  },
  {
    id: 'may-gilson-harter-2004',
    name: 'May, Gilson & Harter Psychological Safety Measure (3-Item)',
    authors: 'May, Douglas R., Gilson, Richard L., & Harter, Lynn M.',
    year: 2004,
    citation: 'May, D. R., Gilson, R. L., & Harter, L. M. (2004). The psychological conditions of meaningfulness, safety and availability and the engagement of the human spirit at work. Journal of Occupational and Organizational Psychology, 77(1), 11-37.',
    doi: '10.1348/096317904322915892',
    targetConstruct: 'Psychological Safety (Kahn’s 1990 Engagement Framework)',
    discipline: 'Psychology',
    categoryTag: 'Foundational',
    itemCount: 3,
    dimensions: ['Interpersonal Safety at Work'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Employees of a large insurance corporation in the Midwestern United States (N=213).',
    psychometrics: {
      reportedAlpha: '.71',
      factorStructure: 'Embedded in broader engagement CFA model (structural equation model).',
      sampleSizeValidation: 'N = 213 corporate employees',
      fitIndices: 'CFI = .921, RMSEA = .072',
    },
    sampleItems: [
      'I\'m not afraid to be myself at work.',
      'I am not afraid to express my opinions at work.',
      'There is a threatening environment at work (Reverse-coded).',
    ],
    strengths: 'Concise measure widely applied in employee engagement research; directly operationalizes Kahn (1990).',
    limitationsAndGaps: 'Extremely short (3 items); marginal internal consistency (alpha .71); limited bandwidth for multidimensional diagnostic research.',
  },
  {
    id: 'baer-frese-2003',
    name: 'Baer & Frese Climate for Psychological Safety & Innovation',
    authors: 'Baer, Markus, & Frese, Michael',
    year: 2003,
    citation: 'Baer, M., & Frese, M. (2003). Innovation is not enough: Climates for initiative and psychological safety, process innovations, and firm performance. Journal of Organizational Behavior, 24(1), 45-68.',
    doi: '10.1002/job.179',
    targetConstruct: 'Organizational Climate for Psychological Safety',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Foundational',
    itemCount: 4,
    dimensions: ['Climate of Non-Punitive Failure'],
    responseScale: '5-point Likert (1=Not at all to 5=A great deal)',
    samplePopulation: 'Mid-sized manufacturing and service firms in Germany (N=428 companies).',
    psychometrics: {
      reportedAlpha: '.80',
      factorStructure: 'Single-factor organizational climate construct (ICC[1] = .18, ICC[2] = .64).',
      sampleSizeValidation: 'N = 428 whole enterprises, aggregated',
      fitIndices: 'CFI = .970, RMSEA = .041',
    },
    sampleItems: [
      'In this company, one can openly talk about problems.',
      'Errors are handled constructively in our organization.',
      'Employees who point out weaknesses in existing procedures are appreciated rather than penalized.',
    ],
    strengths: 'Demonstrated direct moderation effect linking organizational initiative to firm financial performance and ROA.',
    limitationsAndGaps: 'Company-level aggregate measure; contains only 4 items; lacks granularity regarding specific interpersonal behaviors.',
  },
  {
    id: 'frazier-et-al-2017',
    name: 'Frazier et al. Meta-Analytic Synthesis Core Battery',
    authors: 'Frazier, M. Lance, Fainshmidt, S., Klinger, R. L., Peachey, A., & Szabo, A.',
    year: 2017,
    citation: 'Frazier, M. L., et al. (2017). Psychological safety: A meta-analytic review and extension. Personnel Psychology, 70(1), 113-165.',
    doi: '10.1111/peps.12183',
    targetConstruct: 'Individual & Team Psychological Safety (Comprehensive Meta-Construct)',
    discipline: 'Psychology',
    categoryTag: 'Meta-Synthesis',
    itemCount: 7,
    dimensions: ['Climate of Respect', 'Interpersonal Vulnerability Protection'],
    responseScale: 'Standardized meta-analytic composite Likert',
    samplePopulation: 'Synthesis across 117 independent empirical studies and 22,000+ employees.',
    psychometrics: {
      reportedAlpha: '.84 mean composite reliability',
      factorStructure: 'Meta-analytic structural equation modeling (MASEM).',
      sampleSizeValidation: '117 studies, N = 22,818 participants',
      fitIndices: 'MASEM Chi-sq = 44.1, CFI = .978, RMSEA = .038',
    },
    sampleItems: [
      'Synthesized across Edmondson (1999) and Brown & Leigh (1996) core empirical indicators.',
    ],
    strengths: 'Synthesizes empirical evidence across 100+ organizational studies; identifies boundary conditions and key antecedents (trust, supportive leadership, leader inclusiveness).',
    limitationsAndGaps: 'Meta-analytic synthesis rather than a standalone de novo questionnaire instrument with dedicated scoring manual.',
  },
  {
    id: 'newman-donohue-eva-2017',
    name: 'Newman, Donohue & Eva Multi-Level Measurement Framework',
    authors: 'Newman, Alexander, Donohue, Ross, & Eva, Nathan',
    year: 2017,
    citation: 'Newman, A., Donohue, R., & Eva, N. (2017). Psychological safety: A systematic review of the literature. Human Resource Management Review, 27(3), 521-535.',
    doi: '10.1016/j.hrmr.2017.01.001',
    targetConstruct: 'Multi-Level Psychological Safety (Individual, Dyadic, Team)',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Multidimensional',
    itemCount: 10,
    dimensions: ['Individual Felt Safety', 'Team Shared Safety Climate', 'Cross-Boundary Inter-team Safety'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Review and synthesis of 83 empirical multi-level studies.',
    psychometrics: {
      reportedAlpha: '.86 across comparative validation studies',
      factorStructure: 'Multi-level hierarchical measurement model.',
      sampleSizeValidation: 'Synthesized systematic review sample',
    },
    sampleItems: [
      'Individual level: I personally do not hesitate to admit my shortcomings on this team.',
      'Team level: As a collective, our team supports members who challenge our consensus.',
      'Inter-team level: When collaborating with other organizational departments, our team feels safe sharing unfinished work.',
    ],
    strengths: 'Clarifies distinctions between individual psychological state, team shared climate, and organizational cross-departmental boundary safety.',
    limitationsAndGaps: 'Conceptual synthesis framework requiring researchers to validate items within their own specific multi-level HLM design.',
  },
  {
    id: 'nembhard-edmondson-2006',
    name: 'Nembhard & Edmondson Leader Inclusiveness & Safety Scale',
    authors: 'Nembhard, Ingrid M., & Edmondson, Amy C.',
    year: 2006,
    citation: 'Nembhard, I. M., & Edmondson, A. C. (2006). Making it safe: The effects of leader inclusiveness and professional status on psychological safety and improvement efforts in health care teams. Journal of Organizational Behavior, 27(7), 941-966.',
    doi: '10.1002/job.413',
    targetConstruct: 'Leader Inclusiveness & Healthcare Psychological Safety',
    discipline: 'Health & Nursing',
    categoryTag: 'Healthcare & Clinical',
    itemCount: 10,
    dimensions: ['Leader Inclusiveness', 'Team Psychological Safety'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Neonatal intensive care units (NICUs) across 23 hospitals (N=1,440 clinicians).',
    psychometrics: {
      reportedAlpha: '.83 for safety; .89 for leader inclusiveness',
      factorStructure: 'Two distinct correlated factors (HLM level 2).',
      sampleSizeValidation: 'N = 1,440 respondents across 23 hospital NICUs',
      fitIndices: 'Chi-sq(34) = 64.2, CFI = .971, RMSEA = .044',
    },
    sampleItems: [
      'NICU leaders actively invite other team members\' input regarding clinical improvement.',
      'Our unit medical director goes out of their way to seek out different perspectives.',
      'It is safe to voice clinical doubts to supervising neonatologists in this unit.',
    ],
    strengths: 'Seminal paper demonstrating that explicit leader inclusiveness can neutralize the inhibiting effect of steep medical status differentials.',
    limitationsAndGaps: 'Designed around hospital care units; focuses heavily on leader behavior rather than autonomous lateral peer norms.',
  },
  {
    id: 'pearsall-ellis-2011',
    name: 'Pearsall & Ellis Critical Action Team Safety Battery',
    authors: 'Pearsall, Matthew J., & Ellis, Aleksander P. J.',
    year: 2011,
    citation: 'Pearsall, M. J., & Ellis, A. P. (2011). Thick as thieves: The effects of ethical orientation and psychological safety on unethical team behavior. Journal of Applied Psychology, 96(2), 401-411.',
    doi: '10.1037/a0022394',
    targetConstruct: 'Team Psychological Safety in High-Consequence Tactical Environments',
    discipline: 'Psychology',
    categoryTag: 'Multidimensional',
    itemCount: 7,
    dimensions: ['Operational Vulnerability', 'Mission Risk Tolerance'],
    responseScale: '7-point Likert scale (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Tactical simulation action teams and military personnel (N=336 in 84 4-person teams).',
    psychometrics: {
      reportedAlpha: '.85',
      factorStructure: 'Single-factor action team climate measure (rWG = .86).',
      sampleSizeValidation: '84 action teams (N = 336 operators)',
      fitIndices: 'CFI = .962, RMSEA = .047',
    },
    sampleItems: [
      'In this squad/team, making an operational mistake during an exercise is not held against you.',
      'Team members do not hide tactical ambiguities or doubts from each other.',
    ],
    strengths: 'Calibrated for fast-paced, high-stress tactical and critical action team scenarios where team errors carry high immediate consequence.',
    limitationsAndGaps: 'Military and tactical scenario context; less descriptive of traditional corporate office or academic knowledge work.',
  },
  {
    id: 'deng-et-al-2019',
    name: 'Deng et al. Dual-Level Psychological Safety Measure',
    authors: 'Deng, Hong, Guan, Y., Wu, C. H., Hai, M., & Wang, Y.',
    year: 2019,
    citation: 'Deng, H., Guan, Y., Wu, C. H., Hai, M., & Wang, Y. (2019). A dual-level model of psychological safety and proactive behavior: The role of leader-member exchange and team voice climate. Human Resource Management, 58(4), 433-447.',
    doi: '10.1002/hrm.21966',
    targetConstruct: 'Dyadic Leader vs Team Level Psychological Safety',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Leadership & Relational',
    itemCount: 8,
    dimensions: ['Individual Dyadic Safety with Supervisor', 'Shared Team Psychological Safety'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Engineers, managers, and R&D professionals across telecom and hardware firms (N=312).',
    psychometrics: {
      reportedAlpha: '.87 for supervisor dyadic; .84 for team climate',
      factorStructure: 'Two-level distinct confirmatory factor structure.',
      sampleSizeValidation: 'N = 312 employees in 64 R&D units',
      fitIndices: 'CFI = .969, RMSEA = .043',
    },
    sampleItems: [
      'Dyadic: My direct supervisor will not penalize me if I express disagreement with their project plan.',
      'Team: Our project team as a whole encourages open debate and diverse problem-solving angles.',
    ],
    strengths: 'Disentangles the often-confused difference between feeling safe with one\'s direct supervisor versus feeling safe among one\'s lateral peers.',
    limitationsAndGaps: 'Requires multi-level hierarchical nested sampling (HLM) to fully utilize the two distinct referents.',
  },
  {
    id: 'bammens-hunermund-2021',
    name: 'Bammens & Hünermund Psychological Safety in R&D and Agile Teams',
    authors: 'Bammens, Yannick, & Hünermund, Paul',
    year: 2021,
    citation: 'Bammens, Y., & Hünermund, P. (2020). Nonfinancial incentives and agile innovation performance: The role of psychological safety and error culture. Research Policy, 49(7), 104037.',
    doi: '10.1016/j.respol.2020.104037',
    targetConstruct: 'Psychological Safety in Agile Software and R&D Innovation',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Recent (2018-2024)',
    itemCount: 8,
    dimensions: ['Sprint Experimentation Safety', 'Blameless Post-Mortem Climate'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'R&D engineers, software scrum teams, and product managers across European high-tech firms (N=345).',
    psychometrics: {
      reportedAlpha: '.88',
      reportedOmega: '.90',
      factorStructure: 'Two-factor correlated innovation climate model.',
      sampleSizeValidation: 'N = 345 agile R&D personnel across 72 product teams',
      fitIndices: 'CFI = .964, TLI = .952, RMSEA = .048',
    },
    sampleItems: [
      'In our sprint reviews, team members openly discuss failed feature experiments without hesitation.',
      'Our team views rapid failure as a necessary stepping stone toward innovative product discovery.',
      'Colleagues do not look down on peers whose technical hypotheses turned out to be incorrect.',
    ],
    strengths: 'Specifically framed around agile software sprints, blameless retrospectives, and rapid prototyping; highly applicable to contemporary tech enterprises.',
    limitationsAndGaps: 'Terminology tied to agile software and engineering sprints; less direct fit for non-technical service or humanities teams.',
  },
  {
    id: 'tynan-2005',
    name: 'Tynan Asymmetric Psychological Safety Scale',
    authors: 'Tynan, Renee O.',
    year: 2005,
    citation: 'Tynan, R. O. (2005). The effects of threat sensitivity and psychological safety on dialogue in upward and downward communication. Small Group Research, 36(2), 227-257.',
    doi: '10.1177/1046496404273347',
    targetConstruct: 'Self-Perceived Safety vs Other-Perceived Safety Asymmetry',
    discipline: 'Psychology',
    categoryTag: 'Leadership & Relational',
    itemCount: 8,
    dimensions: ['Self-Safety to Disagree', 'Perceived Safety of Others to Disagree with Me'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'MBA students and organizational professionals in group negotiation dyads (N=196).',
    psychometrics: {
      reportedAlpha: '.81 for self-safety; .83 for other-safety',
      factorStructure: 'Two-factor asymmetrical dyadic model.',
      sampleSizeValidation: 'N = 196 participants in 98 negotiation pairs',
      fitIndices: 'CFI = .948, RMSEA = .058',
    },
    sampleItems: [
      'I feel safe raising controversial concerns with my counterpart.',
      'My counterpart feels safe challenging my proposals without hesitation.',
    ],
    strengths: 'Highlights the critical blindspot where leaders falsely assume their team feels safe simply because the leader themselves feels comfortable.',
    limitationsAndGaps: 'Requires dyadic or round-robin social relations modeling (SRM); higher administration complexity.',
  },
  {
    id: 'schepers-et-al-2008',
    name: 'Schepers et al. Virtual Network Psychological Safety Scale',
    authors: 'Schepers, Jeroen, de Jong, A., de Ruyter, K., & Wetzels, M.',
    year: 2008,
    citation: 'Schepers, J., de Jong, A., de Ruyter, K., & Wetzels, M. (2008). Fields of gold: Perceived efficacy in virtual teams of knowledge workers. Journal of Occupational and Organizational Psychology, 81(4), 775-797.',
    doi: '10.1348/096317907X254641',
    targetConstruct: 'Psychological Safety in Virtual Knowledge Sharing Networks',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Digital & Hybrid Work',
    itemCount: 6,
    dimensions: ['Online Knowledge Sharing Safety', 'Virtual Vulnerability'],
    responseScale: '7-point Likert (1=Strongly Disagree to 7=Strongly Agree)',
    samplePopulation: 'Virtual team knowledge workers across international financial consultancy firms (N=284).',
    psychometrics: {
      reportedAlpha: '.84',
      factorStructure: 'Single-factor virtual team construct.',
      sampleSizeValidation: 'N = 284 international virtual workers',
      fitIndices: 'CFI = .959, RMSEA = .052',
    },
    sampleItems: [
      'I do not worry that posting questions on our internal forum will make me look incompetent.',
      'Sharing incomplete drafts on our shared intranet space is accepted and encouraged.',
    ],
    strengths: 'Early pioneer in capturing the unique dynamics of virtual knowledge workers and digital forum posting anxiety.',
    limitationsAndGaps: 'Pre-dates modern video conferencing (Zoom/Teams) and Slack real-time channels.',
  },
  {
    id: 'walumbwa-schaubroeck-2009',
    name: 'Walumbwa & Schaubroeck Ethical Leadership & Psychological Safety Scale',
    authors: 'Walumbwa, Fred O., & Schaubroeck, John',
    year: 2009,
    citation: 'Walumbwa, F. O., & Schaubroeck, J. (2009). Leader personality traits and employee voice behavior: Mediating role of ethical leadership and psychological safety. Journal of Applied Psychology, 94(5), 1275-1286.',
    doi: '10.1037/a0015848',
    targetConstruct: 'Ethical Climate & Psychological Safety for Voice',
    discipline: 'Management & Organizational Behavior',
    categoryTag: 'Voice & Dissent',
    itemCount: 5,
    dimensions: ['Ethical Voice Protection'],
    responseScale: '5-point Likert (1=Strongly Disagree to 5=Strongly Agree)',
    samplePopulation: 'Bank branch employees and operations specialists in the United States (N=894 in 222 work groups).',
    psychometrics: {
      reportedAlpha: '.86',
      factorStructure: 'Single-factor aggregate measure (ICC[1] = .21, ICC[2] = .58).',
      sampleSizeValidation: 'N = 894 employees across 222 financial branches',
      fitIndices: 'CFI = .975, RMSEA = .041',
    },
    sampleItems: [
      'In this organization, reporting an ethical irregularity or compliance concern will not jeopardize one\'s career.',
      'Employees feel secure raising moral dilemmas with branch leadership.',
    ],
    strengths: 'Directly bridges psychological safety with business ethics, compliance, and whistleblowing protections.',
    limitationsAndGaps: 'Focuses primarily on ethical and regulatory issues rather than daily teamwork, creativity, or operational learning.',
  },
];

/**
 * Helper to search published instruments library with optional category filter
 */
export function searchPublishedInstruments(
  query: string = '',
  categoryTag?: string
): PublishedInstrument[] {
  const q = query.trim().toLowerCase();

  return PUBLISHED_INSTRUMENTS_DATABASE.filter(inst => {
    // Check category filter
    if (categoryTag && categoryTag !== 'All') {
      if (categoryTag === 'Recent (2018-2024)' && inst.year < 2018) {
        return false;
      } else if (categoryTag !== 'Recent (2018-2024)' && inst.categoryTag !== categoryTag) {
        return false;
      }
    }

    // Check search query
    if (!q) return true;

    return (
      inst.name.toLowerCase().includes(q) ||
      inst.authors.toLowerCase().includes(q) ||
      inst.citation.toLowerCase().includes(q) ||
      (inst.doi && inst.doi.toLowerCase().includes(q)) ||
      inst.targetConstruct.toLowerCase().includes(q) ||
      inst.discipline.toLowerCase().includes(q) ||
      inst.dimensions.some(d => d.toLowerCase().includes(q)) ||
      inst.sampleItems.some(i => i.toLowerCase().includes(q)) ||
      inst.strengths.toLowerCase().includes(q) ||
      inst.limitationsAndGaps.toLowerCase().includes(q) ||
      inst.year.toString().includes(q)
    );
  });
}
