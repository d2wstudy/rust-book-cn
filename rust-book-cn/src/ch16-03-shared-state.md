## 共享状态并发

消息传递是处理并发的一种好方法，但并不是唯一的方法。另一种方法是让多个线程访问同一块共享数据。再来回顾一下 Go 语言文档中那句口号的这个部分："不要通过共享内存来通信。"

通过共享内存来通信会是什么样子呢？此外，消息传递的拥护者为什么要告诫大家不要使用共享内存呢？

从某种意义上说，任何编程语言中的通道都类似于单所有权，因为一旦你将一个值发送到通道中，就不应该再使用该值了。共享内存并发则类似于多所有权：多个线程可以同时访问同一块内存。正如你在第 15 章中所见，智能指针使多所有权成为可能，而多所有权会增加复杂性，因为需要管理这些不同的所有者。Rust 的类型系统和所有权规则极大地帮助我们正确地进行这种管理。作为示例，让我们来看看互斥器（mutex），它是共享内存中最常见的并发原语之一。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-mutexes-to-allow-access-to-data-from-one-thread-at-a-time"></a>

### 使用互斥器控制访问

*互斥器*（mutex）是 *mutual exclusion*（互斥）的缩写，即互斥器在任意时刻只允许一个线程访问某些数据。要访问互斥器中的数据，线程必须首先发出信号表明它想要访问，即请求获取互斥器的*锁*（lock）。锁是互斥器的一部分，是一种数据结构，用于跟踪当前谁拥有数据的独占访问权。因此，互斥器被描述为通过锁系统来*守护*（guarding）其持有的数据。

互斥器以难以使用而闻名，因为你必须记住两条规则：

1. 在使用数据之前，必须先尝试获取锁。
2. 当你使用完互斥器守护的数据后，必须解锁数据，以便其他线程可以获取锁。

用一个现实世界的比喻来理解互斥器：想象一场只有一个麦克风的会议小组讨论。在小组成员发言之前，他们必须请求或示意想要使用麦克风。当他们拿到麦克风后，可以想说多久就说多久，然后将麦克风交给下一位请求发言的小组成员。如果一位小组成员在发言结束后忘记交出麦克风，其他人就无法发言了。如果共享麦克风的管理出了问题，小组讨论就无法按计划进行！

互斥器的管理可能极其复杂，这也是为什么很多人热衷于使用通道的原因。然而，得益于 Rust 的类型系统和所有权规则，你不可能在加锁和解锁上犯错。

#### `Mutex<T>` 的 API

作为如何使用互斥器的示例，让我们先在单线程上下文中使用互斥器，如示例 16-12 所示。

<Listing number="16-12" file-name="src/main.rs" caption="为了简单起见，在单线程上下文中探索 `Mutex<T>` 的 API">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-12/src/main.rs}}
```

</Listing>

与许多类型一样，我们使用关联函数 `new` 来创建一个 `Mutex<T>`。要访问互斥器内部的数据，我们使用 `lock` 方法来获取锁。这个调用会阻塞当前线程，使其在轮到我们持有锁之前无法做任何工作。

如果持有锁的另一个线程发生了 panic，`lock` 调用就会失败。在这种情况下，没有人能够再获取锁，所以我们选择了 `unwrap`，让当前线程在遇到这种情况时也 panic。

获取锁之后，我们可以将返回值（在这里命名为 `num`）当作内部数据的可变引用来使用。类型系统确保我们在使用 `m` 中的值之前获取锁。`m` 的类型是 `Mutex<i32>` 而不是 `i32`，所以我们*必须*调用 `lock` 才能使用 `i32` 值。我们不会忘记这一点，因为类型系统不会允许我们以其他方式访问内部的 `i32`。

`lock` 调用返回一个名为 `MutexGuard` 的类型，它被包装在一个 `LockResult` 中，我们通过调用 `unwrap` 来处理它。`MutexGuard` 类型实现了 `Deref`，指向内部数据；它还实现了 `Drop`，当 `MutexGuard` 离开作用域时会自动释放锁，这发生在内部作用域的末尾。因此，我们不会有忘记释放锁而阻塞其他线程使用互斥器的风险，因为锁的释放是自动发生的。

释放锁之后，我们可以打印互斥器的值，可以看到我们成功地将内部的 `i32` 值改为了 `6`。

<!-- Old headings. Do not remove or links may break. -->

<a id="sharing-a-mutext-between-multiple-threads"></a>

#### 共享 `Mutex<T>` 的访问

现在让我们尝试使用 `Mutex<T>` 在多个线程之间共享一个值。我们将启动 10 个线程，让每个线程将计数器的值加 1，这样计数器就会从 0 变为 10。示例 16-13 中的代码会产生编译错误，我们将利用这个错误来进一步了解 `Mutex<T>` 的使用方式，以及 Rust 如何帮助我们正确地使用它。

<Listing number="16-13" file-name="src/main.rs" caption="十个线程，每个线程都递增一个由 `Mutex<T>` 守护的计数器">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-13/src/main.rs}}
```

