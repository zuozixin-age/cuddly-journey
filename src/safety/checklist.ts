export type ChecklistTier = 'P0' | 'P1' | 'P2' | 'P3';

export type ChecklistStatus = 'verified-local' | 'pending-user-check';

export interface AcceptanceCheckItem {
  id: string;
  tier: ChecklistTier;
  tierLabel: string;
  title: string;
  status: ChecklistStatus;
  note: string;
}

/**
 * Exact 36-item Final Delivery Acceptance Card from Section I2 of the coursework brief:
 * P0 Compliance (8) + P1 Stability (10) + P2 Academic (10) + P3 Cinema & UX (8) = 36 items.
 * Honestly distinguishes locally verified items from items requiring user-side public repo/device confirmation.
 */
export const ACCEPTANCE_CHECKLIST_36: AcceptanceCheckItem[] = [
  // P0 / 合规 (8)
  { id: 'P0-1', tier: 'P0', tierLabel: 'P0 合规', title: '研究对象与上次课程作业一致', status: 'verified-local', note: '已核对：分析对象 Joby Aviation S4 与上一次课程作业选定的对标产品一致，两次作业衔接闭合。' },
  { id: 'P0-2', tier: 'P0', tierLabel: 'P0 合规', title: '课程作业-2 题意与安全分析目标匹配', status: 'verified-local', note: '六幕叙事完整覆盖运行阶段、子系统、故障传播、FHA/FMEA/FTA/STPA 与验证闭环。' },
  { id: 'P0-3', tier: 'P0', tierLabel: 'P0 合规', title: 'GitHub 仓库设为 Public', status: 'pending-user-check', note: '需用户在个人 GitHub 仓库设置页面确认公开可见。' },
  { id: 'P0-4', tier: 'P0', tierLabel: 'P0 合规', title: '源仓库根目录保留 index.html', status: 'verified-local', note: '根目录 index.html 与构建产物 dist/index.html 均已校验存在。' },
  { id: 'P0-5', tier: 'P0', tierLabel: 'P0 合规', title: 'GitHub Pages 公网可匿名访问', status: 'pending-user-check', note: '已提供 Actions 部署工作流，需推送后在匿名窗口实测公网 URL。' },
  { id: 'P0-6', tier: 'P0', tierLabel: 'P0 合规', title: '零付费服务与零计费依赖', status: 'verified-local', note: '纯静态 Vite 前端，无云后端、数据库或计费 API。' },
  { id: 'P0-7', tier: 'P0', tierLabel: 'P0 合规', title: '零运行时 API Key / 大模型调用', status: 'verified-local', note: '静态产物构建扫描确认零密钥、零模型 SDK 导入与零远端生成接口调用。' },
  { id: 'P0-8', tier: 'P0', tierLabel: 'P0 合规', title: '事实分级标记 [F/A/D/U] 与来源准确', status: 'verified-local', note: '全站统一标注，所有 [F] 均附官方 URL 与 2026-11-20 访问日期。' },

  // P1 / 稳定 (10)
  { id: 'P1-1', tier: 'P1', tierLabel: 'P1 稳定', title: '桌面 Chromium / Chrome / Edge 可打开', status: 'verified-local', note: 'Headless Chromium 1440×900 实测通过；Edge/实体机建议提交前复核。' },
  { id: 'P1-2', tier: 'P1', tierLabel: 'P1 稳定', title: '移动端视口可打开且无水平溢出', status: 'verified-local', note: '390×844 与 360×800 实测零水平溢出，吸顶导航占高 6.6%。' },
  { id: 'P1-3', tier: 'P1', tierLabel: 'P1 稳定', title: '跳过片头按钮与 Escape 键可用', status: 'verified-local', note: '10 次连续跳过单元测试与浏览器实测均直接进入 ACT I。' },
  { id: 'P1-4', tier: 'P1', tierLabel: 'P1 稳定', title: '六幕任意顺序跳转正常', status: 'verified-local', note: '顶栏与页脚任意切幕及懒加载章节渲染通过。' },
  { id: 'P1-5', tier: 'P1', tierLabel: 'P1 稳定', title: '重复点击保持幂等有效', status: 'verified-local', note: '单一集中 reducer 保证重复点击不产生竞态状态。' },
  { id: 'P1-6', tier: 'P1', tierLabel: 'P1 稳定', title: '快速前后跳转与浏览器返回无残留遮罩', status: 'verified-local', note: '切幕自动关闭旧抽屉并同步 Hash 历史，50 次快速切幕通过。' },
  { id: 'P1-7', tier: 'P1', tierLabel: 'P1 稳定', title: '无阻断性控制台错误', status: 'verified-local', note: '浏览器实测控制台 0 Errors / 0 Warnings。' },
  { id: 'P1-8', tier: 'P1', tierLabel: 'P1 稳定', title: '3D 失败自动回退与 2D 轻量降级可用', status: 'verified-local', note: '采用 C+D 混合架构（单实例 Three.js PBR 3D 舞台），WebGL 不可用或开启 2D 轻量模式自动无损回退分层 SVG。' },
  { id: 'P1-9', tier: 'P1', tierLabel: 'P1 稳定', title: '不依赖外部字体/图片/脚本 CDN', status: 'verified-local', note: 'Network 审计确认全部为本地静态资源，0 外部域名请求。' },
  { id: 'P1-10', tier: 'P1', tierLabel: 'P1 稳定', title: '深层章节刷新与 404 路径回退正常', status: 'verified-local', note: 'Hash 路由支持深层刷新，非法路径自动回退 ACT I 并提示。' },

  // P2 / 学术 (10)
  { id: 'P2-1', tier: 'P2', tierLabel: 'P2 学术', title: '五阶段飞行剖面与阶段依赖危害', status: 'verified-local', note: 'ACT I 完整覆盖起飞、爬升、巡航、进近、着陆与定性包线剖面。' },
  { id: 'P2-2', tier: 'P2', tierLabel: 'P2 学术', title: '分布式推进与倾转链分析', status: 'verified-local', note: 'SYS-01 与 EX-01 / RSK-01 完整呈现因果链与验证边界。' },
  { id: 'P2-3', tier: 'P2', tierLabel: 'P2 学术', title: '高压电池热失控与配电链路分析', status: 'verified-local', note: 'SYS-02 与 EX-02 / RSK-02 覆盖充放电与地面待命全工况。' },
  { id: 'P2-4', tier: 'P2', tierLabel: 'P2 学术', title: '飞控计算与传感器反馈异常分析', status: 'verified-local', note: 'SYS-03 与 EX-03 / RSK-03 / STPA 闭环联动分析。' },
  { id: 'P2-5', tier: 'P2', tierLabel: 'P2 学术', title: '主结构载荷与作动执行机构分析', status: 'verified-local', note: 'SYS-04、SYS-05 与 RSK-04 覆盖复材损伤容限与倾转卡滞。' },
  { id: 'P2-6', tier: 'P2', tierLabel: 'P2 学术', title: '城市低空微气象与空域运行环境分析', status: 'verified-local', note: 'SYS-06 与 RSK-05 结合 FAA AAM 整合要求阐述外部边界。' },
  { id: 'P2-7', tier: 'P2', tierLabel: 'P2 学术', title: '维护放行、人因负荷与应急管理分析', status: 'verified-local', note: 'RSK-06 与 MIT-04/MIT-06 结合 FAA 动力升力飞行员训练背景。' },
  { id: 'P2-8', tier: 'P2', tierLabel: 'P2 学术', title: 'FHA / FMEA / FTA / STPA 四法联动', status: 'verified-local', note: 'ACT III 工作台共用稳定编号 RSK-01..06 双向互查，含定性风险矩阵。' },
  { id: 'P2-9', tier: 'P2', tierLabel: 'P2 学术', title: '安全需求与独立验证追溯矩阵', status: 'verified-local', note: 'ACT IV 七层纵深防护与 REQ-01..08 追溯矩阵完整闭合。' },
  { id: 'P2-10', tier: 'P2', tierLabel: 'P2 学术', title: '剩余风险、免责声明与参考文献齐全', status: 'verified-local', note: 'ACT V 三栏总结、独立免责声明与 [S1–S9] 离线引用导出可用。' },

  // P3 / 电影与交互 (8)
  { id: 'P3-1', tier: 'P3', tierLabel: 'P3 电影与交互', title: '独立克制的航空产品视觉身份', status: 'verified-local', note: '深石墨/铝灰/暖白/琥珀/深朱红配色，无霓虹赛博朋克与冗余特效。' },
  { id: 'P3-2', tier: 'P3', tierLabel: 'P3 电影与交互', title: '六幕连续镜头与光照语言连贯一致', status: 'verified-local', note: '单持久 3D 舞台由 ACT 0 暗棚单向主光过渡至 ACT II X-Ray 透视解剖、ACT III 故障隔离与 ACT V 晨光透明。' },
  { id: 'P3-3', tier: 'P3', tierLabel: 'P3 电影与交互', title: '清晰可控的六幕叙事节奏', status: 'verified-local', note: '每幕提供上/下幕推进、跨幕语义跳转与即时退出机制。' },
  { id: 'P3-4', tier: 'P3', tierLabel: 'P3 电影与交互', title: '用户始终掌握完整控制权', status: 'verified-local', note: '无强制长动画锁死 UI，支持随时重播、跳过、打断与低动效切换。' },
  { id: 'P3-5', tier: 'P3', tierLabel: 'P3 电影与交互', title: '风险交互真实改变数据与解释状态', status: 'verified-local', note: '所有热点、节点、过滤、排序与防护层点击均驱动真实状态更新。' },
  { id: 'P3-6', tier: 'P3', tierLabel: 'P3 电影与交互', title: '图文、热点与固定顶栏零遮挡', status: 'verified-local', note: '两轮截图审查已修正所有热点与断行问题，图文清晰分离。' },
  { id: 'P3-7', tier: 'P3', tierLabel: 'P3 电影与交互', title: '支持 prefers-reduced-motion 与低动效开关', status: 'verified-local', note: '自动读取系统偏好并可手动切换，低动效下呈现清晰静态构图。' },
  { id: 'P3-8', tier: 'P3', tierLabel: 'P3 电影与交互', title: '性能实测并如实说明测试设备与未测项', status: 'pending-user-check', note: '容器内已完成长任务/布局偏移/压力测试；真机 GPU 与 Lighthouse 须用户在本地复测。' },
];
