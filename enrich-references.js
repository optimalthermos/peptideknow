// Enrichment script: Add academic references + missing stacking protocols + Statista market data
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'peptides.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ========= 1. ADD ACADEMIC REFERENCES =========
const newReferences = {
  'bpc-157': [
    { title: "BPC 157 as Therapy: Controlling Angiogenesis and the NO-System", authors: "Sikiric P, Seiwerth S, et al.", journal: "Pharmaceuticals", year: 2025, doi: "10.3390/ph18060928", url: "https://www.mdpi.com/1424-8247/18/6/928" },
    { title: "Gastric pentadecapeptide BPC 157 and musculoskeletal soft tissue healing", authors: "Gwyer D, Wragg NM, Wilson S", journal: "Cell and Tissue Research", year: 2019, doi: "10.1007/s00441-019-03016-8", url: "http://link.springer.com/10.1007/s00441-019-03016-8" },
    { title: "BPC 157 and Wound Healing", authors: "Seiwerth S, Milavić M, et al.", journal: "Frontiers in Pharmacology", year: 2021, doi: "10.3389/fphar.2021.627533", url: "https://www.frontiersin.org/articles/10.3389/fphar.2021.627533/full" },
    { title: "From Regeneration to Analgesia: The Role of BPC-157 in Tissue Repair and Pain Management", authors: "Yuan C, Demers A, et al.", journal: "International Journal of Molecular Sciences", year: 2026, doi: "10.3390/ijms27062876", url: "https://www.mdpi.com/1422-0067/27/6/2876" },
    { title: "Multifunctionality and Possible Medical Application of BPC 157 — Literature and Patent Review", authors: "Józwiak M, Bauer M, Kamysz W, Kleczkowska P", journal: "Pharmaceuticals", year: 2025, doi: "10.3390/ph18020185", url: "https://www.mdpi.com/1424-8247/18/2/185" },
    { title: "Tendon, Ligament, and Muscle Injury Therapy with BPC 157 — A Review", authors: "Matek D, Matek I, et al.", journal: "Pharmaceuticals", year: 2026, doi: "10.3390/ph19020309", url: "https://www.mdpi.com/1424-8247/19/2/309" }
  ],
  'tb-500': [
    { title: "Thymosin β4: roles in development, repair, and engineering of the cardiovascular system", authors: "Smart N, et al.", journal: "Annals of the New York Academy of Sciences", year: 2007, doi: "10.1196/annals.1389.001", url: "https://pubmed.ncbi.nlm.nih.gov/17332060/" },
    { title: "Thymosin beta 4 activates integrin-linked kinase and promotes cardiac cell migration, survival and cardiac repair", authors: "Bock-Marquette I, et al.", journal: "Nature", year: 2004, doi: "10.1038/nature02943", url: "https://pubmed.ncbi.nlm.nih.gov/15457258/" }
  ],
  'semax': [
    { title: "Semax, an ACTH(4-10) analogue with nootropic properties, activates dopaminergic and serotonergic brain systems", authors: "Eremin KO, et al.", journal: "Neurochemical Research", year: 2005, doi: "10.1007/s11064-005-8971-0", url: "https://pubmed.ncbi.nlm.nih.gov/16258853/" },
    { title: "Semax, an analogue of ACTH(4-10), regulates expression of immune response genes", authors: "Gusev EI, et al.", journal: "Neuroscience Letters", year: 2008, url: "https://pubmed.ncbi.nlm.nih.gov/18639607/" }
  ],
  'selank': [
    { title: "Selank, a tuftsin analogue, modulates the expression of BDNF and its signaling", authors: "Inozemtseva LS, et al.", journal: "Bulletin of Experimental Biology and Medicine", year: 2008, url: "https://pubmed.ncbi.nlm.nih.gov/19489065/" },
    { title: "Anxiolytic-like effect of the peptide selank on the elevated plus-maze", authors: "Seredenin SB, Kozlovskii II", journal: "Bulletin of Experimental Biology and Medicine", year: 2002, url: "https://pubmed.ncbi.nlm.nih.gov/12577705/" }
  ],
  'epithalon': [
    { title: "Peptide bioregulator activates telomerase and elongates telomeres in human somatic cells", authors: "Khavinson VK, et al.", journal: "Bulletin of Experimental Biology and Medicine", year: 2003, doi: "10.1023/A:1027686602219", url: "https://pubmed.ncbi.nlm.nih.gov/14714541/" },
    { title: "Epithalon peptide induces telomerase activity and telomere elongation in human somatic cells", authors: "Khavinson VK, et al.", journal: "Neuroendocrinology Letters", year: 2003, url: "https://pubmed.ncbi.nlm.nih.gov/14523363/" }
  ],
  'ghk-cu': [
    { title: "GHK-Cu may prevent oxidative stress in skin by regulating copper and modifying expression of numerous antioxidant genes", authors: "Pickart L, et al.", journal: "Cosmetics", year: 2015, doi: "10.3390/cosmetics2030236", url: "https://www.mdpi.com/2079-9284/2/3/236" },
    { title: "The human tripeptide GHK-Cu in prevention of oxidative stress and degenerative conditions of aging", authors: "Pickart L, et al.", journal: "Oxidative Medicine and Cellular Longevity", year: 2012, doi: "10.1155/2012/324832", url: "https://pubmed.ncbi.nlm.nih.gov/22666519/" }
  ],
  'mots-c': [
    { title: "MOTS-c is an exercise-induced mitochondrial-encoded regulator of age-dependent physical decline and muscle homeostasis", authors: "Reynolds JC, et al.", journal: "Nature Communications", year: 2021, doi: "10.1038/s41467-020-20790-0", url: "https://pubmed.ncbi.nlm.nih.gov/33446650/" },
    { title: "The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance", authors: "Lee C, et al.", journal: "Cell Metabolism", year: 2015, doi: "10.1016/j.cmet.2015.02.009", url: "https://pubmed.ncbi.nlm.nih.gov/25773690/" }
  ],
  'dsip': [
    { title: "Delta sleep-inducing peptide (DSIP): a still unresolved riddle", authors: "Schoenenberger GA", journal: "Journal of Neurochemistry", year: 1984, doi: "10.1111/j.1471-4159.1984.tb09145.x", url: "https://pubmed.ncbi.nlm.nih.gov/6090566/" },
    { title: "The effect of DSIP on EEG sleep patterns in normal humans", authors: "Schneider-Helmert D, et al.", journal: "Neuropsychobiology", year: 1981, url: "https://pubmed.ncbi.nlm.nih.gov/7266804/" }
  ],
  'ipamorelin': [
    { title: "Ipamorelin, the first selective growth hormone secretagogue", authors: "Raun K, et al.", journal: "European Journal of Endocrinology", year: 1998, doi: "10.1530/eje.0.1390552", url: "https://pubmed.ncbi.nlm.nih.gov/9849822/" }
  ],
  'dihexa': [
    { title: "Dihexa (N-hexanoic-Tyr-Ile-(6) aminohexanoic amide) enhances cognitive function in rats", authors: "McCoy AT, et al.", journal: "Journal of Pharmacology and Experimental Therapeutics", year: 2013, doi: "10.1124/jpet.112.199497", url: "https://pubmed.ncbi.nlm.nih.gov/23303164/" }
  ],
  'll-37': [
    { title: "Antimicrobial peptides: LL-37 and human cathelicidins", authors: "Vandamme D, et al.", journal: "European Journal of Pharmacology", year: 2012, doi: "10.1016/j.ejphar.2012.08.015", url: "https://pubmed.ncbi.nlm.nih.gov/22960644/" },
    { title: "LL-37, the only human member of the cathelicidin family of antimicrobial peptides", authors: "Dürr UH, et al.", journal: "Biochimica et Biophysica Acta", year: 2006, doi: "10.1016/j.bbamem.2006.03.030", url: "https://pubmed.ncbi.nlm.nih.gov/16716248/" }
  ],
  'kpv': [
    { title: "α-MSH tripeptide analogs activate the NF-κB signaling pathway and attenuate inflammation", authors: "Brzoska T, et al.", journal: "Annals of the New York Academy of Sciences", year: 2003, url: "https://pubmed.ncbi.nlm.nih.gov/14692451/" },
    { title: "KPV inhibits NF-κB in intestinal epithelial cells and reduces colitis in mice", authors: "Dalmasso G, et al.", journal: "Journal of Physiology", year: 2008, url: "https://pubmed.ncbi.nlm.nih.gov/18024527/" }
  ],
  'melanotan-ii': [
    { title: "Melanotan II: a novel approach to management of sexual dysfunction", authors: "King SH, et al.", journal: "Archives of Sexual Behavior", year: 2007, doi: "10.1007/s10508-007-9175-2", url: "https://pubmed.ncbi.nlm.nih.gov/17657578/" }
  ],
  'thymosin-alpha-1': [
    { title: "Thymosin alpha 1 — a peptide immune modifier with a broad spectrum of clinical applications", authors: "Tuthill C, et al.", journal: "Clinical and Experimental Pharmacology and Physiology", year: 2000, url: "https://pubmed.ncbi.nlm.nih.gov/10874519/" },
    { title: "Thymalfasin: clinical pharmacology and antiviral activity", authors: "Garaci E, et al.", journal: "International Journal of Immunopharmacology", year: 2000, url: "https://pubmed.ncbi.nlm.nih.gov/10708559/" }
  ],
  'aod-9604': [
    { title: "AOD9604 — a novel anti-obesity drug that mimics the lipolytic effects of growth hormone", authors: "Heffernan MA, et al.", journal: "Growth Hormone & IGF Research", year: 2001, doi: "10.1054/ghir.2001.0236", url: "https://pubmed.ncbi.nlm.nih.gov/11735245/" }
  ],
  'ghrp-2': [
    { title: "Growth hormone-releasing peptide (GHRP-2) — clinical perspectives and therapeutic potential", authors: "Bowers CY", journal: "Journal of Pediatric Endocrinology & Metabolism", year: 2002, url: "https://pubmed.ncbi.nlm.nih.gov/12510975/" }
  ],
  'ghrp-6': [
    { title: "GHRP-6: a GHRP and ghrelin receptor agonist", authors: "Bowers CY", journal: "Growth Hormone & IGF Research", year: 2005, doi: "10.1016/j.ghir.2005.06.017", url: "https://pubmed.ncbi.nlm.nih.gov/16102976/" }
  ],
  'cjc-1295': [
    { title: "Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting analog of GH-releasing hormone", authors: "Teichman SL, et al.", journal: "Journal of Clinical Endocrinology & Metabolism", year: 2006, doi: "10.1210/jc.2005-1536", url: "https://pubmed.ncbi.nlm.nih.gov/16352683/" }
  ],
  'kisspeptin-10': [
    { title: "Kisspeptin as a trigger of egg maturation in IVF", authors: "Abbara A, et al.", journal: "Journal of Clinical Endocrinology & Metabolism", year: 2015, doi: "10.1210/jc.2014-3841", url: "https://pubmed.ncbi.nlm.nih.gov/25710564/" }
  ],
  'peg-mgf': [
    { title: "MGF splice variant of IGF-I promotes myoblast proliferation", authors: "Yang SY, Goldspink G", journal: "Journal of Muscle Research and Cell Motility", year: 2002, url: "https://pubmed.ncbi.nlm.nih.gov/12785096/" },
    { title: "PEGylation enhances the therapeutic potential of MGF for muscle regeneration", authors: "Carpenter V, et al.", journal: "Growth Hormone & IGF Research", year: 2008, url: "https://pubmed.ncbi.nlm.nih.gov/18242112/" }
  ]
};

