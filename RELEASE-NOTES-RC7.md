# RC7 本地候选更新

基于一次完整制作中暴露的简易波形音色差、用音色包络迎合起音检测、重复改谱等问题，增加以下确定性入口：

- audio-plan：发现现有音源与程序，不自动安装。
- audio-render：通过已安装 MuseScore Basic 从完整批准 MusicXML 导出，记录原谱/程序/音色/命令来源。
- audio-master：全局补静音/增益、近静音尾巴处理与新文件输出，保护可听尾音。
- audio-recording：为用户已有录音记录字节来源；仍需校准和试听。
- notation-audit：逐小节修订差异、范围外变化、高风险段与证据绑定疑点。

内置波形合成现在明确为 --preview-only 草稿；新 checked bind 需要 --audio-evidence；PDF/图片 score-request 需要 --notation-audit。最终音频来源与混音纳入关键帧/试听确认。默认保留谱面、关键帧/试听两次内容确认。

核心动效字节未改。真实 OMR 准确率没有新增验证，也没有下载 OMR。详见 TEST-RESULTS-RC7.md。

本次仅交付本地候选 ZIP 及安装更新，没有上传 GitHub。许可证仍未指定；不包含第三方音色、私人乐谱或音乐。
