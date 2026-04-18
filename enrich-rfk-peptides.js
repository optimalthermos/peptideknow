// Enrichment script: Add PEG-MGF, fill mechanism/stacking/routes for all RFK peptides
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'peptides.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ========= 1. ADD PEG-MGF =========
const pegMGF = {
  "name": "PEG-MGF",
  "slug": "peg-mgf",
  "alternativeNames": ["PEGylated Mechano Growth Factor", "PEGylated MGF", "PEG-IGF-1Ec"],
  "description": "PEG-MGF (PEGylated Mechano Growth Factor) is a chemically modified variant of Mechano Growth Factor, itself a splice variant of Insulin-like Growth Factor 1 (IGF-1). The addition of polyethylene glycol (PEG) chains extends the peptide's half-life from just minutes (native MGF) to several hours or days, dramatically improving its bioavailability and therapeutic window. PEG-MGF plays a critical role in muscle regeneration by activating satellite cells — the stem-cell-like precursors of muscle fibers — thereby supporting muscle repair, hypertrophy, and tissue recovery after mechanical stress or injury. It has also been studied for neuroprotective and cardioprotective effects.",
  "categories": ["muscle-growth", "healing-recovery"],
  "molecularWeight": "~2,888 Da (MGF) + PEG chain",
  "sequenceLength": "24 amino acids (E peptide) + PEG modification",
  "casNumber": "N/A (research peptide)",
  "pubchemCid": null,
  "mechanism": "PEG-MGF activates satellite cells in muscle tissue via the IGF-1 receptor signaling pathway. When injected, it binds to IGF-1 receptors and triggers the PI3K/Akt/mTOR anabolic cascade, promoting protein synthesis and cell proliferation. Unlike systemic IGF-1, MGF acts primarily as a local tissue repair factor — it stimulates myoblast (muscle stem cell) division and fusion, a critical step in muscle fiber regeneration and hypertrophy. The PEGylation process attaches polyethylene glycol molecules to the peptide, shielding it from rapid enzymatic degradation and extending its biological half-life from approximately 5–7 minutes (native MGF) to 48–72 hours. PEG-MGF also regulates inflammation at injury sites by increasing neutrophil and macrophage recruitment, and it exhibits anti-apoptotic effects in damaged muscle cells. Additional research suggests PEG-MGF may enhance neural progenitor cell proliferation, promote cardiac stem cell survival, and improve bone marrow mesenchymal stem cell migration.",
  "benefits": [
    "Activates muscle satellite cells to promote muscle fiber repair and growth",
    "Extends anabolic signaling window through PEGylation (hours vs minutes)",
    "Supports muscle hypertrophy when used post-training",
    "Enhances tissue regeneration at injury sites (tendons, ligaments, muscle)",
    "May reduce muscle recovery time after intense exercise",
    "Exhibits neuroprotective properties in preclinical models of cerebral ischemia",
    "May support cardiac muscle function via inhibition of apoptosis",
    "Does not suppress natural testosterone or affect HPTA axis"
  ],
  "dosage": {
    "typicalRange": "200–500 mcg per injection",
    "frequency": "2–3 times per week, post-workout",
    "cycleDuration": "4–8 weeks (up to 16 weeks with gradual titration)",
    "beginner": "150–200 mcg, 2x per week, post-workout",
    "intermediate": "200–400 mcg, 2–3x per week, post-workout",
    "advanced": "400–500 mcg, 3x per week, targeting specific muscle groups",
    "notes": "Inject within 30–60 minutes post-workout near the trained muscle group for localized effect. PEGylation allows once-daily or every-other-day systemic dosing. Start low and titrate upward every 2 weeks."
  },
  "sideEffects": [
    "Injection site irritation (redness, swelling, mild discomfort)",
    "Fatigue or mild flu-like symptoms, especially at higher doses",
    "Localized muscle tightness or cramps",
    "Temporary water retention when stacked with GH-releasing peptides",
    "Potential blood pressure drop at excessive doses",
    "Hypoglycemia (low blood sugar) — rare",
    "Risk of disproportionate muscle growth if repeatedly injected at same site"
  ],
  "aminoAcidSequence": "YQPPSTNKNTKSQRRKGSTFEEHK (MGF E peptide) + PEG modification",
  "clinicalTrialStatus": "Preclinical — no completed human clinical trials. Efficacy demonstrated in animal and cell culture models for muscle regeneration, neuroprotection, and cardiac repair.",
  "routesOfAdministration": [
    {
      "route": "Subcutaneous Injection",
      "bioavailability": "High — PEGylation provides extended systemic circulation",
      "notes": "Most common method. Inject near trained/injured muscle group for localized effect. Rotate injection sites to prevent tissue irritation or nodule formation."
    },
    {
      "route": "Intramuscular Injection",
      "bioavailability": "High — direct delivery to target muscle tissue",
      "notes": "Preferred for site-specific targeting. Inject into the muscle group trained during the workout session for maximal satellite cell activation."
    }
  ],
  "stackingProtocols": [
    {
      "name": "Muscle Growth Stack",
      "peptides": ["PEG-MGF", "IGF-1 LR3", "CJC-1295", "Ipamorelin"],
      "description": "Combines PEG-MGF's satellite cell activation with IGF-1 LR3's sustained anabolic signaling and CJC-1295/Ipamorelin's growth hormone optimization. PEG-MGF 200–400 mcg post-workout 2–3x/week, IGF-1 LR3 50–100 mcg daily, CJC-1295 + Ipamorelin 100 mcg each before bed."
    },
    {
      "name": "Injury Recovery Stack",
      "peptides": ["PEG-MGF", "BPC-157", "TB-500"],
      "description": "Comprehensive tissue repair protocol. PEG-MGF near injury site 2–3x/week for satellite cell activation, BPC-157 250 mcg daily for angiogenesis and gut/tendon healing, TB-500 2–5 mg/week for systemic tissue remodeling."
    },
    {
      "name": "Post-Cycle Recovery Stack",
      "peptides": ["PEG-MGF", "BPC-157", "IGF-1 LR3"],
      "description": "Preserves and rebuilds muscle tissue after anabolic cycles. PEG-MGF supports continued satellite cell activity while BPC-157 promotes healing and IGF-1 LR3 maintains anabolic drive."
    }
  ],
  "synergisticCompounds": [
    { "name": "IGF-1 LR3", "slug": "igf-1-lr3", "relationship": "Sequential growth signaling — PEG-MGF initiates repair via satellite cells, IGF-1 LR3 sustains long-term anabolic signaling" },
    { "name": "BPC-157", "slug": "bpc-157", "relationship": "Complementary healing — BPC-157 promotes angiogenesis and tendon repair while PEG-MGF activates muscle stem cells" },
    { "name": "TB-500", "slug": "tb-500", "relationship": "Synergistic tissue repair — TB-500 promotes systemic tissue remodeling while PEG-MGF targets localized muscle regeneration" },
    { "name": "CJC-1295", "slug": "cjc-1295", "relationship": "GH optimization enhances the growth factor environment in which PEG-MGF operates" },
    { "name": "Ipamorelin", "slug": "ipamorelin", "relationship": "Selective GH release complements PEG-MGF's local muscle repair activity" },
    { "name": "MGF", "slug": "mgf", "relationship": "Parent compound — PEG-MGF is the PEGylated (extended half-life) form of MGF" }
  ],
  "relatedPeptides": [
    { "name": "MGF", "slug": "mgf", "relationship": "Non-PEGylated parent compound with shorter half-life (minutes)" },
    { "name": "IGF-1 LR3", "slug": "igf-1-lr3", "relationship": "Related IGF-1 variant with systemic anabolic effects" },
    { "name": "IGF-1", "slug": "igf-1", "relationship": "Parent growth factor family — MGF is a splice variant of IGF-1" },
    { "name": "Follistatin-344", "slug": "follistatin-344", "relationship": "Myostatin inhibitor that complements PEG-MGF's muscle growth pathway" }
  ],
  "references": [
    { "title": "Mechano Growth Factor splice variant of IGF-I promotes myoblast proliferation", "authors": "Yang SY, Goldspink G", "journal": "Journal of Muscle Research and Cell Motility", "year": 2002, "url": "https://pubmed.ncbi.nlm.nih.gov/12785096/" },
    { "title": "Expression of MGF isoforms following exercise and muscle damage", "authors": "Hill M, Goldspink G", "journal": "Molecular and Cellular Endocrinology", "year": 2003, "url": "https://pubmed.ncbi.nlm.nih.gov/12573529/" },
    { "title": "PEGylation enhances the therapeutic potential of MGF for muscle regeneration", "authors": "Carpenter V et al.", "journal": "Growth Hormone & IGF Research", "year": 2008, "url": "https://pubmed.ncbi.nlm.nih.gov/18242112/" },
    { "title": "MGF promotes neural progenitor cell proliferation and neuroprotection", "authors": "Dluzniewska J et al.", "journal": "Experimental Cell Research", "year": 2005, "url": "https://pubmed.ncbi.nlm.nih.gov/16009364/" }
  ]
};

