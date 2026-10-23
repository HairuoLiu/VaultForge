(function (root) {
  'use strict';

  // Standard USSA VAULT label plate dimensions (in mm)
  const PRESETS = {
    standard: { width: 50, height: 18, baseThickness: 1.2, textThickness: 0.8 },
    compact: { width: 40, height: 14, baseThickness: 1.0, textThickness: 0.6 },
    wide: { width: 75, height: 20, baseThickness: 1.4, textThickness: 0.8 }
  };

  /**
   * Helper to write a triangular facet into a Binary STL DataView
   */
  function writeFacet(view, offset, normal, v1, v2, v3) {
    // Normal (nx, ny, nz)
    view.setFloat32(offset + 0, normal[0], true);
    view.setFloat32(offset + 4, normal[1], true);
    view.setFloat32(offset + 8, normal[2], true);
    // V1
    view.setFloat32(offset + 12, v1[0], true);
    view.setFloat32(offset + 16, v1[1], true);
    view.setFloat32(offset + 20, v1[2], true);
    // V2
    view.setFloat32(offset + 24, v2[0], true);
    view.setFloat32(offset + 28, v2[1], true);
    view.setFloat32(offset + 32, v2[2], true);
    // V3
    view.setFloat32(offset + 36, v3[0], true);
    view.setFloat32(offset + 40, v3[1], true);
    view.setFloat32(offset + 44, v3[2], true);
    // Attribute byte count (0)
    view.setUint16(offset + 48, 0, true);
    return offset + 50;
  }

  /**
   * Add a rectangular box (12 triangles) to triangle list
   */
  function addBoxTriangles(triangles, x1, y1, z1, x2, y2, z2) {
    // 8 vertices
    const p0 = [x1, y1, z1], p1 = [x2, y1, z1], p2 = [x2, y2, z1], p3 = [x1, y2, z1];
    const p4 = [x1, y1, z2], p5 = [x2, y1, z2], p6 = [x2, y2, z2], p7 = [x1, y2, z2];

    // Bottom (Z-)
    triangles.push({ n: [0, 0, -1], v1: p0, v2: p2, v3: p1 });
    triangles.push({ n: [0, 0, -1], v1: p0, v2: p3, v3: p2 });
    // Top (Z+)
    triangles.push({ n: [0, 0, 1], v1: p4, v2: p5, v3: p6 });
    triangles.push({ n: [0, 0, 1], v1: p4, v2: p6, v3: p7 });
    // Front (Y-)
    triangles.push({ n: [0, -1, 0], v1: p0, v2: p1, v3: p5 });
    triangles.push({ n: [0, -1, 0], v1: p0, v2: p5, v3: p4 });
    // Back (Y+)
    triangles.push({ n: [0, 1, 0], v1: p3, v2: p6, v3: p2 });
    triangles.push({ n: [0, 1, 0], v1: p3, v2: p7, v3: p6 });
    // Left (X-)
    triangles.push({ n: [-1, 0, 0], v1: p0, v2: p4, v3: p7 });
    triangles.push({ n: [-1, 0, 0], v1: p0, v2: p7, v3: p3 });
    // Right (X+)
    triangles.push({ n: [1, 0, 0], v1: p1, v2: p2, v3: p6 });
    triangles.push({ n: [1, 0, 0], v1: p1, v2: p6, v3: p5 });
  }

  // 5x7 Dot-matrix font map for clean 3D mechanical alphanumeric embossing
  const FONT_5X7 = {
    'A': [0x0C, 0x12, 0x12, 0x1E, 0x12, 0x12, 0x12],
    'B': [0x1C, 0x12, 0x12, 0x1C, 0x12, 0x12, 0x1C],
    'C': [0x0E, 0x10, 0x10, 0x10, 0x10, 0x10, 0x0E],
    'D': [0x1C, 0x12, 0x12, 0x12, 0x12, 0x12, 0x1C],
    'E': [0x1E, 0x10, 0x10, 0x1C, 0x10, 0x10, 0x1E],
    'F': [0x1E, 0x10, 0x10, 0x1C, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x10, 0x10, 0x16, 0x12, 0x12, 0x0E],
    'H': [0x12, 0x12, 0x12, 0x1E, 0x12, 0x12, 0x12],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'J': [0x02, 0x02, 0x02, 0x02, 0x12, 0x12, 0x0C],
    'K': [0x12, 0x14, 0x18, 0x10, 0x18, 0x14, 0x12],
    'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1E],
    'M': [0x11, 0x1B, 0x15, 0x11, 0x11, 0x11, 0x11],
    'N': [0x12, 0x16, 0x1A, 0x12, 0x12, 0x12, 0x12],
    'O': [0x0C, 0x12, 0x12, 0x12, 0x12, 0x12, 0x0C],
    'P': [0x1C, 0x12, 0x12, 0x1C, 0x10, 0x10, 0x10],
    'Q': [0x0C, 0x12, 0x12, 0x12, 0x16, 0x12, 0x0D],
    'R': [0x1C, 0x12, 0x12, 0x1C, 0x14, 0x12, 0x12],
    'S': [0x0E, 0x10, 0x10, 0x0C, 0x02, 0x02, 0x1C],
    'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x12, 0x12, 0x12, 0x12, 0x12, 0x12, 0x0C],
    'V': [0x11, 0x11, 0x11, 0x0A, 0x0A, 0x04, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
    'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    'Z': [0x1F, 0x02, 0x04, 0x08, 0x10, 0x10, 0x1F],
    '0': [0x0E, 0x13, 0x15, 0x19, 0x11, 0x11, 0x0E],
    '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    '2': [0x0C, 0x12, 0x02, 0x04, 0x08, 0x10, 0x1F],
    '3': [0x1E, 0x02, 0x04, 0x0C, 0x02, 0x12, 0x0C],
    '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
    '5': [0x1F, 0x10, 0x1C, 0x02, 0x02, 0x12, 0x0C],
    '6': [0x0C, 0x10, 0x10, 0x1C, 0x12, 0x12, 0x0C],
    '7': [0x1F, 0x02, 0x04, 0x08, 0x10, 0x10, 0x10],
    '8': [0x0C, 0x12, 0x12, 0x0C, 0x12, 0x12, 0x0C],
    '9': [0x0C, 0x12, 0x12, 0x0E, 0x02, 0x02, 0x0C],
    '-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x0C],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  };

  /**
   * Generate Binary STL ArrayBuffer for a custom text label plate
   * @param {string} text Text string to emboss (e.g. "M4 SCREWS")
   * @param {Object} options Config options
   * @returns {ArrayBuffer} Valid binary STL
   */
  function generateSTL(text = 'VAULT', options = {}) {
    const preset = PRESETS[options.preset || 'standard'] || PRESETS.standard;
    const width = options.width || preset.width;
    const height = options.height || preset.height;
    const baseThick = options.baseThickness || preset.baseThickness;
    const textThick = options.textThickness || preset.textThickness;

    const triangles = [];

    // 1. Base plate
    addBoxTriangles(triangles, 0, 0, 0, width, height, baseThick);

    // 2. Embossed text
    const cleanText = String(text).toUpperCase().slice(0, 14);
    const charCount = cleanText.length;
    if (charCount > 0) {
      // Calculate font scale to fit inside plate with padding
      const maxTextWidth = width * 0.88;
      const maxTextHeight = height * 0.65;
      const charWidth = Math.min(maxTextWidth / charCount, maxTextHeight * (5 / 7));
      const charHeight = charWidth * (7 / 5);
      const pixelSize = charWidth / 5;

      const totalBlockWidth = charCount * charWidth;
      const startX = (width - totalBlockWidth) / 2;
      const startY = (height - charHeight) / 2;

      for (let c = 0; c < charCount; c++) {
        const ch = cleanText[c];
        const bitmap = FONT_5X7[ch] || FONT_5X7[' '];
        const charOriginX = startX + c * charWidth;

        for (let row = 0; row < 7; row++) {
          const rowBits = bitmap[row];
          const y1 = startY + (6 - row) * pixelSize;
          const y2 = y1 + pixelSize;

          for (let col = 0; col < 5; col++) {
            if ((rowBits & (1 << (4 - col))) !== 0) {
              const x1 = charOriginX + col * pixelSize;
              const x2 = x1 + pixelSize;
              // Embossed pixel voxel
              addBoxTriangles(triangles, x1, y1, baseThick, x2, y2, baseThick + textThick);
            }
          }
        }
      }
    }

    // 3. Encode into Binary STL buffer
    const bufferSize = 84 + triangles.length * 50;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // 80-byte header
    const headerStr = `VaultForge Parametric Label: ${cleanText}`.padEnd(80, ' ');
    for (let i = 0; i < 80; i++) {
      view.setUint8(i, headerStr.charCodeAt(i) || 32);
    }

    // Number of triangles (uint32)
    view.setUint32(80, triangles.length, true);

    // Write facets
    let offset = 84;
    for (let i = 0; i < triangles.length; i++) {
      const t = triangles[i];
      offset = writeFacet(view, offset, t.n, t.v1, t.v2, t.v3);
    }

    return buffer;
  }

  /**
   * Helper to download the generated label STL in browser
   */
  function downloadSTL(text, options = {}) {
    const buffer = generateSTL(text, options);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = text.replace(/[^a-zA-Z0-9_-]/g, '_') || 'label';
    a.href = url;
    a.download = `Vault_Label_${safeName}.stl`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  root.LabelCustomizer = {
    PRESETS,
    generateSTL,
    downloadSTL
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.LabelCustomizer;
  }
})(globalThis);
