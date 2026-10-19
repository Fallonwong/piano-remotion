# RC5 整改审计 · 1.0.0-rc5-r1

审计日期：2026-10-19。结论：**已验证范围内的工程整改、环境复用、安装规划、协议阻断及有声渲染通过；真实 OMR 识谱与真人核对尚未验证，不构成全功能通过。**

本文件记录 `1.0.0-rc5-r1` 的交付审计，不重写历史验收。旧 `v1.0.0-rc5` tag 作为历史版本保留。历史 `TEST-RESULTS.md` 的 RC1–RC5 陈述属于历史版本证据；本次修订范围以本文件及 `TEST-RESULTS-RC5.md` 为准。公开许可仍未指定，沿用 `LICENSE.txt`，不新增授权声明。

## 证据来源与公开脱敏

日志及 JSON 原始证据保留在独立审计工作区，本报告以 `<audit-evidence>/文件名` 引用其相对位置；不将含用户名和本机项目路径的原始日志复制进公开报告。`ENVIRONMENT-REPORT.json` 提供脱敏环境与证据摘要及原始证据 SHA-256。`<authorized-project>`、`<existing-python>`、`<reused-runtime>` 等是角色占位符，不是可直接运行的路径。

## 已验证的整改

| 范围 | 验收结果与依据 |
| --- | --- |
| 环境发现 | Node 实际运行；严格匹配 Remotion/CLI 4.0.515、React/ReactDOM 19.2.4、TS 5.9.3；兼容当前项目优先，其次显式授权项目；junction 与 physical node_modules 均有实机证据。见 `environment-evidence/package-managers-tests.tap` 和 `environment-final-private.json`。 |
| 包管理器与可选工具 | npm 11.17.0、pnpm 11.25.0、bun 1.4.2 实际版本探测成功；yarn 在已检查范围内未发现。Windows 包装器静态定位既有 JS 后由 Node 执行，不执行 cmdshell。PATH 外 MuseScore 4.7.5、既有 Python 3.12.14 可用；不因不在 PATH 就判缺失。 |
| 真实依赖复用 | `reuse-install-report.json` 记录 `dependencies.action=link`、基线版本匹配、`npmCi.executed=false`，从 `<authorized-project>/node_modules` 链接到 `<reused-runtime>/node_modules`。复用后 doctor 成功，独立 Song 入口已复制；没有把 Demo 回退当成 Song 成功。 |
| 首次独立安装 | 用户批准后在 `<first-install-runtime>` 执行离线 `npm ci --offline --ignore-scripts --no-audit --no-fund`，观察到新增 251 包、23 秒。`first-install-acceptance.json` 如实记录 `stdoutTranscriptRetained:false`：未保留 npm 原始 stdout，不存在可引用的安装逐行日志。doctor 见 `first-install-doctor.json`；真实 tsc 复验退出 0，见 acceptance 与 `first-install-typecheck.log`。 |
| 统一工作流 | 音频决策、显式合成确认、静音标记、输入冻结、同排版绑定、SVG viewBox 保护、审阅材料变更拒绝均有协议测试。最新 `workflow-release-tests.log` 为 14/14，通过范围不延伸到真实识谱。 |
| 真实有声 MP4 | `<reused-runtime>/out/RC5-audible-song.mp4`：6 秒、1280×720、30 fps，FFprobe 为 H.264 视频与 AAC 音频；最终 guard 再验证为 `media_verified`，见 `verified-against-final-guard.json`。开头、中间、末尾三次能量起音偏移约 42.63、39.46、36.73 ms，均小于 66.67 ms 阈值；非静音解码通过。 |
| 独立复测 | 保留初次 `independent-review/REPORT.md` 及定向 `independent-review/retest-two-fixes/REPORT.md`。复测 6 cases 全通过：源快照/producer sidecar 改变被拒绝，绑定后输入变化被拒绝，错误 viewBox 被拒绝，基线及恢复对照正常。该复测没有重跑真实 OMR，也不额外计入 86 测试／组。 |
| 原始工程与核心 | `preservation-final.json`：比较原始 20 files，`changed=[]`；`ScoreNoteLeap.tsx`、`PianoScoreScene.tsx`、`PianoRemotion.tsx` 三核心逐字节一致。该结论限于报告列出的比较范围。 |
| Skill 结构检查 | `quick_validate.py` 使用既有 `<validation-python>` 与 PyYAML 验证成功；bundled `<existing-python>` 缺 yaml，因此复用另一既有环境，没有安装 PyYAML 或创建 venv。此项独立于 86 测试／组，不冒称其为 bundled Python 的 yaml 成功。 |

