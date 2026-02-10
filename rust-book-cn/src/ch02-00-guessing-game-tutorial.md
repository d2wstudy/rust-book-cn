# 编写一个猜数字游戏

让我们一起动手做一个项目来快速上手 Rust！本章将通过一个实际程序来介绍一些常见的 Rust 概念。你将学到 `let`、`match`、方法、关联函数（associated function）、外部 crate 等知识！后续章节会更详细地探讨这些概念。在本章中，你只需练习基础知识。

我们将实现一个经典的编程入门项目：猜数字游戏。它的工作原理是这样的：程序会生成一个 1 到 100 之间的随机整数，然后提示玩家输入一个猜测的数字。输入猜测后，程序会提示猜测的数字是太小还是太大。如果猜对了，程序会打印一条祝贺信息并退出。

## 创建新项目

要创建一个新项目，请进入你在第 1 章中创建的 _projects_ 目录，然后使用 Cargo 创建一个新项目，如下所示：

```console
$ cargo new guessing_game
$ cd guessing_game
```

第一个命令 `cargo new` 接受项目名称（`guessing_game`）作为第一个参数。第二个命令切换到新项目的目录。

查看生成的 _Cargo.toml_ 文件：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial
rm -rf no-listing-01-cargo-new
cargo new no-listing-01-cargo-new --name guessing_game
cd no-listing-01-cargo-new
cargo run > output.txt 2>&1
cd ../../..
-->

<span class="filename">文件名：Cargo.toml</span>

```toml
{{#include ../listings/ch02-guessing-game-tutorial/no-listing-01-cargo-new/Cargo.toml}}
```

正如你在第 1 章中看到的，`cargo new` 会为你生成一个 "Hello, world!" 程序。查看 _src/main.rs_ 文件：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/no-listing-01-cargo-new/src/main.rs}}
```

现在让我们使用 `cargo run` 命令来编译并运行这个 "Hello, world!" 程序：

```console
{{#include ../listings/ch02-guessing-game-tutorial/no-listing-01-cargo-new/output.txt}}
```

当你需要在项目中快速迭代时，`run` 命令非常方便，我们在这个游戏中就会这样做——在进入下一步之前快速测试每次迭代。

重新打开 _src/main.rs_ 文件。你将在这个文件中编写所有代码。

## 处理一次猜测

猜数字游戏程序的第一部分会请求用户输入、处理该输入，并检查输入是否符合预期格式。首先，我们让玩家能够输入一个猜测。将示例 2-1 中的代码输入到 _src/main.rs_ 中。

<Listing number="2-1" file-name="src/main.rs" caption="从用户获取猜测并打印出来的代码">

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:all}}
```

</Listing>

这段代码包含了很多信息，让我们逐行来看。为了获取用户输入并将结果打印为输出，我们需要将 `io` 输入/输出库引入作用域。`io` 库来自标准库，即 `std`：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:io}}
```

默认情况下，Rust 会将标准库中定义的一组条目引入每个程序的作用域。这个集合被称为 *预导入*（prelude），你可以在[标准库文档][prelude]中查看其中的所有内容。

如果你想使用的类型不在预导入中，就需要使用 `use` 语句显式地将该类型引入作用域。使用 `std::io` 库可以提供许多有用的功能，包括接受用户输入的能力。

正如你在第 1 章中看到的，`main` 函数是程序的入口点：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:main}}
```

`fn` 语法声明了一个新函数；圆括号 `()` 表示没有参数；花括号 `{` 标志着函数体的开始。

正如你在第 1 章中学到的，`println!` 是一个将字符串打印到屏幕上的宏：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:print}}
```

这段代码打印了一个提示，说明这是什么游戏并请求用户输入。

### 使用变量存储值

接下来，我们将创建一个*变量*（variable）来存储用户输入，如下所示：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:string}}
```

现在程序变得有趣了！这短短一行中发生了很多事情。我们使用 `let` 语句来创建变量。这里是另一个例子：

```rust,ignore
let apples = 5;
```

这行代码创建了一个名为 `apples` 的新变量，并将其绑定到值 `5`。在 Rust 中，变量默认是不可变的（immutable），这意味着一旦我们给变量赋值，该值就不会改变。我们将在第 3 章的["变量与可变性"][variables-and-mutability]<!-- ignore -->部分详细讨论这个概念。要使变量可变，我们在变量名前加上 `mut`：

