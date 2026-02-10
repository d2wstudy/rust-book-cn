## Hello, World!

既然已经安装好了 Rust，是时候编写你的第一个 Rust 程序了。学习一门新语言时，编写一个在屏幕上打印 `Hello, world!` 的小程序是一项传统，我们也不例外！

> 注意：本书假设你对命令行有基本的了解。Rust 对你使用什么编辑器、工具或代码存放位置没有特殊要求，所以如果你更喜欢使用 IDE 而非命令行，请随意使用你喜欢的 IDE。目前许多 IDE 都已提供了一定程度的 Rust 支持，详情请查阅相应 IDE 的文档。Rust 团队一直致力于通过 `rust-analyzer` 提供出色的 IDE 支持。更多细节请参阅[附录 D][devtools]<!-- ignore -->。

<!-- Old headings. Do not remove or links may break. -->
<a id="creating-a-project-directory"></a>

### 创建项目目录

首先，创建一个目录来存放你的 Rust 代码。Rust 并不关心你的代码存放在哪里，但对于本书中的练习和项目，我们建议在你的主目录下创建一个 _projects_ 目录，并将所有项目放在其中。

打开终端，输入以下命令来创建 _projects_ 目录，并在其中为 "Hello, world!" 项目创建一个子目录。

对于 Linux、macOS 以及 Windows 上的 PowerShell，请输入：

```console
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

对于 Windows CMD，请输入：

```cmd
> mkdir "%USERPROFILE%\projects"
> cd /d "%USERPROFILE%\projects"
> mkdir hello_world
> cd hello_world
```

<!-- Old headings. Do not remove or links may break. -->
<a id="writing-and-running-a-rust-program"></a>

### Rust 程序基础

接下来，创建一个新的源文件，命名为 _main.rs_。Rust 文件总是以 _.rs_ 扩展名结尾。如果文件名包含多个单词，惯例是使用下划线分隔。例如，使用 _hello_world.rs_ 而不是 _helloworld.rs_。

现在打开刚创建的 _main.rs_ 文件，输入示例 1-1 中的代码。

<Listing number="1-1" file-name="main.rs" caption="一个打印 `Hello, world!` 的程序">

```rust
fn main() {
    println!("Hello, world!");
}
```

</Listing>

保存文件，回到终端窗口，确保在 _~/projects/hello_world_ 目录下。在 Linux 或 macOS 上，输入以下命令来编译并运行文件：

```console
$ rustc main.rs
$ ./main
Hello, world!
```

在 Windows 上，输入 `.\main` 而不是 `./main`：

```powershell
> rustc main.rs
> .\main
Hello, world!
```

无论你使用什么操作系统，终端都应该打印出字符串 `Hello, world!`。如果没有看到这个输出，请回到安装章节的["疑难解答"][troubleshooting]<!-- ignore -->部分寻求帮助。

如果 `Hello, world!` 成功打印了，恭喜！你已经正式编写了一个 Rust 程序。你现在是一名 Rust 程序员了——欢迎！

<!-- Old headings. Do not remove or links may break. -->

<a id="anatomy-of-a-rust-program"></a>

### Rust 程序剖析

让我们详细回顾一下这个 "Hello, world!" 程序。这是第一块拼图：

```rust
fn main() {

}
```

这几行定义了一个名为 `main` 的函数。`main` 函数很特殊：它始终是每个可执行 Rust 程序中最先运行的代码。第一行声明了一个名为 `main` 的函数，它没有参数，也不返回任何值。如果有参数，它们会放在圆括号 `()` 内。

函数体被包裹在 `{}` 中。Rust 要求所有函数体都用花括号包围。良好的代码风格是将左花括号放在函数声明的同一行，中间加一个空格。

> 注意：如果你想在 Rust 项目中保持统一的代码风格，可以使用名为 `rustfmt` 的自动格式化工具来按照特定风格格式化代码（更多关于 `rustfmt` 的内容请参阅[附录 D][devtools]<!-- ignore -->）。Rust 团队已将此工具包含在标准 Rust 发行版中，就像 `rustc` 一样，所以它应该已经安装在你的电脑上了！

`main` 函数的函数体包含以下代码：

```rust
println!("Hello, world!");
```

这一行完成了这个小程序的所有工作：将文本打印到屏幕上。这里有三个重要的细节需要注意。

第一，`println!` 调用的是一个 Rust 宏（macro）。如果调用的是函数，则应写成 `println`（不带 `!`）。Rust 宏是一种编写能生成代码的代码的方式，用于扩展 Rust 语法，我们将在[第 20 章][ch20-macros]<!-- ignore -->中详细讨论。目前你只需要知道，使用 `!` 意味着你调用的是宏而不是普通函数，并且宏不一定遵循与函数相同的规则。

第二，你看到了 `"Hello, world!"` 字符串。我们将这个字符串作为参数传递给 `println!`，然后字符串就被打印到了屏幕上。

第三，我们用分号（`;`）结束这一行，表示这个表达式（expression）已经结束，下一个表达式可以开始了。大多数 Rust 代码行都以分号结尾。

<!-- Old headings. Do not remove or links may break. -->
<a id="compiling-and-running-are-separate-steps"></a>

### 编译与运行

你刚刚运行了一个新创建的程序，让我们来逐步分析这个过程。

在运行 Rust 程序之前，你必须使用 Rust 编译器来编译它，输入 `rustc` 命令并传入源文件名，像这样：

```console
$ rustc main.rs
```

如果你有 C 或 C++ 背景，你会注意到这与 `gcc` 或 `clang` 类似。编译成功后，Rust 会输出一个二进制可执行文件。

在 Linux、macOS 以及 Windows 上的 PowerShell 中，你可以在 shell 中输入 `ls` 命令来查看可执行文件：

```console
$ ls
main  main.rs
```

在 Linux 和 macOS 上，你会看到两个文件。在 Windows 上使用 PowerShell，你会看到与使用 CMD 相同的三个文件。在 Windows 上使用 CMD，你可以输入以下命令：

```cmd
> dir /B %= the /B option says to only show the file names =%
main.exe
main.pdb
main.rs
```

这里显示了扩展名为 _.rs_ 的源代码文件、可执行文件（在 Windows 上是 _main.exe_，在其他平台上是 _main_），以及在 Windows 上还有一个扩展名为 _.pdb_ 的调试信息文件。从这里，你可以运行 _main_ 或 _main.exe_ 文件，像这样：

```console
$ ./main # or .\main on Windows
```

如果你的 _main.rs_ 是 "Hello, world!" 程序，这行命令会在终端打印 `Hello, world!`。

如果你更熟悉动态语言，如 Ruby、Python 或 JavaScript，你可能不习惯将编译和运行作为两个独立的步骤。Rust 是一种**预编译**（_ahead-of-time compiled_）语言，这意味着你可以编译一个程序，然后把可执行文件交给别人，即使他们没有安装 Rust 也能运行。如果你给别人一个 _.rb_、_.py_ 或 _.js_ 文件，他们需要分别安装 Ruby、Python 或 JavaScript 的实现。但在那些语言中，你只需要一条命令就能编译并运行程序。一切都是语言设计中的权衡。

仅使用 `rustc` 编译对于简单程序来说没问题，但随着项目的增长，你会希望管理所有选项并方便地共享代码。接下来，我们将介绍 Cargo 工具，它将帮助你编写真实的 Rust 程序。

[troubleshooting]: ch01-01-installation.html#troubleshooting
[devtools]: appendix-04-useful-development-tools.html
[ch20-macros]: ch20-05-macros.html
