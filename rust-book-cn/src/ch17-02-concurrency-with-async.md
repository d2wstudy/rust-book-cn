<!-- Old headings. Do not remove or links may break. -->

<a id="concurrency-with-async"></a>

## 使用异步实现并发

在本节中，我们将把异步应用于第十六章中使用线程处理过的一些并发挑战。因为我们已经在那里讨论了许多关键概念，所以本节将重点关注线程和 future 之间的不同之处。

在许多情况下，使用异步进行并发编程的 API 与使用线程的 API 非常相似。而在另一些情况下，它们最终会有很大不同。即使线程和异步之间的 API _看起来_ 相似，它们通常也有不同的行为——而且几乎总是有不同的性能特征。

<!-- Old headings. Do not remove or links may break. -->

<a id="counting"></a>

### 使用 `spawn_task` 创建新任务

我们在第十六章["使用 `spawn` 创建新线程"][thread-spawn]<!-- ignore -->一节中处理的第一个操作是在两个独立的线程上进行计数。让我们使用异步来做同样的事情。`trpl` crate 提供了一个 `spawn_task` 函数，它看起来与 `thread::spawn` API 非常相似，还有一个 `sleep` 函数，它是 `thread::sleep` API 的异步版本。我们可以将它们结合使用来实现计数示例，如示例 17-6 所示。

<Listing number="17-6" caption="创建一个新任务来打印一些内容，同时主任务打印另一些内容" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-06/src/main.rs:all}}
```

</Listing>

作为起点，我们使用 `trpl::block_on` 设置 `main` 函数，这样我们的顶层函数就可以是异步的。

> 注意：从本章这里开始，每个示例都会在 `main` 中包含完全相同的 `trpl::block_on` 包装代码，所以我们通常会像省略 `main` 一样省略它。记得在你的代码中加上它！

然后我们在该代码块中编写两个循环，每个循环都包含一个 `trpl::sleep` 调用，它会等待半秒（500 毫秒）后再发送下一条消息。我们将一个循环放在 `trpl::spawn_task` 的主体中，另一个放在顶层的 `for` 循环中。我们还在 `sleep` 调用之后添加了 `await`。

这段代码的行为与基于线程的实现类似——包括你在自己的终端中运行时可能会看到消息以不同顺序出现这一事实：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the second task!
hi number 1 from the first task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
```

这个版本在主异步代码块中的 `for` 循环结束后就会停止，因为 `spawn_task` 生成的任务会在 `main` 函数结束时被关闭。如果你希望它一直运行到任务完成，你需要使用 join 句柄来等待第一个任务完成。对于线程，我们使用 `join` 方法来"阻塞"直到线程运行完毕。在示例 17-7 中，我们可以使用 `await` 来做同样的事情，因为任务句柄本身就是一个 future。它的 `Output` 类型是 `Result`，所以我们在 await 之后还要对它进行 unwrap。

<Listing number="17-7" caption="使用 `await` 和 join 句柄来将任务运行到完成" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-07/src/main.rs:handle}}
```

</Listing>

这个更新后的版本会运行到 _两个_ 循环都结束：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the second task!
hi number 1 from the first task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
hi number 6 from the first task!
hi number 7 from the first task!
hi number 8 from the first task!
hi number 9 from the first task!
```

到目前为止，异步和线程看起来给出了类似的结果，只是语法不同：使用 `await` 而不是在 join 句柄上调用 `join`，以及 await `sleep` 调用。

更大的区别在于我们不需要生成另一个操作系统线程来做这件事。实际上，我们甚至不需要在这里生成一个任务。因为异步代码块会编译为匿名 future，我们可以将每个循环放在一个异步代码块中，然后让运行时使用 `trpl::join` 函数将它们都运行到完成。

在第十六章["等待所有线程完成"][join-handles]<!-- ignore -->一节中，我们展示了如何在调用 `std::thread::spawn` 返回的 `JoinHandle` 类型上使用 `join` 方法。`trpl::join` 函数与之类似，但用于 future。当你给它两个 future 时，它会产生一个新的 future，其输出是一个包含你传入的每个 future 的输出的元组，在它们 _都_ 完成之后。因此，在示例 17-8 中，我们使用 `trpl::join` 来等待 `fut1` 和 `fut2` 都完成。我们 _不_ await `fut1` 和 `fut2`，而是 await `trpl::join` 产生的新 future。我们忽略输出，因为它只是一个包含两个单元值的元组。

