# Piano Remotion 安装和使用

状态：**已完成技术封装与本机独立渲染验证；rc5 为 GitHub 发布候选版**。按所有者选择，暂不指定公共许可证；见 LICENSE.txt。仓库为 https://github.com/Fallonwong/piano-remotion，安装命令与公开获取方式见 [首页](README.md)。

本包保留原版 ScoreNoteLeap，并提取原工程的双手光效、倾斜乐谱、共享坐标运镜、暗角、标题、进度条。不会附带原曲、私人 IP、品牌或字体，也不会修改原工程入口。默认关闭装饰图层。

## 先安装并读取官方 Remotion Skill

Piano Remotion 是基于 Remotion 的专项 Skill。让 Agent 使用本 Skill 前，**先检查并读取官方 `remotion-best-practices`，再读取 `$piano-remotion`**。已有官方 Skill 就直接复用，不重复安装。

没有安装时，按 [Remotion 官方安装说明](https://www.remotion.dev/docs/ai/skills) 执行：

```sh
npx skills add remotion-dev/skills
```

根据安装器提示选择目标 Agent 和项目级/用户级范围。安装后确认能找到并读取 `remotion-best-practices/SKILL.md` 及其关联参考文件；不能仅因命令执行过就认定成功。这里提供的是已核对的官方安装指引，本次没有重复安装你已有的官方 Skill。

Codex 等支持 Skill 调用的 Agent：先调用 `$remotion-best-practices`，再调用 `$piano-remotion`。WorkBuddy 等若无法自动发现，直接读取已安装的官方 Skill 的真实路径，再读取本 Skill；保留官方目录结构，避免子参考文件断链。安装失败、无法联网或找不到文件时，应明确报告，并暂停依赖它的 Agent 开发/修改，不假装已读取。

官方 Skill 负责 Agent 的开发规范；`npm ci` 安装的是 Remotion/React 等实际运行依赖，两者不能互相替代。已有工程直接执行既定预览/渲染脚本时，运行时不依赖 Skill 文件。`doctor.mjs` 仅检查运行依赖和素材，不检查 Agent 是否已加载官方 Skill。更新官方 Skill 不代表可以升级当前工程的固定依赖版本。

## 再安装 Piano Remotion Skill

支持 Skills CLI 的 Agent 可执行 `npx skills add Fallonwong/piano-remotion --skill piano-remotion`，按提示选择 Agent 和安装范围。官方 Skill 已安装时直接复用。具体素材场景的现成提示词见 [示例](examples/agent-prompts.md)。

解压后保持完整 `piano-remotion/` 文件夹。Codex 放到 `~/.codex/skills/piano-remotion/`，新会话调用 `$piano-remotion`。WorkBuddy 等 Agent：放到该 Agent 实际配置的 Skill 搜索目录；不同版本路径不同，不假设固定目录。不支持发现时直接提示“读取 <完整路径>/piano-remotion/SKILL.md 并按说明执行”。这两条路径运行相同的 Node 脚本，不依赖 Codex 专用服务。

## 已有 Remotion 工程（优先）

```sh
node <skill>/scripts/doctor.mjs <project>
node <skill>/scripts/install.mjs --project <project>
cd <project>
npx --no-install remotion compositions src/piano-remotion-demo/index.tsx
npx --no-install remotion studio src/piano-remotion-demo/index.tsx
npx --no-install remotion render src/piano-remotion-demo/index.tsx PianoRemotion-Demo out/demo.mp4
```

命令中的 `<skill>/<project>` 必须替换为实际路径，有空格时加引号。安装器预检全部目标，存在不同文件时整体拒绝；相同组件可直接复用。安装器不替换现有 package.json、入口或组件库索引。如需加入已有库，按项目约定追加 INDEX.md/index.ts，不覆盖已有内容。

## 独立验证 / 新电脑

需要 Node >=20（本次实际为 24.19.0）、npm、首次安装和浏览器下载可访问网络。无需 Python、FFmpeg CLI、识谱软件或额外字体即可跑无声测试。

```sh
node <skill>/scripts/install.mjs --standalone <new-empty-path>
cd <new-empty-path>
npm ci
node <skill>/scripts/doctor.mjs .
npm run typecheck
npm run compositions
npm run studio
npm run render
```

输出 `out/PianoRemotion-Demo.mp4`，1280×720 / 30fps / 180 帧 / 6 秒。`--standalone` 目标必须不存在，避免覆盖文件。首次 CLI 会准备浏览器；离线环境请预先准备 npm 包及兼容浏览器，并通过 Remotion 的 `--browser-executable` 指定。浏览器/工具没有安装成功时应报告失败。

## 使用自己的音乐

接受 MusicXML、MIDI、SVG、MP3、五线谱图片、简谱图片及其组合。缺少标准素材时，先读 [统一素材处理](references/material-preparation.md)，发现并复用当前 Agent 的 Skill、工具、库和已授权服务，自主补齐缺失环节；不强制安装全部 CLI，也不默认要求用户手写时间轴。Agent 自己的视觉/识谱能力可以使用，但必须验证结果，不能猜调号、节奏或伴奏。

最终交接是同布局 SVG + timeline，可选 MP3。准备好后按 [输入准备](references/input-preparation.md) 和 [数据契约](references/data-contract.md) 导入，将音频与谱面放 `public/score/<slug>/`；结构检查通过不代表识谱准确或听感同步。

```sh
node <skill>/scripts/prepare.mjs --svg <score.svg> --timeline <timeline.json> --audio <performance.mp3> --midi <score.mid> --musicxml <score.musicxml> --out <project>/public/score/my-song
```

audio/midi/musicxml 参数均可省略，目标目录必须尚不存在。用户 props 写好后运行 `node <skill>/scripts/doctor.mjs <project> --props <song-props.json>` 检查全部实际素材。doctor 自动识别独立示例或已有工程安装入口，检查对应素材；无法识别安装模式时要求显式 props，不根据目录名猜测。已有工程中其他 `score/demo` 不会覆盖 Piano 示例的选择。

`node --test <skill>/scripts/test.mjs` 可复跑 31 项素材工具测试（在 scripts 下生成隔离测试证据）；`node --test <skill>/scripts/doctor.test.mjs` 检查素材目录选择与显式 props 优先级（证据位于系统临时目录）。

创建 `song-props.json`：`{"timeline": <完整时间轴对象>, "scoreSrc":"score/my-song/score.svg", "audioSrc":"score/my-song/audio.mp3", "title":"自己的曲名", "overlay":{"enabled":false}}`，再向 compositions/studio/render 增加 `--props=song-props.json`。帧率和时长取自 timeline；输出尺寸在测试入口 Composition 的 width/height 修改。`scoreImage` 处理裁剪/平移/缩放，`cameraPath` 处理逐帧镜头，所有光效随共同父容器变换。

可选个人图层：仅当用户提供授权素材后传入 `overlay:{enabled:true,src:'score/my-song/character.webm',kind:'video',transparent:true,loopFrames:300}`；图片用 `kind:'image'`。不传或 enabled:false 时完全不加载图层。署名通过 `credit` 显式传入。

五线谱图片可通过 `--score-image <file>`、简谱图片通过 `--jianpu-image <file>` 提供给 prepare；可与 `--audio` 等参数组合。缺 SVG/时间轴时脚本返回缺项及 Agent 处理指引，不声称已经识别图片。Agent 可直接使用自己的工具生成标准素材后重新导入，或显式选择符合协议的 `--preprocessor`。CLI 每种图片参数接收单个文件，多页素材由 Agent 先整理处理。

## 已验证范围

见 TEST-RESULTS.md 与 manifest.json：Windows 独立目录真实安装、类型检查、CLI discovery、MP4 和抽帧。无声几何测试不验证真人音乐转谱/对齐；未在其他系统或实际 WorkBuddy 宿主运行，不声称全部平台已认证。
