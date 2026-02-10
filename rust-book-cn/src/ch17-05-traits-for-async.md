<!-- Old headings. Do not remove or links may break. -->

<a id="digging-into-the-traits-for-async"></a>

## 深入了解异步相关的 trait

在本章中，我们以各种方式使用了 `Future`、`Stream` 和 `StreamExt` trait。不过到目前为止，我们一直避免深入探讨它们的工作原理以及它们之间的关系，这在日常 Rust 开发中通常是没问题的。但有时候，你会遇到需要更深入理解这些 trait 细节的场景，同时还需要了解 `Pin` 类型和 `Unpin` trait。在本节中，我们将深入到足以应对这些场景的程度，而将 _真正_ 深层次的探讨留给其他文档。

<!-- Old headings. Do not remove or links may break. -->

<a id="future"></a>

### `Future` trait

让我们先来仔细看看 `Future` trait 是如何工作的。以下是 Rust 对它的定义：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

这个 trait 定义包含了一些新类型以及我们之前没见过的语法，让我们逐一解析。

首先，`Future` 的关联类型 `Output` 表示 future 解析后的结果。这类似于 `Iterator` trait 的 `Item` 关联类型。其次，`Future` 有一个 `poll` 方法，它的 `self` 参数接受一个特殊的 `Pin` 引用，还有一个 `Context` 类型的可变引用，返回值是 `Poll<Self::Output>`。稍后我们会详细讨论 `Pin` 和 `Context`。现在，让我们先关注方法的返回值——`Poll` 类型：

```rust
pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

`Poll` 类型类似于 `Option`。它有一个包含值的变体 `Ready(T)`，和一个不包含值的变体 `Pending`。不过 `Poll` 的含义与 `Option` 截然不同！`Pending` 变体表示 future 仍有工作要做，因此调用者需要稍后再次检查。`Ready` 变体表示 `Future` 已经完成了它的工作，`T` 值已经可用。

> 注意：通常很少需要直接调用 `poll`，但如果确实需要，请记住对于大多数 future，在 future 返回 `Ready` 之后不应再次调用 `poll`。许多 future 在变为就绪状态后再次被轮询会 panic。可以安全地再次轮询的 future 会在其文档中明确说明。这类似于 `Iterator::next` 的行为。

当你看到使用 `await` 的代码时，Rust 会在底层将其编译为调用 `poll` 的代码。如果你回顾示例 17-4，我们在单个 URL 解析后打印页面标题，Rust 会将其编译成大致（虽然不完全）如下的代码：

```rust,ignore
match page_title(url).poll() {
    Ready(page_title) => match page_title {
        Some(title) => println!("The title for {url} was {title}"),
        None => println!("{url} had no title"),
    }
    Pending => {
        // 但这里该放什么呢？
    }
}
```

当 future 仍然是 `Pending` 状态时我们该怎么办？我们需要某种方式来一次又一次地重试，直到 future 最终就绪。换句话说，我们需要一个循环：

```rust,ignore
let mut page_title_fut = page_title(url);
loop {
    match page_title_fut.poll() {
        Ready(value) => match page_title {
            Some(title) => println!("The title for {url} was {title}"),
            None => println!("{url} had no title"),
        }
        Pending => {
            // continue
        }
    }
}
```

但如果 Rust 真的编译成这样的代码，那么每个 `await` 都会是阻塞的——这恰恰与我们的目标相反！相反，Rust 确保循环可以将控制权交给某个东西，这个东西可以暂停当前 future 的工作，转而处理其他 future，然后稍后再回来检查这个 future。正如我们所见，这个"某个东西"就是异步运行时，而调度和协调工作正是它的主要职责之一。

在["通过消息传递在两个任务之间发送数据"][message-passing]<!-- ignore -->一节中，我们描述了等待 `rx.recv` 的过程。`recv` 调用返回一个 future，await 这个 future 就会轮询它。我们提到运行时会暂停 future，直到它准备好返回 `Some(message)` 或在通道关闭时返回 `None`。通过对 `Future` trait，特别是 `Future::poll` 的深入理解，我们可以看到这是如何工作的。当 future 返回 `Poll::Pending` 时，运行时就知道它还没有准备好。相反，当 `poll` 返回 `Poll::Ready(Some(message))` 或 `Poll::Ready(None)` 时，运行时就知道 future _已经_ 准备好了，并推进它的执行。

运行时具体如何做到这一点超出了本书的范围，但关键是理解 future 的基本机制：运行时 _轮询_ 它负责的每个 future，当 future 尚未就绪时将其重新置于休眠状态。

<!-- Old headings. Do not remove or links may break. -->

<a id="pinning-and-the-pin-and-unpin-traits"></a>
<a id="the-pin-and-unpin-traits"></a>

### `Pin` 类型和 `Unpin` trait

回顾示例 17-13，我们使用 `trpl::join!` 宏来 await 三个 future。然而，拥有一个包含若干 future 的集合（如 vector）是很常见的，而且其中 future 的数量在运行时才能确定。让我们将示例 17-13 修改为示例 17-23 中的代码，将三个 future 放入一个 vector 中，并调用 `trpl::join_all` 函数——不过这段代码还无法编译。

<Listing number="17-23" caption="在集合中 await future"  file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch17-async-await/listing-17-23/src/main.rs:here}}
```

