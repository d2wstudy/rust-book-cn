## 接受命令行参数

让我们像往常一样使用 `cargo new` 创建一个新项目。我们将项目命名为 `minigrep`，以区别于你系统上可能已有的 `grep` 工具：

```console
$ cargo new minigrep
     Created binary (application) `minigrep` project
$ cd minigrep
```

第一个任务是让 `minigrep` 接受两个命令行参数：文件路径和要搜索的字符串。也就是说，我们希望能够使用 `cargo run`、两个连字符（表示后面的参数是给我们的程序而非 `cargo` 的）、一个要搜索的字符串以及一个要搜索的文件路径来运行程序，如下所示：

```console
$ cargo run -- searchstring example-filename.txt
```

目前，`cargo new` 生成的程序无法处理我们传给它的参数。[crates.io](https://crates.io/) 上有一些现成的库可以帮助编写接受命令行参数的程序，但由于你正在学习这个概念，让我们自己来实现这个功能。

### 读取参数值

为了让 `minigrep` 能够读取传递给它的命令行参数值，我们需要使用 Rust 标准库提供的 `std::env::args` 函数。这个函数返回一个传递给 `minigrep` 的命令行参数的迭代器（iterator）。我们将在[第十三章][ch13]<!-- ignore -->中全面介绍迭代器。现在，你只需要了解关于迭代器的两个要点：迭代器会产生一系列值，我们可以对迭代器调用 `collect` 方法将其转换为一个集合，比如包含迭代器所产生的所有元素的 vector。

示例 12-1 中的代码让你的 `minigrep` 程序能够读取传递给它的所有命令行参数，然后将这些值收集到一个 vector 中。

<Listing number="12-1" file-name="src/main.rs" caption="将命令行参数收集到一个 vector 中并打印出来">

```rust
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-01/src/main.rs}}
```

</Listing>

首先，我们通过 `use` 语句将 `std::env` 模块引入作用域，以便使用它的 `args` 函数。注意 `std::env::args` 函数嵌套在两层模块中。正如我们在[第七章][ch7-idiomatic-use]<!-- ignore -->中讨论的那样，当所需函数嵌套在多个模块中时，我们选择将父模块引入作用域而非直接引入函数本身。这样做的好处是可以方便地使用 `std::env` 中的其他函数。同时，这也比添加 `use std::env::args` 然后仅用 `args` 来调用函数更加清晰，因为 `args` 很容易被误认为是当前模块中定义的函数。

> ### `args` 函数与无效的 Unicode
>
> 注意，如果任何参数包含无效的 Unicode，`std::env::args` 会 panic。如果你的程序需要接受包含无效 Unicode 的参数，请改用 `std::env::args_os`。该函数返回一个产生 `OsString` 值而非 `String` 值的迭代器。这里为了简单起见我们选择使用 `std::env::args`，因为 `OsString` 值因平台而异，处理起来也比 `String` 值更复杂。

在 `main` 函数的第一行，我们调用了 `env::args`，并立即使用 `collect` 将迭代器转换为一个包含迭代器所产生的所有值的 vector。我们可以使用 `collect` 函数来创建多种类型的集合，因此我们显式标注了 `args` 的类型，以指定我们想要一个字符串 vector。虽然在 Rust 中很少需要标注类型，但 `collect` 是一个经常需要标注的函数，因为 Rust 无法推断出你想要的集合类型。

最后，我们使用调试宏打印这个 vector。让我们先不带参数运行代码，然后再带两个参数试试：

```console
{{#include ../listings/ch12-an-io-project/listing-12-01/output.txt}}
```

```console
{{#include ../listings/ch12-an-io-project/output-only-01-with-args/output.txt}}
```

注意 vector 中的第一个值是 `"target/debug/minigrep"`，这是我们二进制文件的名称。这与 C 语言中参数列表的行为一致，让程序可以在执行过程中使用调用它时所用的名称。如果你想在消息中打印程序名称，或者根据调用程序时使用的命令行别名来改变程序行为，访问程序名称通常是很方便的。但就本章的目的而言，我们将忽略它，只保存我们需要的两个参数。

### 将参数值保存到变量中

目前程序已经能够访问命令行参数中指定的值了。现在我们需要将这两个参数的值保存到变量中，以便在程序的其余部分使用。我们在示例 12-2 中完成这个操作。

<Listing number="12-2" file-name="src/main.rs" caption="创建变量来保存查询参数和文件路径参数">

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-02/src/main.rs}}
```

</Listing>

正如我们打印 vector 时所看到的，程序名称占据了 vector 中索引 `args[0]` 处的第一个值，所以我们从索引 1 开始获取参数。`minigrep` 接受的第一个参数是要搜索的字符串，因此我们将第一个参数的引用存入变量 `query`。第二个参数是文件路径，因此我们将第二个参数的引用存入变量 `file_path`。

我们临时打印这些变量的值，以验证代码按预期工作。让我们再次使用参数 `test` 和 `sample.txt` 运行这个程序：

```console
{{#include ../listings/ch12-an-io-project/listing-12-02/output.txt}}
```

程序正常工作了！我们需要的参数值已经被保存到了正确的变量中。稍后我们会添加一些错误处理来应对某些潜在的错误情况，比如用户没有提供任何参数的情况；现在我们先忽略这种情况，转而着手添加文件读取功能。

[ch13]: ch13-00-functional-features.html
[ch7-idiomatic-use]: ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#creating-idiomatic-use-paths
