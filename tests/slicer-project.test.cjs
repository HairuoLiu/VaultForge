const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/sustainers.js');
const plan = require('../assets/build-plan.js');
const SlicerProject = require('../assets/slicer-project.js');

test('SlicerProject correctly classifies drawer parts into 3 logical plates', () => {
  const parts = [
    { path: '01. DRAWERS/01. S Families/S3/Modules/S3 Module 1F.stl', qty: 1 },
    { path: '01. DRAWERS/01. S Families/S3/Boxes/S3 Box 1F.stl', qty: 1 },
    { path: '01. DRAWERS/01. S Families/Facades/S1F (Turn On Supports).stl', qty: 1 },
    { path: '01. DRAWERS/07. Universal/Runners/x3 Runner Guide.stl', qty: 2 },
    { path: '01. DRAWERS/07. Universal/Geared Rails/S Rails.stl', qty: 2 }
  ];

  const plates = SlicerProject.organizePlates(parts);
  assert.equal(plates.length, 3);

  // Plate 1: Module & Box
  assert.equal(plates[0].id, 1);
  assert.ok(plates[0].parts.some(p => p.path.includes('Module')));
  assert.ok(plates[0].parts.some(p => p.path.includes('Box')));

  // Plate 2: Facade (with supports)
  assert.equal(plates[1].id, 2);
  assert.ok(plates[1].parts.some(p => p.path.includes('Facade')));
  assert.equal(plates[1].supports, true);

  // Plate 3: Runners and Geared Rails
  assert.equal(plates[2].id, 3);
  assert.ok(plates[2].parts.some(p => p.path.includes('Runner')));
  assert.ok(plates[2].parts.some(p => p.path.includes('Rails')));
});

test('SlicerProject compiles valid OPC 3MF/ZIP archive buffer with XML manifests', () => {
  const entry = plan.entry({
    id: 'test-3mf',
    name: 'Tool Drawer S3',
    system: 'drawers',
    configuration: { width: 'S', depth: '3', height: '1F', key: 'standard', drawerRoof: 'grid', topHandle: true, gearedRails: true },
    count: 1
  });

  const result = SlicerProject.generateProjectBundle({
    builds: [entry],
    projectName: 'Test_Drawer_Project'
  });

  assert.ok(result.buffer instanceof ArrayBuffer);
  assert.ok(result.buffer.byteLength > 200);

  // Verify ZIP PK signature at index 0 (0x04034b50)
  const view = new DataView(result.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.ok(result.totalPlates > 0);
});
