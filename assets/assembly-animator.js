(function (root) {
  'use strict';

  // Standard explosion directional vectors (in normalized units relative to cabinet scale)
  const EXPLODE_VECTORS = {
    // Structural root
    module: [0, 0, 0],
    backPanel: [0, 0, -1.2],

    // Sliding drawer core
    box: [0, 0, 0.9],
    splitBox: [0, 0, 0.9],

    // Front facade & interface
    facade: [0, 0, 1.8],
    xlFacade: [0, 0, 1.8],
    facadeCap: [0, 0, 2.2],
    label: [0, 0, 2.3],

    // Key & lock mechanism
    standardKey: [0, 0, 2.5],
    hiddenKey: [0, 0, 2.5],
    hiddenKeyPart: [0, 0, 2.6],
    keyCap: [0, 0, 2.7],
    latch: [0, -0.4, 1.4],
    springs: [0, -0.2, 1.2],

    // Roof & upper extensions
    roof: [0, 1.2, 0],
    grid: [0, 1.2, 0],
    table: [0, 1.2, 0],
    bowl: [0, 1.2, 0],
    mount: [0, 1.3, 0],
    heavyweight: [0, 1.4, 0],
    roofConnector: [0, 1.5, 0],
    topHandle: [0, 2.1, 0],

    // Left and right side runners
    guideLeft: [-1.2, 0, 0.2],
    guideRight: [1.2, 0, 0.2],
    slideLeft: [-1.0, 0, 0.6],
    slideRight: [1.0, 0, 0.6],
    stopper: [0, 0, -0.6],
    rails: [0, -0.8, 0],

    // Sustainer hinges & latches
    topHinge: [0, 1.3, -0.8],
    bottomHinge: [0, -0.6, -0.9],
    rods: [0, 0.4, -0.9],
    lockHolder: [0, 0.5, 1.5],
    lockInner: [0, 0.5, 1.7],
    lockOuter: [0, 0.5, 1.9],
    lockPins: [0, 0.5, 2.1],

    // Fasteners
    drawerFacadeScrew: [0, 0, 2.4],
    topHandleBolt: [0, 2.6, 0],
    sustainerHingeScrew: [0, -0.9, -1.2]
  };

  /**
   * Cubic ease-out curve for smooth mechanical motion
   * @param {number} t Time/progress 0..1
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  }

  /**
   * Compute 3D translation offset for a specific role at explosion factor t
   * @param {string} role Component role (e.g. 'facade', 'box', 'topHandle')
   * @param {number} progress 0 (fully assembled) to 1 (fully exploded)
   * @param {number} scaleMultiplier Distance multiplier in mm (default: 80mm)
   * @returns {[number, number, number]} [dx, dy, dz] offset in mm
   */
  function getOffset(role, progress = 0, scaleMultiplier = 80) {
    const vector = EXPLODE_VECTORS[role] || [0, 0, 0];
    const eased = easeOutCubic(progress);
    return [
      vector[0] * scaleMultiplier * eased,
      vector[1] * scaleMultiplier * eased,
      vector[2] * scaleMultiplier * eased
    ];
  }

  /**
   * Get full exploded state for all parts of a configuration
   * @param {string} system 'drawers' | 'sustainers'
   * @param {Object} configuration
   * @param {number} progress 0..1
   * @param {number} maxExplodeDistanceMm
   */
  function computeExplodedLayout(system, configuration, progress = 0, maxExplodeDistanceMm = 80) {
    if (!root.BuildPlan) return [];
    const resolved = root.BuildPlan.resolve(system, configuration);
    const layout = [];

    resolved.parts.forEach(part => {
      const offset = getOffset(part.role, progress, maxExplodeDistanceMm);
      layout.push({
        path: part.path,
        role: part.role,
        qty: part.qty,
        offsetMm: offset,
        assembled: progress === 0
      });
    });

    resolved.hardware.forEach(hw => {
      const hwRole = hw.role === 'topHandle' ? 'topHandleBolt' : 'drawerFacadeScrew';
      const offset = getOffset(hwRole, progress, maxExplodeDistanceMm);
      layout.push({
        size: hw.size,
        role: hw.role,
        isHardware: true,
        qty: hw.qty,
        offsetMm: offset
      });
    });

    return layout;
  }

  root.AssemblyAnimator = {
    EXPLODE_VECTORS,
    easeOutCubic,
    getOffset,
    computeExplodedLayout
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.AssemblyAnimator;
  }
})(globalThis);