```rust,ignore
let apples = 5; // immutable
let mut bananas = 5; // mutable
```

> 注意：`//` 语法开始一个注释，一直持续到行尾。Rust 会忽略注释中的所有内容。我们将在[第 3 章][comments]<!-- ignore -->中更详细地讨论注释。

回到猜数字游戏程序，你现在知道 `let mut guess` 会引入一个名为 `guess` 的可变变量。等号（`=`）告诉 Rust 我们现在要将某个值绑定到这个变量上。等号右边是 `guess` 所绑定的值，即调用 `String::new` 的结果——一个返回 `String` 新实例的函数。[`String`][string]<!-- ignore --> 是标准库提供的字符串类型，是一种可增长的、UTF-8 编码的文本。

`::new` 这一行中的 `::` 语法表明 `new` 是 `String` 类型的一个关联函数（associated function）。*关联函数*是在类型上实现的函数，在这里就是 `String`。这个 `new` 函数创建了一个新的空字符串。你会在很多类型上找到 `new` 函数，因为它是创建某种新值的函数的常用名称。

总的来说，`let mut guess = String::new();` 这行代码创建了一个可变变量，当前绑定到一个新的空 `String` 实例。

### 接收用户输入

回想一下，我们在程序的第一行用 `use std::io;` 引入了标准库的输入/输出功能。现在我们将调用 `io` 模块中的 `stdin` 函数，它允许我们处理用户输入：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:read}}
```

如果我们没有在程序开头用 `use std::io;` 导入 `io` 模块，我们仍然可以通过将函数调用写成 `std::io::stdin` 来使用该函数。`stdin` 函数返回一个 [`std::io::Stdin`][iostdin]<!-- ignore --> 的实例，这是一个代表终端标准输入句柄的类型。

接下来，`.read_line(&mut guess)` 这一行调用了标准输入句柄上的 [`read_line`][read_line]<!-- ignore --> 方法来获取用户输入。我们还将 `&mut guess` 作为参数传递给 `read_line`，告诉它将用户输入存储到哪个字符串中。`read_line` 的完整工作是将用户在标准输入中键入的内容追加到一个字符串中（不会覆盖其内容），因此我们将该字符串作为参数传入。这个字符串参数需要是可变的，这样方法才能修改字符串的内容。

`&` 表示这个参数是一个*引用*（reference），它提供了一种方式，让代码的多个部分可以访问同一块数据，而无需将数据多次复制到内存中。引用是一个复杂的特性，而 Rust 的一大优势就是使用引用既安全又简单。你不需要了解太多细节就能完成这个程序。目前你只需要知道，和变量一样，引用默认也是不可变的。因此，你需要写 `&mut guess` 而不是 `&guess` 来使其可变。（第 4 章会更详细地解释引用。）

<!-- Old headings. Do not remove or links may break. -->

<a id="handling-potential-failure-with-the-result-type"></a>

### 使用 `Result` 处理潜在的错误

我们还在处理这行代码。我们现在讨论的是第三行文本，但请注意它仍然是单个逻辑代码行的一部分。下一部分是这个方法：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:expect}}
```

我们也可以将这段代码写成：

```rust,ignore
io::stdin().read_line(&mut guess).expect("Failed to read line");
```

然而，一行太长的代码难以阅读，所以最好将其拆分。当你使用 `.method_name()` 语法调用方法时，通过换行和缩进来拆分长行通常是明智的做法。现在让我们讨论这行代码的作用。

如前所述，`read_line` 会将用户输入的内容放入我们传递给它的字符串中，同时还会返回一个 `Result` 值。[`Result`][result]<!-- ignore --> 是一个[*枚举*][enums]<!-- ignore -->（enumeration），通常称为 *enum*，它是一种可以处于多种可能状态之一的类型。我们将每种可能的状态称为一个*变体*（variant）。

[第 6 章][enums]<!-- ignore -->将更详细地介绍枚举。这些 `Result` 类型的目的是编码错误处理信息。

`Result` 的变体是 `Ok` 和 `Err`。`Ok` 变体表示操作成功，其中包含成功生成的值。`Err` 变体表示操作失败，其中包含关于操作如何或为何失败的信息。