</Listing>

我们将每个 future 放入 `Box` 中使其成为 _trait 对象_，就像我们在第 12 章"从 `run` 返回错误"一节中所做的那样。（我们将在第 18 章详细介绍 trait 对象。）使用 trait 对象可以让我们将这些类型产生的匿名 future 视为相同的类型，因为它们都实现了 `Future` trait。

这可能令人意外。毕竟，这些 async 块都没有返回任何值，所以每个都产生一个 `Future<Output = ()>`。但请记住，`Future` 是一个 trait，编译器会为每个 async 块创建一个唯一的枚举，即使它们的输出类型相同。就像你不能把两个不同的手写结构体放入一个 `Vec` 一样，你也不能混合编译器生成的枚举。

然后我们将 future 集合传递给 `trpl::join_all` 函数并 await 结果。然而，这段代码无法编译；以下是错误信息的相关部分。

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-23
cargo build
copy *only* the final `error` block from the errors
-->

```text
error[E0277]: `dyn Future<Output = ()>` cannot be unpinned
  --> src/main.rs:48:33
   |
48 |         trpl::join_all(futures).await;
   |                                 ^^^^^ the trait `Unpin` is not implemented for `dyn Future<Output = ()>`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
   = note: required for `Box<dyn Future<Output = ()>>` to implement `Future`
note: required by a bound in `futures_util::future::join_all::JoinAll`
  --> file:///home/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/futures-util-0.3.30/src/future/join_all.rs:29:8
   |
27 | pub struct JoinAll<F>
   |            ------- required by a bound in this struct
28 | where
29 |     F: Future,
   |        ^^^^^^ required by this bound in `JoinAll`
```

这条错误信息告诉我们应该使用 `pin!` 宏来 _固定（pin）_ 这些值，也就是将它们放入 `Pin` 类型中，以保证这些值不会在内存中被移动。错误信息说需要固定是因为 `dyn Future<Output = ()>` 需要实现 `Unpin` trait，而它目前没有实现。

`trpl::join_all` 函数返回一个名为 `JoinAll` 的结构体。该结构体对类型 `F` 是泛型的，`F` 被约束为实现 `Future` trait。直接使用 `await` 来 await 一个 future 会隐式地固定该 future。这就是为什么我们不需要在每个想要 await future 的地方都使用 `pin!`。

然而，这里我们并不是直接 await 一个 future。相反，我们通过将 future 集合传递给 `join_all` 函数来构造一个新的 future——`JoinAll`。`join_all` 的签名要求集合中元素的类型都实现 `Future` trait，而 `Box<T>` 只有在它包装的 `T` 是一个实现了 `Unpin` trait 的 future 时才实现 `Future`。

这些内容确实不少！为了真正理解它，让我们更深入地了解 `Future` trait 的实际工作方式，特别是关于固定的部分。再看一下 `Future` trait 的定义：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    // Required method
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`cx` 参数及其 `Context` 类型是运行时在保持惰性的同时知道何时检查任何给定 future 的关键。同样，其工作原理的细节超出了本章的范围，通常只有在编写自定义 `Future` 实现时才需要考虑这些。我们将把重点放在 `self` 的类型上，因为这是我们第一次看到方法的 `self` 带有类型注解。`self` 的类型注解与其他函数参数的类型注解类似，但有两个关键区别：

