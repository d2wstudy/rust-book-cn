<div align="center">

# Rust 程序设计语言 · 中英双语版

借助大模型（Claude Opus）辅助翻译润色，旨在提供更自然的中文表达、更流畅的阅读体验

[![Deploy](https://github.com/d2wstudy/rust-book-cn/actions/workflows/deploy.yml/badge.svg)](https://github.com/d2wstudy/rust-book-cn/actions/workflows/deploy.yml)
[![License: MIT/Apache 2.0](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](#许可证)
[![Book: 2024 Edition](https://img.shields.io/badge/edition-2024-orange.svg)](https://d2wstudy.github.io/rust-book-cn)

**[在线阅读 →](https://d2wstudy.github.io/rust-book-cn)**

[English](./README_EN.md)

</div>

## 关于本项目

社区已有不少优秀的 Rust Book 中文翻译，为中文读者学习 Rust 做出了很大贡献。不过在阅读过程中，我们感到部分译文仍偏向直译，读起来不够顺畅。于是尝试借助 AI（Claude）辅助翻译，再经人工审校润色，希望让中文表达更贴近日常阅读习惯。

当然，翻译质量见仁见智，当前版本也一定还有不少可以改进的地方，我们会持续优化。如果你在阅读中发现不妥之处，非常欢迎[提出反馈](https://github.com/d2wstudy/rust-book-cn/issues)。

## 特性

- **注重可读性的中文翻译** — AI 辅助 + 人工审校，尽量减少翻译腔，让技术内容读起来更自然
- **中英文无刷新切换** — 阅读中遇到拿不准的地方，可以随时对照英文原文
- **基于 2024 Edition** — 跟进官方最新版本
- **与上游同步** — 英文源通过 Git Submodule 引用官方仓库，方便跟进更新

## 快速开始

```bash
git clone --recursive https://github.com/d2wstudy/rust-book-cn.git
```

前置依赖：[Rust 工具链](https://rustup.rs/)、[mdBook](https://github.com/rust-lang/mdBook)（`cargo install mdbook`）、[Node.js](https://nodejs.org/)（开发预览需要）

```bash
./build.sh          # 构建双语版本，输出到 book/en 和 book/zh
./serve.sh          # 本地开发，支持语言切换和热更新
./serve.sh 3000     # 自定义端口
```

## 参与贡献

翻译是一件主观的事，我们很难做到让每个人都满意，但希望能做得越来越好。如果你在阅读中发现：

- 译文不通顺或有翻译腔
- 术语使用不一致
- 理解有误或遗漏

欢迎直接 [提 Issue](https://github.com/d2wstudy/rust-book-cn/issues) 或提交 PR。翻译文件位于 `rust-book-cn/src/` 目录下，与英文原版路径一一对应。

## 致谢

- [The Rust Programming Language](https://github.com/rust-lang/book) — Steve Klabnik、Carol Nichols 及 Rust 社区
- 社区中已有的中文翻译项目（如 [KaiserY/trpl-zh-cn](https://github.com/KaiserY/trpl-zh-cn) 等）为本项目提供了很好的参考
- 使用 [mdBook](https://github.com/rust-lang/mdBook) 构建

## 许可证

英文原版内容遵循 [MIT License](https://github.com/rust-lang/book/blob/main/LICENSE-MIT) 和 [Apache License 2.0](https://github.com/rust-lang/book/blob/main/LICENSE-APACHE)。
