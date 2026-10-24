# seo-foundation Specification

## Purpose

定义个人品牌站的搜索引擎可发现性、社交分享元数据和文档语义结构。访客分享链接时看到完整预览，搜索引擎可以索引页面并正确理解页面结构。

## Requirements

### Requirement: 页面标题与描述

`index.html` MUST 包含非空的 `<title>` 和 `<meta name="description">`。标题 MUST 包含站点所有者名称和职业。描述 MUST 概括站点内容，长度不超过 160 个字符。两者 MUST 直接存在于静态 HTML 中。

#### Scenario: 静态 HTML 包含标题和描述
- **WHEN** 检查服务器返回的原始 HTML
- **THEN** `<head>` 中存在唯一的非空 `<title>` 和 `<meta name="description">`

#### Scenario: 社交爬虫不执行 JavaScript
- **WHEN** 不执行 JavaScript 的爬虫读取页面
- **THEN** 标题和描述仍然可读

#### Scenario: 描述过长
- **WHEN** 描述文本超过 160 个字符
- **THEN** 构建检查报告问题，不发布超长描述

### Requirement: 社交分享元数据

页面 MUST 包含 Open Graph 和 Twitter Card 标签。Open Graph MUST 包含 `og:type`、`og:site_name`、`og:title`、`og:description`、`og:url`、`og:image`、`og:image:width`、`og:image:height`、`og:image:alt` 和 `og:locale`。Twitter Card MUST 使用 `summary_large_image`，并包含标题、描述和图片。

#### Scenario: 社交平台读取预览
- **WHEN** 社交平台抓取页面
- **THEN** 平台可以读取标题、描述、站点名称和预览图

#### Scenario: 预览图尺寸
- **WHEN** 检查 `og:image` 指向的文件
- **THEN** 文件为 1200x630 像素，并通过绝对 URL 访问

#### Scenario: 预览图不可访问
- **WHEN** `og:image` 指向的 URL 返回 404
- **THEN** 验收失败，不发布缺失预览图的版本

### Requirement: 规范化 URL

页面 MUST 包含 `<link rel="canonical">`，其值 MUST 是绝对 URL。canonical 和 `og:url` MUST 指向同一个公开地址。公开地址 MUST 集中记录在 README 中，便于替换占位值。

#### Scenario: 首页规范化
- **WHEN** 检查首页的 canonical 和 `og:url`
- **THEN** 两者都是绝对 URL，且字符串相同

#### Scenario: 占位地址未替换
- **WHEN** 公开地址仍是 `https://your-username.github.io/my-website/`
- **THEN** README 明确提示发布前替换

### Requirement: 爬虫索引

站点 MUST 在构建产物中提供 `robots.txt`，内容允许通用爬虫和 Googlebot 抓取。页面 MUST 包含 `<meta name="robots" content="index, follow">`。`robots.txt` MUST 不包含禁止抓取整站的规则。

#### Scenario: robots.txt 可访问
- **WHEN** 请求 `/my-website/robots.txt`
- **THEN** 响应状态为 200，内容类型为文本，且包含 `Allow: /`

#### Scenario: 页面索引指令
- **WHEN** 检查页面 `<head>`
- **THEN** 存在 `index, follow` 的 robots 指令

#### Scenario: GitHub Pages 项目路径
- **WHEN** 站点部署在 `username.github.io/my-website/` 子路径
- **THEN** 页面级 meta robots 仍然生效，设计文档说明 robots.txt 不在主机根目录的限制

### Requirement: 文档地标与标题层级

页面 MUST 使用 `<html lang="zh-CN">`、`nav` 地标和 `main` 地标。页面 MUST 只有 1 个 `h1`。每个 section MUST 有可访问名称。卡片标题 MUST 使用 `h3`。

#### Scenario: 地标结构
- **WHEN** 辅助技术或爬虫解析页面结构
- **THEN** 页面包含 1 个 `nav`、1 个 `main` 和多个有名称的 section

#### Scenario: 标题层级
- **WHEN** 解析页面标题
- **THEN** 只有 1 个 `h1`，区块标题为 `h2`，卡片标题为 `h3`

#### Scenario: Hero 区域名称
- **WHEN** 屏幕阅读器读取 Hero 区域
- **THEN** Hero 作为有名称的 region 被识别

### Requirement: 图片与装饰层语义

所有内容图片 MUST 有非空的 `alt`。纯装饰层 MUST 对辅助技术隐藏。图片加载失败时 MUST 保留布局。

#### Scenario: 内容图片
- **WHEN** 检查页面中的内容图片
- **THEN** 每张图片都有描述性 `alt`

#### Scenario: 装饰背景
- **WHEN** 检查 Hero 的 Canvas 和渐变层
- **THEN** 它们被标记为 `aria-hidden="true"` 或等效方式

#### Scenario: 图片加载失败
- **WHEN** 任意内容图片请求失败
- **THEN** `alt` 文本可见，布局不塌陷
