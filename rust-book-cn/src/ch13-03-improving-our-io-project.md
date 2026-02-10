## 改进 I/O 项目

有了关于迭代器的新知识，我们可以使用迭代器来改进第十二章的 I/O 项目，使代码更加清晰简洁。让我们看看迭代器如何改进 `Config::build` 函数和 `search` 函数的实现。

### 使用迭代器消除 `clone`

在示例 12-6 中，我们添加的代码接收一个 `String` 值的切片，并通过索引切片和克隆值来创建 `Config` 结构体的实例，从而让 `Config` 结构体拥有这些值的所有权。在示例 13-17 中，我们重新展示了示例 12-23 中 `Config::build` 函数的实现。

<Listing number="13-17" file-name="src/main.rs" caption="示例 12-23 中 `Config::build` 函数的复现">

```rust,ignore
{{#rustdoc_include ../listings/ch13-functional-features/listing-12-23-reproduced/src/main.rs:ch13}}
```

</Listing>

当时我们说过不必担心低效的 `clone` 调用，因为将来会移除它们。现在就是时候了！

这里之所以需要 `clone`，是因为参数 `args` 中有一个包含 `String` 元素的切片，但 `build` 函数并不拥有 `args` 的所有权。为了返回 `Config` 实例的所有权，我们不得不克隆 `Config` 的 `query` 和 `file_path` 字段中的值，这样 `Config` 实例才能拥有这些值。

有了关于迭代器的新知识，我们可以将 `build` 函数改为接收一个迭代器的所有权作为参数，而不是借用一个切片。我们将使用迭代器的功能来替代检查切片长度和按索引访问特定位置的代码。这将使 `Config::build` 函数的意图更加清晰，因为迭代器会自行访问这些值。

一旦 `Config::build` 获取了迭代器的所有权，不再使用借用的索引操作，我们就可以将 `String` 值从迭代器移动到 `Config` 中，而不必调用 `clone` 来进行新的分配。

#### 直接使用返回的迭代器

打开你的 I/O 项目的 *src/main.rs* 文件，它应该看起来像这样：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch13-functional-features/listing-12-24-reproduced/src/main.rs:ch13}}
```

我们首先将示例 12-24 中 `main` 函数的开头改为示例 13-18 中的代码，这次使用了迭代器。在我们同时更新 `Config::build` 之前，这段代码还无法编译。

<Listing number="13-18" file-name="src/main.rs" caption="将 `env::args` 的返回值传递给 `Config::build`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-18/src/main.rs:here}}
```

</Listing>

`env::args` 函数返回一个迭代器！与其将迭代器的值收集到一个 vector 中再传递切片给 `Config::build`，现在我们直接将 `env::args` 返回的迭代器的所有权传递给 `Config::build`。

接下来，我们需要更新 `Config::build` 的定义。让我们将 `Config::build` 的签名改为示例 13-19 的样子。这仍然无法编译，因为我们还需要更新函数体。

