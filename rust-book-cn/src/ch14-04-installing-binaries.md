<!-- Old headings. Do not remove or links may break. -->

<a id="installing-binaries-from-cratesio-with-cargo-install"></a>

## 使用 `cargo install` 安装二进制文件

`cargo install` 命令允许你在本地安装和使用二进制 crate。这并不是要替代系统包管理器，而是为 Rust 开发者提供一种便捷的方式来安装其他人在 [crates.io](https://crates.io/)<!-- ignore --> 上分享的工具。注意，你只能安装具有二进制目标（binary target）的包。**二进制目标**（binary target）是指当 crate 拥有 *src/main.rs* 文件或其他被指定为二进制文件时所创建的可运行程序，与之相对的是库目标（library target），库目标本身不能独立运行，但适合被包含在其他程序中。通常，crate 会在 README 文件中说明该 crate 是一个库、具有二进制目标，还是两者兼有。

所有通过 `cargo install` 安装的二进制文件都存储在安装根目录的 *bin* 文件夹中。如果你使用 *rustup.rs* 安装的 Rust 且没有任何自定义配置，这个目录将是 *$HOME/.cargo/bin*。请确保该目录在你的 `$PATH` 中，这样你才能运行通过 `cargo install` 安装的程序。

例如，在第 12 章中我们提到过，有一个用 Rust 实现的 `grep` 工具叫做 `ripgrep`，用于搜索文件。要安装 `ripgrep`，可以运行以下命令：

<!-- manual-regeneration
cargo install something you don't have, copy relevant output below
-->

```console
$ cargo install ripgrep
    Updating crates.io index
  Downloaded ripgrep v14.1.1
  Downloaded 1 crate (213.6 KB) in 0.40s
  Installing ripgrep v14.1.1
--snip--
   Compiling grep v0.3.2
    Finished `release` profile [optimized + debuginfo] target(s) in 6.73s
  Installing ~/.cargo/bin/rg
   Installed package `ripgrep v14.1.1` (executable `rg`)
```

输出的倒数第二行显示了已安装二进制文件的位置和名称，在 `ripgrep` 的例子中就是 `rg`。只要安装目录在你的 `$PATH` 中（如前所述），你就可以运行 `rg --help`，然后开始使用这个更快、更具 Rust 风格的文件搜索工具了！
