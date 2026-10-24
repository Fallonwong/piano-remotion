// Portable configuration; assets are supplied explicitly by each project.

/**
 * 钢琴动效视频统一规范配置体系 (Piano Remotion Configuration Matrix)
 * 依据 2026-10-23 用户最终筛选决议正式固化。
 *
 * ❌ 明确永久剔除项：
 * - B4: 62° 极倾斜星际巡游跑道（过度压缩低音，视线眩晕，永久废弃）
 * - E2: 赛博高饱和青蓝/玫红配色（破坏全曲目纯净统一感，永久废弃）
 */

// ==========================================
// 1. 画幅比例选择 (Aspect Ratio)
// ==========================================
export type ScoreAspectRatio =
  | '9:16'   // A1: 竖屏 1080×1920 (抖音/小红书/Reels)
  | '16:9';  // A2: 横屏 1920×1080 (B站/YouTube/大屏)

// ==========================================
// 2. 运镜模式 (Camera & Motion Modes)
// ==========================================
export type ScoreCameraMode =
  | 'portrait-focus'     // B1: 9:16 整谱多系统动态聚焦 (Focus-Anchored Pivot)
  | 'portrait-runway'    // B2: 9:16 3D 纵深立体跑道 (3D Cosmic Runway)
  | 'landscape-classic'; // B3: 16:9 经典 3D 浮空俯视跟谱 (16:9 Grand Staff 3D)

// ==========================================
// 3. 背景环境主题 (Background Environments)
// 优先级：slate-gray (经典石板灰) 为本板块最高优先级首推
// ==========================================
export type ScoreBackgroundTheme =
  | 'slate-gray'         // C1: 【首选推荐】经典石板灰质感 (沉稳深灰 #6b6561，La La Land 视觉基准)
  | 'cosmic-nebula'      // C2: 极夜深空星云 (极夜群青底色 + 紫罗兰呼吸星云 + 28组钻石星芒 + 流星)
  | 'obsidian-dark'      // C3: 黑曜石纯黑极简 (纯黑暗夜 #05070e + 12组微弱环境星芒)
  | 'deep-sapphire'      // C4: 普鲁士深蓝星海 (深海幽蓝 #030714 + 冷调微星)
  | 'vintage-parchment'; // C5: 复古羊皮纸暖黄 (暖黄纸质手稿 #f5ede0 + 边缘自然晕染)

// ==========================================
// 4. 乐谱质感与线条混合 (Score Surface & Texture)
// 优先级：black-multiply (传统雕版黑墨) 为本板块最高优先级首推
// ==========================================
export type ScoreSurfaceTexture =
  | 'black-multiply'     // D1: 【首选推荐】传统雕版黑墨印刷 (Multiply 混合，原版黑墨线自然渗入纸面)
  | 'metallic-screen'    // D2: 金属通透发光反色 (Screen 混合，透亮银白微光，暗夜星空专用)
  | 'white-invert';      // D3: 纯白高对比反色 (黑白极度分明，音符读谱极度清晰)

// ==========================================
// 5. 声部发光色彩 (Hand Glow Palette)
// 全局统一标准：高音夜空纯淡紫 + 低音专属落日暖橙
// ==========================================
export const OFFICIAL_HAND_PALETTE = {
  right: {
    color: '#b895ff',       // 夜空纯淡紫
    glow: '#b794f4',        // 灵动光晕
    core: '#ffffff',        // 纯白高光核
  },
  left: {
    color: '#E95514',       // 专属落日暖橙
    glow: '#ff9a46',        // 温润霞光
    core: '#fff5db',        // 暖黄高光核
  },
} as const;

export type ScoreHandColors = {
  rightColor: string;
  rightGlow: string;
  rightCore: string;
  leftColor: string;
  leftGlow: string;
  leftCore: string;
};

// ==========================================
// 6. 声部发光动效机制 (Motion FX & Dynamics)
// ==========================================
export type ScoreMotionFxConfig = {
  trailFrames: number;          // F1: 拖尾帧数 (默认 16 帧收窄渐细优雅长拖尾)
  taperTrail: boolean;          // F1: 两头渐细收窄
  followChordNotes: boolean;    // F2: 和弦音头逐一分叉与汇聚
  rippleRing: boolean;          // F3: 透视椭圆触键冲击波
  rippleFrames: number;         // F3: 冲击波扩散时长 (默认 12~14 帧)
  rippleOpacity: number;        // F3: 冲击波不透明度 (默认 0.35~0.4，清透不喧宾夺主)
  inactiveNoteOpacity: number;  // F4: 静止/击键后音符消退透明度 (默认 0，完全交还给原谱)
};

export const DEFAULT_MOTION_FX: ScoreMotionFxConfig = {
  trailFrames: 16,
  taperTrail: true,
  followChordNotes: true,
  rippleRing: true,
  rippleFrames: 12,
  rippleOpacity: 0.35,
  inactiveNoteOpacity: 0,
};

// ==========================================
// 7. 伴弹角标 IP 形象 (Pianist Avatar)
// ==========================================
export type ScorePianistAvatar =
  | 'cat'   // G1: 透明底循环弹琴小猫 (public/ip/piano-alpha.webm, 300帧无缝循环, zIndex: 400)
  | 'none'; // G2: 无人物纯净大谱表

