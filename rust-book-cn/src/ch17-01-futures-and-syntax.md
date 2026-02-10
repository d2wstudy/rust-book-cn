## Future 与异步语法

Rust 异步编程的关键要素是 _future_ 以及 Rust 的 `async` 和 `await` 关键字。

_future_ 是一个现在可能还没有准备好、但将来某个时刻会准备好的值。（这个概念在许多语言中都有出现，有时使用其他名称，如 _task_ 或 _promise_。）Rust 提供了 `Future` trait 作为构建基础，使得不同的异步操作可以用不同的数据结构来实现，但共享统一的接口。在 Rust 中，future 是实现了 `Future` trait 的类型。每个 future 都持有自己的进度信息以及"准备好"的含义。

你可以将 `async` 关键字应用于代码块和函数，以指定它们可以被中断和恢复。在异步代码块或异步函数内部，你可以使用 `await` 关键字来 _等待一个 future_（即等待它变为就绪状态）。在异步代码块或函数中，每个等待 future 的位置都是该代码块或函数可能暂停和恢复的潜在点。检查一个 future 的值是否已经可用的过程称为 _轮询（polling）_。

其他一些语言，如 C# 和 JavaScript，也使用 `async` 和 `await` 关键字进行异步编程。如果你熟悉这些语言，你可能会注意到 Rust 在语法处理上有一些显著的不同。这是有充分理由的，我们后面会看到！

在编写异步 Rust 代码时，我们大部分时间都在使用 `async` 和 `await` 关键字。Rust 会将它们编译为使用 `Future` trait 的等效代码，就像它将 `for` 循环编译为使用 `Iterator` trait 的等效代码一样。因为 Rust 提供了 `Future` trait，你也可以在需要时为自己的数据类型实现它。我们在本章中看到的许多函数都返回带有自己 `Future` 实现的类型。我们将在本章末尾回到该 trait 的定义，并深入探讨它的工作原理，但目前这些细节已经足够让我们继续前进了。

这些内容可能感觉有点抽象，所以让我们来编写第一个异步程序：一个小型网页抓取器。我们将从命令行传入两个 URL，并发地获取它们，然后返回先完成的那个的结果。这个示例会有不少新语法，但别担心——我们会在过程中解释你需要知道的一切。

## 我们的第一个异步程序

为了让本章的重点放在学习异步上，而不是纠结于生态系统的各个部分，我们创建了 `trpl` crate（`trpl` 是 "The Rust Programming Language" 的缩写）。它重新导出了你需要的所有类型、trait 和函数，主要来自 [`futures`][futures-crate]<!-- ignore --> 和 [`tokio`][tokio]<!-- ignore --> crate。`futures` crate 是 Rust 异步代码实验的官方基地，`Future` trait 最初就是在那里设计的。Tokio 是目前 Rust 中使用最广泛的异步运行时，尤其是在 Web 应用方面。还有其他优秀的运行时，它们可能更适合你的用途。我们在 `trpl` 底层使用 `tokio` crate，因为它经过了充分测试且被广泛使用。

在某些情况下，`trpl` 还会重命名或包装原始 API，以便让你专注于本章相关的细节。如果你想了解这个 crate 做了什么，我们鼓励你查看[它的源代码][crate-source]。你将能够看到每个重新导出来自哪个 crate，我们也留下了详尽的注释来解释这个 crate 的功能。

创建一个名为 `hello-async` 的新二进制项目，并添加 `trpl` crate 作为依赖：

```console
$ cargo new hello-async
$ cd hello-async
$ cargo add trpl
```

现在我们可以使用 `trpl` 提供的各种组件来编写我们的第一个异步程序了。我们将构建一个小型命令行工具，它获取两个网页，从每个网页中提取 `<title>` 元素，然后打印出先完成整个过程的那个页面的标题。

### 定义 page_title 函数

让我们从编写一个函数开始，它接受一个页面 URL 作为参数，向该 URL 发起请求，并返回 `<title>` 元素的文本（见示例 17-1）。

