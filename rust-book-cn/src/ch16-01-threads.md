## 使用线程同时运行代码

在大多数当前的操作系统中，已执行程序的代码运行在一个**进程**（process）中，操作系统会同时管理多个进程。在程序内部，你也可以拥有同时运行的独立部分。运行这些独立部分的功能被称为**线程**（thread）。例如，一个 Web 服务器可以拥有多个线程，这样它就能同时响应多个请求。

将程序中的计算拆分到多个线程中以同时运行多个任务可以提高性能，但这也增加了复杂性。因为线程可以同时运行，所以无法保证不同线程上的代码的执行顺序。这可能导致以下问题：

- 竞态条件（race condition），即多个线程以不一致的顺序访问数据或资源
- 死锁（deadlock），即两个线程互相等待对方，导致双方都无法继续执行
- 只在特定情况下才会出现的 bug，难以可靠地重现和修复

Rust 试图减轻使用线程带来的负面影响，但在多线程环境中编程仍然需要仔细思考，并且需要与单线程程序不同的代码结构。

编程语言以几种不同的方式实现线程，许多操作系统提供了可供编程语言调用的 API 来创建新线程。Rust 标准库使用 _1:1_ 线程模型，即程序为每个语言线程使用一个操作系统线程。也有一些 crate 实现了其他线程模型，这些模型与 1:1 模型有不同的取舍。（Rust 的异步系统——我们将在下一章中看到——也提供了另一种并发方式。）

### 使用 `spawn` 创建新线程

要创建一个新线程，我们调用 `thread::spawn` 函数并传递一个闭包（我们在第 13 章讨论过闭包），其中包含我们想在新线程中运行的代码。示例 16-1 在主线程中打印一些文本，同时在新线程中打印另一些文本。

<Listing number="16-1" file-name="src/main.rs" caption="创建一个新线程来打印内容，同时主线程也在打印其他内容">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-01/src/main.rs}}
```

</Listing>

注意，当 Rust 程序的主线程结束时，所有新创建的线程都会被关闭，无论它们是否已经运行完毕。这个程序的输出每次可能会略有不同，但它看起来类似于以下内容：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the main thread!
hi number 2 from the spawned thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
```

调用 `thread::sleep` 会强制线程暂停执行一小段时间，从而允许其他线程运行。这些线程可能会轮流执行，但这并不能保证：这取决于操作系统如何调度线程。在这次运行中，主线程先打印了，尽管新创建线程的打印语句在代码中出现得更早。而且，虽然我们让新创建的线程打印到 `i` 为 `9`，但它只打印到了 `5`，因为主线程就已经结束了。

如果你运行这段代码时只看到了主线程的输出，或者没有看到交替输出，可以尝试增大范围中的数字，为操作系统在线程之间切换创造更多机会。

<!-- Old headings. Do not remove or links may break. -->

<a id="waiting-for-all-threads-to-finish-using-join-handles"></a>

### 等待所有线程完成

示例 16-1 中的代码不仅会因为主线程结束而导致新创建的线程大多数时候被提前终止，而且由于无法保证线程的运行顺序，我们甚至不能保证新创建的线程会被执行！

我们可以通过将 `thread::spawn` 的返回值保存在一个变量中来解决新创建的线程不运行或提前结束的问题。`thread::spawn` 的返回类型是 `JoinHandle<T>`。`JoinHandle<T>` 是一个拥有所有权的值，当我们对其调用 `join` 方法时，它会等待对应的线程完成。示例 16-2 展示了如何使用示例 16-1 中创建的线程的 `JoinHandle<T>`，以及如何调用 `join` 来确保新创建的线程在 `main` 退出之前完成。

<Listing number="16-2" file-name="src/main.rs" caption="保存 `thread::spawn` 返回的 `JoinHandle<T>`，以确保线程运行完成">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-02/src/main.rs}}
```

</Listing>

对 handle 调用 `join` 会阻塞当前正在运行的线程，直到 handle 所代表的线程终止。**阻塞**（blocking）一个线程意味着阻止该线程执行工作或退出。因为我们将 `join` 的调用放在了主线程的 `for` 循环之后，运行示例 16-2 应该会产生类似如下的输出：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 1 from the spawned thread!
hi number 3 from the main thread!
hi number 2 from the spawned thread!
hi number 4 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
```

两个线程继续交替执行，但主线程会因为调用了 `handle.join()` 而等待，直到新创建的线程完成后才会结束。

但让我们看看如果将 `handle.join()` 移到 `main` 中的 `for` 循环之前会发生什么：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/no-listing-01-join-too-early/src/main.rs}}
```

</Listing>

主线程会等待新创建的线程完成，然后才运行自己的 `for` 循环，因此输出将不再交替出现，如下所示：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 4 from the main thread!
```

