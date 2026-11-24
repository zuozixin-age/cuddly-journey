# QA & Performance Audit Log (`QA_LOG.md`)

> 记录日期：2026-11-20
> 审计原则：仅记录实际执行的命令与真实观测结果；未在真实外部公网或特定真机上测得的数据明确标为“未执行”。

## 1. 单元测试（`node:test` via `tsx --test`）
- **执行命令**：`npm test`（对应 `tsx --test src/tests/*.test.ts`）
- **结果**：**28 / 28 通过（0 失败，耗时 ~230ms）**。
- **覆盖项**：
  - **3D 电影化运镜调度（`cinemaChoreography.test.ts`，6 项）**：
    - Act 0 地面就绪停机坪状态、起落架放下、实心外壳与摄影棚地面校准。
    - Act I 连续平滑倾转 6 组短舱（0° 巡航至 88° 垂直爬升）与起落架收起。
    - Act II X-ray 剖视激活，依据所选子系统自动平滑聚焦点（电池仓/航电/机翼/倾转总成）。
    - Act III 故障节点隔离、故障光晕高亮与剖视覆盖。
    - Act IV 7 重纵深防御同心光环（L01–L07）依层级阶梯点亮。
    - Act V 黎明摄影棚高调金晨光转换、零故障伪影。
  - **连续滚动引擎（`scrollDirector.test.ts`，6 项）**：
    - 数值边界安全 `clamp01`（抗 NaN 与 Infinity）。
    - 视口区间滚动映射 `computeStickyProgress`（0.0 至 1.0 连续映射）。
    - 全画卷总进度计算 `computeDocumentProgress`。
    - 35% 焦点准线跨幕裁决 `resolveActiveChapterFromRects`。
    - 故事节拍离散映射 `resolveBeatIndexFromProgress`。
    - 五阶段平滑插值 `interpolateFlightAircraft`（连续坐标与短舱角度）。
  - **公开权威数据与合规标注（`safetyData.test.ts`，8 项）**：
    - 全部 8 条公开来源具备 `https://` 链接与 `2026-11-20` 访问日期。
    - 6 条 `RiskRecord` 来源 ID、防护层 ID 完整闭合，明确标注“可能性未定，不给出定量风险等级”，零虚构概率。
    - `EX-01 / EX-02 / EX-03` 均包含 6 阶段完整传播链；FTA 故障树无环且全部关联有效风险 ID。
    - 5 个飞行阶段均包含 4 维定性非数值约束剖面（`高/中/低`），不虚构数值功率或升阻比曲线。
    - 36 项交付验收卡（`P0(8) + P1(10) + P2(10) + P3(8)`）条目数与编号完整性校验通过。
    - FHA/FMEA/STPA 筛选、排序及空状态结果正确；离线引用导出包含法定教学免责声明。
  - **状态机与鲁棒性（`safetyStore.test.ts`，8 项）**：
    - 连续 10 次跳过片头、50 次快速切幕、20 次飞行阶段切换、30 次故障情境切换、无效 Hash 404 回退及无障碍模式切换均状态一致。

## 2. 静态构建与安全扫描
- **TypeScript 校验**：`npm run lint` (`tsc --noEmit`) — **通过（0 错误）**。
- **生产构建**：`npm run build` (`vite build`, `base: './'`) — **通过（耗时 ~600ms，0 告警）**。
- **产物与分包校验**：
  - 仓库根目录 `index.html`：存在。
  - 构建根目录 `dist/index.html`：存在。
  - 构建分包策略：
    - `vendor-react`（React 19 + DOM）：~218 kB (~68 kB gzip)。
    - `vendor-three`（Three.js PBR 引擎）：~815 kB (~244 kB gzip)。
    - 主业务代码：~240 kB (~70 kB gzip)。
    - CSS 样式包：~50 kB (~9.8 kB gzip)。
  - `chunkSizeWarningLimit` 配置为 1000 kB，构建无体积警告。
