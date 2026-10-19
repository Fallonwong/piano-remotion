# RC5 测试与实机验收 · 1.0.0-rc5-r1

日期：2026-10-19。**按各套件最新适用日志合计 86 测试／组通过；各套件分次运行，并非一次命令运行了 86 项，也不是 86 首曲目或真实识谱案例。**

## 计数口径

所有日志路径相对于 `<audit-evidence>`，原始日志保留在私有审计工作区。

| 套件 | 计入 | 来源 | 口径 |
| --- | ---: | --- | --- |
| 预处理／标准材料 | 40 | `main-tests.log` | Doctor 区段之前 40 条通过记录。 |
| Doctor 回归 | 7 | `main-tests.log` | Doctor 区段 7 条；保留该次运行的夹具和执行上下文。 |
| 最新 workflow | 14 | `workflow-release-tests.log` | 14 passed，0 failed，0 skipped；约 527.15 ms。包括新增合成审阅证据冻结协议组。 |
| 最新 environment | 18 | `environment-evidence/package-managers-tests.tap` | 18 passed，0 failed，0 skipped；32,680.7106 ms；汇总见 `environment-evidence/package-managers-result.json`。 |
| Score 验证组 | 7 | `score-evidence/test-final.txt` | 7 个顶层测试组 passed，0 failed，0 skipped；39,111.4311 ms。每组可能含多项断言，不拆成更多测试计数。 |
| **合计** | **86** | **40 + 7 + 14 + 18 + 7** | 分次运行证据汇总。 |

`main-tests.log` 原始汇总为 57＝40＋7＋旧 workflow 10。旧 workflow 10 被最新 14 替代，不重复相加；`workflow-final-tests.log` 的 13 项也已被 release 14 项替代。早期 environment 12／16／18 次运行及失败后的修复日志属于历史，不重复计数。独立复测 6 cases、安装／typecheck、Skill 结构检查、真实媒体验收均单列，不叠加到 86。

## 协议与结构测试证明了什么

- 预处理：标准输入复制、时间线结构、非法／模糊输入拒绝、MIDI 特殊情况和 adapter 行为；不等于自动识谱准确率测试。
- 环境：当前／授权项目选择、固定版本与模块／实际 CLI 校验、junction 与 physical 依赖复用、计划不写入、不兼容／覆盖保护、限时探测、Python／非 PATH MuseScore，以及真实 npm 和安全 Windows 包装器解析。
- 最新 workflow：音频缺失、合成确认、音高输入要求、静音音轨拒绝、三点起音检查、显式时序／相机校准、无 Demo 回退、绑定冻结、同排版／viewBox 保护；同组还验证 nested svg、style／defs／symbol／use 间接几何被拒绝并要求 normalize。新增一组逐一变更 5 个源 snapshot、1 个 producer sidecar、2 个小节 crop，确认 bind 前 `SCORE_REVIEW_STALE`、bind 后 `JOB_STALE`；恢复夹具后基线可用，拒绝时不留下 job。
- Score 七组：和弦／休止／多声部、连音与拍号等结构；非法或歧义谱诊断；实际 MuseScore 重排及 PNG／PDF 产物；OMR 缺失阻断；小节比较、差异、陈旧 hash 拒绝；复用既有 Pillow 环境。合成审批成功只证明审批协议，不证明真人审阅、真实识谱或真实生产同次布局已完成。

## 真实运行与独立复测（不计入 86）

1. **环境复用**：`reuse-install-report.json` 记录 action `link`，来源 `<authorized-project>/node_modules`，目标 `<reused-runtime>/node_modules`，固定基线匹配；`npmCi.executed=false`。`environment-final-private.json` 中复用后 doctor 检查通过。公开版环境摘要见 `ENVIRONMENT-REPORT.json`。
2. **首次独立安装**：`first-install-acceptance.json` 记录用户授权离线 `npm ci --offline --ignore-scripts --no-audit --no-fund`，观察 251 包／23 秒；原始 npm stdout 未保存，`stdoutTranscriptRetained:false`，不捏造安装日志。`first-install-doctor.json` 检查通过；真实 `tsc --noEmit` 复验退出 0，由 acceptance 和 `first-install-typecheck.log` 共同记录。typecheck 日志无输出符合 tsc 成功静默，退出码依据 acceptance。
3. **真实媒体**：`render-audible.log` 与 `verified-against-final-guard.json` 记录 `<reused-runtime>/out/RC5-audible-song.mp4`。H.264、1280×720、30 fps、6 秒；AAC 解码非静音，RMS 0.0440545、peak 0.401001。开头／中间／末尾偏移 42.63／39.46／36.73 ms，均在 66.67 ms 阈值内。最终状态 `media_verified`；几何保护更新后 `release-bind.json` 再绑定得到 `<reused-runtime>/release-song-job.json`，且 `verified-release-final.json` 对同一原 MP4 再验证仍为 `media_verified`。不外推成整曲所有音符识别／同步通过。
4. **独立复测**：保留 `independent-review/REPORT.md` 初次发现和 `independent-review/retest-two-fixes/REPORT.md` 定向复测，及其 `evidence/results.json`。6 cases 全通过：基线绑定、源快照绑定前拒绝、同 runId 的 sidecar 变更拒绝、绑定后源变化拒绝、恢复基线、错误 viewBox 拒绝。只复测原两项缺陷；不是独立全量识谱验收。
5. **保护检查**：`preservation-final.json` 记录原始 20 files 无变化、3 core byte-identical。不是“整个用户磁盘无变化”的保证。
6. **Skill 结构**：既有 `<validation-python>` 加 PyYAML 运行 `quick_validate.py` 验证成功。bundled `<existing-python>` 没有 yaml，未因此安装依赖。此项依据验收执行记录；未另行保存独立 stdout 日志。

另已完成**源码 ZIP 解压后的独立成片验证**：从已打包 ZIP 的脚本入口，绑定标准 SVG/timeline/MP3，调用首次安装目录内的实体 node_modules 运行 Remotion CLI。没有链接原始作品工程依赖；成功导出第二支 `RC5-independent-package.mp4`，H.264 + AAC、1280×720、30 fps、6 秒，验证为 `media_verified`。成片 SHA-256 为 `8e97a9f65516239f81e546af08a44783fc98aa1c9f801c04ac9a119c83b0407c`；三点起音偏差同为 42.63／39.46／36.73 ms。见 [ARCHIVE-VALIDATION.json](ARCHIVE-VALIDATION.json)。该记录区分实际测试归档的 SHA 与最终归档，确认最终包保留相同的已测试脚本字节；之后只补交付报告与清单，不重写核心代码。本项不增加 86 项单元／协议测试的计数。

## 尚未验证

实际专业 OMR 不可用；真实 PDF／图像识谱与真人逐小节核对未验证。`score-evidence/rc5-validation-final/delivery-summary.json` 的三项 actual 标志均 false，真实比较仍 needs_review。复杂 path／nested SVG／styled／indirect SVG 的通用适配、全曲 pitch／节奏自动识别和所有音符同步未覆盖。当前总通过数只说明所列工程／结构／协议测试及有限实机链条通过，**不构成全功能通过**。

完整结论、可选且未安装的 Audiveris 5.11.0 Windows MSI 方案及权利边界见 `AUDIT-RC5.md`。旧 tag 保留，历史版本证据不覆盖。
