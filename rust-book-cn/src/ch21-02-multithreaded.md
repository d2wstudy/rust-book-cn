<!-- Old headings. Do not remove or links may break. -->

<a id="turning-our-single-threaded-server-into-a-multithreaded-server"></a>
<a id="from-single-threaded-to-multithreaded-server"></a>

## 从单线程服务器到多线程服务器

目前，服务器会依次处理每个请求，这意味着在第一个连接处理完成之前，它不会处理第二个连接。如果服务器收到越来越多的请求，这种串行执行方式的效率就会越来越低。如果服务器收到一个需要长时间处理的请求，后续的请求就必须等待这个耗时请求完成，即使新请求本身可以很快处理完毕。我们需要解决这个问题，但首先让我们来实际观察一下这个问题。

<!-- Old headings. Do not remove or links may break. -->

<a id="simulating-a-slow-request-in-the-current-server-implementation"></a>

### 模拟慢请求

我们来看看一个处理缓慢的请求会如何影响当前服务器实现中的其他请求。示例 21-10 实现了对 _/sleep_ 路径的请求处理，通过模拟慢响应让服务器在响应前休眠五秒。

<Listing number="21-10" file-name="src/main.rs" caption="通过休眠五秒来模拟慢请求">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-10/src/main.rs:here}}
```

</Listing>

我们将 `if` 改为了 `match`，因为现在有三种情况需要处理。我们需要显式地对 `request_line` 的切片进行模式匹配来与字符串字面值比较；`match` 不会像相等性方法那样自动进行引用和解引用。

第一个分支与示例 21-9 中的 `if` 代码块相同。第二个分支匹配对 _/sleep_ 的请求。当收到该请求时，服务器会先休眠五秒，然后再渲染成功的 HTML 页面。第三个分支与示例 21-9 中的 `else` 代码块相同。

可以看到我们的服务器有多么原始：真正的库会以更简洁的方式处理多种请求的识别！

使用 `cargo run` 启动服务器。然后打开两个浏览器窗口：一个访问 _http://127.0.0.1:7878_，另一个访问 _http://127.0.0.1:7878/sleep_。如果像之前一样多次访问 _/_ URI，你会看到它响应很快。但如果先访问 _/sleep_ 然后再加载 _/_，你会看到 _/_ 会一直等到 `sleep` 完成整整五秒的休眠后才加载。

有多种技术可以避免请求在慢请求后面排队等待，包括像第 17 章那样使用 async；我们将要实现的是线程池（thread pool）。

### 使用线程池提高吞吐量

**线程池**（thread pool）是一组预先创建好的、随时准备处理任务的线程。当程序收到一个新任务时，它会将池中的一个线程分配给该任务，该线程将处理这个任务。池中剩余的线程可以处理在第一个线程处理期间到来的其他任务。当第一个线程处理完任务后，它会返回到空闲线程池中，准备处理新任务。线程池允许你并发地处理连接，从而提高服务器的吞吐量。

我们会将池中的线程数量限制为一个较小的数字，以防止 DoS 攻击；如果让程序为每个请求都创建一个新线程，那么有人向服务器发送一千万个请求就可能耗尽服务器的所有资源，导致请求处理陷入停滞。

因此，我们不会无限制地创建线程，而是让固定数量的线程在池中等待。到来的请求会被发送到池中进行处理。池会维护一个传入请求的队列。池中的每个线程会从队列中取出一个请求，处理该请求，然后再向队列请求下一个任务。通过这种设计，我们可以并发处理最多 _`N`_ 个请求，其中 _`N`_ 是线程的数量。如果每个线程都在响应一个长时间运行的请求，后续请求仍然可能在队列中积压，但我们已经提高了在达到积压之前能够处理的长时间运行请求的数量。

这种技术只是提高 Web 服务器吞吐量的众多方法之一。你可能还想探索的其他方案包括 fork/join 模型、单线程异步 I/O 模型和多线程异步 I/O 模型。如果你对这个话题感兴趣，可以阅读更多关于其他解决方案的资料并尝试实现它们；对于像 Rust 这样的底层语言，所有这些方案都是可行的。

在开始实现线程池之前，让我们先讨论一下使用线程池应该是什么样子的。当你尝试设计代码时，先编写客户端接口有助于指导你的设计。先编写你希望调用的代码 API，使其结构符合你想要的调用方式；然后在该结构内实现功能，而不是先实现功能再设计公共 API。

类似于我们在第 12 章的项目中使用测试驱动开发的方式，这里我们将使用编译器驱动开发。我们先编写调用所需函数的代码，然后查看编译器的错误来确定接下来应该修改什么以使代码正常工作。不过在此之前，我们先来探索一种我们不会采用的技术作为起点。

<!-- Old headings. Do not remove or links may break. -->

<a id="code-structure-if-we-could-spawn-a-thread-for-each-request"></a>

#### 为每个请求创建一个线程

首先，让我们看看如果为每个连接都创建一个新线程，代码会是什么样子。如前所述，由于可能会无限制地创建线程，这不是我们的最终方案，但它是一个起点，可以先得到一个可工作的多线程服务器。然后我们再添加线程池作为改进，这样对比两种方案也更容易。

示例 21-11 展示了在 `for` 循环中为每个流创建新线程而需要对 `main` 做的修改。

<Listing number="21-11" file-name="src/main.rs" caption="为每个流创建一个新线程">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-11/src/main.rs:here}}
```

