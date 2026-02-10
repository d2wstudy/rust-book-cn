## 使用自定义命令扩展 Cargo

Cargo 的设计允许你在不修改它本身的情况下，通过新的子命令来扩展它的功能。如果你的 `$PATH` 中有一个名为 `cargo-something` 的可执行文件，你就可以通过 `cargo something` 来运行它，就好像它是 Cargo 的一个子命令一样。像这样的自定义命令在运行 `cargo --list` 时也会被列出。能够使用 `cargo install` 来安装扩展，然后像使用 Cargo 内置工具一样运行它们，这是 Cargo 设计中非常便利的一个优势！

## 总结

通过 Cargo 和 [crates.io](https://crates.io/)<!-- ignore --> 共享代码是 Rust 生态系统能够适用于许多不同任务的重要原因之一。Rust 的标准库小巧而稳定，但 crate 易于共享、使用和改进，并且有着与语言本身不同的演进节奏。不要羞于在 [crates.io](https://crates.io/)<!-- ignore --> 上分享对你有用的代码——它很可能对其他人同样有用！
