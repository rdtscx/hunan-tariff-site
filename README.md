# 湖南移动资费监控网站

中国移动资费数据实时监控与展示网站，支持全国及各省份资费套餐查询。

## 功能特性

- **实时API查询**：通过中国移动官方API实时获取最新资费数据
- **全国/省份切换**：支持全国资费和各省份资费分类查询
- **多维度筛选**：按个人/政企、套餐/加装包/营销活动筛选
- **运营商切换**：支持移动/联通/电信/广电主题切换
- **自动更新**：GitHub Actions 定时抓取数据并自动部署

## 技术架构

- **前端**：原生 HTML/CSS/JavaScript，单页应用
- **后端**：PHP 代理（api.php），处理API加密请求和缓存
- **数据采集**：Node.js 爬虫，调用中国移动官方API
- **部署**：GitHub Actions + FTP 自动部署到虚拟主机

## API 说明

中国移动官方API使用 AES-128-CBC 加密：
- 密钥：`1234123412ABCDEF`
- 偏移量：`ABCDEF1234123412`
- 请求明文JSON加密后以hex大写POST
- 响应 `{"body":"<hex>"}` 解密后获取数据

## 项目结构

```
├── .github/workflows/
│   └── mobile-build.yml    # GitHub Actions 工作流
├── pipelines/mobile/
│   ├── crawl_all.js        # 主爬虫脚本
│   ├── api.js              # API调用封装（AES加密）
│   ├── config.js           # 配置文件
│   └── package.json        # Node.js依赖
├── scripts/
│   └── build.sh            # 构建脚本
├── data/                   # 数据文件目录
├── index.html              # 网站前端
├── api.php                 # PHP后端代理
└── README.md
```

## 配置 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置：

- `FTP_SERVER`：FTP服务器地址
- `FTP_USERNAME`：FTP用户名
- `FTP_PASSWORD`：FTP密码
- `FTP_SERVER_DIR`：FTP部署目录（通常为 `/`）

## 部署

推送到 main 分支或手动触发 Actions 即可自动构建并部署。

## 许可证

MIT
