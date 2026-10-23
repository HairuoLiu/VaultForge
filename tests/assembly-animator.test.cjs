const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/sustainers.js');
require('../assets/build-plan.js');
const AssemblyAnimator = require('../assets/assembly-animator.js');

test('AssemblyAnimator returns zero offset at progress 0 (fully assembled)', () => {
  const offsetFacade = AssemblyAnimator.getOffset('facade', 0);
  const offsetBox = AssemblyAnimator.getOffset('box', 0);
  const offsetRoof = AssemblyAnimator.getOffset('roof', 0);

  assert.deepEqual(offsetFacade, [0, 0, 0]);
  assert.deepEqual(offsetBox, [0, 0, 0]);
  assert.deepEqual(offsetRoof, [0, 0, 0]);
});

test('AssemblyAnimator computes directional explosion offsets along proper axes at progress 1', () => {
  const dist = 100;
  // Facade moves forward along +Z
  const facade = AssemblyAnimator.getOffset('facade', 1, dist);
  assert.equal(facade[0], 0);
  assert.equal(facade[1], 0);
  assert.ok(facade[2] > 0);

  // Box moves forward along +Z but less than facade
  const box = AssemblyAnimator.getOffset('box', 1, dist);
  assert.ok(facade[2] > box[2]);

  // Roof moves upward along +Y
  const roof = AssemblyAnimator.getOffset('roof', 1, dist);
  assert.equal(roof[0], 0);
  assert.ok(roof[1] > 0);
  assert.equal(roof[2], 0);

  // Top handle moves upward even higher than roof
  const handle = AssemblyAnimator.getOffset('topHandle', 1, dist);
  assert.ok(handle[1] > roof[1]);
});

test('AssemblyAnimator generates complete exploded layout for a drawer build', () => {
  const layout = AssemblyAnimator.computeExplodedLayout('drawers', {
    width: 'S',
    depth: '3',
    height: '1F',
    key: 'standard',
    drawerRoof: 'grid',
    topHandle: true,
    gearedRails: true
  }, 0.5, 80);

  assert.ok(layout.length > 5);
  // Contains both parts and hardware fasteners
  assert.ok(layout.some(item => item.role === 'facade'));
  assert.ok(layout.some(item => item.role === 'topHandle'));
  assert.ok(layout.some(item => item.isHardware === true));
});