与任何类型的值一样，`Result` 类型的值也有定义在其上的方法。`Result` 的实例有一个 [`expect` 方法][expect]<!-- ignore -->可以调用。如果这个 `Result` 实例是 `Err` 值，`expect` 会导致程序崩溃并显示你作为参数传递给 `expect` 的消息。如果 `read_line` 方法返回 `Err`，那很可能是底层操作系统产生的错误。如果这个 `Result` 实例是 `Ok` 值，`expect` 会提取 `Ok` 中持有的返回值并将其返回给你，以便你使用。在这个例子中，该值是用户输入的字节数。

如果你不调用 `expect`，程序可以编译，但会收到一个警告：

```console
{{#include ../listings/ch02-guessing-game-tutorial/no-listing-02-without-expect/output.txt}}
```

Rust 警告你没有使用 `read_line` 返回的 `Result` 值，表明程序没有处理一个可能的错误。

消除警告的正确方法是实际编写错误处理代码，但在我们的例子中，我们只想在出现问题时让程序崩溃，所以可以使用 `expect`。你将在[第 9 章][recover]<!-- ignore -->中学习如何从错误中恢复。

### 使用 `println!` 占位符打印值

除了结尾的花括号，到目前为止的代码中只剩一行需要讨论：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-01/src/main.rs:print_guess}}
```

这行代码打印了现在包含用户输入的字符串。`{}` 花括号是一个占位符：把 `{}` 想象成一对小螃蟹钳子，夹住一个值。打印变量的值时，变量名可以直接放在花括号内。打印表达式的计算结果时，在格式字符串中放置空的花括号，然后在格式字符串后面用逗号分隔的表达式列表，按相同顺序填充每个空花括号占位符。在一次 `println!` 调用中同时打印变量和表达式的结果看起来像这样：

```rust
let x = 5;
let y = 10;

println!("x = {x} and y + 2 = {}", y + 2);
```

这段代码会打印 `x = 5 and y + 2 = 12`。

### 测试第一部分

让我们测试猜数字游戏的第一部分。使用 `cargo run` 运行它：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-01/
cargo clean
cargo run
input 6 -->

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
     Running `target/debug/guessing_game`
Guess the number!
Please input your guess.
6
You guessed: 6
```

到这里，游戏的第一部分就完成了：我们从键盘获取了输入并将其打印出来。

## 生成秘密数字

接下来，我们需要生成一个让用户来猜的秘密数字。秘密数字每次都应该不同，这样游戏才有趣。我们使用 1 到 100 之间的随机数，这样游戏不会太难。Rust 的标准库中还没有包含随机数功能。不过，Rust 团队提供了一个具有该功能的 [`rand` crate][randcrate]。

<!-- Old headings. Do not remove or links may break. -->
<a id="using-a-crate-to-get-more-functionality"></a>

### 使用 Crate 增加功能

记住，crate 是 Rust 源代码文件的集合。我们一直在构建的项目是一个*二进制 crate*（binary crate），即一个可执行文件。`rand` crate 是一个*库 crate*（library crate），其中包含旨在被其他程序使用的代码，它本身不能独立执行。

Cargo 对外部 crate 的协调管理正是 Cargo 真正出色的地方。在我们编写使用 `rand` 的代码之前，需要修改 _Cargo.toml_ 文件，将 `rand` crate 添加为依赖项。现在打开该文件，在 Cargo 为你创建的 `[dependencies]` 部分标题下方添加以下行。请确保按照我们这里的写法精确指定 `rand` 及其版本号，否则本教程中的代码示例可能无法正常工作：

<!-- When updating the version of `rand` used, also update the version of
`rand` used in these files so they all match:
* ch07-04-bringing-paths-into-scope-with-the-use-keyword.md
* ch14-03-cargo-workspaces.md
-->

<span class="filename">文件名：Cargo.toml</span>

```toml
{{#include ../listings/ch02-guessing-game-tutorial/listing-02-02/Cargo.toml:8:}}
```

在 _Cargo.toml_ 文件中，标题之后的所有内容都属于该部分，直到另一个部分开始。在 `[dependencies]` 中，你告诉 Cargo 你的项目依赖哪些外部 crate 以及需要这些 crate 的哪些版本。在这里，我们使用语义化版本说明符 `0.8.5` 来指定 `rand` crate。Cargo 理解[语义化版本控制][semver]<!-- ignore -->（有时称为 *SemVer*），这是编写版本号的标准。说明符 `0.8.5` 实际上是 `^0.8.5` 的简写，意思是任何不低于 0.8.5 但低于 0.9.0 的版本。

