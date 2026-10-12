# 四大运营商资费监控网站

移动/联通/电信/广电四大运营商资费数据实时监控与展示网站，支持全国及各省份资费套餐查询。

## 功能特性

- **四大运营商**：中国移动、中国联通、中国电信、中国广电数据全接入
- **实时API查询**：通过运营商官方API实时获取最新资费数据
- **全国/省份切换**：支持全国资费和各省份资费分类查询，默认北京
- **多维度筛选**：按归属、套餐类型动态筛选，支持搜索、排序、分页
- **运营商主题切换**：顶部一键切换运营商，独立子目录数据隔离
- **自动更新**：GitHub Actions 每日早8点/晚8点自动抓取并部署
- **变更追踪**：资费上下架变更历史记录与时间线

## 技术架构

- **前端**：原生 HTML/CSS/JavaScript，单页应用，响应式设计
- **后端**：PHP 代理（api.php），处理移动API加密请求和缓存
- **数据采集**：Node.js 爬虫（移动官方API）+ 多运营商数据同步
- **部署**：GitHub Actions + FTP 自动部署到虚拟主机

## 运营商数据来源

| 运营商 | 目录 | 数据来源 |
|--------|------|----------|
| 中国移动 | `/` | 官方API实时抓取 + 本地缓存 |
| 中国联通 | `/unicom/` | 数据源同步 |
| 中国电信 | `/telecom/` | 数据源同步 |
| 中国广电 | `/gb/` | 数据源同步 |

## 项目结构

```
├── .github/workflows/
│   └── mobile-build.yml      # GitHub Actions 工作流（每日8点/20点）
├── pipelines/mobile/
│   ├── crawl_all.js          # 中国移动主爬虫脚本
│   ├── sync_all.js           # 多运营商数据同步脚本
│   ├── api.js                # API调用封装（AES加密）
│   ├── config.js             # 配置文件
│   └── package.json          # Node.js依赖
├── scripts/
│   └── build.sh              # 构建脚本（支持多运营商目录）
├── data/                     # 中国移动数据文件
├── unicom/                   # 中国联通子站
│   ├── index.html
│   └── data/
├── telecom/                  # 中国电信子站
│   ├── index.html
│   └── data/
├── gb/                       # 中国广电子站
│   ├── index.html
│   └── data/
├── index.html                # 中国移动主站前端
├── api.php                   # PHP后端代理
└── README.md
```

## 配置 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置：

- `FTP_SERVER`：FTP服务器地址
- `FTP_USERNAME`：FTP用户名
- `FTP_PASSWORD`：FTP密码
- `FTP_SERVER_DIR`：FTP部署目录（通常为 `/`）

## 定时更新

- **北京时间早8:00**（UTC 0:00）
- **北京时间晚8:00**（UTC 12:00）

也可通过 Actions 页面手动触发 `workflow_dispatch`。

## 部署

推送到 main 分支或手动触发 Actions 即可自动构建并部署。

## 许可证

MIT
