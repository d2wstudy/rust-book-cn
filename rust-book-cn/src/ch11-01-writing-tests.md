## 如何编写测试

测试（test）是一种 Rust 函数，用于验证非测试代码是否按预期方式运行。测试函数体通常执行以下三个操作：

- 设置所需的数据或状态。
- 运行要测试的代码。
- 断言结果是否符合预期。

让我们来看看 Rust 专门为编写测试提供的特性，包括 `test` 属性、一些宏，以及 `should_panic` 属性。

<!-- Old headings. Do not remove or links may break. -->

<a id="the-anatomy-of-a-test-function"></a>

### 测试函数的结构

最简单的情况下，Rust 中的测试就是一个标注了 `test` 属性的函数。属性（attribute）是关于 Rust 代码片段的元数据；第五章中我们在结构体上使用的 `derive` 属性就是一个例子。要将一个函数变成测试函数，只需在 `fn` 的前一行加上 `#[test]`。当你使用 `cargo test` 命令运行测试时，Rust 会构建一个测试运行器二进制文件，运行所有标注了该属性的函数，并报告每个测试函数是通过还是失败。

每当我们用 Cargo 创建一个新的库项目时，都会自动生成一个包含测试函数的测试模块。这个模块为你提供了编写测试的模板，这样你就不必在每次开始新项目时都去查找确切的结构和语法。你可以根据需要添加任意多的测试函数和测试模块！

我们将通过对模板测试进行实验来探索测试工作原理的一些方面，然后再编写一些真正测试我们代码的测试。

让我们创建一个名为 `adder` 的新库项目，它将实现两个数字相加的功能：

```console
$ cargo new adder --lib
     Created library `adder` project
$ cd adder
```

`adder` 库中 _src/lib.rs_ 文件的内容应该如 Listing 11-1 所示。

<Listing number="11-1" file-name="src/lib.rs" caption="由 `cargo new` 自动生成的代码">

<!-- manual-regeneration
cd listings/ch11-writing-automated-tests
rm -rf listing-11-01
cargo new listing-11-01 --lib --name adder
cd listing-11-01
echo "$ cargo test" > output.txt
RUSTFLAGS="-A unused_variables -A dead_code" RUST_TEST_THREADS=1 cargo test >> output.txt 2>&1
git diff output.txt # commit any relevant changes; discard irrelevant ones
cd ../../..
-->

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-01/src/lib.rs}}
```

</Listing>

文件开头有一个示例 `add` 函数，这样我们就有了可以测试的内容。

现在让我们只关注 `it_works` 函数。注意 `#[test]` 标注：这个属性表明这是一个测试函数，因此测试运行器知道要将这个函数当作测试来处理。我们也可能在 `tests` 模块中有非测试函数，用来帮助设置通用场景或执行通用操作，所以我们始终需要标明哪些函数是测试。

示例函数体使用了 `assert_eq!` 宏来断言 `result`（即调用 `add` 传入 2 和 2 的结果）等于 4。这个断言作为典型测试格式的示例。让我们运行它来看看这个测试是否通过。

`cargo test` 命令会运行项目中的所有测试，如 Listing 11-2 所示。

<Listing number="11-2" caption="运行自动生成的测试的输出">

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-01/output.txt}}
```

</Listing>

Cargo 编译并运行了测试。我们看到 `running 1 test` 这一行。下一行显示了生成的测试函数的名称 `tests::it_works`，以及该测试的运行结果为 `ok`。总体摘要 `test result: ok.` 表示所有测试都通过了，`1 passed; 0 failed` 部分统计了通过和失败的测试数量。

可以将测试标记为忽略，使其在特定情况下不运行；我们将在本章后面的["除非特别指定否则忽略某些测试"][ignoring]<!-- ignore -->部分介绍这一点。因为我们这里没有这样做，所以摘要显示 `0 ignored`。我们还可以向 `cargo test` 命令传递参数，只运行名称匹配某个字符串的测试；这称为**过滤**（filtering），我们将在["按名称运行部分测试"][subset]<!-- ignore -->部分介绍。这里我们没有过滤要运行的测试，所以摘要末尾显示 `0 filtered out`。

`0 measured` 统计的是衡量性能的基准测试（benchmark test）。截至本文撰写时，基准测试仅在 nightly 版本的 Rust 中可用。请参阅[基准测试的文档][bench]了解更多信息。

测试输出的下一部分从 `Doc-tests adder` 开始，是文档测试的结果。我们目前还没有任何文档测试，但 Rust 可以编译出现在 API 文档中的任何代码示例。这个特性有助于保持文档和代码的同步！我们将在第十四章的["文档注释作为测试"][doc-comments]<!-- ignore -->部分讨论如何编写文档测试。现在，我们先忽略 `Doc-tests` 输出。

让我们开始根据自己的需求定制测试。首先，将 `it_works` 函数的名称改为其他名称，比如 `exploration`，如下所示：

<span class="filename">文件名：src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-01-changing-test-name/src/lib.rs}}
```