data.peptides.push(pegMGF);
console.log('Added PEG-MGF');

// ========= 2. REMOVE kpv-tripeptide DUPLICATE =========
const kvpIdx = data.peptides.findIndex(p => p.slug === 'kpv-tripeptide');
if (kvpIdx !== -1) {
  data.peptides.splice(kvpIdx, 1);
  console.log('Removed kpv-tripeptide duplicate');
}

// ========= 3. ENRICH MECHANISMS =========
const mechanisms = {
  'bpc-157': "BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide derived from a protective protein found in human gastric juice. It exerts its healing effects through multiple pathways: it promotes angiogenesis (formation of new blood vessels) via upregulation of VEGF and its receptor, stimulates nitric oxide synthesis for vasodilation and blood flow, modulates the FAK-paxillin pathway to accelerate tendon and ligament repair, and interacts with the dopaminergic, serotonergic, and GABAergic systems for neuroprotective effects. BPC-157 also counteracts the effects of NSAIDs on the GI tract, promotes collagen deposition, and has demonstrated cytoprotective properties in models of organ damage including liver, brain, and heart tissue.",
  'tb-500': "TB-500 (Thymosin Beta-4 fragment) promotes tissue repair through upregulation of actin, a cell-building protein essential for cell migration and proliferation. It promotes angiogenesis and new blood vessel growth from existing vessels, reduces inflammation by downregulating inflammatory cytokines including IL-1β, TNF-α, and NF-κB, and promotes cellular migration to injury sites. TB-500 also activates cardiac progenitor cells for heart tissue repair, promotes hair follicle stem cell migration, and reduces fibrosis and scar tissue formation through regulation of matrix metalloproteinases (MMPs).",
  'll-37': "LL-37 is the only human cathelicidin antimicrobial peptide, cleaved from its precursor protein hCAP18 by proteinase 3. It disrupts bacterial, viral, and fungal cell membranes through electrostatic interactions with negatively charged phospholipid bilayers. Beyond direct antimicrobial action, LL-37 modulates innate and adaptive immunity by recruiting immune cells (neutrophils, monocytes, T cells) via formyl peptide receptor-like 1 (FPRL1), stimulating angiogenesis, promoting wound healing through keratinocyte migration, and modulating Toll-like receptor (TLR) signaling to regulate inflammatory responses.",
  'semax': "Semax is a synthetic analog of the ACTH(4-10) fragment (Met-Glu-His-Phe-Pro-Gly-Pro) with nootropic and neuroprotective properties. It activates the melanocortin system, increases BDNF (brain-derived neurotrophic factor) and TrkB receptor expression, modulates serotonergic and dopaminergic neurotransmission, and enhances NGF (nerve growth factor) synthesis. Semax also inhibits enkephalinase activity (extending endogenous opioid peptide action), promotes neuronal survival under oxidative stress, improves cerebral blood flow, and modulates gene expression related to immune and vascular function in the brain.",
  'epithalon': "Epitalon (Epithalon, Epithalone) is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) based on epithalamin, a peptide extract from the pineal gland. Its primary mechanism involves activation of telomerase — the enzyme that maintains and extends telomeres (the protective caps at the end of chromosomes). By inducing telomerase reverse transcriptase (hTERT) expression, Epitalon helps preserve telomere length during cell division, potentially extending cellular lifespan. It also stimulates melatonin production by the pineal gland, helping regulate circadian rhythms and providing antioxidant protection. Additional mechanisms include modulation of gene expression related to cell aging and apoptosis.",
  'ghk-cu': "GHK-Cu (Glycyl-L-histidyl-L-lysine copper complex) is a naturally occurring tripeptide-copper complex found in human plasma, saliva, and urine. It activates multiple regenerative pathways: it stimulates collagen I, III, and V synthesis, increases decorin, elastin, and glycosaminoglycan production, promotes angiogenesis via VEGF and FGF-2 upregulation, activates metalloproteinases for tissue remodeling, attracts immune cells and fibroblasts to wound sites, and provides anti-inflammatory effects through suppression of TGF-β and TNF-α. The copper ion is essential for lysyl oxidase (collagen cross-linking enzyme) activity. GHK-Cu also modulates expression of over 4,000 human genes, resetting gene expression patterns toward a healthier profile.",
  'mots-c': "MOTS-c (Mitochondrial Open Reading Frame of the 12S rRNA Type-c) is a mitochondria-derived peptide encoded within the 12S rRNA gene of mitochondrial DNA. It functions as a retrograde signaling molecule from mitochondria to the nucleus, activating AMPK (AMP-activated protein kinase) — the master metabolic sensor. MOTS-c promotes glucose uptake independent of insulin, enhances fatty acid oxidation, improves mitochondrial function and biogenesis, and regulates the methionine-folate cycle affecting one-carbon metabolism. It accumulates in skeletal muscle during exercise and has been shown to improve insulin sensitivity, reduce fat accumulation, and enhance physical performance in aged animal models.",
  'melanotan-ii': "Melanotan II is a synthetic cyclic analog of alpha-melanocyte stimulating hormone (α-MSH). It binds non-selectively to melanocortin receptors MC1R through MC5R. MC1R activation in melanocytes stimulates melanin production (tanning). MC3R and MC4R activation in the hypothalamus affects appetite regulation, sexual arousal (via central nervous system pathways), and energy homeostasis. The MC4R pathway is primarily responsible for Melanotan II's effects on erectile function and sexual desire. Its cyclic structure provides greater receptor binding affinity and metabolic stability compared to linear α-MSH.",
  'dihexa': "Dihexa (N-hexanoic-Tyr-Ile-(6) aminohexanoic amide) is a modified angiotensin IV analog that binds to hepatocyte growth factor (HGF) and its receptor c-Met with extraordinary potency — approximately 10 million times more potent than BDNF in promoting synaptic connectivity. It facilitates HGF/c-Met dimerization, activating downstream signaling cascades (PI3K/Akt and MAPK/ERK pathways) that promote synaptogenesis, dendritic spine formation, and neuronal survival. Dihexa crosses the blood-brain barrier and has demonstrated dramatic cognitive enhancement in animal models of dementia, improving spatial learning, memory consolidation, and synaptic plasticity.",
  'kpv': "KPV is a C-terminal tripeptide fragment (Lys-Pro-Val) of alpha-melanocyte stimulating hormone (α-MSH). It exerts potent anti-inflammatory effects by directly entering cells and inhibiting NF-κB activation — the master transcription factor regulating inflammatory gene expression. KPV blocks IκBα phosphorylation and subsequent nuclear translocation of NF-κB, reducing production of pro-inflammatory cytokines (TNF-α, IL-1β, IL-6). It also inhibits inflammatory pathways in intestinal epithelial cells and immune cells, making it particularly relevant for inflammatory bowel conditions. Unlike full-length α-MSH, KPV does not bind to melanocortin receptors and does not cause pigmentation changes.",
  'dsip': "DSIP (Delta Sleep-Inducing Peptide) is a naturally occurring nonapeptide (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu) first isolated from rabbit brain during electrically-induced slow-wave sleep. It modulates sleep architecture by promoting delta (slow-wave) sleep stages via interaction with GABA-A receptors and modulation of glutamatergic transmission. DSIP also acts on the hypothalamic-pituitary axis, normalizing ACTH and cortisol levels to regulate stress responses. Additional mechanisms include enhancement of LH (luteinizing hormone) release, reduction of somatostatin levels (potentially enhancing GH release during sleep), and antioxidant effects through induction of superoxide dismutase and catalase enzymes.",
  'ipamorelin': "Ipamorelin is a selective growth hormone secretagogue (GHS) that binds to the ghrelin/GHS receptor (GHS-R1a) in the anterior pituitary gland, stimulating pulsatile growth hormone release. Unlike other GHRPs (GHRP-2, GHRP-6), Ipamorelin is highly selective — it does not significantly increase cortisol, prolactin, or ACTH levels at therapeutic doses. It mimics natural GH pulsatility patterns, stimulating release in a dose-dependent manner. The selectivity is attributed to its pentapeptide structure (Aib-His-D-2-Nal-D-Phe-Lys-NH2) which provides precise receptor interaction without the broader hypothalamic effects of less selective secretagogues.",
  'ghrp-2': "GHRP-2 (Growth Hormone Releasing Peptide-2, Pralmorelin) stimulates GH release by binding to the GHS-R1a (ghrelin) receptor in the pituitary and hypothalamus. It triggers GH secretion through multiple mechanisms: direct pituitary stimulation, amplification of GHRH signaling, and suppression of somatostatin (GH-inhibiting hormone). GHRP-2 is one of the most potent GHRPs, producing substantial GH elevation along with moderate increases in cortisol, prolactin, and ACTH. It also stimulates appetite via ghrelin receptor activation in the hypothalamus and has demonstrated cytoprotective effects on hepatocytes and cardioprotective properties.",
  'ghrp-6': "GHRP-6 (Growth Hormone Releasing Peptide-6) is a hexapeptide that stimulates growth hormone secretion by binding to the ghrelin/GHS-R1a receptor. It acts both at the pituitary level (direct GH release) and hypothalamic level (GHRH neuron activation and somatostatin suppression). GHRP-6 is notable for its strong appetite-stimulating effect due to potent ghrelin mimicry, and it increases cortisol and prolactin more than selective alternatives like Ipamorelin. It also demonstrates gastro-protective properties and promotes wound healing through GH-mediated and direct cellular mechanisms including increased collagen deposition.",
  'cjc-1295': "CJC-1295 is a synthetic 30-amino acid analog of Growth Hormone Releasing Hormone (GHRH) with modifications that dramatically extend its half-life. The DAC (Drug Affinity Complex) version covalently binds to albumin in the bloodstream via a reactive lysine, extending its half-life to 6–8 days. The non-DAC version (mod-GRF 1-29) has a half-life of approximately 30 minutes. CJC-1295 stimulates the GHRH receptor on somatotroph cells in the anterior pituitary, promoting pulsatile GH release and subsequent IGF-1 elevation. It preserves the natural physiological pattern of GH secretion rather than causing a sustained, non-pulsatile elevation.",
  'kisspeptin': "Kisspeptin peptides bind to the GPR54 (KISS1R) receptor on GnRH neurons in the hypothalamus, serving as the primary upstream regulator of the HPG (hypothalamic-pituitary-gonadal) axis. Kisspeptin signaling triggers GnRH (gonadotropin-releasing hormone) secretion, which in turn stimulates LH and FSH release from the pituitary, ultimately driving testosterone and estrogen production. Kisspeptin-10 is the minimum biologically active fragment (10 C-terminal amino acids). This system is the master switch for puberty onset and reproductive function, and it is being investigated for fertility treatments and as a diagnostic tool for reproductive disorders.",
  'kisspeptin-10': "Kisspeptin-10 is the minimum biologically active C-terminal decapeptide fragment of the kisspeptin family. It binds to the GPR54 (KISS1R) receptor on GnRH neurons in the hypothalamus, triggering GnRH secretion and downstream LH/FSH release. Kisspeptin-10 is the most potent activator of the HPG reproductive axis and has been used clinically to trigger egg maturation in IVF protocols as an alternative to hCG. Its signaling is tightly regulated by sex steroid feedback, and it plays a central role in puberty onset, menstrual cycle regulation, and metabolic-reproductive cross-talk.",
  'selank': "Selank is a synthetic analog of the immunomodulatory peptide tuftsin (Thr-Lys-Pro-Arg) with an added Pro-Gly-Pro sequence that enhances metabolic stability. It modulates the GABAergic system by allosterically enhancing GABA-A receptor sensitivity, producing anxiolytic effects without sedation or dependence. Selank also increases BDNF expression in the hippocampus, modulates serotonin metabolism (inhibiting enkephalinase to extend enkephalin activity), enhances IL-6 expression for immune modulation, and stabilizes enkephalins in blood plasma. It does not produce tolerance, withdrawal, or cognitive impairment — distinguishing it from benzodiazepines.",
  'thymosin-alpha-1': "Thymosin Alpha-1 (Tα1) is a 28-amino acid peptide naturally produced by the thymus gland. It acts as a master immune regulator by activating Toll-like receptors (TLR2, TLR9) on dendritic cells, promoting dendritic cell maturation and antigen presentation. Tα1 enhances T cell differentiation and function (both CD4+ helper and CD8+ cytotoxic), stimulates natural killer (NK) cell activity, modulates cytokine production toward a Th1 (antiviral/antibacterial) response, and promotes antibody production. It is one of the few peptides with extensive clinical trial data and is approved as a pharmaceutical (Zadaxin) in over 35 countries for hepatitis B/C treatment and as an immune adjuvant.",
  'aod-9604': "AOD-9604 (Advanced Obesity Drug 9604) is a modified fragment of human growth hormone (hGH), specifically amino acids 177–191 with a tyrosine addition at position 177. It mimics the fat-metabolizing effects of growth hormone without the growth-promoting or diabetogenic effects. AOD-9604 stimulates lipolysis (fat breakdown) and inhibits lipogenesis (fat formation) through interaction with the beta-3 adrenergic receptor on adipocytes. It activates a calcium-dependent pathway distinct from the full GH receptor signaling cascade, allowing selective fat metabolism. It has also shown chondroprotective properties and may promote cartilage repair.",
  'mgf': "MGF (Mechano Growth Factor) is a splice variant of IGF-1 (specifically IGF-1Ec) that is expressed locally in muscle tissue in response to mechanical overload or damage. Unlike systemic IGF-1 which is produced by the liver, MGF acts as a local tissue repair factor. It activates satellite cells — the muscle stem cell population — by stimulating their proliferation and delaying terminal differentiation, allowing for increased myoblast fusion and muscle fiber repair. MGF signals through the IGF-1 receptor to activate PI3K/Akt and MAPK/ERK pathways but has unique activity via its distinctive C-terminal E peptide domain. Its extremely short half-life (5–7 minutes) limits its therapeutic utility compared to PEG-MGF."
};

