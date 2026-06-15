# 🏆 进球预测姬 · 你的 AI 球评搭子

一个**单文件零依赖**的 2026 FIFA 世界杯 AI 预测站，定位**球迷向可信信息站**。

🌐 **在线访问**：[https://guigui858.github.io/worldcup2026/](https://guigui858.github.io/worldcup2026/)

## ✨ 核心特性

- 📊 **AI 战绩看板**：逐场对错明细，AI 翻车也大方承认（当前 5/12）
- 🎯 **AI 比赛预测**：基于 ELO + 主观评估的胜负 / 比分概率
- 📜 **历史交锋**：7 组热门对决真实历史比分（来源 wikipedia / thesoccerworldcups / fifaranking 等）
- 📈 **出线情景树**：每组 Monte Carlo 3000 次模拟，给出每队头名 / 前 2 / 第 3 / 出局四列概率
- 🏆 **2026 新赛制支持**：12 组前 2 直出 + 8 个最佳第 3 名出线（共 32 队进 1/16 决赛）
- 🥇 **真实 ELO 数据**：来自 eloratings.net 2026-06 真值快照

## 🛡️ 数据真实性铁律

本站所有展示数据**必须真实可 verify**：
- ELO：eloratings.net 真值
- 历史比分：wikipedia / thesoccerworldcups 等公开档案
- 已结束比赛：实际新闻比分
- ❌ 绝不使用模拟数据 / 随机游走 / 编造比分

## 🔧 技术栈

- 单 HTML 文件，零构建步骤
- 原生 JavaScript（无框架）
- 自定义 CSS（无 Tailwind / Bootstrap）
- 部署：GitHub Pages

## 📅 cron 自动维护

- 每日 03:00：从 wikipedia 拉取最新 ELO，更新本地 TEAMS 字典
- 每周日 23:00：拉取本周已结束赛果，更新页面真实比分

## 📜 License

MIT