然后再次运行 `cargo test`。输出现在显示的是 `exploration` 而不是 `it_works`：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-01-changing-test-name/output.txt}}
```

现在我们再添加一个测试，不过这次我们要写一个会失败的测试！当测试函数中的某些代码 panic 时，测试就会失败。每个测试都在一个新线程中运行，当主线程检测到某个测试线程已终止时，该测试就会被标记为失败。在第九章中，我们讨论过引发 panic 最简单的方式就是调用 `panic!` 宏。输入新的测试作为名为 `another` 的函数，使你的 _src/lib.rs_ 文件看起来如 Listing 11-3 所示。

<Listing number="11-3" file-name="src/lib.rs" caption="添加第二个测试，该测试因调用 `panic!` 宏而失败">

```rust,panics,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-03/src/lib.rs}}
```

</Listing>

使用 `cargo test` 再次运行测试。输出应该如 Listing 11-4 所示，表明我们的 `exploration` 测试通过了而 `another` 失败了。

<Listing number="11-4" caption="一个测试通过、一个测试失败时的测试结果">

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-03/output.txt}}
```

</Listing>

<!-- manual-regeneration
rg panicked listings/ch11-writing-automated-tests/listing-11-03/output.txt
check the line number of the panic matches the line number in the following paragraph
 -->

`test tests::another` 这一行显示的不是 `ok`，而是 `FAILED`。在单个测试结果和摘要之间出现了两个新的部分：第一部分显示每个测试失败的详细原因。在这个例子中，我们得到的详细信息是 `tests::another` 因为在 _src/lib.rs_ 文件第 17 行 panic 并输出了消息 `Make this test fail` 而失败。下一部分仅列出所有失败测试的名称，这在有大量测试和大量详细失败输出时非常有用。我们可以使用失败测试的名称来单独运行该测试，以便更容易地调试；我们将在["控制测试的运行方式"][controlling-how-tests-are-run]<!-- ignore -->部分详细讨论运行测试的方式。

摘要行显示在最后：总体测试结果为 `FAILED`。我们有一个测试通过，一个测试失败。

现在你已经了解了不同场景下测试结果的样子，让我们来看看除 `panic!` 之外在测试中有用的一些宏。

<!-- Old headings. Do not remove or links may break. -->

<a id="checking-results-with-the-assert-macro"></a>

### 使用 `assert!` 检查结果

标准库提供的 `assert!` 宏在你想要确保测试中某个条件求值为 `true` 时非常有用。我们给 `assert!` 宏传递一个求值为布尔值的参数。如果值为 `true`，则什么也不会发生，测试通过。如果值为 `false`，`assert!` 宏会调用 `panic!` 导致测试失败。使用 `assert!` 宏可以帮助我们检查代码是否按预期方式运行。

在第五章的 Listing 5-15 中，我们使用了 `Rectangle` 结构体和 `can_hold` 方法，这里在 Listing 11-5 中再次列出。让我们把这段代码放在 _src/lib.rs_ 文件中，然后使用 `assert!` 宏为它编写一些测试。

<Listing number="11-5" file-name="src/lib.rs" caption="第五章中的 `Rectangle` 结构体及其 `can_hold` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-05/src/lib.rs}}
```

</Listing>

`can_hold` 方法返回一个布尔值，这意味着它是 `assert!` 宏的完美用例。在 Listing 11-6 中，我们编写了一个测试来验证 `can_hold` 方法：创建一个宽度为 8、高度为 7 的 `Rectangle` 实例，并断言它可以容纳另一个宽度为 5、高度为 1 的 `Rectangle` 实例。

<Listing number="11-6" file-name="src/lib.rs" caption="一个测试 `can_hold` 的用例，检查较大的矩形确实能容纳较小的矩形">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-06/src/lib.rs:here}}
```

</Listing>

注意 `tests` 模块内的 `use super::*;` 这一行。`tests` 模块是一个遵循常规可见性规则的普通模块，我们在第七章的["引用模块项目树中项的路径"][paths-for-referring-to-an-item-in-the-module-tree]<!-- ignore -->部分介绍过这些规则。因为 `tests` 模块是一个内部模块，我们需要将外部模块中被测试的代码引入内部模块的作用域。这里我们使用了 glob，因此外部模块中定义的所有内容都可以在这个 `tests` 模块中使用。

我们将测试命名为 `larger_can_hold_smaller`，并创建了所需的两个 `Rectangle` 实例。然后，我们调用了 `assert!` 宏，并将 `larger.can_hold(&smaller)` 的调用结果传递给它。这个表达式应该返回 `true`，所以我们的测试应该通过。让我们来验证一下！

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-06/output.txt}}
```

确实通过了！让我们再添加一个测试，这次断言较小的矩形不能容纳较大的矩形：

<span class="filename">文件名：src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-02-adding-another-rectangle-test/src/lib.rs:here}}
```

因为在这种情况下 `can_hold` 函数的正确结果是 `false`，我们需要在将结果传递给 `assert!` 宏之前对其取反。这样，如果 `can_hold` 返回 `false`，我们的测试就会通过：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-02-adding-another-rectangle-test/output.txt}}
```

两个测试都通过了！现在让我们看看在代码中引入一个 bug 时测试结果会怎样。我们将 `can_hold` 方法的实现中比较宽度时的大于号（`>`）替换为小于号（`<`）：

```rust,not_desired_behavior,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-03-introducing-a-bug/src/lib.rs:here}}
```

现在运行测试会产生以下结果：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-03-introducing-a-bug/output.txt}}
```

我们的测试捕获了这个 bug！因为 `larger.width` 是 `8` 而 `smaller.width` 是 `5`，`can_hold` 中的宽度比较现在返回 `false`：8 并不小于 5。

<!-- Old headings. Do not remove or links may break. -->

<a id="testing-equality-with-the-assert_eq-and-assert_ne-macros"></a>

### 使用 `assert_eq!` 和 `assert_ne!` 测试相等性

验证功能的一种常见方式是测试被测代码的结果与你期望的返回值是否相等。你可以通过使用 `assert!` 宏并传递一个使用 `==` 运算符的表达式来实现。不过，这种测试非常常见，标准库提供了一对宏——`assert_eq!` 和 `assert_ne!`——来更方便地执行这种测试。这两个宏分别比较两个参数是否相等或不等。如果断言失败，它们还会打印出两个值，这使得更容易看出测试**为什么**失败；相反，`assert!` 宏只能表明它从 `==` 表达式中得到了一个 `false` 值，而不会打印出导致 `false` 值的具体数据。

在 Listing 11-7 中，我们编写了一个名为 `add_two` 的函数，它将参数加 `2`，然后使用 `assert_eq!` 宏来测试这个函数。

<Listing number="11-7" file-name="src/lib.rs" caption="使用 `assert_eq!` 宏测试函数 `add_two`">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-07/src/lib.rs}}
```

</Listing>

让我们检查一下它是否通过！

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-07/output.txt}}
```

我们创建了一个名为 `result` 的变量，保存调用 `add_two(2)` 的结果。然后，我们将 `result` 和 `4` 作为参数传递给 `assert_eq!` 宏。这个测试的输出行是 `test tests::it_adds_two ... ok`，`ok` 文本表明我们的测试通过了！

让我们在代码中引入一个 bug，看看 `assert_eq!` 失败时是什么样子。将 `add_two` 函数的实现改为加 `3`：

```rust,not_desired_behavior,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-04-bug-in-add-two/src/lib.rs:here}}
```

再次运行测试：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-04-bug-in-add-two/output.txt}}
```

我们的测试捕获了这个 bug！`tests::it_adds_two` 测试失败了，消息告诉我们失败的断言是 `left == right`，以及 `left` 和 `right` 的值分别是什么。这条消息帮助我们开始调试：`left` 参数（即调用 `add_two(2)` 的结果）是 `5`，而 `right` 参数是 `4`。可以想象，当有大量测试在运行时，这会特别有帮助。

注意，在某些语言和测试框架中，相等断言函数的参数被称为 `expected` 和 `actual`，并且指定参数的顺序很重要。然而在 Rust 中，它们被称为 `left` 和 `right`，我们指定期望值和代码产生的值的顺序并不重要。我们可以将这个测试中的断言写成 `assert_eq!(4, result)`，这会产生相同的失败消息，显示 `` assertion `left == right` failed ``。

`assert_ne!` 宏在我们给它的两个值不相等时通过，相等时失败。这个宏在我们不确定一个值**会**是什么，但知道它绝对**不应该**是什么的情况下最为有用。例如，如果我们正在测试一个保证会以某种方式改变其输入的函数，但输入被改变的方式取决于我们运行测试的星期几，那么最好的断言可能是函数的输出不等于输入。

在底层，`assert_eq!` 和 `assert_ne!` 宏分别使用 `==` 和 `!=` 运算符。当断言失败时，这些宏会使用调试格式打印它们的参数，这意味着被比较的值必须实现 `PartialEq` 和 `Debug` trait。所有基本类型和大部分标准库类型都实现了这些 trait。对于你自己定义的结构体和枚举，你需要实现 `PartialEq` 来断言这些类型的相等性。你还需要实现 `Debug` 以便在断言失败时打印值。因为这两个 trait 都是可派生的 trait，如第五章 Listing 5-12 中所述，通常只需在结构体或枚举定义上添加 `#[derive(PartialEq, Debug)]` 标注即可。有关这些和其他可派生 trait 的更多详情，请参阅附录 C ["可派生的 trait"][derivable-traits]<!-- ignore -->。

### 添加自定义失败消息

你还可以向 `assert!`、`assert_eq!` 和 `assert_ne!` 宏添加自定义消息，作为可选参数与失败消息一起打印。在必需参数之后指定的任何参数都会传递给 `format!` 宏（在第八章的["使用 `+` 运算符或 `format!` 宏拼接字符串"][concatenating]<!-- ignore -->部分讨论过），因此你可以传递一个包含 `{}` 占位符的格式字符串以及要填入这些占位符的值。自定义消息对于记录断言的含义很有用；当测试失败时，你就能更好地了解代码出了什么问题。

例如，假设我们有一个按名字问候人的函数，我们想测试传入函数的名字是否出现在输出中：

<span class="filename">文件名：src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-05-greeter/src/lib.rs}}
```

这个程序的需求尚未确定，而且我们很确定问候语开头的 `Hello` 文本会改变。我们决定不想在需求变更时还要更新测试，所以我们不检查与 `greeting` 函数返回值的精确相等性，而只是断言输出包含输入参数的文本。

现在让我们通过将 `greeting` 改为不包含 `name` 来引入一个 bug，看看默认的测试失败是什么样子：

```rust,not_desired_behavior,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-06-greeter-with-bug/src/lib.rs:here}}
```

运行这个测试会产生以下结果：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-06-greeter-with-bug/output.txt}}
```

这个结果只是表明断言失败了以及断言所在的行号。一个更有用的失败消息应该打印出 `greeting` 函数的返回值。让我们添加一个自定义失败消息，由一个格式字符串和从 `greeting` 函数获得的实际值组成的占位符构成：

```rust,ignore
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-07-custom-failure-message/src/lib.rs:here}}
```

现在当我们运行测试时，会得到一条更有信息量的错误消息：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-07-custom-failure-message/output.txt}}
```

我们可以在测试输出中看到实际得到的值，这有助于我们调试实际发生了什么，而不是我们期望发生什么。

### 使用 `should_panic` 检查 panic

除了检查返回值之外，检查我们的代码是否按预期处理错误条件也很重要。例如，考虑我们在第九章 Listing 9-13 中创建的 `Guess` 类型。使用 `Guess` 的其他代码依赖于 `Guess` 实例只包含 1 到 100 之间的值这一保证。我们可以编写一个测试来确保尝试创建超出该范围的值的 `Guess` 实例会 panic。

我们通过在测试函数上添加 `should_panic` 属性来实现这一点。如果函数内的代码 panic 了，测试就通过；如果函数内的代码没有 panic，测试就失败。

Listing 11-8 展示了一个测试，检查 `Guess::new` 的错误条件是否在我们预期时发生。

<Listing number="11-8" file-name="src/lib.rs" caption="测试某个条件会导致 `panic!`">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-08/src/lib.rs}}
```

</Listing>