</Listing>

我们创建了一个 `counter` 变量来在 `Mutex<T>` 中存放一个 `i32` 值，就像示例 16-12 中那样。接着，我们通过遍历一个数字范围来创建 10 个线程。我们使用 `thread::spawn` 并给所有线程传入相同的闭包：将计数器移入线程，通过调用 `lock` 方法获取 `Mutex<T>` 上的锁，然后将互斥器中的值加 1。当线程执行完闭包后，`num` 会离开作用域并释放锁，这样另一个线程就可以获取它了。

在主线程中，我们收集了所有的 join 句柄。然后，就像示例 16-2 中那样，我们对每个句柄调用 `join` 以确保所有线程都执行完毕。此时，主线程会获取锁并打印程序的结果。

我们之前暗示过这个示例无法编译。现在让我们来看看为什么！

```console
{{#include ../listings/ch16-fearless-concurrency/listing-16-13/output.txt}}
```

错误信息指出 `counter` 值在循环的前一次迭代中已经被移动了。Rust 告诉我们，不能将 `counter` 锁的所有权移入多个线程。让我们用第 15 章中讨论过的多所有权方法来修复这个编译错误。

#### 多线程的多所有权

在第 15 章中，我们通过使用智能指针 `Rc<T>` 来创建引用计数值，从而让一个值拥有多个所有者。让我们在这里做同样的事情，看看会发生什么。我们将在示例 16-14 中用 `Rc<T>` 包装 `Mutex<T>`，并在将所有权移入线程之前克隆 `Rc<T>`。

