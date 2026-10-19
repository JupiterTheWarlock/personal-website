# Unity Web 与 R2 发布

当前接入游戏会话已验收的 Unity 0.3.6 `web-r5`（2026-10-19）。`web-r4` 有音频解码错误，禁止使用；也不使用退役的 `web/` Demo。

批准包共 5 个文件、87,918,326 字节，完整清单见 `config/aaa-sewer-king.release.json`。资源位于 `https://cfr2cdn.jthewl.cc/games/aaa-sewer-king/releases/0.3.6-a3dde185d50117e6f5e3/`。其中 data.gz 为 71,555,070 字节（68.24 MiB），由 R2 提供，不进入 Pages 或 Git。

原始 ZIP 为 `AAASewerKing-Web-0.3.6-20261019.zip`（87,112,920 字节），SHA-256 为 `0b40fcb71493ed11722020f10e49c1842a430c6d007bf247f753af2aae3028dc`。主站卡片截图来自该版本验收资料 `windows-map-arrow.png`，保留原图。

## 固定入口与资源位置

- 运行页固定为 `/games/aaa-sewer-king/play/index.html`，Pages 将其规范到同目录 `/play/`。不随版本或语言改变运行目录。
- 使用现有桶 `picgo`、CDN `https://cfr2cdn.jthewl.cc`，资源目录为 `games/aaa-sewer-king/releases/<version>-<manifest-digest>/`。
- 所有 Build、StreamingAssets、TemplateData 和原始运行壳保存在该版本目录；Git 仅记录发布清单和网页源码，Pages 构建只下载运行壳并校验 SHA-256。
- 运行壳内资源 URL 改成对应版本的绝对 CDN 地址；页面位置、消息来源和浏览器存档目录保持主站同源。
- `.wasm.gz` 使用 `application/wasm`，`.data.gz` 使用 `application/octet-stream`，`.js.gz` 使用 `application/javascript`；三者均设置 `Content-Encoding: gzip`。版本资源使用一年不可变缓存，主站运行壳使用 `no-cache`。
- 壳保留 `noindex` 和 `autoSyncPersistentDataPath: true`；不在 robots 中封禁运行页。发现线程构建时工具停止，待单独验证 worker URL 与 COOP/COEP 后再接入。

## 发布步骤

以下命令只用于游戏会话交付并验收通过的完整包，不能对构建中的目录执行。R2 凭据从本机 `.env` 或环境变量读取，不写进清单或源码。变量名沿用 `r2-manage-skill`：`R2_ACCOUNT_ID`、`R2_ACCESS_KEY`、`R2_SECRET_KEY`、`R2_BUCKET`、`R2_PUBLIC_URL`，可选 `R2_ENDPOINT`。

```powershell
# 先检查 gzip 完整性、文件引用、大小和哈希；这里只生成本机清单
node scripts/unity-r2.mjs plan <已验收的完整目录> .local/unity-release.json --env-file <本机R2配置路径>

# 配置主站、Pages 正式默认域名和本机 3456/8096 测试端口；保留桶的其他规则
node scripts/unity-r2.mjs cors --env-file <本机R2配置路径>

# 三个独立的小测试对象，检查 CDN 的 MIME、gzip 解压和 CORS，不上传游戏
node scripts/unity-r2.mjs probe .local/r2-probe.json --env-file <本机R2配置路径>

# 上传前重新检查整个包与清单一致；已存在的不可变对象必须一致，否则拒绝覆盖
node scripts/unity-r2.mjs upload <已验收的完整目录> .local/unity-release.json --env-file <本机R2配置路径>
```

上传完成后，检查真实游戏资源的 HTTP 响应、字节数与 SHA-256。gzip 资源对比压缩后的原始字节；普通 HTML/JS 请求 `Accept-Encoding: identity`，避免 CDN 临时压缩影响原始文件校验。将清单复制为 `config/aaa-sewer-king.release.json` 进行本地构建，并在浏览器验证加载、操作、声音、刷新后的存档，验收通过再随四语言介绍页和试玩入口一起提交发布。只上传资源不会自动发布运行页或试玩按钮。

`npm run build` 在 Next 静态导出之后执行 `prepare-unity.mjs`。没有发布清单时直接结束；有清单时校验 CDN 运行壳再生成 `out/games/aaa-sewer-king/play/index.html`。后续 Git 自动发布会继续取同一版本，避免一次手动部署的游戏被下次网站构建清掉。

## 跨域与验收

R2 规则 `personal-site-unity` 允许主站、www、正式 `pages.dev` 及本机测试地址的 GET/HEAD，支持 Range，并暴露 Content-Length、Content-Encoding、Content-Type、ETag、Accept-Ranges、Content-Range、Last-Modified。动态 Pages 预览域名尚未加入，验包使用固定默认域名或本机测试地址。

只有请求包含 `Origin` 时 R2 才会返回 CORS 响应头；已有缓存可能需要刷新，因此新资源使用新目录。依据：[Cloudflare R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)。Pages 的多条匹配规则会合并同名响应头，主站通配规则只设置 noindex/nosniff，缓存规则单独匹配运行壳。依据：[Pages 响应头规则](https://developers.cloudflare.com/pages/configuration/headers/)。

`SceneProvider` 统一管理背景；游戏 iframe 挂载之前先完成背景卸载，关闭时先销毁游戏文档再恢复背景。收到 ready/running/closed 消息时同时核对 `event.origin`、`event.source` 和 game 标识，离开页面时也恢复背景。介绍页提供独立打开和全屏入口；全屏不可用时显示对应语言的提示。