我们将 `#[should_panic]` 属性放在 `#[test]` 属性之后、它所应用的测试函数之前。让我们看看这个测试通过时的结果：

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-08/output.txt}}
```

看起来不错！现在让我们通过移除 `new` 函数中值大于 100 时 panic 的条件来引入一个 bug：

```rust,not_desired_behavior,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-08-guess-with-bug/src/lib.rs:here}}
```

当我们运行 Listing 11-8 中的测试时，它会失败：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-08-guess-with-bug/output.txt}}
```

在这种情况下我们没有得到非常有用的消息，但当我们查看测试函数时，可以看到它标注了 `#[should_panic]`。我们得到的失败意味着测试函数中的代码没有引发 panic。

使用 `should_panic` 的测试可能不够精确。即使测试因为与我们预期不同的原因而 panic，`should_panic` 测试也会通过。为了使 `should_panic` 测试更精确，我们可以给 `should_panic` 属性添加一个可选的 `expected` 参数。测试工具会确保失败消息中包含所提供的文本。例如，考虑 Listing 11-9 中修改后的 `Guess` 代码，其中 `new` 函数根据值是太小还是太大而使用不同的消息来 panic。

<Listing number="11-9" file-name="src/lib.rs" caption="测试 `panic!` 时 panic 消息包含指定子字符串">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-09/src/lib.rs:here}}
```

</Listing>

这个测试会通过，因为我们放在 `should_panic` 属性的 `expected` 参数中的值是 `Guess::new` 函数 panic 消息的子字符串。我们也可以指定完整的预期 panic 消息，在这个例子中就是 `Guess value must be less than or equal to 100, got 200`。你选择指定多少内容取决于 panic 消息中有多少是唯一的或动态的，以及你希望测试有多精确。在这个例子中，panic 消息的一个子字符串就足以确保测试函数中的代码执行了 `else if value > 100` 分支。

为了看看带有 `expected` 消息的 `should_panic` 测试失败时会怎样，让我们再次通过交换 `if value < 1` 和 `else if value > 100` 代码块的主体来引入一个 bug：

```rust,ignore,not_desired_behavior
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-09-guess-with-panic-msg-bug/src/lib.rs:here}}
```

这次运行 `should_panic` 测试时，它会失败：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-09-guess-with-panic-msg-bug/output.txt}}
```

失败消息表明这个测试确实如我们预期的那样 panic 了，但 panic 消息中没有包含预期的字符串 `less than or equal to 100`。我们实际得到的 panic 消息是 `Guess value must be greater than or equal to 1, got 200`。这样我们就可以开始找出 bug 在哪里了！

### 在测试中使用 `Result<T, E>`

到目前为止，我们所有的测试在失败时都会 panic。我们也可以编写使用 `Result<T, E>` 的测试！下面是 Listing 11-1 中的测试，改写为使用 `Result<T, E>` 并返回 `Err` 而不是 panic：

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-10-result-in-tests/src/lib.rs:here}}
```

`it_works` 函数现在的返回类型是 `Result<(), String>`。在函数体中，我们不再调用 `assert_eq!` 宏，而是在测试通过时返回 `Ok(())`，在测试失败时返回一个包含 `String` 的 `Err`。

编写返回 `Result<T, E>` 的测试使你能够在测试体中使用问号运算符，这为编写在内部任何操作返回 `Err` 变体时应该失败的测试提供了一种便捷的方式。

你不能在使用 `Result<T, E>` 的测试上使用 `#[should_panic]` 标注。要断言一个操作返回 `Err` 变体，**不要**对 `Result<T, E>` 值使用问号运算符。而应该使用 `assert!(value.is_err())`。

现在你已经了解了几种编写测试的方式，让我们来看看运行测试时发生了什么，以及可以与 `cargo test` 一起使用的不同选项。

[concatenating]: ch08-02-strings.html#concatenating-with--or-format
[bench]: ../unstable-book/library-features/test.html
[ignoring]: ch11-02-running-tests.html#ignoring-tests-unless-specifically-requested
[subset]: ch11-02-running-tests.html#running-a-subset-of-tests-by-name
[controlling-how-tests-are-run]: ch11-02-running-tests.html#controlling-how-tests-are-run
[derivable-traits]: appendix-03-derivable-traits.html
[doc-comments]: ch14-02-publishing-to-crates-io.html#documentation-comments-as-tests
[paths-for-referring-to-an-item-in-the-module-tree]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
