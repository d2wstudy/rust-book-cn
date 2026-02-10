## 使用发布配置自定义构建

在 Rust 中，**发布配置**（release profiles）是预定义的、可自定义的配置方案，包含不同的编译选项，让程序员能够更好地控制代码编译的各种细节。每个配置方案都是独立配置的。

Cargo 有两个主要的配置方案：运行 `cargo build` 时使用的 `dev` 配置，以及运行 `cargo build --release` 时使用的 `release` 配置。`dev` 配置为开发环境定义了合理的默认值，`release` 配置则为发布构建提供了合理的默认值。

这些配置名称你可能在构建输出中见过：

<!-- manual-regeneration
anywhere, run:
cargo build
cargo build --release
and ensure output below is accurate
-->

```console
$ cargo build
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
$ cargo build --release
    Finished `release` profile [optimized] target(s) in 0.32s
```

`dev` 和 `release` 就是编译器使用的不同配置方案。

当项目的 *Cargo.toml* 文件中没有显式添加任何 `[profile.*]` 部分时，Cargo 会为每个配置方案使用默认设置。通过为你想要自定义的配置方案添加 `[profile.*]` 部分，可以覆盖默认设置的任意子集。例如，以下是 `dev` 和 `release` 配置中 `opt-level` 设置的默认值：

<span class="filename">Filename: Cargo.toml</span>

```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```

`opt-level` 设置控制 Rust 对代码应用的优化级别，取值范围是 0 到 3。应用更多优化会延长编译时间，因此在开发阶段如果需要频繁编译代码，你会希望减少优化以加快编译速度，即使生成的代码运行得慢一些。所以 `dev` 的默认 `opt-level` 是 `0`。当你准备发布代码时，最好花更多时间在编译上。你只需要在发布模式下编译一次，但编译后的程序会运行很多次，因此发布模式用更长的编译时间换取运行更快的代码。这就是 `release` 配置的默认 `opt-level` 为 `3` 的原因。

你可以在 *Cargo.toml* 中为某个设置指定不同的值来覆盖默认设置。例如，如果我们想在开发配置中使用优化级别 1，可以在项目的 *Cargo.toml* 文件中添加以下两行：

<span class="filename">Filename: Cargo.toml</span>

```toml
[profile.dev]
opt-level = 1
```

这段代码覆盖了默认的 `0` 设置。现在当我们运行 `cargo build` 时，Cargo 会使用 `dev` 配置的默认值加上我们对 `opt-level` 的自定义设置。因为我们将 `opt-level` 设为 `1`，Cargo 会应用比默认更多的优化，但不会像发布构建那样多。

关于每个配置方案的完整配置选项列表和默认值，请参阅 [Cargo 的文档](https://doc.rust-lang.org/cargo/reference/profiles.html)。
