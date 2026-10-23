# VaultForge ⚡

> **Precision 3D Configurator, Slicer Project Compiler & Hardware Sourcing BOM for the USSA VAULT Modular Storage System**
> 
> 🌐 **Live Web App (Zero-Install, Runs in Browser)**: [https://hairuoliu.github.io/VaultForge/](https://hairuoliu.github.io/VaultForge/)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-brightgreen?style=flat-square&logo=github)](https://hairuoliu.github.io/VaultForge/)
[![Automated Tests](https://img.shields.io/badge/Tests-101_Passed-success?style=flat-square&logo=node.js)](https://github.com/HairuoLiu/VaultForge)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Dependency_Web--Native-blue?style=flat-square)](https://github.com/HairuoLiu/VaultForge)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local_Sandboxed-success?style=flat-square)](https://github.com/HairuoLiu/VaultForge)
[![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)](LICENSE)

[简体中文](README.md) | **English**

---

## 🌟 Why VaultForge?

The **USSA VAULT** is a legendary open-source, heavy-duty 3D-printable modular storage system. However, bringing it to life in a physical workshop poses significant friction for makers:
- **733+ Disorganized STL Files**: Finding the exact matching module, box, facade, runners, and lids across dozens of folders is error-prone.
- **Strict Fastener Constraints**: Different parts demand countersunk M4 vs socket cap M6 bolts. Selecting the wrong head style jams drawer movement.
- **Tedious Multi-Plate Slicing**: Manually assigning perimeters, infill, and supports across 15+ individual parts per drawer takes hours.

`VaultForge` bridges the gap between **digital 3D configuration and physical workshop fabrication**.

![VaultForge Workspace](assets/screenshots/workspace.png)

---

## 🚀 Six Core Capabilities

### 1. 🖨️ Precision Hardware BOM & A4 Printable PDF Exporter
- **Countersunk Head Enforcement**: Explicitly enforces **M4 × 14mm Countersunk Flat Head** screws for drawer facades to prevent jamming; includes pull-out rod M6 × 35mm hex bolt errata.
- **One-Click A4 PDF Spec Sheet**: Print-ready `@page A4 portrait` layout with checkboxes, net quantities, and application citations.
- **Toronto & North America Sourcing Intelligence**: Direct recommendations for AliExpress assortment kits and local over-the-counter procurement (e.g. Brafasco in Toronto).

### 2. 📦 Bambu Studio & OrcaSlicer Multi-Plate Project Exporter (.3mf)
- **Intelligent Plate Partitioning**:
  - **Plate 1 (Structure & Boxes)**: 0.20mm Standard · 15% Infill · Support-free orientation.
  - **Plate 2 (Facades & Aesthetic Roofs)**: 0.16mm Optimal · 3 Walls for fine surface finish.
  - **Plate 3 (Runners & High-Strength Gears)**: 0.12mm Precision · 4~5 Walls / 50% Infill for mechanical durability.
- Generates standard OPC-compliant `.3mf` bundles complete with slicer setup instructions.

### 3. 💥 3D Exploded View & Interactive Assembly Simulation
- Interactive **0% to 100% mechanical explosion slider** inside Three.js WebGL viewport.
- Uses cubic ease-out curves to visualize spatial relationships between facade, drawer box, runners, and screws.

### 4. 🏗️ Tower Stacker & Vertical Space Clearance Planner
- Stack multiple drawers and toolboxes vertically to calculate exact assembled height (in mm).
- **Collision Checking**: Real-time validation against **IKEA ALEX desk clearance (660mm)**, **standard workbenches (720mm)**, **KALLAX cubes (335mm)**, and car trunks.

### 5. ⚖️ Filament Weight, Print Time & Cost Budgeting Engine
- Built-in material density models for PLA (1.24g/cm³), PETG (1.27g/cm³), and ABS/ASA with infill adjustments.
- Compares high-speed CoreXY printers (Bambu Lab X1/P1/A1, Creality K1, Voron) vs standard bedslingers.
- Estimates total grams, 1kg spool purchase count, and material budget in CAD ($).

### 6. 🏷️ Parametric 3D Drawer Label Generator (Watertight STL)
- Generates 3D-printable custom binary STL labels (50 × 18mm standard slot).
- Type custom text to create embossed/debossed dual-color lettering ready for direct printing.

---

## ⚡ Quick Start

### Option 1: Web App (Recommended · Zero Install)
Open in any modern desktop or mobile browser: [https://hairuoliu.github.io/VaultForge/](https://hairuoliu.github.io/VaultForge/)
- All processing is sandboxed inside your browser via the File System Access API. **No files are uploaded to any server. 100% private.**

### Option 2: Local Offline Launcher
1. Clone the repository:
   ```bash
   git clone https://github.com/HairuoLiu/VaultForge.git
   ```
2. Double-click `启动预览.bat` (Windows) or run `python3 scripts/preview-server.py`.
3. Opens at `http://127.0.0.1:8765/` with local file explorer reveal capabilities.

---

## 🧪 Automated Test Suite

Pure vanilla JavaScript architecture with zero heavy build tools. 101 automated unit tests:
```bash
node --test tests/*.test.cjs
```
- Status: **101 passed / 0 failed**.

---

## 🙏 Credits & Acknowledgments

- **USSA Design**: For creating the original, rugged, and brilliant VAULT modular storage system.
- **WangNingkai/Vault-Workbench**: For the early foundational file index baseline.
- **Three.js**: WebGL 3D rendering engine.

---

## 📄 License

Open-sourced under the [MIT License](LICENSE). Contributions, issues, and PRs from makers worldwide are welcome!
