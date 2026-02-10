<!-- Old headings. Do not remove or links may break. -->

<a id="using-message-passing-to-transfer-data-between-threads"></a>

## 使用消息传递在线程间传输数据

一种日益流行的确保安全并发的方法是**消息传递**（message passing），即线程或 actor 通过互相发送包含数据的消息来进行通信。以下是 [Go 语言文档](https://golang.org/doc/effective_go.html#concurrency)中的一句口号："不要通过共享内存来通信；而是通过通信来共享内存。"

为了实现消息发送式的并发，Rust 标准库提供了**通道**（channel）的实现。通道是一个通用的编程概念，通过它可以将数据从一个线程发送到另一个线程。

你可以把编程中的通道想象成一条有方向的水道，比如一条小溪或河流。如果你把一只橡皮鸭放入河中，它会顺流而下到达水道的尽头。

通道有两个部分：发送端（transmitter）和接收端（receiver）。发送端是你把橡皮鸭放入河流的上游位置，接收端是橡皮鸭最终到达的下游位置。代码的一部分调用发送端的方法来发送数据，另一部分则检查接收端是否有消息到达。当发送端或接收端中的任何一个被丢弃时，通道就被认为是**关闭**的。

接下来，我们将逐步构建一个程序：一个线程生成值并通过通道发送，另一个线程接收这些值并打印出来。我们将通过通道在线程之间发送简单的值来演示这个功能。一旦你熟悉了这项技术，就可以将通道用于任何需要相互通信的线程，例如聊天系统或多个线程各自执行部分计算并将结果发送给一个汇总线程的系统。

首先，在示例 16-6 中，我们将创建一个通道但不对它做任何操作。注意这还不能编译，因为 Rust 无法判断我们想通过通道发送什么类型的值。

<Listing number="16-6" file-name="src/main.rs" caption="创建一个通道，并将两端分别赋值给 `tx` 和 `rx`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-06/src/main.rs}}
```

</Listing>

我们使用 `mpsc::channel` 函数创建一个新通道；`mpsc` 代表**多生产者，单消费者**（multiple producer, single consumer）。简而言之，Rust 标准库实现通道的方式意味着一个通道可以有多个产生值的**发送端**，但只能有一个消费这些值的**接收端**。想象多条小溪汇入一条大河：任何一条小溪中送出的东西最终都会到达同一条大河中。我们先从单个生产者开始，等这个例子运行起来后再添加多个生产者。

`mpsc::channel` 函数返回一个元组，第一个元素是发送端——即发送器（transmitter），第二个元素是接收端——即接收器（receiver）。缩写 `tx` 和 `rx` 在许多领域中传统上分别用于表示**发送器**和**接收器**，因此我们用这些名称来命名变量以表示各自的端。我们使用了带有模式的 `let` 语句来解构元组；我们将在第 19 章讨论 `let` 语句中模式的使用和解构。目前只需知道，以这种方式使用 `let` 语句是提取 `mpsc::channel` 返回的元组各部分的便捷方法。

让我们将发送端移动到一个新创建的线程中，让它发送一个字符串，这样新创建的线程就能与主线程通信了，如示例 16-7 所示。这就像在河流上游放入一只橡皮鸭，或者从一个线程向另一个线程发送一条聊天消息。

<Listing number="16-7" file-name="src/main.rs" caption='将 `tx` 移动到新创建的线程中并发送 `"hi"`'>

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-07/src/main.rs}}
```

</Listing>

同样，我们使用 `thread::spawn` 创建一个新线程，然后使用 `move` 将 `tx` 移动到闭包中，这样新创建的线程就拥有了 `tx`。新创建的线程需要拥有发送器才能通过通道发送消息。

发送器有一个 `send` 方法，接受我们想要发送的值。`send` 方法返回一个 `Result<T, E>` 类型，所以如果接收端已经被丢弃，没有地方可以发送值，发送操作就会返回一个错误。在这个例子中，我们调用 `unwrap` 在出错时 panic。但在实际应用中，我们应该正确处理它：回顾第 9 章了解正确的错误处理策略。

在示例 16-8 中，我们将在主线程中从接收端获取值。这就像从河流尽头的水中取回橡皮鸭，或者接收一条聊天消息。

<Listing number="16-8" file-name="src/main.rs" caption='在主线程中接收值 `"hi"` 并打印它'>

```rust
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-08/src/main.rs}}
```

</Listing>

接收器有两个有用的方法：`recv` 和 `try_recv`。我们使用的是 `recv`，它是 _receive_ 的缩写，它会阻塞主线程的执行并等待，直到有值通过通道发送过来。一旦有值被发送，`recv` 会将其包装在 `Result<T, E>` 中返回。当发送器关闭时，`recv` 会返回一个错误，表示不会再有更多的值到来。

`try_recv` 方法不会阻塞，而是立即返回一个 `Result<T, E>`：如果有消息可用则返回包含消息的 `Ok` 值，如果此时没有任何消息则返回 `Err` 值。如果线程在等待消息的同时还有其他工作要做，使用 `try_recv` 就很有用：我们可以编写一个循环，每隔一段时间调用一次 `try_recv`，有消息时处理消息，否则做一会儿其他工作，然后再次检查。

在这个例子中，为了简单起见我们使用了 `recv`；主线程除了等待消息之外没有其他工作要做，所以阻塞主线程是合适的。

当我们运行示例 16-8 中的代码时，我们会看到主线程打印出的值：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
Got: hi
```

很好！

<!-- Old headings. Do not remove or links may break. -->

<a id="channels-and-ownership-transference"></a>

### 通过通道转移所有权

所有权规则在消息发送中扮演着至关重要的角色，因为它们帮助你编写安全的并发代码。在整个 Rust 程序中思考所有权的好处就是能够防止并发编程中的错误。让我们做一个实验来展示通道和所有权如何协同工作以防止问题：我们将尝试在新创建的线程中，在通过通道发送 `val` 值**之后**再使用它。尝试编译示例 16-9 中的代码，看看为什么这段代码是不被允许的。

<Listing number="16-9" file-name="src/main.rs" caption="在通过通道发送 `val` 之后尝试使用它">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-09/src/main.rs}}
```

</Listing>

这里，我们尝试在通过 `tx.send` 将 `val` 发送到通道之后打印它。允许这样做是一个坏主意：一旦值被发送到另一个线程，那个线程可能会在我们再次使用该值之前修改或丢弃它。其他线程的修改可能会由于数据不一致或不存在而导致错误或意外结果。然而，如果我们尝试编译示例 16-9 中的代码，Rust 会给出一个错误：

```console
{{#include ../listings/ch16-fearless-concurrency/listing-16-09/output.txt}}
```

我们的并发错误导致了一个编译时错误。`send` 函数获取其参数的所有权，当值被移动后，接收端就获取了它的所有权。这阻止了我们在发送后意外地再次使用该值；所有权系统会检查一切是否正确。

<!-- Old headings. Do not remove or links may break. -->

<a id="sending-multiple-values-and-seeing-the-receiver-waiting"></a>

### 发送多个值

示例 16-8 中的代码可以编译和运行，但它没有清楚地展示两个独立的线程正在通过通道互相通信。

在示例 16-10 中，我们做了一些修改来证明示例 16-8 中的代码是并发运行的：新创建的线程现在会发送多条消息，并在每条消息之间暂停一秒。

<Listing number="16-10" file-name="src/main.rs" caption="发送多条消息，并在每条消息之间暂停">

```rust,noplayground
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-10/src/main.rs}}
```

</Listing>

这次，新创建的线程有一个字符串 vector，我们想将它们发送到主线程。我们遍历它们，逐个发送，并通过调用 `thread::sleep` 函数并传入一秒的 `Duration` 值来在每次发送之间暂停。

在主线程中，我们不再显式调用 `recv` 函数：而是将 `rx` 当作迭代器使用。对于每个接收到的值，我们将其打印出来。当通道关闭时，迭代将结束。

运行示例 16-10 中的代码时，你应该会看到以下输出，每行之间有一秒的停顿：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
Got: hi
Got: from
Got: the
Got: thread
```

因为主线程的 `for` 循环中没有任何暂停或延迟的代码，所以我们可以看出主线程是在等待从新创建的线程接收值。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-multiple-producers-by-cloning-the-transmitter"></a>

### 创建多个生产者

之前我们提到 `mpsc` 是 _multiple producer, single consumer_ 的缩写。让我们使用 `mpsc` 来扩展示例 16-10 中的代码，创建多个线程，它们都向同一个接收端发送值。我们可以通过克隆发送器来实现，如示例 16-11 所示。

<Listing number="16-11" file-name="src/main.rs" caption="从多个生产者发送多条消息">

```rust,noplayground
{{#rustdoc_include ../listings/ch16-fearless-concurrency/listing-16-11/src/main.rs:here}}
```

</Listing>

这次，在创建第一个新线程之前，我们对发送器调用了 `clone`。这会给我们一个新的发送器，我们可以将它传递给第一个新创建的线程。我们将原始的发送器传递给第二个新创建的线程。这样我们就有了两个线程，每个线程向同一个接收端发送不同的消息。

运行这段代码时，你的输出应该类似于：

<!-- Not extracting output because changes to this output aren't significant;
the changes are likely to be due to the threads running differently rather than
changes in the compiler -->

```text
Got: hi
Got: more
Got: from
Got: messages
Got: for
Got: the
Got: thread
Got: you
```

你可能会看到不同的顺序，这取决于你的系统。这正是并发既有趣又困难的地方。如果你尝试使用 `thread::sleep`，在不同的线程中给它不同的值，每次运行将更加不确定，每次都会产生不同的输出。

现在我们已经了解了通道的工作方式，让我们来看看另一种不同的并发方法。