// ========= 4. ENRICH ROUTES OF ADMINISTRATION =========
const routes = {
  'bpc-157': [
    { route: "Subcutaneous Injection", bioavailability: "High systemic availability", notes: "Most common method. Inject into abdominal fat or near injury site. Typical dose 250–500 mcg 1–2x daily." },
    { route: "Intramuscular Injection", bioavailability: "High — direct tissue delivery", notes: "Preferred for localized injuries (tendon, joint, muscle). Inject near the injury site." },
    { route: "Oral (Capsule/Liquid)", bioavailability: "Lower but effective for GI conditions", notes: "BPC-157 is uniquely stable in gastric acid. Oral administration is preferred for gut healing, IBS, and GI inflammatory conditions." }
  ],
  'tb-500': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic distribution", notes: "Most common method. TB-500 has systemic effects regardless of injection site. Typical loading dose 2–5 mg, 2x/week." },
    { route: "Intramuscular Injection", bioavailability: "High — localized and systemic", notes: "Can be injected near injury site though systemic effects occur regardless of location." }
  ],
  'll-37': [
    { route: "Subcutaneous Injection", bioavailability: "Moderate — local and systemic immune effects", notes: "Standard method for immune modulation. Typical dose 50–100 mcg daily." },
    { route: "Topical Application", bioavailability: "Local skin/wound effects", notes: "Applied directly to wounds or skin infections. LL-37 promotes wound healing and has direct antimicrobial activity at the application site." },
    { route: "Intranasal", bioavailability: "Moderate — direct respiratory tract delivery", notes: "Used for upper respiratory infections and sinus conditions. Direct antimicrobial action on nasal/sinus mucosa." }
  ],
  'semax': [
    { route: "Intranasal", bioavailability: "High — crosses blood-brain barrier effectively", notes: "Primary and preferred route. Nasal spray delivers peptide directly to CNS via olfactory mucosa. Typical dose 200–600 mcg, 2–3x daily." },
    { route: "Subcutaneous Injection", bioavailability: "High — systemic with CNS penetration", notes: "Alternative to intranasal. Used when nasal administration is impractical." }
  ],
  'epithalon': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic telomerase activation", notes: "Standard method. Typical protocol: 5–10 mg daily for 10–20 day cycles, repeated every 4–6 months." },
    { route: "Intramuscular Injection", bioavailability: "High — systemic distribution", notes: "Alternative to subcutaneous. Same dosing protocol." },
    { route: "Intravenous Injection", bioavailability: "Highest — immediate systemic availability", notes: "Used in clinical research settings. Provides fastest onset of telomerase activation." }
  ],
  'ghk-cu': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic regenerative effects", notes: "Used for systemic anti-aging, wound healing, and tissue regeneration. Typical dose 1–3 mg daily." },
    { route: "Topical (Cream/Serum)", bioavailability: "Local skin effects — moderate dermal penetration", notes: "Most common consumer application. Used for skin rejuvenation, hair growth, and wound healing. Apply 1–2x daily to target area." },
    { route: "Intradermal (Microneedling)", bioavailability: "High local dermal delivery", notes: "Combined with microneedling for enhanced penetration. Popular in aesthetic medicine for collagen induction." }
  ],
  'mots-c': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic metabolic effects", notes: "Standard method. Typical dose 5–10 mg, 3–5x per week. Best administered 30–60 min before exercise." },
    { route: "Intramuscular Injection", bioavailability: "High — direct muscle delivery", notes: "Alternative method. May provide faster onset of metabolic effects in target muscle tissue." }
  ],
  'melanotan-ii': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic melanocortin receptor activation", notes: "Standard method. Start with 0.25 mg to assess tolerance, then 0.5–1 mg daily until desired pigmentation. Maintenance 1–2x per week." }
  ],
  'dihexa': [
    { route: "Oral (Sublingual/Capsule)", bioavailability: "Moderate — crosses blood-brain barrier", notes: "Can be taken orally due to metabolic stability. Typical dose 10–20 mg daily. Sublingual may improve bioavailability." },
    { route: "Subcutaneous Injection", bioavailability: "High — enhanced CNS penetration", notes: "Alternative for higher bioavailability. Typical dose 5–10 mg daily." },
    { route: "Intranasal", bioavailability: "Moderate-high — direct CNS delivery", notes: "Delivers peptide to brain via olfactory route, bypassing BBB limitations." }
  ],
  'kpv': [
    { route: "Oral (Capsule/BPC-157 combination)", bioavailability: "Moderate — GI tract delivery", notes: "Preferred for inflammatory bowel conditions (IBD, colitis). KPV acts directly on intestinal epithelial cells. Typical dose 200–500 mcg daily." },
    { route: "Subcutaneous Injection", bioavailability: "High — systemic anti-inflammatory effects", notes: "Used for systemic inflammation. Typical dose 200–500 mcg daily." },
    { route: "Topical", bioavailability: "Local skin effects", notes: "Applied to skin conditions (eczema, psoriasis, dermatitis). Direct anti-inflammatory action on keratinocytes." }
  ],
  'dsip': [
    { route: "Subcutaneous Injection", bioavailability: "High — crosses blood-brain barrier", notes: "Standard method. Typical dose 100–300 mcg, administered 30–60 minutes before desired sleep time." },
    { route: "Intravenous Injection", bioavailability: "Highest — rapid CNS delivery", notes: "Used in clinical research. Provides most consistent sleep-inducing effects." },
    { route: "Intranasal", bioavailability: "Moderate — direct CNS access", notes: "Emerging route for sleep regulation. Bypasses peripheral metabolism for more direct hypothalamic action." }
  ],
  'ipamorelin': [
    { route: "Subcutaneous Injection", bioavailability: "High — rapid GH release within 15–30 minutes", notes: "Standard method. Typical dose 100–300 mcg, 1–3x daily (before bed and/or morning). Best on empty stomach." }
  ],
  'ghrp-2': [
    { route: "Subcutaneous Injection", bioavailability: "High — rapid pituitary GH release", notes: "Standard method. Typical dose 100–300 mcg, 2–3x daily on empty stomach. Peak GH at 15–30 minutes post-injection." },
    { route: "Intranasal", bioavailability: "Lower than injection — ~20–30% relative", notes: "Convenience route. Requires higher doses to achieve comparable GH release. Less reliable absorption." }
  ],
  'ghrp-6': [
    { route: "Subcutaneous Injection", bioavailability: "High — rapid GH and ghrelin-mimetic effects", notes: "Standard method. Typical dose 100–300 mcg, 2–3x daily on empty stomach. Strong appetite stimulation within 20 minutes." }
  ],
  'cjc-1295': [
    { route: "Subcutaneous Injection", bioavailability: "High — extended release (DAC version: 6–8 day half-life; non-DAC: ~30 min)", notes: "Standard method. DAC version: 1–2 mg weekly. Non-DAC (mod-GRF 1-29): 100 mcg 1–3x daily, paired with a GHRP." }
  ],
  'kisspeptin-10': [
    { route: "Subcutaneous Injection", bioavailability: "High — rapid HPG axis activation", notes: "Used in clinical research for fertility protocols. Typical single dose 6.4 nmol/kg for IVF egg maturation trigger." },
    { route: "Intravenous Injection", bioavailability: "Highest — immediate LH release", notes: "Clinical research method. Produces rapid, dose-dependent LH pulse for diagnostic or therapeutic use." }
  ],
  'selank': [
    { route: "Intranasal", bioavailability: "High — direct CNS delivery via olfactory mucosa", notes: "Primary and preferred route. Typical dose 200–400 mcg, 2–3x daily. Provides anxiolytic effects within 15–30 minutes." },
    { route: "Subcutaneous Injection", bioavailability: "High — systemic and CNS effects", notes: "Alternative when nasal administration is impractical. Same dosing range." }
  ],
  'thymosin-alpha-1': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic immune modulation", notes: "Standard method (used in Zadaxin pharmaceutical). Typical dose 1.6 mg, 2x per week. Clinically validated route with decades of data." }
  ],
  'aod-9604': [
    { route: "Subcutaneous Injection", bioavailability: "High — systemic fat metabolism effects", notes: "Most common method. Typical dose 300 mcg daily, injected into abdominal fat. Best on empty stomach in the morning." },
    { route: "Oral (Capsule)", bioavailability: "Lower — significant first-pass metabolism", notes: "Oral formulations exist but require higher doses due to reduced bioavailability. Less common than injection." }
  ]
};

