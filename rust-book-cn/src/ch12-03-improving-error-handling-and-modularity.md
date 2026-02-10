## 重构以改进模块化和错误处理

为了改进我们的程序，我们将修复四个与程序结构及其处理潜在错误方式相关的问题。首先，我们的 `main` 函数现在执行两个任务：解析参数和读取文件。随着程序的增长，`main` 函数处理的独立任务数量也会增加。当一个函数承担的职责越来越多时，它就越难以理解、越难以测试，也越难在不破坏其某个部分的情况下进行修改。最好将功能分离开来，使每个函数只负责一个任务。

这个问题也与第二个问题相关：虽然 `query` 和 `file_path` 是程序的配置变量，但像 `contents` 这样的变量是用来执行程序逻辑的。`main` 函数越长，我们需要引入作用域的变量就越多；作用域中的变量越多，就越难追踪每个变量的用途。最好将配置变量组合到一个结构体中，以明确它们的用途。

第三个问题是，我们使用 `expect` 在读取文件失败时打印错误信息，但错误信息只是打印了 `Should have been able to read the file`。读取文件可能因多种原因失败：例如，文件可能不存在，或者我们可能没有权限打开它。目前，无论什么情况，我们都会打印相同的错误信息，这不会给用户提供任何有用的信息！

第四，我们使用 `expect` 来处理错误，如果用户在运行程序时没有指定足够的参数，他们会从 Rust 得到一个 `index out of bounds` 错误，这并不能清楚地解释问题所在。最好将所有错误处理代码放在一个地方，这样未来的维护者只需要在一个地方查看代码，就能了解错误处理逻辑是否需要修改。将所有错误处理代码放在一个地方还能确保我们打印的信息对最终用户是有意义的。

让我们通过重构项目来解决这四个问题。

<!-- Old headings. Do not remove or links may break. -->

<a id="separation-of-concerns-for-binary-projects"></a>

### 分离二进制项目的关注点

将多个任务的职责分配给 `main` 函数，这个组织问题在许多二进制项目中都很常见。因此，许多 Rust 程序员发现，当 `main` 函数开始变得庞大时，将二进制程序的不同关注点分离开来是很有用的。这个过程包含以下步骤：

- 将程序拆分为 _main.rs_ 文件和 _lib.rs_ 文件，并将程序的逻辑移到 _lib.rs_ 中。
- 只要命令行解析逻辑较小，它就可以留在 `main` 函数中。
- 当命令行解析逻辑开始变得复杂时，将其从 `main` 函数中提取到其他函数或类型中。

经过这个过程后，留在 `main` 函数中的职责应该限于以下几项：

- 使用参数值调用命令行解析逻辑
- 设置任何其他配置
- 调用 _lib.rs_ 中的 `run` 函数
- 如果 `run` 返回错误，则处理该错误

这个模式的核心是关注点分离：_main.rs_ 负责运行程序，而 _lib.rs_ 负责处理手头任务的所有逻辑。因为你无法直接测试 `main` 函数，所以这种结构让你可以通过将所有程序逻辑移出 `main` 函数来进行测试。留在 `main` 函数中的代码将足够小，可以通过阅读来验证其正确性。让我们按照这个过程来重构我们的程序。

#### 提取参数解析器

我们将把解析参数的功能提取到一个函数中，`main` 将调用这个函数。示例 12-5 展示了 `main` 函数的新开头，它调用了一个新函数 `parse_config`，我们将在 _src/main.rs_ 中定义这个函数。

<Listing number="12-5" file-name="src/main.rs" caption="从 `main` 中提取 `parse_config` 函数">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-05/src/main.rs:here}}
```

</Listing>

我们仍然将命令行参数收集到一个向量中，但不再在 `main` 函数中将索引 1 处的参数值赋给变量 `query`、将索引 2 处的参数值赋给变量 `file_path`，而是将整个向量传递给 `parse_config` 函数。`parse_config` 函数随后包含了确定哪个参数对应哪个变量的逻辑，并将值传回 `main`。我们仍然在 `main` 中创建 `query` 和 `file_path` 变量，但 `main` 不再负责确定命令行参数和变量之间的对应关系。

对于我们这个小程序来说，这次重构可能看起来有些过度，但我们是在以小而渐进的步骤进行重构。做完这个改动后，再次运行程序以验证参数解析仍然正常工作。经常检查进度是个好习惯，这有助于在问题出现时找到原因。

#### 组合配置值

我们可以再迈出一小步来进一步改进 `parse_config` 函数。目前，我们返回的是一个元组，但随后又立即将元组拆分为单独的部分。这表明我们可能还没有找到正确的抽象。

另一个表明还有改进空间的迹象是 `parse_config` 中的 `config` 部分，它暗示我们返回的两个值是相关的，并且都是一个配置值的组成部分。目前我们除了将两个值组合成元组之外，并没有在数据结构中传达这层含义；我们将改为把两个值放入一个结构体中，并给每个结构体字段一个有意义的名称。这样做将使未来的代码维护者更容易理解不同值之间的关系以及它们的用途。

示例 12-6 展示了对 `parse_config` 函数的改进。

<Listing number="12-6" file-name="src/main.rs" caption="重构 `parse_config` 以返回 `Config` 结构体的实例">

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-06/src/main.rs:here}}
```