<Listing number="17-8" caption="使用 `trpl::join` 来 await 两个匿名 future" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-08/src/main.rs:join}}
```

</Listing>

当我们运行这段代码时，可以看到两个 future 都运行到了完成：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the first task!
hi number 1 from the second task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
hi number 6 from the first task!
hi number 7 from the first task!
hi number 8 from the first task!
hi number 9 from the first task!
```

现在，你每次都会看到完全相同的顺序，这与我们在线程和示例 17-7 中使用 `trpl::spawn_task` 时看到的非常不同。这是因为 `trpl::join` 函数是 _公平的_，意味着它会同等频率地检查每个 future，在它们之间交替执行，如果另一个已经就绪就不会让其中一个抢先执行。对于线程，操作系统决定检查哪个线程以及让它运行多长时间。对于异步 Rust，运行时决定检查哪个任务。（实际上，细节会更复杂，因为异步运行时可能在底层使用操作系统线程作为管理并发的一部分，所以保证公平性对运行时来说可能需要更多工作——但这仍然是可能的！）运行时不必为任何给定操作保证公平性，它们通常提供不同的 API 来让你选择是否需要公平性。

尝试这些 await future 的变体，看看它们会做什么：

- 从其中一个或两个循环中移除异步代码块。
- 在定义每个异步代码块后立即 await 它。
- 只将第一个循环包装在异步代码块中，并在第二个循环的主体之后 await 结果 future。

作为额外的挑战，看看你能否在运行代码 _之前_ 弄清楚每种情况下的输出是什么！

<!-- Old headings. Do not remove or links may break. -->

<a id="message-passing"></a>
<a id="counting-up-on-two-tasks-using-message-passing"></a>

### 使用消息传递在两个任务之间发送数据

在 future 之间共享数据也会很熟悉：我们将再次使用消息传递，但这次使用异步版本的类型和函数。我们将采取与第十六章["使用消息传递在线程间传输数据"][message-passing-threads]<!-- ignore -->一节中略有不同的路径，以说明基于线程和基于 future 的并发之间的一些关键区别。在示例 17-9 中，我们将从只有一个异步代码块开始——_不_ 像我们生成单独线程那样生成单独的任务。

<Listing number="17-9" caption="创建一个异步通道并将两端分别赋值给 `tx` 和 `rx`" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-09/src/main.rs:channel}}
```

</Listing>

这里我们使用 `trpl::channel`，这是我们在第十六章中与线程一起使用的多生产者、单消费者通道 API 的异步版本。异步版本的 API 与基于线程的版本只有一点不同：它使用可变的而非不可变的接收者 `rx`，并且它的 `recv` 方法产生一个需要 await 的 future，而不是直接产生值。现在我们可以从发送者向接收者发送消息了。注意，我们不需要生成单独的线程甚至任务；我们只需要 await `rx.recv` 调用即可。

`std::mpsc::channel` 中的同步 `Receiver::recv` 方法会阻塞直到收到消息。`trpl::Receiver::recv` 方法则不会，因为它是异步的。它不会阻塞，而是将控制权交还给运行时，直到收到消息或通道的发送端关闭。相比之下，我们不 await `send` 调用，因为它不会阻塞。它不需要阻塞，因为我们发送消息的通道是无界的。

> 注意：因为所有这些异步代码都运行在 `trpl::block_on` 调用中的异步代码块里，其中的所有内容都可以避免阻塞。然而，_外部_ 的代码会在 `block_on` 函数返回时阻塞。这正是 `trpl::block_on` 函数的意义所在：它让你 _选择_ 在哪里阻塞某组异步代码，从而在哪里进行同步和异步代码之间的转换。

注意这个示例的两点。首先，消息会立即到达。其次，虽然我们在这里使用了 future，但还没有并发。列表中的所有内容都按顺序执行，就像没有涉及 future 一样。

让我们先解决第一个问题，发送一系列消息并在它们之间休眠，如示例 17-10 所示。

<!-- We cannot test this one because it never stops! -->

<Listing number="17-10" caption="通过异步通道发送和接收多条消息，并在每条消息之间使用 `await` 休眠" file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch17-async-await/listing-17-10/src/main.rs:many-messages}}
```

