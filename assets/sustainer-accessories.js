// Reference: Instructions Manual pp. 9, 12; Sustainers Assembly pp. 6–7.
// Accessory discovery reuses the catalog's validated sizes and exact archive paths.
// Universal facades are separate archive files; their interchangeability is unverified.
(function (root) {
  'use strict';

  const text = (zh, en) => ({ zh, en });
  const alternateFacades = {
    S1F: '02. SUSTAINERS/05. Universal/Facades/S1F.stl',
    S2F: '02. SUSTAINERS/05. Universal/Facades/S2F.stl',
    S4F: '02. SUSTAINERS/05. Universal/Facades/S4F.stl',
    M1F: '02. SUSTAINERS/05. Universal/Facades/M1F.stl',
    M2F: '02. SUSTAINERS/05. Universal/Facades/M2F.stl',
    M4F: '02. SUSTAINERS/05. Universal/Facades/M4F.stl',
    L1F: '02. SUSTAINERS/05. Universal/Facades/L1F.stl',
    L2F: '02. SUSTAINERS/05. Universal/Facades/L2F.stl',
    L4F: '02. SUSTAINERS/05. Universal/Facades/L4F.stl'
  };
  const labels = {
    baseplate: text('Gridfinity 底板', 'Gridfinity baseplate'),
    divider: text('普通隔板', 'Standard divider'),
    depthDivider: text('纵向隔板', 'Depth divider'),
    widthDivider: text('横向隔板', 'Width divider'),
    sealDivider: text('密封型隔板', 'Seal divider'),
    sideSealDivider: text('侧边密封型隔板', 'Side seal divider'),
    centerSealDivider: text('中间密封型隔板', 'Center seal divider'),
    roof: text('分体顶盖', 'Split lid'),
    roofConnector: text('分体顶盖连接件', 'Split-lid connector')
  };

  function resolve(selection) {
    const catalog = root.SustainerCatalog;
    if (!catalog) throw new Error('SustainerCatalog must be loaded before SustainerAccessories');
    catalog.resolve(selection);
    const { width, height, interior, roof } = selection;
    const depth = String(selection.depth);
    const wide = width === 'L' || width === 'XL';
    const size = width + depth;
    const allowed = catalog.options(width, depth, height);
    const groups = [];

    function addInterior(id, title, note, partNote) {
      const candidate = catalog.resolve({ ...selection, interior: id });
      groups.push({
        id, placement: 'interior', title, note,
        selected: interior === id, select: { interior: id },
        items: candidate.interiorParts.map(part => ({
          ...part, label: labels[part.role], note: partNote(part)
        }))
      });
    }

    addInterior('gridfinity', text('Gridfinity 底板', 'Gridfinity baseplates'),
      wide
        ? text('需选择 Gridfinity 内装并使用 Flat 盒体；底板与普通、密封隔板不是同一内装方案。收纳小盒需另备。',
          'Select the Gridfinity interior with a Flat module. It is an alternative to divider and sealed interiors; supply your own bins.')
        : text('需选择 Gridfinity 内装，配合当前标准盒体使用；收纳小盒需另备。',
          'Select the Gridfinity interior for the current standard module; supply your own bins.'),
      () => width === 'XL' && Number(depth) >= 6
        ? text(size + ' 底板由 Part 1 和 Part 2 组成，两份文件配套使用。',
          size + ' uses Part 1 and Part 2 together to form the complete baseplate.')
        : text('按 ' + size + ' 宽度与深度匹配；此处是底板，不含收纳小盒。',
          'Matches the ' + size + ' width and depth. This is the baseplate, without bins.'));

    addInterior('dividers', text('普通分隔配件', 'Standard dividers'),
      wide
        ? text('需选择普通隔板内装，并使用 Dividers 盒体；安装前清理槽内手动支撑。份数按实际分格布局填写。',
          'Select the divider interior and a Dividers module. Remove the manual supports from the slots before assembly; quantities depend on your layout.')
        : text('需选择普通隔板内装，配合当前标准盒体使用；份数按实际分格布局填写。',
          'Select the divider interior for the current standard module. Quantities depend on your layout.'),
      part => part.role === 'depthDivider'
        ? text('按 ' + size + ' / ' + height + ' 匹配纵向长度与高度；与横向隔板按布局组合。',
          'Depth and height match ' + size + ' / ' + height + '; combine with width dividers for your layout.')
        : text('按 ' + width + ' / ' + height + ' 匹配宽度与高度；不预设分格份数。',
          'Width and height match ' + width + ' / ' + height + '; no layout quantity is assumed.'));

    if (allowed.interiors.includes('sealed')) {
      addInterior('sealed', text('密封型分隔配件', 'Sealed-interior dividers'),
        text('仅配合 Sealed 盒体；需切换到密封隔板内装，不能当作普通隔板替换。份数按实际布局填写。',
          'For a Sealed module only. Select the sealed interior; these do not replace standard dividers. Quantities depend on your layout.'),
        part => part.role === 'sideSealDivider'
          ? text('XL 侧边位置使用；与中间隔板区分，数量按布局决定。',
            'For XL side positions. Distinct from the center divider; quantities depend on your layout.')
          : part.role === 'centerSealDivider'
            ? text('XL 中间位置使用；与侧边隔板区分，数量按布局决定。',
              'For XL center positions. Distinct from the side divider; quantities depend on your layout.')
            : text('匹配 L / ' + height + ' 密封型盒体；不预设分格份数。',
              'Matches the L / ' + height + ' Sealed module; no layout quantity is assumed.'));
    }

    if (allowed.roofs.includes('split')) {
      const candidate = catalog.resolve({ ...selection, roof: 'split' });
      groups.push({
        id: 'split-roof', placement: 'roof',
        title: text('分体顶盖与连接件', 'Split lid and connector'),
        note: text('与整体顶盖二选一；切换分体顶盖时需同时使用两片盖板和连接件。',
          'An alternative to the whole lid. Select the split lid to use both halves together with the connector.'),
        selected: roof === 'split', select: { roof: 'split' },
        items: candidate.structure.filter(part => part.role === 'roof' || part.role === 'roofConnector').map(part => ({
          ...part, label: labels[part.role],
          note: part.role === 'roofConnector'
            ? text('用于连接同规格 Part 1 与 Part 2；整体顶盖不需要此件。',
              'Joins the matching Part 1 and Part 2. Not needed for a whole lid.')
            : text(size + ' 分体顶盖的一部分；需与另一片和连接件配套。',
              'One half of the ' + size + ' split lid; use with its other half and connector.')
        }))
      });
    }

    const alternateFacade = alternateFacades[width + height];
    if (alternateFacade) {
      const note = text('通用目录中另有此面板，文件内容与主清单面板不同；原说明未解释差异，尚未确认可互换。请先预览核对，不自动替换或加入打印清单。',
        'This Universal-directory facade differs from the main-list file. The manual does not explain the difference, and interchangeability is unverified. Preview and compare before use; it is not substituted or added to the print plan.');
      groups.push({
        id: 'facade-verify', placement: 'general', requiresVerification: true,
        title: text('另版面板 · 需核对', 'Other facade · verify first'),
        note, selected: false,
        items: [{ path: alternateFacade, role: 'alternateFacade', qty: null, unit: 'piece',
          label: text(width + ' / ' + height + ' 通用目录面板', width + ' / ' + height + ' Universal-directory facade'), note }]
      });
    }
    return groups;
  }

  root.SustainerAccessories = { resolve };
})(globalThis);
