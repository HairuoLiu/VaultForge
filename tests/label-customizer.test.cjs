const test = require('node:test');
const assert = require('node:assert/strict');
const LabelCustomizer = require('../assets/label-customizer.js');

test('LabelCustomizer generates valid binary STL buffer with 80-byte header and triangle count', () => {
  const buffer = LabelCustomizer.generateSTL('M4', { preset: 'standard' });

  assert.ok(buffer instanceof ArrayBuffer);
  assert.ok(buffer.byteLength > 84);

  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  assert.ok(triangleCount > 0);

  // Exact binary STL formula: 84 + (triangleCount * 50) === buffer.byteLength
  assert.equal(buffer.byteLength, 84 + triangleCount * 50);
});

test('LabelCustomizer scales triangle count based on text density', () => {
  const emptyPlate = LabelCustomizer.generateSTL('', { preset: 'standard' });
  const viewEmpty = new DataView(emptyPlate);
  const emptyTriangles = viewEmpty.getUint32(80, true);
  // Base plate alone has 12 triangles (6 faces * 2 triangles)
  assert.equal(emptyTriangles, 12);

  const textPlate = LabelCustomizer.generateSTL('RESISTORS', { preset: 'standard' });
  const viewText = new DataView(textPlate);
  const textTriangles = viewText.getUint32(80, true);
  // Text plate must have significantly more triangles due to letter voxels
  assert.ok(textTriangles > emptyTriangles);
});

test('LabelCustomizer handles presets and custom dimensions', () => {
  const compactBuffer = LabelCustomizer.generateSTL('BOX', { preset: 'compact' });
  const wideBuffer = LabelCustomizer.generateSTL('BOX', { preset: 'wide' });

  assert.ok(compactBuffer.byteLength > 0);
  assert.ok(wideBuffer.byteLength > 0);
});
