(function (root) {
  'use strict';

  // Standard dimensions of USSA VAULT components in millimeters
  // S / M / L / XL modules, 1F/2F/4F heights, bases, wheels, roofs
  const DIMENSIONS = {
    // Widths in mm
    widths: {
      S: 154,
      M: 238,
      L: 322,
      XL: 406
    },
    // Depths in mm (depth unit 3..7, calculated on 42mm grid)
    depths: {
      '3': 168,
      '4': 210,
      '5': 252,
      '6': 294,
      '7': 336
    },
    // Drawer module heights in mm
    drawerHeights: {
      '1F': 64,
      '2F': 118,
      '4F': 226
    },
    // Sustainer module heights in mm
    sustainerHeights: {
      '1F': 72,
      '2F': 126,
      '4F': 234
    },
    // Roofs additional height in mm
    roofs: {
      none: 0,
      grid: 12,
      table: 16,
      bowl: 16,
      mount: 18,
      heavyweight: 22,
      whole: 14,
      split: 16
    },
    // Top handle additional height in mm
    topHandle: 46,
    // Base modifications additional height in mm
    bases: {
      standard: 0,
      feet: 25,
      castersM8: 75,
      mobileBigWheels: 110
    }
  };

  // Popular furniture and workshop clearance standards
  const CLEARANCE_TARGETS = [
    { id: 'ikea-alex', name: { zh: '宜家 ALEX 抽屉柜下空间', en: 'IKEA ALEX Desk Clearance' }, maxH: 660, maxW: 360, maxD: 580 },
    { id: 'standard-desk', name: { zh: '标准办公书桌下空间', en: 'Standard Desk Underspace' }, maxH: 720, maxW: 600, maxD: 600 },
    { id: 'kallax-cube', name: { zh: '宜家 KALLAX 卡莱克格子', en: 'IKEA KALLAX Cube Insert' }, maxH: 335, maxW: 335, maxD: 380 },
    { id: 'bambu-top', name: { zh: '拓竹 3D 打印机顶柜承载', en: 'Bambu Lab Printer Top Clearance' }, maxH: 450, maxW: 390, maxD: 390 },
    { id: 'car-trunk', name: { zh: '紧凑型汽车后备箱垂直高度', en: 'Compact Car Trunk Height' }, maxH: 480, maxW: 900, maxD: 700 }
  ];

  /**
   * Calculate exact spatial metrics for a vertical stack of modules
   * @param {Object} options
   * @param {string} options.width 'S' | 'M' | 'L' | 'XL'
   * @param {string} options.depth '3'..'7'
   * @param {Array<Object>} options.tiers Array of tier definitions [{ system: 'drawers', height: '1F' }, ...]
   * @param {string} options.base 'standard' | 'feet' | 'castersM8' | 'mobileBigWheels'
   * @param {string} options.roof 'none' | 'grid' | 'table' | 'bowl' | 'mount' | 'heavyweight'
   * @param {boolean} options.hasTopHandle
   */
  function calculateTower(options = {}) {
    const width = options.width || 'S';
    const depth = String(options.depth || '3');
    const tiers = options.tiers || [];
    const baseType = options.base || 'standard';
    const roofType = options.roof || 'none';
    const hasTopHandle = options.hasTopHandle === true;

    const baseWidth = DIMENSIONS.widths[width] || 154;
    const baseDepth = DIMENSIONS.depths[depth] || 168;

    let modulesHeight = 0;
    const tierBreakdown = tiers.map((tier, idx) => {
      const isDrawer = tier.system !== 'sustainers';
      const hStr = tier.height || '1F';
      const hMm = isDrawer ? (DIMENSIONS.drawerHeights[hStr] || 64) : (DIMENSIONS.sustainerHeights[hStr] || 72);
      modulesHeight += hMm;
      return {
        index: idx + 1,
        system: tier.system || 'drawers',
        heightCode: hStr,
        heightMm: hMm
      };
    });

    const baseHeight = DIMENSIONS.bases[baseType] || 0;
    const roofHeight = DIMENSIONS.roofs[roofType] || 0;
    const handleHeight = hasTopHandle ? DIMENSIONS.topHandle : 0;

    const totalHeight = baseHeight + modulesHeight + roofHeight + handleHeight;

    // Check fit against clearance targets
    const clearances = CLEARANCE_TARGETS.map(target => {
      const fits = totalHeight <= target.maxH && baseWidth <= target.maxW && baseDepth <= target.maxD;
      const marginH = target.maxH - totalHeight;
      return {
        id: target.id,
        name: target.name,
        fits,
        marginH,
        maxH: target.maxH
      };
    });

    return {
      widthMm: baseWidth,
      depthMm: baseDepth,
      totalHeightMm: totalHeight,
      breakdown: {
        baseMm: baseHeight,
        modulesMm: modulesHeight,
        roofMm: roofHeight,
        handleMm: handleHeight,
        tiers: tierBreakdown
      },
      tierCount: tiers.length,
      clearances
    };
  }

  root.TowerStacker = {
    DIMENSIONS,
    CLEARANCE_TARGETS,
    calculateTower
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.TowerStacker;
  }
})(globalThis);
