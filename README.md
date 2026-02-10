# Rust Book CN

**Rust 程序设计语言** 中英双语版，支持中英文无刷新实时切换。

基于 [官方 Rust Book](https://github.com/rust-lang/book) 构建。

[English](./README_EN.md)

## 特性

- 中英文内容一键切换，无需刷新页面
- 基于 mdBook 构建，保留官方原版排版和代码示例
- 英文源通过 Git Submodule 引用官方仓库，方便同步上游更新

## 快速开始

### 克隆仓库

```bash
git clone --recursive <your-repo-url>
```

如果已经 clone 但忘了 `--recursive`：

```bash
git submodule update --init
```

### 前置依赖

- [Rust 工具链](https://rustup.rs/)
- [mdBook](https://github.com/rust-lang/mdBook)（`cargo install mdbook`）
- [Node.js](https://nodejs.org/)（本地预览热更新需要）

### 构建

```bash
# 构建双语版本
./build.sh
```

输出到 `book/` 目录：`book/en/`（英文）、`book/zh/`（中文）。

### 本地预览（热更新）

```bash
# 双语预览，支持语言切换和热更新
./serve.sh

# 自定义端口
./serve.sh 3000
```

修改源文件后浏览器会自动刷新。访问地址见终端输出（默认端口 8000，在 URL 后追加 `/zh/` 或 `/en/`）。

## 项目结构

```
├── rust-book-src/      # 英文原版 (Git Submodule → rust-lang/book)
├── rust-book-cn/       # 中文翻译
│   ├── src/            # 翻译后的 Markdown 文件
│   ├── book.toml       # 中文版 mdBook 配置
│   ├── listings/       # → 符号链接到 rust-book-src/listings/
│   ├── packages/       # → 符号链接到 rust-book-src/packages/
│   └── theme/          # → 符号链接到 rust-book-src/theme/
├── lang-switch.js      # 语言切换脚本
├── build.sh            # 双语构建脚本
├── serve.sh            # 本地预览（热更新）
└── README.md
```

## 致谢

- [The Rust Programming Language](https://github.com/rust-lang/book) by Steve Klabnik, Carol Nichols, and the Rust Community
- Built with [mdBook](https://github.com/rust-lang/mdBook)

## 许可证

英文原版内容遵循 [MIT License](https://github.com/rust-lang/book/blob/main/LICENSE-MIT) 和 [Apache License 2.0](https://github.com/rust-lang/book/blob/main/LICENSE-APACHE)。