- 它告诉 Rust `self` 必须是什么类型才能调用该方法。
- 它不能是任意类型。它被限制为实现该方法的类型本身、该类型的引用或智能指针，或者包装该类型引用的 `Pin`。

我们将在[第 18 章][ch-18]<!-- ignore -->中看到更多关于这种语法的内容。目前，只需要知道如果我们想轮询一个 future 来检查它是 `Pending` 还是 `Ready(Output)`，我们需要一个 `Pin` 包装的可变引用。

`Pin` 是对指针类型（如 `&`、`&mut`、`Box` 和 `Rc`）的包装器。（从技术上讲，`Pin` 适用于实现了 `Deref` 或 `DerefMut` trait 的类型，但这实际上等同于只适用于引用和智能指针。）`Pin` 本身不是指针，也不像 `Rc` 和 `Arc` 那样具有引用计数等自身行为；它纯粹是编译器用来强制执行指针使用约束的工具。

回想一下 `await` 是通过调用 `poll` 来实现的，这开始解释我们之前看到的错误信息了，但那个错误是关于 `Unpin` 而不是 `Pin` 的。那么 `Pin` 和 `Unpin` 到底是什么关系？为什么 `Future` 需要 `self` 在 `Pin` 类型中才能调用 `poll`？

回忆本章前面的内容，future 中的一系列 await 点会被编译成一个状态机，编译器会确保该状态机遵循 Rust 关于安全性的所有常规规则，包括借用和所有权。为了实现这一点，Rust 会查看从一个 await 点到下一个 await 点（或 async 块的末尾）之间需要哪些数据，然后在编译后的状态机中创建相应的变体。每个变体获得它在该段源代码中所需的数据访问权限，无论是通过获取数据的所有权，还是通过获取可变或不可变引用。

到目前为止一切顺利：如果我们在某个 async 块中的所有权或引用方面犯了错误，借用检查器会告诉我们。但当我们想要移动与该块对应的 future 时——比如将它移入 `Vec` 以传递给 `join_all`——事情就变得棘手了。

当我们移动一个 future 时——无论是将它推入数据结构以便与 `join_all` 一起用作迭代器，还是从函数中返回它——实际上意味着移动 Rust 为我们创建的状态机。与 Rust 中大多数其他类型不同，Rust 为 async 块创建的 future 可能会在任何给定变体的字段中包含对自身的引用，如图 17-4 的简化示意图所示。

<figure>

<img alt="A single-column, three-row table representing a future, fut1, which has data values 0 and 1 in the first two rows and an arrow pointing from the third row back to the second row, representing an internal reference within the future." src="img/trpl17-04.svg" class="center" />

<figcaption>图 17-4：一个自引用数据类型</figcaption>

</figure>

默认情况下，任何包含对自身引用的对象移动起来都是不安全的，因为引用总是指向它们所引用内容的实际内存地址（见图 17-5）。如果你移动了数据结构本身，那些内部引用将仍然指向旧的位置。然而，那个内存位置现在已经无效了。一方面，当你对数据结构进行更改时，它的值不会被更新。另一方面——更重要的是——计算机现在可以自由地将那块内存用于其他用途！你可能最终会读到完全不相关的数据。

<figure>

<img alt="Two tables, depicting two futures, fut1 and fut2, each of which has one column and three rows, representing the result of having moved a future out of fut1 into fut2. The first, fut1, is grayed out, with a question mark in each index, representing unknown memory. The second, fut2, has 0 and 1 in the first and second rows and an arrow pointing from its third row back to the second row of fut1, representing a pointer that is referencing the old location in memory of the future before it was moved." src="img/trpl17-05.svg" class="center" />

<figcaption>图 17-5：移动自引用数据类型的不安全结果</figcaption>

</figure>

