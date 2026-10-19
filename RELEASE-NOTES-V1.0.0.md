# Piano Remotion V1.0.0

让钢琴乐谱随音乐跳起来：基于原版 ScoreNoteLeap / PianoScoreScene，支持双手跳跃、渐细发光轨迹、和弦高亮和跟谱运镜。

## 这版包含什么

- 面向 Codex、WorkBuddy 等 Agent 的统一执行入口，优先发现和复用现有运行环境。
- MusicXML、MIDI、SVG、MP3、PDF、五线谱图片与简谱的素材处理路径。
- 原谱与重排谱逐小节对照、修订前后差异、高风险小节和疑点记录。
- 谱面确认、真实关键帧与试听确认，两次内容确认后导出。
- 已有录音接入、现有 MuseScore Basic 音源导出、全曲来源绑定与母版处理。
- 延音线持续、圆滑线与独立起音处理，以及音视频流和抽样同步检查。
- 全新首页、安装指南、可复制提示词和常见问题。

## 安装

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices
npx skills add Fallonwong/piano-remotion --skill piano-remotion
```

也可下载附件中的完整 ZIP，保持 `piano-remotion/` 目录安装到当前 Agent 的 Skill 位置。已有版本建议先备份，再更新完整目录，开启新对话。

动效组件及私人作品保持原样；包内不附带私人乐谱、商业歌曲或第三方音色库。授权信息见 LICENSE.txt。