Cargo 认为这些版本具有与 0.8.5 版本兼容的公共 API，这个规范确保你将获得仍然能与本章代码一起编译的最新补丁版本。任何 0.9.0 或更高版本不保证具有与以下示例相同的 API。

现在，在不修改任何代码的情况下，让我们构建项目，如示例 2-2 所示。

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
rm Cargo.lock
cargo clean
cargo build -->

<Listing number="2-2" caption="添加 `rand` crate 作为依赖后运行 `cargo build` 的输出">

```console
$ cargo build
  Updating crates.io index
   Locking 15 packages to latest Rust 1.85.0 compatible versions
    Adding rand v0.8.5 (available: v0.9.0)
 Compiling proc-macro2 v1.0.93
 Compiling unicode-ident v1.0.17
 Compiling libc v0.2.170
 Compiling cfg-if v1.0.0
 Compiling byteorder v1.5.0
 Compiling getrandom v0.2.15
 Compiling rand_core v0.6.4
 Compiling quote v1.0.38
 Compiling syn v2.0.98
 Compiling zerocopy-derive v0.7.35
 Compiling zerocopy v0.7.35
 Compiling ppv-lite86 v0.2.20
 Compiling rand_chacha v0.3.1
 Compiling rand v0.8.5
 Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.48s
```

</Listing>

你可能会看到不同的版本号（但由于 SemVer，它们都与代码兼容！）和不同的行（取决于操作系统），而且行的顺序可能不同。

当我们引入一个外部依赖时，Cargo 会从*注册表*（registry）获取该依赖所需的所有最新版本，注册表是 [Crates.io][cratesio] 数据的副本。Crates.io 是 Rust 生态系统中人们发布开源 Rust 项目供他人使用的地方。

更新注册表后，Cargo 检查 `[dependencies]` 部分并下载所有尚未下载的 crate。在这个例子中，虽然我们只列出了 `rand` 作为依赖，但 Cargo 还获取了 `rand` 工作所依赖的其他 crate。下载完 crate 后，Rust 编译它们，然后使用可用的依赖编译项目。

如果你立即再次运行 `cargo build` 而不做任何更改，除了 `Finished` 行之外不会有任何输出。Cargo 知道它已经下载并编译了依赖项，而且你没有在 _Cargo.toml_ 文件中对它们做任何更改。Cargo 也知道你没有更改代码，所以也不会重新编译。无事可做，它就直接退出了。

如果你打开 _src/main.rs_ 文件，做一个微小的更改，然后保存并重新构建，你只会看到两行输出：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
touch src/main.rs
cargo build -->

```console
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
```

这些行表明 Cargo 只用你对 _src/main.rs_ 文件的微小更改来更新构建。你的依赖没有变化，所以 Cargo 知道可以复用已经下载和编译好的内容。

<!-- Old headings. Do not remove or links may break. -->
<a id="ensuring-reproducible-builds-with-the-cargo-lock-file"></a>

#### 确保可重现的构建

Cargo 有一种机制，确保你或任何其他人每次构建代码时都能重建相同的产物：Cargo 只会使用你指定的依赖版本，除非你另行指示。例如，假设下周 `rand` crate 发布了 0.8.6 版本，该版本包含一个重要的 bug 修复，但同时也包含一个会破坏你代码的回归问题。为了处理这种情况，Rust 在你第一次运行 `cargo build` 时创建了 _Cargo.lock_ 文件，所以我们现在在 _guessing_game_ 目录中有这个文件。

当你第一次构建项目时，Cargo 会找出符合条件的所有依赖版本，然后将它们写入 _Cargo.lock_ 文件。当你将来构建项目时，Cargo 会看到 _Cargo.lock_ 文件存在，并使用其中指定的版本，而不是重新计算版本。这让你自动拥有可重现的构建。换句话说，由于 _Cargo.lock_ 文件的存在，你的项目将保持在 0.8.5 版本，直到你显式升级。因为 _Cargo.lock_ 文件对于可重现的构建很重要，它通常会与项目中的其余代码一起提交到版本控制中。

#### 更新 Crate 以获取新版本

