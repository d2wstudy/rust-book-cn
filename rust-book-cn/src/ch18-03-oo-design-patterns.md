## 实现面向对象设计模式

**状态模式**（state pattern）是一种面向对象设计模式。该模式的核心在于：我们定义一个值在内部可以拥有的一组状态。这些状态由一组**状态对象**来表示，而值的行为会根据其状态而改变。我们将通过一个博客文章结构体的示例来演示，它有一个字段用于保存其状态，该状态对象来自"草稿"、"审核中"或"已发布"这一组状态。

状态对象共享功能：当然，在 Rust 中我们使用结构体和 trait 而非对象和继承。每个状态对象负责自身的行为，以及管理何时应该转换到另一个状态。持有状态对象的值对各状态的不同行为以及何时在状态之间转换一无所知。

使用状态模式的优势在于，当程序的业务需求发生变化时，我们不需要修改持有状态的值的代码，也不需要修改使用该值的代码。我们只需要更新某个状态对象内部的代码来改变其规则，或者增加更多的状态对象。

首先，我们将以更传统的面向对象方式来实现状态模式。然后，我们将使用一种在 Rust 中更自然的方式。让我们逐步实现一个使用状态模式的博客文章工作流。

最终的功能如下：

1. 博客文章从一篇空白草稿开始。
1. 草稿完成后，请求对文章进行审核。
1. 文章通过审核后，它就会被发布。
1. 只有已发布的博客文章才会返回可打印的内容，这样未通过审核的文章就不会被意外发布。

对文章尝试的任何其他更改都不应产生效果。例如，如果我们在请求审核之前就尝试批准一篇草稿博客文章，该文章应该保持为未发布的草稿状态。

<!-- Old headings. Do not remove or links may break. -->

<a id="a-traditional-object-oriented-attempt"></a>

### 尝试传统的面向对象风格

解决同一个问题的代码组织方式有无数种，每种都有不同的取舍。本节的实现采用更传统的面向对象风格，这在 Rust 中是可以实现的，但并没有利用 Rust 的一些优势。稍后，我们将展示一种不同的方案，它仍然使用面向对象设计模式，但其结构方式对于有面向对象经验的程序员来说可能看起来不太熟悉。我们将比较这两种方案，以体验用不同于其他语言的方式设计 Rust 代码时的取舍。

Listing 18-11 以代码形式展示了这个工作流：这是我们将在名为 `blog` 的库 crate 中实现的 API 的示例用法。目前还无法编译，因为我们尚未实现 `blog` crate。

<Listing number="18-11" file-name="src/main.rs" caption="展示我们希望 `blog` crate 具有的期望行为的代码">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch18-oop/listing-18-11/src/main.rs:all}}
```

</Listing>

我们希望允许用户使用 `Post::new` 创建一篇新的草稿博客文章。我们希望允许向博客文章中添加文本。如果我们在审批之前立即尝试获取文章内容，不应该得到任何文本，因为文章仍然是草稿。我们在代码中添加了 `assert_eq!` 用于演示目的。一个优秀的单元测试应该断言草稿博客文章的 `content` 方法返回空字符串，但我们不打算为这个示例编写测试。

接下来，我们希望能够请求对文章进行审核，并且希望在等待审核期间 `content` 返回空字符串。当文章获得批准后，它应该被发布，这意味着调用 `content` 时将返回文章的文本。

注意，我们从 crate 中交互的唯一类型是 `Post` 类型。这个类型将使用状态模式，并持有一个值，该值将是表示文章可能处于的各种状态的三个状态对象之一——草稿、审核中或已发布。从一个状态到另一个状态的转换将在 `Post` 类型内部管理。状态的改变是响应库用户在 `Post` 实例上调用的方法而发生的，但用户不必直接管理状态变化。同时，用户也不会在状态上犯错，比如在审核之前就发布文章。

<!-- Old headings. Do not remove or links may break. -->

<a id="defining-post-and-creating-a-new-instance-in-the-draft-state"></a>

#### 定义 `Post` 并创建草稿状态的新实例

让我们开始实现这个库！我们知道需要一个公有的 `Post` 结构体来保存一些内容，所以我们先从结构体的定义和一个关联的公有 `new` 函数来创建 `Post` 实例开始，如 Listing 18-12 所示。我们还将创建一个私有的 `State` trait，它将定义所有 `Post` 的状态对象必须具有的行为。

然后，`Post` 将在一个名为 `state` 的私有字段中，在 `Option<T>` 内部持有一个 `Box<dyn State>` trait 对象来保存状态对象。稍后你就会明白为什么需要 `Option<T>`。

<Listing number="18-12" file-name="src/lib.rs" caption="`Post` 结构体的定义、创建新 `Post` 实例的 `new` 函数、`State` trait 和 `Draft` 结构体">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-12/src/lib.rs}}
```

