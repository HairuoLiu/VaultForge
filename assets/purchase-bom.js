(function (root) {
  'use strict';

  // Hardware dictionary mapping size/role to bilingual metadata, English order names, head types, and buying advice
  const hardwareDictionary = {
    'M4 × 14 mm': {
      enName: 'M4 Flat Head Socket Cap Screws (Countersunk, 14mm)',
      zhName: 'M4 × 14mm 内六角沉头螺钉',
      head: { zh: '平头 / 沉头（Countersunk / Flat Head），内六角', en: 'Countersunk / Flat Head, Hex Socket Drive' },
      role: { zh: '抽屉前面板固定（需平头与面板平齐）/ 工具箱合页顶盖与前锁扣', en: 'Drawer Facade mounting / Sustainer Lid Hinges & Latches' },
      packAdvice: { zh: '建议购买 50 颗装，或购买 M4 内六角螺钉盒装套件（Assortment Kit）', en: 'Recommend 50-pack or M4 Metric Socket Cap Assortment Kit' }
    },
    'M4 × 10 mm': {
      enName: 'M4 Button / Socket Head Cap Screws (10mm)',
      zhName: 'M4 × 10mm 内六角圆头/杯头螺钉',
      head: { zh: '半圆头或杯头（Button or Socket Head），内六角', en: 'Button or Socket Head, Hex Drive' },
      role: { zh: '工具箱（Sustainer）底部合页铰链固定（每个箱 8 颗）', en: 'Sustainer Body Hinges (8 pcs per case)' },
      packAdvice: { zh: '建议购买 20~50 颗装，或直接使用 M4 螺丝组合盒', en: 'Recommend 20~50 pack or M4 Assortment Kit' }
    },
    'M4 × 20 mm': {
      enName: 'M4 Button / Socket Head Cap Screws (20mm)',
      zhName: 'M4 × 20mm 内六角圆头/杯头螺钉',
      head: { zh: '半圆头或杯头（Button or Socket Head），内六角', en: 'Button or Socket Head, Hex Drive' },
      role: { zh: '工具箱前面板固定到箱体结构（每个箱 7 颗）', en: 'Sustainer Facade to Body attachment (7 pcs per case)' },
      packAdvice: { zh: '建议购买 20~50 颗装，或直接使用 M4 螺丝组合盒', en: 'Recommend 20~50 pack or M4 Assortment Kit' }
    },
    'M6 × 50 mm': {
      enName: 'M6 Socket Head Cap Screws (50mm)',
      zhName: 'M6 × 50mm 内六角杯头螺栓',
      head: { zh: '圆柱头 / 杯头（Socket Head Cap），内六角', en: 'Socket Head Cap, Hex Drive' },
      role: { zh: '网格顶盖提手（Grid Roof Top Handle）固定（每个提手 2 颗）', en: 'Grid Roof Top Handle mounting (2 pcs per handle)' },
      packAdvice: { zh: '建议购买 10 颗装', en: 'Recommend 10-pack' }
    },
    'M4 × 25 mm': {
      enName: 'M4 Socket Head Cap Screws (25mm)',
      zhName: 'M4 × 25mm 内六角杯头螺栓',
      head: { zh: '杯头（Socket Head），内六角', en: 'Socket Head, Hex Drive' },
      role: { zh: '移动底盘车轮轮毂外盖封闭固定（每个轮子 6 颗，共 12 颗）', en: 'Mobile Base Wheel Covers (6 pcs per wheel, 12 total)' },
      packAdvice: { zh: '建议购买 20 颗装或使用 M4 组合盒', en: 'Recommend 20-pack or M4 Assortment Kit' }
    },
    'M6 × 30 mm': {
      enName: 'M6 Flat Head Countersunk Screws (30mm)',
      zhName: 'M6 × 30mm 沉头/平头螺钉',
      head: { zh: '沉头 / 平头（Countersunk / Flat Head），内六角', en: 'Countersunk / Flat Head, Hex Drive' },
      role: { zh: '伸缩拉杆顶部手柄固定到两根光轴（共 4 颗）', en: 'Pull-out Handle top attachment to rods (4 pcs)' },
      packAdvice: { zh: '建议购买 10 颗装', en: 'Recommend 10-pack' }
    },
    'M6 × 35 mm': {
      enName: 'M6 Hex Head Bolts (35mm)',
      zhName: 'M6 × 35mm 外六角螺栓',
      head: { zh: '外六角头（Hexagon Head Bolt）', en: 'Hex Head' },
      role: { zh: '伸缩拉杆背骨锁紧旋钮机构（共 2 颗，请勿选 M4）', en: 'Pull-out Handle locking knob mechanism (2 pcs, do not use M4)' },
      packAdvice: { zh: '建议购买 5~10 颗装', en: 'Recommend 5~10 pack' }
    },
    'M6 × 90 mm': {
      enName: 'M6 Hex / Socket Head Bolts (90mm)',
      zhName: 'M6 × 90mm 加长螺栓',
      head: { zh: '外六角或杯头（Hex or Socket Head）', en: 'Hex or Socket Head' },
      role: { zh: '移动底盘前端支撑脚固定（每个支撑脚 2 颗）', en: 'Mobile Base front support foot (2 pcs per foot)' },
      packAdvice: { zh: '本地工业五金店（如 Brafasco）散买 2 颗最划算', en: 'Recommend buying individual pieces from local supplier (e.g. Brafasco)' }
    },
    'M4 × 60 mm': {
      enName: 'M4 Socket Head Cap Screws (60mm)',
      zhName: 'M4 × 60mm 加长内六角螺栓',
      head: { zh: '杯头（Socket Head），内六角', en: 'Socket Head, Hex Drive' },
      role: { zh: '固定把手（Static Handle）安装（每个把手 8 颗）', en: 'Stationary Handle mounting (8 pcs per handle)' },
      packAdvice: { zh: '建议购买 10 颗装', en: 'Recommend 10-pack' }
    },
    'M4 × 40 mm': {
      enName: 'M4 Socket Head Cap Screws (40mm)',
      zhName: 'M4 × 40mm 内六角螺栓',
      head: { zh: '杯头（Socket Head），内六角', en: 'Socket Head, Hex Drive' },
      role: { zh: '背部外挂洞洞板连接（每块洞洞板 4 颗）', en: 'Pegboard attachment to backbone (4 pcs per board)' },
      packAdvice: { zh: '建议购买 10 颗装', en: 'Recommend 10-pack' }
    }
  };

  // Optional cart & modification hardware list for quick reference
  const cartHardwareList = [
    {
      spec: '6205ZZ (25 × 52 × 15 mm)',
      enName: '6205ZZ Deep Groove Ball Bearing (or 6205-2RS)',
      zhName: '6205ZZ 深沟球轴承（内径25mm × 外径52mm × 厚15mm）',
      qty: '2 个 / pcs',
      role: { zh: '推车大车轮转动轴承', en: 'Mobile cart main wheel bearing' },
      advice: { zh: 'Amazon / AliExpress 买 2 个装（约 $5~$14 CAD）', en: 'Buy 2-pack on Amazon or AliExpress (~$5-$14 CAD)' }
    },
    {
      spec: 'SCSAW 16mm (16 × 30/35 × 10 mm)',
      enName: '16mm Bore Single Split Clamping Shaft Collar',
      zhName: '16mm 单缝抱紧式光轴固定环 / 止动挡圈',
      qty: '2 个 / pcs',
      role: { zh: '轮轴防脱与轴承限位', en: 'Axle shaft bearing retainer collar' },
      advice: { zh: 'AliExpress / Amazon 买 16mm 抱紧环一对', en: 'Buy 16mm clamping collar 2-pack' }
    },
    {
      spec: 'M16 × 248~504 mm (Rod)',
      enName: '16mm Linear Motion Shaft / Round Rod (Solid Steel)',
      zhName: '16mm 镀铬金属实心光轴（底座轮轴）',
      qty: '1 根 / pc',
      role: { zh: '底盘主轮轴（S:248mm, M:338mm, L:414mm, XL:504mm）', en: 'Mobile base main wheel axle rod' },
      advice: { zh: '可买 1000mm（1米）光轴按底座宽度自行截断', en: 'Buy 1000mm linear shaft and cut to width' }
    },
    {
      spec: 'M16 Rod (Pull-out Handle)',
      enName: '16mm Linear Motion Shaft / Round Rod (Pull-out)',
      zhName: '16mm 金属光轴（伸缩拉杆）',
      qty: '2 根 / pcs',
      role: { zh: '伸缩拉杆立柱，高度按柜塔自定，顶端攻 M6 螺纹', en: 'Pull-out handle rods, height custom, top tapped M6' },
      advice: { zh: '按推车总高度截断', en: 'Cut to length matching tower height' }
    },
    {
      spec: 'M6 × 8 × 8 mm',
      enName: 'M6 x 8 x 8mm Brass Threaded Heat Set Inserts',
      zhName: 'M6 × 8 × 8mm 铜滚花热熔预埋螺母',
      qty: '2 个 / pcs',
      role: { zh: '拉杆锁紧旋钮（Knob）内部热熔预埋', en: 'Heat-set into pull-out handle lock knobs' },
      advice: { zh: '买 20 或 50 个装，电烙铁热熔压入', en: 'Buy 20-50 pack, press in with soldering iron' }
    },
    {
      spec: 'M8 Casters (Optional)',
      enName: 'M8 Threaded Stem Swivel/Locking Casters (4-Pack)',
      zhName: 'M8 丝杆万向带刹车静音脚轮（4 只装）',
      qty: '4 只 / pcs',
      role: { zh: '底盘万向脚轮备选方案（替代大轮子方案）', en: 'Alternative caster base option instead of big wheels' },
      advice: { zh: '若选择万向轮底盘，需要 4 只 M8 螺纹脚轮', en: 'Choose 4 M8 swivel casters if using caster base' }
    }
  ];

  function getHardwareInfo(size) {
    if (hardwareDictionary[size]) return hardwareDictionary[size];
    // Prefix match
    for (const key of Object.keys(hardwareDictionary)) {
      if (size.startsWith(key) || key.startsWith(size)) return hardwareDictionary[key];
    }
    return {
      enName: size + ' Fastener',
      zhName: size + ' 紧固件',
      head: { zh: '标准紧固件', en: 'Standard Fastener' },
      role: { zh: '组装连接', en: 'Assembly' },
      packAdvice: { zh: '按需采购', en: 'Order as needed' }
    };
  }

  function generateHTML(options) {
    const isZh = options.language === 'zh';
    const builds = options.builds || [];
    const summary = options.summary || root.BuildPlan.summarize(builds);
    const dateStr = new Date().toLocaleString(isZh ? 'zh-CN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const buildsRows = builds.map((b, i) => {
      const cfg = b.configuration || {};
      const sysName = b.system === 'drawers' ? (isZh ? '抽屉柜 (Drawers)' : 'Drawers') : (isZh ? '手提箱 (Sustainers)' : 'Sustainers');
      const desc = `${sysName} | ${cfg.width}${cfg.depth} - ${cfg.height || '1F'} | ${isZh ? '数量' : 'Qty'}: ${b.count}`;
      return `<tr>
        <td style="font-weight:600;">#${i + 1}</td>
        <td>${escapeHtml(b.name || (isZh ? '未命名模块' : 'Unnamed Module'))}</td>
        <td>${escapeHtml(desc)}</td>
        <td style="text-align:center;">${b.count} ${isZh ? '个模块' : 'module(s)'}</td>
      </tr>`;
    }).join('');

    const hardwareRows = summary.hardware.map((item, index) => {
      const info = getHardwareInfo(item.size);
      const enName = info.enName;
      const head = isZh ? info.head.zh : info.head.en;
      const role = isZh ? info.role.zh : info.role.en;
      const advice = isZh ? info.advice?.zh || info.packAdvice.zh : info.advice?.en || info.packAdvice.en;

      return `<tr>
        <td style="text-align:center;"><span class="checkbox-box"></span></td>
        <td style="font-weight:700; color:#182218; font-size:13px;">${escapeHtml(item.size)}</td>
        <td style="font-weight:600; font-family:monospace; color:#0e5a32; font-size:12px;">${escapeHtml(enName)}</td>
        <td style="text-align:center; font-weight:700; font-size:14px; color:#c2410c;">${item.qty}</td>
        <td style="font-size:11px; color:#444;">${escapeHtml(head)}</td>
        <td style="font-size:11px; color:#333;">${escapeHtml(role)}</td>
        <td style="font-size:11px; color:#555;">${escapeHtml(advice)}</td>
      </tr>`;
    }).join('');

    const cartRows = cartHardwareList.map(item => {
      return `<tr>
        <td style="text-align:center;"><span class="checkbox-box"></span></td>
        <td style="font-weight:600; font-size:12px;">${escapeHtml(item.spec)}</td>
        <td style="font-weight:500; font-family:monospace; color:#0e5a32; font-size:11px;">${escapeHtml(item.enName)}</td>
        <td style="text-align:center; font-weight:600; font-size:12px;">${escapeHtml(item.qty)}</td>
        <td style="font-size:11px; color:#333;" colspan="2">${escapeHtml(isZh ? item.role.zh : item.role.en)}</td>
        <td style="font-size:11px; color:#555;">${escapeHtml(isZh ? item.advice.zh : item.advice.en)}</td>
      </tr>`;
    }).join('');

    const titleText = isZh ? 'VaultForge 模块化收纳 — 零件采购与备料清单' : 'VaultForge Modular Storage — Hardware Purchase BOM';
    const subTitle = isZh ? '由 VaultForge 3D 模块化收纳工坊自动生成' : 'Generated by VaultForge Studio Configurator';

    return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(titleText)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 15mm 14mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #1a221a;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #1e2920;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    .no-print-bar .title { font-size: 14px; font-weight: 600; }
    .no-print-bar .buttons { display: flex; gap: 10px; }
    .btn {
      cursor: pointer;
      border: 0;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-print { background: #22c55e; color: #fff; }
    .btn-print:hover { background: #16a34a; }
    .btn-close { background: #374151; color: #e5e7eb; }
    .btn-close:hover { background: #4b5563; }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0; }
    }
    .page-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 28px;
    }
    .header {
      border-bottom: 2px solid #233425;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #18261a;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      margin: 4px 0 0;
      font-size: 11px;
      color: #616e62;
    }
    .meta-block {
      text-align: right;
      font-size: 11px;
      color: #616e62;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1c2b1e;
      border-left: 4px solid #2e7d32;
      padding-left: 8px;
      margin: 18px 0 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-badge {
      font-size: 10px;
      font-weight: normal;
      background: #edf2ea;
      color: #2e5932;
      padding: 2px 8px;
      border-radius: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #d4ded3;
      padding: 6px 8px;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: #f1f5ee;
      font-weight: 600;
      color: #243525;
      font-size: 11px;
    }
    tr:nth-child(even) td {
      background: #fafbfa;
    }
    .checkbox-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #6b7280;
      border-radius: 2px;
    }
    .tip-box {
      background: #f7f9f5;
      border: 1px solid #d8e2d6;
      border-radius: 5px;
      padding: 10px 14px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .tip-title {
      font-weight: 700;
      font-size: 12px;
      color: #22542a;
      margin-bottom: 4px;
    }
    .tip-list {
      margin: 0;
      padding-left: 18px;
      font-size: 11px;
      color: #445044;
      line-height: 1.7;
    }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e1e7e0;
      font-size: 10px;
      color: #839082;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div class="title">📄 ${escapeHtml(titleText)}</div>
    <div class="buttons">
      <button class="btn btn-print" onclick="window.print()">🖨️ ${isZh ? '打印 / 保存为 PDF' : 'Print / Save as PDF'}</button>
      <button class="btn btn-close" onclick="window.close()">${isZh ? '关闭窗口' : 'Close'}</button>
    </div>
  </div>

  <div class="page-container">
    <div class="header">
      <div>
        <h1 class="brand-title">${escapeHtml(titleText)}</h1>
        <p class="brand-sub">${escapeHtml(subTitle)}</p>
      </div>
      <div class="meta-block">
        <div><strong>${isZh ? '导出时间' : 'Exported'}:</strong> ${dateStr}</div>
        <div><strong>${isZh ? '包含模块总数' : 'Total Modules'}:</strong> ${builds.reduce((sum, b) => sum + (b.count || 1), 0)}</div>
      </div>
    </div>

    <!-- 1. 当前配置的产品方案 -->
    <div class="section-title">
      <span>${isZh ? '一、 本次制作的产品模块清单' : '1. Configured Storage Builds'}</span>
      <span class="section-badge">${builds.length} ${isZh ? '个批次' : 'build batches'}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th style="width:160px;">${isZh ? '批次名称' : 'Build Name'}</th>
          <th>${isZh ? '规格参数与配置' : 'Configuration Details'}</th>
          <th style="width:90px; text-align:center;">${isZh ? '制作数量' : 'Modules'}</th>
        </tr>
      </thead>
      <tbody>
        ${buildsRows || `<tr><td colspan="4" style="text-align:center; color:#888;">${isZh ? '暂无保存批次' : 'No saved builds'}</td></tr>`}
      </tbody>
    </table>

    <!-- 2. 核心五金螺丝清单 -->
    <div class="section-title">
      <span>${isZh ? '二、 核心紧固件与螺栓采购清单 (必需品)' : '2. Required Hardware & Fasteners (Must Buy)'}</span>
      <span class="section-badge">${summary.hardware.length} ${isZh ? '种规格' : 'specifications'}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:30px; text-align:center;">${isZh ? '勾选' : 'Done'}</th>
          <th style="width:95px;">${isZh ? '螺丝规格' : 'Size'}</th>
          <th style="width:230px;">${isZh ? '英文搜索品名 (直接复制采购)' : 'English Product Name for Ordering'}</th>
          <th style="width:60px; text-align:center;">${isZh ? '净需量' : 'Needed'}</th>
          <th style="width:110px;">${isZh ? '头型/驱动' : 'Head/Drive'}</th>
          <th>${isZh ? '安装部位及用途' : 'Application'}</th>
          <th style="width:140px;">${isZh ? '采购包装建议' : 'Buying Advice'}</th>
        </tr>
      </thead>
      <tbody>
        ${hardwareRows || `<tr><td colspan="7" style="text-align:center; color:#888;">${isZh ? '当前方案无需金属螺栓' : 'No fasteners required for this build'}</td></tr>`}
      </tbody>
    </table>

    <!-- 3. 选配移动推车 / 车轮 / 拉杆五金速查 -->
    <div class="section-title">
      <span>${isZh ? '三、 移动推车底盘 / 轮组 / 拉杆选配五金 (若做推车塔架)' : '3. Optional Mobile Cart & Extension Hardware'}</span>
      <span class="section-badge">${isZh ? '选配件' : 'Optional Kit'}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:30px; text-align:center;">${isZh ? '勾选' : 'Done'}</th>
          <th style="width:130px;">${isZh ? '配件规格' : 'Spec'}</th>
          <th style="width:230px;">${isZh ? '英文品名 (English Name)' : 'English Name'}</th>
          <th style="width:70px; text-align:center;">${isZh ? '推荐量' : 'Qty'}</th>
          <th colspan="2">${isZh ? '用途说明' : 'Application'}</th>
          <th style="width:140px;">${isZh ? '选购建议' : 'Buying Advice'}</th>
        </tr>
      </thead>
      <tbody>
        ${cartRows}
      </tbody>
    </table>

    <!-- 4. 采购贴士 -->
    <div class="tip-box">
      <div class="tip-title">💡 ${isZh ? '采购指南与避坑贴士 (Shopping & Sourcing Tips)' : 'Shopping & Sourcing Tips'}</div>
      <ul class="tip-list">
        <li><strong>${isZh ? '沉头要求' : 'Countersunk Head'}:</strong> ${isZh ? 'M4 × 14mm 螺丝必须是<b>平头/沉头（Countersunk）</b>，拧紧后螺丝头须与面板平齐，否则会阻碍抽屉推拉。' : 'M4 x 14mm must be flat/countersunk head so it sits flush with the front facade.'}</li>
        <li><strong>${isZh ? '拉杆螺栓勘误' : 'Hex Bolt Size'}:</strong> ${isZh ? '伸缩拉杆锁紧旋钮使用的是 M6 热熔螺母，因此配套外六角螺栓必须为 <b>M6 × 35mm</b>，切勿误买成 M4。' : 'The pull-out handle lock uses M6 heat-set inserts, so the bolt must be M6 x 35mm Hex head.'}</li>
        <li><strong>${isZh ? '最省钱渠道' : 'Best Price Channels'}:</strong> ${isZh ? '在 AliExpress 或 Amazon.ca 直接搜 <b>"M4 Socket Cap Screws Assortment Kit"</b>（M4 螺丝组合盒），一盒约 $15~$20 CAD，包含所有常用长度，比单包购买便宜很多。' : 'Buy an M4 Socket Head Assortment Kit on AliExpress or Amazon.ca (~$15-$20 CAD) for best value.'}</li>
        <li><strong>${isZh ? '加拿大本地散买' : 'Local Fasteners (GTA)'}:</strong> ${isZh ? '加长螺栓（如 M6 × 90mm）建议直接去多伦多本地 <b>Brafasco</b> 工业五金柜台零买，单颗几毛钱，无需网购大包装。' : 'For long bolts like M6 x 90mm, visit local Brafasco counters to buy loose pieces.'}</li>
      </ul>
    </div>

    <div class="footer">
      <span>VaultForge · Printable Hardware Purchase BOM</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;
  }

  function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function exportPDF(options) {
    const html = generateHTML(options);
    const win = root.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      // Allow CSS styles to apply before auto triggering print
      setTimeout(() => {
        try {
          win.print();
        } catch (e) {
          console.warn('Auto print trigger failed, user can click print button:', e);
        }
      }, 350);
    } else {
      // Fallback: If popup was blocked, create a downloadable HTML file
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vault-purchase-bom.html';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      alert(options.language === 'zh' ? '弹窗被浏览器拦截，已为您下载网页版采购单文件。请在浏览器中打开并按 Ctrl+P 打印为 PDF。' : 'Popup blocked. Downloaded HTML purchase BOM. Open in browser and press Ctrl+P to save as PDF.');
    }
  }

  root.PurchaseBOM = { generateHTML, exportPDF, hardwareDictionary, cartHardwareList };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PurchaseBOM;
})(globalThis);