当你*确实*想要更新一个 crate 时，Cargo 提供了 `update` 命令，它会忽略 _Cargo.lock_ 文件，并找出 _Cargo.toml_ 中符合你规范的所有最新版本。然后 Cargo 会将这些版本写入 _Cargo.lock_ 文件。否则，默认情况下，Cargo 只会查找大于 0.8.5 且小于 0.9.0 的版本。如果 `rand` crate 发布了两个新版本 0.8.6 和 0.999.0，你运行 `cargo update` 时会看到以下内容：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-02/
cargo update
assuming there is a new 0.8.x version of rand; otherwise use another update
as a guide to creating the hypothetical output shown here -->

```console
$ cargo update
    Updating crates.io index
     Locking 1 package to latest Rust 1.85.0 compatible version
    Updating rand v0.8.5 -> v0.8.6 (available: v0.999.0)
```

Cargo 忽略了 0.999.0 版本。此时，你还会注意到 _Cargo.lock_ 文件中的变化，记录了你现在使用的 `rand` crate 版本是 0.8.6。要使用 `rand` 版本 0.999.0 或 0.999._x_ 系列中的任何版本，你需要将 _Cargo.toml_ 文件更新为如下内容（不要实际做这个更改，因为以下示例假设你使用的是 `rand` 0.8）：

```toml
[dependencies]
rand = "0.999.0"
```

下次你运行 `cargo build` 时，Cargo 会更新可用 crate 的注册表，并根据你指定的新版本重新评估你的 `rand` 需求。

关于 [Cargo][doccargo]<!-- ignore --> 及其[生态系统][doccratesio]<!-- ignore -->还有很多内容可以讲，我们将在第 14 章中讨论，但目前你只需要了解这些。Cargo 使得复用库变得非常容易，因此 Rustacean 们能够编写由多个包组装而成的小型项目。

### 生成随机数

让我们开始使用 `rand` 来生成一个要猜的数字。下一步是更新 _src/main.rs_，如示例 2-3 所示。

<Listing number="2-3" file-name="src/main.rs" caption="添加生成随机数的代码">

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-03/src/main.rs:all}}
```

</Listing>

首先，我们添加了 `use rand::Rng;` 这一行。`Rng` trait 定义了随机数生成器实现的方法，要使用这些方法，该 trait 必须在作用域内。第 10 章将详细介绍 trait。

接下来，我们在中间添加了两行。第一行调用了 `rand::thread_rng` 函数，它提供了我们将要使用的特定随机数生成器：一个位于当前执行线程本地的、由操作系统提供种子的生成器。然后，我们在该随机数生成器上调用 `gen_range` 方法。这个方法由我们通过 `use rand::Rng;` 语句引入作用域的 `Rng` trait 定义。`gen_range` 方法接受一个范围表达式作为参数，并生成该范围内的一个随机数。我们这里使用的范围表达式形式为 `start..=end`，它包含上下界，所以我们需要指定 `1..=100` 来请求一个 1 到 100 之间的数字。

> 注意：你不会凭空知道该使用哪些 trait、该调用 crate 中的哪些方法和函数，因此每个 crate 都有使用说明文档。Cargo 的另一个巧妙功能是，运行 `cargo doc --open` 命令会在本地构建所有依赖提供的文档并在浏览器中打开。例如，如果你对 `rand` crate 的其他功能感兴趣，可以运行 `cargo doc --open` 并点击左侧边栏中的 `rand`。

第二行新代码打印了秘密数字。这在我们开发程序时很有用，可以用来测试，但我们会在最终版本中删除它。如果程序一开始就打印答案，那就不算什么游戏了！

试着运行程序几次：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-03/
cargo run
4
cargo run
5
-->

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 7
Please input your guess.
4
You guessed: 4

$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 83
Please input your guess.
5
You guessed: 5
```

你应该会得到不同的随机数，而且它们都应该是 1 到 100 之间的数字。干得好！

## 比较猜测与秘密数字

现在我们有了用户输入和一个随机数，可以比较它们了。这一步如示例 2-4 所示。注意这段代码目前还无法编译，我们稍后会解释原因。

<Listing number="2-4" file-name="src/main.rs" caption="处理比较两个数字的可能返回值">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-04/src/main.rs:here}}
```

</Listing>

首先，我们添加了另一个 `use` 语句，从标准库引入了一个名为 `std::cmp::Ordering` 的类型。`Ordering` 类型是另一个枚举，有 `Less`、`Greater` 和 `Equal` 三个变体。这是比较两个值时可能出现的三种结果。

然后，我们在底部添加了五行新代码来使用 `Ordering` 类型。`cmp` 方法比较两个值，可以在任何可比较的值上调用。它接受一个你想要与之比较的值的引用：这里是将 `guess` 与 `secret_number` 进行比较。然后它返回我们通过 `use` 语句引入作用域的 `Ordering` 枚举的一个变体。我们使用 [`match`][match]<!-- ignore --> 表达式，根据用 `guess` 和 `secret_number` 的值调用 `cmp` 返回的 `Ordering` 变体来决定下一步做什么。

一个 `match` 表达式由多个*分支*（arm）组成。一个分支包含一个用于匹配的*模式*（pattern），以及当给 `match` 的值符合该分支模式时应该运行的代码。Rust 取传给 `match` 的值，依次检查每个分支的模式。模式和 `match` 结构是 Rust 的强大特性：它们让你能够表达代码可能遇到的各种情况，并确保你处理了所有情况。这些特性将分别在第 6 章和第 19 章中详细介绍。

让我们用这里使用的 `match` 表达式来走一个例子。假设用户猜了 50，而这次随机生成的秘密数字是 38。

当代码将 50 与 38 比较时，`cmp` 方法会返回 `Ordering::Greater`，因为 50 大于 38。`match` 表达式得到 `Ordering::Greater` 值，并开始检查每个分支的模式。它查看第一个分支的模式 `Ordering::Less`，发现 `Ordering::Greater` 与 `Ordering::Less` 不匹配，于是忽略该分支的代码并移动到下一个分支。下一个分支的模式是 `Ordering::Greater`，它*确实*匹配 `Ordering::Greater`！该分支中的关联代码将执行并在屏幕上打印 `Too big!`。`match` 表达式在第一次成功匹配后就结束了，所以在这个场景中它不会查看最后一个分支。

然而，示例 2-4 中的代码还无法编译。让我们试一下：

<!--
The error numbers in this output should be that of the code **WITHOUT** the
anchor or snip comments
-->

```console
{{#include ../listings/ch02-guessing-game-tutorial/listing-02-04/output.txt}}
```

错误的核心是存在*类型不匹配*（mismatched types）。Rust 拥有强大的静态类型系统。同时，它也有类型推断。当我们写 `let mut guess = String::new()` 时，Rust 能够推断出 `guess` 应该是 `String` 类型，不需要我们写出类型。而 `secret_number` 是一个数字类型。Rust 中有几种数字类型的值可以在 1 到 100 之间：`i32`，32 位整数；`u32`，无符号 32 位整数；`i64`，64 位整数；以及其他类型。除非另有指定，Rust 默认使用 `i32`，这就是 `secret_number` 的类型，除非你在其他地方添加了类型信息导致 Rust 推断出不同的数字类型。错误的原因是 Rust 无法比较字符串和数字类型。

最终，我们想要将程序读取的 `String` 输入转换为数字类型，以便与秘密数字进行数值比较。我们通过在 `main` 函数体中添加这行代码来实现：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/no-listing-03-convert-string-to-number/src/main.rs:here}}
```

这行代码是：

```rust,ignore
let guess: u32 = guess.trim().parse().expect("Please type a number!");
```

我们创建了一个名为 `guess` 的变量。等等，程序不是已经有一个名为 `guess` 的变量了吗？确实有，但 Rust 允许我们用一个新值*遮蔽*（shadow）之前的 `guess` 值。*遮蔽*让我们可以复用 `guess` 变量名，而不必创建两个不同的变量，比如 `guess_str` 和 `guess`。我们将在[第 3 章][shadowing]<!-- ignore -->中更详细地介绍这个特性，但现在只需知道，当你想将一个值从一种类型转换为另一种类型时，经常会用到这个特性。

我们将这个新变量绑定到表达式 `guess.trim().parse()`。表达式中的 `guess` 指的是包含输入字符串的原始 `guess` 变量。`String` 实例上的 `trim` 方法会去除开头和结尾的空白字符，在将字符串转换为只能包含数字数据的 `u32` 之前，我们必须这样做。用户必须按 <kbd>enter</kbd> 键来满足 `read_line` 并输入猜测，这会在字符串中添加一个换行符。例如，如果用户输入 <kbd>5</kbd> 并按 <kbd>enter</kbd>，`guess` 看起来是这样的：`5\n`。`\n` 代表"换行"。（在 Windows 上，按 <kbd>enter</kbd> 会产生一个回车符和一个换行符，即 `\r\n`。）`trim` 方法会去除 `\n` 或 `\r\n`，只留下 `5`。

[字符串上的 `parse` 方法][parse]<!-- ignore -->将字符串转换为另一种类型。这里我们用它将字符串转换为数字。我们需要使用 `let guess: u32` 来告诉 Rust 我们想要的确切数字类型。`guess` 后面的冒号（`:`）告诉 Rust 我们将标注变量的类型。Rust 有几种内置的数字类型；这里的 `u32` 是一个无符号 32 位整数。对于较小的正数来说，它是一个不错的默认选择。你将在[第 3 章][integers]<!-- ignore -->中了解其他数字类型。

此外，这个示例程序中的 `u32` 标注以及与 `secret_number` 的比较意味着 Rust 会推断 `secret_number` 也应该是 `u32` 类型。所以现在比较的是两个相同类型的值！

`parse` 方法只能处理逻辑上可以转换为数字的字符，因此很容易出错。例如，如果字符串包含 `A👍%`，就无法将其转换为数字。因为可能会失败，`parse` 方法返回一个 `Result` 类型，就像 `read_line` 方法一样（在前面的["使用 `Result` 处理潜在的错误"](#handling-potential-failure-with-result)<!-- ignore -->中讨论过）。我们将以同样的方式处理这个 `Result`，再次使用 `expect` 方法。如果 `parse` 因为无法从字符串创建数字而返回 `Err` 的 `Result` 变体，`expect` 调用会使游戏崩溃并打印我们给它的消息。如果 `parse` 能成功将字符串转换为数字，它会返回 `Result` 的 `Ok` 变体，`expect` 会从 `Ok` 值中返回我们想要的数字。

现在让我们运行程序：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/no-listing-03-convert-string-to-number/
touch src/main.rs
cargo run
  76
-->

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 58
Please input your guess.
  76
You guessed: 76
Too big!
```

不错！即使在猜测前面加了空格，程序仍然能判断出用户猜的是 76。多运行几次程序，验证不同输入的不同行为：猜对数字、猜一个太大的数字、猜一个太小的数字。

我们已经让游戏的大部分功能运行起来了，但用户只能猜一次。让我们通过添加循环来改变这一点！

## 通过循环允许多次猜测

`loop` 关键字创建一个无限循环。我们添加一个循环来给用户更多猜测的机会：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/no-listing-04-looping/src/main.rs:here}}
```

如你所见，我们将从猜测输入提示开始的所有内容都移到了循环中。确保循环内的每一行都多缩进四个空格，然后再次运行程序。程序现在会一直要求输入新的猜测，这实际上引入了一个新问题——用户似乎无法退出！

用户始终可以使用键盘快捷键 <kbd>ctrl</kbd>-<kbd>C</kbd> 来中断程序。但还有另一种方法可以逃脱这个贪得无厌的怪物，正如在["比较猜测与秘密数字"](#comparing-the-guess-to-the-secret-number)<!-- ignore -->中关于 `parse` 的讨论中提到的：如果用户输入一个非数字的答案，程序就会崩溃。我们可以利用这一点来让用户退出，如下所示：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/no-listing-04-looping/
touch src/main.rs
cargo run
(too small guess)
(too big guess)
(correct guess)
quit
-->

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.23s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 59
Please input your guess.
45
You guessed: 45
Too small!
Please input your guess.
60
You guessed: 60
Too big!
Please input your guess.
59
You guessed: 59
You win!
Please input your guess.
quit

thread 'main' panicked at src/main.rs:28:47:
Please type a number!: ParseIntError { kind: InvalidDigit }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

输入 `quit` 会退出游戏，但你会注意到，输入任何其他非数字内容也会退出。这至少可以说是不够理想的；我们希望游戏在猜对数字时也能停止。

### 猜对后退出

让我们通过添加 `break` 语句来让游戏在用户猜对时退出：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/no-listing-05-quitting/src/main.rs:here}}
```

在 `You win!` 之后添加 `break` 行，使程序在用户猜对秘密数字时退出循环。退出循环也意味着退出程序，因为循环是 `main` 的最后一部分。

### 处理无效输入

为了进一步完善游戏的行为，当用户输入非数字时，我们不让程序崩溃，而是让游戏忽略非数字输入，以便用户可以继续猜测。我们可以通过修改将 `guess` 从 `String` 转换为 `u32` 的那一行来实现，如示例 2-5 所示。

<Listing number="2-5" file-name="src/main.rs" caption="忽略非数字猜测并要求再次猜测，而不是让程序崩溃">

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-05/src/main.rs:here}}
```

</Listing>

我们将 `expect` 调用替换为 `match` 表达式，从遇到错误就崩溃转变为处理错误。记住，`parse` 返回一个 `Result` 类型，而 `Result` 是一个拥有 `Ok` 和 `Err` 变体的枚举。我们在这里使用 `match` 表达式，就像处理 `cmp` 方法返回的 `Ordering` 结果一样。

如果 `parse` 能够成功地将字符串转换为数字，它会返回一个包含结果数字的 `Ok` 值。这个 `Ok` 值会匹配第一个分支的模式，`match` 表达式会返回 `parse` 生成并放入 `Ok` 值中的 `num` 值。这个数字最终会出现在我们正在创建的新 `guess` 变量中。

如果 `parse` *无法*将字符串转换为数字，它会返回一个包含更多错误信息的 `Err` 值。`Err` 值不匹配第一个 `match` 分支中的 `Ok(num)` 模式，但它匹配第二个分支中的 `Err(_)` 模式。下划线 `_` 是一个通配值；在这个例子中，我们表示要匹配所有 `Err` 值，无论其中包含什么信息。因此，程序会执行第二个分支的代码 `continue`，它告诉程序进入 `loop` 的下一次迭代并要求再次猜测。这样，程序就有效地忽略了 `parse` 可能遇到的所有错误！

现在程序中的一切都应该按预期工作了。让我们试一下：

<!-- manual-regeneration
cd listings/ch02-guessing-game-tutorial/listing-02-05/
cargo run
(too small guess)
(too big guess)
foo
(correct guess)
-->

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 61
Please input your guess.
10
You guessed: 10
Too small!
Please input your guess.
99
You guessed: 99
Too big!
Please input your guess.
foo
Please input your guess.
61
You guessed: 61
You win!
```

太棒了！只需最后一个小调整，我们就能完成猜数字游戏。回想一下，程序仍然在打印秘密数字。这在测试时很有用，但会破坏游戏体验。让我们删除输出秘密数字的 `println!`。示例 2-6 展示了最终代码。

<Listing number="2-6" file-name="src/main.rs" caption="完整的猜数字游戏代码">

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-06/src/main.rs}}
```

</Listing>

至此，你已经成功构建了猜数字游戏。恭喜！

## 总结

这个项目通过动手实践的方式向你介绍了许多新的 Rust 概念：`let`、`match`、函数、外部 crate 的使用等等。在接下来的几章中，你将更详细地学习这些概念。第 3 章涵盖了大多数编程语言都有的概念，如变量、数据类型和函数，并展示如何在 Rust 中使用它们。第 4 章探讨所有权（ownership），这是 Rust 区别于其他语言的特性。第 5 章讨论结构体和方法语法，第 6 章解释枚举的工作原理。

[prelude]: ../std/prelude/index.html
[variables-and-mutability]: ch03-01-variables-and-mutability.html#variables-and-mutability
[comments]: ch03-04-comments.html
[string]: ../std/string/struct.String.html
[iostdin]: ../std/io/struct.Stdin.html
[read_line]: ../std/io/struct.Stdin.html#method.read_line
[result]: ../std/result/enum.Result.html
[enums]: ch06-00-enums.html
[expect]: ../std/result/enum.Result.html#method.expect
[recover]: ch09-02-recoverable-errors-with-result.html
[randcrate]: https://crates.io/crates/rand
[semver]: http://semver.org
[cratesio]: https://crates.io/
[doccargo]: https://doc.rust-lang.org/cargo/
[doccratesio]: https://doc.rust-lang.org/cargo/reference/publishing.html
[match]: ch06-02-match.html
[shadowing]: ch03-01-variables-and-mutability.html#shadowing
[parse]: ../std/primitive.str.html#method.parse
[integers]: ch03-02-data-types.html#integer-types
