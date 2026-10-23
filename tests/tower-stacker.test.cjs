const test = require('node:test');
const assert = require('node:assert/strict');
const TowerStacker = require('../assets/tower-stacker.js');

test('TowerStacker computes standard S3 1F standalone drawer dimensions correctly', () => {
  const result = TowerStacker.calculateTower({
    width: 'S',
    depth: '3',
    tiers: [{ system: 'drawers', height: '1F' }],
    base: 'standard',
    roof: 'none',
    hasTopHandle: false
  });

  assert.equal(result.widthMm, 154);
  assert.equal(result.depthMm, 168);
  assert.equal(result.totalHeightMm, 64);
  assert.equal(result.tierCount, 1);
});

test('TowerStacker computes multi-tier stack with base and grid roof with handle', () => {
  const result = TowerStacker.calculateTower({
    width: 'M',
    depth: '4',
    tiers: [
      { system: 'drawers', height: '2F' }, // 118mm
      { system: 'drawers', height: '1F' }, // 64mm
      { system: 'sustainers', height: '1F' } // 72mm
    ],
    base: 'castersM8', // 75mm
    roof: 'grid', // 12mm
    hasTopHandle: true // 46mm
  });

  // Expected height: 75 + (118 + 64 + 72) + 12 + 46 = 387mm
  assert.equal(result.widthMm, 238);
  assert.equal(result.depthMm, 210);
  assert.equal(result.totalHeightMm, 387);
  assert.equal(result.breakdown.baseMm, 75);
  assert.equal(result.breakdown.modulesMm, 254);
  assert.equal(result.breakdown.roofMm, 12);
  assert.equal(result.breakdown.handleMm, 46);

  // Clearance check: 387mm fits in standard desk (720mm) and IKEA Alex (660mm)
  const desk = result.clearances.find(c => c.id === 'standard-desk');
  assert.equal(desk.fits, true);
  assert.equal(desk.marginH, 720 - 387);
});

test('TowerStacker warns when exceeding clearance target', () => {
  const result = TowerStacker.calculateTower({
    width: 'XL',
    depth: '7',
    tiers: [
      { system: 'drawers', height: '4F' }, // 226mm (hypothetical or multi-tier)
      { system: 'drawers', height: '4F' }, // 226mm
      { system: 'drawers', height: '4F' }  // 226mm
    ],
    base: 'mobileBigWheels', // 110mm
    roof: 'heavyweight' // 22mm
  });

  // Total height: 110 + 678 + 22 = 810mm
  assert.ok(result.totalHeightMm > 750);
  const alex = result.clearances.find(c => c.id === 'ikea-alex');
  assert.equal(alex.fits, false);
  assert.ok(alex.marginH < 0);
});
