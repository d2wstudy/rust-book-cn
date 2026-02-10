## 安装

第一步是安装 Rust。我们将通过 `rustup` 来下载 Rust，这是一个用于管理 Rust 版本及相关工具的命令行工具。下载过程需要联网。

> 注意：如果你出于某些原因不想使用 `rustup`，请参阅[其他 Rust 安装方式页面][otherinstall]了解更多选项。

以下步骤会安装最新的 Rust 稳定版编译器。Rust 的稳定性保证确保本书中所有能编译通过的示例在更新的 Rust 版本中仍然可以编译。不同版本之间的输出可能会略有差异，因为 Rust 经常改进错误信息和警告信息。换句话说，使用以下步骤安装的任何更新的 Rust 稳定版都应该能正常配合本书的内容使用。

> ### 命令行标记
>
> 在本章以及全书中，我们会展示一些在终端中使用的命令。你需要在终端中输入的行都以 `$` 开头。你不需要输入 `$` 字符；它是命令行提示符，用于标识每条命令的起始位置。不以 `$` 开头的行通常显示的是上一条命令的输出。此外，PowerShell 特有的示例将使用 `>` 而非 `$`。

### 在 Linux 或 macOS 上安装 `rustup`

如果你使用的是 Linux 或 macOS，请打开终端并输入以下命令：

```console
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

这条命令会下载一个脚本并开始安装 `rustup` 工具，它会安装最新的 Rust 稳定版。安装过程中可能会提示你输入密码。如果安装成功，将会出现以下内容：

```text
Rust is installed now. Great!
```

你还需要一个**链接器**（linker），它是 Rust 用来将编译输出合并为一个文件的程序。你很可能已经有了。如果遇到链接器错误，你应该安装一个 C 编译器，它通常会附带一个链接器。C 编译器也很有用，因为一些常见的 Rust 包依赖于 C 代码，因此需要 C 编译器。

在 macOS 上，你可以通过运行以下命令来获取 C 编译器：

```console
$ xcode-select --install
```

Linux 用户通常应该根据发行版的文档安装 GCC 或 Clang。例如，如果你使用 Ubuntu，可以安装 `build-essential` 包。

### 在 Windows 上安装 `rustup`

在 Windows 上，前往 [https://www.rust-lang.org/tools/install][install]<!-- ignore --> 并按照说明安装 Rust。在安装过程中的某个步骤，你会收到安装 Visual Studio 的提示。它提供了编译程序所需的链接器和原生库。如果你在这一步需要更多帮助，请参阅 [https://rust-lang.github.io/rustup/installation/windows-msvc.html][msvc]<!-- ignore -->。

本书其余部分使用的命令在 _cmd.exe_ 和 PowerShell 中都可以运行。如果有特定的差异，我们会说明应该使用哪个。

### 故障排除

要检查 Rust 是否正确安装，请打开一个 shell 并输入以下命令：

```console
$ rustc --version
```

你应该能看到已发布的最新稳定版的版本号、提交哈希和提交日期，格式如下：

```text
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果你看到了这些信息，说明 Rust 已经安装成功了！如果没有看到，请按照以下方式检查 Rust 是否在你的 `%PATH%` 系统变量中。

在 Windows CMD 中，使用：

```console
> echo %PATH%
```

在 PowerShell 中，使用：

```powershell
> echo $env:Path
```

在 Linux 和 macOS 中，使用：

```console
$ echo $PATH
```

如果一切正确但 Rust 仍然无法正常工作，有很多地方可以获取帮助。你可以在[社区页面][community]上了解如何与其他 Rustacean（我们对自己的昵称）取得联系。

### 更新与卸载

通过 `rustup` 安装 Rust 后，更新到最新发布的版本非常简单。在 shell 中运行以下更新命令：

```console
$ rustup update
```

要卸载 Rust 和 `rustup`，在 shell 中运行以下卸载命令：

```console
$ rustup self uninstall
```

<!-- Old headings. Do not remove or links may break. -->
<a id="local-documentation"></a>

### 阅读本地文档

安装 Rust 时还会附带一份本地文档副本，方便你离线阅读。运行 `rustup doc` 即可在浏览器中打开本地文档。

当标准库提供了某个类型或函数，而你不确定它的用途或用法时，可以查阅应用程序编程接口（API）文档来了解！

<!-- Old headings. Do not remove or links may break. -->
<a id="text-editors-and-integrated-development-environments"></a>

### 使用文本编辑器和 IDE

本书不对你使用什么工具来编写 Rust 代码做任何假设。几乎任何文本编辑器都能胜任！不过，许多文本编辑器和集成开发环境（IDE）都内置了对 Rust 的支持。你可以在 Rust 官网的[工具页面][tools]上找到一份相当完整的编辑器和 IDE 列表。

### 离线使用本书

在一些示例中，我们会用到标准库之外的 Rust 包。要完成这些示例，你需要联网，或者提前下载好这些依赖。要提前下载依赖，可以运行以下命令。（我们会在后面详细解释 `cargo` 是什么以及每条命令的作用。）

```console
$ cargo new get-dependencies
$ cd get-dependencies
$ cargo add rand@0.8.5 trpl@0.2.0
```

这会缓存这些包的下载内容，这样你之后就不需要再次下载了。运行完这条命令后，你不需要保留 `get-dependencies` 文件夹。如果你已经运行了这条命令，就可以在本书后续的所有 `cargo` 命令中使用 `--offline` 标志，以使用这些缓存版本而不是尝试联网下载。

[otherinstall]: https://forge.rust-lang.org/infra/other-installation-methods.html
[install]: https://www.rust-lang.org/tools/install
[msvc]: https://rust-lang.github.io/rustup/installation/windows-msvc.html
[community]: https://www.rust-lang.org/community
[tools]: https://www.rust-lang.org/tools
