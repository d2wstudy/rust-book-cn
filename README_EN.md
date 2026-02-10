# Rust Book CN

A bilingual edition of *The Rust Programming Language*, with seamless Chinese/English switching.

Built on the [official Rust Book](https://github.com/rust-lang/book).

[中文](./README.md)

## Features

- One-click language switching without page reload
- Built with mdBook, preserving the official layout and code examples
- English source linked via Git Submodule for easy upstream sync

## Quick Start

### Clone

```bash
git clone --recursive <your-repo-url>
```

If you already cloned without `--recursive`:

```bash
git submodule update --init
```

### Prerequisites

- [Rust toolchain](https://rustup.rs/)
- [mdBook](https://github.com/rust-lang/mdBook) (`cargo install mdbook`)
- [Node.js](https://nodejs.org/) (required for local preview hot reload)

### Build

```bash
# Build both languages
./build.sh
```

Output to `book/`: `book/en/` (English), `book/zh/` (Chinese).

### Local Preview (Hot Reload)

```bash
# Bilingual preview with language switching and hot reload
./serve.sh

# Custom port
./serve.sh 3000
```

Browser auto-refreshes on source file changes. See terminal output for access URLs (default port 8000, append `/zh/` or `/en/` to the URL).

## Project Structure

```
├── rust-book-src/      # English original (Git Submodule → rust-lang/book)
├── rust-book-cn/       # Chinese translation
│   ├── src/            # Translated Markdown files
│   ├── book.toml       # Chinese mdBook config
│   ├── listings/       # → symlink to rust-book-src/listings/
│   ├── packages/       # → symlink to rust-book-src/packages/
│   └── theme/          # → symlink to rust-book-src/theme/
├── lang-switch.js      # Language switching script
├── build.sh            # Bilingual build script
├── serve.sh            # Local preview (hot reload)
└── README.md
```

## Credits

- [The Rust Programming Language](https://github.com/rust-lang/book) by Steve Klabnik, Carol Nichols, and the Rust Community
- Built with [mdBook](https://github.com/rust-lang/mdBook)

## License

The original English content is licensed under [MIT](https://github.com/rust-lang/book/blob/main/LICENSE-MIT) and [Apache 2.0](https://github.com/rust-lang/book/blob/main/LICENSE-APACHE).