</Listing>

`State` trait 定义了不同文章状态共享的行为。状态对象有 `Draft`、`PendingReview` 和 `Published`，它们都将实现 `State` trait。目前，该 trait 还没有任何方法，我们先只定义 `Draft` 状态，因为这是我们希望文章开始时所处的状态。

当我们创建新的 `Post` 时，将其 `state` 字段设置为一个持有 `Box` 的 `Some` 值。这个 `Box` 指向 `Draft` 结构体的一个新实例。这确保了每当我们创建新的 `Post` 实例时，它都会以草稿状态开始。因为 `Post` 的 `state` 字段是私有的，所以没有办法创建处于其他状态的 `Post`！在 `Post::new` 函数中，我们将 `content` 字段设置为一个新的空 `String`。

#### 存储文章内容的文本

我们在 Listing 18-11 中看到，我们希望能够调用一个名为 `add_text` 的方法，并传递一个 `&str`，然后将其作为博客文章的文本内容添加进去。我们将其实现为一个方法，而不是将 `content` 字段暴露为 `pub`，这样以后我们就可以实现一个方法来控制 `content` 字段数据的读取方式。`add_text` 方法非常简单直接，让我们在 Listing 18-13 中将实现添加到 `impl Post` 块中。

<Listing number="18-13" file-name="src/lib.rs" caption="实现 `add_text` 方法来向文章的 `content` 添加文本">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-13/src/lib.rs:here}}
```

</Listing>

`add_text` 方法接受一个 `self` 的可变引用，因为我们正在修改调用 `add_text` 的 `Post` 实例。然后我们在 `content` 中的 `String` 上调用 `push_str`，并传入 `text` 参数来添加到已保存的 `content` 中。这个行为不依赖于文章所处的状态，所以它不是状态模式的一部分。`add_text` 方法完全不与 `state` 字段交互，但它是我们想要支持的行为的一部分。

<!-- Old headings. Do not remove or links may break. -->

<a id="ensuring-the-content-of-a-draft-post-is-empty"></a>

#### 确保草稿文章的内容为空

即使我们已经调用了 `add_text` 并向文章添加了一些内容，我们仍然希望 `content` 方法返回一个空字符串切片，因为文章仍处于草稿状态，如 Listing 18-11 中第一个 `assert_eq!` 所示。现在，让我们用能满足这个需求的最简单方式来实现 `content` 方法：始终返回一个空字符串切片。等我们实现了改变文章状态使其可以发布的功能后，再来修改它。到目前为止，文章只能处于草稿状态，所以文章内容应该始终为空。Listing 18-14 展示了这个占位实现。

<Listing number="18-14" file-name="src/lib.rs" caption="为 `Post` 的 `content` 方法添加一个始终返回空字符串切片的占位实现">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-14/src/lib.rs:here}}
```

</Listing>

添加了这个 `content` 方法后，Listing 18-11 中直到第一个 `assert_eq!` 的所有内容都能按预期工作。

<!-- Old headings. Do not remove or links may break. -->

<a id="requesting-a-review-of-the-post-changes-its-state"></a>
<a id="requesting-a-review-changes-the-posts-state"></a>

#### 请求审核以改变文章的状态

接下来，我们需要添加请求审核文章的功能，这应该将其状态从 `Draft` 变为 `PendingReview`。Listing 18-15 展示了这段代码。

