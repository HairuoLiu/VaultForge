# Vault Workbench

**简体中文** | [English](README.en.md)

USSA VAULT 的非官方本地组装工作台：查找组件、预览 STL、阅读说明书、整理打印清单。无需安装应用或启动服务，模型和文档不上传。

![Vault 组装工作台](docs/screenshots/workspace.png)

## 快速开始

1. 下载并解压项目，保留 `index.html` 和完整的 `assets/` 文件夹。
2. 用浏览器打开 `index.html`，点击 **Choose Vault folder（选择 Vault 文件夹）**。
3. 选择已解压的 Vault 资源文件夹，开始配置组件。页面右上角可切换中英文。

资源包需自行准备，请保留内部目录和文件名：

```text
My Vault/
├── 01. DRAWERS/
├── 02. SUSTAINERS/
├── 03. MODIFICATIONS/
└── 说明书 PDF
```

**刷新后需重新选择资源文件夹。** 浏览器存储可用时，语言、配置和打印清单会自动保留；资源更新后需重新选择扫描。

## 核心功能

- **组件配置**：筛选抽屉、承托收纳盒和改造件，选择锁匙、顶盖及内部方案。
- **3D 预览**：旋转、缩放 STL，查看尺寸，保存文件副本。
- **说明书**：阅读本地 PDF；缺少当前语言版本时，自动使用另一语言版本。
- **打印清单**：保存命名方案，合并 STL 与五金数量，记录整批进度，导出 CSV。

## 打印清单

选好配置 → 填写模块数量 → **加入打印清单** → 补齐布局数量 → **导出 CSV**。

- 数量按 **STL 打印份数**计算，文件内已配对的零件不再翻倍。
- 分隔板等布局数量按每模块填写，不需要的填 `0`；未填齐时无法导出。
- 汇总包含已完成方案；修改数量会将该批进度重置为「待打印」。
- 清单保存在当前浏览器，清除浏览器数据可能丢失；CSV 暂不支持导入。

[查看打印清单截图](docs/screenshots/print-plan.png)

## 使用说明

已验证桌面 Chrome 的本地打开模式；其他浏览器尚未完成同等验证。3D 预览需要 WebGL 2，尺寸按毫米解释。PDF 无法内嵌显示时，可新窗口打开或下载。

请一次选择一份资源包。缺失或冲突的文件会显示提示；「保存副本」不会覆盖原文件。五金数量为说明书参考值，组装前请核对实际安装需求。

## 开发与测试

原生 HTML / CSS / JavaScript，使用 Three.js 和 Web Worker。在支持全局 `File`、`Blob`、`fetch` 的 Node.js 环境中，进入 `workbench/` 运行：

```bash
node --test tests/*.test.cjs
```

测试自动查找当前目录或上一级的资源包，也可通过 `VAULT_RESOURCE_ROOT` 指定路径。未提供资源包时，跳过三个真实资源校验用例。

修改 `assets/stl-worker.js` 后，按 [构建脚本](scripts/build-stl-vendor.cjs) 中的说明重新打包预览引擎。

## 来源与许可

本项目与 USSA Design 无隶属关系。VAULT 模型、说明书及产品图片来源于 [USSA Design](https://www.ussadesign.com/pages/vault)，原始资源包不随网页代码分发。

第三方许可：[Three.js](assets/vendor/three-LICENSE.txt) · [Geist](assets/geist-LICENSE.txt)。项目代码暂未提供独立许可证，第三方资源保留其原有权利。
