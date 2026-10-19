# Piano Remotion V1.0.0 使用指南

## 安装

先安装官方 Remotion Skill，再安装本 Skill；已有部分直接复用。

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices
npx skills add Fallonwong/piano-remotion --skill piano-remotion
```

按提示选择 Agent 和安装范围。也可从 [V1.0.0 Release](https://github.com/Fallonwong/piano-remotion/releases/tag/v1.0.0) 下载完整 ZIP，将 `piano-remotion/` 放入当前 Agent 的 Skill 目录，保留组件、脚本和 references。安装后开启新对话。

## 发起制作

```text
使用 $piano-remotion，先读取官方 $remotion-best-practices。
素材：<实际文件路径>。工程：<已有 Remotion 工程路径，如有>。
请制作原版钢琴跟谱视频，保留双手跳跃、发光、高亮和运镜，个人装饰关闭。
先展示原谱与重排谱的逐小节对照、修订差异和疑点，等我确认。
然后展示真实关键帧、短试听和连音动态，再等我确认，之后导出 MP4。
有录音就保留原录音；没有录音先复用现有钢琴音源并试听。
优先复用环境，需要新增工具或音源时先说明方案。
```

不支持 `$名称` 的 Agent，可改成“依次读取官方 Remotion Skill 和本 Skill 的 SKILL.md，按其执行”。

## 准备素材

MusicXML 优先保留结构化记谱；MIDI 提供演奏信息，补排版和分手；SVG 需要匹配时间轴与坐标；MP3 可与已有乐谱配合，缺谱时调用可用转谱能力；PDF/图片优先调用专业 OMR 后逐小节核对；简谱先明确调号、八度和节奏。

无需一次准备所有格式。Agent 先发现当前可用工具，按缺口补齐，Python 和全部 CLI 并非基础动画前提。

## 两次确认

先核对谱面，包括左右手、休止符、和弦、附点与连线。修订后查看具体小节的前后变化。然后核对真实关键帧、最终音频的试听与连音动态。镜头或混音变化更新审片；音乐数据变化更新谱面确认。

## 音频

优先录音或现有采样音源。试听用于选择音色，全曲母版从完整批准谱面生成。整体增益、静音补偿和尾音处理另存记录，保留原件，避免盲裁余音。

## 脚本和数据

```sh
node <skill>/scripts/piano.mjs --help
```

[音源与谱面修订流程](references/workflow.md) · [几何、审阅和渲染](references/rc6-workflow.md) · [数据契约](references/data-contract.md) · [更多提示词](examples/agent-prompts.md)

原版组件和旧入口保留。新的有声歌曲使用带音频来源记录的 checked job，PDF/图片审阅包含 notation-audit，预览和导出共用同版素材。素材与授权信息见 LICENSE.txt。
