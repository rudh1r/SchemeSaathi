#!/usr/bin/env node
/**
 * Builds src/eligibility/rules.json from:
 *   1. hand-verified rules (src/eligibility/curated-rules.json)
 *   2. automatic derivation for every other scheme (src/eligibility/auto-rules.js)
 *
 * Usage:  node scripts/build-rules.js [path/to/schemes.json]
 */
const fs = require('fs');
const path = require('path');
const { deriveRules } = require('../src/eligibility/auto-rules');

const root = path.resolve(__dirname, '..', '..');
const schemesPath = process.argv[2] || path.join(root, 'data', 'schemes.json');
const curatedPath = path.join(__dirname, '..', 'src', 'eligibility', 'curated-rules.json');
const outPath = path.join(__dirname, '..', 'src', 'eligibility', 'rules.json');

function main() {
  const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
  const curated = JSON.parse(fs.readFileSync(curatedPath, 'utf8'));
  const rules = {};
  let reviewed = 0;
  let auto = 0;
  const missingCurated = new Set(Object.keys(curated));

  for (const scheme of schemes) {
    const name = scheme.scheme_name;
    const handcrafted = curated[name];
    if (handcrafted) {
      rules[name] = { ...handcrafted, source: 'curated', reviewed: true };
      missingCurated.delete(name);
      reviewed += 1;
    } else {
      rules[name] = deriveRules(scheme);
      auto += 1;
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(rules, null, 2), 'utf8');

  console.log(`Wrote ${outPath}`);
  console.log(`  schemes in data file : ${schemes.length}`);
  console.log(`  hand-verified rules  : ${reviewed}`);
  console.log(`  auto-derived rules   : ${auto}`);

  if (missingCurated.size) {
    console.warn(`  curated schemes not found in schemes.json (${missingCurated.size}):`);
    for (const name of missingCurated) console.warn(`   - ${name}`);
  }

  const weak = Object.entries(rules).filter(([, r]) => r.conditions.length === 0);
  if (weak.length) {
    console.warn(`  schemes with no machine-checkable condition: ${weak.length}`);
    for (const [name] of weak.slice(0, 10)) console.warn(`   - ${name}`);
  }
}

main();
