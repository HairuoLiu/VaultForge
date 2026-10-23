(function (root) {
  'use strict';

  // Density lookup (g/cm³)
  const DENSITIES = {
    PLA: 1.24,
    PETG: 1.27,
    ABS: 1.05,
    ASA: 1.07
  };

  // Base net filament weight (grams, assuming PLA @ 15% infill, 2 walls)
  // Evaluated based on sliced G-code / 3MF standard print profiles for USSA VAULT
  const BASE_WEIGHTS = {
    // Single drawer module + box + facade + runners by width & height
    drawers: {
      S: { '1F': 210, '2F': 310, '4F': 510 },
      M: { '1F': 290, '2F': 420, '4F': 690 },
      L: { '1F': 380, '2F': 540, '4F': 880 },
      XL: { '1F': 470, '2F': 670, '4F': 1080 }
    },
    // Sustainer module + hinges + latch + handle by width & height
    sustainers: {
      S: { '1F': 240, '2F': 350, '4F': 560 },
      M: { '1F': 330, '2F': 480, '4F': 760 },
      L: { '1F': 440, '2F': 620, '4F': 980 },
      XL: { '1F': 550, '2F': 780, '4F': 1220 }
    },
    // Depth scaling factors compared to depth 3
    depthFactors: {
      '3': 1.0,
      '4': 1.18,
      '5': 1.36,
      '6': 1.54,
      '7': 1.72
    },
    // Additional accessories
    roofs: {
      none: 0,
      grid: 75,
      table: 90,
      bowl: 95,
      mount: 80,
      heavyweight: 140,
      whole: 85,
      split: 95
    },
    topHandle: 45,
    gearedRails: 35
  };

  // Printer speed profiles (grams extruded per hour on average)
  const PRINTER_PROFILES = {
    bambuCoreXY: { name: 'High-speed CoreXY (Bambu Lab / K1 / Voron)', avgGramsPerHour: 22 },
    standardBedSlinger: { name: 'Standard Bed-Slinger (Ender 3 / Prusa MK3)', avgGramsPerHour: 12 }
  };

  /**
   * Estimate filament usage, cost, and print time for a list of builds
   * @param {Object} options
   * @param {Array<Object>} options.builds Build list from BuildPlan
   * @param {string} options.material 'PLA' | 'PETG' | 'ABS' | 'ASA'
   * @param {number} options.spoolPriceCAD Price per 1kg spool in CAD (default: 22)
   * @param {string} options.printerType 'bambuCoreXY' | 'standardBedSlinger'
   * @param {number} options.infillPercent Infill percentage (default: 15)
   */
  function estimate(options = {}) {
    const builds = options.builds || [];
    const material = options.material || 'PLA';
    const spoolPriceCAD = typeof options.spoolPriceCAD === 'number' ? options.spoolPriceCAD : 22;
    const printerType = options.printerType || 'bambuCoreXY';
    const infillPercent = typeof options.infillPercent === 'number' ? options.infillPercent : 15;

    // Relative density multiplier against PLA baseline (1.24)
    const densityRatio = (DENSITIES[material] || 1.24) / 1.24;
    // Infill multiplier: 15% is baseline (1.0), each 5% adds ~7% mass
    const infillRatio = 1.0 + (infillPercent - 15) * 0.014;

    let totalGrams = 0;
    const moduleBreakdown = [];

    builds.forEach((build, idx) => {
      const cfg = build.configuration || {};
      const w = cfg.width || 'S';
      const d = String(cfg.depth || '3');
      const h = cfg.height || '1F';
      const count = build.count || 1;
      const isDrawer = build.system !== 'sustainers';

      const baseTable = isDrawer ? BASE_WEIGHTS.drawers : BASE_WEIGHTS.sustainers;
      const baseGrams = (baseTable[w]?.[h] || 250);
      const dFactor = BASE_WEIGHTS.depthFactors[d] || 1.0;

      let singleUnitGrams = baseGrams * dFactor;

      // Add roof
      const roofType = cfg.drawerRoof || cfg.roof || 'none';
      if (BASE_WEIGHTS.roofs[roofType]) {
        singleUnitGrams += BASE_WEIGHTS.roofs[roofType] * dFactor;
      }
      // Add top handle
      if (cfg.topHandle) singleUnitGrams += BASE_WEIGHTS.topHandle;
      // Add geared rails
      if (cfg.gearedRails) singleUnitGrams += BASE_WEIGHTS.gearedRails;

      // Apply material density and infill adjustments
      singleUnitGrams = Math.round(singleUnitGrams * densityRatio * infillRatio);
      const batchGrams = singleUnitGrams * count;
      totalGrams += batchGrams;

      moduleBreakdown.push({
        index: idx + 1,
        name: build.name || `${build.system} ${w}${d} ${h}`,
        count,
        singleUnitGrams,
        batchGrams
      });
    });

    const totalKg = Number((totalGrams / 1000).toFixed(2));
    // Number of 1kg spools needed (ceiling)
    const spoolsNeeded = Math.max(1, Math.ceil(totalGrams / 1000));
    const estimatedCostCAD = Number((totalKg * spoolPriceCAD).toFixed(2));

    const printerProfile = PRINTER_PROFILES[printerType] || PRINTER_PROFILES.bambuCoreXY;
    const totalPrintHours = Number((totalGrams / printerProfile.avgGramsPerHour).toFixed(1));
    const totalPrintDays = Number((totalPrintHours / 24).toFixed(1));

    return {
      material,
      totalGrams,
      totalKg,
      spoolsNeeded,
      estimatedCostCAD,
      printTime: {
        printerProfile: printerProfile.name,
        hours: totalPrintHours,
        days: totalPrintDays
      },
      moduleBreakdown
    };
  }

  root.FilamentEstimator = {
    DENSITIES,
    BASE_WEIGHTS,
    PRINTER_PROFILES,
    estimate
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.FilamentEstimator;
  }
})(globalThis);
