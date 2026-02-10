<!-- Old headings. Do not remove or links may break. -->

<a id="writing-error-messages-to-standard-error-instead-of-standard-output"></a>

## 将错误信息重定向到标准错误

目前，我们使用 `println!` 宏将所有输出写入终端。在大多数终端中，有两种输出：_标准输出_（`stdout`）用于一般信息，_标准错误_（`stderr`）用于错误信息。这种区分使得用户可以选择将程序的正常输出重定向到文件，同时仍然将错误信息打印到屏幕上。

`println!` 宏只能打印到标准输出，因此我们需要使用其他方式来打印到标准错误。

### 检查错误信息的输出位置

首先，让我们观察 `minigrep` 打印的内容目前是如何写入标准输出的，包括那些我们希望写入标准错误的错误信息。我们将通过把标准输出流重定向到文件，同时故意触发一个错误来演示这一点。我们不会重定向标准错误流，因此发送到标准错误的内容仍然会显示在屏幕上。

命令行程序应当将错误信息发送到标准错误流，这样即使我们将标准输出流重定向到文件，仍然可以在屏幕上看到错误信息。我们的程序目前的行为并不正确：我们即将看到它把错误信息也保存到了文件中！

为了演示这个行为，我们将使用 `>` 和文件路径 _output.txt_ 来运行程序，将标准输出流重定向到该文件。我们不传递任何参数，这应该会导致一个错误：

```console
$ cargo run > output.txt
```

`>` 语法告诉 shell 将标准输出的内容写入 _output.txt_ 而不是屏幕。我们没有在屏幕上看到预期的错误信息，这意味着它一定被写入了文件。以下是 _output.txt_ 的内容：

```text
Problem parsing arguments: not enough arguments
```

没错，我们的错误信息被打印到了标准输出。像这样的错误信息打印到标准错误会更有用，这样只有成功运行的数据才会写入文件。我们来修改这一点。

### 将错误信息打印到标准错误

我们将使用示例 12-24 中的代码来修改错误信息的打印方式。由于我们在本章前面进行了重构，所有打印错误信息的代码都在 `main` 函数中。标准库提供了 `eprintln!` 宏，它会打印到标准错误流，因此让我们把之前使用 `println!` 打印错误的两处改为使用 `eprintln!`。

<Listing number="12-24" file-name="src/main.rs" caption="使用 `eprintln!` 将错误信息写入标准错误而不是标准输出">

```rust,ignore
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-24/src/main.rs:here}}
```

</Listing>

现在让我们以同样的方式再次运行程序，不传递任何参数并使用 `>` 重定向标准输出：

```console
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

现在我们在屏幕上看到了错误信息，而 _output.txt_ 中没有任何内容，这正是我们对命令行程序所期望的行为。

让我们再次运行程序，这次使用不会导致错误的参数，但仍然将标准输出重定向到文件，如下所示：

```console
$ cargo run -- to poem.txt > output.txt
```

我们不会在终端看到任何输出，而 _output.txt_ 将包含我们的结果：

<span class="filename">文件名：output.txt</span>

```text
Are you nobody, too?
How dreary to be somebody!
```

这表明我们现在正确地将正常输出发送到标准输出，将错误输出发送到标准错误。

## 总结

本章回顾了你到目前为止学到的一些主要概念，并介绍了如何在 Rust 中执行常见的 I/O 操作。通过使用命令行参数、文件、环境变量以及用于打印错误的 `eprintln!` 宏，你现在已经准备好编写命令行应用程序了。结合前面章节中的概念，你的代码将会组织良好，能够有效地将数据存储在合适的数据结构中，妥善地处理错误，并且经过充分的测试。

接下来，我们将探索一些受函数式语言影响的 Rust 特性：闭包（closures）和迭代器（iterators）。