// ========= 5. ENRICH STACKING PROTOCOLS =========
const stacks = {
  'bpc-157': [
    { name: "Healing Stack", peptides: ["BPC-157", "TB-500"], description: "The gold standard for tissue repair. BPC-157 promotes angiogenesis and tendon healing while TB-500 provides systemic tissue remodeling. BPC-157 250–500 mcg daily + TB-500 2–5 mg 2x/week for 4–8 weeks." },
    { name: "Gut Healing Stack", peptides: ["BPC-157", "KPV"], description: "Targeted GI repair. BPC-157 (oral) heals gut lining and reduces NSAID damage while KPV (oral) provides anti-inflammatory action on intestinal epithelium." },
    { name: "Neuroprotective Stack", peptides: ["BPC-157", "Semax", "Selank"], description: "Brain and nerve repair. BPC-157 promotes nerve regeneration, Semax enhances BDNF and cognitive function, Selank provides anxiolytic support." }
  ],
  'tb-500': [
    { name: "Comprehensive Healing Stack", peptides: ["TB-500", "BPC-157", "GHK-Cu"], description: "Multi-pathway tissue repair. TB-500 for systemic remodeling, BPC-157 for tendon/gut healing, GHK-Cu for collagen and skin regeneration." },
    { name: "Cardiac Recovery Stack", peptides: ["TB-500", "BPC-157", "MOTS-C"], description: "Heart and metabolic support. TB-500 activates cardiac progenitor cells, BPC-157 supports vascular repair, MOTS-C enhances mitochondrial function." }
  ],
  'semax': [
    { name: "Cognitive Enhancement Stack", peptides: ["Semax", "Selank"], description: "The Russian nootropic combination. Semax provides cognitive enhancement and BDNF upregulation while Selank offers anxiolytic support without sedation. Both administered intranasally." },
    { name: "Neuroprotection Stack", peptides: ["Semax", "BPC-157", "Epitalon"], description: "Brain health and anti-aging. Semax for neurotrophin expression, BPC-157 for nerve healing, Epitalon for telomere maintenance and melatonin regulation." }
  ],
  'epithalon': [
    { name: "Longevity Stack", peptides: ["Epitalon", "MOTS-C", "GHK-Cu"], description: "Anti-aging protocol targeting multiple aging pathways. Epitalon for telomere maintenance, MOTS-C for mitochondrial health, GHK-Cu for gene expression reset and collagen synthesis." },
    { name: "Sleep & Recovery Stack", peptides: ["Epitalon", "DSIP", "Semax"], description: "Circadian regulation and neural health. Epitalon restores melatonin production, DSIP promotes deep delta sleep, Semax provides neuroprotective support." }
  ],
  'mots-c': [
    { name: "Metabolic Optimization Stack", peptides: ["MOTS-C", "AOD-9604", "Semaglutide"], description: "Comprehensive metabolic support. MOTS-C for AMPK activation and insulin sensitivity, AOD-9604 for targeted fat metabolism, Semaglutide for appetite regulation and GLP-1 signaling." },
    { name: "Performance Stack", peptides: ["MOTS-C", "BPC-157", "TB-500"], description: "Athletic recovery and metabolic performance. MOTS-C enhances exercise capacity and mitochondrial function, BPC-157/TB-500 accelerate tissue repair." }
  ],
  'kpv': [
    { name: "Gut Inflammation Stack", peptides: ["KPV", "BPC-157"], description: "Targeted GI healing. KPV inhibits NF-κB in intestinal epithelium while BPC-157 promotes gut lining repair and angiogenesis. Both can be taken orally for direct GI action." },
    { name: "Skin & Inflammation Stack", peptides: ["KPV", "GHK-Cu", "LL-37"], description: "Dermatological protocol. KPV for anti-inflammatory action, GHK-Cu for collagen and skin repair, LL-37 for antimicrobial defense in skin conditions." }
  ],
  'dsip': [
    { name: "Sleep Optimization Stack", peptides: ["DSIP", "Epitalon"], description: "Deep sleep and circadian regulation. DSIP promotes delta wave sleep while Epitalon restores pineal melatonin production for natural circadian rhythm support." },
    { name: "Stress & Sleep Stack", peptides: ["DSIP", "Selank", "Semax"], description: "Sleep, anxiety, and cognitive recovery. DSIP normalizes cortisol and sleep architecture, Selank provides daytime anxiolysis, Semax supports cognitive function." }
  ],
  'ghk-cu': [
    { name: "Skin Rejuvenation Stack", peptides: ["GHK-Cu", "Epithalon"], description: "Anti-aging skin protocol. GHK-Cu promotes collagen synthesis and gene expression reset while Epitalon maintains telomere length. GHK-Cu topical + Epitalon injectable." },
    { name: "Wound Healing Stack", peptides: ["GHK-Cu", "BPC-157", "TB-500"], description: "Comprehensive wound repair. GHK-Cu for collagen deposition and remodeling, BPC-157 for angiogenesis, TB-500 for cell migration and fibrosis reduction." }
  ],
  'dihexa': [
    { name: "Cognitive Recovery Stack", peptides: ["Dihexa", "Semax", "Selank"], description: "Maximum cognitive enhancement. Dihexa for synaptogenesis and HGF/c-Met activation, Semax for BDNF upregulation, Selank for anxiety reduction and focus." }
  ],
  'll-37': [
    { name: "Immune Defense Stack", peptides: ["LL-37", "Thymosin Alpha-1"], description: "Comprehensive immune support. LL-37 provides direct antimicrobial action while Thymosin Alpha-1 activates adaptive immunity via dendritic cell maturation and T cell enhancement." },
    { name: "Wound & Infection Stack", peptides: ["LL-37", "BPC-157", "GHK-Cu"], description: "Antimicrobial healing. LL-37 kills pathogens at wound site, BPC-157 promotes tissue repair, GHK-Cu stimulates collagen and skin regeneration." }
  ],
  'ipamorelin': [
    { name: "GH Optimization Stack", peptides: ["Ipamorelin", "CJC-1295"], description: "The most popular GH-boosting combination. Ipamorelin provides selective GH pulse stimulation while CJC-1295 (non-DAC) amplifies and extends the release. 100 mcg each, 1–3x daily before bed." },
    { name: "Anti-Aging GH Stack", peptides: ["Ipamorelin", "CJC-1295", "Epitalon"], description: "Growth hormone optimization with longevity support. Ipamorelin/CJC-1295 for GH/IGF-1 elevation, Epitalon for telomere maintenance." }
  ],
  'cjc-1295': [
    { name: "Standard GH Stack", peptides: ["CJC-1295", "Ipamorelin"], description: "Synergistic GH release — CJC-1295 amplifies GHRH signaling while Ipamorelin provides clean, selective GH pulses. Most widely used GH peptide combination." },
    { name: "Recovery & Growth Stack", peptides: ["CJC-1295", "Ipamorelin", "BPC-157", "TB-500"], description: "Full recovery protocol. GH elevation from CJC-1295/Ipamorelin enhances the tissue-healing effects of BPC-157 and TB-500." }
  ],
  'thymosin-alpha-1': [
    { name: "Immune Modulation Stack", peptides: ["Thymosin Alpha-1", "LL-37"], description: "Innate + adaptive immune support. Thymosin Alpha-1 enhances T cell and NK cell function while LL-37 provides direct antimicrobial defense." },
    { name: "Cancer Support Stack", peptides: ["Thymosin Alpha-1", "MOTS-C"], description: "Immune and metabolic support (adjunctive only). Thymosin Alpha-1 enhances immune surveillance, MOTS-C supports mitochondrial function and metabolic health." }
  ]
};

// ========= APPLY ALL ENRICHMENTS =========
data.peptides.forEach(p => {
  // Add mechanism
  if (mechanisms[p.slug] && (!p.mechanism || p.mechanism.length < 50)) {
    p.mechanism = mechanisms[p.slug];
  }
  
  // Add routes
  if (routes[p.slug] && (!p.routesOfAdministration || p.routesOfAdministration.length === 0)) {
    p.routesOfAdministration = routes[p.slug];
  }
  
  // Add stacking protocols
  if (stacks[p.slug] && (!p.stackingProtocols || p.stackingProtocols.length === 0)) {
    p.stackingProtocols = stacks[p.slug];
  }
});

// ========= 6. FIX KISSPEPTIN-10 =========
const kiss10 = data.peptides.find(p => p.slug === 'kisspeptin-10');
if (kiss10) {
  if (!kiss10.categories.includes('reproductive')) kiss10.categories.push('reproductive');
  if (!kiss10.dosage || Object.keys(kiss10.dosage).length === 0) {
    kiss10.dosage = {
      "typicalRange": "6.4 nmol/kg (single bolus for IVF) or 1–10 mcg/kg for research",
      "frequency": "Single dose or 1x daily for short research protocols",
      "cycleDuration": "Single administration (IVF trigger) or 1–2 weeks (research)",
      "beginner": "1 mcg/kg subcutaneous — assess HPG axis response",
      "intermediate": "5 mcg/kg subcutaneous — therapeutic LH stimulation",
      "advanced": "6.4 nmol/kg IV bolus — clinical IVF egg maturation trigger",
      "notes": "Kisspeptin-10 is primarily used in clinical/research settings for fertility assessment and IVF protocols. It triggers LH release within minutes. Not typically used in ongoing daily protocols."
    };
  }
}

// ========= SAVE =========
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\\nDone! Total peptides: ' + data.peptides.length);
console.log('Enrichment complete.');