<Listing number="18-15" file-name="src/lib.rs" caption="在 `Post` 和 `State` trait 上实现 `request_review` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-15/src/lib.rs:here}}
```

</Listing>

我们给 `Post` 添加了一个名为 `request_review` 的公有方法，它接受 `self` 的可变引用。然后我们在 `Post` 的当前状态上调用内部的 `request_review` 方法，这第二个 `request_review` 方法会消费当前状态并返回一个新状态。

我们将 `request_review` 方法添加到 `State` trait 中；所有实现该 trait 的类型现在都需要实现 `request_review` 方法。注意，方法的第一个参数不是 `self`、`&self` 或 `&mut self`，而是 `self: Box<Self>`。这个语法意味着该方法只有在对持有该类型的 `Box` 调用时才有效。这个语法获取了 `Box<Self>` 的所有权，使旧状态失效，从而让 `Post` 的状态值可以转换为新状态。

为了消费旧状态，`request_review` 方法需要获取状态值的所有权。这就是 `Post` 的 `state` 字段中 `Option` 的用武之地：我们调用 `take` 方法将 `Some` 值从 `state` 字段中取出，并在原处留下一个 `None`，因为 Rust 不允许结构体中存在未填充的字段。这让我们可以将 `state` 值从 `Post` 中移出，而不是借用它。然后，我们将文章的 `state` 值设置为这个操作的结果。

我们需要将 `state` 临时设置为 `None`，而不是用类似 `self.state = self.state.request_review();` 这样的代码直接设置，以获取 `state` 值的所有权。这确保了在我们将 `Post` 转换为新状态之后，它不能再使用旧的 `state` 值。

`Draft` 上的 `request_review` 方法返回一个新的、装箱的 `PendingReview` 结构体实例，表示文章正在等待审核的状态。`PendingReview` 结构体也实现了 `request_review` 方法，但不做任何转换。它返回自身，因为当我们对已经处于 `PendingReview` 状态的文章请求审核时，它应该保持在 `PendingReview` 状态。

现在我们可以开始看到状态模式的优势了：`Post` 上的 `request_review` 方法无论其 `state` 值是什么都是一样的。每个状态负责自己的规则。

我们将保持 `Post` 上的 `content` 方法不变，仍然返回空字符串切片。现在我们可以让 `Post` 处于 `PendingReview` 状态以及 `Draft` 状态，但我们希望在 `PendingReview` 状态下有相同的行为。Listing 18-11 现在可以工作到第二个 `assert_eq!` 调用了！

<!-- Old headings. Do not remove or links may break. -->

<a id="adding-the-approve-method-that-changes-the-behavior-of-content"></a>
<a id="adding-approve-to-change-the-behavior-of-content"></a>

#### 添加 `approve` 以改变 `content` 的行为

`approve` 方法与 `request_review` 方法类似：它会将 `state` 设置为当前状态在被批准时应该具有的值，如 Listing 18-16 所示。

<Listing number="18-16" file-name="src/lib.rs" caption="在 `Post` 和 `State` trait 上实现 `approve` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-16/src/lib.rs:here}}
```

</Listing>

我们将 `approve` 方法添加到 `State` trait 中，并添加了一个实现 `State` 的新结构体——`Published` 状态。

与 `PendingReview` 上的 `request_review` 工作方式类似，如果我们在 `Draft` 上调用 `approve` 方法，它不会产生任何效果，因为 `approve` 会返回 `self`。当我们在 `PendingReview` 上调用 `approve` 时，它会返回一个新的、装箱的 `Published` 结构体实例。`Published` 结构体实现了 `State` trait，对于 `request_review` 方法和 `approve` 方法，它都返回自身，因为在这些情况下文章应该保持在 `Published` 状态。

现在我们需要更新 `Post` 上的 `content` 方法。我们希望 `content` 返回的值取决于 `Post` 的当前状态，所以我们让 `Post` 委托给定义在其 `state` 上的 `content` 方法，如 Listing 18-17 所示。