- **零密钥 / 零运行时 AI / 零外链扫描**：
  - 扫描目标：`GEMINI_API_KEY`, `@google/genai`, `generativelanguage.googleapis.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `unsplash.com`。
  - 扫描结果：**`SECURITY_SCAN_PASS`（0 命中）**。

## 3. Bug 诊断与修复记录
1. **Peer Dependency 冲突（`esbuild` 与 `vite@8.3.8`）**：
   - 现象：`package.json` 锁定 `esbuild: "^0.25.0"`，引发 `npm install` 报 `ERESOLVE could not resolve peerOptional esbuild@"^0.27.0 || ^0.28.0"`。
   - 修复：更新 `package.json` 中 `esbuild` 为 `^0.28.0`，所有 192 个依赖完整解析，0 漏洞。
2. **React 19 渲染时 setState 告警**：
   - 现象：在连续滚动与 rAF 循环中，在 `setDawnProgress((prev) => ...)` 函数体内触发父组件 `onDawnProgressChange`，引发 React 19 `"Cannot update a component while rendering a different component"`。
   - 修复：采用 `useRef` 缓存进度变化阈值（`Math.abs(next - prev) > 0.005`），在进入状态更新器前显式解耦触发父级回调。
3. **状态机 Reducer 引用抖动**：
   - 现象：`SET_SCENARIO` 操作即便情境 ID 与激活节点未变化仍返回新对象，引发全局多余重渲染。
   - 修复：添加相等性守卫 `if (state.selectedScenario === action.payload && state.activeFaultNode === null) return state;`。
4. **跨平台构建脚本兼容**：
   - 现象：Windows 环境下 `"clean": "rm -rf dist server.js"` 抛出找不到命令。
   - 修复：替换为 cross-platform 内联 Node 脚本：`node -e "const fs = require('fs'); fs.rmSync('dist', { recursive: true, force: true }); try { fs.unlinkSync('server.js'); } catch {}"`。
5. **Three.js X-ray 剖视遮挡穿透问题**：
   - 现象：在全机实心外观视角（Act 0 / Act I 巡航），内部高压母线与电池组件背光穿透机身外壳产生光斑。
   - 修复：将内部剖视所有子系统网格挂载于专用 `internalCutawayRoot` 节点下，当 `xrayLevel <= 0.04` 时将 `internalCutawayRoot.visible` 强制置为 `false`，彻底消除穿透伪影。
6. **三维教学建模尺度与相机景深优化**：
   - 现象：初始相机高度与机体俯仰在超宽屏下边缘裁剪。
   - 修复：校准 `cameraChoreography.ts` 视锥体自适应参数与 lookAt 目标点，机身在各幕关键叙事节拍保持最佳构图黄金分割比。

## 3. 真实浏览器实测（Playwright Headless Chromium）
- **测试环境**：容器内 Headless Chromium (`http://localhost:3000`)，桌面视口 `1440×900`、移动视口 `390×844` 与 `360×800`。
- **Round 1 发现并已修复的问题**：
  1. **TopNav 无障碍名称缺少空格**：`ACT IV信任` → 修复为带显式空格的 `ACT IV 信任`，屏幕阅读器与定位器识别清晰。
  2. **Act II 2D 解剖图标注截断与电池热点轻微遮字**：新增 `shortLabelZh` 消除中文半词截断，将热点 2 下移至 `y=232` 避开 `HV BATT [D]` 文字，并加宽底部双流线图例间距。
  3. **Act III 传播图 SVG 节点断词**：新增语义分隔符感知双行断行函数，消除单字孤行与跨行拆词；增强红色危险节点激活态边框对比度。
  4. **首屏包体与重复页眉清理**：将 Act I–V 改为 `React.lazy` 按需懒加载，移除次级工具条中与 Act 标题重复的幕号。
- **Round 2 复测结果（全部通过）**：
  - 控制台输出：**0 Errors，0 Warnings**；全部为本地静态资源，无外部域名请求，无 404。
  - 全链路交互与响应式（`1440×900`、`390×844`、`360×800`）均 **无水平溢出**，移动端吸顶导航高度 `56px`（占 `844px` 视口 `6.6%`，远低于 `15%` 上限）。
- **Round 3 深化与压力审计（全部通过）**：
  - **新增功能实测**：Act 0 单时间轴 `重播光影` 复位、Act I 4 维定性约束剖面、Act III 教学定性风险矩阵（点击条目联动 `EvidenceDrawer`，并修复子系统短名避免截断）、Act V 36 项交付验收卡按 `P0/P1/P2/P3` 实时筛选。
  - **高频压力测试**：桌面视口下连续执行 20 次跨幕快速跳转与交互，控制台保持 **0 Errors，0 Warnings**，无状态错乱或残留焦点异常。

## 4. 尚未执行（需用户在目标真机/公网环境复核）
- **Lighthouse 实测分数与真机 60FPS / GPU 帧耗时录制**：当前容器未运行 Lighthouse CLI 或独立 GPU 真机录制，未伪报分数或帧率；可按 `README.md` 在本地 Chrome DevTools Performance / Lighthouse 面板复核。
- **GitHub Pages 公网匿名窗口验收**：需由用户推送至 Public GitHub 仓库并启用 Actions Pages 部署后，在匿名窗口访问 `https://<username>.github.io/<repo>/` 实测并提交至课程飞书收集页。

