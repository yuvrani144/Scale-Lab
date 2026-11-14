import { ScaleProject, ScaleItem, DatasetSnapshot, DecisionLogEntry } from '../types/scale';

export function exportItemBankToCSV(items: ScaleItem[]): string {
  const headers = [
    'Item ID',
    'Item Wording',
    'Dimension ID',
    'Status',
    'Generation Method',
    'Response Format',
    'Is Reverse Scored',
    'Reverse Rationale',
    'Source / Rationale',
    'Heuristic Flags',
    'Revision Count',
  ];

  const escapeCSV = (str: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = items.map(item => [
    escapeCSV(item.id),
    escapeCSV(item.wording),
    escapeCSV(item.dimensionId),
    escapeCSV(item.status),
    escapeCSV(item.generationMethod),
    escapeCSV(item.responseFormat),
    escapeCSV(item.isReverseScored ? 'YES' : 'NO'),
    escapeCSV(item.reverseRationale || ''),
    escapeCSV(item.sourceOrRationale || ''),
    escapeCSV(item.heuristicFlags.map(f => `[${f.severity}] ${f.type}: ${f.message}`).join('; ')),
    item.revisions.length,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportDatasetToCSV(snapshot: DatasetSnapshot, useScored = true): string {
  const rows = useScored ? snapshot.scoredRows : snapshot.rawRows;
  if (!rows || rows.length === 0) return '';

  const columns = snapshot.columns;
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = columns.map(c => `"${c}"`).join(',');
  const dataLines = rows.map(r => columns.map(col => escapeCSV(r[col])).join(','));

  return [headerLine, ...dataLines].join('\n');
}

export function exportDecisionLogToCSV(decisions: DecisionLogEntry[]): string {
  const headers = [
    'Timestamp',
    'Step #',
    'Stage Name',
    'Decision Type',
    'Title',
    'Rationale Summary',
    'Methodological Justification',
    'Impacted Items',
    'Evidence Reference',
    'Author',
  ];

  const escapeCSV = (str?: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = decisions.map(d => [
    escapeCSV(d.timestamp),
    d.stepNumber,
    escapeCSV(d.stageName),
    escapeCSV(d.decisionType),
    escapeCSV(d.title),
    escapeCSV(d.rationalSummary),
    escapeCSV(d.methodologicalJustification),
    escapeCSV(d.impactedItemIds?.join(', ') || ''),
    escapeCSV(d.evidenceReference || ''),
    escapeCSV(d.author),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateDataDictionary(project: ScaleProject): string {
  const lines: string[] = [];
  lines.push(`# DATA DICTIONARY & CODEBOOK: ${project.title}`);
  lines.push(`Construct: ${project.intendedConstruct}`);
  lines.push(`Measurement Model: ${project.measurementModel.toUpperCase()}`);
  lines.push(`Administration Language: ${project.administrationLanguage}`);
  lines.push(`Target Population: ${project.targetPopulation}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('---');
  lines.push('## Dimensions');
  project.dimensions.forEach(dim => {
    lines.push(`- **${dim.name}** (Code: \`${dim.code}\`, ID: \`${dim.id}\`)`);
    lines.push(`  Description: ${dim.description}`);
    lines.push(`  Boundaries: Includes [${dim.includedAspects}], Excludes [${dim.excludedAspects}]`);
  });

  lines.push('');
  lines.push('---');
  lines.push('## Measurement Items (Item Bank)');
  project.items.forEach(it => {
    const dim = project.dimensions.find(d => d.id === it.dimensionId);
    lines.push(`### Item ID: ${it.id} [${it.status.toUpperCase()}]`);
    lines.push(`- Wording: "${it.wording}"`);
    lines.push(`- Dimension: ${dim?.name || 'Unassigned'} (${dim?.code || 'N/A'})`);
    lines.push(`- Response Format: ${it.responseFormat} (1=Strongly Disagree, 5=Strongly Agree)`);
    lines.push(`- Reverse Scored: ${it.isReverseScored ? 'YES (Invert 6 - value)' : 'NO'}`);
    if (it.reverseRationale) lines.push(`  Reverse Rationale: ${it.reverseRationale}`);
    lines.push(`- Rationale: ${it.sourceOrRationale}`);
    if (it.heuristicFlags.length > 0) {
      lines.push(`- Psychometric Heuristic Flags:`);
      it.heuristicFlags.forEach(f => lines.push(`  * [${f.severity.toUpperCase()}] ${f.type}: ${f.message}`));
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function generateRAnalysisScript(project: ScaleProject): string {
  const retainedItems = project.items.filter(i => i.status === 'retained');
  const dims = project.dimensions;

  const cfaModelSyntax = dims.map(d => {
    const dimItems = retainedItems.filter(it => it.dimensionId === d.id).map(it => it.id.replace(/-/g, '_'));
    return `  ${d.code} =~ ${dimItems.join(' + ')}`;
  }).join('\n');

  return `# ==============================================================================
# ScaleLab Reproducible Psychometric Script
# Project: ${project.title}
# Methodological Foundation: Churchill (1979), Clark & Watson (2019), Boateng et al. (2018)
# Generated: ${new Date().toISOString()}
# ==============================================================================

# Required libraries
if (!require("pacman")) install.packages("pacman")
pacman::p_load(lavaan, psych, GPArotation, semPlot, readr, dplyr)

# 1. Load Scored Dataset
df <- read_csv("scalelab_dataset_scored.csv")

# 2. Select Items
item_names <- c(${retainedItems.map(i => `"${i.id.replace(/-/g, '_')}"`).join(', ')})
scale_data <- df %>% select(all_of(item_names))

# 3. Classical Descriptives & Sampling Adequacy
cat("--- Item Descriptives ---\\n")
describe(scale_data)

cat("--- Kaiser-Meyer-Olkin (KMO) Sampling Adequacy ---\\n")
KMO(scale_data)

cat("--- Bartlett's Test of Sphericity ---\\n")
cortest.bartlett(cor(scale_data, use="pairwise.complete.obs"), n=nrow(scale_data))

# 4. Horn's Parallel Analysis & Scree Test
cat("--- Parallel Analysis (Monte Carlo Simulation) ---\\n")
fa.parallel(scale_data, fm="pa", fa="fa", n.iter=100, main="Horn's Parallel Analysis")

# 5. Exploratory Factor Analysis (EFA: Promax Oblique Rotation)
cat("--- Exploratory Factor Analysis (3-Factor Promax) ---\\n")
efa_model <- fa(scale_data, nfactors=${dims.length}, rotate="promax", fm="pa")
print(efa_model$loadings, cutoff=0.32)
cat("Factor Correlations:\\n")
print(efa_model$Phi)

# 6. Internal Consistency Reliability (Alpha & Omega)
cat("--- Reliability Analysis ---\\n")
alpha(scale_data)
omega(scale_data, nfactors=${dims.length})

# 7. Confirmatory Factor Analysis (CFA: lavaan ML estimator)
cat("--- Confirmatory Factor Analysis (lavaan) ---\\n")
cfa_model_spec <- '
${cfaModelSyntax}
'

fit <- cfa(cfa_model_spec, data=scale_data, estimator="ML")
summary(fit, fit.measures=TRUE, standardized=TRUE)

cat("--- Fit Indices Summary (Hu & Bentler, 1999) ---\\n")
fitmeasures(fit, c("chisq", "df", "pvalue", "cfi", "tli", "rmsea", "rmsea.ci.lower", "rmsea.ci.upper", "srmr"))
`;
}

export function generatePythonScript(project: ScaleProject): string {
  const retainedItems = project.items.filter(i => i.status === 'retained');
  return `"""
ScaleLab Reproducible Psychometric Script (Python)
Project: ${project.title}
"""
import pandas as pd
import numpy as np
from factor_analyzer import FactorAnalyzer
from factor_analyzer.factor_analyzer import calculate_bartlett_sphericity, calculate_kmo

# 1. Load data
df = pd.read_csv("scalelab_dataset_scored.csv")
items = [${retainedItems.map(i => `"${i.id.replace(/-/g, '_')}"`).join(', ')}]
X = df[items].dropna()

# 2. Factorability
chi_square_value, p_value = calculate_bartlett_sphericity(X)
kmo_all, kmo_model = calculate_kmo(X)
print(f"Bartlett's test: chi2={chi_square_value:.2f}, p={p_value:.4f}")
print(f"Overall KMO: {kmo_model:.3f}")

# 3. EFA with Promax rotation
fa = FactorAnalyzer(n_factors=${project.dimensions.length}, rotation="promax", method="principal")
fa.fit(X)

ev, v = fa.get_eigenvalues()
print("Eigenvalues:", np.round(ev, 3))
print("Factor Loadings:\\n", pd.DataFrame(fa.loadings_, index=items))
`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