<Listing number="18-17" file-name="src/lib.rs" caption="更新 `Post` 上的 `content` 方法，将其委托给 `State` 上的 `content` 方法">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch18-oop/listing-18-17/src/lib.rs:here}}
```

</Listing>

因为目标是将所有这些规则保留在实现 `State` 的结构体内部，所以我们在 `state` 中的值上调用 `content` 方法，并将文章实例（即 `self`）作为参数传入。然后，我们返回对 `state` 值使用 `content` 方法所返回的值。

我们在 `Option` 上调用 `as_ref` 方法，因为我们需要的是 `Option` 内部值的引用而非所有权。因为 `state` 是 `Option<Box<dyn State>>`，当我们调用 `as_ref` 时，会返回 `Option<&Box<dyn State>>`。如果不调用 `as_ref`，我们会得到一个错误，因为不能将 `state` 从函数参数的借用 `&self` 中移出。

然后我们调用 `unwrap` 方法，我们知道它永远不会 panic，因为我们知道 `Post` 上的方法确保在这些方法完成时 `state` 总是包含一个 `Some` 值。这是我们在第 9 章["当你比编译器掌握更多信息时"][more-info-than-rustc]<!-- ignore -->一节中讨论过的情况之一——我们知道 `None` 值是不可能的，即使编译器无法理解这一点。

此时，当我们在 `&Box<dyn State>` 上调用 `content` 时，解引用强制转换会作用于 `&` 和 `Box`，使得 `content` 方法最终会在实现了 `State` trait 的类型上被调用。这意味着我们需要将 `content` 添加到 `State` trait 的定义中，我们将在那里放置根据当前状态决定返回什么内容的逻辑，如 Listing 18-18 所示。

<Listing number="18-18" file-name="src/lib.rs" caption="向 `State` trait 添加 `content` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-18/src/lib.rs:here}}
```

</Listing>

我们为 `content` 方法添加了一个默认实现，返回空字符串切片。这意味着我们不需要在 `Draft` 和 `PendingReview` 结构体上实现 `content`。`Published` 结构体将覆盖 `content` 方法并返回 `post.content` 中的值。虽然这很方便，但让 `State` 上的 `content` 方法来决定 `Post` 的内容，模糊了 `State` 和 `Post` 各自职责之间的界限。

注意，我们需要在这个方法上添加生命周期标注，正如我们在第 10 章中讨论的那样。我们接受一个 `post` 的引用作为参数，并返回该 `post` 的一部分的引用，所以返回引用的生命周期与 `post` 参数的生命周期相关。

大功告成——Listing 18-11 的全部内容现在都能工作了！我们已经用博客文章工作流的规则实现了状态模式。与规则相关的逻辑存在于状态对象中，而不是分散在 `Post` 各处。

> ### 为什么不用枚举？
>
> 你可能一直在想，为什么我们不用一个枚举，将不同的文章状态作为变体。这当然是一种可行的方案；试试看并比较最终结果，看看你更喜欢哪种！使用枚举的一个缺点是，每个检查枚举值的地方都需要一个 `match` 表达式或类似的结构来处理每个可能的变体。这可能比 trait 对象方案更加重复。

<!-- Old headings. Do not remove or links may break. -->

<a id="trade-offs-of-the-state-pattern"></a>

#### 评估状态模式

我们已经展示了 Rust 能够实现面向对象的状态模式，以封装文章在每个状态下应具有的不同行为。`Post` 上的方法对各种行为一无所知。按照我们组织代码的方式，我们只需要在一个地方查看就能知道已发布文章的不同行为方式：`Published` 结构体上 `State` trait 的实现。

如果我们创建一个不使用状态模式的替代实现，我们可能会在 `Post` 的方法中使用 `match` 表达式，甚至在 `main` 代码中检查文章的状态并在那些地方改变行为。那意味着我们必须在多个地方查看才能理解文章处于已发布状态的所有含义。

使用状态模式，`Post` 的方法和使用 `Post` 的地方都不需要 `match` 表达式，而且要添加新状态，我们只需要添加一个新结构体并在一个地方为该结构体实现 trait 方法即可。

使用状态模式的实现很容易扩展以添加更多功能。为了体会维护使用状态模式的代码有多简单，试试以下几个建议：