理论上，Rust 编译器可以在对象每次被移动时尝试更新所有引用，但这可能会带来大量的性能开销，尤其是当需要更新一整张引用网络时。如果我们能确保相关的数据结构 _不会在内存中移动_，就不需要更新任何引用了。这正是 Rust 借用检查器的用武之地：在安全代码中，它会阻止你移动任何有活跃引用指向它的项。

`Pin` 在此基础上提供了我们所需的精确保证。当我们通过将指向某个值的指针包装在 `Pin` 中来 _固定_ 该值时，它就不能再被移动了。因此，如果你有 `Pin<Box<SomeType>>`，你实际上固定的是 `SomeType` 值，而 _不是_ `Box` 指针。图 17-6 展示了这个过程。

<figure>

<img alt="Three boxes laid out side by side. The first is labeled "Pin", the second "b1", and the third "pinned". Within "pinned" is a table labeled "fut", with a single column; it represents a future with cells for each part of the data structure. Its first cell has the value "0", its second cell has an arrow coming out of it and pointing to the fourth and final cell, which has the value "1" in it, and the third cell has dashed lines and an ellipsis to indicate there may be other parts to the data structure. All together, the "fut" table represents a future which is self-referential. An arrow leaves the box labeled "Pin", goes through the box labeled "b1" and terminates inside the "pinned" box at the "fut" table." src="img/trpl17-06.svg" class="center" />

<figcaption>图 17-6：固定一个指向自引用 future 类型的 `Box`</figcaption>

</figure>

实际上，`Box` 指针仍然可以自由移动。记住：我们关心的是确保最终被引用的数据保持在原位。如果指针移动了，_但它指向的数据_ 仍在同一位置，如图 17-7 所示，就不会有潜在问题。（作为一个独立练习，查看这些类型以及 `std::pin` 模块的文档，试着弄清楚如何用 `Pin` 包装 `Box` 来实现这一点。）关键在于自引用类型本身不能移动，因为它仍然是被固定的。

<figure>

<img alt="Four boxes laid out in three rough columns, identical to the previous diagram with a change to the second column. Now there are two boxes in the second column, labeled "b1" and "b2", "b1" is grayed out, and the arrow from "Pin" goes through "b2" instead of "b1", indicating that the pointer has moved from "b1" to "b2", but the data in "pinned" has not moved." src="img/trpl17-07.svg" class="center" />

<figcaption>图 17-7：移动指向自引用 future 类型的 `Box`</figcaption>

</figure>

然而，大多数类型移动起来是完全安全的，即使它们恰好在 `Pin` 指针后面。我们只有在项具有内部引用时才需要考虑固定。原始值（如数字和布尔值）是安全的，因为它们显然没有任何内部引用。你在 Rust 中通常使用的大多数类型也是如此。例如，你可以随意移动一个 `Vec` 而不用担心。根据我们目前所了解的，如果你有一个 `Pin<Vec<String>>`，即使 `Vec<String>` 在没有其他引用指向它时总是可以安全移动的，你也必须通过 `Pin` 提供的安全但受限的 API 来完成所有操作。我们需要一种方式来告诉编译器在这种情况下移动项是没问题的——这就是 `Unpin` 发挥作用的地方。

`Unpin` 是一个标记 trait，类似于我们在第 16 章中看到的 `Send` 和 `Sync` trait，因此它本身没有任何功能。标记 trait 的存在只是为了告诉编译器，在特定上下文中使用实现了该 trait 的类型是安全的。`Unpin` 告知编译器，给定类型 _不_ 需要维护关于其值是否可以安全移动的任何保证。

<!--
  The inline `<code>` in the next block is to allow the inline `<em>` inside it,
  matching what NoStarch does style-wise, and emphasizing within the text here
  that it is something distinct from a normal type.
-->

与 `Send` 和 `Sync` 一样，编译器会为所有能证明安全的类型自动实现 `Unpin`。一个特殊情况，同样类似于 `Send` 和 `Sync`，是某个类型 _没有_ 实现 `Unpin`。其表示法为 <code>impl !Unpin for <em>SomeType</em></code>，其中 <code><em>SomeType</em></code> 是一个在使用指向该类型的指针位于 `Pin` 中时 _确实_ 需要维护安全保证的类型名称。