</Listing>

正如你在第 16 章中学到的，`thread::spawn` 会创建一个新线程，然后在新线程中运行闭包中的代码。如果你运行这段代码，在浏览器中先加载 _/sleep_，然后在另外两个标签页中加载 _/_，你确实会看到对 _/_ 的请求不必等待 _/sleep_ 完成。不过，正如我们提到的，这最终会压垮系统，因为你在毫无限制地创建新线程。

你可能还记得第 17 章提到过，这正是 async 和 await 真正大显身手的场景！在我们构建线程池时请记住这一点，并思考使用 async 时情况会有什么不同或相同之处。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-a-similar-interface-for-a-finite-number-of-threads"></a>

#### 创建有限数量的线程

我们希望线程池以类似且熟悉的方式工作，这样从直接使用线程切换到线程池时不需要对使用我们 API 的代码做大量修改。示例 21-12 展示了我们想要使用的 `ThreadPool` 结构体的理想接口，用来替代 `thread::spawn`。

<Listing number="21-12" file-name="src/main.rs" caption="我们理想的 `ThreadPool` 接口">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch21-web-server/listing-21-12/src/main.rs:here}}
```

</Listing>

我们使用 `ThreadPool::new` 来创建一个具有可配置线程数量的新线程池，这里是四个。然后，在 `for` 循环中，`pool.execute` 具有与 `thread::spawn` 类似的接口，它接受一个闭包，池会将其交给某个线程来运行。我们需要实现 `pool.execute`，使其接受闭包并将其交给池中的线程来运行。这段代码还无法编译，但我们会尝试编译，让编译器指导我们如何修复。

<!-- Old headings. Do not remove or links may break. -->

<a id="building-the-threadpool-struct-using-compiler-driven-development"></a>

#### 使用编译器驱动开发构建 `ThreadPool`

对 _src/main.rs_ 做示例 21-12 中的修改，然后让我们利用 `cargo check` 的编译器错误来驱动开发。以下是我们得到的第一个错误：

```console
{{#include ../listings/ch21-web-server/listing-21-12/output.txt}}
```

很好！这个错误告诉我们需要一个 `ThreadPool` 类型或模块，所以我们现在来构建一个。我们的 `ThreadPool` 实现将独立于 Web 服务器所做的具体工作。因此，让我们将 `hello` crate 从二进制 crate 切换为库 crate 来存放 `ThreadPool` 的实现。切换为库 crate 后，我们还可以将这个独立的线程池库用于任何需要使用线程池的工作，而不仅仅是处理 Web 请求。

创建一个 _src/lib.rs_ 文件，包含以下内容，这是目前我们能拥有的最简单的 `ThreadPool` 结构体定义：

<Listing file-name="src/lib.rs">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/no-listing-01-define-threadpool-struct/src/lib.rs}}
```

</Listing>

然后，编辑 _main.rs_ 文件，在 _src/main.rs_ 的顶部添加以下代码，将 `ThreadPool` 从库 crate 引入作用域：

<Listing file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch21-web-server/no-listing-01-define-threadpool-struct/src/main.rs:here}}
```

</Listing>

这段代码仍然无法工作，但让我们再次检查以获取下一个需要解决的错误：

```console
{{#include ../listings/ch21-web-server/no-listing-01-define-threadpool-struct/output.txt}}
```

这个错误表明接下来我们需要为 `ThreadPool` 创建一个名为 `new` 的关联函数。我们还知道 `new` 需要有一个能接受 `4` 作为实参的形参，并且应该返回一个 `ThreadPool` 实例。让我们实现具有这些特征的最简单的 `new` 函数：

<Listing file-name="src/lib.rs">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/no-listing-02-impl-threadpool-new/src/lib.rs}}
```

</Listing>

我们选择 `usize` 作为 `size` 参数的类型，因为负数的线程数量没有意义。我们还知道会将这个 `4` 用作线程集合中的元素数量，这正是 `usize` 类型的用途，如第 3 章["整数类型"][integer-types]<!-- ignore -->一节中所讨论的。

让我们再次检查代码：

```console
{{#include ../listings/ch21-web-server/no-listing-02-impl-threadpool-new/output.txt}}
```

现在的错误是因为 `ThreadPool` 上没有 `execute` 方法。回忆["创建有限数量的线程"](#creating-a-finite-number-of-threads)<!-- ignore -->一节，我们决定线程池应该有一个与 `thread::spawn` 类似的接口。此外，我们将实现 `execute` 函数，使其接受传入的闭包并将其交给池中的空闲线程来运行。

我们将在 `ThreadPool` 上定义 `execute` 方法，接受一个闭包作为参数。回忆第 13 章["将捕获的值移出闭包"][moving-out-of-closures]<!-- ignore -->一节，我们可以使用三种不同的 trait 来接受闭包作为参数：`Fn`、`FnMut` 和 `FnOnce`。我们需要决定这里使用哪种闭包。我们知道最终会做类似于标准库 `thread::spawn` 实现的事情，所以可以看看 `thread::spawn` 的签名对其参数有什么约束。文档向我们展示了以下内容：

```rust,ignore
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

这里我们关心的是 `F` 类型参数；`T` 类型参数与返回值有关，我们不关心它。可以看到 `spawn` 使用 `FnOnce` 作为 `F` 的 trait 约束。这可能也是我们想要的，因为我们最终会将 `execute` 中获得的参数传递给 `spawn`。我们可以进一步确信 `FnOnce` 是我们想要使用的 trait，因为运行请求的线程只会执行该请求的闭包一次，这与 `FnOnce` 中的 `Once` 相匹配。

`F` 类型参数还有 trait 约束 `Send` 和生命周期约束 `'static`，这在我们的场景中很有用：我们需要 `Send` 来将闭包从一个线程转移到另一个线程，需要 `'static` 是因为我们不知道线程需要多长时间来执行。让我们在 `ThreadPool` 上创建一个 `execute` 方法，它接受一个具有这些约束的 `F` 类型泛型参数：

<Listing file-name="src/lib.rs">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/no-listing-03-define-execute/src/lib.rs:here}}
```

</Listing>

我们仍然在 `FnOnce` 后面使用 `()`，因为这个 `FnOnce` 代表一个不接受参数且返回单元类型 `()` 的闭包。就像函数定义一样，返回类型可以从签名中省略，但即使没有参数，我们仍然需要括号。

同样，这是 `execute` 方法的最简实现：它什么都不做，但我们只是在尝试让代码编译通过。让我们再次检查：

```console
{{#include ../listings/ch21-web-server/no-listing-03-define-execute/output.txt}}
```

编译通过了！但请注意，如果你尝试 `cargo run` 并在浏览器中发起请求，你会看到我们在本章开头看到的那些错误。我们的库实际上还没有调用传递给 `execute` 的闭包！

> 注意：你可能听过关于像 Haskell 和 Rust 这样拥有严格编译器的语言的一句话："如果代码能编译，它就能工作。"但这句话并非普遍正确。我们的项目能编译，但它什么都没做！如果我们在构建一个真实的、完整的项目，现在是开始编写单元测试的好时机，以检查代码不仅能编译，而且具有我们想要的行为。

思考一下：如果我们要执行的是一个 future 而不是闭包，这里会有什么不同？

#### 在 `new` 中验证线程数量

我们没有对 `new` 和 `execute` 的参数做任何处理。让我们用我们想要的行为来实现这些函数的函数体。首先，让我们考虑 `new`。之前我们为 `size` 参数选择了无符号类型，因为线程数量为负数没有意义。然而，线程数量为零同样没有意义，但零是一个完全合法的 `usize` 值。我们将添加代码来检查 `size` 是否大于零，然后再返回 `ThreadPool` 实例，并在收到零时使用 `assert!` 宏让程序 panic，如示例 21-13 所示。

<Listing number="21-13" file-name="src/lib.rs" caption="实现 `ThreadPool::new`，当 `size` 为零时 panic">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-13/src/lib.rs:here}}
```

</Listing>

我们还用文档注释为 `ThreadPool` 添加了一些文档。注意我们遵循了良好的文档实践，添加了一个说明函数可能 panic 的情况的部分，如第 14 章所讨论的。尝试运行 `cargo doc --open` 并点击 `ThreadPool` 结构体，看看为 `new` 生成的文档是什么样的！

除了像这里这样添加 `assert!` 宏，我们还可以将 `new` 改为 `build` 并返回一个 `Result`，就像我们在第 12 章示例 12-9 中的 I/O 项目中对 `Config::build` 所做的那样。但在这种情况下，我们决定尝试创建一个没有任何线程的线程池应该是一个不可恢复的错误。如果你有兴趣挑战一下，可以尝试编写一个具有以下签名的 `build` 函数，与 `new` 函数进行对比：

```rust,ignore
pub fn build(size: usize) -> Result<ThreadPool, PoolCreationError> {
```

#### 创建存储线程的空间

现在我们有了一种方法来确保存储在池中的线程数量是有效的，我们可以创建这些线程并在返回 `ThreadPool` 结构体之前将它们存储在其中。但是我们如何"存储"一个线程呢？让我们再看看 `thread::spawn` 的签名：

```rust,ignore
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

`spawn` 函数返回一个 `JoinHandle<T>`，其中 `T` 是闭包返回的类型。让我们也尝试使用 `JoinHandle`，看看会怎样。在我们的场景中，传递给线程池的闭包会处理连接但不返回任何内容，所以 `T` 将是单元类型 `()`。

示例 21-14 中的代码可以编译，但还不会创建任何线程。我们修改了 `ThreadPool` 的定义，使其持有一个 `thread::JoinHandle<()>` 实例的向量，用 `size` 的容量初始化了向量，设置了一个 `for` 循环来运行创建线程的代码，并返回一个包含这些线程的 `ThreadPool` 实例。

<Listing number="21-14" file-name="src/lib.rs" caption="为 `ThreadPool` 创建一个向量来存放线程">

```rust,ignore,not_desired_behavior
{{#rustdoc_include ../listings/ch21-web-server/listing-21-14/src/lib.rs:here}}
```

</Listing>

我们在库 crate 中引入了 `std::thread`，因为我们在 `ThreadPool` 的向量中使用 `thread::JoinHandle` 作为元素类型。

一旦收到有效的 size，我们的 `ThreadPool` 就会创建一个可以容纳 `size` 个元素的新向量。`with_capacity` 函数执行与 `Vec::new` 相同的任务，但有一个重要区别：它会预先在向量中分配空间。因为我们知道需要在向量中存储 `size` 个元素，预先分配比使用 `Vec::new`（在插入元素时自行调整大小）稍微高效一些。

当你再次运行 `cargo check` 时，应该会成功。

<!-- Old headings. Do not remove or links may break. -->
<a id ="a-worker-struct-responsible-for-sending-code-from-the-threadpool-to-a-thread"></a>

#### 从 `ThreadPool` 向线程发送代码

我们在示例 21-14 的 `for` 循环中留了一个关于创建线程的注释。这里我们来看看如何实际创建线程。标准库提供了 `thread::spawn` 来创建线程，`thread::spawn` 期望在线程创建时就获得线程应该运行的代码。然而在我们的场景中，我们希望创建线程后让它们**等待**我们稍后发送的代码。标准库的线程实现不包含这种功能；我们需要手动实现它。

我们将通过在 `ThreadPool` 和线程之间引入一个新的数据结构来管理这种新行为，我们称之为 **Worker**，这是池化实现中的常用术语。`Worker` 会取出需要运行的代码并在其线程中运行。

想象一下在餐厅厨房工作的人：工人们等待顾客的订单到来，然后负责接单并完成订单。

我们不再在线程池中存储 `JoinHandle<()>` 实例的向量，而是存储 `Worker` 结构体的实例。每个 `Worker` 会存储一个 `JoinHandle<()>` 实例。然后我们会在 `Worker` 上实现一个方法，该方法接受要运行的代码闭包并将其发送给已经运行的线程来执行。我们还会给每个 `Worker` 一个 `id`，以便在日志记录或调试时区分池中不同的 `Worker` 实例。

以下是创建 `ThreadPool` 时将要发生的新流程。在以这种方式设置好 `Worker` 之后，我们将实现将闭包发送给线程的代码：

1. 定义一个 `Worker` 结构体，持有一个 `id` 和一个 `JoinHandle<()>`。
2. 修改 `ThreadPool` 使其持有一个 `Worker` 实例的向量。
3. 定义一个 `Worker::new` 函数，接受一个 `id` 数字并返回一个 `Worker` 实例，该实例持有 `id` 和一个用空闭包创建的线程。
4. 在 `ThreadPool::new` 中，使用 `for` 循环计数器生成 `id`，用该 `id` 创建一个新的 `Worker`，并将 `Worker` 存储在向量中。

如果你想挑战一下，可以在查看示例 21-15 中的代码之前，尝试自己实现这些修改。

准备好了吗？以下是示例 21-15，展示了实现上述修改的一种方式。

<Listing number="21-15" file-name="src/lib.rs" caption="修改 `ThreadPool` 使其持有 `Worker` 实例而非直接持有线程">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-15/src/lib.rs:here}}
```

</Listing>

我们将 `ThreadPool` 上的字段名从 `threads` 改为了 `workers`，因为它现在持有的是 `Worker` 实例而非 `JoinHandle<()>` 实例。我们使用 `for` 循环中的计数器作为 `Worker::new` 的参数，并将每个新的 `Worker` 存储在名为 `workers` 的向量中。

外部代码（如 _src/main.rs_ 中的服务器）不需要知道 `ThreadPool` 内部使用 `Worker` 结构体的实现细节，所以我们将 `Worker` 结构体及其 `new` 函数设为私有。`Worker::new` 函数使用我们给它的 `id`，并存储一个通过空闭包创建新线程而得到的 `JoinHandle<()>` 实例。

> 注意：如果操作系统因为没有足够的系统资源而无法创建线程，`thread::spawn` 会 panic。这会导致整个服务器 panic，即使某些线程的创建可能已经成功。为了简单起见，这种行为是可以接受的，但在生产环境的线程池实现中，你可能会想使用 [`std::thread::Builder`][builder]<!-- ignore --> 及其返回 `Result` 的 [`spawn`][builder-spawn]<!-- ignore --> 方法。

这段代码可以编译，并且会存储我们指定给 `ThreadPool::new` 的 `Worker` 实例数量。但我们**仍然**没有处理在 `execute` 中获得的闭包。接下来让我们看看如何做到这一点。

#### 通过通道向线程发送请求

接下来我们要解决的问题是，传递给 `thread::spawn` 的闭包什么都没做。目前，我们在 `execute` 方法中获得了想要执行的闭包。但我们需要在创建 `ThreadPool` 期间创建每个 `Worker` 时，给 `thread::spawn` 一个要运行的闭包。

我们希望刚创建的 `Worker` 结构体从 `ThreadPool` 持有的队列中获取要运行的代码，并将该代码发送给其线程来运行。

我们在第 16 章中学到的通道——一种在两个线程之间通信的简单方式——非常适合这个用例。我们将使用通道作为任务队列，`execute` 会从 `ThreadPool` 向 `Worker` 实例发送任务，`Worker` 再将任务发送给其线程。以下是计划：

1. `ThreadPool` 创建一个通道并持有发送端。
2. 每个 `Worker` 持有接收端。
3. 我们创建一个新的 `Job` 结构体来持有要通过通道发送的闭包。
4. `execute` 方法通过发送端发送想要执行的任务。
5. 在其线程中，`Worker` 会循环接收端并执行收到的任务的闭包。

让我们从在 `ThreadPool::new` 中创建通道并让 `ThreadPool` 实例持有发送端开始，如示例 21-16 所示。`Job` 结构体目前不持有任何内容，但它将是我们通过通道发送的项的类型。

<Listing number="21-16" file-name="src/lib.rs" caption="修改 `ThreadPool` 以存储传输 `Job` 实例的通道发送端">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-16/src/lib.rs:here}}
```

</Listing>

在 `ThreadPool::new` 中，我们创建了新的通道，并让池持有发送端。这段代码可以成功编译。

让我们尝试在线程池创建通道时将接收端传递给每个 `Worker`。我们知道要在 `Worker` 实例创建的线程中使用接收端，所以我们将在闭包中引用 `receiver` 参数。示例 21-17 中的代码还不能完全编译。

<Listing number="21-17" file-name="src/lib.rs" caption="将接收端传递给每个 `Worker`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch21-web-server/listing-21-17/src/lib.rs:here}}
```

</Listing>

我们做了一些小而直接的修改：将接收端传入 `Worker::new`，然后在闭包中使用它。

当我们尝试检查这段代码时，会得到这个错误：

```console
{{#include ../listings/ch21-web-server/listing-21-17/output.txt}}
```

这段代码试图将 `receiver` 传递给多个 `Worker` 实例。这行不通，你应该还记得第 16 章的内容：Rust 提供的通道实现是多**生产者**、单**消费者**的。这意味着我们不能简单地克隆通道的消费端来修复这段代码。我们也不想将一条消息发送给多个消费者；我们想要的是一个消息列表配合多个 `Worker` 实例，使每条消息只被处理一次。

此外，从通道队列中取出任务涉及对 `receiver` 的修改，所以线程需要一种安全的方式来共享和修改 `receiver`；否则可能会出现竞态条件（如第 16 章所述）。

回忆第 16 章讨论的线程安全智能指针：要在多个线程之间共享所有权并允许线程修改值，我们需要使用 `Arc<Mutex<T>>`。`Arc` 类型让多个 `Worker` 实例拥有接收端的所有权，`Mutex` 确保同一时间只有一个 `Worker` 从接收端获取任务。示例 21-18 展示了我们需要做的修改。

<Listing number="21-18" file-name="src/lib.rs" caption="使用 `Arc` 和 `Mutex` 在 `Worker` 实例之间共享接收端">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-18/src/lib.rs:here}}
```

</Listing>

在 `ThreadPool::new` 中，我们将接收端放入 `Arc` 和 `Mutex` 中。对于每个新的 `Worker`，我们克隆 `Arc` 以增加引用计数，这样 `Worker` 实例就可以共享接收端的所有权。

通过这些修改，代码可以编译了！我们快要完成了！

#### 实现 `execute` 方法

让我们最终实现 `ThreadPool` 上的 `execute` 方法。我们还将把 `Job` 从结构体改为一个 trait 对象的类型别名，该 trait 对象持有 `execute` 接收的闭包类型。如第 20 章["类型同义词和类型别名"][type-aliases]<!-- ignore -->一节所讨论的，类型别名允许我们将长类型缩短以便于使用。请看示例 21-19。

<Listing number="21-19" file-name="src/lib.rs" caption="为持有每个闭包的 `Box` 创建 `Job` 类型别名，然后将任务通过通道发送">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-19/src/lib.rs:here}}
```

</Listing>

在使用 `execute` 中获得的闭包创建新的 `Job` 实例后，我们将该任务通过通道的发送端发送出去。我们对 `send` 调用了 `unwrap`，以防发送失败。例如，如果我们停止了所有线程的执行，接收端就会停止接收新消息，此时发送就会失败。目前我们无法停止线程的执行：只要池存在，线程就会继续执行。我们使用 `unwrap` 是因为我们知道失败的情况不会发生，但编译器并不知道这一点。

但我们还没有完全完成！在 `Worker` 中，传递给 `thread::spawn` 的闭包仍然只是**引用**了通道的接收端。相反，我们需要闭包永远循环，向通道的接收端请求任务，并在收到任务时执行。让我们对 `Worker::new` 做示例 21-20 所示的修改。

<Listing number="21-20" file-name="src/lib.rs" caption="在 `Worker` 实例的线程中接收并执行任务">

```rust,noplayground
{{#rustdoc_include ../listings/ch21-web-server/listing-21-20/src/lib.rs:here}}
```

</Listing>

这里，我们首先对 `receiver` 调用 `lock` 来获取互斥锁，然后调用 `unwrap` 在出错时 panic。如果互斥锁处于**中毒**（poisoned）状态，获取锁可能会失败——当其他线程在持有锁时 panic 而没有释放锁时就会发生这种情况。在这种情况下，调用 `unwrap` 让当前线程 panic 是正确的做法。你可以随意将这个 `unwrap` 改为带有对你有意义的错误消息的 `expect`。

如果我们获得了互斥锁，就调用 `recv` 从通道接收一个 `Job`。最后一个 `unwrap` 同样跳过了这里可能出现的错误，如果持有发送端的线程已经关闭，就可能发生错误，类似于接收端关闭时 `send` 方法返回 `Err` 的情况。

调用 `recv` 会阻塞，所以如果还没有任务，当前线程会等待直到有任务可用。`Mutex<T>` 确保同一时间只有一个 `Worker` 线程在尝试请求任务。

我们的线程池现在处于可工作状态了！运行 `cargo run` 并发起一些请求试试：

<!-- manual-regeneration
cd listings/ch21-web-server/listing-21-20
cargo run
make some requests to 127.0.0.1:7878
Can't automate because the output depends on making requests
-->

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
warning: field `workers` is never read
 --> src/lib.rs:7:5
  |
6 | pub struct ThreadPool {
  |            ---------- field in this struct
7 |     workers: Vec<Worker>,
  |     ^^^^^^^
  |
  = note: `#[warn(dead_code)]` on by default

warning: fields `id` and `thread` are never read
  --> src/lib.rs:48:5
   |
47 | struct Worker {
   |        ------ fields in this struct
48 |     id: usize,
   |     ^^
49 |     thread: thread::JoinHandle<()>,
   |     ^^^^^^

warning: `hello` (lib) generated 2 warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.91s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
```

成功了！我们现在有了一个异步执行连接的线程池。创建的线程永远不会超过四个，所以即使服务器收到大量请求，系统也不会过载。如果我们向 _/sleep_ 发起请求，服务器可以通过让另一个线程来处理其他请求。

> 注意：如果你在多个浏览器窗口中同时打开 _/sleep_，它们可能会以五秒为间隔逐个加载。某些浏览器出于缓存原因会顺序执行同一请求的多个实例。这个限制不是由我们的 Web 服务器造成的。

现在是暂停思考的好时机：如果我们使用 future 而不是闭包来完成工作，示例 21-18、21-19 和 21-20 中的代码会有什么不同？哪些类型会改变？方法签名会有什么不同（如果有的话）？哪些部分的代码会保持不变？

在学习了第 17 章和第 19 章中的 `while let` 循环之后，你可能会想为什么我们没有像示例 21-21 那样编写 `Worker` 线程的代码。

<Listing number="21-21" file-name="src/lib.rs" caption="使用 `while let` 的 `Worker::new` 替代实现">

```rust,ignore,not_desired_behavior
{{#rustdoc_include ../listings/ch21-web-server/listing-21-21/src/lib.rs:here}}
```

</Listing>

这段代码可以编译和运行，但不会产生期望的线程行为：慢请求仍然会导致其他请求等待处理。原因比较微妙：`Mutex` 结构体没有公共的 `unlock` 方法，因为锁的所有权基于 `lock` 方法返回的 `LockResult<MutexGuard<T>>` 中 `MutexGuard<T>` 的生命周期。在编译时，借用检查器可以强制执行这样的规则：除非持有锁，否则不能访问由 `Mutex` 保护的资源。然而，如果我们不注意 `MutexGuard<T>` 的生命周期，这种实现也可能导致锁被持有的时间超出预期。

示例 21-20 中使用 `let job = receiver.lock().unwrap().recv().unwrap();` 的代码之所以有效，是因为使用 `let` 时，等号右侧表达式中使用的任何临时值会在 `let` 语句结束时立即被丢弃。然而，`while let`（以及 `if let` 和 `match`）不会在关联代码块结束之前丢弃临时值。在示例 21-21 中，锁在整个 `job()` 调用期间都被持有，这意味着其他 `Worker` 实例无法接收任务。

[type-aliases]: ch20-03-advanced-types.html#type-synonyms-and-type-aliases
[integer-types]: ch03-02-data-types.html#integer-types
[moving-out-of-closures]: ch13-01-closures.html#moving-captured-values-out-of-closures
[builder]: ../std/thread/struct.Builder.html
[builder-spawn]: ../std/thread/struct.Builder.html#method.spawn