像 `join` 的调用位置这样的小细节，可以影响你的线程是否能同时运行。

### 在线程中使用 `move` 闭包

我们经常将 `move` 关键字与传递给 `thread::spawn` 的闭包一起使用，因为这样闭包会获取它从环境中使用的值的所有权，从而将这些值的所有权从一个线程转移到另一个线程。在第 13 章的["捕获引用或移动所有权"][capture]<!-- ignore -->中，我们讨论了闭包上下文中的 `move`。现在我们将更多地关注 `move` 和 `thread::spawn` 之间的交互。

注意在示例 16-1 中，我们传递给 `thread::spawn` 的闭包没有接受任何参数：我们没有在新创建线程的代码中使用主线程的任何数据。要在新创建的线程中使用主线程的数据，新创建线程的闭包必须捕获它需要的值。示例 16-3 展示了一个尝试在主线程中创建 vector 并在新创建的线程中使用它的例子。不过，这还不能工作，你马上就会看到原因。

<Listing number="16-3" file-name="src/main.rs" caption="尝试在另一个线程中使用主线程创建的 vector">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-03/src/main.rs}}
```

</Listing>

闭包使用了 `v`，所以它会捕获 `v` 并使其成为闭包环境的一部分。因为 `thread::spawn` 在一个新线程中运行这个闭包，我们应该能够在新线程内部访问 `v`。但当我们编译这个例子时，会得到以下错误：

```console
{{#include ../listings/ch16-fearless-concurrency/listing-16-03/output.txt}}
```

Rust **推断**如何捕获 `v`，因为 `println!` 只需要 `v` 的引用，所以闭包尝试借用 `v`。然而，这里有一个问题：Rust 无法判断新创建的线程会运行多久，所以它不知道对 `v` 的引用是否始终有效。

示例 16-4 提供了一个更可能导致 `v` 的引用无效的场景。

<Listing number="16-4" file-name="src/main.rs" caption="一个线程的闭包尝试从主线程捕获 `v` 的引用，但主线程丢弃了 `v`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-04/src/main.rs}}
```

</Listing>

如果 Rust 允许我们运行这段代码，新创建的线程有可能会被立即放到后台而根本不运行。新创建的线程内部持有 `v` 的引用，但主线程使用我们在第 15 章讨论过的 `drop` 函数立即丢弃了 `v`。然后，当新创建的线程开始执行时，`v` 已经不再有效，所以对它的引用也是无效的。糟糕！

要修复示例 16-3 中的编译器错误，我们可以使用错误信息的建议：

<!-- manual-regeneration
after automatic regeneration, look at listings/ch16-fearless-concurrency/listing-16-03/output.txt and copy the relevant part
-->

```text
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ++++
```

通过在闭包前添加 `move` 关键字，我们强制闭包获取它所使用的值的所有权，而不是让 Rust 推断它应该借用这些值。示例 16-5 展示了对示例 16-3 的修改，它可以按我们的预期编译和运行。

<Listing number="16-5" file-name="src/main.rs" caption="使用 `move` 关键字强制闭包获取它所使用的值的所有权">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-05/src/main.rs}}
```

</Listing>

我们可能会想用同样的方法来修复示例 16-4 中主线程调用了 `drop` 的代码，即使用 `move` 闭包。然而，这个修复不会奏效，因为示例 16-4 试图做的事情由于另一个原因而被禁止。如果我们给闭包添加 `move`，我们会将 `v` 移动到闭包的环境中，这样我们就不能再在主线程中对它调用 `drop` 了。我们会得到这样的编译器错误：

```console
{{#include ../listings/ch16-fearless-concurrency/output-only-01-move-drop/output.txt}}
```

Rust 的所有权规则再次拯救了我们！示例 16-3 中的代码报错是因为 Rust 采取了保守策略，只为线程借用 `v`，这意味着主线程理论上可能会使新创建线程的引用失效。通过告诉 Rust 将 `v` 的所有权移动到新创建的线程，我们向 Rust 保证主线程不会再使用 `v`。如果我们以同样的方式修改示例 16-4，那么当我们尝试在主线程中使用 `v` 时，就违反了所有权规则。`move` 关键字覆盖了 Rust 保守的默认借用行为；但它不允许我们违反所有权规则。

现在我们已经了解了什么是线程以及线程 API 提供的方法，让我们来看看一些可以使用线程的场景。

[capture]: ch13-01-closures.html#capturing-references-or-moving-ownership
