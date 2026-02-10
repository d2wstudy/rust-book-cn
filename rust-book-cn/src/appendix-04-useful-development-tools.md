## 附录 D：实用的开发工具

在本附录中，我们将介绍 Rust 项目提供的一些实用开发工具。我们会了解自动格式化、快速修复警告的方法、代码检查工具，以及与 IDE 的集成。

### 使用 `rustfmt` 自动格式化

`rustfmt` 工具会按照社区代码风格重新格式化你的代码。许多协作项目都使用 `rustfmt` 来避免编写 Rust 代码时关于代码风格的争论：每个人都使用该工具来格式化代码。

安装 Rust 时默认包含 `rustfmt`，所以你的系统上应该已经有 `rustfmt` 和 `cargo-fmt` 这两个程序了。这两个命令类似于 `rustc` 和 `cargo` 的关系：`rustfmt` 提供更细粒度的控制，而 `cargo-fmt` 能理解使用 Cargo 的项目的约定。要格式化任何 Cargo 项目，请输入以下命令：

```console
$ cargo fmt
```

运行此命令会重新格式化当前 crate 中的所有 Rust 代码。这应该只会改变代码风格，而不会改变代码语义。有关 `rustfmt` 的更多信息，请参阅[其文档][rustfmt]。

### 使用 `rustfix` 修复代码

`rustfix` 工具包含在 Rust 安装中，它可以自动修复那些有明确修正方式的编译器警告，而这些修正通常正是你想要的。你之前可能已经见过编译器警告了。例如，考虑以下代码：

<span class="filename">文件名：src/main.rs</span>

```rust
fn main() {
    let mut x = 42;
    println!("{x}");
}
```

这里我们将变量 `x` 定义为可变的，但实际上从未修改过它。Rust 会对此发出警告：

```console
$ cargo build
   Compiling myprogram v0.1.0 (file:///projects/myprogram)
warning: variable does not need to be mutable
 --> src/main.rs:2:9
  |
2 |     let mut x = 0;
  |         ----^
  |         |
  |         help: remove this `mut`
  |
  = note: `#[warn(unused_mut)]` on by default
```

警告建议我们移除 `mut` 关键字。我们可以使用 `rustfix` 工具，通过运行 `cargo fix` 命令来自动应用该建议：

```console
$ cargo fix
    Checking myprogram v0.1.0 (file:///projects/myprogram)
      Fixing src/main.rs (1 fix)
    Finished dev [unoptimized + debuginfo] target(s) in 0.59s
```

再次查看 _src/main.rs_，我们会发现 `cargo fix` 已经修改了代码：

<span class="filename">文件名：src/main.rs</span>

```rust
fn main() {
    let x = 42;
    println!("{x}");
}
```

变量 `x` 现在是不可变的了，警告也不再出现。

你还可以使用 `cargo fix` 命令在不同的 Rust 版本之间迁移代码。版本相关内容在[附录 E][editions]<!-- ignore -->中介绍。

### 使用 Clippy 进行更多代码检查

Clippy 工具是一组代码检查规则（lint）的集合，用于分析你的代码，帮助你发现常见错误并改进 Rust 代码。Clippy 包含在标准的 Rust 安装中。

要在任何 Cargo 项目上运行 Clippy 的代码检查，请输入以下命令：

```console
$ cargo clippy
```

例如，假设你编写了一个使用数学常量近似值的程序，比如圆周率 pi，如下所示：

<Listing file-name="src/main.rs">

```rust
fn main() {
    let x = 3.1415;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

</Listing>

在这个项目上运行 `cargo clippy` 会产生以下错误：

```text
error: approximate value of `f{32, 64}::consts::PI` found
 --> src/main.rs:2:13
  |
2 |     let x = 3.1415;
  |             ^^^^^^
  |
  = note: `#[deny(clippy::approx_constant)]` on by default
  = help: consider using the constant directly
  = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#approx_constant
```

这个错误告诉你，Rust 已经定义了一个更精确的 `PI` 常量，如果使用该常量，你的程序会更加准确。然后你可以修改代码，改用 `PI` 常量。

以下代码不会产生 Clippy 的任何错误或警告：

<Listing file-name="src/main.rs">

```rust
fn main() {
    let x = std::f64::consts::PI;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

</Listing>

有关 Clippy 的更多信息，请参阅[其文档][clippy]。

### 使用 `rust-analyzer` 集成 IDE

为了帮助 IDE 集成，Rust 社区推荐使用 [`rust-analyzer`][rust-analyzer]<!-- ignore -->。这个工具是一组以编译器为核心的实用程序，支持[语言服务器协议][lsp]<!-- ignore -->（Language Server Protocol），这是一种 IDE 和编程语言之间相互通信的规范。不同的客户端都可以使用 `rust-analyzer`，例如 [Visual Studio Code 的 Rust analyzer 插件][vscode]。

请访问 `rust-analyzer` 项目的[主页][rust-analyzer]<!-- ignore -->获取安装说明，然后在你使用的 IDE 中安装语言服务器支持。你的 IDE 将获得自动补全、跳转到定义和内联错误提示等功能。

[rustfmt]: https://github.com/rust-lang/rustfmt
[editions]: appendix-05-editions.md
[clippy]: https://github.com/rust-lang/rust-clippy
[rust-analyzer]: https://rust-analyzer.github.io
[lsp]: http://langserver.org/
[vscode]: https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer
