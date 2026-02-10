## 使用 `use` 关键字将路径引入作用域

每次调用函数都要写出完整路径，未免让人觉得不便且重复。在示例 7-7 中，无论我们选择 `add_to_waitlist` 函数的绝对路径还是相对路径，每次调用时都必须指定 `front_of_house` 和 `hosting`。好在有一种简化方式：我们可以使用 `use` 关键字为路径创建一个快捷方式，然后在作用域内的其他地方使用更短的名称。

在示例 7-11 中，我们将 `crate::front_of_house::hosting` 模块引入了 `eat_at_restaurant` 函数的作用域，这样在 `eat_at_restaurant` 中调用 `add_to_waitlist` 函数时，只需指定 `hosting::add_to_waitlist` 即可。

<Listing number="7-11" file-name="src/lib.rs" caption="使用 `use` 将模块引入作用域">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-11/src/lib.rs}}
```

</Listing>

在作用域中添加 `use` 和路径，类似于在文件系统中创建符号链接。通过在 crate 根中添加 `use crate::front_of_house::hosting`，`hosting` 就成为该作用域中的有效名称，就好像 `hosting` 模块是在 crate 根中定义的一样。通过 `use` 引入作用域的路径同样会检查私有性，与其他路径一样。

注意，`use` 只在其所在的特定作用域内创建快捷方式。示例 7-12 将 `eat_at_restaurant` 函数移到了一个名为 `customer` 的新子模块中，这与 `use` 语句所在的作用域不同，因此函数体将无法编译。

<Listing number="7-12" file-name="src/lib.rs" caption="`use` 语句只在其所在的作用域内有效。">

```rust,noplayground,test_harness,does_not_compile,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-12/src/lib.rs}}
```

</Listing>

编译器错误表明，快捷方式在 `customer` 模块内不再适用：

```console
{{#include ../listings/ch07-managing-growing-projects/listing-07-12/output.txt}}
```

注意，还有一个警告提示 `use` 在其作用域内不再被使用！要解决这个问题，可以将 `use` 也移到 `customer` 模块内，或者在子模块 `customer` 中通过 `super::hosting` 引用父模块中的快捷方式。

### 创建惯用的 `use` 路径

在示例 7-11 中，你可能会疑惑：为什么我们指定的是 `use crate::front_of_house::hosting`，然后在 `eat_at_restaurant` 中调用 `hosting::add_to_waitlist`，而不是将 `use` 路径一直写到 `add_to_waitlist` 函数本身来达到同样的效果呢？如示例 7-13 所示。

<Listing number="7-13" file-name="src/lib.rs" caption="使用 `use` 将 `add_to_waitlist` 函数引入作用域，这不是惯用写法">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-13/src/lib.rs}}
```

</Listing>

虽然示例 7-11 和示例 7-13 完成的是同样的任务，但示例 7-11 才是使用 `use` 将函数引入作用域的惯用方式。通过 `use` 将函数的父模块引入作用域，意味着我们在调用函数时必须指定父模块。在调用函数时指定父模块，可以清楚地表明该函数不是本地定义的，同时又最大限度地减少了完整路径的重复。而示例 7-13 中的代码则不清楚 `add_to_waitlist` 是在哪里定义的。

另一方面，当使用 `use` 引入结构体、枚举和其他项时，惯用做法是指定完整路径。示例 7-14 展示了将标准库的 `HashMap` 结构体引入二进制 crate 作用域的惯用方式。

<Listing number="7-14" file-name="src/main.rs" caption="以惯用方式将 `HashMap` 引入作用域">

```rust
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-14/src/main.rs}}
```

</Listing>

这个惯例背后没有什么特别的原因：这只是已经形成的约定，大家已经习惯了以这种方式阅读和编写 Rust 代码。

这个惯例的例外情况是：如果我们要用 `use` 语句将两个同名的项引入作用域，因为 Rust 不允许这样做。示例 7-15 展示了如何将两个同名但父模块不同的 `Result` 类型引入作用域，以及如何引用它们。

<Listing number="7-15" file-name="src/lib.rs" caption="将两个同名类型引入同一作用域需要使用它们的父模块。">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-15/src/lib.rs:here}}
```

</Listing>

如你所见，使用父模块可以区分这两个 `Result` 类型。如果我们指定的是 `use std::fmt::Result` 和 `use std::io::Result`，那么同一作用域中就会有两个 `Result` 类型，Rust 就无法知道我们使用 `Result` 时指的是哪一个。

### 使用 `as` 关键字提供新名称

使用 `use` 将两个同名类型引入同一作用域还有另一种解决方案：在路径之后，我们可以指定 `as` 和一个新的本地名称，即类型的**别名**（_alias_）。示例 7-16 展示了另一种编写示例 7-15 代码的方式，通过 `as` 重命名了两个 `Result` 类型中的一个。

<Listing number="7-16" file-name="src/lib.rs" caption="使用 `as` 关键字重命名引入作用域的类型">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-16/src/lib.rs:here}}
```

</Listing>

在第二个 `use` 语句中，我们为 `std::io::Result` 类型选择了新名称 `IoResult`，这样就不会与同样引入作用域的 `std::fmt` 中的 `Result` 冲突。示例 7-15 和示例 7-16 都是惯用写法，选择哪种由你决定！

### 使用 `pub use` 重导出名称

当我们使用 `use` 关键字将名称引入作用域时，该名称在新作用域中是私有的。为了让外部代码也能引用该名称，就好像它是在该作用域中定义的一样，我们可以将 `pub` 和 `use` 组合使用。这种技术被称为**重导出**（_re-exporting_），因为我们不仅将一个项引入了作用域，还使该项可以被其他代码引入到它们的作用域中。

示例 7-17 展示了将示例 7-11 中根模块的 `use` 改为 `pub use` 后的代码。

<Listing number="7-17" file-name="src/lib.rs" caption="使用 `pub use` 使名称可以从新的作用域被任何代码使用">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-17/src/lib.rs}}
```

</Listing>

在此更改之前，外部代码需要使用路径 `restaurant::front_of_house::hosting::add_to_waitlist()` 来调用 `add_to_waitlist` 函数，而且还需要 `front_of_house` 模块被标记为 `pub`。现在，由于 `pub use` 从根模块重导出了 `hosting` 模块，外部代码可以使用路径 `restaurant::hosting::add_to_waitlist()` 来代替。

当代码的内部结构与调用者对该领域的思考方式不同时，重导出非常有用。例如，在这个餐厅的比喻中，经营餐厅的人会想到"前厅"和"后厨"。但光顾餐厅的顾客可能不会用这些术语来思考餐厅的各个部分。通过 `pub use`，我们可以用一种结构编写代码，但暴露出另一种不同的结构。这样做使我们的库对于库的开发者和库的调用者都组织良好。我们将在第 14 章的["导出方便的公有 API"][ch14-pub-use]<!-- ignore -->中看到另一个 `pub use` 的例子，以及它如何影响 crate 的文档。

### 使用外部包

在第 2 章中，我们编写了一个猜数字游戏项目，其中使用了一个名为 `rand` 的外部包来获取随机数。为了在项目中使用 `rand`，我们在 _Cargo.toml_ 中添加了这一行：

<!-- When updating the version of `rand` used, also update the version of
`rand` used in these files so they all match:
* ch02-00-guessing-game-tutorial.md
* ch14-03-cargo-workspaces.md
-->

<Listing file-name="Cargo.toml">

```toml
{{#include ../listings/ch02-guessing-game-tutorial/listing-02-02/Cargo.toml:9:}}
```

</Listing>

在 _Cargo.toml_ 中将 `rand` 添加为依赖，会告诉 Cargo 从 [crates.io](https://crates.io/) 下载 `rand` 包及其所有依赖，并使 `rand` 可用于我们的项目。

然后，为了将 `rand` 的定义引入我们包的作用域，我们添加了一行以 crate 名称 `rand` 开头的 `use` 语句，并列出了要引入作用域的项。回忆一下，在第 2 章的["生成一个随机数"][rand]<!-- ignore -->中，我们将 `Rng` trait 引入了作用域，并调用了 `rand::thread_rng` 函数：

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-03/src/main.rs:ch07-04}}
```

Rust 社区的成员在 [crates.io](https://crates.io/) 上发布了许多包，将其中任何一个引入你的包都遵循相同的步骤：在包的 _Cargo.toml_ 文件中列出它们，然后使用 `use` 将其 crate 中的项引入作用域。

注意，标准库 `std` 也是一个外部于我们包的 crate。因为标准库随 Rust 语言一起分发，所以我们不需要修改 _Cargo.toml_ 来包含 `std`。但我们仍然需要使用 `use` 将其中的项引入我们包的作用域。例如，对于 `HashMap`，我们会使用这一行：

```rust
use std::collections::HashMap;
```

这是一个以 `std`（标准库 crate 的名称）开头的绝对路径。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-nested-paths-to-clean-up-large-use-lists"></a>

### 使用嵌套路径清理 `use` 列表

如果我们要使用同一个 crate 或同一个模块中定义的多个项，逐行列出每个项会占用文件中大量的纵向空间。例如，在示例 2-4 的猜数字游戏中，我们有这两个 `use` 语句将 `std` 中的项引入作用域：

<Listing file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/no-listing-01-use-std-unnested/src/main.rs:here}}
```

</Listing>

我们可以改用嵌套路径在一行中将相同的项引入作用域。做法是指定路径的公共部分，后跟两个冒号，然后用花括号括起路径中不同的部分，如示例 7-18 所示。

<Listing number="7-18" file-name="src/main.rs" caption="指定嵌套路径将具有相同前缀的多个项引入作用域">

```rust,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-18/src/main.rs:here}}
```

</Listing>

在较大的程序中，使用嵌套路径从同一个 crate 或模块引入多个项，可以大大减少所需的独立 `use` 语句数量！

我们可以在路径的任何层级使用嵌套路径，这在合并两个共享子路径的 `use` 语句时非常有用。例如，示例 7-19 展示了两个 `use` 语句：一个将 `std::io` 引入作用域，另一个将 `std::io::Write` 引入作用域。

<Listing number="7-19" file-name="src/lib.rs" caption="两个 `use` 语句，其中一个是另一个的子路径">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-19/src/lib.rs}}
```

