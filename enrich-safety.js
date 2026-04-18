#!/usr/bin/env node
/**
 * enrich-safety.js
 *
 * Adds FDA / regulatory status, contraindications, drug interactions, and
 * FDA safety notes to every peptide in data/peptides.json.
 *
 * Does NOT overwrite existing fields — only adds the four new fields.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'peptides.json');

// ---------------------------------------------------------------------------
// Regulatory status mappings
// ---------------------------------------------------------------------------

const FDA_APPROVED = new Set([
  'semaglutide', 'tirzepatide', 'liraglutide', 'octreotide', 'leuprolide',
  'oxytocin', 'pramlintide', 'desmopressin', 'terlipressin', 'plecanatide',
  'linaclotide', 'exenatide', 'vasopressin', 'teriparatide', 'calcitonin',
  'gonadorelin', 'insulin', 'glucagon', 'abaloparatide', 'bivalirudin',
  'enfuvirtide', 'ziconotide',
]);

// FDA Category 2 peptides — from FDA's bulk drug substance list (Category 2
// means nominated substance raising significant safety risks; FDA is
// reviewing / generally will not include in compounding without more data).
const FDA_CATEGORY_2 = new Set([
  'bpc-157', 'll-37', 'dsip', 'epithalon', 'ghk-cu', 'ghrp-2', 'ghrp-6',
  'ipamorelin', 'kisspeptin-10', 'kpv', 'melanotan-ii', 'peg-mgf', 'mots-c',
  'semax', 'tb-500', 'aod-9604', 'cjc-1295', 'selank', 'thymosin-alpha-1',
]);

const CLINICAL_TRIALS = new Set([
  'retatrutide', 'survodutide', 'cagrilintide',
]);

// Exact FDA safety concerns copied from research-context.md
const FDA_SAFETY_NOTES = {
  'bpc-157': 'FDA Category 2 concerns: immunogenicity risk, peptide impurity concerns, limited human safety data.',
  'll-37': 'FDA Category 2 concerns: immunogenicity, detrimental effects on male reproduction, protumorigenic potential.',
  'dsip': 'FDA Category 2 concerns (listed as Emideltide): immunogenicity, no safety data for proposed routes.',
  'epithalon': 'FDA Category 2 concerns (Epitalon): immunogenicity, aggregation risk, no safety data.',
  'ghk-cu': 'FDA Category 2 concerns (injectable): immunogenicity, limited human data.',
  'ghrp-2': 'FDA Category 2 concerns: immunogenicity, unnatural amino acid, reports of increased insulin requirement, death, infection, pancreatitis.',
  'ghrp-6': 'FDA Category 2 concerns: immunogenicity, cortisol effects, decreased insulin sensitivity.',
  'ipamorelin': 'FDA Category 2 concerns: immunogenicity, unnatural amino acids, serious adverse events including death (IV for gastric motility).',
  'kisspeptin-10': 'FDA Category 2 concerns: immunogenicity, limited safety data.',
  'kpv': 'FDA Category 2 concerns: NO human exposure data at all.',
  'melanotan-ii': 'FDA Category 2 concerns: immunogenicity, melanoma reports, PRES, sympathomimetic toxidrome, priapism.',
  'peg-mgf': 'FDA Category 2 concerns: significant immunogenicity risk, no human exposure data.',
  'mots-c': 'FDA Category 2 concerns: significant immunogenicity risk, no human exposure data.',
  'semax': 'FDA Category 2 concerns: immunogenicity, limited safety data.',
  'tb-500': 'FDA Category 2 concerns (Thymosin Beta-4 fragment): immunogenicity, no human exposure data.',
  'aod-9604': 'FDA Category 2 concerns: significant immunogenicity risk, limited data, serious adverse events.',
  'cjc-1295': 'FDA Category 2 concerns: immunogenicity, serious adverse events (increased heart rate, vasodilatory reaction).',
  'selank': 'FDA Category 2 concerns: immunogenicity, no safety data.',
  'thymosin-alpha-1': 'FDA Category 2 concerns: significant immunogenicity risk, inadequate safety data.',
};

// Black box warnings / key FDA safety notes for approved drugs
const FDA_APPROVED_NOTES = {
  'semaglutide': 'FDA Boxed Warning: Risk of thyroid C-cell tumors. Contraindicated in patients with personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).',
  'tirzepatide': 'FDA Boxed Warning: Risk of thyroid C-cell tumors. Contraindicated in patients with personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).',
  'liraglutide': 'FDA Boxed Warning: Risk of thyroid C-cell tumors. Contraindicated in patients with personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).',
  'exenatide': 'FDA warnings include risk of acute pancreatitis and renal impairment; extended-release form carries a boxed warning for thyroid C-cell tumors.',
  'leuprolide': 'FDA labeling warns of transient tumor flare, decreased bone density with long-term use, cardiovascular risk, QT prolongation, and convulsions.',
  'octreotide': 'FDA labeling warns of gallbladder abnormalities, cardiac conduction abnormalities, hyper-/hypoglycemia, hypothyroidism, and pancreatitis.',
  'teriparatide': 'FDA previously carried a boxed warning for osteosarcoma risk observed in rats; the boxed warning was removed in 2020 but the risk is still described in labeling. Contraindicated in patients at increased baseline risk of osteosarcoma.',
  'abaloparatide': 'FDA labeling warns of potential osteosarcoma risk (based on rat studies); avoid in patients at increased baseline risk. Also warns of orthostatic hypotension and hypercalciuria.',
  'calcitonin': 'FDA labeling warns of a possible increased risk of malignancy with long-term nasal spray use; use only when benefits outweigh risks.',
  'ziconotide': 'FDA Boxed Warning: Severe psychiatric symptoms and neurological impairment. Contraindicated in patients with a preexisting history of psychosis.',
  'enfuvirtide': 'FDA labeling warns of injection-site reactions, hypersensitivity reactions, and increased bacterial pneumonia risk.',
  'bivalirudin': 'FDA labeling warns of bleeding as the most common adverse event; contraindicated in patients with active major bleeding.',
  'desmopressin': 'FDA Boxed Warning (intranasal formulations for nocturia): Risk of severe hyponatremia leading to seizures, coma, and death.',
  'terlipressin': 'FDA Boxed Warning: Serious or fatal respiratory failure; also carries warnings for ischemic events and fluid overload.',
  'linaclotide': 'FDA Boxed Warning: Contraindicated in pediatric patients less than 2 years of age due to risk of serious dehydration.',
  'plecanatide': 'FDA Boxed Warning: Contraindicated in pediatric patients less than 6 years of age due to risk of serious dehydration.',
  'vasopressin': 'FDA labeling warns of risk of cardiac/mesenteric/peripheral ischemia, water intoxication, and hypersensitivity reactions.',
  'gonadorelin': 'FDA labeling notes hypersensitivity reactions; generally well-tolerated at diagnostic doses.',
  'oxytocin': 'FDA labeling warns of uterine hyperstimulation, fetal distress, water intoxication, and hypotension when used for labor induction.',
  'pramlintide': 'FDA Boxed Warning: Risk of insulin-induced severe hypoglycemia, particularly in patients with type 1 diabetes; reduce rapid-acting insulin doses by 50% when initiating.',
  'glucagon': 'FDA labeling warns of hypersensitivity reactions and necrolytic migratory erythema with prolonged use; use with caution in insulinoma, pheochromocytoma, and glucagonoma.',
  'insulin': 'FDA labeling warns of hypoglycemia, hypokalemia, hypersensitivity reactions, and fluid retention when combined with thiazolidinediones.',
};

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

const GH_SECRETAGOGUES = new Set([
  'ipamorelin', 'ghrp-2', 'ghrp-6', 'cjc-1295', 'sermorelin', 'tesamorelin',
  'hexarelin', 'mk-677',
]);

const GROWTH_PROMOTING = new Set([
  // GH secretagogues
  'ipamorelin', 'ghrp-2', 'ghrp-6', 'cjc-1295', 'sermorelin', 'tesamorelin',
  'hexarelin', 'mk-677',
  // IGF-1 variants
  'igf-1', 'igf-1-lr3',
  // MGF variants
  'mgf', 'peg-mgf',
  // Follistatin
  'follistatin-344',
  // Other growth-factor / fragment
  'aod-9604', 'fragment-176-191',
]);

// Peptides that are FDA-approved for use in pregnancy / are routinely used
// during pregnancy or labor — skip blanket pregnancy contraindication.
const PREGNANCY_OK = new Set([
  'oxytocin', 'insulin', 'glucagon',
]);

// All peptides in the dataset — determine "injectable" status pragmatically.
// Almost every therapeutic peptide here is injectable; topical-only peptides
// (cosmetic skin peptides) are excluded from the "injection site" rule.
const TOPICAL_ONLY = new Set([
  'ghk-tripeptide', 'matrixyl', 'argireline', 'syn-ake', 'ptd-dbm',
]);

// Hormone-sensitive-cancer concern (reproductive-axis peptides)
const HORMONE_SENSITIVE = new Set([
  'kisspeptin', 'kisspeptin-10', 'gonadorelin', 'leuprolide',
]);

// ---------------------------------------------------------------------------
// Contraindication / interaction builders
// ---------------------------------------------------------------------------

const CI = {
  malignancy: {
    condition: 'Active Malignancy',
    severity: 'absolute',
    details: 'Growth-promoting peptides may theoretically stimulate tumor growth via upregulation of growth factors, angiogenesis, or cell proliferation. Avoid in patients with active or recent cancer.',
  },
  pregnancy: {
    condition: 'Pregnancy / Lactation',
    severity: 'relative',
    details: 'Insufficient safety data in pregnant or breastfeeding women. Avoid unless benefits clearly outweigh theoretical risks and a qualified clinician is supervising therapy.',
  },
  uncontrolledDiabetes: {
    condition: 'Uncontrolled Diabetes Mellitus',
    severity: 'absolute',
    details: 'Growth hormone secretagogues can worsen insulin resistance and raise fasting glucose, destabilising glycaemic control.',
  },
  severeCardiac: {
    condition: 'Severe Cardiac Disease',
    severity: 'absolute',
    details: 'Growth hormone secretagogues have been associated with transient tachycardia, vasodilatory reactions, and fluid retention; avoid in patients with advanced heart failure, uncontrolled arrhythmia, or recent MI.',
  },
  ghActiveCancer: {
    condition: 'Active Malignancy',
    severity: 'absolute',
    details: 'Growth hormone and IGF-1 elevation driven by GH secretagogues may accelerate tumour growth; contraindicated in patients with active or recently treated cancer.',
  },
  melanomaHistory: {
    condition: 'History of Melanoma or Atypical Nevi',
    severity: 'absolute',
    details: 'Melanotan II stimulates melanocytes and has been associated with darkening of existing nevi and case reports of new melanoma; contraindicated in anyone with a personal history of melanoma or numerous atypical nevi.',
  },
  cardiacDisease: {
    condition: 'Cardiovascular Disease',
    severity: 'absolute',
    details: 'Melanotan II has sympathomimetic activity and has been linked to hypertension, tachycardia, and posterior reversible encephalopathy syndrome (PRES); avoid in uncontrolled hypertension or significant cardiovascular disease.',
  },
  anticoagulants: {
    condition: 'Concurrent Anticoagulant Therapy',
    severity: 'relative',
    details: 'BPC-157 upregulates angiogenic pathways (VEGF, eNOS) and may theoretically increase bleeding risk in patients on warfarin, DOACs, or therapeutic heparin. Use with caution and clinical monitoring.',
  },
  bpcCancer: {
    condition: 'Active Malignancy',
    severity: 'relative',
    details: 'BPC-157 upregulates growth factors (VEGF, FGF, EGF) and promotes angiogenesis, raising a theoretical concern for accelerating tumour growth despite the absence of human oncology data.',
  },
  hormoneSensitiveCancer: {
    condition: 'Hormone-Sensitive Cancers',
    severity: 'absolute',
    details: 'Peptides acting on the hypothalamic-pituitary-gonadal axis can transiently raise sex-hormone levels and should not be used in patients with hormone-sensitive cancers (e.g. prostate, breast, ovarian, endometrial).',
  },
  mtcMen2: {
    condition: 'Personal or Family History of Medullary Thyroid Carcinoma or MEN 2',
    severity: 'absolute',
    details: 'FDA Boxed Warning: Incretin-based therapies caused dose-dependent thyroid C-cell tumours in rodents. Contraindicated in patients with personal or family history of MTC or Multiple Endocrine Neoplasia syndrome type 2.',
  },
  bleedingDisorders: {
    condition: 'Bleeding Disorders',
    severity: 'relative',
    details: 'Subcutaneous or intramuscular injection poses a bleeding and haematoma risk in patients with thrombocytopenia, haemophilia, or other coagulopathies.',
  },
  injectionInfection: {
    condition: 'Active Skin Infection at Injection Site',
    severity: 'absolute',
    details: 'Do not inject through cellulitis, abscess, or other active cutaneous infection — risk of seeding deeper tissues and systemic infection.',
  },
};

const DI = {
  ghInsulin: {
    drug: 'Insulin / Oral Hypoglycemics',
    severity: 'moderate',
    details: 'GH secretagogues increase endogenous growth hormone, which antagonises insulin and can raise fasting glucose and HbA1c. Patients on insulin, sulfonylureas, or other hypoglycemic agents may need dose adjustment.',
  },
  bpcAnticoag: {
    drug: 'Anticoagulants / Antiplatelets',
    severity: 'moderate',
    details: 'BPC-157 promotes angiogenesis and may theoretically increase bleeding risk when combined with warfarin, DOACs, therapeutic heparin, aspirin, or clopidogrel.',
  },
  mtAntihypertensives: {
    drug: 'Antihypertensive Agents',
    severity: 'moderate',
    details: 'Melanotan II can cause blood-pressure fluctuations (initial rise, then hypotension); additive effects with antihypertensives may produce symptomatic hypotension or orthostasis.',
  },
  semaxCns: {
    drug: 'CNS Depressants',
    severity: 'moderate',
    details: 'Semax modulates BDNF, dopamine, and serotonin; combining with sedatives, opioids, alcohol, or other CNS depressants may produce unpredictable additive CNS effects.',
  },
  selankCns: {
    drug: 'CNS Depressants / Benzodiazepines',
    severity: 'moderate',
    details: 'Selank acts on GABAergic pathways and may potentiate sedation when combined with benzodiazepines, opioids, alcohol, or other CNS depressants.',
  },
  dsipSedatives: {
    drug: 'Sedatives / Benzodiazepines',
    severity: 'moderate',
    details: 'DSIP has sleep-inducing properties and may enhance sedation when combined with benzodiazepines, z-drugs, opioids, or alcohol.',
  },
  tymaImmunosuppressants: {
    drug: 'Immunosuppressant Therapy',
    severity: 'moderate',
    details: 'Thymosin Alpha-1 stimulates T-cell function and may counteract the effect of immunosuppressants used in transplantation or autoimmune disease (e.g. tacrolimus, cyclosporine, mycophenolate).',
  },
  glpOralMeds: {
    drug: 'Oral Medications (general)',
    severity: 'moderate',
    details: 'GLP-1 / GIP receptor agonists delay gastric emptying, which can alter the rate and extent of absorption of concomitantly administered oral drugs (particularly narrow-therapeutic-index agents such as warfarin, levothyroxine, and oral contraceptives).',
  },
};

// ---------------------------------------------------------------------------
// Per-peptide custom overrides for contraindications / interactions
// ---------------------------------------------------------------------------

function buildRegulatory(slug) {
  const base = { lastUpdated: '2026-04' };
  if (FDA_APPROVED.has(slug)) {
    return {
      ...base,
      status: 'fda-approved',
      label: 'FDA-Approved Pharmaceutical',
      details: 'Approved by the U.S. Food and Drug Administration for one or more specific clinical indications. Manufactured and distributed as a prescription drug; see labeling for approved uses, dosing, and safety warnings.',
    };
  }
  if (FDA_CATEGORY_2.has(slug)) {
    return {
      ...base,
      status: 'fda-category-2',
      label: 'FDA Category 2 — Under Review',
      details: 'Placed by the FDA on Category 2 of the 503A/503B bulk drug substances list, meaning the agency has identified significant safety risks and generally will not include the substance in compounding while review is ongoing. Not an approved drug.',
    };
  }
  if (CLINICAL_TRIALS.has(slug)) {
    return {
      ...base,
      status: 'clinical-trials',
      label: 'Investigational — In Clinical Trials',
      details: 'Currently under investigation in human clinical trials. Not approved by the FDA for any indication; only legally available to patients enrolled in authorised studies or expanded-access programmes.',
    };
  }
  return {
    ...base,
    status: 'research-only',
    label: 'Research Use Only',
    details: 'Not approved by the FDA for human use and not currently in a registered clinical trial programme. Available only as a research chemical; clinical use is not sanctioned and safety data in humans are limited or absent.',
  };
}

function buildContraindications(peptide) {
  const slug = peptide.slug;
  const cats = new Set(peptide.categories || []);
  const out = [];

  // 1. Growth-promoting peptides → absolute contraindication for active cancer
  if (GROWTH_PROMOTING.has(slug)) {
    out.push({ ...CI.malignancy });
  }

  // 2. GH secretagogues extra concerns
  if (GH_SECRETAGOGUES.has(slug)) {
    // Replace generic malignancy with GH-specific phrasing
    const idx = out.findIndex((c) => c.condition === 'Active Malignancy');
    if (idx >= 0) out[idx] = { ...CI.ghActiveCancer };
    else out.push({ ...CI.ghActiveCancer });
    out.push({ ...CI.uncontrolledDiabetes });
    out.push({ ...CI.severeCardiac });
  }

  // 3. Melanotan II specific
  if (slug === 'melanotan-ii') {
    out.push({ ...CI.melanomaHistory });
    out.push({ ...CI.cardiacDisease });
  }

  // 4. BPC-157 specific
  if (slug === 'bpc-157') {
    out.push({ ...CI.bpcCancer });
    out.push({ ...CI.anticoagulants });
  }

  // 5. Kisspeptin-10 / kisspeptin / hormone-axis
  if (HORMONE_SENSITIVE.has(slug)) {
    out.push({ ...CI.hormoneSensitiveCancer });
  }

  // 6. Semaglutide / tirzepatide / liraglutide / exenatide — MTC/MEN2
  if (['semaglutide', 'tirzepatide', 'liraglutide', 'exenatide'].includes(slug)) {
    out.push({ ...CI.mtcMen2 });
  }

  // 7. All peptides — pregnancy / lactation relative contraindication
  if (!PREGNANCY_OK.has(slug)) {
    out.push({ ...CI.pregnancy });
  }

  // 8. Injectable peptides — bleeding disorders + injection-site infection
  if (!TOPICAL_ONLY.has(slug)) {
    out.push({ ...CI.bleedingDisorders });
    out.push({ ...CI.injectionInfection });
  }

  // Deduplicate by condition
  const seen = new Set();
  return out.filter((c) => {
    if (seen.has(c.condition)) return false;
    seen.add(c.condition);
    return true;
  });
}

function buildDrugInteractions(peptide) {
  const slug = peptide.slug;
  const out = [];

  if (GH_SECRETAGOGUES.has(slug)) {
    out.push({ ...DI.ghInsulin });
  }
  if (slug === 'bpc-157') {
    out.push({ ...DI.bpcAnticoag });
  }
  if (slug === 'melanotan-ii') {
    out.push({ ...DI.mtAntihypertensives });
  }
  if (slug === 'semax') {
    out.push({ ...DI.semaxCns });
  }
  if (slug === 'selank') {
    out.push({ ...DI.selankCns });
  }
  if (slug === 'dsip') {
    out.push({ ...DI.dsipSedatives });
  }
  if (slug === 'thymosin-alpha-1' || slug === 'thymalfasin') {
    out.push({ ...DI.tymaImmunosuppressants });
  }
  if (['semaglutide', 'tirzepatide', 'liraglutide', 'exenatide',
       'retatrutide', 'survodutide', 'cagrilintide'].includes(slug)) {
    out.push({ ...DI.glpOralMeds });
  }
  // Pramlintide + insulin — severe hypoglycemia risk
  if (slug === 'pramlintide') {
    out.push({
      drug: 'Insulin (rapid-acting)',
      severity: 'major',
      details: 'FDA Boxed Warning: concurrent pramlintide and rapid-acting insulin can cause severe, sometimes fatal, hypoglycemia. Reduce pre-meal rapid-acting insulin by 50% when initiating.',
    });
  }
  // Leuprolide + QT-prolonging agents
  if (slug === 'leuprolide') {
    out.push({
      drug: 'QT-Prolonging Agents',
      severity: 'moderate',
      details: 'Androgen-deprivation therapy with leuprolide prolongs the QT interval; additive risk when combined with antiarrhythmics (Class IA/III), certain antipsychotics, macrolides, or fluoroquinolones.',
    });
  }
  // Octreotide + cyclosporine
  if (slug === 'octreotide') {
    out.push({
      drug: 'Cyclosporine',
      severity: 'moderate',
      details: 'Octreotide can decrease cyclosporine levels, risking transplant rejection. Monitor cyclosporine trough levels when starting or stopping octreotide.',
    });
  }
  // Desmopressin + SSRIs / carbamazepine / NSAIDs (hyponatremia)
  if (slug === 'desmopressin') {
    out.push({
      drug: 'SSRIs, NSAIDs, Carbamazepine, Loop Diuretics',
      severity: 'major',
      details: 'Concomitant use increases the risk of severe hyponatremia. Avoid combination when possible and monitor serum sodium.',
    });
  }
  // Ziconotide + CNS depressants
  if (slug === 'ziconotide') {
    out.push({
      drug: 'CNS Depressants',
      severity: 'major',
      details: 'Additive CNS depression with opioids, benzodiazepines, alcohol, or sedative-hypnotics; ziconotide already carries a boxed warning for severe psychiatric and neurological adverse effects.',
    });
  }
  // Bivalirudin + other anticoagulants/antiplatelets
  if (slug === 'bivalirudin') {
    out.push({
      drug: 'Other Anticoagulants / Antiplatelets',
      severity: 'major',
      details: 'Concurrent use with heparin, warfarin, DOACs, or potent antiplatelet therapy substantially increases bleeding risk.',
    });
  }
  return out;
}

function buildFdaSafetyNotes(slug) {
  if (FDA_SAFETY_NOTES[slug]) return FDA_SAFETY_NOTES[slug];
  if (FDA_APPROVED_NOTES[slug]) return FDA_APPROVED_NOTES[slug];
  return null;
}

// ---------------------------------------------------------------------------
// Run enrichment
// ---------------------------------------------------------------------------

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const db = JSON.parse(raw);

  if (!Array.isArray(db.peptides)) {
    throw new Error('peptides.json does not contain a "peptides" array');
  }

  const counts = {
    regulatoryStatus: 0,
    contraindications: 0,
    drugInteractions: 0,
    fdaSafetyNotes: 0,
  };
  const byStatus = {};

  for (const peptide of db.peptides) {
    if (!peptide.slug) continue;

    // regulatoryStatus
    if (!peptide.regulatoryStatus) {
      peptide.regulatoryStatus = buildRegulatory(peptide.slug);
      counts.regulatoryStatus += 1;
    }
    const s = peptide.regulatoryStatus.status;
    byStatus[s] = (byStatus[s] || 0) + 1;

    // contraindications
    if (!peptide.contraindications) {
      const c = buildContraindications(peptide);
      peptide.contraindications = c;
      if (c.length > 0) counts.contraindications += 1;
    }

    // drugInteractions
    if (!peptide.drugInteractions) {
      const d = buildDrugInteractions(peptide);
      peptide.drugInteractions = d;
      if (d.length > 0) counts.drugInteractions += 1;
    }

    // fdaSafetyNotes
    if (!('fdaSafetyNotes' in peptide)) {
      const note = buildFdaSafetyNotes(peptide.slug);
      peptide.fdaSafetyNotes = note;
      if (note) counts.fdaSafetyNotes += 1;
    }
  }

  // Update metadata timestamp (non-destructive: keep existing keys)
  db.metadata = db.metadata || {};
  db.metadata.safetyEnrichmentAt = new Date().toISOString();

  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');

  console.log('Safety enrichment complete.');
  console.log(`  Total peptides:                         ${db.peptides.length}`);
  console.log(`  regulatoryStatus added:                 ${counts.regulatoryStatus}`);
  console.log(`  contraindications added (non-empty):    ${counts.contraindications}`);
  console.log(`  drugInteractions added (non-empty):     ${counts.drugInteractions}`);
  console.log(`  fdaSafetyNotes added (non-null):        ${counts.fdaSafetyNotes}`);
  console.log('  regulatoryStatus breakdown:');
  for (const [k, v] of Object.entries(byStatus)) {
    console.log(`    - ${k.padEnd(18)} ${v}`);
  }
}

main();
