# 🛡️ DevPrivacyBox

> **100% 浏览器本地运行 · 零数据外发 · 绝不泄密的开发与数据瑞士军刀**  
> *100% Client-Side Developer & Data Utility Box. Zero Server Upload. Pure Privacy.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-success.svg)](#-为什么选择-devprivacybox)

---

## 💡 为什么选择 DevPrivacyBox？

在日常开发与数据处理中，我们经常需要处理包含敏感信息的业务数据、数据库表结构与生产日志。但绝大多数在线工具站都会把用户输入的内容默默上传到云端服务器，存在严重的数据泄露与合规风险。

**DevPrivacyBox 承诺：**
- 🔒 **100% 浏览器本地运行**：所有的正则表达式解析、AST 推断、文本转换都在你自己的浏览器内核中完成。
- 🚫 **零网络外发**：页面加载完成后，**拔掉网线 / 断开 Wi-Fi 照样正常运行**。
- ⚡ **极速体验**：纯静态前端，首屏毫秒级加载，无任何外部广告与跟踪脚本。

---

## 🚀 核心功能清单

### 1. Excel / CSV ➔ 批量 SQL 生成器
- **直接粘贴**：从 Excel / WPS 中复制多行多列直接粘贴，首行自动识别为字段名。
- **高性能分批**：支持按 100 / 500 / 1000 行自动切分为多个 Batch Insert 语句，避免触发 MySQL `max_allowed_packet`。
- **智能类型推断**：自动识别数字、布尔值、时间日期与字符串，自动处理转义单引号与 NULL。
- **附带建表 DDL**：可一键同时生成匹配字段类型的 `CREATE TABLE` 语句。

### 2. JSON ➔ Java Entity / TypeScript 接口生成器
- **Java DTO 生成**：自动生成符合阿里巴巴/通用规范的 Java 实体类，支持 Lombok (`@Data`, `@Builder`, `@NoArgsConstructor`) 与 Jackson `@JsonProperty` 映射。
- **TypeScript 接口生成**：自动生成嵌套完整的 TS `interface` 定义。
- **命名风格转换**：下划线 `snake_case` 智能转为大驼峰 / 小驼峰命名。

### 3. 生产敏感数据批量脱敏助手 (Data Masker)
- **多规则联动**：支持手机号（`138****1234`）、18位身份证号、电子邮箱、银行卡号与 IPv4 地址一键脱敏。
- **生产排查利器**：排查线上问题或将日志提交给外部协同前，一键抹去真实个人信息。

---

## 🛠️ 本地启动与开发

本工具基于现代纯前端技术栈构建：**Vue 3 + Vite + Lucide Icons**。

```bash
# 1. 克隆代码或进入项目目录
cd dev-privacy-box

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev

# 4. 构建生产打包产物
npm run build
```

打包完成后，`dist` 目录内的静态 HTML 可以在任何静态服务器、Nginx、或者直接在浏览器打开运行。

---

## 🌐 一键免费部署到 GitHub Pages

项目已内置 `.github/workflows/deploy.yml` 自动化流水线。

1. 在 GitHub 上创建一个新的公开或私有仓库，例如 `dev-privacy-box`。
2. 在本地项目根目录下运行：
   ```bash
   git remote add origin https://github.com/Mianm-l/dev-privacy-box.git
   git branch -M main
   git push -u origin main
   ```
3. 打开 GitHub 仓库的 **Settings -> Pages**，将 **Build and deployment -> Source** 设置为 **GitHub Actions** 即可！几分钟后即可获得一个免费的全球可访问 HTTPS 独立网站。

---

## 📄 开源协议 (License)

本项目基于 [MIT License](LICENSE) 开源，欢迎自由二次开发、商用或自建团队内部离线版！