</Listing>

我们新增了一个名为 `Config` 的结构体，定义了 `query` 和 `file_path` 两个字段。`parse_config` 的签名现在表明它返回一个 `Config` 值。在 `parse_config` 的函数体中，我们之前返回的是引用 `args` 中 `String` 值的字符串切片，现在我们将 `Config` 定义为包含拥有所有权的 `String` 值。`main` 中的 `args` 变量是参数值的所有者，只是让 `parse_config` 函数借用它们，这意味着如果 `Config` 试图获取 `args` 中值的所有权，就会违反 Rust 的借用规则。

管理 `String` 数据有多种方式；最简单的（虽然有些低效）方法是对值调用 `clone` 方法。这会为 `Config` 实例创建数据的完整副本以供其拥有，这比存储字符串数据的引用需要更多的时间和内存。然而，克隆数据也使我们的代码非常直观，因为我们不必管理引用的生命周期（lifetime）；在这种情况下，牺牲一点性能来换取简洁性是值得的。

> ### 使用 `clone` 的权衡
>
> 许多 Rustacean 倾向于避免使用 `clone` 来解决所有权问题，因为它有运行时开销。在[第 13 章][ch13]<!-- ignore -->中，你将学习如何在这类情况下使用更高效的方法。但现在，复制几个字符串来继续推进是没问题的，因为你只会复制一次，而且文件路径和查询字符串都非常小。拥有一个稍微低效但能工作的程序，比在第一次编写时就试图过度优化代码要好。随着你对 Rust 越来越有经验，从最高效的方案开始会变得更容易，但现在调用 `clone` 是完全可以接受的。

我们更新了 `main`，将 `parse_config` 返回的 `Config` 实例放入名为 `config` 的变量中，并更新了之前使用单独的 `query` 和 `file_path` 变量的代码，改为使用 `Config` 结构体上的字段。

现在我们的代码更清楚地表达了 `query` 和 `file_path` 是相关的，它们的用途是配置程序的工作方式。任何使用这些值的代码都知道在 `config` 实例中以其用途命名的字段中找到它们。

#### 为 `Config` 创建构造函数

到目前为止，我们已经将负责解析命令行参数的逻辑从 `main` 中提取出来，放到了 `parse_config` 函数中。这样做帮助我们看到 `query` 和 `file_path` 值是相关的，这种关系应该在代码中体现出来。然后我们添加了一个 `Config` 结构体来命名 `query` 和 `file_path` 的相关用途，并能够从 `parse_config` 函数中以结构体字段名的形式返回这些值的名称。

那么，既然 `parse_config` 函数的目的是创建一个 `Config` 实例，我们可以将 `parse_config` 从一个普通函数改为与 `Config` 结构体关联的名为 `new` 的函数。这个改动将使代码更加地道。我们可以通过调用 `String::new` 来创建标准库中类型的实例，如 `String`。类似地，通过将 `parse_config` 改为与 `Config` 关联的 `new` 函数，我们就能通过调用 `Config::new` 来创建 `Config` 的实例。示例 12-7 展示了我们需要做的改动。

