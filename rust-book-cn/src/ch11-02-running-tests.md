## 控制测试的运行方式

就像 `cargo run` 会编译代码并运行生成的二进制文件一样，`cargo test` 会在测试模式下编译代码并运行生成的测试二进制文件。`cargo test` 生成的二进制文件默认会并行运行所有测试，并捕获测试运行期间产生的输出，阻止输出内容的显示，从而使与测试结果相关的输出更容易阅读。不过，你可以通过指定命令行选项来改变这些默认行为。

有些命令行选项传递给 `cargo test`，有些则传递给生成的测试二进制文件。为了区分这两类参数，你需要先列出传递给 `cargo test` 的参数，接着是分隔符 `--`，然后是传递给测试二进制文件的参数。运行 `cargo test --help` 会显示可用于 `cargo test` 的选项，而运行 `cargo test -- --help` 会显示可用在分隔符之后的选项。这些选项也记录在 [`rustc` 手册的"Tests"部分][tests]中。

[tests]: https://doc.rust-lang.org/rustc/tests/index.html

### 并行或串行运行测试

当你运行多个测试时，默认情况下它们会使用线程并行运行，这意味着测试能更快完成，你也能更快得到反馈。由于测试是同时运行的，你必须确保测试之间不会相互依赖，也不依赖任何共享状态，包括共享的环境，比如当前工作目录或环境变量。

举个例子，假设你的每个测试都运行一些代码，在磁盘上创建一个名为 *test-output.txt* 的文件并向其中写入一些数据。然后每个测试读取该文件中的数据，并断言文件包含某个特定值，而这个值在每个测试中都不同。由于测试是同时运行的，一个测试可能会在另一个测试写入和读取文件之间覆盖该文件。第二个测试就会失败，不是因为代码有误，而是因为测试在并行运行时相互干扰了。一种解决方案是让每个测试写入不同的文件；另一种解决方案是一次只运行一个测试。

如果你不想并行运行测试，或者想更精细地控制使用的线程数量，可以向测试二进制文件传递 `--test-threads` 标志和你想使用的线程数。请看下面的例子：

```console
$ cargo test -- --test-threads=1
```

我们将测试线程数设置为 `1`，告诉程序不要使用任何并行机制。使用单线程运行测试会比并行运行花费更长时间，但如果测试之间共享状态，它们就不会相互干扰了。

### 显示函数输出

默认情况下，如果测试通过，Rust 的测试库会捕获所有打印到标准输出的内容。例如，如果我们在测试中调用了 `println!` 且测试通过了，我们不会在终端中看到 `println!` 的输出；我们只会看到表示测试通过的那一行。如果测试失败了，我们则会看到打印到标准输出的所有内容，以及其余的失败信息。

举个例子，示例 11-10 中有一个简单的函数，它打印其参数的值并返回 10，还有一个会通过的测试和一个会失败的测试。

<Listing number="11-10" file-name="src/lib.rs" caption="测试一个调用了 `println!` 的函数">

```rust,panics,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-10/src/lib.rs}}
```

</Listing>

当我们使用 `cargo test` 运行这些测试时，会看到如下输出：

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-10/output.txt}}
```

注意，在这个输出中我们没有看到 `I got the value 4`，这是通过的测试运行时打印的内容。该输出已被捕获。而失败的测试输出的 `I got the value 8` 则出现在测试摘要输出部分，同时还显示了测试失败的原因。

如果我们也想看到通过的测试的打印值，可以使用 `--show-output` 告诉 Rust 同时显示成功测试的输出：

```console
$ cargo test -- --show-output
```

当我们使用 `--show-output` 标志再次运行示例 11-10 中的测试时，会看到如下输出：

```console
{{#include ../listings/ch11-writing-automated-tests/output-only-01-show-output/output.txt}}
```

### 通过名称运行部分测试

有时运行完整的测试套件会花费很长时间。如果你正在开发某个特定区域的代码，你可能只想运行与该代码相关的测试。你可以通过将想要运行的测试名称作为参数传递给 `cargo test` 来选择运行哪些测试。

为了演示如何运行部分测试，我们先为 `add_two` 函数创建三个测试，如示例 11-11 所示，然后选择运行其中的部分测试。

<Listing number="11-11" file-name="src/lib.rs" caption="三个不同名称的测试">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-11/src/lib.rs}}
```

</Listing>

如果不传递任何参数直接运行测试，如前所述，所有测试将并行运行：

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-11/output.txt}}
```

#### 运行单个测试

我们可以将任意测试函数的名称传递给 `cargo test` 来只运行该测试：

```console
{{#include ../listings/ch11-writing-automated-tests/output-only-02-single-test/output.txt}}
```

只有名为 `one_hundred` 的测试运行了；其他两个测试的名称不匹配。测试输出在末尾显示了 `2 filtered out`，让我们知道还有更多测试没有运行。

我们不能用这种方式指定多个测试的名称；只有传递给 `cargo test` 的第一个值会被使用。但有另一种方式可以运行多个测试。

#### 通过过滤运行多个测试

我们可以指定测试名称的一部分，任何名称匹配该值的测试都会被运行。例如，因为我们有两个测试的名称包含 `add`，我们可以通过运行 `cargo test add` 来运行这两个测试：

```console
{{#include ../listings/ch11-writing-automated-tests/output-only-03-multiple-tests/output.txt}}
```

这个命令运行了所有名称中包含 `add` 的测试，并过滤掉了名为 `one_hundred` 的测试。还要注意，测试所在的模块也会成为测试名称的一部分，因此我们可以通过按模块名称过滤来运行某个模块中的所有测试。

<!-- Old headings. Do not remove or links may break. -->

<a id="ignoring-some-tests-unless-specifically-requested"></a>

### 除非明确请求否则忽略某些测试

有时一些特定的测试执行起来非常耗时，所以你可能希望在大多数 `cargo test` 运行中排除它们。与其将所有你想运行的测试逐一列为参数，不如使用 `ignore` 属性来标注那些耗时的测试以将其排除，如下所示：

<span class="filename">文件名：src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-11-ignore-a-test/src/lib.rs:here}}
```

在 `#[test]` 之后，我们给想要排除的测试添加了 `#[ignore]` 行。现在当我们运行测试时，`it_works` 会运行，但 `expensive_test` 不会：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-11-ignore-a-test/output.txt}}
```

`expensive_test` 函数被列为 `ignored`。如果我们只想运行被忽略的测试，可以使用 `cargo test -- --ignored`：

```console
{{#include ../listings/ch11-writing-automated-tests/output-only-04-running-ignored/output.txt}}
```

通过控制哪些测试运行，你可以确保 `cargo test` 的结果能快速返回。当你认为有必要检查 `ignored` 测试的结果并且有时间等待结果时，可以改为运行 `cargo test -- --ignored`。如果你想运行所有测试，无论是否被忽略，可以运行 `cargo test -- --include-ignored`。