</Listing>

除了发送消息之外，我们还需要接收它们。在这种情况下，因为我们知道有多少条消息要来，我们可以手动调用 `rx.recv().await` 四次。但在现实世界中，我们通常会等待某个 _未知_ 数量的消息，所以我们需要一直等待，直到确定没有更多消息为止。

在示例 16-10 中，我们使用 `for` 循环来处理从同步通道接收到的所有项。然而，Rust 目前还没有办法对 _异步产生的_ 一系列项使用 `for` 循环，所以我们需要使用一种之前没见过的循环：`while let` 条件循环。这是我们在第六章["使用 `if let` 和 `let...else` 实现简洁控制流"][if-let]<!-- ignore -->一节中看到的 `if let` 结构的循环版本。只要它指定的模式继续匹配值，循环就会继续执行。

`rx.recv` 调用产生一个 future，我们对其进行 await。运行时会暂停该 future 直到它就绪。一旦消息到达，future 将解析为 `Some(message)`，每次消息到达时都是如此。当通道关闭时，无论是否有消息到达过，future 将解析为 `None`，表示没有更多的值，因此我们应该停止轮询——也就是停止 await。

`while let` 循环将所有这些整合在一起。如果调用 `rx.recv().await` 的结果是 `Some(message)`，我们就可以访问消息并在循环体中使用它，就像使用 `if let` 一样。如果结果是 `None`，循环就结束了。每次循环完成时，它都会再次到达 await 点，所以运行时会再次暂停它，直到另一条消息到达。

代码现在成功地发送和接收了所有消息。不幸的是，仍然有几个问题。首先，消息不是每隔半秒到达的。它们在程序启动 2 秒（2,000 毫秒）后一次性全部到达。其次，这个程序永远不会退出！相反，它会永远等待新消息。你需要使用 <kbd>ctrl</kbd>-<kbd>C</kbd> 来关闭它。

#### 单个异步代码块中的代码按顺序执行

让我们先来看看为什么消息在完整延迟之后一次性全部到达，而不是在每条消息之间有延迟地到达。在给定的异步代码块中，`await` 关键字在代码中出现的顺序也是程序运行时它们被执行的顺序。

示例 17-10 中只有一个异步代码块，所以其中的所有内容都按顺序运行。仍然没有并发。所有的 `tx.send` 调用都会执行，中间穿插着所有的 `trpl::sleep` 调用及其关联的 await 点。只有在那之后，`while let` 循环才会开始处理 `recv` 调用上的任何 `await` 点。

为了获得我们想要的行为——即休眠延迟发生在每条消息之间——我们需要将 `tx` 和 `rx` 操作放在各自的异步代码块中，如示例 17-11 所示。然后运行时可以使用 `trpl::join` 分别执行它们，就像在示例 17-8 中一样。再次强调，我们 await 的是调用 `trpl::join` 的结果，而不是各个单独的 future。如果我们按顺序 await 各个 future，我们最终又会回到顺序流——这正是我们试图 _避免_ 的。

<!-- We cannot test this one because it never stops! -->