- 添加一个 `reject` 方法，将文章的状态从 `PendingReview` 变回 `Draft`。
- 要求调用两次 `approve` 才能将状态变为 `Published`。
- 只允许用户在文章处于 `Draft` 状态时添加文本内容。提示：让状态对象负责决定内容可能发生什么变化，但不负责修改 `Post`。

状态模式的一个缺点是，由于状态实现了状态之间的转换，一些状态之间是相互耦合的。如果我们在 `PendingReview` 和 `Published` 之间添加另一个状态，比如 `Scheduled`，我们就必须修改 `PendingReview` 中的代码，使其转换到 `Scheduled` 而不是 `Published`。如果 `PendingReview` 不需要因为新增状态而改变就好了，但那意味着需要切换到另一种设计模式。

另一个缺点是我们重复了一些逻辑。为了消除部分重复，我们可能会尝试为 `State` trait 上的 `request_review` 和 `approve` 方法创建返回 `self` 的默认实现。然而，这行不通：当将 `State` 用作 trait 对象时，trait 并不知道具体的 `self` 到底是什么类型，所以返回类型在编译时是未知的。（这是前面提到的 dyn 兼容性规则之一。）

其他重复之处包括 `Post` 上 `request_review` 和 `approve` 方法的相似实现。两个方法都对 `Post` 的 `state` 字段使用 `Option::take`，如果 `state` 是 `Some`，就委托给被包装值的同名方法实现，并将 `state` 字段的新值设置为结果。如果 `Post` 上有很多遵循这种模式的方法，我们可能会考虑定义一个宏来消除重复（参见第 20 章的["宏"][macros]<!-- ignore -->一节）。

通过完全按照面向对象语言的定义来实现状态模式，我们并没有充分利用 Rust 的优势。让我们看看可以对 `blog` crate 做哪些改变，使无效的状态和转换变成编译时错误。

### 将状态和行为编码为类型

我们将向你展示如何重新思考状态模式，以获得一组不同的取舍。我们不再完全封装状态和转换使得外部代码对它们一无所知，而是将状态编码为不同的类型。这样，Rust 的类型检查系统将通过发出编译器错误来阻止在只允许使用已发布文章的地方使用草稿文章。

让我们考虑 Listing 18-11 中 `main` 的第一部分：

<Listing file-name="src/main.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch18-oop/listing-18-11/src/main.rs:here}}
```

</Listing>

我们仍然允许使用 `Post::new` 创建草稿状态的新文章，以及向文章内容中添加文本的功能。但是，我们不再让草稿文章拥有一个返回空字符串的 `content` 方法，而是让草稿文章根本没有 `content` 方法。这样，如果我们尝试获取草稿文章的内容，就会得到一个编译器错误，告诉我们该方法不存在。因此，我们不可能在生产环境中意外显示草稿文章的内容，因为那段代码根本无法编译。Listing 18-19 展示了 `Post` 结构体和 `DraftPost` 结构体的定义，以及各自的方法。

<Listing number="18-19" file-name="src/lib.rs" caption="带有 `content` 方法的 `Post` 和没有 `content` 方法的 `DraftPost`">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-19/src/lib.rs}}
```

</Listing>

`Post` 和 `DraftPost` 结构体都有一个私有的 `content` 字段来存储博客文章文本。这些结构体不再有 `state` 字段，因为我们将状态的编码移到了结构体的类型上。`Post` 结构体将代表已发布的文章，它有一个返回 `content` 的 `content` 方法。

我们仍然有一个 `Post::new` 函数，但它返回的不是 `Post` 实例，而是 `DraftPost` 实例。因为 `content` 是私有的，而且没有任何函数返回 `Post`，所以目前不可能创建 `Post` 的实例。

`DraftPost` 结构体有一个 `add_text` 方法，所以我们可以像之前一样向 `content` 添加文本，但注意 `DraftPost` 没有定义 `content` 方法！所以现在程序确保所有文章都以草稿状态开始，而草稿文章的内容不可用于显示。任何试图绕过这些约束的尝试都会导致编译器错误。

<!-- Old headings. Do not remove or links may break. -->

<a id="implementing-transitions-as-transformations-into-different-types"></a>

