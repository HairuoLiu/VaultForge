# Vault Workbench

[简体中文](README.md) | **English**

An unofficial local assembly workspace for USSA VAULT. Choose a size, check parts and hardware, preview models, and organize your print plan.

Plain HTML / CSS / JavaScript, with no frontend dependencies to install. STL files, manuals, and folder indexing are handled locally. Supply your own original resource pack.

![Vault Workbench: size configuration, roof options, and handle hardware](assets/screenshots/workspace.png)

## Quick start

1. Download and extract this repository, keeping `index.html`, `assets/`, and `scripts/` in their original relative locations.
2. Open `index.html` in desktop Chrome. Use the top-right button to switch between English and Chinese.
3. Click **Choose Vault folder** and select the root of your extracted resource pack.
4. Follow **Folder → Configure → Review parts → Print plan**. You can browse sizes without a resource pack.

Example resource folder (keep the original folder names and filenames):

```text
My Vault/
├── 01. DRAWERS/
├── 02. SUSTAINERS/
├── 03. MODIFICATIONS/
├── 01_Instructions Manual.pdf
└── …other manuals and images
```

### Launch with a local server

To **show the original file in its folder** from the 3D preview, install Python 3.8+ and run the appropriate launcher:

| Platform | Launch |
| --- | --- |
| macOS | Double-click `启动预览.command` |
| Windows | Double-click `启动预览.bat` |
| Terminal | `python3 scripts/preview-server.py` |

The default address is `http://127.0.0.1:8765/index.html`. Place the resource pack in the project directory or its parent. For another location, specify its path and select that same folder on the page:

```bash
python3 scripts/preview-server.py --resource-root "/path/to/Vault"
```

**Show in folder** selects the original STL in Finder / File Explorer. This button is hidden when opening the HTML file directly.

## Features

| Feature | What it does |
| --- | --- |
| Guided configuration | Choose a drawer or case, then set its size, roof, interior, and applicable optional parts |
| Grouped parts review | Group required files by body, mechanism, roof, and interior, expanded by default; show file counts, print quantities, and notes |
| Hardware and assembly | Show specifications, quantities per module, uses, and manual pages; selecting the Grid roof handle also adds two M6 × 50 mm bolts |
| 3D preview | Rotate, zoom, inspect model dimensions, and save copies; the local server also supports locating the original file |
| Accessories and modifications | Find matching baseplates, dividers, and alternative parts; browse bases, wheels, handles, and more in eight modification categories |
| Manuals | Choose from five guides by purpose, check local availability, jump to assembly pages, and fall back to another language when needed |
| Print plan | Save multiple builds, combine STL and hardware quantities, enter divider quantities, track progress, and export CSV |

## Screenshots

These screenshots show the current Chinese interface. Click an image to view it at full size.

| Grouped parts and hardware | Local STL preview |
| --- | --- |
| ![Parts review: body, runners, roof handle, and matching hardware](assets/screenshots/parts-review.png) | ![3D preview: model, dimensions, and Show in folder button](assets/screenshots/stl-preview.png) |

| Modifications by purpose | Manuals and assembly guides |
| --- | --- |
| ![Eight modification categories with file counts](assets/screenshots/modifications.png) | ![Five manuals, a configuration recommendation, and the local PDF reader](assets/screenshots/manuals.png) |

<details>
<summary>View the print plan screenshot</summary>

![Print plan: builds, module counts, and combined parts](assets/screenshots/print-plan.png)

</details>

## Usage notes

- **Counting quantities:** File counts and print quantities are shown separately. `×2` means two copies of the STL; parts already paired inside a file are not doubled. Enter layout-dependent quantities such as dividers manually, using `0` for unused parts. Complete these quantities before exporting.
- **Adding optional parts:** **Use this option** updates the current configuration. Click **Add to print plan** afterward to save it. Browsing accessories does not add them, and changing the current configuration does not overwrite saved builds.
- **Hardware scope:** Drawer and case hardware totals scale with the number of modules. Modification hardware is listed separately per wheel, foot, or other assembly. Unspecified installation quantities remain marked for review, with reminders in the relevant build and CSV export.
- **Saving and restoring:** Language, configurations, and the print plan are saved in the current browser when storage is available. Browsers with directory access can remember the folder; click **Reconnect folder** if permission is needed again. Other browsers require a new selection. Use **Rescan folder** after resource updates; disconnecting forgets the folder.
- **Data boundaries:** Different browsers, opening methods, or ports use separate browser storage. Clearing browser data may erase your plan. Export a CSV for your records; CSV import is not currently supported. **Save a copy** does not overwrite the original file.

<details>
<summary>Browser, port, and file troubleshooting</summary>

- Verified in desktop Chrome; other browsers have not received equivalent testing. 3D preview requires WebGL 2, and dimensions are interpreted as millimeters.
- If a PDF cannot be displayed inline, open it in a new tab or download it.
- Select one resource pack at a time. Missing files and filename conflicts are flagged; keep the original folder structure and filenames.
- If the port is occupied, use `--port ANOTHER_PORT`. Plans saved at the old port are not migrated automatically; use `--port ORIGINAL_PORT` to revisit and export them.
- Refresh the page after updating the workbench. If an old server is still running, stop it and restart the launcher.

</details>

## Development and tests

No build step is needed to run the project. The 3D preview uses Three.js and a Web Worker. Tests require Node.js with global `File`, `Blob`, and `fetch`, plus Python 3.

Run from the repository root:

```bash
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

After installing `agent-browser`, run browser regressions with an isolated temporary browser profile:

```bash
node tests/assembly-readiness.browser.cjs /path/to/agent-browser
```

See [tests/](tests/) for other scenarios: configuration guidance, accessories, manuals, plan editing, and folder restoration. Resource validation checks the current directory and its parent, or the path set with `VAULT_RESOURCE_ROOT`. These checks are skipped when no resource pack is available.

After changing `assets/stl-worker.js`, rebuild the preview engine as described in the [build script](scripts/build-stl-vendor.cjs). When reporting an issue, include your browser, how you opened the app, the selected configuration, and steps to reproduce it.

## Credits and licensing

This project is not affiliated with USSA Design. VAULT models, manuals, and product images originate from [USSA Design](https://www.ussadesign.com/pages/vault). Original STL and PDF files are not distributed with this repository; original design content shown in screenshots belongs to its respective rights holders.

Third-party licenses: [Three.js](assets/vendor/three-LICENSE.txt) · [Geist](assets/geist-LICENSE.txt). No separate project code license has been provided.
