# Piano Remotion V1.1.0 使用指南

## 安装

先安装官方 Remotion Skill，再安装本 Skill；已有部分直接复用。

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices
npx skills add Fallonwong/piano-remotion --skill piano-remotion
```

按提示选择 Agent 和安装范围。也可从 [V1.1.0 Release](https://github.com/Fallonwong/piano-remotion/releases/tag/v1.1.0) 下载完整 ZIP，将 `piano-remotion/` 放入当前 Agent 的 Skill 目录，保留组件、脚本和 references。安装后开启新对话。

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

优先提供已校订 MusicXML：接受生成配乐时，从同份谱生成完整钢琴音频；保留原演奏时，配上同改编、同选段的 MP3。MIDI 需明确声部/左右手及小节归属，SVG 需匹配同次排版的时间轴与坐标。PDF/图片先复用已安装 OMR 并核对识谱结果；简谱先明确调号、八度和节奏。只有 MP3 时需补充乐谱或确认现有转谱工具，内置分析不负责完整复调转谱。

详见 [素材推荐顺序与提交清单](README.md#哪些素材更容易得到可靠结果)。推荐顺序依据当前处理环节，不代表已测得的成功率百分比。多份素材应属于同一版本，选段应说明原谱小节范围和反复顺序。

[不同输入的完成把握与实际链路](README.md#不同输入的完成把握与实际链路) 分别说明只有 MP3、MP3＋PDF/图片、MP3＋MusicXML、MP3＋MIDI 及无录音生成配乐的路径；实现依据与统计口径见 [输入分支说明](references/input-routes.md)。只有 MP3 且没有可用转谱/补谱途径时，当前内置链路不能独立生成完整准确乐谱。当前各类真实任务完成率均待统计，不将导入或预览成功当作内容与同步通过。

无需一次准备所有格式。Agent 先发现当前可用工具，按缺口补齐，Python 和全部 CLI 并非基础动画前提。

## 两次确认

先核对谱面，包括左右手、休止符、和弦、附点与连线。修订后查看具体小节的前后变化。然后核对真实关键帧、最终音频的试听与连音动态。镜头或混音变化更新审片；音乐数据变化更新谱面确认。

## 音频

优先录音或现有采样音源。试听用于选择音色，全曲母版从完整批准谱面生成。整体增益、静音补偿和尾音处理另存记录，保留原件，避免盲裁余音。

## 脚本和数据

```sh
node <skill>/scripts/piano.mjs --help
```

[音源与谱面修订流程](references/workflow.md) · [几何、审阅和渲染](references/rendering.md) · [数据契约](references/data-contract.md) · [更多提示词](examples/agent-prompts.md)

原版组件和旧入口保留。新的有声歌曲使用带音频来源记录的 checked job，PDF/图片审阅包含 notation-audit，预览和导出共用同版素材。素材与授权信息见 LICENSE.txt。


## V1.1.0 更新

本版新增横竖屏预设、主题、动态焦点与前四小节先导，以及独立的谱面事件和演奏时间映射。旧组件未设置 aspectRatio 时保留原效果；旧任务进行新的正式导出时，需补齐本版配置、时间映射和质量证据，重新绑定。详见 [版本说明](RELEASE_NOTES.md)。

新视频先确认画幅、背景、双手色彩、交付节奏和IP，再进入谱面确认、实际关键帧与试听确认。详见 [制作配置](references/production.md)。

新正式 bind 需要 --production；有声正式作品还需要 v2 演奏映射和 --quality。音频 FFT/DTW 分析是候选辅助，不能自动证明错音、不同改编或逐音准确；缺少人工参考时保持 needs_review。详见 [内容与同步证据](references/performance-quality.md)。现有 Python + NumPy 可运行候选分析，不自动安装模型或依赖。历史任务可检查，新正式导出需按当前证据重新绑定。

PDF/图片与 XML 同时存在时先用 source-scope 核对范围；全谱小节数不一致会阻断，选段需给出源小节映射。quality-request 可从候选分析创建原谱＋原音频＋逐音复核页，初始所有项均为未审，不能作为批准。短窗口起音与分段映射用于改善时间候选；密集和弦、八度及不同改编的自动判定仍未校准，见 [能力状态](references/upgrade-status.md)。


## 本地视觉升级候选 1.2.0-local.3：已对齐 2026-10-24 的「14 保留 / 12 裁撤」决议，保留四组预设、14 帧合流大跃动与连续谱带工具；不包含逐曲时间修补。
