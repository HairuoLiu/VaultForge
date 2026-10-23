const test = require('node:test');
const assert = require('node:assert/strict');
const FilamentEstimator = require('../assets/filament-estimator.js');

test('FilamentEstimator calculates single S3 1F drawer PLA estimate', () => {
  const result = FilamentEstimator.estimate({
    builds: [{
      system: 'drawers',
      configuration: { width: 'S', depth: '3', height: '1F', drawerRoof: 'none', topHandle: false, gearedRails: false },
      count: 1
    }],
    material: 'PLA',
    spoolPriceCAD: 20
  });

  assert.equal(result.material, 'PLA');
  assert.equal(result.totalGrams, 210);
  assert.equal(result.spoolsNeeded, 1);
  assert.equal(result.estimatedCostCAD, 4.20);
  assert.ok(result.printTime.hours > 0);
});

test('FilamentEstimator scales for multiple batches and material densities', () => {
  // PETG density ratio (1.27 / 1.24 = ~1.024)
  const resultPLA = FilamentEstimator.estimate({
    builds: [{
      system: 'drawers',
      configuration: { width: 'L', depth: '5', height: '2F', drawerRoof: 'grid', topHandle: true, gearedRails: true },
      count: 2
    }],
    material: 'PLA',
    spoolPriceCAD: 24
  });

  const resultPETG = FilamentEstimator.estimate({
    builds: [{
      system: 'drawers',
      configuration: { width: 'L', depth: '5', height: '2F', drawerRoof: 'grid', topHandle: true, gearedRails: true },
      count: 2
    }],
    material: 'PETG',
    spoolPriceCAD: 24
  });

  assert.ok(resultPETG.totalGrams > resultPLA.totalGrams);
  assert.ok(resultPLA.spoolsNeeded >= 1);
  assert.equal(resultPLA.moduleBreakdown.length, 1);
  assert.equal(resultPLA.moduleBreakdown[0].count, 2);
});

test('FilamentEstimator calculates CoreXY vs Bedslinger print time accurately', () => {
  const options = {
    builds: [{
      system: 'sustainers',
      configuration: { width: 'XL', depth: '7', height: '4F', roof: 'whole' },
      count: 3
    }]
  };

  const fastResult = FilamentEstimator.estimate({ ...options, printerType: 'bambuCoreXY' });
  const slowResult = FilamentEstimator.estimate({ ...options, printerType: 'standardBedSlinger' });

  assert.ok(slowResult.printTime.hours > fastResult.printTime.hours);
  // Bedslinger (12g/h) takes roughly 1.8x longer than CoreXY (22g/h)
  const ratio = slowResult.printTime.hours / fastResult.printTime.hours;
  assert.ok(ratio > 1.7 && ratio < 1.9);
});