那么，我们如何获得一篇已发布的文章呢？我们想要强制执行这样的规则：草稿文章必须经过审核和批准才能发布。处于待审核状态的文章仍然不应显示任何内容。让我们通过添加另一个结构体 `PendingReviewPost` 来实现这些约束，在 `DraftPost` 上定义 `request_review` 方法使其返回 `PendingReviewPost`，并在 `PendingReviewPost` 上定义 `approve` 方法使其返回 `Post`，如 Listing 18-20 所示。

<Listing number="18-20" file-name="src/lib.rs" caption="通过在 `DraftPost` 上调用 `request_review` 创建的 `PendingReviewPost`，以及将 `PendingReviewPost` 转变为已发布 `Post` 的 `approve` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-20/src/lib.rs:here}}
```

</Listing>

`request_review` 和 `approve` 方法获取 `self` 的所有权，从而消费 `DraftPost` 和 `PendingReviewPost` 实例，并分别将它们转换为 `PendingReviewPost` 和已发布的 `Post`。这样，在我们对 `DraftPost` 调用 `request_review` 之后，就不会有任何残留的 `DraftPost` 实例，以此类推。`PendingReviewPost` 结构体没有定义 `content` 方法，所以尝试读取其内容会导致编译器错误，就像 `DraftPost` 一样。因为获得一个定义了 `content` 方法的已发布 `Post` 实例的唯一方式是在 `PendingReviewPost` 上调用 `approve` 方法，而获得 `PendingReviewPost` 的唯一方式是在 `DraftPost` 上调用 `request_review` 方法，我们现在已经将博客文章工作流编码到了类型系统中。

但我们也必须对 `main` 做一些小改动。`request_review` 和 `approve` 方法返回新实例而不是修改它们被调用的结构体，所以我们需要添加更多的 `let post =` 遮蔽赋值来保存返回的实例。我们也不能再断言草稿和待审核文章的内容为空字符串了，也不需要这样做：我们无法再编译尝试使用这些状态下文章内容的代码了。`main` 中更新后的代码如 Listing 18-21 所示。

<Listing number="18-21" file-name="src/main.rs" caption="对 `main` 的修改，以使用博客文章工作流的新实现">

```rust,ignore
{{#rustdoc_include ../listings/ch18-oop/listing-18-21/src/main.rs}}
```

</Listing>

我们需要对 `main` 做的重新赋值 `post` 的改动意味着，这个实现不再完全遵循面向对象的状态模式了：状态之间的转换不再完全封装在 `Post` 的实现内部。然而，我们的收获是，由于类型系统和编译时的类型检查，无效状态现在变得不可能了！这确保了某些 bug，比如显示未发布文章的内容，会在它们进入生产环境之前就被发现。

试试在 Listing 18-21 之后的 `blog` crate 上完成本节开头建议的那些任务，看看你对这个版本代码的设计有什么看法。注意，其中一些任务在这个设计中可能已经完成了。

我们已经看到，尽管 Rust 能够实现面向对象设计模式，但其他模式，比如将状态编码到类型系统中，在 Rust 中同样可用。这些模式有不同的取舍。虽然你可能非常熟悉面向对象模式，但重新思考问题以利用 Rust 的特性可以带来好处，比如在编译时就防止某些 bug。由于所有权等面向对象语言所没有的特性，面向对象模式并不总是 Rust 中的最佳方案。

## 总结

无论你在阅读本章之后是否认为 Rust 是一门面向对象的语言，你现在都知道可以使用 trait 对象在 Rust 中获得一些面向对象的特性。动态分发可以为你的代码提供一些灵活性，但需要以少量运行时性能为代价。你可以利用这种灵活性来实现有助于代码可维护性的面向对象模式。Rust 还有其他面向对象语言所没有的特性，比如所有权。面向对象模式并不总是利用 Rust 优势的最佳方式，但它是一个可用的选项。

接下来，我们将学习模式（pattern），这是 Rust 的另一个提供大量灵活性的特性。我们在全书中已经简要地接触过它们，但还没有看到它们的全部能力。让我们开始吧！

[more-info-than-rustc]: ch09-03-to-panic-or-not-to-panic.html#cases-in-which-you-have-more-information-than-the-compiler
[macros]: ch20-05-macros.html#macros
