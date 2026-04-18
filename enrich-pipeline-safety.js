/**
 * enrich-pipeline-safety.js
 * Adds contraindications, drugInteractions, and fdaSafetyNotes to the 7 new pipeline peptides.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'peptides.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const safetyData = {
  'brp-brinp2-peptide': {
    contraindications: [
      { severity: 'caution', condition: 'Pre-Clinical Only', description: 'BRP has only been tested in animal models. No human safety data exists. Not available for clinical or research use outside laboratory settings.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Not studied in pregnant or lactating subjects. Avoid use.' },
      { severity: 'caution', condition: 'Hypothalamic Disorders', description: 'BRP acts on hypothalamic neurons. Individuals with hypothalamic damage, tumors, or dysfunction should avoid use pending further research.' }
    ],
    drugInteractions: [],
    fdaSafetyNotes: null
  },
  'amycretin': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'GLP-1 receptor agonists carry a boxed warning for medullary thyroid carcinoma (MTC) risk. Contraindicated in patients with personal or family history of MTC or Multiple Endocrine Neoplasia syndrome type 2 (MEN2).' },
      { severity: 'relative', condition: 'Severe Gastroparesis', description: 'GLP-1/amylin dual agonism may significantly delay gastric emptying. Use with caution in patients with pre-existing severe gastroparesis.' },
      { severity: 'relative', condition: 'Pancreatitis History', description: 'GLP-1 agonists have been associated with acute pancreatitis. Discontinue if pancreatitis is suspected.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'No human data available. Discontinue at least 2 months before planned conception.' }
    ],
    drugInteractions: [
      { drug: 'Oral medications', interaction: 'May delay absorption of oral medications due to slowed gastric emptying. Take time-sensitive medications (e.g., oral contraceptives, antibiotics) at least 1 hour before amycretin.' },
      { drug: 'Insulin/sulfonylureas', interaction: 'Increased risk of hypoglycemia when combined with insulin or insulin secretagogues. Dose reduction may be needed.' }
    ],
    fdaSafetyNotes: null
  },
  'orforglipron': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'Boxed warning for medullary thyroid carcinoma. Contraindicated in patients with personal or family history of MTC or MEN2.' },
      { severity: 'relative', condition: 'Severe Renal Impairment', description: 'Limited data in patients with eGFR <30 mL/min. Use with caution and monitor.' },
      { severity: 'relative', condition: 'Pancreatitis History', description: 'Discontinue if acute pancreatitis is suspected. Has not been studied in patients with a history of pancreatitis.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Contraindicated in pregnancy. Discontinue at least 2 months before planned conception due to long washout period.' }
    ],
    drugInteractions: [
      { drug: 'Insulin/sulfonylureas', interaction: 'Risk of hypoglycemia. Consider reducing insulin or sulfonylurea dose when initiating orforglipron.' },
      { drug: 'Oral contraceptives', interaction: 'May reduce effectiveness of oral contraceptives due to delayed gastric emptying. Use backup contraception during dose escalation.' }
    ],
    fdaSafetyNotes: 'FDA approved April 1, 2026 as Foundayo. First non-peptide oral GLP-1 receptor agonist. Carries standard GLP-1 RA boxed warning for thyroid C-cell tumors.'
  },
  'maritide': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'Contains a GLP-1 receptor agonist component. Contraindicated in patients with personal or family history of MTC or MEN2.' },
      { severity: 'relative', condition: 'Severe GI Disorders', description: 'GIPR antagonism combined with GLP-1 agonism may cause significant GI effects. Use caution in patients with inflammatory bowel disease or severe gastroparesis.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Not studied in pregnancy. Due to long-acting antibody-peptide conjugate format, extended washout period required before conception.' }
    ],
    drugInteractions: [
      { drug: 'Insulin/sulfonylureas', interaction: 'Risk of hypoglycemia. Monitor blood glucose closely.' }
    ],
    fdaSafetyNotes: null
  },
  'pemvidutide': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'GLP-1 component carries standard thyroid C-cell tumor risk. Contraindicated in MTC/MEN2 patients.' },
      { severity: 'relative', condition: 'Hepatic Impairment', description: 'Glucagon receptor agonism affects hepatic glucose output. Use caution in patients with severe hepatic impairment (Child-Pugh C).' },
      { severity: 'relative', condition: 'Heart Rate Concerns', description: 'Glucagon component may increase heart rate. Monitor in patients with cardiovascular disease or arrhythmias.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Not studied in pregnancy. Avoid use.' }
    ],
    drugInteractions: [
      { drug: 'Insulin/sulfonylureas', interaction: 'Dual GLP-1/glucagon agonism affects glucose metabolism. Risk of hypoglycemia with insulin; risk of hyperglycemia without proper monitoring.' },
      { drug: 'Warfarin', interaction: 'Significant weight loss may alter warfarin pharmacokinetics. Monitor INR closely during treatment.' }
    ],
    fdaSafetyNotes: null
  },
  'mazdutide': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'GLP-1 receptor agonist component. Contraindicated in patients with personal or family history of MTC or MEN2.' },
      { severity: 'relative', condition: 'Pancreatitis History', description: 'Cases of acute pancreatitis reported in clinical trials. Discontinue if pancreatitis is suspected.' },
      { severity: 'relative', condition: 'Severe Renal Impairment', description: 'Limited data in eGFR <15 mL/min. Dose adjustment may be needed.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Not studied. Contraindicated in pregnancy.' }
    ],
    drugInteractions: [
      { drug: 'Insulin/sulfonylureas', interaction: 'Increased risk of hypoglycemia. Reduce insulin dose when initiating mazdutide.' },
      { drug: 'Oral medications', interaction: 'May delay gastric emptying and affect absorption of oral drugs.' }
    ],
    fdaSafetyNotes: 'Approved in China (NMPA) June 2025 for T2DM, September 2025 for obesity. Not yet approved by FDA or EMA.'
  },
  'cagrisema': {
    contraindications: [
      { severity: 'absolute', condition: 'MTC/MEN2', description: 'Contains semaglutide (GLP-1 RA). Contraindicated in patients with personal or family history of MTC or MEN2.' },
      { severity: 'relative', condition: 'Severe Gastroparesis', description: 'Dual amylin/GLP-1 mechanism significantly delays gastric emptying. Avoid in severe gastroparesis.' },
      { severity: 'relative', condition: 'Pancreatitis History', description: 'GLP-1 agonists associated with acute pancreatitis. Discontinue if suspected.' },
      { severity: 'relative', condition: 'Pregnancy & Lactation', description: 'Contraindicated in pregnancy. Discontinue semaglutide component at least 2 months before conception.' }
    ],
    drugInteractions: [
      { drug: 'Insulin/sulfonylureas', interaction: 'Substantial risk of hypoglycemia due to dual mechanism. Proactive dose reduction of insulin recommended.' },
      { drug: 'Oral medications', interaction: 'Significant delay in gastric emptying may reduce absorption of oral medications. Space administration appropriately.' }
    ],
    fdaSafetyNotes: 'NDA filed with FDA; PDUFA decision expected October 2026. Combines cagrilintide 2.4mg + semaglutide 2.4mg in fixed-dose combination.'
  }
};

let updated = 0;
data.peptides.forEach(p => {
  const safety = safetyData[p.slug];
  if (safety) {
    if (!p.contraindications || p.contraindications.length === 0) {
      p.contraindications = safety.contraindications;
    }
    if (!p.drugInteractions) {
      p.drugInteractions = safety.drugInteractions;
    }
    if (!p.fdaSafetyNotes && safety.fdaSafetyNotes) {
      p.fdaSafetyNotes = safety.fdaSafetyNotes;
    }
    updated++;
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Updated safety data for ${updated} pipeline peptides`);

// Verify
const verify = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const stillMissing = verify.peptides.filter(p => !p.contraindications || p.contraindications.length === 0);
console.log('Still missing contraindications:', stillMissing.length);