<Listing number="13-19" file-name="src/main.rs" caption="更新 `Config::build` 的签名以接收一个迭代器">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-19/src/main.rs:here}}
```

</Listing>

`env::args` 函数的标准库文档显示，它返回的迭代器类型是 `std::env::Args`，该类型实现了 `Iterator` trait 并返回 `String` 值。

我们更新了 `Config::build` 函数的签名，使参数 `args` 具有泛型类型，其 trait 约束为 `impl Iterator<Item = String>` 而不是 `&[String]`。我们在第十章["trait 作为参数"][impl-trait]<!-- ignore -->部分讨论过的 `impl Trait` 语法的这种用法意味着 `args` 可以是任何实现了 `Iterator` trait 并返回 `String` 项的类型。

因为我们获取了 `args` 的所有权，并且将通过迭代来改变 `args`，所以我们可以在 `args` 参数的声明中添加 `mut` 关键字使其可变。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-iterator-trait-methods-instead-of-indexing"></a>

#### 使用 `Iterator` trait 的方法

接下来，我们来修改 `Config::build` 的函数体。因为 `args` 实现了 `Iterator` trait，我们知道可以对它调用 `next` 方法！示例 13-20 将示例 12-23 中的代码更新为使用 `next` 方法。

<Listing number="13-20" file-name="src/main.rs" caption="修改 `Config::build` 的函数体以使用迭代器方法">

```rust,ignore,noplayground
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-20/src/main.rs:here}}
```

</Listing>

请记住，`env::args` 返回值中的第一个值是程序的名称。我们想要忽略它并获取下一个值，所以首先调用 `next` 并对返回值不做任何处理。然后，我们调用 `next` 来获取要放入 `Config` 的 `query` 字段中的值。如果 `next` 返回 `Some`，我们使用 `match` 来提取值。如果它返回 `None`，则意味着提供的参数不够，我们提前返回一个 `Err` 值。对 `file_path` 值也做同样的处理。

<!-- Old headings. Do not remove or links may break. -->

<a id="making-code-clearer-with-iterator-adapters"></a>

### 使用迭代器适配器使代码更清晰

我们还可以在 I/O 项目的 `search` 函数中利用迭代器。示例 13-21 重新展示了示例 12-19 中该函数的实现。

<Listing number="13-21" file-name="src/lib.rs" caption="示例 12-19 中 `search` 函数的实现">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-19/src/lib.rs:ch13}}
```

</Listing>

我们可以使用迭代器适配器方法以更简洁的方式编写这段代码。这样做还可以避免使用可变的中间变量 `results` vector。函数式编程风格倾向于最小化可变状态的使用，以使代码更清晰。移除可变状态可能还有助于未来实现并行搜索的增强，因为我们不必管理对 `results` vector 的并发访问。示例 13-22 展示了这一改动。

<Listing number="13-22" file-name="src/lib.rs" caption="在 `search` 函数的实现中使用迭代器适配器方法">

```rust,ignore
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-22/src/lib.rs:here}}
```

</Listing>

回忆一下，`search` 函数的目的是返回 `contents` 中所有包含 `query` 的行。与示例 13-16 中的 `filter` 示例类似，这段代码使用 `filter` 适配器只保留 `line.contains(query)` 返回 `true` 的行。然后我们用 `collect` 将匹配的行收集到另一个 vector 中。简洁多了！你也可以对 `search_case_insensitive` 函数做同样的改动，使用迭代器方法。

作为进一步的改进，可以让 `search` 函数返回一个迭代器，方法是移除 `collect` 调用并将返回类型改为 `impl Iterator<Item = &'a str>`，使函数本身成为一个迭代器适配器。注意你还需要更新测试！在做出这个改动前后，使用你的 `minigrep` 工具搜索一个大文件来观察行为上的差异。在改动之前，程序在收集完所有结果之后才会打印，但改动之后，结果会在找到每一行匹配时就立即打印，因为 `run` 函数中的 `for` 循环能够利用迭代器的惰性求值特性。

<!-- Old headings. Do not remove or links may break. -->

<a id="choosing-between-loops-or-iterators"></a>

### 选择循环还是迭代器

接下来一个自然的问题是，在你自己的代码中应该选择哪种风格以及为什么：示例 13-21 中的原始实现，还是示例 13-22 中使用迭代器的版本（假设我们在返回之前收集所有结果，而不是返回迭代器）。大多数 Rust 程序员倾向于使用迭代器风格。刚开始时确实有点难以掌握，但一旦你熟悉了各种迭代器适配器及其功能，迭代器就会变得更容易理解。与其摆弄循环的各种细节和构建新的 vector，代码可以专注于循环的高层目标。这将一些常见的代码抽象出去，从而更容易看到这段代码特有的概念，比如迭代器中每个元素必须通过的过滤条件。

但这两种实现真的等价吗？直觉上可能会认为更底层的循环会更快。让我们来谈谈性能。

[impl-trait]: ch10-02-traits.html#traits-as-parameters
