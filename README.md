# Piano Remotion

基于 Remotion 的钢琴乐谱动效 Skill，保留原版 **ScoreNoteLeap**，支持双手音符跳跃、和弦高亮、渐细发光拖尾，以及共享谱面坐标的倾斜与运镜。

**当前版本：1.0.0-rc5-r1 · RC5 整改发布候选版。** 已完成 Windows 独立工程渲染验证；公共许可证尚未指定，见 [LICENSE.txt](LICENSE.txt)。本仓库可公开查看，但没有授予 MIT、Apache 等开源许可。

![通用测试谱面的真实渲染关键帧](assets/preview.png)

图中是随包合成测试数据的真实渲染，不包含商业歌曲或私人角色素材。

## RC5 整改：统一执行与分层验收

跨 Agent 使用同一个确定性入口：`node <skill>/scripts/piano.mjs`。完整命令和数据格式见 **[RC5 工作流程](references/rc5-workflow.md)**。主要整改：

- **环境先复用**：检查当前/显式授权项目、实际依赖与 CLI、Node 包管理器、现有 Python/venv、PATH 外的 Windows 常见安装位置。先计划，首次安装或新增大型依赖先确认；不会自动 npm 安装或新建 venv。
- **谱面先校验**：区分 PDF/图片 OMR、标准 MusicXML/MIDI 和音频。逐小节保留结构化音符与疑点，提供源谱/重排谱裁切对照；VexFlow 画出 SVG 不代表识谱正确。
- **音频成为关卡**：MP3 必须能解码、时长合理且有声音，测量开头/中段/末尾起音偏差；缺音频时先询问合成或明确静音预览。
- **同一曲目数据**：checked job 固定 SVG/timeline/audio/props/layout/review 哈希；预览和导出都走无 Demo 回退的 Song 入口。
- **成片验证**：实际 MP4 的视频/音频流、时长、尺寸、帧率、非静音信号和抽样同步均由脚本检查。识谱、结构、视觉、几何、音频、成片状态分别报告。

Python 不是基础动画的强制依赖。原版 ScoreNoteLeap/PianoScoreScene 组件保持兼容且字节未变；旧 Demo 入口仍保留，但新歌曲请使用 checked job 工作流。

## 先安装官方 Remotion Skill