<Listing number="17-11" caption="将 `send` 和 `recv` 分离到各自的 `async` 代码块中，并 await 这些代码块的 future" file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch17-async-await/listing-17-11/src/main.rs:futures}}
```

</Listing>

使用示例 17-11 中更新后的代码，消息会每隔 500 毫秒打印一次，而不是在 2 秒后一股脑全部出现。

#### 将所有权移入异步代码块

然而，程序仍然永远不会退出，因为 `while let` 循环与 `trpl::join` 的交互方式：

- `trpl::join` 返回的 future 只有在传入的 _两个_ future 都完成后才会完成。
- `tx_fut` future 在发送完 `vals` 中的最后一条消息并完成休眠后就完成了。
- `rx_fut` future 在 `while let` 循环结束之前不会完成。
- `while let` 循环在 await `rx.recv` 产生 `None` 之前不会结束。
- await `rx.recv` 只有在通道的另一端关闭时才会返回 `None`。
- 通道只有在我们调用 `rx.close` 或发送端 `tx` 被丢弃时才会关闭。
- 我们没有在任何地方调用 `rx.close`，而 `tx` 在传递给 `trpl::block_on` 的最外层异步代码块结束之前不会被丢弃。
- 该代码块无法结束，因为它被 `trpl::join` 的完成所阻塞，这又把我们带回了这个列表的顶部。

目前，发送消息的异步代码块只是 _借用_ 了 `tx`，因为发送消息不需要所有权，但如果我们能将 `tx` _移动_ 到该异步代码块中，它就会在该代码块结束时被丢弃。在第十三章["捕获引用或移动所有权"][capture-or-move]<!-- ignore -->一节中，你学习了如何在闭包中使用 `move` 关键字，而且正如第十六章["在线程中使用 `move` 闭包"][move-threads]<!-- ignore -->一节中所讨论的，在使用线程时我们经常需要将数据移动到闭包中。同样的基本原理也适用于异步代码块，所以 `move` 关键字在异步代码块中的工作方式与在闭包中相同。

在示例 17-12 中，我们将用于发送消息的代码块从 `async` 改为 `async move`。

<Listing number="17-12" caption="对示例 17-11 代码的修订，使其在完成后正确关闭" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-12/src/main.rs:with-move}}
```

</Listing>

当我们运行 _这个_ 版本的代码时，它会在最后一条消息发送和接收后优雅地关闭。接下来，让我们看看如果要从多个 future 发送数据需要做哪些改变。

#### 使用 `join!` 宏连接多个 Future

这个异步通道也是一个多生产者通道，所以如果我们想从多个 future 发送消息，可以对 `tx` 调用 `clone`，如示例 17-13 所示。

<Listing number="17-13" caption="在异步代码块中使用多个生产者" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-13/src/main.rs:here}}
```

</Listing>

首先，我们在第一个异步代码块外部克隆 `tx`，创建 `tx1`。我们像之前对 `tx` 所做的那样将 `tx1` 移入该代码块。然后，稍后我们将原始的 `tx` 移入一个 _新的_ 异步代码块，在那里以稍慢的延迟发送更多消息。我们碰巧将这个新的异步代码块放在接收消息的异步代码块之后，但放在它之前也同样可以。关键在于 future 被 await 的顺序，而不是它们被创建的顺序。

两个发送消息的异步代码块都需要是 `async move` 代码块，这样 `tx` 和 `tx1` 才会在这些代码块完成时被丢弃。否则，我们又会回到最初的无限循环中。

最后，我们从 `trpl::join` 切换到 `trpl::join!` 来处理额外的 future：`join!` 宏可以 await 任意数量的 future，只要我们在编译时知道 future 的数量。我们将在本章后面讨论如何 await 一个数量未知的 future 集合。

现在我们可以看到来自两个发送 future 的所有消息，因为发送 future 在发送后使用了略有不同的延迟，消息也以这些不同的间隔被接收：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
received 'hi'
received 'more'
received 'from'
received 'the'
received 'messages'
received 'future'
received 'for'
received 'you'
```

我们已经探讨了如何使用消息传递在 future 之间发送数据、异步代码块中的代码如何按顺序运行、如何将所有权移入异步代码块，以及如何连接多个 future。接下来，让我们讨论如何以及为什么告诉运行时它可以切换到另一个任务。

[thread-spawn]: ch16-01-threads.html#creating-a-new-thread-with-spawn
[join-handles]: ch16-01-threads.html#waiting-for-all-threads-to-finish
[message-passing-threads]: ch16-02-message-passing.html
[if-let]: ch06-03-if-let.html
[capture-or-move]: ch13-01-closures.html#capturing-references-or-moving-ownership
[move-threads]: ch16-01-threads.html#using-move-closures-with-threads