换句话说，关于 `Pin` 和 `Unpin` 的关系，有两点需要记住。首先，`Unpin` 是"正常"情况，而 `!Unpin` 是特殊情况。其次，一个类型是否实现 `Unpin` 或 `!Unpin` _只_ 在你使用指向该类型的固定指针（如 <code>Pin<&mut <em>SomeType</em>></code>）时才重要。

为了更具体地理解，想想 `String`：它有一个长度和组成它的 Unicode 字符。我们可以将 `String` 包装在 `Pin` 中，如图 17-8 所示。然而，`String` 自动实现了 `Unpin`，Rust 中的大多数其他类型也是如此。

<figure>

<img alt="A box labeled "Pin" on the left with an arrow going from it to a box labeled "String" on the right. The "String" box contains the data 5usize, representing the length of the string, and the letters "h", "e", "l", "l", and "o" representing the characters of the string "hello" stored in this String instance. A dotted rectangle surrounds the "String" box and its label, but not the "Pin" box." src="img/trpl17-08.svg" class="center" />

<figcaption>图 17-8：固定一个 `String`；虚线表示 `String` 实现了 `Unpin` trait，因此实际上并未被固定</figcaption>

</figure>

因此，我们可以做一些如果 `String` 实现了 `!Unpin` 就会非法的操作，比如在内存中的同一位置用另一个字符串替换它，如图 17-9 所示。这不会违反 `Pin` 的契约，因为 `String` 没有使其移动不安全的内部引用。这正是它实现 `Unpin` 而非 `!Unpin` 的原因。

<figure>

<img alt="The same "hello" string data from the previous example, now labeled "s1" and grayed out. The "Pin" box from the previous example now points to a different String instance, one that is labeled "s2", is valid, has a length of 7usize, and contains the characters of the string "goodbye". s2 is surrounded by a dotted rectangle because it, too, implements the Unpin trait." src="img/trpl17-09.svg" class="center" />

<figcaption>图 17-9：在内存中用一个完全不同的 `String` 替换原来的</figcaption>

</figure>

现在我们已经了解了足够的知识来理解示例 17-23 中 `join_all` 调用报告的错误。我们最初尝试将 async 块产生的 future 移入 `Vec<Box<dyn Future<Output = ()>>>`，但正如我们所见，这些 future 可能包含内部引用，因此它们不会自动实现 `Unpin`。一旦我们固定它们，就可以将生成的 `Pin` 类型放入 `Vec` 中，确信 future 中的底层数据 _不会_ 被移动。示例 17-24 展示了如何通过在定义三个 future 的地方调用 `pin!` 宏并调整 trait 对象类型来修复代码。

<Listing number="17-24" caption="固定 future 以便将它们移入 vector">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-24/src/main.rs:here}}
```

</Listing>

这个示例现在可以编译并运行了，我们可以在运行时向 vector 中添加或移除 future，然后将它们全部 join。

`Pin` 和 `Unpin` 对于构建底层库或运行时本身来说最为重要，而不是日常 Rust 代码。不过，当你在错误信息中看到这些 trait 时，你现在会更清楚如何修复代码了！

> 注意：`Pin` 和 `Unpin` 的这种组合使得在 Rust 中安全地实现一整类复杂类型成为可能，否则这些类型会因为自引用而难以实现。需要 `Pin` 的类型目前最常出现在异步 Rust 中，但偶尔你也会在其他上下文中看到它们。
>
> `Pin` 和 `Unpin` 的工作原理细节以及它们需要遵守的规则，在 `std::pin` 的 API 文档中有详尽的介绍，如果你有兴趣了解更多，那是一个很好的起点。
>
> 如果你想更深入地了解底层工作原理，请参阅 [_Asynchronous Programming in Rust_][async-book] 的第 [2][under-the-hood]<!-- ignore --> 章和第 [4][pinning]<!-- ignore --> 章。

### `Stream` trait

现在你对 `Future`、`Pin` 和 `Unpin` trait 有了更深入的理解，我们可以将注意力转向 `Stream` trait。正如你在本章前面所学到的，流（stream）类似于异步迭代器。然而，与 `Iterator` 和 `Future` 不同，截至本文撰写时，`Stream` 在标准库中还没有定义，但 `futures` crate 中有一个非常通用的定义，在整个生态系统中广泛使用。

让我们在查看 `Stream` trait 如何将它们融合在一起之前，先回顾一下 `Iterator` 和 `Future` trait 的定义。从 `Iterator`，我们有序列的概念：它的 `next` 方法提供一个 `Option<Self::Item>`。从 `Future`，我们有随时间就绪的概念：它的 `poll` 方法提供一个 `Poll<Self::Output>`。为了表示一个随时间逐渐就绪的项序列，我们定义了一个将这些特性结合在一起的 `Stream` trait：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>
    ) -> Poll<Option<Self::Item>>;
}
```

