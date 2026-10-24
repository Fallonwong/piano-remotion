# 1.2.0-local.4 — real-score layout fixes and no personal character overlays, unpublished

New presets disable character overlays. Removed personal asset references and special cases. Added explicit runway scaling/stretch/lead-in profile, upright Chinese titles and Bodoni subtitles, 2px trails with 1.25 glow and finite release. Added true pulse-only hiding moving heads and trails. Legacy direct camera behavior remains unchanged.

# 1.2.0-local.3 — aligned with the 14-keep / 12-drop decision, unpublished

Retired nebula and parchment themes, white-invert surface, and ground ripple defaults. Synced the four remaining presets (SlateClassic, SapphireRunway, ObsidianFocus, SapphireLandscape), converge-arc 14-frame trails with 58/44 arc heights, and pulse-only alternative. Preserved legacy low-level props and both content approvals. No GitHub publication.

# 1.2.0-local.2 — continuous score-strip tool, unpublished

Added `piano score-strip` for a single normalized multi-system SVG with measured bounds and notehead mappings. Preserves musical timing, transforms coordinates, verifies source/output glyph registration, and generates continuous focusPath for the existing portrait-runway camera. No auto-recognition, repeat unfolding, time fitting, private assets or GitHub publication. See references/score-strip.md.

# 1.2.0-local.1 — local candidate, not published

Merged installed camera/chord enhancements and project visual presets. Added a resolved configuration adapter, explicit textures, standard hand palette, ripple/inactive opacity controls, portable star backgrounds and visual configuration validation. Preserved legacy defaults and both content approval gates. No private media, generic strip generator or per-song timing scripts.

# Piano Remotion V1.1.0

发布日期：2026-10-21。

本版完善横竖屏制作、演奏时间映射、素材选择说明及质量复核流程。保留原有双手跳跃、轨迹和旧版默认显示。

## 新增与改进

- **画幅与镜头**：16:9 / 9:16 参数、跟随大谱表中心的动态焦点、12–16 帧 Smoothstep 换行；标题与伴弹形象分层，双手颜色和状态指示联动。
- **背景与配色**：五类主题、自定义纯色或图片背景；根据主题处理 SVG 混合与滤镜。伴弹素材由项目提供，公开包不含私人 IP 或字体。
- **制作前确认**：明确画幅、背景、双手颜色、伴弹素材和先四小节交付方式，复用已确认选择。
- **音乐与时间分离**：MusicXML/MIDI 符号事件、显式播放顺序、重复出现编号、独立的分段或逐音锚点映射。保留休止、和弦、延音及圆滑线；MIDI 声部/手部/小节需明确归属。
- **本地音频候选**：音区频谱、chroma、受约束 DTW、短窗口起音及单调起音编辑路径。复用现有 NumPy/FFmpeg，不自动下载模型或安装依赖。
- **范围与质量复核**：原谱范围检查、显式选段对应、原谱＋原音频逐音复核页、完整证据和版本绑定。未解决或失效的证据阻止正式导出。
- **审片与输出检查**：前四正式小节包含全休止小节，弱起另算；补充中段、尾段、换行和连线风险审看；检查导出画面元数据及原音频保留情况。
- **素材指南**：分别说明只有 MP3、MP3＋PDF/图片、MP3＋MusicXML、MP3＋MIDI、无录音生成配乐及已有 SVG/时间轴的真实处理路径，直接说明每种输入还需先做什么。

## 素材怎么选

- **想保留原录音，最推荐 MP3＋已校订 MusicXML**。
- **不需要保留原录音，最推荐已校订 MusicXML，再生成钢琴配乐**。
- PDF/图片可以做，先识谱并核对音符；需要当前有可用识谱工具。
- MIDI 可以做，先确认左右手、声部、小节及录音对应关系。
- 只有 MP3 时建议补对应乐谱；Skill 不内置完整双手音频转谱。

详见 [README 素材链路](README.md#不同输入的完成把握与实际链路)。各输入类别的真实全流程成功率尚未统计，不提供推测百分比。

## 兼容与迁移

未指定新 `aspectRatio` 的组件保留旧版默认显示。已完成作品不批量替换。**旧 job 进行新的正式导出时，需补齐制作配置、v2 演奏映射和质量证据，重新验证并绑定。** 旧的三个起音结果或摘要 passed 不能授权新的正式有声导出。

运行依赖基线保持 Remotion 4.0.515、React 19.2.4、TypeScript 5.9.3；完整 Remotion 流程使用 Node.js ≥20。音频候选分析才需要已有 Python＋NumPy/FFmpeg；PDF/图片识谱、外部音频转谱及排谱能力按实际环境接入。

## 验证与能力边界

发布候选已完成 47 项工程协议回归、脚本语法及 TypeScript 检查；有横竖屏静帧、跨系统工程短片、旧默认同帧像素兼容及音频传输检查。这些验证不代表真实曲目的自动识别准确率。

两个不同段落、同合成音色的受控实验各含 24 个样本。正常与时间变化样本的最差单例候选起音 P95 约 19.5ms；半音/八度变更诊断在两段中均只标记出 4/8。该结果不能推断真实 MP3 的准确率，也不是缺和弦成员或不同改编的可靠自动检测能力。

音频分析始终返回待复核候选；正式输出仍要求内容、段落、时间及实际审片证据。谱面结构正确、BPM 接近或导出成功均不能证明音乐一致。详见 [能力状态](references/upgrade-status.md) 和 [内容与时间证据](references/performance-quality.md)。
