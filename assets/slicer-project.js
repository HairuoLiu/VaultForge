(function (root) {
  'use strict';

  // CRC32 table for pure-JS zip generation
  const CRC_TABLE = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC_TABLE[i] = c >>> 0;
  }

  function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * Pure JS lightweight ZIP archive builder (store mode, compatible with all unzippers and slicers)
   */
  class SimpleZip {
    constructor() {
      this.files = [];
    }

    add(path, content) {
      let data;
      if (typeof content === 'string') {
        data = new TextEncoder().encode(content);
      } else if (content instanceof ArrayBuffer) {
        data = new Uint8Array(content);
      } else if (content instanceof Uint8Array) {
        data = content;
      } else {
        data = new Uint8Array(0);
      }
      this.files.push({ path, data, crc: crc32(data), size: data.length });
    }

    build() {
      let totalSize = 0;
      // Local headers and data
      for (const f of this.files) {
        totalSize += 30 + f.path.length + f.size;
      }
      // Central directory
      const cdOffset = totalSize;
      let cdSize = 0;
      for (const f of this.files) {
        cdSize += 46 + f.path.length;
      }
      totalSize += cdSize + 22; // End of Central Directory

      const buffer = new ArrayBuffer(totalSize);
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);
      let offset = 0;
      const fileOffsets = [];

      // 1. Write local file entries
      for (const f of this.files) {
        fileOffsets.push(offset);
        // Signature: PK\x03\x04
        view.setUint32(offset, 0x04034b50, true);
        view.setUint16(offset + 4, 20, true); // Version needed (2.0)
        view.setUint16(offset + 6, 0, true);  // General purpose bit flag
        view.setUint16(offset + 8, 0, true);  // Compression (0 = store)
        view.setUint16(offset + 10, 0, true); // Mod time
        view.setUint16(offset + 12, 0, true); // Mod date
        view.setUint32(offset + 14, f.crc, true);
        view.setUint32(offset + 18, f.size, true); // Compressed size
        view.setUint32(offset + 22, f.size, true); // Uncompressed size
        view.setUint16(offset + 26, f.path.length, true);
        view.setUint16(offset + 28, 0, true); // Extra field length
        offset += 30;

        // Path
        for (let i = 0; i < f.path.length; i++) {
          bytes[offset + i] = f.path.charCodeAt(i);
        }
        offset += f.path.length;

        // Data
        bytes.set(f.data, offset);
        offset += f.size;
      }

      // 2. Write Central Directory
      const cdStart = offset;
      for (let i = 0; i < this.files.length; i++) {
        const f = this.files[i];
        const localOffset = fileOffsets[i];
        // Signature: PK\x01\x02
        view.setUint32(offset, 0x02014b50, true);
        view.setUint16(offset + 4, 20, true); // Version made by
        view.setUint16(offset + 6, 20, true); // Version needed
        view.setUint16(offset + 8, 0, true);  // General purpose
        view.setUint16(offset + 10, 0, true); // Compression method (0)
        view.setUint16(offset + 12, 0, true); // Mod time
        view.setUint16(offset + 14, 0, true); // Mod date
        view.setUint32(offset + 16, f.crc, true);
        view.setUint32(offset + 20, f.size, true);
        view.setUint32(offset + 24, f.size, true);
        view.setUint16(offset + 28, f.path.length, true);
        view.setUint16(offset + 30, 0, true); // Extra field
        view.setUint16(offset + 32, 0, true); // File comment
        view.setUint16(offset + 34, 0, true); // Disk number start
        view.setUint16(offset + 36, 0, true); // Internal file attributes
        view.setUint32(offset + 38, 0, true); // External file attributes
        view.setUint32(offset + 42, localOffset, true); // Local header offset
        offset += 46;

        for (let j = 0; j < f.path.length; j++) {
          bytes[offset + j] = f.path.charCodeAt(j);
        }
        offset += f.path.length;
      }

      // 3. Write End of Central Directory (EOCD)
      // Signature: PK\x05\x06
      view.setUint32(offset, 0x06054b50, true);
      view.setUint16(offset + 4, 0, true); // Disk number
      view.setUint16(offset + 6, 0, true); // Start disk
      view.setUint16(offset + 8, this.files.length, true); // Entries on this disk
      view.setUint16(offset + 10, this.files.length, true); // Total entries
      view.setUint32(offset + 12, cdSize, true); // Size of central directory
      view.setUint32(offset + 16, cdStart, true); // Offset of start of central directory
      view.setUint16(offset + 20, 0, true); // Comment length

      return buffer;
    }
  }

  /**
   * Classify parts into logical 3D print plates based on function & quality requirements
   */
  function organizePlates(parts = []) {
    const plate1 = {
      id: 1,
      name: 'Plate 1 - Main Structure & Box',
      setting: '0.20mm Standard · 15% Infill · 2 Walls',
      supports: false,
      parts: []
    };
    const plate2 = {
      id: 2,
      name: 'Plate 2 - Facades, Roofs & Exterior',
      setting: '0.16mm Optimal · 20% Infill · 3 Walls (Fine finish)',
      supports: false,
      parts: []
    };
    const plate3 = {
      id: 3,
      name: 'Plate 3 - Runners, Gears & Mechanisms',
      setting: '0.12mm High Precision · 4 Walls / 50% Infill (High Strength)',
      supports: false,
      parts: []
    };

    parts.forEach(p => {
      const path = p.path || '';
      const hasSupport = path.toLowerCase().includes('supports');

      if (path.includes('Runners') || path.includes('Rails') || path.includes('Latch') || path.includes('Springs') || path.includes('Hinges') || path.includes('Locks')) {
        plate3.parts.push(p);
        if (hasSupport) plate3.supports = true;
      } else if (path.includes('Facades') || path.includes('Roofs') || path.includes('Top Handle') || path.includes('Key')) {
        plate2.parts.push(p);
        if (hasSupport) plate2.supports = true;
      } else {
        plate1.parts.push(p);
        if (hasSupport) plate1.supports = true;
      }
    });

    return [plate1, plate2, plate3].filter(plate => plate.parts.length > 0);
  }

  /**
   * Generate an automated Bambu Studio / OrcaSlicer compatible project bundle
   * @param {Object} options
   * @param {Array<Object>} options.builds Builds from BuildPlan
   * @param {string} options.projectName Project name
   */
  function generateProjectBundle(options = {}) {
    const builds = options.builds || [];
    const projectName = options.projectName || 'VaultForge_Build_Project';

    // Aggregate all parts
    const allParts = [];
    builds.forEach(b => {
      if (root.BuildPlan) {
        const resolved = root.BuildPlan.resolve(b.system, b.configuration);
        resolved.parts.forEach(p => {
          const count = b.count || 1;
          const qty = p.qty === null ? (b.layout?.[p.path] || 1) : p.qty;
          allParts.push({ ...p, qty: qty * count, buildName: b.name || b.system });
        });
      }
    });

    const plates = organizePlates(allParts);
    const zip = new SimpleZip();

    // 1. [Content_Types].xml (3MF OPC specification)
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="txt" ContentType="text/plain"/>
</Types>`;
    zip.add('[Content_Types].xml', contentTypesXml);

    // 2. _rels/.rels
    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
    zip.add('_rels/.rels', relsXml);

    // 3. 3D/3dmodel.model manifest
    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${projectName}</metadata>
  <metadata name="Designer">USSA Design / VaultForge Multi-Plate Slicer Engine</metadata>
  <metadata name="Application">VaultForge Studio</metadata>
  <resources></resources>
  <build></build>
</model>`;
    zip.add('3D/3dmodel.model', modelXml);

    // 4. Slicer multi-plate configurations (OrcaSlicer & Bambu Studio project manifest)
    const projectManifest = {
      project: projectName,
      generatedBy: 'VaultForge Slicer Engine v1.0',
      totalPlates: plates.length,
      plates: plates.map(pl => ({
        plateIndex: pl.id,
        plateName: pl.name,
        recommendedProfile: pl.setting,
        supportsRequired: pl.supports,
        partsCount: pl.parts.reduce((sum, item) => sum + item.qty, 0),
        parts: pl.parts.map(pt => ({
          file: pt.path.split('/').pop(),
          path: pt.path,
          qty: pt.qty,
          needsSupports: pt.path.toLowerCase().includes('supports')
        }))
      }))
    };
    zip.add('Metadata/project_manifest.json', JSON.stringify(projectManifest, null, 2));

    // 5. Printable Slicer README
    const readmeContent = `# ${projectName} - 3D Printing Project Guide
Generated by VaultForge Studio (https://hairuoliu.github.io/VaultForge/)

## Multi-Plate Print Organization:
${plates.map(pl => `
### Plate ${pl.id}: ${pl.name}
- Recommended Setting: ${pl.setting}
- Supports Required: ${pl.supports ? 'YES (Turn on Tree / Slim Supports)' : 'NO (Print flat)'}
- Parts:
${pl.parts.map(pt => `  * [${pt.qty}x] ${pt.path.split('/').pop()} ${pt.path.includes('supports') ? '(Supports ON)' : ''}`).join('\n')}
`).join('\n')}

## Recommended Slicer Setup (Bambu Studio / OrcaSlicer / PrusaSlicer):
1. Infill: 15% gyroid or grid for structural boxes; 40-50% for geared lock rails.
2. Walls / Perimeters: 2 walls for boxes; 4 walls for runners and latches for mechanical longevity.
3. Material: PLA, PETG or ABS/ASA.
`;
    zip.add('PRINT_INSTRUCTIONS.txt', readmeContent);

    return {
      buffer: zip.build(),
      plates,
      totalPlates: plates.length
    };
  }

  /**
   * Helper to download project 3mf/zip in browser
   */
  function exportProject(options = {}) {
    const { buffer } = generateProjectBundle(options);
    const blob = new Blob([buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(options.projectName || 'VaultForge_Build_Project').replace(/[^a-zA-Z0-9_-]/g, '_')}.3mf`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  root.SlicerProject = {
    organizePlates,
    generateProjectBundle,
    exportProject
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.SlicerProject;
  }
})(globalThis);