MP4 SHA-256：`0ec268537350e0638236dd6b6cc0e565136b168bea38e627f11263223fe69ff9`。依据最终 guard 报告。三点能量起音检查不证明每个音高或整曲节奏正确。最终几何保护修订后，既有数据重新绑定得到 `<reused-runtime>/release-song-job.json`（`release-bind.json`：`status=bound`、`audio=calibrated`）；同一原 MP4 再验证仍为 `media_verified`，见 `verified-release-final.json`。这不是重新渲染的另一个 MP4。

## 识谱、审阅与能力边界

归档独立性补充：已实际解压源码 ZIP，用归档内脚本在首次安装目录的实体 node_modules 中绑定并渲染标准素材，第二支有声 MP4 验证通过。没有链接原始作品工程依赖，最终交付保留相同的已测试脚本字节。归档、脚本 SHA 及第二支视频的流／同步结果见 [ARCHIVE-VALIDATION.json](ARCHIVE-VALIDATION.json)。该项是实际 Remotion CLI 渲染，不是仅检查文件或退出码。

实际专业 OMR 在本机已检查环境中不可用。PDF／图像已验证的是输入检查、MusicXML 结构提取、原谱与重排谱逐小节比较产物、差异／未审阅／陈旧证据阻断，以及批准数据协议。MuseScore 实际重排并导出图像，不是从图像识谱的证明。

`score-evidence/rc5-validation-final/delivery-summary.json` 明确记录：`actualRecognitionSuccess=false`、`actualHumanReview=false`、`actualProductionSameRunEvidence=false`。真实比较产物仍为 `needs_review`；测试里的合成 approval 只验证协议，不能标为真人批准或真实生产同次排版证据。新增 workflow 回归逐一变更 5 个 snapshot、1 个 sidecar、2 个 crop，确认 bind 前后的拒绝，仍属于合成协议回归。

以下能力未覆盖或未完成：真实 PDF／图像 OMR、真人逐小节核对、复杂 path、nested SVG、styled／indirect SVG 的通用适配、全曲 pitch／节奏自动识别、每一音符的音画同步与真实演奏校准。有声测试素材是合成钢琴样音；不能据此宣布任意录音、任意曲谱或其他平台全量通过。

对 nested svg、style／defs／symbol／use 等可能引入其他坐标空间或间接／动态几何的输入，当前先拒绝并要求 normalize；这类负向保护已纳入现有几何回归组，不增加测试组数。该拒绝通过不表示已支持这些 SVG 的通用布局解析。

## 可选 OMR 后续方案（未安装）

Audiveris **5.11.0 Windows x86_64 MSI** 可作为另行授权的安装选项：[官方 release](https://github.com/Audiveris/audiveris/releases/tag/5.11.0)，[Windows MSI](https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-windows-x86_64.msi)。任务交付的安装规划大小为 **85,062,430 bytes**；官网资产列表显示约 81.1 MB。官网资产列表可核实版本、文件名和 SHA-256；精确字节数沿用安装规划记录，未下载核验大小或文件内容。

官方列示 MSI SHA-256：`ac221b0d39a90e32b7f43dbf9f5d5a45ff8b5424076af21b65278955688dac71`（[资产列表](https://github.com/Audiveris/audiveris/releases/expanded_assets/5.11.0)）。这是官方公布值，不是下载后计算值。未执行安装；安装成功后仍须单独做真实识谱和人工核对，不能自动解除当前边界。