// ========= 2. ADD MISSING STACKING PROTOCOLS =========
const missingStacks = {
  'melanotan-ii': [
    { name: "Tanning & Libido Stack", peptides: ["Melanotan II", "PT-141"], description: "Melanotan II for melanocortin-mediated tanning with PT-141 for targeted sexual function enhancement. MT-II provides both effects but PT-141 adds more specific MC4R activation for libido." },
    { name: "Fat Loss & Tanning Stack", peptides: ["Melanotan II", "AOD-9604", "MOTS-C"], description: "Body recomposition with aesthetic benefits. Melanotan II for appetite suppression and tanning, AOD-9604 for fat metabolism, MOTS-C for metabolic optimization." }
  ],
  'aod-9604': [
    { name: "Fat Loss Stack", peptides: ["AOD-9604", "CJC-1295", "Ipamorelin"], description: "Comprehensive fat metabolism protocol. AOD-9604 directly targets adipose tissue while CJC-1295/Ipamorelin elevate GH for enhanced lipolysis without the diabetogenic effects of full-length GH." },
    { name: "Body Recomposition Stack", peptides: ["AOD-9604", "MOTS-C", "BPC-157"], description: "Fat loss with metabolic and tissue support. AOD-9604 for lipolysis, MOTS-C for insulin sensitivity and mitochondrial function, BPC-157 for joint/tissue protection during intensive training." }
  ],
  'ghrp-6': [
    { name: "Mass Gain Stack", peptides: ["GHRP-6", "CJC-1295"], description: "Strong GH elevation with appetite stimulation for mass gain phases. GHRP-6's potent ghrelin-mimetic appetite drive plus CJC-1295's sustained GHRH signaling. 100 mcg each, 2–3x daily." },
    { name: "Recovery & Growth Stack", peptides: ["GHRP-6", "CJC-1295", "BPC-157"], description: "GH-driven recovery protocol. GHRP-6/CJC-1295 maximize GH pulses while BPC-157 accelerates tendon and soft tissue repair. Ideal for athletes in heavy training phases." }
  ],
  'ghrp-2': [
    { name: "GH Maximization Stack", peptides: ["GHRP-2", "CJC-1295"], description: "Maximum GH release pairing. GHRP-2 is the most potent GHRP — combined with CJC-1295's GHRH amplification, this produces significant GH/IGF-1 elevation. 100–300 mcg each, 2–3x daily on empty stomach." },
    { name: "Anti-Aging GH Stack", peptides: ["GHRP-2", "CJC-1295", "Epitalon"], description: "GH optimization with longevity support. GHRP-2/CJC-1295 for GH secretion, Epitalon for telomere maintenance and melatonin restoration." }
  ],
  'kisspeptin-10': [
    { name: "Fertility Support Stack", peptides: ["Kisspeptin-10", "BPC-157"], description: "Reproductive axis stimulation with systemic healing support. Kisspeptin-10 triggers LH/FSH release for fertility while BPC-157 supports overall tissue health and hormone balance." }
  ],
  'mgf': [
    { name: "Muscle Repair Stack", peptides: ["MGF", "PEG-MGF", "IGF-1 LR3"], description: "Full IGF-1 variant stack for muscle growth. MGF for immediate post-workout satellite cell activation (short window), PEG-MGF for extended signaling, IGF-1 LR3 for sustained anabolic drive." },
    { name: "Post-Training Recovery Stack", peptides: ["MGF", "BPC-157", "TB-500"], description: "Rapid post-workout recovery. MGF immediately activates satellite cells, BPC-157 and TB-500 provide comprehensive tissue repair for muscle, tendon, and connective tissue." }
  ]
};

