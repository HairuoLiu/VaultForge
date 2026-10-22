(function (root) {
  'use strict';

  const files = new Set(root.DrawerFiles);
  const universal = '01. DRAWERS/07. Universal/';
  const dividerRoot = universal + 'Grid Dividers/';
  const families = { S: '01. S Families', M: '02. M Families', L: '03. L Families', XL: '05. XL Families' };
  const widthSpans = { S: 10, M: 18, L: 26, XL: 32 };
  const depthSpans = { 3: 10, 4: 14, 5: 18, 6: 22, 7: 26 };
  const dividerNames = { 10: '10-S, x3', 14: '14, x4', 18: '18-M, x5', 22: '22, x6', 26: '26-L, x7', 32: '32-XL' };
  const dividerHeights = [
    { id: '20mm', directory: '20MM TALL', edge: '20MM', mm: 20 },
    { id: '1f', directory: '34.5MM TALL (full height of 1F drawers)', edge: '1F', mm: 34.5 },
    { id: '2f', directory: '82.5MM TALL (full height of 2F drawers)', edge: '2F', mm: 82.5 }
  ];
  const bilingual = (zh, en) => ({ zh, en });
  function item(path, role, label, note) {
    if (!files.has(path)) throw new Error('Missing drawer accessory: ' + path);
    return { path, role, label, note, qty: null };
  }
  const group = (id, placement, title, note, items) => ({ id, placement, title, note, items });

  // Sources: Manual 01 pages 9–11, 18, 20 and Grid Dividers/01. INSTRUCTIONS.
  // Most accessories need layout quantities; verified selectable kits declare theirs.
  function resolve(configuration) {
    const { width, height } = configuration;
    const depth = String(configuration.depth);
    if (!families[width] || !depthSpans[depth] || !(width === 'XL' ? ['1F'] : ['1F', '2F', '4F']).includes(height)) {
      throw new Error('Unsupported drawer accessory configuration');
    }
    const roof = configuration.drawerRoof || configuration.roof || 'none';
    const size = width + depth;
    const base = `01. DRAWERS/${families[width]}/${size}/`;
    const groups = [];

    const baseplates = [...files].filter(path => path.startsWith(base + 'Gridfinity Baseplate/')).map(path => {
      const handles = path.match(/With (\d) Handles?/);
      const part = path.match(/Part (\d)/);
      const label = part ? bilingual(`Gridfinity 底板 · 分片 ${part[1]}`, `Gridfinity baseplate · Part ${part[1]}`)
        : handles ? bilingual(`Gridfinity 底板 · ${handles[1]} 个提手版本`, `Gridfinity baseplate · ${handles[1]}-handle variant`)
          : bilingual('Gridfinity 底板 · 标准版', 'Gridfinity baseplate · Standard');
      const note = part
        ? bilingual(`${size} 分体底板；请同时核对 Part 1 与 Part 2，组成完整底板。`, `${size} split baseplate; check both Part 1 and Part 2 for a complete base.`)
        : bilingual(`匹配 ${size} 抽屉内部。标准版与带提手版是替代选项，按一种内装方案选用。`, `Matches the ${size} drawer interior. Standard and handle versions are alternatives; choose one interior setup.`);
      return item(path, 'drawerBaseplate', label, note);
    });
    groups.push(group('drawer-baseplates', 'interior', bilingual('Gridfinity 内装底板', 'Gridfinity baseplates'),
      bilingual('放入抽屉内盒的可选底板，与顶部 Grid Roof 不同。参考 01 使用说明书第 9 / 11 页。', 'Optional baseplates inside the drawer box, distinct from a Grid Roof. See Manual 01, pages 9 / 11.'), baseplates));

    const widthSpan = widthSpans[width];
    const depthSpan = depthSpans[depth];
    for (const variant of dividerHeights.filter(variant => height !== '1F' || variant.mm <= 34.5)) {
      const directory = dividerRoot + variant.directory + '/';
      const items = [];
      for (let span = 5; span <= Math.max(widthSpan, depthSpan); span++) {
        const fullWidth = span === widthSpan;
        const fullDepth = span === depthSpan;
        const axes = fullWidth && fullDepth ? bilingual('全宽 / 全深', 'Full width / depth')
          : fullWidth ? bilingual('全宽', 'Full width')
            : fullDepth ? bilingual('全深', 'Full depth') : bilingual('局部分仓', 'Custom compartment');
        const note = fullWidth || fullDepth
          ? bilingual(`说明图匹配 ${fullWidth ? width + ' 宽度' : ''}${fullWidth && fullDepth ? '及 ' : ''}${fullDepth ? 'x' + depth + ' 深度' : ''}；通长布局需配两端边缘件，数量依布局决定。`,
            `The supplied diagram matches ${fullWidth ? width + ' width' : ''}${fullWidth && fullDepth ? ' and ' : ''}${fullDepth ? 'x' + depth + ' depth' : ''}. A full-span layout uses edge pieces at both ends; quantities depend on the layout.`)
          : bilingual('编号表示跨越的孔位数，不是毫米或打印份数。按实际空余孔位及边缘件组合选择。', 'The number denotes the hole span, not millimetres or print quantity. Select by the free holes and the edge-piece arrangement.');
        items.push(item(directory + (dividerNames[span] || span) + '.stl', 'gridDivider',
          bilingual(`${span} 孔隔板 · ${axes.zh}`, `${span}-hole divider · ${axes.en}`), note));
      }
      for (const edge of ['Straight', 'Rounded']) {
        items.push(item(directory + `${edge} Edge Piece ${variant.edge}.stl`, 'gridDividerEdge',
          bilingual(edge === 'Straight' ? '直边收口件' : '圆边收口件', `${edge} edge piece`),
          bilingual(`与 ${variant.mm} mm 高隔板配套；按接触位置选择边缘形状与份数。`, `Use with ${variant.mm} mm dividers; choose the edge shape and quantity for the contact position.`)));
      }
      const heightNote = variant.mm === 20 ? bilingual('低隔板，可在当前抽屉内按布局选用。', 'Low dividers for a custom layout inside this drawer.')
        : variant.mm === 34.5 ? bilingual('对应 1F 满高；更高抽屉中属于低隔板方案。', 'Full height for 1F; a low-divider option in taller drawers.')
          : bilingual('对应 2F 满高；当前资源没有 4F 满高隔板。', 'Full height for 2F; no full-height 4F dividers are supplied.');
      groups.push(group('drawer-dividers-' + variant.id, 'interior',
        bilingual(`网格隔板 · ${variant.mm} mm 高`, `Grid dividers · ${variant.mm} mm tall`),
        bilingual(`${heightNote.zh} 已按当前宽深筛选长度；孔数与边缘件用法见 Grid Dividers/01. INSTRUCTIONS。`, `${heightNote.en} Lengths are filtered for the current width and depth; see Grid Dividers/01. INSTRUCTIONS for hole counting and edge pieces.`), items));
    }
    groups.push(group('drawer-divider-pins', 'interior', bilingual('隔板固定销', 'Divider pins'),
      bilingual('松配合与紧配合为两种备选；根据打印公差试装，按隔板布局确定份数。', 'Loose and tight fits are alternatives. Check the printed fit and choose quantities for the divider layout.'),
      ['loose', 'tight'].map(fit => item(dividerRoot + `grid divider pin_${fit}.stl`, 'gridDividerPin',
        bilingual(fit === 'loose' ? '隔板销 · 松配合' : '隔板销 · 紧配合', `Divider pin · ${fit} fit`),
        bilingual('固定网格隔板使用，不需要把两种公差版本全部打印。', 'For fixing grid dividers; both tolerance versions do not need to be printed.')))));

    if (roof === 'grid') {
      groups.push({
        ...group('drawer-top-handle', 'roof', bilingual('Grid 顶盖提手', 'Grid roof handle'),
          bilingual('启用后，1 个顶部提手与 M6 × 50 mm 螺丝 2 颗一起加入当前配置。安装位置见 01 使用说明书第 11 页，五金见第 18 页；仅确认适配 Grid 顶盖。', 'Selecting this option adds one top handle and 2 × M6 × 50 mm bolts to the configuration. See Manual 01, page 11 for placement and page 18 for hardware. Compatibility is confirmed for the Grid Roof only.'),
          [{ ...item(universal + 'Top Handle (Turn On Supports).stl', 'topHandle', bilingual('顶部提手 · 开启支撑', 'Top handle · Enable supports'),
            bilingual('打印 1 份，并按文件名开启切片支撑。安装需 M6 × 50 mm 螺丝 2 颗，已随此选项计入五金清单。', 'Print one copy with slicer supports enabled. Installation requires 2 × M6 × 50 mm bolts, included in the hardware list when this option is selected.')), qty: 1 }]),
        select: { topHandle: true },
        selected: configuration.topHandle === true
      });
    }
    if (roof === 'heavyweight' && ['L', 'XL'].includes(width)) {
      const items = [
        item(universal + 'Heawyweight Roof Handle.stl', 'heavyweightHandle', bilingual('加强顶盖提手', 'Heavyweight roof handle'),
          bilingual('加强顶盖目录相关组件；原包未单独给出装配份数，请预览并核对接口。', 'Related heavyweight roof component; no separate assembly quantities are supplied. Preview and check the mating geometry.')),
        item(universal + 'Heawyweight Roof Insert.stl', 'heavyweightInsert', bilingual('加强顶盖嵌件', 'Heavyweight roof insert'),
          bilingual('与加强顶盖相关的嵌件，保留原始文件名；安装位置及份数请核对模型。', 'An insert associated with the heavyweight roof. The original filename is retained; check its placement and quantity in the model.'))
      ];
      if (width === 'XL') items.push(item(base + `Roofs/${size} Heavyweight Roof Cut.stl`, 'heavyweightCut',
        bilingual('加强顶盖 · Cut 版本', 'Heavyweight roof · Cut variant'),
        bilingual('同规格的另一个顶盖文件，不自动替换当前顶盖或叠加打印；原说明书未单独解释 Cut 的装配方式。', 'An alternate roof file for this size, not an automatic replacement or extra print. The supplied manual does not separately describe the Cut assembly.')));
      groups.push(group('drawer-heavyweight-accessories', 'roof', bilingual('加强顶盖相关件', 'Heavyweight roof components'),
        bilingual('仅在选择加强顶盖时显示。预览核对后选用；不自动加入基础打印清单。', 'Shown when the heavyweight roof is selected. Inspect before use; these are not automatically added to the core print plan.'), items));
    }
    groups.push(group('drawer-manual-support', 'general', bilingual('打印辅助支撑', 'Print support aid'),
      bilingual('手动支撑是切片时添加的辅助件，不是最终组装件。参考 01 使用说明书第 20 页。', 'Manual supports are print aids added in the slicer, not final assembly parts. See Manual 01, page 20.'),
      [item(universal + `Manual Supports/x${depth}.stl`, 'manualSupport', bilingual(`x${depth} 手动支撑`, `x${depth} manual support`),
        bilingual('按当前深度匹配；在切片软件中与目标零件核对位置和用量，尤其适用于较高模型。', 'Matched to the current depth. Check placement and quantity alongside the target part in the slicer, especially for tall prints.'))]));

    if (['L', 'XL'].includes(width)) {
      const family = width === 'L' ? '04. L² Families' : '06. XL² Families';
      const squareSize = size + '²';
      const items = [item(`01. DRAWERS/${family}/${squareSize}/${squareSize} Module ${height}.stl`, 'alternateModule',
        bilingual(`${squareSize} ${height} · 独立外框版本`, `${squareSize} ${height} · Alternate module`),
        bilingual('这是独立的 ² 系列外框，不是当前普通外框的附加零件。原说明书未明确说明替换关系，请核对模型后单独规划。', 'This is a separate ²-family module, not an extra part for the regular module. The supplied manual does not specify the substitution; inspect it and plan separately.'))];
      if (width === 'L') for (const ordinal of ['1st', '2nd']) items.push(item(universal + `L² Accessories/x${depth} Accessory ${ordinal}.stl`, 'squareModuleAccessory',
        bilingual(`L² 附件 · ${ordinal === '1st' ? '第一件' : '第二件'}`, `L² accessory · ${ordinal}`),
        bilingual(`L² 专用目录中的 x${depth} 附件；不是普通 L 抽屉必需件。安装方式与份数请核对 ² 系列模型。`, `An x${depth} accessory from the L²-specific folder, not a required part of a regular L drawer. Check the ²-family model for placement and quantities.`)));
      groups.push(group('drawer-alternate-modules', 'general', bilingual('另系列外框 · 需单独核对', 'Alternate modules · Inspect separately'),
        bilingual('按相同宽度系列、深度与层高列出资源包中的 ² 系列；不会更改当前基础配置或推定适配。', 'The archive’s ² series is listed by the same family, depth and height. This does not change the current configuration or imply compatibility.'), items));
      groups[groups.length - 1].warning = true;
    }
    if (width === 'XL') groups.push({
      ...group('archive-other-sizes', 'general', bilingual('其他规格 · 仅供核对', 'Other sizes · Reference only'),
        bilingual('以下 82.5 mm 高隔板不适配当前 XL 1F，也不在现有普通抽屉配置的适配范围内。保留资源入口供核对，不能当作当前配置的推荐件。', 'These 82.5 mm dividers do not fit the current XL 1F and have no confirmed match among the standard drawer configurations. They remain accessible for reference, not as recommendations for this configuration.'), unmatched),
      warning: true
    });
    return groups;
  }

  // These tall XL-length dividers have no matching case in the supplied drawer catalog.
  const unmatched = Array.from({ length: 6 }, (_, index) => {
    const span = index + 27;
    return item(dividerRoot + dividerHeights[2].directory + '/' + (dividerNames[span] || span) + '.stl', 'unmatchedGridDivider',
      bilingual(`82.5 mm 高 · ${span} 孔隔板`, `82.5 mm tall · ${span}-hole divider`),
      bilingual('当前抽屉配置未展示：长度超过 L 全宽和 x7 全深，而 XL 仅有 1F，无法确认该高度适配。', 'Not shown for current drawer configurations: longer than L width and x7 depth, while XL is supplied only in 1F, so this height is not confirmed to fit.'));
  });

  root.DrawerAccessories = { resolve, unmatched, excluded: unmatched };
})(globalThis);