<Listing number="12-7" file-name="src/main.rs" caption="将 `parse_config` 改为 `Config::new`">

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-07/src/main.rs:here}}
```

</Listing>

我们更新了 `main`，将之前调用 `parse_config` 的地方改为调用 `Config::new`。我们将 `parse_config` 的名称改为 `new`，并将其移到一个 `impl` 块中，这样就将 `new` 函数与 `Config` 关联起来了。再次尝试编译这段代码，确保它能正常工作。

### 修复错误处理

现在我们来修复错误处理。回忆一下，如果向量包含的元素少于三个，尝试访问 `args` 向量中索引 1 或索引 2 处的值会导致程序 panic。试着不带任何参数运行程序；输出将如下所示：

```console
{{#include ../listings/ch12-an-io-project/listing-12-07/output.txt}}
```

`index out of bounds: the len is 1 but the index is 1` 这行是给程序员看的错误信息。它无法帮助最终用户理解他们应该怎么做。让我们现在来修复这个问题。

#### 改进错误信息

在示例 12-8 中，我们在 `new` 函数中添加了一个检查，在访问索引 1 和索引 2 之前验证切片是否足够长。如果切片不够长，程序会 panic 并显示一条更好的错误信息。

<Listing number="12-8" file-name="src/main.rs" caption="添加对参数数量的检查">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-08/src/main.rs:here}}
```

</Listing>

这段代码类似于[我们在示例 9-13 中编写的 `Guess::new` 函数][ch9-custom-types]<!-- ignore -->，在那里当 `value` 参数超出有效值范围时我们调用了 `panic!`。这里我们不是检查值的范围，而是检查 `args` 的长度是否至少为 `3`，函数的其余部分可以在假设这个条件已满足的情况下运行。如果 `args` 的元素少于三个，这个条件就为 `true`，我们就调用 `panic!` 宏立即终止程序。

有了 `new` 中这几行额外的代码，让我们再次不带任何参数运行程序，看看现在的错误是什么样的：

```console
{{#include ../listings/ch12-an-io-project/listing-12-08/output.txt}}
```

这个输出好多了：我们现在有了一条合理的错误信息。然而，我们也有一些不想展示给用户的多余信息。也许我们在示例 9-13 中使用的技术并不是这里最好的选择：调用 `panic!` 更适合编程问题而非使用问题，[正如第 9 章中讨论的那样][ch9-error-guidelines]<!-- ignore -->。相反，我们将使用你在第 9 章中学到的另一种技术——[返回一个 `Result`][ch9-result]<!-- ignore -->来表示成功或错误。

<!-- Old headings. Do not remove or links may break. -->

<a id="returning-a-result-from-new-instead-of-calling-panic"></a>

#### 返回 `Result` 而不是调用 `panic!`

我们可以改为返回一个 `Result` 值，在成功时包含一个 `Config` 实例，在错误时描述问题。我们还将把函数名从 `new` 改为 `build`，因为许多程序员期望 `new` 函数永远不会失败。当 `Config::build` 与 `main` 通信时，我们可以使用 `Result` 类型来表示出现了问题。然后，我们可以修改 `main`，将 `Err` 变体转换为对用户更实用的错误信息，而不会出现调用 `panic!` 时产生的关于 `thread 'main'` 和 `RUST_BACKTRACE` 的周围文本。

示例 12-9 展示了我们需要对现在称为 `Config::build` 的函数的返回值和函数体所做的改动。注意，在我们同时更新 `main` 之前，这段代码还无法编译，我们将在下一个示例中更新 `main`。

<Listing number="12-9" file-name="src/main.rs" caption="从 `Config::build` 返回 `Result`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-09/src/main.rs:here}}
```

</Listing>

我们的 `build` 函数在成功时返回一个包含 `Config` 实例的 `Result`，在错误时返回一个字符串字面值。我们的错误值始终是具有 `'static` 生命周期的字符串字面值。

我们在函数体中做了两处改动：当用户没有传递足够的参数时，我们不再调用 `panic!`，而是返回一个 `Err` 值，并且我们将 `Config` 返回值包装在了 `Ok` 中。这些改动使函数符合其新的类型签名。

从 `Config::build` 返回 `Err` 值允许 `main` 函数处理 `build` 函数返回的 `Result` 值，并在错误情况下更干净地退出进程。

<!-- Old headings. Do not remove or links may break. -->

<a id="calling-confignew-and-handling-errors"></a>

#### 调用 `Config::build` 并处理错误

为了处理错误情况并打印用户友好的信息，我们需要更新 `main` 来处理 `Config::build` 返回的 `Result`，如示例 12-10 所示。我们还将承担起用非零错误码退出命令行工具的责任，不再依赖 `panic!`，而是手动实现。非零退出状态是一种约定，用于向调用我们程序的进程发出信号，表明程序以错误状态退出。

<Listing number="12-10" file-name="src/main.rs" caption="如果构建 `Config` 失败则以错误码退出">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-10/src/main.rs:here}}
```

</Listing>

在这个示例中，我们使用了一个尚未详细介绍的方法：`unwrap_or_else`，它由标准库定义在 `Result<T, E>` 上。使用 `unwrap_or_else` 允许我们定义一些自定义的、非 `panic!` 的错误处理。如果 `Result` 是 `Ok` 值，这个方法的行为类似于 `unwrap`：它返回 `Ok` 包装的内部值。然而，如果值是 `Err`，这个方法会调用闭包（closure）中的代码，闭包是我们定义并作为参数传递给 `unwrap_or_else` 的匿名函数。我们将在[第 13 章][ch13]<!-- ignore -->中更详细地介绍闭包。现在，你只需要知道 `unwrap_or_else` 会将 `Err` 的内部值——在本例中是我们在示例 12-9 中添加的静态字符串 `"not enough arguments"`——传递给闭包中出现在竖线之间的参数 `err`。闭包中的代码随后可以在运行时使用 `err` 值。

我们新增了一行 `use` 来将标准库中的 `process` 引入作用域。在错误情况下运行的闭包代码只有两行：我们打印 `err` 值，然后调用 `process::exit`。`process::exit` 函数会立即停止程序，并将传入的数字作为退出状态码返回。这类似于我们在示例 12-8 中使用的基于 `panic!` 的处理方式，但我们不再得到所有那些额外的输出。让我们试试：

```console
{{#include ../listings/ch12-an-io-project/listing-12-10/output.txt}}
```

这个输出对我们的用户来说友好多了。

<!-- Old headings. Do not remove or links may break. -->

<a id="extracting-logic-from-the-main-function"></a>

### 从 `main` 中提取逻辑

现在我们已经完成了配置解析的重构，让我们转向程序的逻辑。正如我们在["分离二进制项目的关注点"](#separation-of-concerns-for-binary-projects)<!-- ignore -->中所述，我们将提取一个名为 `run` 的函数，它将包含当前 `main` 函数中与设置配置或处理错误无关的所有逻辑。完成后，`main` 函数将变得简洁，易于通过检查来验证，并且我们将能够为所有其他逻辑编写测试。

示例 12-11 展示了提取 `run` 函数这一小而渐进的改进。

<Listing number="12-11" file-name="src/main.rs" caption="提取包含其余程序逻辑的 `run` 函数">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-11/src/main.rs:here}}
```

</Listing>

`run` 函数现在包含了 `main` 中从读取文件开始的所有剩余逻辑。`run` 函数接受 `Config` 实例作为参数。

<!-- Old headings. Do not remove or links may break. -->

<a id="returning-errors-from-the-run-function"></a>

#### 从 `run` 返回错误

将剩余的程序逻辑分离到 `run` 函数中之后，我们可以像在示例 12-9 中对 `Config::build` 所做的那样改进错误处理。`run` 函数将在出错时返回 `Result<T, E>`，而不是通过调用 `expect` 让程序 panic。这将让我们进一步把错误处理逻辑整合到 `main` 中，以用户友好的方式处理。示例 12-12 展示了我们需要对 `run` 的签名和函数体所做的改动。

<Listing number="12-12" file-name="src/main.rs" caption="修改 `run` 函数以返回 `Result`">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-12/src/main.rs:here}}
```

</Listing>

我们在这里做了三个重要的改动。首先，我们将 `run` 函数的返回类型改为 `Result<(), Box<dyn Error>>`。这个函数之前返回单元类型 `()`，我们在 `Ok` 的情况下仍然保留它作为返回值。

对于错误类型，我们使用了 trait 对象 `Box<dyn Error>`（并且在顶部通过 `use` 语句将 `std::error::Error` 引入了作用域）。我们将在[第 18 章][ch18]<!-- ignore -->中介绍 trait 对象。现在，只需要知道 `Box<dyn Error>` 意味着函数将返回一个实现了 `Error` trait 的类型，但我们不必指定返回值的具体类型。这给了我们灵活性，可以在不同的错误情况下返回不同类型的错误值。`dyn` 关键字是 _dynamic_（动态）的缩写。

其次，我们移除了对 `expect` 的调用，转而使用 `?` 运算符，正如我们在[第 9 章][ch9-question-mark]<!-- ignore -->中讨论的那样。`?` 不会在遇到错误时 `panic!`，而是将错误值从当前函数返回给调用者来处理。

第三，`run` 函数现在在成功时返回一个 `Ok` 值。我们在签名中将 `run` 函数的成功类型声明为 `()`，这意味着我们需要将单元类型值包装在 `Ok` 值中。这个 `Ok(())` 语法乍看起来可能有点奇怪。但这样使用 `()` 是惯用的方式，表明我们调用 `run` 只是为了它的副作用；它不会返回我们需要的值。

运行这段代码时，它可以编译但会显示一个警告：

```console
{{#include ../listings/ch12-an-io-project/listing-12-12/output.txt}}
```

Rust 告诉我们，我们的代码忽略了 `Result` 值，而 `Result` 值可能表明发生了错误。但我们没有检查是否有错误，编译器提醒我们这里可能应该有一些错误处理代码！让我们现在来纠正这个问题。

#### 在 `main` 中处理 `run` 返回的错误

我们将使用类似于示例 12-10 中处理 `Config::build` 的技术来检查和处理错误，但有一点不同：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/no-listing-01-handling-errors-in-main/src/main.rs:here}}
```

我们使用 `if let` 而不是 `unwrap_or_else` 来检查 `run` 是否返回了 `Err` 值，并在返回时调用 `process::exit(1)`。`run` 函数不会像 `Config::build` 返回 `Config` 实例那样返回一个我们想要 `unwrap` 的值。因为 `run` 在成功时返回 `()`，我们只关心检测错误，所以不需要 `unwrap_or_else` 来返回解包后的值，那只会是 `()`。

`if let` 和 `unwrap_or_else` 函数的函数体在两种情况下是相同的：我们打印错误并退出。

### 将代码拆分为库 Crate

我们的 `minigrep` 项目目前看起来不错！现在我们将拆分 _src/main.rs_ 文件，把一些代码放入 _src/lib.rs_ 文件中。这样，我们就可以测试代码，并且让 _src/main.rs_ 文件承担更少的职责。

让我们将负责搜索文本的代码定义在 _src/lib.rs_ 中而不是 _src/main.rs_ 中，这样我们（或任何使用我们 `minigrep` 库的人）就可以在比 `minigrep` 二进制程序更多的上下文中调用搜索函数。

首先，让我们在 _src/lib.rs_ 中定义 `search` 函数的签名，如示例 12-13 所示，函数体调用 `unimplemented!` 宏。我们将在填充实现时更详细地解释签名。

<Listing number="12-13" file-name="src/lib.rs" caption="在 *src/lib.rs* 中定义 `search` 函数">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-13/src/lib.rs}}
```

</Listing>

我们在函数定义上使用了 `pub` 关键字，将 `search` 指定为库 crate 公共 API 的一部分。现在我们有了一个可以从二进制 crate 中使用并且可以测试的库 crate！

现在我们需要将 _src/lib.rs_ 中定义的代码引入二进制 crate _src/main.rs_ 的作用域并调用它，如示例 12-14 所示。

<Listing number="12-14" file-name="src/main.rs" caption="在 *src/main.rs* 中使用 `minigrep` 库 crate 的 `search` 函数">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-14/src/main.rs:here}}
```

