(function (root) {
  'use strict';
  const categories = {
    base: { folder: 'Base', en: 'Bases', zh: '底座', manual: '04', page: 2 },
    backbone: { folder: 'Backbone', en: 'Backbones & locks', zh: '背部连接件与锁定件', manual: '04', page: 7 },
    wheels: { folder: 'Wheels', en: 'Wheels', zh: '轮组', manual: '04', page: 3 },
    feet: { folder: 'Feet', en: 'Feet', zh: '支脚', manual: '04', page: 6 },
    pullHandle: { folder: 'Pull-out Handle', en: 'Pull-out handles', zh: '伸缩提手', manual: '04', page: 14 },
    stationaryHandle: { folder: 'Stationary Handle', en: 'Stationary handles', zh: '固定提手', manual: '04', page: 12 },
    pegboard: { folder: 'Pegboard Attachment', en: 'Pegboard attachments', zh: '洞洞板连接件', manual: '04', page: 15 },
    wall: { folder: 'Wall Mounts', en: 'Wall mounts', zh: '壁挂件', manual: '05', page: 1 }
  };
  const parts = root.ModificationFiles.map(path => {
    const folders = path.split('/');
    const name = folders[folders.length - 1];
    const category = Object.keys(categories).find(key => categories[key].folder === folders[1]);
    if (!category) throw new Error('Unclassified modification: ' + path);
    const width = name.match(/^(XL|S|M|L)(?=\d| )/)?.[1] || null;
    const depth = category === 'base' ? name.match(/^(?:XL|S|M|L)([3-7]) /)?.[1] || null : null;
    const height = name.match(/^(?:XL|S|M|L)([124]F)(?: |\.)/)?.[1] || name.match(/(?:Universal|Modules) ([12]F)/)?.[1] || null;
    let role = category;
    if (category === 'base') role = name.includes('Connector') ? 'baseConnector' : name.includes('Part') ? 'baseSplit' : name.includes('Whole') ? 'baseWhole' : 'base';
    if (category === 'backbone') role = name.includes('Knob') ? 'knob' : name.includes('Part 2') ? 'lockPart' : name.includes('Handle Lock') ? 'handleLock' : name.includes('Connector') ? 'moduleConnector' : 'backbone';
    if (category === 'wheels') role = { 'Bushing.stl': 'bushing', 'Cover.stl': 'wheelCover', 'Disk.stl': 'wheelDisk', 'Jig.stl': 'wheelJig', 'Tyre (TPU).stl': 'tyre' }[name];
    if (category === 'pegboard') role = folders[2] === 'IKEA Skadis Pegboard' ? 'pegIkea' : 'pegUssa';
    if (category === 'wall' && name.includes('Second Part')) role = 'wallSecond';
    if (!role) throw new Error('Unclassified modification role: ' + path);
    return { path, name, category, width, depth, height, role };
  });
  function filter(selection = {}) {
    return parts.filter(part => (!selection.category || selection.category === 'all' || part.category === selection.category)
      && ['width', 'depth', 'height'].every(key => !selection[key] || selection[key] === 'all' || !part[key] || part[key] === selection[key]));
  }
  const text = {
    en: {
      intro: 'Explore the optional parts in this archive. Filter by category and size, preview the geometry, then follow the matching assembly guide.',
      category: 'Modification type', width: 'Width family', depth: 'Depth · Gridfinity units', height: 'Height', all: 'All', unmarked: 'Not size-specific',
      count: count => `${count} STL files`, files: 'Matching components',
      note: 'These are component files, not an assembly shopping list. Unmarked and shared parts remain visible with size filters; confirm compatibility and print quantities in the guide. Whole and split versions are alternatives.',
      source: 'Assembly reference', hardware: 'Hardware overview · Manual 01, page 3', naming: 'Component diagram · Manual 01, page 13',
      manual: 'Open modifications guide ↗', mountManual: 'Mounting instructions ↗', empty: 'No matching component files.',
      hint: 'Click a filename to save a copy, or use 3D preview to inspect it here. The relative path locates the original file in your Vault.',
      categoryNotes: {
        base: 'Match the base width and depth. For depths 6/7, choose the whole base or both split halves; check the connector in the assembly. Caster installation is shown on page 17 of manual 04.',
        backbone: 'The guide shows both family-specific and universal backbones. XL-specific backbones are supplied in 1F only. For the illustrated mobile tower, the manual recommends 2F modules above the base and below the roof; check the drilling sequence.',
        wheels: 'The original guide recommends TPU for tyres. The jig helps position the bushings during assembly; it is removed afterwards. Bearings, rods, retaining collars and bolts are separate hardware.',
        feet: 'Select the foot by width and check the attachment to the base in the assembly guide.',
        pullHandle: 'Select the handle by width. The assembly also uses rods, backbone locking parts and hardware; this handle STL is one part of that assembly.',
        stationaryHandle: 'The manual places the fixed handle behind the backbone before the backbone is attached to the module.',
        pegboard: 'IKEA Skådis and USSA use separate attachment files. Match the board system, width and supported height; XL files are supplied in 1F only.',
        wall: 'Use the size-specific mount with the second mounting part shown in the guide. XL files are supplied in 1F only. Check the mounting arrangement and fasteners before installation.'
      },
      roles: {
        base: ['Base', 'Base for the selected width and depth.'], baseWhole: ['One-piece base', 'Alternative to the two split-base parts of the same size.'], baseSplit: ['Split-base half', 'Use both Part 1 and Part 2 of the same size; do not also print the whole base.'], baseConnector: ['Base connector', 'Connection piece for the base assembly; check its placement in the guide.'],
        backbone: ['Backbone', 'Rear reinforcing and connecting part. Match the labelled family and height, or check the universal arrangement in the guide.'], moduleConnector: ['Module connector', 'Connects modules in the backbone assembly; select the labelled height.'], handleLock: ['Pull-out handle lock', 'Locks the pull-out handle assembly at the backbone; match its width or the illustrated universal layout.'], lockPart: ['S handle lock · Part 2', 'Additional part supplied for the S pull-out handle lock.'], knob: ['Handle lock knob part', 'Part 1 and Part 2 form the locking knob assembly; follow the heat-insert sequence.'],
        feet: ['Support foot', 'Foot for the matching width family.'], pullHandle: ['Pull-out handle', 'Handle for the matching rod-and-lock assembly.'], stationaryHandle: ['Stationary handle', 'Fixed carrying handle attached behind the backbone.'],
        pegIkea: ['IKEA Skådis attachment', 'Attachment for an IKEA Skådis board; select the matching size.'], pegUssa: ['USSA pegboard attachment', 'Attachment for a USSA board; select the matching size.'], wall: ['Size-specific wall mount', 'Mount matched to the width and height shown in the filename.'], wallSecond: ['Wall mount · Second part', 'Companion mounting part; check the installation sequence in manual 05.'],
        bushing: ['Wheel bushing', 'Fits on the axle rod; use the jig to set its position.'], wheelCover: ['Wheel cover', 'Closes the assembled wheel; the original guide specifies six M4 × 25 mm bolts per wheel.'], wheelDisk: ['Wheel disk', 'Fits over the bushing and supports the tyre.'], wheelJig: ['Bushing installation jig', 'Assembly aid for positioning the bushing; remove it after use.'], tyre: ['Tyre · TPU', 'Flexible tyre fitted over the wheel disk; the original guide recommends TPU.']
      }
    },
    zh: {
      intro: '按类别和尺寸查找文件包中的选配件，预览模型，再查看对应的改造与安装说明。',
      category: '改造件类别', width: '宽度规格', depth: '深度 · Gridfinity 单元', height: '层高', all: '全部', unmarked: '未限定规格',
      count: count => `${count} 个 STL 文件`, files: '匹配的改造组件',
      note: '这里展示组件文件，不代表整套组装的备料清单。筛选时保留通用和未标注尺寸的配件，兼容方式与打印数量请核对说明书；整块与分体版本为替代方案。',
      source: '组装参考', hardware: '五金总表 · 01 使用说明书第 3 页', naming: '组件结构图 · 01 使用说明书第 13 页',
      manual: '查看选配改造说明 ↗', mountManual: '查看安装说明 ↗', empty: '没有匹配的组件文件。',
      hint: '点击文件名保存副本，点击「3D 预览」查看模型；相对路径标明原文件在 Vault 中的位置。',
      categoryNotes: {
        base: '底座需匹配宽度与深度。6 / 7 深度可选整块底座或两片分体底座，连接件按组装图使用；脚轮安装参考 04 号说明书第 17 页。',
        backbone: '原版同时展示专用与通用背部连接件。XL 专用背板仅提供 1F。针对图示移动塔架，说明书建议底座上方、顶盖下方使用 2F 模块，并按步骤定位、钻孔。',
        wheels: '原版建议轮胎使用 TPU。定位工具用于安装轴套，定位后取出；轴承、轴杆、止动环和螺丝需另外备料。',
        feet: '按宽度选择支脚，并参考组装图核对与底座的连接位置。',
        pullHandle: '按宽度选择伸缩提手；完整机构还需轴杆、背部锁定件和五金，提手 STL 只是其中一个组件。',
        stationaryHandle: '原版要求先从背板另一侧装上固定提手，再把背板安装到模块上。',
        pegboard: 'IKEA Skådis 与 USSA 洞洞板使用不同连接件，需同时匹配板型、宽度和层高；XL 文件仅提供 1F。',
        wall: '按图配合专用壁挂件与第二安装件使用；XL 文件仅提供 1F。安装前核对固定方式和所需五金。'
      },
      roles: {
        base: ['底座', '与当前宽度、深度对应的基础底座。'], baseWhole: ['整块底座', '与同规格的两片分体底座二选一。'], baseSplit: ['分体底座', '同规格 Part 1 和 Part 2 均需打印，无需再打印整块版本。'], baseConnector: ['底座连接件', '用于底座组件连接，安装位置参考组装图。'],
        backbone: ['背部连接板', '用于模块背部加固与连接，匹配标注的宽度和层高；通用件按原版组合方式使用。'], moduleConnector: ['模块连接件', '用于背部结构中的模块连接，按文件名选择对应层高。'], handleLock: ['伸缩提手锁定件', '在背部结构上锁定伸缩提手机构，匹配宽度或原版通用组合。'], lockPart: ['S 提手锁定件 · 零件 2', 'S 系列伸缩提手锁额外提供的第二零件。'], knob: ['提手锁定旋钮零件', 'Part 1 与 Part 2 配合组成旋钮，按步骤安装热熔螺母。'],
        feet: ['支脚', '与对应宽度系列匹配的支撑脚。'], pullHandle: ['伸缩提手', '与轴杆及对应锁定结构配合使用。'], stationaryHandle: ['固定提手', '安装在背部连接板后侧的固定搬运提手。'],
        pegIkea: ['IKEA Skådis 洞洞板连接件', '用于连接 IKEA Skådis 洞洞板，按规格匹配。'], pegUssa: ['USSA 洞洞板连接件', '用于连接 USSA 洞洞板，按规格匹配。'], wall: ['专用壁挂件', '按文件名中的宽度和层高匹配安装。'], wallSecond: ['壁挂件 · 第二安装件', '配合壁挂结构使用，安装顺序参考 05 号说明书。'],
        bushing: ['轮轴轴套', '安装在轴杆上，使用定位工具确定安装位置。'], wheelCover: ['轮盖', '封闭组装后的轮组；原版标注每个轮子使用 6 颗 M4 × 25 mm 螺丝。'], wheelDisk: ['轮盘', '安装在轴套上，并承托外圈轮胎。'], wheelJig: ['轴套定位工具', '辅助确定轴套位置，使用后取出，不留在轮组中。'], tyre: ['轮胎 · TPU', '套在轮盘外圈的柔性轮胎，原版建议使用 TPU 打印。']
      }
    }
  };
  root.ModificationCatalog = { categories, parts, filter, text };
})(globalThis);
