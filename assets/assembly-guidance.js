// References use the supplied English manuals' PDF page numbers.
// Hardware quantities describe complete assemblies, never STL print copies.
(function (root) {
  'use strict';
  const text = (zh, en) => ({ zh, en });
  const source = (id, page) => ({ id, page });
  const step = (id, title, note, ...sources) => ({ id, title, note, sources });
  const remark = (value, ...sources) => ({ text: value, sources });
  const hardware = (size, qty, unit, purpose, ...sources) => ({ size, qty, unit, purpose, sources });
  const empty = () => ({ steps: [], hardware: [], notes: [], warnings: [] });
  const perCase = text('每个完整收纳盒', 'per complete case');
  const perDrawer = text('每个抽屉', 'per drawer');
  const perHandle = text('每个提手', 'per handle');
  const summary = source('01', 3);

  function forBuild(system, configuration = {}) {
    const result = empty();
    if (system === 'sustainers') {
      result.steps = [
        step('latches', text('先组装两个锁扣', 'Assemble both latches'), text('每个锁扣使用一套打印销钉；先装小销钉，再装大销钉，注意 UP 标记方向。', 'Use one printed pin set per latch. Insert the small pins first, then the large pins, keeping the UP marks aligned.'), source('03', 1)),
        step('latch-mount', text('把锁扣固定到前面板', 'Attach the latches to the facade'), text('两个锁扣共用 8 颗 M4 × 14 mm 螺丝。', 'The two latches use 8 M4 × 14 mm bolts in total.'), source('03', 2)),
        step('hinges', text('安装翻盖和盒体铰链', 'Attach the lid and body hinges'), text('翻盖侧用 8 颗 M4 × 14 mm，盒体侧用 8 颗 M4 × 10 mm。再穿入两根打印插销，连接翻盖与盒体。', 'Use 8 M4 × 14 mm bolts on the lid and 8 M4 × 10 mm bolts on the body, then join them with the two printed hinge rods.'), source('03', 3), source('03', 4)),
        step('facade', text('固定前面板，装上标签', 'Attach the facade and label'), text('前面板使用 M4 × 20 mm 螺丝；原版每盒备料清单列 7 颗。', 'Use M4 × 20 mm bolts for the facade; the original per-case hardware list specifies 7.'), source('03', 5), source('01', 17))
      ];
      result.hardware = [
        hardware('M4 × 10 mm', 8, perCase, text('盒体侧铰链', 'Body hinges'), source('03', 3), source('01', 17)),
        hardware('M4 × 14 mm', 8, perCase, text('两个锁扣与前面板连接', 'Both latches to the facade'), source('03', 2), source('01', 17)),
        hardware('M4 × 14 mm', 8, perCase, text('翻盖侧铰链', 'Lid hinges'), source('03', 3), source('01', 17)),
        hardware('M4 × 20 mm', 7, perCase, text('前面板与盒体连接', 'Facade to the body'), source('03', 5), source('01', 17))
      ];
      result.notes.push(remark(text('以上合计按一个完整盒子计算：M4 × 10 mm 8 颗、M4 × 14 mm 16 颗、M4 × 20 mm 7 颗。打印件的“份数”不等于五金用量，采购前按当前模型孔位核对。', 'Totals are for one complete case: 8 M4 × 10 mm, 16 M4 × 14 mm and 7 M4 × 20 mm bolts. STL copy counts are separate from hardware quantities; check the selected model’s holes before buying.'), summary, source('01', 17)));
      if (configuration.roof === 'split') {
        result.steps.unshift(step('split-lid', text('先准备分体翻盖', 'Prepare the split lid'), text('两片翻盖和连接件都要打印，各 1 份；无需再打印整块翻盖。', 'Print both lid halves and the connector once each; omit the one-piece lid.'), source('01', 12)));
        result.warnings.push(remark(text('原版通用组装图展示整块翻盖，未单列分体连接件的额外五金数量；请核对连接件模型，不能把未列出的数量当成 0。', 'The general assembly guide illustrates a one-piece lid and does not give extra hardware quantities for the split-lid connector. Check that model; an unspecified quantity does not mean zero.'), source('03', 3), source('01', 17)));
      }
      if (configuration.interior === 'dividers' || configuration.interior === 'sealed') {
        result.steps.push(step('dividers', text('最后安排内部隔仓', 'Finish the interior layout'), text('隔板数量由布局决定。带手动支撑的分隔槽先移除支撑；Sealed 方案使用专用隔板。', 'Divider quantities depend on your layout. Remove built-in supports from divider slots first; the Sealed setup uses its matching divider files.'), source('03', 6), source('03', 7), source('01', 9)));
      } else if (configuration.interior === 'gridfinity') {
        result.steps.push(step('baseplate', text('放入 Gridfinity 底板', 'Add the Gridfinity baseplate'), text('底板按当前宽度和深度匹配；XL6 / XL7 需要两片底板，均已列入打印文件。', 'Match the baseplate to the case width and depth. XL6 / XL7 require both baseplate halves, already included in the print list.'), source('01', 9)));
      }
      return result;
    }
    if (system !== 'drawers') throw new Error('Unknown component system');
    const facadeBolts = configuration.height === '1F' ? 4 : ['2F', '4F'].includes(configuration.height) ? 6 : null;
    result.hardware.push(hardware('M4 × 14 mm', facadeBolts, perDrawer, text('前面板与抽屉内盒连接', 'Facade to the drawer box'), source('02', 6), source('01', 18)));
    result.steps = [
      step('lock', text('组装前面板锁定机构', 'Assemble the facade lock'), text('按图确认钥匙与弹簧方向，弹簧平面朝上。隐藏钥匙方案使用所选配套文件。', 'Check the key and spring orientation in the guide, with the springs’ flat sides facing up. Use the selected matching files for the hidden-key option.'), source('02', 1), source('02', 2)),
      step('rails', text('清理支撑，装入导轨', 'Remove supports and fit the slides'), text('先移除内盒手动支撑，再装导轨滑动件。齿条在原版中标为选装，用于额外锁定力或同一模块内放多个内盒。', 'Remove the box’s built-in supports before fitting the runner slides. The manual marks geared rails as optional for extra locking force or multiple boxes in one module.'), source('02', 3), source('02', 4)),
      step('facade', text('固定前面板', 'Attach the facade'), text('把锁定机构保持在图示的开启位置，用 M4 × 14 mm 螺丝固定前面板，再装标签与盖帽。', 'Keep the lock in the illustrated open position, attach the facade with M4 × 14 mm bolts, then fit the label and caps.'), source('02', 6)),
      step('insert', text('装入框架，再装限位与卡扣', 'Insert the drawer, then fit the stops'), text('装好导向件，把内盒完全推进框架后再插入限位块；翻转模块，安装底部连接卡扣。', 'Fit the runner guides and fully insert the drawer before adding the runner stoppers. Turn the module over to fit the connecting latch.'), source('02', 7), source('02', 8))
    ];
    if (configuration.drawerRoof && configuration.drawerRoof !== 'none') {
      result.steps.push(step('roof', text('核对最顶层的顶盖', 'Check the top-tier roof'), text('顶盖按当前宽度、深度选择，用于最顶层；不同顶盖方案需按各自安装方式核对配套件。', 'Match the roof width and depth for the top tier; check companion parts for the selected roof design.'), source('01', 10), source('01', 11)));
    }
    if (configuration.drawerRoof === 'grid' && configuration.topHandle === true) {
      result.steps.push(step('roof-handle', text('固定网格顶盖提手', 'Attach the grid-roof handle'), text('本方案已包含 Top Handle 打印件和 2 颗 M6 × 50 mm 螺丝，按爆炸图核对安装位置。', 'This plan includes the Top Handle print and 2 M6 × 50 mm bolts. Check its placement against the exploded diagram.'), source('01', 11), source('01', 18)));
      result.hardware.push(hardware('M6 × 50 mm', 2, text('每个网格顶盖提手', 'per grid-roof handle'), text('固定网格顶盖提手', 'Attach the grid-roof handle'), summary, source('01', 18)));
    }
    if (configuration.drawerRoof === 'mount') {
      result.steps.push(step('under-table', text('先安装桌下顶盖，再挂入模块', 'Mount the under-table roof before the modules'), text('05 号说明书展示使用螺纹嵌件或螺丝直接固定桌底，再挂入模块；规格和数量需按桌板与孔位确定。', 'Manual 05 shows threaded inserts or screws attaching the roof beneath the table, followed by the modules. Choose fastener sizes and quantities for the tabletop and holes.'), source('05', 10), source('05', 11), source('05', 12)));
      result.warnings.push(remark(text('桌下安装五金尚未确定：原版未给统一规格与数量，当前基础清单不包含这部分采购数量。', 'Under-table fasteners still need to be specified: the manual gives no universal sizes or quantities, so the base plan does not include their purchasing totals.'), source('05', 11)));
    }
    if (configuration.drawerRoof === 'heavyweight') {
      result.warnings.push(remark(text('重载顶盖的配套提手、插块和专用五金需另行核对；原版未提供完整数量，不能沿用网格顶盖提手的 2 颗 M6 × 50 mm。', 'The heavyweight roof’s handle, inserts and hardware need separate verification. The manual does not provide complete quantities; do not reuse the grid-roof handle’s 2 M6 × 50 mm bolts as its specification.'), source('01', 10)));
    }
    return result;
  }

  function forModification(category) {
    const result = empty();
    const perWheel = text('每个轮子', 'per wheel');
    switch (category) {
      case 'base':
        result.hardware = [
          hardware('M16 × 248 / 338 / 414 / 504 mm', 1, text('每个轮轴方案底座', 'per axle-mounted base'), text('S / M / L / XL 对应轴杆长度，四种尺寸按宽度选一种', 'Axle lengths for S / M / L / XL respectively; choose one matching width'), summary, source('04', 2)),
          hardware('M8', 4, text('每个脚轮方案底座', 'per caster base'), text('4 个带 M8 连接的脚轮；原版未指定螺栓长度', '4 casters with M8 fittings; bolt length is not specified'), source('04', 17))
        ];
        result.steps.push(step('base-mode', text('先选轮轴或脚轮方案', 'Choose axle wheels or casters'), text('轮轴方案将对应长度轴杆穿过底座；脚轮方案使用 4 个 M8 脚轮。两种方案分开备料。', 'For axle wheels, pass the matching axle through the base. The caster option uses 4 M8 casters. Prepare hardware for your chosen option.'), source('04', 2), source('04', 17)));
        result.notes.push(remark(text('分体底座需同时打印两片，并核对连接件；原版未单列分体连接处的五金数量。', 'A split base needs both halves and its connector; the manual does not separately specify hardware quantities for the split joint.'), source('01', 13), source('04', 2)));
        break;
      case 'wheels':
        result.hardware = [
          hardware('M4 × 25 mm', 6, perWheel, text('固定轮盖', 'Attach the wheel cover'), summary, source('04', 6)),
          hardware('6205ZZ · 25 × 52 × 15 mm', 1, perWheel, text('轴承：内径 × 外径 × 厚度', 'Bearing: inner diameter × outer diameter × thickness'), summary, source('04', 4)),
          hardware('SCSAW · 16 × 30 × 10 mm', 1, perWheel, text('止动环：内径 × 外径 × 厚度，用于限制轴承位置', 'Retaining collar: inner diameter × outer diameter × thickness, to retain the bearing'), summary, source('04', 5))
        ];
        result.steps = [
          step('wheel-jig', text('先用定位工具安装轴套', 'Position the bushings with the jig'), text('按图让轴杆伸出轴套 10 mm，完成定位后取出 Jig；它是工具，不留在成品中。', 'Leave 10 mm of rod extending beyond the bushing as illustrated, then remove the Jig; it is an assembly tool.'), source('04', 3)),
          step('wheel-build', text('安装轮盘、轴承、止动环和轮胎', 'Fit disks, bearings, collars and tyres'), text('轮胎原版建议 TPU；最后用每轮 6 颗 M4 × 25 mm 螺丝固定轮盖。轴杆按底座宽度另配。', 'The guide recommends TPU tyres. Finish each cover with 6 M4 × 25 mm bolts; choose the axle separately for the base width.'), source('04', 4), source('04', 5), source('04', 6))
        ];
        break;
      case 'feet':
        result.hardware.push(hardware('M6 × 90 mm', 2, text('每个支脚', 'per foot'), text('将支脚固定到底座', 'Attach the foot to the base'), summary, source('04', 6)));
        result.steps.push(step('foot', text('翻转底座安装支脚', 'Turn over the base to attach the foot'), text('按宽度选择支脚，用每支脚 2 颗 M6 × 90 mm 螺丝固定。', 'Choose the matching foot width and attach it with 2 M6 × 90 mm bolts per foot.'), source('04', 6), summary));
        break;
      case 'backbone':
        result.hardware.push(hardware('M4 × 60–100 mm', 4, text('每块背部连接板', 'per backbone board'), text('固定背部连接板；具体长度按当前连接结构核对', 'Attach the backbone; select the length for the actual connection'), summary));
        result.steps.push(step('backbone', text('先按组合定位，再钻孔连接', 'Mark the layout before drilling'), text('按原图选择专用或通用背部件。原版建议移动塔架在底座上方、顶盖下方用 2F 模块；部分背板孔位出厂封闭，需按图标记后钻通。', 'Choose the illustrated family-specific or universal backbone arrangement. The guide recommends 2F modules above the base and below the roof of the mobile tower; mark and drill the sealed backbone holes as shown.'), source('04', 7), source('04', 8), source('04', 10)));
        result.notes.push(remark(text('背板数量、长度和锁定件取决于塔架组合；此处是每块板的参考用量，不能当作整塔总量。伸缩提手的锁定旋钮另见提手备料。', 'Backbone count, bolt length and lock components depend on the tower. These are per-board references, not tower totals. Handle locking knobs are covered in the pull-out handle hardware.'), source('04', 9), source('04', 13)));
        break;
      case 'stationaryHandle':
        result.hardware.push(hardware('M4 × 60 mm', 8, perHandle, text('把固定提手装到背部连接板', 'Attach the stationary handle to the backbone'), summary, source('04', 12)));
        result.steps.push(step('stationary-handle', text('提手先装到背板，再装背板', 'Attach the handle before the backbone'), text('先从背部连接板另一侧装上固定提手，再把整块背板固定到模块上。', 'Attach the stationary handle from the other side of the backbone before fastening that backbone to the module.'), source('04', 12)));
        break;
      case 'pullHandle':
        result.hardware = [
          hardware('M6 × 30 mm', 4, perHandle, text('固定提手与两根轴杆', 'Attach the handle to its two rods'), summary, source('04', 14)),
          hardware('M6 × 35 mm / M4 × 35 mm', 2, perHandle, text('锁定机构六角螺丝；原版规格冲突，须核对', 'Hex bolts for the locking assembly; conflicting manual sizes need verification'), summary, source('04', 13)),
          hardware('M6 × 8 × 8', 2, perHandle, text('旋钮热熔嵌件', 'Heat-set inserts for the locking knobs'), summary, source('04', 13)),
          hardware('M16', 2, perHandle, text('两根轴杆，长度按塔架高度裁切', 'Two rods, cut to the tower height'), summary, source('04', 14))
        ];
        result.steps = [
          step('handle-lock', text('先组装锁定旋钮', 'Assemble the locking knobs'), text('装入热熔嵌件后合上旋钮，再安装到背部锁定结构。核对下方螺丝规格冲突后再采购。', 'Fit the heat-set inserts and close the knobs before assembling the backbone lock. Resolve the bolt-size conflict below before buying.'), source('04', 13)),
          step('handle-rods', text('按塔架高度准备两根轴杆', 'Prepare two rods for the tower'), text('两根轴杆按塔高裁切，穿入提手与锁定机构；按原图钻孔、攻牙后安装提手。', 'Cut both rods to the tower height and insert them through the handle and locking assembly. Follow the guide’s drilling and tapping steps.'), source('04', 14))
        ];
        result.warnings.push(remark(text('原版 01 第 3 页写 M6 × 35 mm，04 第 13 页写 Hex M4 × 35 mm，同一锁定步骤规格不一致。先核对所用模型孔位和嵌件，不能直接视为同一种螺丝。', 'Manual 01 page 3 specifies M6 × 35 mm, but manual 04 page 13 says Hex M4 × 35 mm for the lock. Check the selected model’s holes and insert before choosing; these are different bolt sizes.'), summary, source('04', 13)));
        break;
      case 'pegboard':
        result.hardware.push(hardware('M4 × 40 mm', 4, text('每块洞洞板', 'per pegboard'), text('洞洞板与背部结构连接', 'Attach the pegboard to the backbone'), summary, source('04', 15)));
        result.steps.push(step('pegboard', text('选择匹配的洞洞板接口', 'Match the pegboard attachment'), text('IKEA Skådis 与 USSA 使用不同连接件；按板型、宽度和层高选择后，参考原图固定到背部结构。', 'IKEA Skådis and USSA boards use different attachments. Match board system, width and height before attaching them to the backbone.'), source('04', 15)));
        break;
      case 'wall':
        result.hardware.push(hardware('—', null, text('按墙面和布局', 'for the wall and layout'), text('墙面固定螺丝与锚固件：原版未给统一尺寸和总量，按墙体、孔位与模块布局确定', 'Wall screws and anchors: no universal size or total is specified; choose for the wall, holes and module layout'), source('05', 1), source('05', 6), source('05', 7)));
        result.steps.push(step('wall', text('先定位壁挂件，再挂模块', 'Position the wall mounts before the modules'), text('按每种模块尺寸准备对应定位模板，安装墙面连接件及第二安装件后，再按图挂入模块。', 'Prepare a matching template for each module size, position the wall-side and second mounting parts, then mount the modules as illustrated.'), source('05', 1), source('05', 6), source('05', 9)));
        break;
      default:
        return result;
    }
    result.notes.unshift(remark(text('这里是原版按单个部件列出的备料参考；先确定数量与组合，再汇总采购。打印件和定位工具不属于五金，这些改造项尚未计入当前模块的打印清单。', 'These are the original per-component hardware references. Choose quantities and the assembly layout before totaling purchases. Printed parts and jigs are separate from hardware; these modifications are not included in the current module’s print plan.'), summary));
    return result;
  }

  root.AssemblyGuidance = { forBuild, forModification };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.AssemblyGuidance;
})(globalThis);
