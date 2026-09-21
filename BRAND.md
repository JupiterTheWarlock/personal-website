# 共享品牌背景

`public/junkyard-scene/` 是生成的部署资源，不直接编辑。

唯一来源是个人工作台的 `tools/jthewl-brand/`。在工作台根目录运行 `node tools/jthewl-brand/sync.mjs` 更新三站，运行同命令加 `--check` 检查是否一致。`brand-manifest.json` 记录版本和文件校验值。

主页使用 home 模式；正文服务端输出，场景和鼠标反馈独立加载。本站发布不依赖另外两个网站在线。