</Listing>

这两个路径的公共部分是 `std::io`，这也是第一个路径的完整形式。要将这两个路径合并为一个 `use` 语句，我们可以在嵌套路径中使用 `self`，如示例 7-20 所示。

<Listing number="7-20" file-name="src/lib.rs" caption="将示例 7-19 中的路径合并为一个 `use` 语句">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-20/src/lib.rs}}
```

</Listing>

这一行将 `std::io` 和 `std::io::Write` 同时引入了作用域。

<!-- Old headings. Do not remove or links may break. -->

<a id="the-glob-operator"></a>

### 使用 glob 运算符导入所有项

如果我们想将一个路径中定义的**所有**公有项都引入作用域，可以在路径后面加上 `*` glob 运算符：

```rust
use std::collections::*;
```

这个 `use` 语句将 `std::collections` 中定义的所有公有项引入当前作用域。使用 glob 运算符时要小心！glob 会使我们更难分辨作用域中有哪些名称，以及程序中使用的某个名称是在哪里定义的。此外，如果依赖更改了其定义，你导入的内容也会随之改变，这可能导致在升级依赖时出现编译错误——例如，当依赖新增了一个与你在同一作用域中的定义同名的项时。

glob 运算符常用于测试场景，将所有待测试的内容引入 `tests` 模块；我们将在第 11 章的["如何编写测试"][writing-tests]<!-- ignore -->中讨论这一点。glob 运算符有时也作为 prelude 模式的一部分使用：更多关于该模式的信息，请参阅[标准库文档](../std/prelude/index.html#other-preludes)<!-- ignore -->。

[ch14-pub-use]: ch14-02-publishing-to-crates-io.html#exporting-a-convenient-public-api
[rand]: ch02-00-guessing-game-tutorial.html#generating-a-random-number
[writing-tests]: ch11-01-writing-tests.html#how-to-write-tests
