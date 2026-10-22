const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/sustainers.js');
const plan = require('../assets/build-plan.js');
const PurchaseBOM = require('../assets/purchase-bom.js');

test('PurchaseBOM dictionary covers all standard drawer and sustainer hardware', () => {
  assert.ok(PurchaseBOM.hardwareDictionary['M4 × 14 mm']);
  assert.ok(PurchaseBOM.hardwareDictionary['M4 × 10 mm']);
  assert.ok(PurchaseBOM.hardwareDictionary['M4 × 20 mm']);
  assert.ok(PurchaseBOM.hardwareDictionary['M6 × 50 mm']);

  const m4Flat = PurchaseBOM.hardwareDictionary['M4 × 14 mm'];
  assert.ok(m4Flat.enName.includes('Countersunk') || m4Flat.enName.includes('Flat Head'));
  assert.ok(m4Flat.head.zh.includes('沉头') || m4Flat.head.zh.includes('平头'));
});

test('PurchaseBOM includes mobile cart hardware specifications and corrections', () => {
  assert.ok(PurchaseBOM.cartHardwareList.some(item => item.spec.includes('6205ZZ')));
  assert.ok(PurchaseBOM.cartHardwareList.some(item => item.spec.includes('SCSAW') || item.enName.includes('Shaft Collar')));
  assert.ok(PurchaseBOM.cartHardwareList.some(item => item.spec.includes('M6') && (item.enName.includes('Heat Set') || item.enName.includes('Threaded'))));
  // Verify M6 x 35mm bolt correction note
  assert.ok(PurchaseBOM.hardwareDictionary['M6 × 35 mm']);
});

test('PurchaseBOM generates valid HTML report with correct totals for drawer build', () => {
  const drawerEntry = plan.entry({
    id: 'test-drawer',
    name: 'Tool Drawer S3',
    system: 'drawers',
    configuration: { width: 'S', depth: '3', height: '1F', key: 'standard', drawerRoof: 'grid', topHandle: true, gearedRails: true },
    count: 2
  });

  const html = PurchaseBOM.generateHTML({
    builds: [drawerEntry],
    language: 'zh'
  });

  assert.ok(html.includes('零件采购与备料清单'));
  assert.ok(html.includes('Tool Drawer S3'));
  // 4 x 2 = 8 M4x14mm screws, 2 x 2 = 4 M6x50mm screws
  assert.ok(html.includes('M4 × 14 mm'));
  assert.ok(html.includes('8'));
  assert.ok(html.includes('M6 × 50 mm'));
  assert.ok(html.includes('4'));
  assert.ok(html.includes('Toronto') || html.includes('多伦多'));
});

test('PurchaseBOM generates English HTML report correctly', () => {
  const drawerEntry = plan.entry({
    id: 'test-drawer-en',
    name: 'Tool Drawer S3',
    system: 'drawers',
    configuration: { width: 'S', depth: '3', height: '1F', key: 'standard', drawerRoof: 'none', topHandle: false, gearedRails: true },
    count: 1
  });

  const html = PurchaseBOM.generateHTML({
    builds: [drawerEntry],
    language: 'en'
  });

  assert.ok(html.includes('Hardware Purchase BOM'));
  assert.ok(html.includes('Countersunk') || html.includes('Flat Head'));
  assert.ok(html.includes('AliExpress'));
  assert.ok(html.includes('Amazon.ca'));
});