<Listing number="17-1" file-name="src/main.rs" caption="定义一个异步函数，从 HTML 页面中获取 title 元素">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-01/src/main.rs:all}}
```

</Listing>

首先，我们定义了一个名为 `page_title` 的函数，并用 `async` 关键字标记它。然后我们使用 `trpl::get` 函数获取传入的 URL，并使用 `await` 关键字等待响应。为了获取响应的文本内容，我们调用其 `text` 方法，并再次使用 `await` 关键字等待它。这两个步骤都是异步的。对于 `get` 函数，我们需要等待服务器发回响应的第一部分，其中包括 HTTP 头、cookie 等，这些可以与响应体分开传送。特别是当响应体非常大时，接收全部内容可能需要一些时间。因为我们必须等待 _整个_ 响应到达，所以 `text` 方法也是异步的。

我们必须显式地等待这两个 future，因为 Rust 中的 future 是 _惰性的_：在你使用 `await` 关键字要求它们执行之前，它们不会做任何事情。（实际上，如果你不使用一个 future，Rust 会显示编译器警告。）这可能会让你想起第 13 章["使用迭代器处理元素系列"][iterators-lazy]<!-- ignore -->一节中关于迭代器的讨论。迭代器在你调用它们的 `next` 方法之前什么也不做——无论是直接调用还是通过使用 `for` 循环或底层调用 `next` 的 `map` 等方法。同样，future 在你显式要求之前也什么都不做。这种惰性特性允许 Rust 在实际需要之前避免运行异步代码。

> 注意：这与我们在第 16 章["使用 spawn 创建新线程"][thread-spawn]<!-- ignore -->一节中使用 `thread::spawn` 时看到的行为不同，在那里我们传递给另一个线程的闭包会立即开始运行。这也与许多其他语言处理异步的方式不同。但对于 Rust 来说，能够提供其性能保证是很重要的，就像迭代器一样。

一旦我们有了 `response_text`，就可以使用 `Html::parse` 将其解析为 `Html` 类型的实例。我们现在拥有的不再是原始字符串，而是一个可以用来将 HTML 作为更丰富的数据结构进行操作的数据类型。特别是，我们可以使用 `select_first` 方法来查找给定 CSS 选择器的第一个实例。通过传入字符串 `"title"`，我们将获取文档中的第一个 `<title>` 元素（如果有的话）。因为可能没有任何匹配的元素，`select_first` 返回一个 `Option<ElementRef>`。最后，我们使用 `Option::map` 方法，它让我们在 `Option` 中有值时对其进行操作，没有值时则什么也不做。（我们也可以在这里使用 `match` 表达式，但 `map` 更符合惯用写法。）在我们提供给 `map` 的函数体中，我们对 `title` 调用 `inner_html` 来获取其内容，这是一个 `String`。最终，我们得到一个 `Option<String>`。

注意 Rust 的 `await` 关键字放在你要等待的表达式 _之后_，而不是之前。也就是说，它是一个 _后缀_ 关键字。如果你在其他语言中使用过 `async`，这可能与你习惯的不同，但在 Rust 中这使得方法链式调用更加方便。因此，我们可以将 `page_title` 的函数体改为将 `trpl::get` 和 `text` 函数调用用 `await` 链接在一起，如示例 17-2 所示。

<Listing number="17-2" file-name="src/main.rs" caption="使用 `await` 关键字进行链式调用">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-02/src/main.rs:chaining}}
```

</Listing>

这样，我们就成功编写了第一个异步函数！在我们向 `main` 中添加代码来调用它之前，让我们再多谈谈我们写了什么以及它意味着什么。

当 Rust 看到一个用 `async` 关键字标记的 _代码块_ 时，它会将其编译为一个实现了 `Future` trait 的唯一匿名数据类型。当 Rust 看到一个用 `async` 标记的 _函数_ 时，它会将其编译为一个非异步函数，该函数的函数体是一个异步代码块。异步函数的返回类型是编译器为该异步代码块创建的匿名数据类型。

因此，编写 `async fn` 等同于编写一个返回返回类型的 _future_ 的函数。对编译器来说，示例 17-1 中 `async fn page_title` 这样的函数定义大致等同于如下定义的非异步函数：

```rust
# extern crate trpl; // required for mdbook test
use std::future::Future;
use trpl::Html;

fn page_title(url: &str) -> impl Future<Output = Option<String>> {
    async move {
        let text = trpl::get(url).await.text().await;
        Html::parse(&text)
            .select_first("title")
            .map(|title| title.inner_html())
    }
}
```

让我们逐一分析转换后版本的各个部分：

- 它使用了我们在第 10 章["trait 作为参数"][impl-trait]<!-- ignore -->一节中讨论过的 `impl Trait` 语法。
- 返回值实现了 `Future` trait，其关联类型为 `Output`。注意 `Output` 类型是 `Option<String>`，与 `page_title` 的 `async fn` 版本的原始返回类型相同。
- 原始函数体中调用的所有代码都被包装在一个 `async move` 块中。记住，代码块是表达式。整个代码块就是函数返回的表达式。
- 这个异步代码块产生一个类型为 `Option<String>` 的值，如上所述。该值与返回类型中的 `Output` 类型匹配。这与你见过的其他代码块一样。
- 新的函数体是一个 `async move` 块，因为它使用了 `url` 参数。（我们将在本章后面更多地讨论 `async` 与 `async move` 的区别。）

