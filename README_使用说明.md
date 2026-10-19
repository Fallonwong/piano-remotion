# Piano Remotion RC5 使用说明

当前为 RC5 整改版 r1；原有公开 rc5 标签保留，不覆盖历史发布。完整用户首页见 [README](README.md)，各项验证见 [本轮报告](TEST-RESULTS-RC5.md)。公共许可证仍未指定。

## 开始前

先读取已安装的官方 remotion-best-practices，再读取 SKILL.md。官方 Skill 无需重复安装；缺失时先报告首次安装方案。使用统一入口 `node <skill>/scripts/piano.mjs`。Python 不是基础动画的强制依赖。

## 环境与安装

```sh
node <skill>/scripts/piano.mjs doctor <project> --authorized-project <authorized-other-project> --python <existing-python>
node <skill>/scripts/piano.mjs install --project <project> --plan
```

先评估复用；只能读取明确授权的其他项目。兼容当前依赖直接使用。目标没有 node_modules 时，可在精确版本与声明一致的前提下显式 --reuse-project；不会替换已有依赖。新目录用 --standalone <new-directory> --plan，说明预计安装内容并取得确认后，才执行所选包管理器安装。不要把脚本返回的 confirmation_required 当作成功安装。

## 曲目而非 Demo

先按 [RC5 工作流程](references/rc5-workflow.md) 准备同布局 SVG、时间轴与布局证据。PDF/图片使用专业 OMR 或已验证替代，经过 [结构和逐小节视觉检查](references/score-validation.md) 后才进入排版完成阶段。不允许把未经核实的音符交给排版引擎后就称为识谱成功。

将真实曲目放 public/score/<slug>/，props 包含 timeline 对象、scoreSrc 和提供的 audioSrc。MP3 必须检查：

```sh
node <skill>/scripts/piano.mjs align --project <project> --props <props.json> --out <new-alignment.json>
node <skill>/scripts/piano.mjs bind --project <project> --props <props.json> --layout <mapping.json> --alignment <alignment.json> --source-type svg --out <new-job.json>
node <skill>/scripts/piano.mjs preview --job <job.json> --browser <existing-browser>
```

源为 PDF/图片/MusicXML/音频转谱时如实填写 --source-type，并附 --score-review <compare-report.json>。缺音频时先询问是否合成；只在明确确认后使用 synthesize ... --confirmed 或为无声预览填写 --silent-confirmed。音频、源谱、结构、视觉、布局任一关卡不确定时保留明确报告，不自行标记完成。

当前用户确认导出后：

```sh
node <skill>/scripts/piano.mjs render --job <job.json> --out <new-video.mp4> --confirmed --browser <existing-browser>
```

自动验证成片并写入 .verification.json。复用同一 job，不切换 props，不用 Demo 替代用户歌曲。详细参数、布局归一化限制、自动起音检测的适用范围见 [RC5 工作流程](references/rc5-workflow.md)。
