/**
 * VaultForge Advanced Features UI Controller
 * Powers:
 * - Idea 1: 3MF Slicer Project Multi-Plate Exporter
 * - Idea 2: Interactive 3D Exploded View & Assembly Simulation
 * - Idea 3: Tower Stacker & Space Clearance Planner
 * - Idea 4: Filament Weight, Print Time & CAD Cost Estimator
 * - Idea 6: Parametric 3D Custom Label Maker
 */
(function (root) {
  'use strict';

  const $ = id => document.getElementById(id);

  // Internationalization copy for feature widgets
  const copy = {
    en: {
      stackerTitle: 'Tower Stacker & Space Clearance',
      stackerDesc: 'Compose multiple tiers of drawers and cases vertically, calculate mm dimensions and check fit against furniture.',
      addTier: '+ Add Tier',
      removeTier: 'Remove',
      baseStyle: 'Base / Feet Style',
      roofStyle: 'Roof / Lid Style',
      topHandle: 'Include Top Handle (+46mm)',
      totalHeight: 'Total Height',
      totalWidth: 'Width',
      totalDepth: 'Depth',
      clearanceCheck: 'Furniture & Desk Clearance Assessment',
      fits: 'Fits',
      exceeds: 'Exceeds limit',
      margin: 'Clearance margin',

      filamentTitle: 'Filament Weight & Print Time Estimator',
      filamentDesc: 'Pre-computed volume & extrusion model based on high-speed CoreXY & bed-slinger slicer profiles.',
      material: 'Material',
      spoolPrice: 'Price per 1kg Spool (CAD)',
      infill: 'Infill %',
      totalFilament: 'Total Filament Needed',
      spoolsNeeded: '1kg Spool(s) to Buy',
      estCost: 'Estimated Material Cost',
      printHoursCoreXY: 'Print Time (CoreXY / Bambu)',
      printHoursBedslinger: 'Print Time (Standard Bed-slinger)',

      labelTitle: 'Parametric 3D Label Maker',
      labelDesc: 'Generate watertight binary STL labels directly in browser with 3D embossed typography.',
      labelText: 'Label Text (Max 14 chars)',
      labelPreset: 'Plate Size Preset',
      standardPreset: 'Standard 50 × 18 mm (VAULT Slot)',
      compactPreset: 'Compact 40 × 14 mm',
      widePreset: 'Wide 75 × 20 mm',
      downloadLabel: '⬇️ Download Label STL',

      export3mf: '📦 Export 3MF Project',
      export3mfTooltip: 'Generate multi-plate Bambu Studio / OrcaSlicer project (.3mf)',
      explodeTitle: '3D Exploded Mechanical View',
      explodeDesc: 'Drag slider to expand internal drawers, runners and fasteners along axis vectors.',
      assembled: '0% Assembled',
      exploded: '100% Exploded',
      playAnimation: '▶️ Play Animation'
    },
    zh: {
      stackerTitle: '柜塔垂直堆叠与空间规划器',
      stackerDesc: '自由堆叠多层抽屉与工具箱，计算实际毫米装配总高，并进行书桌与家具避障碰撞检测。',
      addTier: '+ 增加一层',
      removeTier: '删除',
      baseStyle: '底座 / 车轮样式',
      roofStyle: '顶盖样式',
      topHandle: '包含顶部提手 (+46mm)',
      totalHeight: '装配总高',
      totalWidth: '外宽',
      totalDepth: '外深',
      clearanceCheck: '常见家具与空间容纳评估',
      fits: '可放入',
      exceeds: '超高无法放入',
      margin: '剩余可用间距',

      filamentTitle: '耗材用量与打印工时预算器',
      filamentDesc: '基于拓竹 CoreXY 与传统打印机切片出胶模型，预估物料成本与打印周期。',
      material: '耗材材质',
      spoolPrice: '每卷 1kg 单价 (CAD $)',
      infill: '填充率 %',
      totalFilament: '净需耗材总量',
      spoolsNeeded: '建议备料 (1kg 卷数)',
      estCost: '预估物料成本',
      printHoursCoreXY: '打印耗时 (拓竹/CoreXY)',
      printHoursBedslinger: '打印耗时 (传统平台机)',

      labelTitle: '参数化 3D 抽屉个性铭牌生成器',
      labelDesc: '直接在浏览器中生成兼容 VAULT 滑槽的标准闭合 3D 打印标签（Binary STL 格式）。',
      labelText: '铭牌文字 (最多 14 个字符)',
      labelPreset: '铭牌尺寸预设',
      standardPreset: '标准 50 × 18 mm (VAULT 抽屉槽)',
      compactPreset: '紧凑 40 × 14 mm',
      widePreset: '加宽 75 × 20 mm',
      downloadLabel: '⬇️ 一键生成并下载铭牌 STL',

      export3mf: '📦 导出 3MF 切片工程包',
      export3mfTooltip: '生成拓竹 / OrcaSlicer 多盘 3MF 打印工程文件',
      explodeTitle: '3D 交互式机械爆炸拆解图',
      explodeDesc: '拖动滑块或播放动画，实时沿空间轴向拆解抽屉盒、阻尼导轨与紧固件。',
      assembled: '0% 完全紧凑装配',
      exploded: '100% 极限机械爆炸',
      playAnimation: '▶️ 播放拆解动画'
    }
  };

  // State for Tower Stacker
  const stackerState = {
    width: 'S',
    depth: '3',
    base: 'standard',
    roof: 'grid',
    hasTopHandle: true,
    tiers: [
      { system: 'drawers', height: '2F' },
      { system: 'drawers', height: '1F' },
      { system: 'drawers', height: '1F' }
    ]
  };

  function getLang() {
    return document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  }

  // --- 1. TOWER STACKER UI ---
  function renderTowerStacker() {
    const container = $('stacker-container');
    if (!container || !root.TowerStacker) return;

    const lang = getLang();
    const t = copy[lang];

    const result = root.TowerStacker.calculateTower(stackerState);

    const tiersHtml = stackerState.tiers.map((tier, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #d4ded0; border-radius:6px; padding:8px 14px; margin-bottom:8px;">
        <span style="font-weight:600; font-size:13px;">#${idx + 1} ${tier.system === 'drawers' ? (lang === 'zh' ? '抽屉模块' : 'Drawer') : (lang === 'zh' ? '箱体模块' : 'Sustainer')} (${tier.height})</span>
        <div style="display:flex; gap:8px; align-items:center;">
          <select onchange="VaultForgeUI.updateTier(${idx}, this.value)" style="padding:4px 8px; font-size:12px;">
            <option value="1F" ${tier.height === '1F' ? 'selected' : ''}>1F (64mm)</option>
            <option value="2F" ${tier.height === '2F' ? 'selected' : ''}>2F (118mm)</option>
            <option value="4F" ${tier.height === '4F' ? 'selected' : ''}>4F (226mm)</option>
          </select>
          <button type="button" onclick="VaultForgeUI.removeTier(${idx})" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; border-radius:4px; padding:4px 8px; font-size:12px; cursor:pointer;">${t.removeTier}</button>
        </div>
      </div>
    `).join('');

    const clearanceHtml = result.clearances.map(c => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:${c.fits ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${c.fits ? '#bbf7d0' : '#fecaca'}; border-radius:6px; margin-bottom:6px;">
        <div>
          <strong style="font-size:12px; color:${c.fits ? '#166534' : '#991b1b'};">${c.name[lang] || c.name.en}</strong>
          <span style="font-size:11px; color:#666; margin-left:6px;">(Max ${c.maxH}mm)</span>
        </div>
        <span style="font-weight:700; font-size:12px; color:${c.fits ? '#15803d' : '#dc2626'};">
          ${c.fits ? `✓ ${t.fits} (+${c.marginH}mm)` : `✕ ${t.exceeds} (${c.marginH}mm)`}
        </span>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
        <!-- Left: Controls -->
        <div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label style="font-size:12px; font-weight:600; color:#444;">${lang === 'zh' ? '柜体宽度' : 'Width'}</label>
              <select onchange="VaultForgeUI.setStackerWidth(this.value)" style="width:100%; padding:8px;">
                <option value="S" ${stackerState.width === 'S' ? 'selected' : ''}>S (154 mm)</option>
                <option value="M" ${stackerState.width === 'M' ? 'selected' : ''}>M (238 mm)</option>
                <option value="L" ${stackerState.width === 'L' ? 'selected' : ''}>L (322 mm)</option>
                <option value="XL" ${stackerState.width === 'XL' ? 'selected' : ''}>XL (406 mm)</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:600; color:#444;">${lang === 'zh' ? '柜体深度' : 'Depth'}</label>
              <select onchange="VaultForgeUI.setStackerDepth(this.value)" style="width:100%; padding:8px;">
                <option value="3" ${stackerState.depth === '3' ? 'selected' : ''}>3 (168 mm)</option>
                <option value="4" ${stackerState.depth === '4' ? 'selected' : ''}>4 (210 mm)</option>
                <option value="5" ${stackerState.depth === '5' ? 'selected' : ''}>5 (252 mm)</option>
                <option value="6" ${stackerState.depth === '6' ? 'selected' : ''}>6 (294 mm)</option>
                <option value="7" ${stackerState.depth === '7' ? 'selected' : ''}>7 (336 mm)</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; color:#444;">${t.baseStyle}</label>
            <select onchange="VaultForgeUI.setStackerBase(this.value)" style="width:100%; padding:8px;">
              <option value="standard" ${stackerState.base === 'standard' ? 'selected' : ''}>${lang === 'zh' ? '标准平底 (0mm)' : 'Standard Flat (0mm)'}</option>
              <option value="feet" ${stackerState.base === 'feet' ? 'selected' : ''}>${lang === 'zh' ? '防震防滑脚垫 (+25mm)' : 'Rubber Feet (+25mm)'}</option>
              <option value="castersM8" ${stackerState.base === 'castersM8' ? 'selected' : ''}>${lang === 'zh' ? 'M8 万向静音脚轮 (+75mm)' : 'M8 Swivel Casters (+75mm)'}</option>
              <option value="mobileBigWheels" ${stackerState.base === 'mobileBigWheels' ? 'selected' : ''}>${lang === 'zh' ? '推车越野大轮底盘 (+110mm)' : 'Mobile Big Wheels (+110mm)'}</option>
            </select>
          </div>

          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label style="font-size:12px; font-weight:700; color:#222; margin:0;">${lang === 'zh' ? '堆叠层级 (从底往上)' : 'Stack Tiers (Bottom to Top)'}</label>
              <button type="button" onclick="VaultForgeUI.addTier()" style="background:#2e7d32; color:#fff; border:0; border-radius:4px; padding:4px 10px; font-size:12px; cursor:pointer; font-weight:600;">${t.addTier}</button>
            </div>
            ${tiersHtml || '<p style="color:#888; font-size:12px;">No tiers added</p>'}
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:600; color:#444;">${t.roofStyle}</label>
            <select onchange="VaultForgeUI.setStackerRoof(this.value)" style="width:100%; padding:8px;">
              <option value="none" ${stackerState.roof === 'none' ? 'selected' : ''}>${lang === 'zh' ? '无顶盖 (继续向上叠放)' : 'None (0mm)'}</option>
              <option value="grid" ${stackerState.roof === 'grid' ? 'selected' : ''}>${lang === 'zh' ? 'Grid 网格顶盖 (+12mm)' : 'Grid Roof (+12mm)'}</option>
              <option value="table" ${stackerState.roof === 'table' ? 'selected' : ''}>${lang === 'zh' ? 'Table 桌面平盖 (+16mm)' : 'Table Roof (+16mm)'}</option>
              <option value="heavyweight" ${stackerState.roof === 'heavyweight' ? 'selected' : ''}>${lang === 'zh' ? 'Heavyweight 承重顶盖 (+22mm)' : 'Heavyweight Roof (+22mm)'}</option>
            </select>
          </div>

          <div>
            <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;">
              <input type="checkbox" ${stackerState.hasTopHandle ? 'checked' : ''} onchange="VaultForgeUI.setStackerHandle(this.checked)">
              <span>${t.topHandle}</span>
            </label>
          </div>
        </div>

        <!-- Right: Real-time Gauge & Clearance Results -->
        <div>
          <div style="background:#1e2920; color:#fff; border-radius:8px; padding:20px; margin-bottom:16px;">
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#9db299;">${lang === 'zh' ? '堆叠装配总尺寸' : 'Total Dimensions'}</span>
            <div style="display:flex; align-items:baseline; gap:10px; margin:8px 0;">
              <span style="font-size:42px; font-weight:800; font-family:Geist, monospace; color:#4ade80;">${result.totalHeightMm}</span>
              <span style="font-size:18px; color:#a3b89e;">mm</span>
            </div>
            <div style="display:flex; gap:18px; font-size:12px; border-top:1px solid #2d3b2f; padding-top:10px; color:#d1e0ce;">
              <span>${t.totalWidth}: <b>${result.widthMm} mm</b></span>
              <span>${t.totalDepth}: <b>${result.depthMm} mm</b></span>
              <span>${lang === 'zh' ? '层数' : 'Tiers'}: <b>${result.tierCount}</b></span>
            </div>
          </div>

          <div>
            <h4 style="font-size:13px; font-weight:700; margin:0 0 10px; color:#242720;">${t.clearanceCheck}</h4>
            ${clearanceHtml}
          </div>
        </div>
      </div>
    `;
  }

  // --- 2. FILAMENT & COST ESTIMATOR IN PRINT PLAN ---
  function renderFilamentEstimator() {
    const host = $('plan-filament-estimator');
    if (!host || !root.FilamentEstimator) return;

    const builds = (root.workspaceStore && root.workspaceStore.value && root.workspaceStore.value.builds) || [];
    if (!builds.length) {
      host.innerHTML = '';
      return;
    }

    const lang = getLang();
    const t = copy[lang];

    const result = root.FilamentEstimator.estimate({
      builds,
      material: 'PLA',
      spoolPriceCAD: 22,
      printerType: 'bambuCoreXY'
    });

    host.innerHTML = `
      <div style="background:#f7f9f5; border:1px solid #d8e2d6; border-radius:8px; padding:16px 20px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <h4 style="margin:0; font-size:13px; font-weight:700; color:#1f3322;">⚖️ ${t.filamentTitle}</h4>
          <span style="font-size:11px; background:#e2ecd9; color:#234b28; padding:3px 8px; border-radius:4px; font-weight:600;">15% Infill · Standard PLA</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
          <div style="background:#fff; border:1px solid #e1e7dc; border-radius:6px; padding:10px 12px;">
            <span style="font-size:10px; color:#666; display:block;">${t.totalFilament}</span>
            <strong style="font-size:20px; color:#18261a; font-family:monospace;">${result.totalGrams} g</strong>
            <span style="font-size:11px; color:#888;">(~${result.totalKg} kg)</span>
          </div>
          <div style="background:#fff; border:1px solid #e1e7dc; border-radius:6px; padding:10px 12px;">
            <span style="font-size:10px; color:#666; display:block;">${t.spoolsNeeded}</span>
            <strong style="font-size:20px; color:#c2410c; font-family:monospace;">${result.spoolsNeeded} 卷 / spools</strong>
            <span style="font-size:11px; color:#888;">(1kg / 卷)</span>
          </div>
          <div style="background:#fff; border:1px solid #e1e7dc; border-radius:6px; padding:10px 12px;">
            <span style="font-size:10px; color:#666; display:block;">${t.estCost}</span>
            <strong style="font-size:20px; color:#15803d; font-family:monospace;">$${result.estimatedCostCAD}</strong>
            <span style="font-size:11px; color:#888;">CAD @ $22/kg</span>
          </div>
          <div style="background:#fff; border:1px solid #e1e7dc; border-radius:6px; padding:10px 12px;">
            <span style="font-size:10px; color:#666; display:block;">${t.printHoursCoreXY}</span>
            <strong style="font-size:20px; color:#2563eb; font-family:monospace;">~${result.printTime.hours} h</strong>
            <span style="font-size:11px; color:#888;">(~${result.printTime.days} 天 / days)</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- 3. PARAMETRIC 3D LABEL MAKER UI ---
  function renderLabelMaker() {
    const container = $('labelmaker-container');
    if (!container || !root.LabelCustomizer) return;

    const lang = getLang();
    const t = copy[lang];

    container.innerHTML = `
      <div style="max-width:680px; background:#fff; border:1px solid #d7d9ce; border-radius:8px; padding:24px; margin:0 auto;">
        <h3 style="margin:0 0 8px; font-size:20px;">🏷️ ${t.labelTitle}</h3>
        <p style="font-size:13px; color:var(--muted); line-height:1.7; margin:0 0 20px;">${t.labelDesc}</p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px;">${t.labelText}</label>
            <input type="text" id="custom-label-input" value="M4 SCREWS" maxlength="14" style="width:100%; padding:10px 14px; font-size:16px; font-family:monospace; font-weight:700; text-transform:uppercase; border:1px solid #ccc; border-radius:5px;" oninput="VaultForgeUI.previewLabelText(this.value)">
          </div>

          <div>
            <label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px;">${t.labelPreset}</label>
            <select id="custom-label-preset" style="width:100%; padding:10px;" onchange="VaultForgeUI.previewLabelText()">
              <option value="standard">${t.standardPreset}</option>
              <option value="compact">${t.compactPreset}</option>
              <option value="wide">${t.widePreset}</option>
            </select>
          </div>

          <!-- Visual 2D/3D Label Preview -->
          <div style="background:#191c1e; padding:30px; border-radius:8px; display:grid; place-items:center; margin:10px 0;">
            <div id="label-visual-badge" style="background:#2d332d; border:2px solid #5a665a; border-radius:4px; padding:8px 18px; color:#4ade80; font-family:monospace; font-weight:800; font-size:18px; letter-spacing:2px; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              M4 SCREWS
            </div>
            <span style="color:#888; font-size:11px; margin-top:8px;">Standard 50mm × 18mm · Watertight 3D Binary STL</span>
          </div>

          <button type="button" class="btn-export-pdf" onclick="VaultForgeUI.downloadLabel()" style="padding:14px 20px; font-size:14px; background:#15803d; border-color:#166534; justify-content:center;">
            ${t.downloadLabel}
          </button>
        </div>
      </div>
    `;
  }

  // Public API helpers for buttons and interactions
  root.VaultForgeUI = {
    init() {
      renderTowerStacker();
      renderLabelMaker();
      renderFilamentEstimator();

            // Hook up 3D Exploded View slider in review panel
      const slider = $('assembly-explode-slider');
      const valBadge = $('assembly-explode-value');
      const notes = $('assembly-stage-notes');

      if (slider) {
        slider.addEventListener('input', () => {
          const val = Number(slider.value) || 0;
          if (valBadge) valBadge.textContent = `${val}%`;
          if (notes) {
            const lang = getLang();
            if (val === 0) {
              notes.textContent = lang === 'zh'
                ? '完全紧凑装配状态 (Fully Assembled) · 螺栓紧固 0mm · 抽屉完全闭合'
                : 'Fully Assembled (0mm explode) · All fasteners torqued · Drawers locked';
            } else if (val === 100) {
              notes.textContent = lang === 'zh'
                ? '极限机械爆炸视图 (100% Exploded) · 抽屉外滑 +180mm · 导轨分离 ±96mm · 顶板升起 +120mm · 紧固件悬浮 +240mm'
                : '100% Exploded View · Drawers extended +180mm · Side runners spaced ±96mm · Roof detached +120mm · Fasteners suspended +240mm';
            } else {
              const dFacade = Math.round(180 * (val / 100));
              const dRunners = Math.round(96 * (val / 100));
              notes.textContent = lang === 'zh'
                ? `拆解展开中 (${val}%) · 抽屉外滑 +${dFacade}mm · 导轨间隙 ±${dRunners}mm · 螺栓浮出`
                : `Deconstructing (${val}%) · Drawer offset +${dFacade}mm · Runner clearance ±${dRunners}mm · Fasteners floating`;
            }
          }
        });
      }

      // Hook up 3MF project download in print plan
      $('plan-export-3mf')?.addEventListener('click', () => {
        const builds = (root.workspaceStore && root.workspaceStore.value && root.workspaceStore.value.builds) || [];
        if (!builds.length) return;
        if (root.SlicerProject) {
          root.SlicerProject.exportProject({ builds, projectName: 'VaultForge_MultiPlate_Project' });
        }
      });

      // Hook up 3MF single download in config panel
      $('config-quick-export-3mf')?.addEventListener('click', () => {
        if (!root.BuildPlan || !root.SlicerProject) return;
        const selected = { system: root.currentSystem || 'drawers', configuration: root.readConfiguration ? root.readConfiguration() : {} };
        const build = root.BuildPlan.entry({ ...selected, id: 'current', count: 1 });
        root.SlicerProject.exportProject({ builds: [build], projectName: `VaultForge_${build.system}_${build.configuration.width}${build.configuration.depth}` });
      });

      // Update filament whenever builds change
      root.addEventListener('vaultchange', () => {
        renderFilamentEstimator();
      });
    },

    updateLanguage() {
      renderTowerStacker();
      renderLabelMaker();
      renderFilamentEstimator();
    },

    // Stacker controls
    addTier() {
      stackerState.tiers.push({ system: 'drawers', height: '1F' });
      renderTowerStacker();
    },
    removeTier(index) {
      if (stackerState.tiers.length > 1) {
        stackerState.tiers.splice(index, 1);
        renderTowerStacker();
      }
    },
    updateTier(index, height) {
      if (stackerState.tiers[index]) {
        stackerState.tiers[index].height = height;
        renderTowerStacker();
      }
    },
    setStackerWidth(w) { stackerState.width = w; renderTowerStacker(); },
    setStackerDepth(d) { stackerState.depth = d; renderTowerStacker(); },
    setStackerBase(b) { stackerState.base = b; renderTowerStacker(); },
    setStackerRoof(r) { stackerState.roof = r; renderTowerStacker(); },
    setStackerHandle(h) { stackerState.hasTopHandle = h; renderTowerStacker(); },

    // Label maker controls
    previewLabelText(text) {
      const input = text !== undefined ? text : ($('custom-label-input')?.value || 'VAULT');
      const badge = $('label-visual-badge');
      if (badge) badge.textContent = String(input).toUpperCase().slice(0, 14) || 'VAULT';
    },
    downloadLabel() {
      const text = $('custom-label-input')?.value || 'VAULT';
      const preset = $('custom-label-preset')?.value || 'standard';
      if (root.LabelCustomizer) {
        root.LabelCustomizer.downloadSTL(text, { preset });
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.VaultForgeUI;
  }
})(globalThis);
