# Vault Workbench

[简体中文](README.md) | **English**

An unofficial local workspace for USSA VAULT: find parts, preview STL models, read manuals, and plan your prints. No app installation or server required. Models and documents stay on your device.

![Vault assembly workspace](docs/screenshots/workspace.png)

## Quick start

1. Download and extract the project, keeping `index.html` and the complete `assets/` folder together.
2. Open `index.html` in your browser and click **Choose Vault folder**.
3. Select your extracted Vault resource folder and configure your parts. Use the button at the top right to switch between English and Chinese.

Supply your own resource pack and keep its internal folder structure and filenames:

```text
My Vault/
├── 01. DRAWERS/
├── 02. SUSTAINERS/
├── 03. MODIFICATIONS/
└── Manual PDFs
```

**Select the resource folder again after refreshing.** Language, configurations, and your print plan are saved when browser storage is available. Reselect the folder to scan updated resources.

## Features

- **Part configuration:** filter drawers, sustainers, and modifications; choose keys, roofs, and interior layouts.
- **3D preview:** rotate and zoom STL models, inspect dimensions, and save file copies.
- **Manuals:** read local PDFs with automatic fallback to the other available language.
- **Print plan:** save named builds, combine STL and hardware quantities, track batch progress, and export CSV.

## Print plan

Choose a configuration → enter the module count → **Add to print plan** → complete layout quantities → **Export CSV**.

- Quantities count **STL copies**. Parts already paired inside one file are not doubled.
- Enter divider and other layout quantities per module; use `0` for unused files. Complete all quantities before exporting.
- Totals include completed builds. Changing quantities resets that batch to “To print”.
- Plans are saved in this browser and may be lost if browser data is cleared. CSV import is not supported yet.

[View the print plan screenshot](docs/screenshots/print-plan.png)

## Usage notes

Local-file mode has been verified in desktop Chrome; other browsers have not received equivalent testing. 3D previews require WebGL 2, and dimensions are interpreted as millimeters. If a PDF cannot be displayed inline, open it in a new tab or download it.

Select one resource pack at a time. Missing or conflicting files are flagged. Saving a copy does not overwrite the original. Hardware quantities follow manual references; check your actual installation requirements before assembly.

## Development and tests

Plain HTML / CSS / JavaScript with Three.js and Web Workers. In a Node.js environment with global `File`, `Blob`, and `fetch`, run from `workbench/`:

```bash
node --test tests/*.test.cjs
```

Tests locate the resource pack in the current or parent directory. Set `VAULT_RESOURCE_ROOT` to use another location. Without a resource pack, the three archive validation tests are skipped.

After changing `assets/stl-worker.js`, rebuild the preview engine using the instructions in the [build script](scripts/build-stl-vendor.cjs).

## Credits and licensing

This project is not affiliated with USSA Design. VAULT models, manuals, and product images originate from [USSA Design](https://www.ussadesign.com/pages/vault). The original resource pack is not distributed with the web code.

Third-party licenses: [Three.js](assets/vendor/three-LICENSE.txt) · [Geist](assets/geist-LICENSE.txt). No separate project code license has been provided; third-party resources retain their original rights.
