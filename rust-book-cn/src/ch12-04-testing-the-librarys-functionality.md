<!-- Old headings. Do not remove or links may break. -->
<a id="developing-the-librarys-functionality-with-test-driven-development"></a>

## 通过测试驱动开发添加功能

现在我们已经将搜索逻辑提取到了 _src/lib.rs_ 中，与 `main` 函数分离开来，编写核心功能的测试就容易多了。我们可以直接用各种参数调用函数并检查返回值，而无需从命令行调用二进制文件。

在本节中，我们将使用测试驱动开发（TDD）流程为 `minigrep` 程序添加搜索逻辑，步骤如下：

1. 编写一个会失败的测试，运行它以确保它因你预期的原因而失败。
2. 编写或修改刚好足够的代码使新测试通过。
3. 重构你刚刚添加或修改的代码，并确保测试仍然通过。
4. 从步骤 1 重新开始！

虽然 TDD 只是众多软件编写方式中的一种，但它有助于驱动代码设计。在编写使测试通过的代码之前先编写测试，有助于在整个过程中保持较高的测试覆盖率。

我们将用测试驱动的方式来实现在文件内容中搜索查询字符串并生成匹配行列表的功能。我们将在一个名为 `search` 的函数中添加这个功能。

### 编写一个失败的测试

在 _src/lib.rs_ 中，我们将添加一个包含测试函数的 `tests` 模块，就像我们在[第十一章][ch11-anatomy]<!-- ignore -->中所做的那样。测试函数指定了我们希望 `search` 函数具有的行为：它接受一个查询字符串和要搜索的文本，并只返回文本中包含查询字符串的行。示例 12-15 展示了这个测试。

<Listing number="12-15" file-name="src/lib.rs" caption="为我们期望拥有的 `search` 函数功能创建一个失败的测试">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-15/src/lib.rs:here}}
```

</Listing>

这个测试搜索字符串 `"duct"`。我们要搜索的文本有三行，其中只有一行包含 `"duct"`（注意，开头双引号后面的反斜杠告诉 Rust 不要在这个字符串字面量的内容开头放置换行符）。我们断言 `search` 函数的返回值只包含我们期望的那一行。

如果运行这个测试，它目前会失败，因为 `unimplemented!` 宏会 panic 并显示"not implemented"消息。按照 TDD 原则，我们先迈出一小步，只添加刚好足够的代码，使调用函数时不会 panic——定义 `search` 函数始终返回一个空 vector，如示例 12-16 所示。然后测试应该能编译但会失败，因为空 vector 与包含 `"safe, fast, productive."` 这一行的 vector 不匹配。

<Listing number="12-16" file-name="src/lib.rs" caption="定义刚好足够的 `search` 函数使其调用时不会 panic">

```rust,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-16/src/lib.rs:here}}
```

</Listing>

现在让我们讨论一下为什么需要在 `search` 的签名中定义一个显式生命周期 `'a`，并将该生命周期用于 `contents` 参数和返回值。回忆一下[第十章][ch10-lifetimes]<!-- ignore -->中提到的，生命周期参数指定了哪个参数的生命周期与返回值的生命周期相关联。在这里，我们表明返回的 vector 应该包含引用 `contents` 参数（而非 `query` 参数）的切片的字符串切片。

换句话说，我们告诉 Rust，`search` 函数返回的数据将与传入 `search` 函数的 `contents` 参数中的数据存活一样长。这很重要！被切片引用的数据需要有效，引用才能有效；如果编译器假设我们创建的是 `query` 而非 `contents` 的字符串切片，它的安全检查就会出错。

如果我们忘记了生命周期标注并尝试编译这个函数，会得到如下错误：

```console
{{#include ../listings/ch12-an-io-project/output-only-02-missing-lifetimes/output.txt}}
```

Rust 无法知道我们需要的是两个参数中的哪一个，所以我们需要显式地告诉它。注意，帮助文本建议为所有参数和输出类型指定相同的生命周期参数，但这是不正确的！因为 `contents` 是包含所有文本的参数，而我们想要返回的是该文本中匹配的部分，所以我们知道 `contents` 才是应该通过生命周期语法与返回值关联的参数。

其他编程语言不要求你在签名中将参数与返回值关联起来，但随着时间的推移，这种做法会变得越来越自然。你可能想将这个例子与第十章["通过生命周期验证引用"][validating-references-with-lifetimes]<!-- ignore -->部分中的例子进行对比。