Piano Remotion 是专项扩展。让 Agent 使用前，先检查并读取官方 `remotion-best-practices`，再读取本项目的 [SKILL.md](SKILL.md)。已安装就复用；未安装时按 [Remotion 官方说明](https://www.remotion.dev/docs/ai/skills)执行：

```sh
npx skills add remotion-dev/skills
```

按安装器选择目标 Agent 和安装范围，并确认实际文件可读取。官方 Skill 提供 Agent 工作规范；项目中的 Remotion/React 依赖仍需单独安装。

## 安装 Piano Remotion Skill

支持 Skills CLI 的 Agent 可以从本仓库安装。在自己的工作目录执行：

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices
npx skills add Fallonwong/piano-remotion --skill piano-remotion
```

按提示选择目标 Agent 和安装范围。默认项目级安装；已有官方 Skill 则跳过第一条。Codex 用户需要跨项目使用时，可显式选择用户级：

```sh
npx skills add remotion-dev/skills --skill remotion-best-practices -g -a codex
npx skills add Fallonwong/piano-remotion --skill piano-remotion -g -a codex
```

上述命令依据 [Skills CLI 文档](https://github.com/vercel-labs/skills)。安装 Skill 并不安装 Remotion 项目依赖；后面的独立示例用 `npm ci` 准备运行环境。安装后确认 Agent 能读取官方和本 Skill 的实际文件；必要时开启新会话。Windows 不支持符号链接时可在安装器选择复制方式。

手动安装可下载 [发布候选包](https://github.com/Fallonwong/piano-remotion/releases)，或克隆仓库：

```sh
git clone https://github.com/Fallonwong/piano-remotion.git
```

将本目录保持为 `piano-remotion/`。Codex 可放到 `~/.codex/skills/piano-remotion/`，新会话先读取 `$remotion-best-practices`，再调用 `$piano-remotion`。

WorkBuddy 等 Agent 使用其实际配置的 Skill 目录；没有 Skill 自动发现能力时，直接提示 Agent 依次读取官方 Skill 和本项目的 `SKILL.md`。本 Skill 的工具使用 Node.js，不依赖 Codex MCP。

例如：

> 使用 $piano-remotion，先读取官方 remotion-best-practices。把我提供的 SVG、时间轴和 MP3 接入已有 Remotion 工程，保留双手跳跃与发光效果，先打开预览。

也可以从缺少标准数据的素材开始：

> 使用 $piano-remotion。我提供了简谱图片和演奏 MP3，请先检查你已有的识谱、谱面生成和音频对齐能力，自主补齐标准素材，保留原旋律，不额外编配伴奏，完成后打开预览。缺少能力时只指导配置必要工具。

更多可直接复制的示例，包括“首次体验、已有标准素材、只有 MP3、五线谱/简谱图片、无音频、预览确认后导出”，见 **[Agent 提示词示例](examples/agent-prompts.md)**。将示例中的素材和工程路径替换为真实路径。图片、音频等文件须通过当前 Agent 支持的附件或本地路径提供。

## 兼容的通用 Demo（无声演示，不代表有声作品验收）

需要 Node.js >=20、npm；优先复用现有依赖与浏览器。以下 `<skill>`、`<new-directory>` 均需替换为实际路径；有空格时加引号，目标目录必须不存在。先运行 `node <skill>/scripts/piano.mjs install --standalone <new-directory> --plan`，报告路径、版本、安装内容与原因；只有确认没有兼容环境并得到首次安装授权后，才执行下面的 `npm ci`。浏览器准备需要下载时也应先说明并确认，现有浏览器可直接指定使用。

```sh
node <skill>/scripts/install.mjs --standalone <new-directory>
cd <new-directory>
npm ci
node <skill>/scripts/doctor.mjs .
npm run typecheck
npm run compositions
npm run studio
```

明确要求导出此无声 Demo 时可运行 `npm run render`，输出 `out/PianoRemotion-Demo.mp4`（1280×720、30fps、180 帧）。已有工程优先使用 `install.mjs --project <project>`；安装器不覆盖现有入口或不同内容的文件，详细命令见 [安装使用说明](README_使用说明.md)。

## 使用自己的素材

| 输入 | 内置工具与 Agent 处理路径 |
|---|---|
| 同一布局 SVG + timeline JSON | 通过实际几何映射/同次排版证据后驱动动效；不是只检查文件存在 |
| MusicXML | 内置导入及根元素检查；Agent 复用既有音高节奏，补 SVG、坐标和触发时间 |
| MIDI | 内置 format 0/1 PPQN、tempo map 解析；Agent 补记谱、分手/声部、排版与坐标映射 |
| SVG | 内置导入；缺时间轴时 Agent 从可用布局元数据或视觉能力恢复映射，再补触发时间 |
| MP3 | 内置接入音频；缺乐谱时 Agent 用已有音频转谱能力生成并校正，再补排版、坐标和同步 |
| 五线谱图片 | `--score-image` 接收路径；Agent 复用视觉/OMR，核对符号、音高、节奏后生成标准素材 |
| PDF 乐谱 | `--pdf` 接收来源；score source 检查已有专业 OMR，score compare 生成原谱/重排谱逐小节资料 |
| 简谱图片 | `--jianpu-image` 接收路径；Agent 核对调号、八度点、时值、休止、连音等，再生成匹配五线谱 SVG |
| 多种素材组合 | 复用每项最可靠的数据，只补缺失环节，不重复转谱或强制安装全部 CLI |

“支持输入”包括 Agent 协作前处理，**不表示内置脚本已集成六类素材的自动识别模型**。先发现当前 Agent 的 Skill、库、工具和已授权服务，自主选择能完成任务的路径。原生工具可以直接产出 SVG/时间轴，无需特制 CLI 适配器。具体流程与验收条件见 [统一素材处理](references/material-preparation.md)。

脚本返回 `incomplete` 时，会列出缺项和 Agent 补齐指引；有能力时继续处理。只有真实缺少能力或关键乐谱信息无法确定时，才说明最小配置需求或提出具体问题。不默认让用户手写时间轴，不擅自补伴奏，不将普通 OCR 成功当作识谱准确。

使用歌曲时，**先准备素材和 props，再预览或导出**。将 `--props=<song-props.json>` 传给每次 Remotion CLI 调用；doctor 使用 `--props <song-props.json>`。素材约束见 [数据契约](references/data-contract.md) 和 [预处理说明](references/input-preparation.md)。

个人图片/视频装饰为可选项，默认关闭，署名默认为空。不随包提供原曲、原曲谱面、私人 IP、品牌素材或字体，见 [素材边界](references/assets-policy.md)。

## 验证与限制

本轮真实完成环境复用、经确认的离线首次安装、标准素材导入、带非静音 MP3 的 6 秒成片及开头/中段/结尾起音校验；没有新增 OMR 或 Python 环境。原版动效组件字节不变。详见 **[本轮 RC5 测试报告](TEST-RESULTS-RC5.md)** 和 [历史报告](TEST-RESULTS.md)。PDF/图片缺专业 OMR 的情况、错误音符、未批准的逐小节差异均保持 blocked/needs_review；不把缺失分支测试当成真实识谱成功。未认证实际 WorkBuddy 宿主、其他操作系统、任意音乐的全音高或逐音同步。

```sh
node --test <skill>/scripts/test.mjs
node --test <skill>/scripts/doctor.test.mjs
node --test <skill>/scripts/workflow.test.mjs
node --test <skill>/scripts/environment.test.mjs
node --test <skill>/scripts/score.test.mjs
```

前一组会在 `scripts/.test-run-*` 保留测试证据；后一组使用系统临时目录。`.gitignore` 排除依赖、渲染输出、缓存和测试产物。上传仓库时使用本目录的完整源码；ZIP 可作为 Release 附件，避免将原始作品工程一并上传。