`Stream` trait 定义了一个名为 `Item` 的关联类型，表示流产生的项的类型。这类似于 `Iterator`，其中可能有零到多个项，而不像 `Future` 总是只有一个 `Output`，即使它是单元类型 `()`。

`Stream` 还定义了一个获取这些项的方法。我们称之为 `poll_next`，以明确它像 `Future::poll` 一样进行轮询，并像 `Iterator::next` 一样产生一系列项。它的返回类型将 `Poll` 和 `Option` 组合在一起。外层类型是 `Poll`，因为它需要像 future 一样检查就绪状态。内层类型是 `Option`，因为它需要像迭代器一样发出是否还有更多消息的信号。

与此非常类似的定义很可能最终会成为 Rust 标准库的一部分。与此同时，它是大多数运行时工具包的一部分，所以你可以放心使用它，接下来我们介绍的所有内容通常都适用！

不过，在["流：按序列处理的 Future"][streams]<!-- ignore -->一节的示例中，我们既没有使用 `poll_next` _也_ 没有使用 `Stream`，而是使用了 `next` 和 `StreamExt`。当然，我们 _可以_ 通过手写 `Stream` 状态机来直接使用 `poll_next` API，就像我们 _可以_ 通过 `poll` 方法直接操作 future 一样。但使用 `await` 要方便得多，而 `StreamExt` trait 提供了 `next` 方法，让我们可以这样做：

```rust
{{#rustdoc_include ../listings/ch17-async-await/no-listing-stream-ext/src/lib.rs:here}}
```

<!--
TODO: update this if/when tokio/etc. update their MSRV and switch to using async functions
in traits, since the lack thereof is the reason they do not yet have this.
-->

> 注意：本章前面使用的实际定义与这里略有不同，因为它需要支持尚不支持在 trait 中使用异步函数的 Rust 版本。因此，它看起来像这样：
>
> ```rust,ignore
> fn next(&mut self) -> Next<'_, Self> where Self: Unpin;
> ```
>
> 那个 `Next` 类型是一个实现了 `Future` 的 `struct`，它允许我们用 `Next<'_, Self>` 来命名对 `self` 的引用的生命周期，这样 `await` 就可以与这个方法一起使用了。

`StreamExt` trait 也是所有可用于流的有趣方法的所在地。`StreamExt` 会自动为每个实现了 `Stream` 的类型实现，但这两个 trait 是分开定义的，以便社区可以在不影响基础 trait 的情况下迭代便利 API。

在 `trpl` crate 使用的 `StreamExt` 版本中，该 trait 不仅定义了 `next` 方法，还提供了 `next` 的默认实现，正确处理了调用 `Stream::poll_next` 的细节。这意味着即使你需要编写自己的流数据类型，你也 _只_ 需要实现 `Stream`，然后任何使用你的数据类型的人都可以自动使用 `StreamExt` 及其方法。

以上就是我们要介绍的关于这些 trait 底层细节的全部内容。最后，让我们来看看 future（包括流）、任务和线程是如何协同工作的！

[message-passing]: ch17-02-concurrency-with-async.md#sending-data-between-two-tasks-using-message-passing
[ch-18]: ch18-00-oop.html
[async-book]: https://rust-lang.github.io/async-book/
[under-the-hood]: https://rust-lang.github.io/async-book/02_execution/01_chapter.html
[pinning]: https://rust-lang.github.io/async-book/04_pinning/01_chapter.html
[first-async]: ch17-01-futures-and-syntax.html#our-first-async-program
[any-number-futures]: ch17-03-more-futures.html#working-with-any-number-of-futures
[streams]: ch17-04-streams.html