### 编写代码使测试通过

目前，我们的测试会失败，因为我们总是返回一个空 vector。要修复这个问题并实现 `search`，我们的程序需要遵循以下步骤：

1. 遍历内容的每一行。
2. 检查该行是否包含我们的查询字符串。
3. 如果包含，将其添加到我们要返回的值列表中。
4. 如果不包含，什么也不做。
5. 返回匹配的结果列表。

让我们逐步完成每个步骤，从遍历各行开始。

#### 使用 `lines` 方法遍历各行

Rust 有一个很实用的方法来处理字符串的逐行迭代，它的名字就叫 `lines`，用法如示例 12-17 所示。注意这段代码还无法编译。

<Listing number="12-17" file-name="src/lib.rs" caption="遍历 `contents` 中的每一行">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-17/src/lib.rs:here}}
```

</Listing>

`lines` 方法返回一个迭代器。我们将在[第十三章][ch13-iterators]<!-- ignore -->中深入讨论迭代器。但回忆一下，你在[示例 3-5][ch3-iter]<!-- ignore -->中见过这种使用迭代器的方式，我们在那里用 `for` 循环配合迭代器对集合中的每个元素执行一些代码。

#### 在每行中搜索查询字符串

接下来，我们将检查当前行是否包含查询字符串。幸运的是，字符串有一个名为 `contains` 的实用方法可以帮我们完成这个任务！在 `search` 函数中添加对 `contains` 方法的调用，如示例 12-18 所示。注意这段代码仍然无法编译。

<Listing number="12-18" file-name="src/lib.rs" caption="添加功能以检查该行是否包含 `query` 中的字符串">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-18/src/lib.rs:here}}
```

</Listing>

目前，我们正在逐步构建功能。为了让代码能够编译，我们需要从函数体中返回一个值，正如我们在函数签名中所承诺的那样。

#### 存储匹配的行

为了完成这个函数，我们需要一种方式来存储要返回的匹配行。为此，我们可以在 `for` 循环之前创建一个可变的 vector，并调用 `push` 方法将 `line` 存入 vector 中。在 `for` 循环之后，返回这个 vector，如示例 12-19 所示。

<Listing number="12-19" file-name="src/lib.rs" caption="存储匹配的行以便返回它们">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-19/src/lib.rs:here}}
```

</Listing>

现在 `search` 函数应该只返回包含 `query` 的行了，我们的测试应该能通过。让我们运行测试：

```console
{{#include ../listings/ch12-an-io-project/listing-12-19/output.txt}}
```

测试通过了，说明它能正常工作！

此时，我们可以考虑在保持测试通过的前提下重构搜索函数的实现，以维持相同的功能。搜索函数中的代码还不错，但它没有利用迭代器的一些实用特性。我们将在[第十三章][ch13-iterators]<!-- ignore -->中回到这个例子，届时我们将深入探讨迭代器，并看看如何改进它。

现在整个程序应该可以工作了！让我们试一试，首先用一个应该从 Emily Dickinson 的诗中恰好返回一行的单词：_frog_。

```console
{{#include ../listings/ch12-an-io-project/no-listing-02-using-search-in-run/output.txt}}
```

酷！现在让我们试一个会匹配多行的单词，比如 _body_：

```console
{{#include ../listings/ch12-an-io-project/output-only-03-multiple-matches/output.txt}}
```

最后，让我们确保搜索一个在诗中不存在的单词时不会得到任何行，比如 _monomorphization_：

```console
{{#include ../listings/ch12-an-io-project/output-only-04-no-matches/output.txt}}
```

非常好！我们构建了自己的迷你版经典工具，并学到了很多关于如何组织应用程序的知识。我们还学习了一些关于文件输入输出、生命周期、测试和命令行解析的内容。

为了完善这个项目，我们将简要演示如何使用环境变量以及如何打印到标准错误输出，这两者在编写命令行程序时都很有用。

[validating-references-with-lifetimes]: ch10-03-lifetime-syntax.html#validating-references-with-lifetimes
[ch11-anatomy]: ch11-01-writing-tests.html#the-anatomy-of-a-test-function
[ch10-lifetimes]: ch10-03-lifetime-syntax.html
[ch3-iter]: ch03-05-control-flow.html#looping-through-a-collection-with-for
[ch13-iterators]: ch13-02-iterators.html
