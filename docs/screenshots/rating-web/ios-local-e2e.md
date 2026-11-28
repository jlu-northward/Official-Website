# iOS 本地评分联调截图

2026-11-13，iPhone 16e / iOS 26.3 模拟器，普通 main.dart + 本地评分网页 + 原生消息桥 + 独立 MySQL/Redis。截图为实际渲染和持久化结果，测试数据均明确标注联调用途，不使用 preview transport。

- ios-local-home.png：评分首页，包含 App 创建并经 Admin 审核的对象。
- ios-local-rating.png：通过原生桥提交 10 分后重新加载的对象详情。
- ios-local-approved.png：对象9233经真实Admin界面审核并修改地址/标签/单品后，App重新读取的详情。

本次还通过回复与点赞、校区筛选和管理端修改榜单类型的联调。创建使用已有测试媒体 key，不验证真实OSS上传；新对象封面因本地CDN占位的HTTPS地址无法连接HTTP服务而显示占位。相册上传、高德唤起、Android真机和生产数据副本迁移仍待验收。

评分页与弹层显式优先中文字体，已修复本次模拟器WKWebView的缺字；本地iOS入口采用默认HTTP80端口代理以避开当前插件对自定义端口的比较缺陷。普通运行曾因Vite生成缓存重复React出现Invalid hook call，重建开发缓存后恢复。
