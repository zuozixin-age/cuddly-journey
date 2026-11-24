# Prompt & Execution Protocol (`PROMPT_PROTOCOL.md`)

## 执行模式说明
- 依据《超越重力：天空的代价》A–I 提示词体系，本项目原本规划为 Phase 0 至 Phase 9 分阶段推进。
- 本次用户明确指令：“按提示词进行，但是不要中断，你全自动”。因此按 Phase 0→9 逻辑顺序在同一自动流水线中完整交付，并严格保留所有 P0 红线与证据门禁。

## 阶段覆盖映射
- **Phase 0（免费能力与边界）**：核实纯静态 Vite/React/TS 构建路径，建立 `docs/` 治理文档，排除一切运行时 AI API 与付费依赖。
- **Phase 1（视觉系统与骨架）**：建立 `tokens.css`（`#0A0E13` / `#B8C1C8` / `#F2EFE7` / `#D99A45` / `#B94C44`）、3-zone 顶栏、核心状态契约 `src/app/store.ts`、低动效/低性能开关与 404 路由回退。
- **Phase 2（全量静态安全内容）**：建立 `src/safety/types.ts`、`sources.ts`、`data.ts`、`queries.ts`，覆盖 5 阶段、6 子系统、6 条完整 `RiskRecord`、FHA/FMEA/FTA/STPA 与 7 层防御验证矩阵。
- **Phase 3（Act 0 片头）**：单向主光剪影 + 可随时中断/跳过的单时间线 + 低动效静态海报回退。
- **Phase 4（Act II 机器内部）**：分层 2D 概念解剖 SVG（能源流 + 控制流 + 6 热点不遮挡）+ 低性能模式全功能降级。
- **Phase 5–6（Act III 安全分析工作台与故障传播）**：三大教学情境（`EX-01/02/03`）数据驱动传播 SVG + FHA/FMEA/FTA/STPA 共用 ID 联动。
- **Phase 7（统一状态与导航）**：唯一 `appReducer` + Hash 路由前后退同步 + 焦点管理 + 无竞争动画。
- **Phase 8（审计与自动化验证）**：`node:test` 单元测试 + `tsc --noEmit` + `vite build` + `dist/` 密钥与外链扫描 + Playwright 无头浏览器桌面/移动端实测与截屏复核。
- **Phase 9（部署交付准备）**：根 `index.html`、`vite.config.ts` 相对 `base: './'`、`.github/workflows/deploy-pages.yml` 与完整 `README.md` 验收清单。
