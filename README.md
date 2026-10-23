# VaultForge ⚡

> **Precision 3D Configurator, Slicer Project Compiler & Hardware Sourcing BOM for the USSA VAULT Modular Storage System**
> 
> 🌐 **免安装全球网页版（浏览器即开即用）**：[https://hairuoliu.github.io/VaultForge/](https://hairuoliu.github.io/VaultForge/)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-brightgreen?style=flat-square&logo=github)](https://hairuoliu.github.io/VaultForge/)
[![Automated Tests](https://img.shields.io/badge/Tests-101_Passed-success?style=flat-square&logo=node.js)](https://github.com/HairuoLiu/VaultForge)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Dependency_Web--Native-blue?style=flat-square)](https://github.com/HairuoLiu/VaultForge)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local_Sandboxed-success?style=flat-square)](https://github.com/HairuoLiu/VaultForge)
[![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)](LICENSE)

**简体中文** | [English](README.en.md)

---

## 🌟 为什么需要 VaultForge？

流行的 **USSA VAULT** 是开源社区备受赞誉的 3D 打印重型模块化收纳柜系统。然而，要真正把它落地打印并组装出来，创客们往往面临巨大挑战：
- **上百个无序 STL**：在 733 个模型文件中挑出特定尺寸的箱体、顶盖、把手极易漏印或错印；
- **五金规格繁复**：不同抽屉需要沉头 M4、杯头 M6，螺栓头型选错会导致抽屉卡死无法推拉；
- **多盘切片繁琐**：手动在切片软件中反复排版、分配层高支撑非常耗时。

`VaultForge` 是为此而生的**从三维数字设计到实体供应链组装的一站式制造工作台**。

![VaultForge 工作台](assets/screenshots/workspace.png)

---

## 🚀 六大核心功能体系

### 1. 🖨️ 智能五金采购单与标准 A4 导出引擎 (Purchase BOM PDF)
- **精准规格防坑**：严格区分 **M4×14mm 沉头平头螺钉**（与前面板平齐防卡死）与杯头螺丝；包含拉杆 M6×35mm 外六角勘误。
- **一键打印 / 另存为 PDF**：`@page A4 portrait` 纸张排版优化，提供复选框、净需用量计算与安装部位说明。
- **北美与多伦多采购指南**：包含 AliExpress 盒装套件推荐与多伦多本地工业五金（Brafasco）零买建议。

### 2. 📦 拓竹 / OrcaSlicer 多盘工程打包引擎 (3MF Project Compiler)
- **智能分盘算法**：
  - **Plate 1 (结构箱体)**：0.20mm 标准层高 · 15% 网格填充 · 无支撑快速成型。
  - **Plate 2 (外观与顶盖)**：0.16mm 细腻层高 · 3 圈外壁精致纹理。
  - **Plate 3 (导轨与高强度机构)**：0.12mm 高精度 · 4~5 圈加强壁厚（保证齿轮卡扣寿命）。
- 一键生成符合标准 OPC 规范的 `.3mf` / 切片工程包，带切片参数说明书。

### 3. 💥 交互式 3D 爆炸拆解装配仿真 (3D Exploded View)
- 在 Three.js WebGL 视口中提供 **0% ~ 100% 轴向机械爆炸拆解**。
- 采用三次缓动曲线（Cubic Ease-out），直观展示前面板、滑动抽屉盒、阻尼导轨与 4 颗螺钉的三维空间装配次序。

### 4. 🏗️ 柜塔自由堆叠高度与空间规划器 (Tower Stacker & Space Planner)
- 支持任意抽屉组合与 Sustainer 工具箱垂直堆叠，自动累加装配公差总高（mm）。
- **空间碰撞预检**：实时判定是否能塞入**宜家 ALEX 抽屉柜下（660mm）**、**标准书桌底（720mm）**、**KALLAX 储物格（335mm）** 及汽车后备箱。

### 5. ⚖️ 耗材用量、打印工时与成本预算引擎 (Filament & Cost Estimator)
- 预置 PLA (1.24g/cm³)、PETG (1.27g/cm³)、ABS/ASA 密度模型与不同填充率修正。
- 区分现代化高转速 CoreXY 打印机（拓竹 X1/P1/A1、创想 K1、Voron）与传统平台机工时预估。
- 自动计算总耗材克重、所需 1kg 耗材卷数与 CAD 物料成本。

### 6. 🏷️ 参数化 3D 抽屉铭牌生成器 (Parametric 3D Label Maker)
- 浏览器端直接生成标准 50×18mm 防水 3D 打印标签（Binary STL 格式）。
- 输入文字即可生成带双色换色打印高差的点阵凹凸文字，一键下载直接打印！

---

## ⚡ 快速使用指南

### 方式 1：线上网页版（推荐 · 零安装）
直接用现代浏览器打开：[https://hairuoliu.github.io/VaultForge/](https://hairuoliu.github.io/VaultForge/)
- 支持选型配置、3D 预览、柜塔规划与一键导出采购清单。
- 点击“选择 Vault 文件夹”后，浏览器通过安全 File System Access API 在本地读取你的 3D 模型，**100% 隐私安全，文件绝不上传云端**。

### 方式 2：本地离线运行
1. 克隆或下载本仓库：
   ```bash
   git clone https://github.com/HairuoLiu/VaultForge.git
   ```
2. 双击打开 `启动预览.bat`（Windows）或运行 `python3 scripts/preview-server.py`。
3. 浏览器会自动打开 `http://127.0.0.1:8765/`，支持本地文件快速定位。

---

## 🧪 自动化测试套件

本项目采用纯原生 JavaScript 开发，无庞大的打包工具包袱。包含 101 项单元测试：
```bash
node --test tests/*.test.cjs
```
- 测试覆盖率：101 passed / 0 failed。

---

## 🙏 开源致谢与声明 (Credits & Acknowledgments)

- **USSA Design**：感谢 USSA 团队设计出如此惊艳、扎实且富有工业美感的 VAULT 模块化收纳开源系统。
- **WangNingkai/Vault-Workbench**：感谢原作者提供的早期基础文件索引逻辑与灵感。
- **Three.js**：强大的 WebGL 3D 渲染引擎。

---

## 📄 开源许可证

本项目采用 [MIT 许可证](LICENSE) 开源。欢迎全球 3D 打印爱好者提交 Issue 与 Pull Request！
