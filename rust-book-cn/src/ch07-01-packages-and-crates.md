## 包和 Crate

我们要介绍的模块系统的第一部分是包（package）和 crate。

*crate* 是 Rust 编译器一次处理的最小代码单元。即使你运行的是 `rustc` 而不是 `cargo`，并且只传入一个源代码文件（就像我们在第 1 章["Rust 程序基础"][basics]<!-- ignore -->中所做的那样），编译器也会将该文件视为一个 crate。Crate 可以包含模块，而这些模块可以定义在其他文件中，并与该 crate 一起编译，我们将在接下来的章节中看到这一点。

Crate 有两种形式：二进制 crate 和库 crate。*二进制 crate*（binary crate）是可以编译为可执行文件并运行的程序，例如命令行程序或服务器。每个二进制 crate 都必须有一个名为 `main` 的函数，用于定义可执行文件运行时的行为。到目前为止，我们创建的所有 crate 都是二进制 crate。

*库 crate*（library crate）没有 `main` 函数，也不会编译为可执行文件。它们定义的功能旨在与多个项目共享。例如，我们在[第 2 章][rand]<!-- ignore -->中使用的 `rand` crate 提供了生成随机数的功能。大多数时候，Rustacean 说"crate"时指的就是库 crate，他们将"crate"与通用编程概念中的"库"（library）互换使用。

*crate 根*（crate root）是一个源文件，Rust 编译器从它开始编译，并构成你的 crate 的根模块（我们将在["使用模块控制作用域和私有性"][modules]<!-- ignore -->中深入讲解模块）。

*包*（package）是一个或多个 crate 的集合，提供一组功能。包中包含一个 *Cargo.toml* 文件，描述如何构建这些 crate。Cargo 本身实际上就是一个包，其中包含你一直用来构建代码的命令行工具的二进制 crate。Cargo 包还包含一个库 crate，二进制 crate 依赖于它。其他项目也可以依赖 Cargo 的库 crate，以使用与 Cargo 命令行工具相同的逻辑。

一个包可以包含任意数量的二进制 crate，但最多只能包含一个库 crate。一个包必须至少包含一个 crate，无论是库 crate 还是二进制 crate。

让我们来看看创建包时会发生什么。首先，我们输入命令 `cargo new my-project`：

```console
$ cargo new my-project
     Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-project/src
main.rs
```

运行 `cargo new my-project` 之后，我们用 `ls` 查看 Cargo 创建了什么。在 *my-project* 目录中，有一个 *Cargo.toml* 文件，这就给了我们一个包。还有一个 *src* 目录，其中包含 *main.rs*。用文本编辑器打开 *Cargo.toml*，你会注意到其中并没有提到 *src/main.rs*。Cargo 遵循一个约定：*src/main.rs* 是与包同名的二进制 crate 的 crate 根。同样，Cargo 知道如果包目录中包含 *src/lib.rs*，则该包包含一个与包同名的库 crate，而 *src/lib.rs* 就是它的 crate 根。Cargo 将 crate 根文件传递给 `rustc` 来构建库或二进制文件。

在这里，我们的包只包含 *src/main.rs*，这意味着它只包含一个名为 `my-project` 的二进制 crate。如果一个包同时包含 *src/main.rs* 和 *src/lib.rs*，那么它有两个 crate：一个二进制 crate 和一个库 crate，两者都与包同名。一个包可以通过在 *src/bin* 目录下放置文件来拥有多个二进制 crate：每个文件都将是一个单独的二进制 crate。

[basics]: ch01-02-hello-world.html#rust-program-basics
[modules]: ch07-02-defining-modules-to-control-scope-and-privacy.html
[rand]: ch02-00-guessing-game-tutorial.html#generating-a-random-number
