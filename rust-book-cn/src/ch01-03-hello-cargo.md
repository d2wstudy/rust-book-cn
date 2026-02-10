## Hello, Cargo!

Cargo 是 Rust 的构建系统和包管理器。大多数 Rustacean 都使用这个工具来管理他们的 Rust 项目，因为 Cargo 会帮你处理很多任务，比如构建代码、下载代码所依赖的库，以及编译这些库。（我们把代码所需的库称为**依赖**（_dependencies_）。）

最简单的 Rust 程序，比如我们目前写的这个，没有任何依赖。如果我们用 Cargo 来构建 "Hello, world!" 项目，它只会用到 Cargo 中负责构建代码的那部分功能。随着你编写更复杂的 Rust 程序，你会添加依赖，而如果你一开始就使用 Cargo 来创建项目，添加依赖会方便得多。

由于绝大多数 Rust 项目都使用 Cargo，本书后续内容也假定你在使用 Cargo。如果你使用了["安装"][installation]<!-- ignore -->部分介绍的官方安装器，Cargo 已经随 Rust 一起安装好了。如果你通过其他方式安装了 Rust，可以在终端中输入以下命令来检查 Cargo 是否已安装：

```console
$ cargo --version
```

如果你看到了版本号，说明已经安装好了！如果看到类似 `command not found` 的错误，请查阅你所用安装方式的文档，了解如何单独安装 Cargo。

### 使用 Cargo 创建项目

让我们用 Cargo 创建一个新项目，看看它与之前的 "Hello, world!" 项目有什么不同。回到你的 _projects_ 目录（或者你选择存放代码的任何位置）。然后，在任何操作系统上，运行以下命令：

```console
$ cargo new hello_cargo
$ cd hello_cargo
```

第一条命令创建了一个名为 _hello_cargo_ 的新目录和项目。我们将项目命名为 _hello_cargo_，Cargo 会在同名目录中创建它的文件。

进入 _hello_cargo_ 目录并列出文件。你会看到 Cargo 为我们生成了两个文件和一个目录：一个 _Cargo.toml_ 文件，以及一个 _src_ 目录，里面有一个 _main.rs_ 文件。

它还初始化了一个新的 Git 仓库，并附带一个 _.gitignore_ 文件。如果你在一个已有的 Git 仓库中运行 `cargo new`，则不会生成 Git 文件；你可以使用 `cargo new --vcs=git` 来覆盖这一行为。

> 注意：Git 是一个常用的版本控制系统。你可以通过 `--vcs` 参数让 `cargo new` 使用其他版本控制系统，或者不使用版本控制系统。运行 `cargo new --help` 查看可用选项。

用你喜欢的文本编辑器打开 _Cargo.toml_。它的内容应该类似于示例 1-2 中的代码。

<Listing number="1-2" file-name="Cargo.toml" caption="`cargo new` 生成的 *Cargo.toml* 的内容">

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

</Listing>

这个文件使用 [_TOML_][toml]<!-- ignore -->（_Tom's Obvious, Minimal Language_）格式，这是 Cargo 的配置格式。

第一行 `[package]` 是一个段落标题，表示接下来的语句用于配置一个包。随着我们向这个文件添加更多信息，还会添加其他段落。

接下来的三行设置了 Cargo 编译程序所需的配置信息：程序的名称、版本，以及要使用的 Rust 版次。我们将在[附录 E][appendix-e]<!-- ignore --> 中讨论 `edition` 键。

最后一行 `[dependencies]` 是一个段落的开始，用于列出项目的所有依赖。在 Rust 中，代码包被称为 _crate_。这个项目不需要其他 crate，但在第 2 章的第一个项目中会用到，届时我们会使用这个依赖段落。

现在打开 _src/main.rs_ 看一看：

<span class="filename">文件名：src/main.rs</span>

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo 为你生成了一个 "Hello, world!" 程序，和我们在示例 1-1 中写的一样！到目前为止，我们的项目与 Cargo 生成的项目之间的区别在于：Cargo 将代码放在了 _src_ 目录中，并且在项目顶层目录有一个 _Cargo.toml_ 配置文件。

Cargo 期望你的源文件放在 _src_ 目录中。项目顶层目录只用于存放 README 文件、许可证信息、配置文件以及其他与代码无关的内容。使用 Cargo 有助于你组织项目。每样东西都有它的位置，每样东西都各就各位。

如果你创建了一个没有使用 Cargo 的项目，就像我们之前的 "Hello, world!" 项目那样，你可以将它转换为使用 Cargo 的项目。将项目代码移到 _src_ 目录中，并创建一个合适的 _Cargo.toml_ 文件。获取 _Cargo.toml_ 文件的一个简单方法是运行 `cargo init`，它会自动为你创建。

### 构建并运行 Cargo 项目

现在让我们看看用 Cargo 构建和运行 "Hello, world!" 程序有什么不同！在你的 _hello_cargo_ 目录中，输入以下命令来构建项目：