<Listing number="16-14" file-name="src/main.rs" caption="尝试使用 `Rc<T>` 来允许多个线程拥有 `Mutex<T>`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-14/src/main.rs}}
```

</Listing>

再次编译，我们得到了……不同的错误！编译器教会了我们很多：

```console
{{#include ../listings/ch16-fearless-concurrency/listing-16-14/output.txt}}
```

哇，这个错误信息真是冗长！以下是需要关注的重点部分：`` `Rc<Mutex<i32>>` cannot be sent between threads safely ``（`Rc<Mutex<i32>>` 不能在线程间安全地发送）。编译器还告诉了我们原因：`` the trait `Send` is not implemented for `Rc<Mutex<i32>>` ``（`Rc<Mutex<i32>>` 没有实现 `Send` trait）。我们将在下一节讨论 `Send`：它是确保我们在线程中使用的类型适用于并发场景的 trait 之一。

不幸的是，`Rc<T>` 在跨线程共享时并不安全。当 `Rc<T>` 管理引用计数时，它在每次调用 `clone` 时增加计数，在每个克隆被丢弃时减少计数。但它没有使用任何并发原语来确保计数的修改不会被另一个线程打断。这可能导致计数错误——这种微妙的 bug 可能进而导致内存泄漏或值在我们使用完之前就被丢弃。我们需要的是一个与 `Rc<T>` 完全相同，但以线程安全的方式修改引用计数的类型。

#### 使用 `Arc<T>` 进行原子引用计数

幸运的是，`Arc<T>` 正是一个类似于 `Rc<T>` 但可以安全地用于并发场景的类型。其中的 *a* 代表*原子*（atomic），意味着它是一个*原子引用计数*（atomically reference-counted）类型。原子类型是一种额外的并发原语，我们不会在这里详细介绍：请参阅标准库文档中的 [`std::sync::atomic`][atomic]<!-- ignore --> 以了解更多细节。此时你只需要知道，原子类型的工作方式类似于基本类型，但可以安全地在线程间共享。

你可能会想，为什么不是所有基本类型都是原子的，为什么标准库类型不默认使用 `Arc<T>` 呢？原因在于线程安全会带来性能开销，而你只想在确实需要时才付出这个代价。如果你只是在单线程中对值进行操作，不需要强制执行原子类型提供的保证，代码可以运行得更快。

让我们回到之前的示例：`Arc<T>` 和 `Rc<T>` 拥有相同的 API，所以我们只需修改 `use` 行、`new` 调用和 `clone` 调用即可修复程序。示例 16-15 中的代码终于可以编译并运行了。

<Listing number="16-15" file-name="src/main.rs" caption="使用 `Arc<T>` 包装 `Mutex<T>` 以便在多个线程间共享所有权">

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-15/src/main.rs}}
```

</Listing>

这段代码会打印如下内容：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
Result: 10
```

我们做到了！我们从 0 数到了 10，虽然这看起来并不是很了不起，但它确实教会了我们很多关于 `Mutex<T>` 和线程安全的知识。你也可以利用这个程序的结构来执行比简单递增计数器更复杂的操作。使用这种策略，你可以将计算拆分为独立的部分，将这些部分分配到不同的线程中，然后使用 `Mutex<T>` 让每个线程用其计算结果更新最终值。

注意，如果你只是做简单的数值运算，标准库的 [`std::sync::atomic` 模块][atomic]<!-- ignore -->提供了比 `Mutex<T>` 更简单的类型。这些类型提供了对基本类型的安全、并发、原子访问。在这个示例中，我们选择对基本类型使用 `Mutex<T>`，是为了专注于讲解 `Mutex<T>` 的工作原理。

<!-- Old headings. Do not remove or links may break. -->

<a id="similarities-between-refcelltrct-and-mutextarct"></a>

### `RefCell<T>`/`Rc<T>` 与 `Mutex<T>`/`Arc<T>` 的比较

你可能注意到了，`counter` 是不可变的，但我们却能获取其内部值的可变引用；这意味着 `Mutex<T>` 提供了内部可变性，就像 `Cell` 系列类型一样。正如我们在第 15 章中使用 `RefCell<T>` 来修改 `Rc<T>` 内部的内容一样，我们使用 `Mutex<T>` 来修改 `Arc<T>` 内部的内容。

另一个值得注意的细节是，Rust 无法保护你免受使用 `Mutex<T>` 时的所有逻辑错误。回忆一下第 15 章，使用 `Rc<T>` 存在创建循环引用的风险，即两个 `Rc<T>` 值相互引用，从而导致内存泄漏。类似地，`Mutex<T>` 也存在创建*死锁*（deadlock）的风险。当一个操作需要锁定两个资源，而两个线程各自持有其中一个锁时，就会导致它们永远互相等待。如果你对死锁感兴趣，可以尝试编写一个会产生死锁的 Rust 程序；然后研究任何语言中互斥器的死锁缓解策略，并尝试在 Rust 中实现它们。标准库中 `Mutex<T>` 和 `MutexGuard` 的 API 文档提供了有用的信息。

我们将以讨论 `Send` 和 `Sync` trait 以及如何将它们用于自定义类型来结束本章。

[atomic]: ../std/sync/atomic/index.html
