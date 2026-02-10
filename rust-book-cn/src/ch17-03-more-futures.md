
<!-- Old headings. Do not remove or links may break. -->

<a id="yielding"></a>

### 让出控制权给运行时

回忆一下["我们的第一个异步程序"][async-program]<!-- ignore -->一节中提到的，在每个 await 点，Rust 都会给运行时一个机会来暂停当前任务并切换到另一个任务（如果被等待的 future 尚未就绪）。反过来也是如此：Rust **只会**在 await 点暂停异步块并将控制权交还给运行时。await 点之间的所有代码都是同步执行的。

这意味着，如果你在一个异步块中执行大量工作而没有 await 点，那么这个 future 将阻塞其他所有 future 的推进。你可能有时会听到这被称为一个 future _饿死_（starving）了其他 future。在某些情况下，这可能不是什么大问题。但是，如果你正在进行某种昂贵的初始化或长时间运行的工作，或者你有一个会无限期持续执行某项任务的 future，你就需要考虑何时何地将控制权交还给运行时。

让我们模拟一个长时间运行的操作来说明饥饿问题，然后探讨如何解决它。示例 17-14 引入了一个 `slow` 函数。

<Listing number="17-14" caption="使用 `thread::sleep` 模拟慢操作" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-14/src/main.rs:slow}}
```

</Listing>

这段代码使用 `std::thread::sleep` 而不是 `trpl::sleep`，这样调用 `slow` 就会阻塞当前线程若干毫秒。我们可以用 `slow` 来模拟那些既耗时又阻塞的真实操作。

在示例 17-15 中，我们使用 `slow` 来模拟在一对 future 中执行这类 CPU 密集型工作。

<Listing number="17-15" caption="调用 `slow` 函数模拟慢操作" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-15/src/main.rs:slow-futures}}
```

</Listing>

每个 future 只有在执行完一堆慢操作**之后**才会将控制权交还给运行时。如果你运行这段代码，会看到如下输出：

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-15/
cargo run
copy just the output
-->

```text
'a' started.
'a' ran for 30ms
'a' ran for 10ms
'a' ran for 20ms
'b' started.
'b' ran for 75ms
'b' ran for 10ms
'b' ran for 15ms
'b' ran for 350ms
'a' finished.
```

和示例 17-5 中我们使用 `trpl::select` 竞争两个 URL 获取的 future 一样，`select` 仍然在 `a` 完成后就结束了。但两个 future 中对 `slow` 的调用之间并没有交替执行。`a` future 会一直执行它的所有工作，直到 `trpl::sleep` 调用被 await，然后 `b` future 才会执行它的所有工作，直到它自己的 `trpl::sleep` 调用被 await，最后 `a` future 完成。为了让两个 future 都能在各自的慢任务之间取得进展，我们需要 await 点来将控制权交还给运行时。这意味着我们需要一些可以 await 的东西！

我们在示例 17-15 中已经可以看到这种交接的发生：如果我们移除 `a` future 末尾的 `trpl::sleep`，它将在 `b` future **完全没有运行**的情况下就完成了。让我们尝试使用 `trpl::sleep` 函数作为起点，让操作能够交替推进，如示例 17-16 所示。

<Listing number="17-16" caption="使用 `trpl::sleep` 让操作交替推进" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-16/src/main.rs:here}}
```

</Listing>

我们在每次调用 `slow` 之间添加了带有 await 点的 `trpl::sleep` 调用。现在两个 future 的工作是交替进行的：

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-16
cargo run
copy just the output
-->

```text
'a' started.
'a' ran for 30ms
'b' started.
'b' ran for 75ms
'a' ran for 10ms
'b' ran for 10ms
'a' ran for 20ms
'b' ran for 15ms
'a' finished.
```

`a` future 在将控制权交给 `b` 之前仍然会先运行一小段，因为它在调用 `trpl::sleep` 之前就调用了 `slow`，但在那之后，每当其中一个 future 遇到 await 点时，它们就会来回切换。在这个例子中，我们在每次调用 `slow` 之后都这样做了，但我们可以按照任何对我们最有意义的方式来拆分工作。

不过，我们并不是真的想在这里 _休眠_：我们想尽可能快地推进。我们只需要将控制权交还给运行时。我们可以直接使用 `trpl::yield_now` 函数来做到这一点。在示例 17-17 中，我们将所有的 `trpl::sleep` 调用替换为 `trpl::yield_now`。

<Listing number="17-17" caption="使用 `yield_now` 让操作交替推进" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-17/src/main.rs:yields}}
```

</Listing>

