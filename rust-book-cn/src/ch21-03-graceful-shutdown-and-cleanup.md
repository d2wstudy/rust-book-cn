## 优雅停机与清理

示例 21-20 中的代码通过线程池异步地响应请求，正如我们所期望的那样。我们会收到一些关于 `workers`、`id` 和 `thread` 字段的警告，提醒我们没有直接使用它们，这意味着我们没有做任何清理工作。当我们使用不太优雅的 <kbd>ctrl</kbd>-<kbd>C</kbd> 方式终止主线程时，所有其他线程也会立即停止，即使它们正在处理请求。

接下来，我们将为线程池实现 `Drop` trait，对池中的每个线程调用 `join`，使它们能在关闭前完成正在处理的请求。然后，我们将实现一种方式来通知线程停止接受新请求并关闭。为了验证这段代码的效果，我们将修改服务器，使其只接受两个请求后就优雅地关闭线程池。

在我们继续之前，有一点需要注意：这些改动都不会影响执行闭包的那部分代码，所以即使我们将线程池用于异步运行时，这里的所有内容也是一样的。

### 为 `ThreadPool` 实现 `Drop` Trait

让我们从为线程池实现 `Drop` 开始。当线程池被丢弃时，所有线程都应该 join 以确保它们完成工作。示例 21-22 展示了 `Drop` 实现的第一次尝试；这段代码还不能正常工作。

