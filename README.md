# BEYOND GRAVITY / 《超越重力：天空的代价》

> **课程作业-2 · eVTOL 系统安全工程交互式静态叙事网站**
>
> **免责声明**：本项目是课程教学研究，并非 Joby Aviation 或 FAA/EASA 的官方安全评估。公开资料只能说明原文确有表述，不可据此证明全部设计的真实安全表现。研究对象暂定为 Joby Aviation S4 电动垂直起降飞行器（待与上一次正式课程作业原件核对）。

## 核心特性

- **100% 纯静态离线运行**：无服务端、无数据库、无运行时 Gemini/LLM 调用、无 API Key、无外部字体或图片 CDN 依赖。
- **独立视觉身份（The Cost of Flight）**：深石墨 `#0A0E13`、铝灰 `#B8C1C8`、暖白 `#F2EFE7`、警示琥珀 `#D99A45`、危险深朱红 `#B94C44`；遵循从“黑暗中的承诺”走向“光照下的工程透明”的六幕叙事节奏。
- **六幕完整交互体验**：
  - **ACT 0 · THE AWAKENING（觉醒）**：单向主光剪影揭示，任意帧可点击“进入分析”或按 `Escape` 跳过片头。
  - **ACT I · THE ASCENT（升空）**：五阶段飞行剖面 SVG 与姿态示意，支持点击与左右方向键切换，实时同步阶段关联风险。
  - **ACT II · INSIDE THE MACHINE（机器内部）**：分层 2D 概念解剖图（能源流 + 飞控闭环 + 六大子系统无遮挡热点），低性能模式无缝降级。
  - **ACT III · THE EDGE OF FAILURE（失效边界）**：`EX-01`（推进链异常）、`EX-02`（电池热异常）、`EX-03`（传感器/飞控错误）数据驱动风险传播图 + 完整可交互 **FHA / FMEA / FTA / STPA** 工作台，全方法共用稳定 ID。
  - **ACT IV · ENGINEERING TRUST（工程建立信任）**：七层纵深防护机制 + 需求—验证追溯矩阵（`REQ-01` 至 `REQ-08`），明确展示独立验证方法与剩余不确定性。
  - **ACT V · BEYOND GRAVITY（超越重力）**：已知公开事实 `[F]` / 有边界工程假设 `[A/D]` / 未核实清单 `[U]` 三栏汇总，支持一键离线复制引用与导出 `.md` 摘要。
- **无障碍与性能控制**：自动响应 `prefers-reduced-motion`，提供低动效模式、低性能 2D 精简模式、默认静音的可选本地提示音、完整键盘导航与 `404` 路径安全回退。

## 本地开发与验证

```bash
npm install
npm run lint        # TypeScript 类型检查
npm test            # 运行状态机与安全数据完整性单元测试 (node:test)
npm run dev         # 启动本地开发服务器 (http://localhost:3000)
npm run build       # 构建生产静态产物至 dist/
```

### 静态产物安全边界自检

```bash
test -f index.html && test -f dist/index.html
grep -rnE "GEMINI_API_KEY|@google/genai|generativelanguage\.googleapis\.com|fonts\.googleapis\.com" dist || echo "CLEAN: zero runtime AI or external font CDN"
```

## GitHub Pages 零付费部署步骤

1. 将完整源代码推送至你的 **Public** GitHub 仓库（确保包含根目录 `index.html`、`package.json`、`.github/workflows/deploy-pages.yml`，且不提交 `.env` 或任何密钥）。
2. 打开仓库 `Settings → Pages → Build and deployment`，将 Source 设为 **GitHub Actions**。
3. 推送到 `main` 分支（或手动触发 `Deploy Static Site to GitHub Pages` workflow），Actions 将自动执行 `npm run lint`、`npm test`、`npm run build` 与 `dist/` 密钥扫描，并将静态 `dist/` 部署至 `https://<username>.github.io/<repo>/`。
4. 在浏览器匿名窗口打开公开链接，验证无需登录、刷新深层章节（如 `#act-3`）正常、移动端与桌面交互无 404。
5. 由作者本人在课程指定飞书收集页核对时区（`2026-11-26 18:00`）并提交仓库 URL 与 Pages URL。

## 治理文档索引

- `docs/DECISIONS.md` — 架构与技术决策记录
- `docs/SOURCES.md` — 公开监管资料与证据索引（`[S1]`–`[S9]`）
- `docs/FACT_CHECK.md` — 事实分级与防编造核查记录
- `docs/QA_LOG.md` — 单元测试、构建扫描与浏览器实测日志
- `docs/PROMPT_PROTOCOL.md` — Phase 0–9 执行与验收映射