这段代码不仅更清楚地表达了实际意图，而且可能比使用 `sleep` 快得多，因为像 `sleep` 使用的那种定时器通常对精度有限制。我们使用的 `sleep` 版本，即使传入一纳秒的 `Duration`，也至少会休眠一毫秒。再说一次，现代计算机非常_快_：一毫秒内可以做很多事情！

这意味着异步即使对于计算密集型任务也可能是有用的，这取决于你的程序还在做什么，因为它提供了一种有用的工具来组织程序不同部分之间的关系（但代价是异步状态机的开销）。这是一种_协作式多任务_（cooperative multitasking）的形式，其中每个 future 都有权通过 await 点来决定何时交出控制权。因此，每个 future 也有责任避免阻塞太长时间。在一些基于 Rust 的嵌入式操作系统中，这是_唯一_的多任务形式！

在实际代码中，你通常不会在每一行都交替使用函数调用和 await 点。虽然以这种方式让出控制权的开销相对较小，但并非零成本。在许多情况下，试图拆分一个计算密集型任务可能会使其显著变慢，所以有时候让一个操作短暂阻塞对_整体_性能反而更好。始终通过测量来确定代码的实际性能瓶颈在哪里。不过，如果你_确实_看到很多本应并发执行的工作在串行执行，那么理解这个底层机制就很重要了！

### 构建自定义异步抽象

我们还可以将 future 组合在一起来创建新的模式。例如，我们可以使用已有的异步构建块来构建一个 `timeout` 函数。完成后，这个结果将成为另一个构建块，我们可以用它来创建更多的异步抽象。

示例 17-18 展示了我们期望这个 `timeout` 如何与一个慢 future 配合工作。

<Listing number="17-18" caption="使用我们设想的 `timeout` 为慢操作设置时间限制" file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch17-async-await/listing-17-18/src/main.rs:here}}
```

</Listing>

让我们来实现它！首先，让我们思考一下 `timeout` 的 API：

- 它本身需要是一个异步函数，这样我们才能 await 它。
- 它的第一个参数应该是要运行的 future。我们可以使用泛型来让它适用于任何 future。
- 它的第二个参数是等待的最长时间。如果使用 `Duration`，就可以方便地传递给 `trpl::sleep`。
- 它应该返回一个 `Result`。如果 future 成功完成，`Result` 将是 `Ok`，包含 future 产生的值。如果超时先到期，`Result` 将是 `Err`，包含超时等待的时长。

示例 17-19 展示了这个声明。

<!-- This is not tested because it intentionally does not compile. -->

<Listing number="17-19" caption="定义 `timeout` 的签名" file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch17-async-await/listing-17-19/src/main.rs:declaration}}
```

</Listing>

这满足了我们对类型的要求。现在让我们思考一下需要的_行为_：我们想让传入的 future 与时长进行竞争。我们可以使用 `trpl::sleep` 从时长创建一个定时器 future，然后使用 `trpl::select` 将该定时器与调用者传入的 future 一起运行。

在示例 17-20 中，我们通过对 `trpl::select` 的返回结果进行匹配来实现 `timeout`。

<Listing number="17-20" caption="使用 `select` 和 `sleep` 定义 `timeout`" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-20/src/main.rs:implementation}}
```

</Listing>

`trpl::select` 的实现不是公平的：它总是按照参数传入的顺序来轮询（其他 `select` 实现会随机选择先轮询哪个参数）。因此，我们将 `future_to_try` 作为第一个参数传给 `select`，这样即使 `max_time` 是一个非常短的时长，它也有机会完成。如果 `future_to_try` 先完成，`select` 将返回 `Left`，包含 `future_to_try` 的输出。如果 `timer` 先完成，`select` 将返回 `Right`，包含定时器的输出 `()`。

如果 `future_to_try` 成功了，我们得到 `Left(output)`，就返回 `Ok(output)`。如果休眠定时器先到期，我们得到 `Right(())`，就用 `_` 忽略 `()`，转而返回 `Err(max_time)`。

这样，我们就用两个其他的异步辅助工具构建了一个可用的 `timeout`。如果运行我们的代码，它将在超时后打印失败信息：

```text
Failed after 2 seconds
```

因为 future 可以与其他 future 组合，所以你可以使用较小的异步构建块来构建非常强大的工具。例如，你可以使用同样的方法将超时与重试结合起来，然后再将它们与网络调用等操作结合使用（比如示例 17-5 中的那些）。

在实践中，你通常会直接使用 `async` 和 `await`，其次才会使用 `select` 等函数和 `join!` 等宏来控制最外层 future 的执行方式。

我们现在已经看到了多种同时处理多个 future 的方式。接下来，我们将看看如何使用_流_（streams）来处理随时间推移的一系列 future。

[async-program]: ch17-01-futures-and-syntax.html#our-first-async-program