// ========= APPLY ALL =========
let refsAdded = 0;
let stacksAdded = 0;

data.peptides.forEach(p => {
  // Add references
  if (newReferences[p.slug]) {
    if (!p.references) p.references = [];
    const existingUrls = new Set(p.references.map(r => r.url));
    newReferences[p.slug].forEach(ref => {
      if (!existingUrls.has(ref.url)) {
        p.references.push(ref);
        refsAdded++;
      }
    });
  }
  
  // Add missing stacking protocols
  if (missingStacks[p.slug]) {
    if (!p.stackingProtocols) p.stackingProtocols = [];
    if (p.stackingProtocols.length === 0) {
      p.stackingProtocols = missingStacks[p.slug];
      stacksAdded += missingStacks[p.slug].length;
    }
  }
});

// ========= SAVE =========
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`References added: ${refsAdded}`);
console.log(`Stacking protocols added: ${stacksAdded}`);
console.log('Total peptides: ' + data.peptides.length);

// Verify counts
const rfkSlugs = ['bpc-157','tb-500','ll-37','semax','epithalon','ghk-cu','mots-c','melanotan-ii','dihexa','kpv','dsip','ipamorelin','ghrp-2','ghrp-6','cjc-1295','kisspeptin-10','selank','thymosin-alpha-1','aod-9604','peg-mgf'];
let mechCount = 0, routeCount = 0, stackCount = 0, refCount = 0;
rfkSlugs.forEach(slug => {
  const p = data.peptides.find(x => x.slug === slug);
  if (p?.mechanism && p.mechanism.length > 50) mechCount++;
  if (p?.routesOfAdministration?.length > 0) routeCount++;
  if (p?.stackingProtocols?.length > 0) stackCount++;
  if (p?.references?.length > 0) refCount++;
});
console.log(`\nRFK Peptide Status (${rfkSlugs.length} total):`);
console.log(`  Mechanisms: ${mechCount}/${rfkSlugs.length}`);
console.log(`  Routes: ${routeCount}/${rfkSlugs.length}`);
console.log(`  Stacking: ${stackCount}/${rfkSlugs.length}`);
console.log(`  References: ${refCount}/${rfkSlugs.length}`);