// ==========================================
// 8. 标题与排版 HUD (Typography & HUD Layout)
// ==========================================
export type ScoreTypographyHud = {
  style: 'chinese-2x' | 'bodoni-royal' | 'clean'; // H1: 书法大标题 2x | H2: Bodoni 皇家衬线 | H3: 极简纯净
  showStatusBar: boolean;                          // H3: 底部双手声部实时状态条与小节指示器
  title: string;
  chineseTitle?: string;
  subtitle?: string;
};

// ==========================================
// 9. 底层乐谱架构 (Score Pipeline)
// ==========================================
export type ScorePipelineMode =
  | 'full-score'   // I1: 全页多系统完整大谱表 (Full Score SVG + timeline.json, 配合动态聚焦)
  | 'score-strip'; // I2: 单行连续拼接跑道条带 (Score Strip SVG + native-timeline.json, 配合3D跑道)

// ==========================================
// 完整统一组合配置对象 (ScoreVideoConfig)
// ==========================================
export type ScoreVideoConfig = {
  aspectRatio: ScoreAspectRatio;
  cameraMode: ScoreCameraMode;
  theme: ScoreBackgroundTheme;
  texture: ScoreSurfaceTexture;
  motionFx: ScoreMotionFxConfig;
  avatar: ScorePianistAvatar;
  typography: ScoreTypographyHud;
  pipeline: ScorePipelineMode;
  handColors?: Partial<ScoreHandColors>;
};

// ==========================================
// 官方标准预设工厂 (Official Presets)
// 优先级策略：SlateClassic 为最高优先级置顶推荐（爆款视觉基准）
// ==========================================
export const SCORE_PRESETS = {
  /**
   * 【首选置顶推荐】经典石板灰方案：经典石板灰雕版黑墨款 (La La Land 爆款视觉基准)
   * 优雅深邃的中性石板灰底质感，传统雕版黑墨线自然压入纸面，读谱通透耐看，舒适不眩晕
   */
  SlateClassic: (title = '曲目名', subtitle = 'Piano Study'): ScoreVideoConfig => ({
    aspectRatio: '9:16',
    cameraMode: 'portrait-focus',
    theme: 'slate-gray',
    texture: 'black-multiply',
    motionFx: {...DEFAULT_MOTION_FX},
    avatar: 'cat',
    typography: {
      style: 'chinese-2x',
      showStatusBar: true,
      title,
      chineseTitle: title,
      subtitle,
    },
    pipeline: 'full-score',
  }),

  /**
   * 官方预设方案 01：深空宇宙 3D 跑道款
   * 算法吸睛、视觉冲击力强、适合短视频平台
   */
  CosmicRunway: (title = '曲目名', subtitle = 'Piano Cover'): ScoreVideoConfig => ({
    aspectRatio: '9:16',
    cameraMode: 'portrait-runway',
    theme: 'cosmic-nebula',
    texture: 'metallic-screen',
    motionFx: {...DEFAULT_MOTION_FX},
    avatar: 'cat',
    typography: {
      style: 'chinese-2x',
      showStatusBar: true,
      title,
      chineseTitle: title,
      subtitle,
    },
    pipeline: 'score-strip',
  }),

  /**
   * 官方双子星方案 02：黑曜石纯黑 · 多系统动态聚焦款
   * 整谱多系统展示、弹奏动态聚焦当前行、视线平稳无眩晕、适合教学赏析与考级
   */
  ObsidianFocus: (title = '曲目名', subtitle = 'Piano Solo'): ScoreVideoConfig => ({
    aspectRatio: '9:16',
    cameraMode: 'portrait-focus',
    theme: 'obsidian-dark',
    texture: 'white-invert',
    motionFx: {...DEFAULT_MOTION_FX},
    avatar: 'cat',
    typography: {
      style: 'chinese-2x',
      showStatusBar: true,
      title,
      chineseTitle: title,
      subtitle,
    },
    pipeline: 'full-score',
  }),

  /**
   * 横屏官方标准：普鲁士深蓝星海 3D 浮空跟谱款
   * 视野舒展大屏款
   */
  SapphireLandscape: (title = '曲目名', subtitle = 'Piano Concert'): ScoreVideoConfig => ({
    aspectRatio: '16:9',
    cameraMode: 'landscape-classic',
    theme: 'deep-sapphire',
    texture: 'metallic-screen',
    motionFx: {...DEFAULT_MOTION_FX},
    avatar: 'cat',
    typography: {
      style: 'bodoni-royal',
      showStatusBar: true,
      title,
      subtitle,
    },
    pipeline: 'full-score',
  }),

  /**
   * 典雅手稿方案：复古羊皮纸手稿款
   * 适合国风古风、中国民乐与古典手抄谱质感
   */
  ParchmentManuscript: (title = '曲目名', subtitle = '古典钢琴手稿'): ScoreVideoConfig => ({
    aspectRatio: '9:16',
    cameraMode: 'portrait-focus',
    theme: 'vintage-parchment',
    texture: 'black-multiply',
    motionFx: {
      ...DEFAULT_MOTION_FX,
      rippleOpacity: 0.25,
    },
    avatar: 'none',
    typography: {
      style: 'chinese-2x',
      showStatusBar: false,
      title,
      chineseTitle: title,
      subtitle,
    },
    pipeline: 'full-score',
  }),
};