```console
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

这条命令会在 _target/debug/hello_cargo_（在 Windows 上是 _target\debug\hello_cargo.exe_）创建一个可执行文件，而不是在当前目录。因为默认构建是调试构建，Cargo 会将二进制文件放在名为 _debug_ 的目录中。你可以用以下命令运行这个可执行文件：

```console
$ ./target/debug/hello_cargo # or .\target\debug\hello_cargo.exe on Windows
Hello, world!
```

如果一切顺利，终端应该会打印出 `Hello, world!`。第一次运行 `cargo build` 时，Cargo 还会在项目顶层创建一个新文件：_Cargo.lock_。这个文件记录了项目依赖的确切版本。这个项目没有依赖，所以文件内容比较少。你永远不需要手动修改这个文件；Cargo 会为你管理它的内容。

我们刚才用 `cargo build` 构建了项目，然后用 `./target/debug/hello_cargo` 运行了它，但我们也可以使用 `cargo run` 来一步完成编译和运行：

```console
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

使用 `cargo run` 比先运行 `cargo build` 再输入完整的二进制文件路径要方便得多，所以大多数开发者都使用 `cargo run`。

注意这次我们没有看到 Cargo 正在编译 `hello_cargo` 的输出。Cargo 发现文件没有改变，所以它没有重新构建，而是直接运行了二进制文件。如果你修改了源代码，Cargo 会在运行之前重新构建项目，你会看到这样的输出：

```console
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

Cargo 还提供了一个叫做 `cargo check` 的命令。这个命令会快速检查你的代码，确保它能通过编译，但不会生成可执行文件：

```console
$ cargo check
   Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

为什么你会不需要可执行文件呢？通常 `cargo check` 比 `cargo build` 快得多，因为它跳过了生成可执行文件的步骤。如果你在编写代码的过程中不断检查自己的工作，使用 `cargo check` 可以加快确认项目是否仍能编译的过程！因此，许多 Rustacean 在编写程序时会定期运行 `cargo check` 来确保代码能编译通过。然后在准备好使用可执行文件时，再运行 `cargo build`。

让我们回顾一下目前学到的关于 Cargo 的知识：

- 可以使用 `cargo new` 创建项目。
- 可以使用 `cargo build` 构建项目。
- 可以使用 `cargo run` 一步完成构建和运行项目。
- 可以使用 `cargo check` 构建项目来检查错误，但不生成二进制文件。
- Cargo 不会将构建结果保存在代码所在的目录中，而是存储在 _target/debug_ 目录中。

使用 Cargo 的另一个优势是，无论你在哪个操作系统上工作，命令都是相同的。所以从现在开始，我们将不再为 Linux 和 macOS 与 Windows 分别提供特定的说明。

### 以发布模式构建

当你的项目最终准备好发布时，可以使用 `cargo build --release` 来进行优化编译。这条命令会在 _target/release_ 而不是 _target/debug_ 目录中创建可执行文件。优化会让你的 Rust 代码运行得更快，但开启优化会延长编译时间。这就是为什么有两种不同的配置：一种用于开发，让你能快速且频繁地重新构建；另一种用于构建最终交付给用户的程序，它不需要反复重新构建，并且要尽可能快地运行。如果你要对代码的运行时间进行基准测试，请确保使用 `cargo build --release` 构建，并使用 _target/release_ 中的可执行文件进行测试。

<!-- Old headings. Do not remove or links may break. -->
<a id="cargo-as-convention"></a>

### 善用 Cargo 的惯例

对于简单的项目，Cargo 相比直接使用 `rustc` 并没有太大优势，但随着程序变得更加复杂，它的价值就会显现出来。一旦程序增长到多个文件或需要依赖时，让 Cargo 来协调构建会容易得多。

尽管 `hello_cargo` 项目很简单，但它现在已经使用了你在 Rust 生涯中会用到的大部分实际工具。事实上，要参与任何现有项目，你可以使用以下命令通过 Git 检出代码、进入项目目录并构建：

```console
$ git clone example.org/someproject
$ cd someproject
$ cargo build
```

有关 Cargo 的更多信息，请查阅[它的文档][cargo]。

## 总结

你的 Rust 之旅已经有了一个很好的开始！在本章中，你学会了：

- 使用 `rustup` 安装最新稳定版的 Rust。
- 更新到更新的 Rust 版本。
- 打开本地安装的文档。
- 直接使用 `rustc` 编写并运行一个 "Hello, world!" 程序。
- 使用 Cargo 的惯例创建并运行一个新项目。

现在是构建一个更实质性的程序来熟悉 Rust 代码读写的好时机。所以在第 2 章中，我们将构建一个猜数字游戏程序。如果你更想先了解 Rust 中常见编程概念的工作方式，请参阅第 3 章，然后再回到第 2 章。

[installation]: ch01-01-installation.html#installation
[toml]: https://toml.io
[appendix-e]: appendix-05-editions.html
[cargo]: https://doc.rust-lang.org/cargo/
