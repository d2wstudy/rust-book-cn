<div align="center">

# The Rust Programming Language · Bilingual Edition

AI-powered translation (Claude Opus) aiming for more natural Chinese expression and a smoother reading experience

[![Deploy](https://github.com/d2wstudy/rust-book-cn/actions/workflows/deploy.yml/badge.svg)](https://github.com/d2wstudy/rust-book-cn/actions/workflows/deploy.yml)
[![License: MIT/Apache 2.0](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](#license)
[![Book: 2024 Edition](https://img.shields.io/badge/edition-2024-orange.svg)](https://d2wstudy.github.io/rust-book-cn)

**[Read Online →](https://d2wstudy.github.io/rust-book-cn)**

[中文](./README.md)

</div>

## About

There are already several great Chinese translations of the Rust Book in the community, and they have been a tremendous help for Chinese-speaking Rust learners. However, we found that some translations tend to be overly literal, making them less fluent to read. So we tried using AI (Claude) to assist with translation, followed by manual review and polishing, hoping to make the Chinese text feel more natural.

That said, translation quality is subjective, and the current version certainly has room for improvement. We'll keep iterating. If you spot anything off, feel free to [open an issue](https://github.com/d2wstudy/rust-book-cn/issues).

## Features

- **Readability-focused Chinese translation** — AI-assisted + manual review, minimizing translationese
- **Seamless Chinese/English switching** — instantly compare with the original text, no page reload
- **2024 Edition** — based on the latest official version
- **Upstream sync** — English source linked via Git Submodule for easy updates

## Quick Start

```bash
git clone --recursive https://github.com/d2wstudy/rust-book-cn.git
```

Prerequisites: [Rust toolchain](https://rustup.rs/), [mdBook](https://github.com/rust-lang/mdBook) (`cargo install mdbook`), [Node.js](https://nodejs.org/) (for dev preview)

```bash
./build.sh          # Build bilingual version, output to book/en and book/zh
./serve.sh          # Local dev server with language switching and hot reload
./serve.sh 3000     # Custom port
```

## Contributing

Translation is inherently subjective — we can't please everyone, but we'd like to keep getting better. If you notice:

- Unnatural phrasing or translationese
- Inconsistent terminology
- Misunderstandings or omissions

Feel free to [open an issue](https://github.com/d2wstudy/rust-book-cn/issues) or submit a PR. Translation files are in `rust-book-cn/src/`, mirroring the English source structure.

## Credits

- [The Rust Programming Language](https://github.com/rust-lang/book) — Steve Klabnik, Carol Nichols, and the Rust community
- Existing community translations (e.g. [KaiserY/trpl-zh-cn](https://github.com/KaiserY/trpl-zh-cn)) provided valuable reference
- Built with [mdBook](https://github.com/rust-lang/mdBook)

## License

The original English content is licensed under [MIT](https://github.com/rust-lang/book/blob/main/LICENSE-MIT) and [Apache 2.0](https://github.com/rust-lang/book/blob/main/LICENSE-APACHE).