现在我们可以在 `main` 中调用 `page_title` 了。

<!-- Old headings. Do not remove or links may break. -->

<a id ="determining-a-single-pages-title"></a>

### 使用运行时执行异步函数

首先，我们将获取单个页面的标题，如示例 17-3 所示。不过，这段代码还无法编译。

<Listing number="17-3" file-name="src/main.rs" caption="从 `main` 中调用 `page_title` 函数，使用用户提供的参数">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch17-async-await/listing-17-03/src/main.rs:main}}
```

</Listing>

我们遵循了第 12 章["接受命令行参数"][cli-args]<!-- ignore -->一节中获取命令行参数的相同模式。然后我们将 URL 参数传递给 `page_title` 并等待结果。因为 future 产生的值是一个 `Option<String>`，我们使用 `match` 表达式来打印不同的消息，以处理页面是否有 `<title>` 的情况。

我们唯一能使用 `await` 关键字的地方是在异步函数或代码块中，而 Rust 不允许我们将特殊的 `main` 函数标记为 `async`。

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-03
cargo build
copy just the compiler error
-->

```text
error[E0752]: `main` function is not allowed to be `async`
 --> src/main.rs:6:1
  |
6 | async fn main() {
  | ^^^^^^^^^^^^^^^ `main` function is not allowed to be `async`
```

`main` 不能标记为 `async` 的原因是异步代码需要一个 _运行时（runtime）_：一个管理异步代码执行细节的 Rust crate。程序的 `main` 函数可以 _初始化_ 一个运行时，但它本身并不是一个运行时。（我们稍后会看到更多关于为什么如此的原因。）每个执行异步代码的 Rust 程序都至少有一个设置运行时来执行 future 的地方。

大多数支持异步的语言都捆绑了一个运行时，但 Rust 没有。相反，有许多不同的异步运行时可用，每个都做出了适合其目标用例的不同权衡。例如，一个拥有多个 CPU 核心和大量 RAM 的高吞吐量 Web 服务器与一个只有单核、少量 RAM 且没有堆分配能力的微控制器有着截然不同的需求。提供这些运行时的 crate 通常还提供常见功能的异步版本，如文件或网络 I/O。

在这里以及本章的其余部分，我们将使用 `trpl` crate 中的 `block_on` 函数，它接受一个 future 作为参数，并阻塞当前线程直到该 future 运行完成。在底层，调用 `block_on` 会使用 `tokio` crate 设置一个运行时来运行传入的 future（`trpl` crate 的 `block_on` 行为与其他运行时 crate 的 `block_on` 函数类似）。一旦 future 完成，`block_on` 就返回该 future 产生的值。

我们可以将 `page_title` 返回的 future 直接传递给 `block_on`，然后在完成后对结果 `Option<String>` 进行匹配，就像我们在示例 17-3 中尝试做的那样。但是，对于本章中的大多数示例（以及现实世界中的大多数异步代码），我们不会只调用一个异步函数，所以我们将传入一个 `async` 块，并显式地等待 `page_title` 调用的结果，如示例 17-4 所示。

<Listing number="17-4" caption="使用 `trpl::block_on` 等待一个异步代码块" file-name="src/main.rs">

<!-- should_panic,noplayground because mdbook test does not pass args -->

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch17-async-await/listing-17-04/src/main.rs:run}}
```

</Listing>

当我们运行这段代码时，我们得到了最初期望的行为：

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-04
cargo build # skip all the build noise
cargo run -- "https://www.rust-lang.org"
# copy the output here
-->

```console
$ cargo run -- "https://www.rust-lang.org"
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.05s
     Running `target/debug/async_await 'https://www.rust-lang.org'`
The title for https://www.rust-lang.org was
            Rust Programming Language
```

终于——我们有了一些可以工作的异步代码！但在我们添加代码让两个网站互相竞速之前，让我们简要回顾一下 future 的工作原理。

每个 _等待点（await point）_——即代码中使用 `await` 关键字的每个位置——都代表一个将控制权交还给运行时的地方。为了实现这一点，Rust 需要跟踪异步代码块中涉及的状态，以便运行时可以启动其他工作，然后在准备好时回来尝试再次推进第一个任务。这是一个不可见的状态机，就好像你编写了一个这样的枚举来保存每个等待点的当前状态：

```rust
{{#rustdoc_include ../listings/ch17-async-await/no-listing-state-machine/src/lib.rs:enum}}
```

手动编写在每个状态之间转换的代码将是乏味且容易出错的，尤其是当你后续需要向代码中添加更多功能和更多状态时。幸运的是，Rust 编译器会自动为异步代码创建和管理状态机数据结构。围绕数据结构的正常借用和所有权规则仍然适用，而且编译器也会帮我们检查这些规则并提供有用的错误信息。我们将在本章后面处理其中的一些情况。

最终，必须有某个东西来执行这个状态机，而这个东西就是运行时。（这就是为什么你在查阅运行时相关资料时可能会遇到 _执行器（executor）_ 这个术语：执行器是运行时中负责执行异步代码的部分。）

现在你可以理解为什么编译器在示例 17-3 中阻止我们将 `main` 本身变成异步函数了。如果 `main` 是一个异步函数，就需要其他东西来管理 `main` 返回的 future 的状态机，但 `main` 是程序的起点！相反，我们在 `main` 中调用 `trpl::block_on` 函数来设置运行时，并运行 `async` 块返回的 future 直到它完成。

> 注意：一些运行时提供了宏，使你 _可以_ 编写异步的 `main` 函数。这些宏将 `async fn main() { ... }` 重写为普通的 `fn main`，其作用与我们在示例 17-4 中手动做的一样：调用一个函数来运行 future 直到完成，就像 `trpl::block_on` 那样。

现在让我们把这些部分组合起来，看看如何编写并发代码。

<!-- Old headings. Do not remove or links may break. -->

<a id="racing-our-two-urls-against-each-other"></a>

### 让两个 URL 并发竞速

在示例 17-5 中，我们用从命令行传入的两个不同 URL 调用 `page_title`，通过选择先完成的 future 来让它们竞速。

<Listing number="17-5" caption="调用 `page_title` 获取两个 URL，看哪个先返回" file-name="src/main.rs">

<!-- should_panic,noplayground because mdbook does not pass args -->

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch17-async-await/listing-17-05/src/main.rs:all}}
```

</Listing>

我们首先为每个用户提供的 URL 调用 `page_title`。我们将得到的 future 保存为 `title_fut_1` 和 `title_fut_2`。记住，这些 future 还不会做任何事情，因为 future 是惰性的，我们还没有等待它们。然后我们将这些 future 传递给 `trpl::select`，它返回一个值来指示传入的哪个 future 先完成。

> 注意：在底层，`trpl::select` 构建在 `futures` crate 中定义的更通用的 `select` 函数之上。`futures` crate 的 `select` 函数可以做很多 `trpl::select` 函数做不到的事情，但它也有一些额外的复杂性，我们现在可以跳过。

两个 future 都可以合理地"获胜"，所以返回 `Result` 没有意义。相反，`trpl::select` 返回一个我们之前没见过的类型：`trpl::Either`。`Either` 类型有点类似于 `Result`，因为它也有两个变体。但与 `Result` 不同的是，`Either` 中没有内置成功或失败的概念。相反，它使用 `Left` 和 `Right` 来表示"一个或另一个"：

```rust
enum Either<A, B> {
    Left(A),
    Right(B),
}
```

`select` 函数在第一个参数获胜时返回包含该 future 输出的 `Left`，在 _第二个_ 参数获胜时返回包含第二个 future 输出的 `Right`。这与调用函数时参数出现的顺序一致：第一个参数在第二个参数的左边。

我们还更新了 `page_title` 以返回传入的相同 URL。这样，如果先返回的页面没有可以解析的 `<title>`，我们仍然可以打印一条有意义的消息。有了这些信息，我们最后更新 `println!` 输出，以指示哪个 URL 先完成，以及该 URL 对应网页的 `<title>`（如果有的话）是什么。

你现在已经构建了一个小型可工作的网页抓取器！选择几个 URL 并运行这个命令行工具。你可能会发现某些网站始终比其他网站快，而在其他情况下，哪个网站更快会因运行而异。更重要的是，你已经学会了使用 future 的基础知识，现在我们可以更深入地探索异步能做什么了。

[impl-trait]: ch10-02-traits.html#traits-as-parameters
[iterators-lazy]: ch13-02-iterators.html
[thread-spawn]: ch16-01-threads.html#creating-a-new-thread-with-spawn
[cli-args]: ch12-01-accepting-command-line-arguments.html

<!-- TODO: map source link version to version of Rust? -->

[crate-source]: https://github.com/rust-lang/book/tree/main/packages/trpl
[futures-crate]: https://crates.io/crates/futures
[tokio]: https://tokio.rs
