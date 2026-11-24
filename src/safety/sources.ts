import type { EvidenceSource, FactLabel } from './types';

export const TEACHING_DISCLAIMER =
  '本项目是课程教学研究，并非 Joby Aviation 或 FAA/EASA 的官方安全评估。公开资料只能说明原文确有表述，不可据此证明全部设计的真实安全表现。';

export const SUBJECT_PROVISIONAL_NOTICE =
  '研究对象暂定为 Joby Aviation S4 电动垂直起降飞行器（eVTOL），待与上一次正式课程作业原件核对最终一致；文中所有故障情境均为教学假设分析，不代表真实事故或官方认可的内部构造细节。';

export const FACT_LABEL_META: Record<
  FactLabel,
  { code: FactLabel; shortZh: string; fullZh: string; description: string }
> = {
  F: {
    code: 'F',
    shortZh: '公开事实',
    fullZh: 'F · 厂商/监管明确公开事实',
    description: '可追溯至官方监管文件或公开原文，附访问日期与链接；不外推未公开细节。',
  },
  A: {
    code: 'A',
    shortZh: '工程假设',
    fullZh: 'A · 有边界的教学工程假设',
    description: '基于系统安全工程方法建立的教学分析情境与假设边界，不宣称为特定机型已实装或已发生事实。',
  },
  D: {
    code: 'D',
    shortZh: '教学示意',
    fullZh: 'D · 教学概念图解与示意模型',
    description: '用于解释因果逻辑、剖面流向与安全工程方法的概念性图解，非官方图纸或实测参数。',
  },
  U: {
    code: 'U',
    shortZh: '未核实项',
    fullZh: 'U · 未核实 / 待复核信息',
    description: '缺乏公开权威原文支撑或尚未与最新官方公告、课程原件核实的内容，已明确排除出事实主张。',
  },
};

export const EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    id: 'S5',
    code: 'S5',
    publisher: 'FAA',
    title: 'AC 21.17-4, Type Certification—Powered-lift',
    url: 'https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentID/1044836',
    accessDate: '2026-11-20',
    scope: '美国 FAA 针对动力升力航空器（Powered-lift）型号审定路径的咨询通告框架。',
    summary:
      '明确动力升力航空器采用独立于传统固定翼或旋翼机的型号审定依据体系；该文件说明审定制度本身，不等同于特定厂商已获得最终型号合格证。',
    category: 'regulatory',
  },
  {
    id: 'S6',
    code: 'S6',
    publisher: 'FAA',
    title: 'Advanced Air Mobility Integration — Need to Know',
    url: 'https://www.faa.gov/aam/community_resources/integration-need-to-know',
    accessDate: '2026-11-20',
    scope: 'FAA 先进空中交通（AAM）空域与运行整合官方说明页面。',
    summary:
      '阐述 AAM 航空器融入国家空域系统所涉及的运行整合、基础设施与安全协同要求，说明系统安全不仅限于机载硬件，也涵盖运行与空域环境。',
    category: 'regulatory',
  },
  {
    id: 'S7',
    code: 'S7',
    publisher: 'EASA',
    title: 'Special Condition for VTOL and Means of Compliance (SC-VTOL)',
    url: 'https://www.easa.europa.eu/en/document-library/product-certification-consultations/special-condition-vtol',
    accessDate: '2026-11-20',
    scope: '欧洲航空安全局（EASA）针对垂直起降航空器的专用条件框架。',
    summary:
      '建立欧洲 SC-VTOL 审定专用条件及符合性方法演进脉络，用于规范电动/分布式推进 VTOL 的安全目标与适航验证框架。',
    category: 'regulatory',
  },
  {
    id: 'S8',
    code: 'S8',
    publisher: 'EASA',
    title: 'Means of Compliance with the Special Condition VTOL (MOC SC-VTOL Issue 2)',
    url: 'https://www.easa.europa.eu/en/means-compliance-special-condition-vtol-moc-sc-vtol-issue-2',
    accessDate: '2026-11-20',
    scope: 'EASA SC-VTOL 专用条件第 2 版符合性方法（持续更新中）。',
    summary:
      '提供针对结构、飞控、推进、能量存储及系统安全评估的符合性方法参考；引用该文件仅说明监管验证方法，不证明某款具体机型已通过全部条款。',
    category: 'regulatory',
  },
  {
    id: 'S9',
    code: 'S9',
    publisher: 'FAA',
    title: 'Pilot Training and Certification for Powered-Lift',
    url: 'https://www.faa.gov/regulations_policies/advisory_circulars/index.cfm/go/document.information/documentID/1042955',
    accessDate: '2026-11-20',
    scope: 'FAA 针对动力升力航空器飞行员训练与执照审定的专门文件。',
    summary:
      '反映动力升力构型在垂直悬停、过渡飞行与固定翼巡航之间切换带来的人因与训练特殊性，为分析过渡阶段机组工作负荷与运行程序提供监管背景。',
    category: 'regulatory',
  },
  {
    id: 'S4',
    code: 'S4',
    publisher: 'GitHub Docs',
    title: 'Configuring a publishing source for GitHub Pages',
    url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site',
    accessDate: '2026-11-20',
    scope: '本项目纯静态构建产物通过 GitHub Actions 部署至 GitHub Pages 的官方技术依据。',
    summary:
      '确认静态站点可通过 GitHub Actions 发布 dist 产物且发布根目录包含 index.html，无需服务端或付费托管。',
    category: 'deployment',
  },
  {
    id: 'S1',
    code: 'S1',
    publisher: 'Google AI Studio Docs',
    title: 'Build apps in Google AI Studio',
    url: 'https://ai.google.dev/gemini-api/docs/aistudio-build-mode',
    accessDate: '2026-11-20',
    scope: '项目合规边界说明：明确拒绝运行时 Gemini API 调用模式，仅生成纯静态前端。',
    summary:
      '官方文档描述了服务端密钥注入机制；本项目为满足零付费与离线静态课程约束，明确禁用任何运行时模型请求与 API Key。',
    category: 'platform',
  },
  {
    id: 'S2',
    code: 'S2',
    publisher: 'Google',
    title: 'Gemini Developer API Pricing',
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    accessDate: '2026-11-20',
    scope: '说明免费开发工具与付费 API/云托管边界差异的参考依据。',
    summary:
      '明确区分 AI Studio 工具使用与 API/云资源配额，支撑本项目坚持 100% 本地静态资产与 GitHub Pages 零付费部署。',
    category: 'platform',
  },
];

export const SOURCE_MAP: Record<string, EvidenceSource> = Object.fromEntries(
  EVIDENCE_SOURCES.map((s) => [s.id, s]),
);