</Listing>

我们添加了一行 `use minigrep::search` 来将 `search` 函数从库 crate 引入二进制 crate 的作用域。然后，在 `run` 函数中，我们不再打印文件内容，而是调用 `search` 函数并将 `config.query` 值和 `contents` 作为参数传递。接着，`run` 使用 `for` 循环打印 `search` 返回的每一行匹配结果。这也是一个好时机来移除 `main` 函数中显示查询字符串和文件路径的 `println!` 调用，这样我们的程序就只打印搜索结果（如果没有错误发生的话）。

注意，搜索函数会将所有结果收集到一个向量中并返回，然后才进行打印。在搜索大文件时，这种实现可能会导致结果显示较慢，因为结果不是在找到时就打印的；我们将在第 13 章中讨论使用迭代器（iterator）来解决这个问题的可能方式。

呼！这是一项大工程，但我们为未来的成功奠定了基础。现在处理错误要容易得多，而且我们使代码更加模块化了。从现在开始，几乎所有的工作都将在 _src/lib.rs_ 中完成。

让我们利用这种新获得的模块化优势，做一些用旧代码很难做到但用新代码很容易做到的事情：我们来编写一些测试！

[ch13]: ch13-00-functional-features.html
[ch9-custom-types]: ch09-03-to-panic-or-not-to-panic.html#creating-custom-types-for-validation
[ch9-error-guidelines]: ch09-03-to-panic-or-not-to-panic.html#guidelines-for-error-handling
[ch9-result]: ch09-02-recoverable-errors-with-result.html
[ch18]: ch18-00-oop.html
[ch9-question-mark]: ch09-02-recoverable-errors-with-result.html#a-shortcut-for-propagating-errors-the--operator