<Listing number="21-22" file-name="src/lib.rs" caption="当线程池离开作用域时 join 每个线程">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch21-web-server/listing-21-22/src/lib.rs:here}}
```

</Listing>

首先，我们遍历线程池中的每个 `workers`。这里使用 `&mut` 是因为 `self` 是一个可变引用，而且我们也需要能够修改 `worker`。对于每个 `worker`，我们打印一条消息表示该 `Worker` 实例正在关闭，然后对该 `Worker` 实例的线程调用 `join`。如果 `join` 调用失败，我们使用 `unwrap` 让 Rust panic 并进入非优雅关闭。

以下是编译这段代码时得到的错误：

```console
{{#include ../listings/ch21-web-server/listing-21-22/output.txt}}
```

这个错误告诉我们不能调用 `join`，因为我们只有每个 `worker` 的可变借用，而 `join` 需要获取其参数的所有权。为了解决这个问题，我们需要将线程从拥有 `thread` 的 `Worker` 实例中移出，这样 `join` 才能消费该线程。我们在示例 18-15 中采用过类似的方法：如果 `Worker` 持有的是 `Option<thread::JoinHandle<()>>`，我们就可以对 `Option` 调用 `take` 方法，将值从 `Some` 变体中移出，并在原位留下 `None` 变体。换句话说，正在运行的 `Worker` 的 `thread` 字段会是 `Some` 变体，而当我们想要清理 `Worker` 时，就用 `None` 替换 `Some`，这样 `Worker` 就不再有可运行的线程了。

然而，这种情况 _只会_ 在丢弃 `Worker` 时出现。作为代价，我们在所有访问 `worker.thread` 的地方都必须处理 `Option<thread::JoinHandle<()>>`。惯用的 Rust 代码确实大量使用 `Option`，但当你发现自己把一个明知始终存在的值包装在 `Option` 中作为变通方案时，最好寻找替代方法来让代码更简洁、更不容易出错。

在这种情况下，存在一个更好的替代方案：`Vec::drain` 方法。它接受一个范围参数来指定要从向量中移除哪些元素，并返回这些元素的迭代器。传入 `..` 范围语法将移除向量中的 *所有* 值。

因此，我们需要像这样更新 `ThreadPool` 的 `drop` 实现：

<Listing file-name="src/lib.rs">

```rust
{{#rustdoc_include ../listings/ch21-web-server/no-listing-04-update-drop-definition/src/lib.rs:here}}
```

</Listing>

这解决了编译器错误，并且不需要对代码做其他任何修改。需要注意的是，因为 drop 可能在 panic 时被调用，此时 unwrap 也可能 panic 并导致双重 panic，这会立即崩溃程序并终止所有正在进行的清理工作。对于示例程序来说这没问题，但不建议在生产代码中这样做。

### 向线程发送信号使其停止监听任务

经过我们所做的所有修改，代码可以无警告地编译了。不过坏消息是，这段代码还不能按我们期望的方式运行。关键在于 `Worker` 实例的线程所运行的闭包中的逻辑：目前我们调用了 `join`，但这并不会关闭线程，因为它们会永远 `loop` 来寻找任务。如果我们尝试用当前的 `drop` 实现来丢弃 `ThreadPool`，主线程将永远阻塞，等待第一个线程完成。

为了解决这个问题，我们需要修改 `ThreadPool` 的 `drop` 实现，然后修改 `Worker` 的循环。

首先，我们修改 `ThreadPool` 的 `drop` 实现，在等待线程完成之前显式地丢弃 `sender`。示例 21-23 展示了对 `ThreadPool` 的修改，显式地丢弃 `sender`。与线程不同，这里我们 _确实_ 需要使用 `Option`，以便通过 `Option::take` 将 `sender` 从 `ThreadPool` 中移出。

<Listing number="21-23" file-name="src/lib.rs" caption="在 join `Worker` 线程之前显式丢弃 `sender`">

```rust,noplayground,not_desired_behavior
{{#rustdoc_include ../listings/ch21-web-server/listing-21-23/src/lib.rs:here}}
```

</Listing>

丢弃 `sender` 会关闭通道，这表示不会再发送更多消息。当这种情况发生时，`Worker` 实例在无限循环中对 `recv` 的所有调用都将返回一个错误。在示例 21-24 中，我们修改 `Worker` 的循环，使其在这种情况下优雅地退出循环，这意味着当 `ThreadPool` 的 `drop` 实现对线程调用 `join` 时，线程将会结束。

<Listing number="21-24" file-name="src/lib.rs" caption="当 `recv` 返回错误时显式跳出循环">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-24/src/lib.rs:here}}
```

</Listing>

为了验证这段代码的效果，让我们修改 `main` 函数，使服务器只接受两个请求后就优雅地关闭，如示例 21-25 所示。

<Listing number="21-25" file-name="src/main.rs" caption="通过退出循环，在处理两个请求后关闭服务器">

```rust,ignore
{{#rustdoc_include ../listings/ch21-web-server/listing-21-25/src/main.rs:here}}
```

</Listing>

你肯定不会希望一个真实的 Web 服务器在只处理两个请求后就关闭。这段代码只是为了演示优雅停机和清理功能正常工作。

`take` 方法定义在 `Iterator` trait 中，它将迭代限制为最多前两个元素。`ThreadPool` 会在 `main` 函数结束时离开作用域，届时 `drop` 实现将会运行。

使用 `cargo run` 启动服务器，然后发送三个请求。第三个请求应该会报错，在终端中你应该会看到类似这样的输出：

<!-- manual-regeneration
cd listings/ch21-web-server/listing-21-25
cargo run
curl http://127.0.0.1:7878
curl http://127.0.0.1:7878
curl http://127.0.0.1:7878
third request will error because server will have shut down
copy output below
Can't automate because the output depends on making requests
-->

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Shutting down.
Shutting down worker 0
Worker 3 got a job; executing.
Worker 1 disconnected; shutting down.
Worker 2 disconnected; shutting down.
Worker 3 disconnected; shutting down.
Worker 0 disconnected; shutting down.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

你可能会看到不同的 `Worker` ID 和消息打印顺序。我们可以从这些消息中看出代码是如何工作的：`Worker` 实例 0 和 3 获得了前两个请求。服务器在第二个连接之后停止接受连接，`ThreadPool` 的 `Drop` 实现甚至在 `Worker 3` 开始执行任务之前就开始运行了。丢弃 `sender` 会断开所有 `Worker` 实例的连接并通知它们关闭。每个 `Worker` 实例在断开连接时打印一条消息，然后线程池调用 `join` 等待每个 `Worker` 线程完成。

请注意这次特定执行中一个有趣的方面：`ThreadPool` 丢弃了 `sender`，而在任何 `Worker` 收到错误之前，我们就尝试 join `Worker 0` 了。`Worker 0` 此时还没有从 `recv` 收到错误，所以主线程阻塞，等待 `Worker 0` 完成。与此同时，`Worker 3` 收到了一个任务，然后所有线程都收到了错误。当 `Worker 0` 完成后，主线程等待其余 `Worker` 实例完成。此时，它们都已经退出了各自的循环并停止了。

恭喜！我们已经完成了这个项目；我们拥有了一个使用线程池异步响应请求的基本 Web 服务器。我们能够对服务器执行优雅停机，清理线程池中的所有线程。

以下是完整代码供参考：

<Listing file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch21-web-server/no-listing-07-final-code/src/main.rs}}
```

</Listing>

<Listing file-name="src/lib.rs">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/no-listing-07-final-code/src/lib.rs}}
```

</Listing>

我们还可以做更多！如果你想继续完善这个项目，这里有一些想法：

- 为 `ThreadPool` 及其公有方法添加更多文档。
- 为库的功能添加测试。
- 将 `unwrap` 调用改为更健壮的错误处理。
- 使用 `ThreadPool` 执行 Web 请求之外的其他任务。
- 在 [crates.io](https://crates.io/) 上找一个线程池 crate，用它来实现一个类似的 Web 服务器。然后将其 API 和健壮性与我们实现的线程池进行比较。

## 总结

做得好！你已经读完了整本书！感谢你加入我们的 Rust 之旅。你现在已经准备好实现自己的 Rust 项目，并帮助其他人的项目了。请记住，有一个热情好客的 Rustacean 社区，他们很乐意帮助你在 Rust 旅程中遇到的任何挑战。
