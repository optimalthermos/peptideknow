/**
 * normalize-fields.js
 * Normalizes duplicate snake_case/camelCase fields in peptides.json.
 * Keeps camelCase as canonical, merges snake_case data, removes snake_case duplicates.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'peptides.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

let mergedCount = 0;
let removedFields = 0;

data.peptides.forEach(p => {
  // 1. routes_of_administration → routesOfAdministration
  if (p.routes_of_administration) {
    if (!p.routesOfAdministration || p.routesOfAdministration.length === 0) {
      p.routesOfAdministration = p.routes_of_administration;
      mergedCount++;
    }
    delete p.routes_of_administration;
    removedFields++;
  }

  // 2. stacking → stackingProtocols (merge if stacking has data not in stackingProtocols)
  if (p.stacking) {
    if (!p.stackingProtocols || p.stackingProtocols.length === 0) {
      p.stackingProtocols = p.stacking.map(s => ({
        name: s.name,
        peptides: s.compounds || s.peptides || [],
        description: s.purpose || s.description || '',
        notes: s.notes || ''
      }));
      mergedCount++;
    }
    delete p.stacking;
    removedFields++;
  }

  // 3. half_life → halfLife
  if (p.half_life) {
    if (!p.halfLife) {
      p.halfLife = p.half_life;
      mergedCount++;
    }
    delete p.half_life;
    removedFields++;
  }

  // 4. synthesis_info — keep as-is (no camelCase equivalent, but standardize)
  // Actually let's rename to synthesisInfo for consistency
  if (p.synthesis_info) {
    if (!p.synthesisInfo) {
      p.synthesisInfo = p.synthesis_info;
    }
    delete p.synthesis_info;
    removedFields++;
  }

  // 5. popularity_score → keep but also set as popularityScore
  if (p.popularity_score && !p.popularityScore) {
    p.popularityScore = p.popularity_score;
  }
  // Keep popularity_score for now since server.js references it

  // 6. Normalize dosage — ensure it's always an object, not a string
  if (typeof p.dosage === 'string' && p.dosage !== '') {
    // Convert string dosage to object format
    p.dosage = {
      standard: p.dosage,
      notes: p.dosageNotes || ''
    };
  }

  // 7. Normalize reconstitution — ensure it's always an object
  if (typeof p.reconstitution === 'string' && p.reconstitution !== '') {
    p.reconstitution = {
      notes: p.reconstitution
    };
  }

  // 8. Normalize pubChemCID / pubchemCid
  if (p.pubchemCid && !p.pubChemCID) {
    p.pubChemCID = p.pubchemCid;
  }
  if (p.pubchemCid) {
    delete p.pubchemCid;
  }

  // 9. Normalize clinicalTrialPhase → merge into clinicalTrialStatus
  if (p.clinicalTrialPhase && !p.clinicalTrialStatus) {
    p.clinicalTrialStatus = p.clinicalTrialPhase;
  }
  if (p.clinicalTrialPhase) {
    delete p.clinicalTrialPhase;
  }
});

// Update metadata
data.metadata.totalPeptides = data.peptides.length;
data.metadata.lastUpdated = new Date().toISOString().split('T')[0];

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`Normalized ${data.peptides.length} peptides`);
console.log(`Merged ${mergedCount} fields from snake_case to camelCase`);
console.log(`Removed ${removedFields} duplicate snake_case fields`);

// Verify
const verify = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
let snakeFields = 0;
verify.peptides.forEach(p => {
  if (p.routes_of_administration) snakeFields++;
  if (p.half_life) snakeFields++;
  if (p.stacking) snakeFields++;
  if (p.synthesis_info) snakeFields++;
  if (p.pubchemCid) snakeFields++;
  if (p.clinicalTrialPhase) snakeFields++;
});
console.log(`Remaining snake_case fields: ${snakeFields}`);
console.log(`Total peptides: ${verify.peptides.length}`);
console.log(`JSON valid: true`);
