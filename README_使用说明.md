# Piano Remotion RC6 使用说明

完整目录安装为 `piano-remotion`，先安装并读取官方 `remotion-best-practices`。已安装就复用，不重复安装。

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices
npx skills add Fallonwong/piano-remotion --skill piano-remotion
```

选择当前 Agent 和安装范围；WorkBuddy 使用其实际 Skill 目录，必要时开启新对话。手动安装须保留组件、脚本及 references，不能只复制 SKILL.md。Windows junction 入口已修复。

给 Agent 的完整任务：

```text
使用 $piano-remotion，先读取官方 $remotion-best-practices。
素材：<PDF/MusicXML/MIDI/SVG/MP3/五线谱图片/简谱图片的真实路径>。
目标：用原版双手跳跃、发光轨迹、高亮和运镜制作钢琴视频，个人装饰关闭。
优先复用当前工程 <路径> 和已授权的兼容环境，不重复安装，不修改原始素材。
先完成谱面整理，展示全部小节的原谱与重排对照、疑点及可编辑 MusicXML，然后停下来等我确认。
我确认谱面后，再制作真实关键帧、短试听及连音动态片段，再次停下来等我确认。
第二次确认后导出 MP4 并验证声音和同步。不要代替我批准，不要用 Demo 冒充我的作品。
没有音频时询问使用合成钢琴类似音色还是明确无声。缺工具先报告具体缺口；首次安装和大型下载先说明并等待同意。
识谱困难时先做代表性小节，不要静默执行一个小时或编造音符。
```

不支持 `$名称` 的 Agent：改为“读取官方 remotion-best-practices 的 SKILL.md，再读取本 Skill 的完整路径/SKILL.md，按 RC6 执行”。

用户无需准备整套 CLI。标准 MusicXML/MIDI 优先；SVG 还需要对应的含时值与坐标的 timeline；MP3 需要真实转谱和校准；PDF/图片需要识谱并人工核对。专业 OMR 优先复用，MuseScore/VexFlow 负责排谱，不是识谱准确率证明。没有可靠能力就给出疑点和最小工具接入选项。所有输入保留来源与原件。

统一入口：`node <skill>/scripts/piano.mjs --help`。实际命令、确认响应格式、音频选择、原生 SVG 坐标和可选 Audiveris 接入见 [RC6 工作流程](references/rc6-workflow.md)。基础动画不需要 Python；识谱或对照按需复用 Python。仅在确认没有兼容环境后申请安装，不能把不在 PATH 或一次超时当成未安装。

默认有两次内容确认。谱面有误就指出小节号、音符或连线位置，修改后重新确认；画面参数变化重做关键帧，不重新识谱。修改音符、节奏或音乐时间轴要重新核对谱面。预览和导出绑定同一曲目的 props/audio/score/timeline。

[测试记录与未验证能力](TEST-RESULTS-RC6.md)。当前为发布候选版；许可证仍未指定，详见 LICENSE.txt。
