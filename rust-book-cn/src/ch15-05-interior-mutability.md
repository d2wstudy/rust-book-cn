## `RefCell<T>` 与内部可变性模式

**内部可变性**（interior mutability）是 Rust 中的一种设计模式，它允许你在持有不可变引用的情况下修改数据；通常情况下，借用规则不允许这样做。为了实现数据的修改，该模式在数据结构内部使用 `unsafe` 代码来绕过 Rust 通常的可变性和借用规则。不安全代码向编译器表明，我们将手动检查这些规则，而不是依赖编译器来检查；我们将在第 20 章更详细地讨论不安全代码。

只有当我们能确保借用规则在运行时会被遵守时，才能使用采用内部可变性模式的类型，即使编译器无法保证这一点。其中涉及的 `unsafe` 代码被封装在安全的 API 中，而外部类型仍然是不可变的。

让我们通过研究遵循内部可变性模式的 `RefCell<T>` 类型来探索这个概念。

<!-- Old headings. Do not remove or links may break. -->

<a id="enforcing-borrowing-rules-at-runtime-with-refcellt"></a>

### 在运行时强制执行借用规则

与 `Rc<T>` 不同，`RefCell<T>` 类型代表其持有数据的单一所有权。那么，`RefCell<T>` 与 `Box<T>` 这样的类型有什么不同呢？回忆一下你在第 4 章学到的借用规则：

- 在任意给定时刻，你**只能**拥有一个可变引用或任意数量的不可变引用（二者不可兼得）。
- 引用必须始终有效。

对于引用和 `Box<T>`，借用规则的不变性在编译时强制执行。而对于 `RefCell<T>`，这些不变性在**运行时**强制执行。对于引用，如果你违反了这些规则，会得到一个编译器错误。而对于 `RefCell<T>`，如果你违反了这些规则，程序会 panic 并退出。

在编译时检查借用规则的优势在于，错误能在开发过程中更早被发现，并且不会对运行时性能产生影响，因为所有分析都在编译阶段完成了。因此，在大多数情况下，在编译时检查借用规则是最佳选择，这也是 Rust 的默认行为。

在运行时检查借用规则的优势在于，某些内存安全的场景得以被允许，而这些场景在编译时检查中会被拒绝。静态分析，比如 Rust 编译器，本质上是保守的。代码的某些属性通过分析代码是不可能检测到的：最著名的例子就是停机问题（Halting Problem），这超出了本书的范围，但它是一个值得研究的有趣话题。

因为某些分析是不可能完成的，如果 Rust 编译器无法确定代码是否符合所有权规则，它可能会拒绝一个正确的程序；从这个意义上说，它是保守的。如果 Rust 接受了一个不正确的程序，用户就无法信任 Rust 所做的保证。然而，如果 Rust 拒绝了一个正确的程序，虽然会给程序员带来不便，但不会发生灾难性的后果。当你确信代码遵循了借用规则，但编译器无法理解和保证这一点时，`RefCell<T>` 类型就很有用了。

与 `Rc<T>` 类似，`RefCell<T>` 只能用于单线程场景，如果你尝试在多线程上下文中使用它，会得到一个编译时错误。我们将在第 16 章讨论如何在多线程程序中获得 `RefCell<T>` 的功能。

以下是选择 `Box<T>`、`Rc<T>` 或 `RefCell<T>` 的理由总结：

- `Rc<T>` 允许同一数据有多个所有者；`Box<T>` 和 `RefCell<T>` 只有单一所有者。
- `Box<T>` 允许在编译时检查的不可变或可变借用；`Rc<T>` 只允许在编译时检查的不可变借用；`RefCell<T>` 允许在运行时检查的不可变或可变借用。
- 因为 `RefCell<T>` 允许在运行时检查的可变借用，所以即使 `RefCell<T>` 是不可变的，你也可以修改其内部的值。

在不可变值内部修改值就是内部可变性模式。让我们看一个内部可变性有用的场景，并探讨它是如何实现的。

<!-- Old headings. Do not remove or links may break. -->

<a id="interior-mutability-a-mutable-borrow-to-an-immutable-value"></a>

### 使用内部可变性

借用规则的一个推论是，当你有一个不可变值时，你不能对它进行可变借用。例如，以下代码无法编译：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/no-listing-01-cant-borrow-immutable-as-mutable/src/main.rs}}
```

如果你尝试编译这段代码，会得到以下错误：

```console
{{#include ../listings/ch15-smart-pointers/no-listing-01-cant-borrow-immutable-as-mutable/output.txt}}
```

然而，在某些情况下，让一个值在其方法内部修改自身、但对外部代码表现为不可变是很有用的。值的方法之外的代码将无法修改该值。使用 `RefCell<T>` 是获得内部可变性能力的一种方式，但 `RefCell<T>` 并没有完全绕过借用规则：编译器中的借用检查器允许这种内部可变性，而借用规则改为在运行时检查。如果你违反了规则，会得到一个 `panic!` 而不是编译器错误。

让我们通过一个实际的例子来演示如何使用 `RefCell<T>` 修改一个不可变值，并了解为什么这样做是有用的。

<!-- Old headings. Do not remove or links may break. -->

<a id="a-use-case-for-interior-mutability-mock-objects"></a>

#### 使用 Mock 对象进行测试

有时在测试中，程序员会用一个类型来替代另一个类型，以便观察特定的行为并断言其实现是正确的。这种占位类型被称为**测试替身**（test double）。可以把它想象成电影拍摄中的替身演员，由一个人代替演员来完成特别复杂的场景。测试替身在运行测试时代替其他类型。**Mock 对象**是特定类型的测试替身，它记录测试过程中发生的事情，以便你可以断言正确的操作已经执行。

Rust 没有像其他语言那样的对象概念，Rust 也没有像某些其他语言那样在标准库中内置 mock 对象功能。不过，你完全可以创建一个结构体来实现与 mock 对象相同的目的。

下面是我们要测试的场景：我们将创建一个库，用于跟踪某个值与最大值的接近程度，并根据当前值与最大值的比例发送消息。例如，这个库可以用来跟踪用户的 API 调用配额使用情况。

我们的库只提供跟踪值与最大值接近程度的功能，以及在什么时候应该发送什么消息。使用这个库的应用程序需要自行提供发送消息的机制：应用程序可以直接向用户显示消息、发送电子邮件、发送短信或执行其他操作。库不需要知道这些细节。它只需要一个实现了我们提供的 `Messenger` trait 的东西。示例 15-20 展示了这个库的代码。

<Listing number="15-20" file-name="src/lib.rs" caption="一个跟踪值与最大值接近程度的库，当值达到特定水平时发出警告">

```rust,noplayground
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-20/src/lib.rs}}
```

</Listing>

这段代码中一个重要的部分是 `Messenger` trait 有一个名为 `send` 的方法，它接受 `self` 的不可变引用和消息文本。这个 trait 就是我们的 mock 对象需要实现的接口，这样 mock 就可以像真实对象一样使用。另一个重要的部分是，我们想要测试 `LimitTracker` 上 `set_value` 方法的行为。我们可以改变传入的 `value` 参数值，但 `set_value` 没有返回任何东西供我们进行断言。我们希望能够验证：如果我们用一个实现了 `Messenger` trait 的东西和一个特定的 `max` 值创建了 `LimitTracker`，当我们传入不同的 `value` 值时，messenger 会被告知发送相应的消息。

我们需要一个 mock 对象，它在我们调用 `send` 时不会真的发送电子邮件或短信，而只是记录它被告知要发送的消息。我们可以创建一个 mock 对象的新实例，创建一个使用该 mock 对象的 `LimitTracker`，调用 `LimitTracker` 上的 `set_value` 方法，然后检查 mock 对象是否有我们期望的消息。示例 15-21 展示了一个尝试实现这样的 mock 对象的代码，但借用检查器不允许这样做。

<Listing number="15-21" file-name="src/lib.rs" caption="尝试实现一个借用检查器不允许的 `MockMessenger`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-21/src/lib.rs:here}}
```

</Listing>

这段测试代码定义了一个 `MockMessenger` 结构体，它有一个 `sent_messages` 字段，类型为 `Vec<String>`，用于记录它被告知要发送的消息。我们还定义了一个关联函数 `new`，方便创建以空消息列表开始的新 `MockMessenger` 值。然后我们为 `MockMessenger` 实现了 `Messenger` trait，这样就可以将 `MockMessenger` 传给 `LimitTracker`。在 `send` 方法的定义中，我们将传入的消息作为参数存储到 `MockMessenger` 的 `sent_messages` 列表中。

在测试中，我们测试的是当 `LimitTracker` 被告知将 `value` 设置为超过 `max` 值 75% 的某个值时会发生什么。首先，我们创建一个新的 `MockMessenger`，它以空消息列表开始。然后，我们创建一个新的 `LimitTracker`，并传入新 `MockMessenger` 的引用和 `max` 值 `100`。我们用值 `80` 调用 `LimitTracker` 的 `set_value` 方法，这超过了 100 的 75%。接着，我们断言 `MockMessenger` 记录的消息列表中应该有一条消息。

然而，这个测试有一个问题，如下所示：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-21/output.txt}}
```

我们无法修改 `MockMessenger` 来记录消息，因为 `send` 方法接受的是 `self` 的不可变引用。我们也不能采纳错误信息中的建议，在 `impl` 方法和 trait 定义中都使用 `&mut self`。我们不想仅仅为了测试而修改 `Messenger` trait。相反，我们需要找到一种方法，让我们的测试代码在现有设计下正确工作。

这正是内部可变性可以帮忙的场景！我们将 `sent_messages` 存储在 `RefCell<T>` 中，这样 `send` 方法就能修改 `sent_messages` 来存储我们看到的消息。示例 15-22 展示了具体的实现。

<Listing number="15-22" file-name="src/lib.rs" caption="使用 `RefCell<T>` 在外部值被视为不可变的情况下修改内部值">

```rust,noplayground
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-22/src/lib.rs:here}}
```

</Listing>

`sent_messages` 字段现在的类型是 `RefCell<Vec<String>>` 而不是 `Vec<String>`。在 `new` 函数中，我们围绕空向量创建了一个新的 `RefCell<Vec<String>>` 实例。

对于 `send` 方法的实现，第一个参数仍然是 `self` 的不可变借用，这与 trait 定义一致。我们对 `self.sent_messages` 中的 `RefCell<Vec<String>>` 调用 `borrow_mut`，以获取 `RefCell<Vec<String>>` 内部值（即向量）的可变引用。然后，我们可以对向量的可变引用调用 `push`，以记录测试期间发送的消息。

我们需要做的最后一个改动是在断言中：为了查看内部向量中有多少个元素，我们对 `RefCell<Vec<String>>` 调用 `borrow` 以获取向量的不可变引用。

现在你已经看到了如何使用 `RefCell<T>`，让我们深入了解它的工作原理！

<!-- Old headings. Do not remove or links may break. -->

<a id="keeping-track-of-borrows-at-runtime-with-refcellt"></a>

#### 在运行时跟踪借用

当创建不可变和可变引用时，我们分别使用 `&` 和 `&mut` 语法。对于 `RefCell<T>`，我们使用 `borrow` 和 `borrow_mut` 方法，它们是 `RefCell<T>` 安全 API 的一部分。`borrow` 方法返回智能指针类型 `Ref<T>`，`borrow_mut` 返回智能指针类型 `RefMut<T>`。这两个类型都实现了 `Deref`，所以我们可以像对待普通引用一样对待它们。

`RefCell<T>` 会跟踪当前有多少个 `Ref<T>` 和 `RefMut<T>` 智能指针处于活跃状态。每次调用 `borrow` 时，`RefCell<T>` 会将不可变借用的活跃计数加 1。当一个 `Ref<T>` 值离开作用域时，不可变借用的计数减 1。就像编译时的借用规则一样，`RefCell<T>` 在任何时刻都只允许拥有多个不可变借用或一个可变借用。

如果我们尝试违反这些规则，与使用引用时会得到编译器错误不同，`RefCell<T>` 的实现会在运行时 panic。示例 15-23 展示了对示例 15-22 中 `send` 实现的修改。我们故意尝试在同一作用域中创建两个活跃的可变借用，以说明 `RefCell<T>` 会在运行时阻止我们这样做。

<Listing number="15-23" file-name="src/lib.rs" caption="在同一作用域中创建两个可变引用，以观察 `RefCell<T>` 会 panic">

```rust,ignore,panics
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-23/src/lib.rs:here}}
```

</Listing>

我们为从 `borrow_mut` 返回的 `RefMut<T>` 智能指针创建了一个变量 `one_borrow`。然后，我们以同样的方式在变量 `two_borrow` 中创建了另一个可变借用。这在同一作用域中产生了两个可变引用，这是不允许的。当我们运行库的测试时，示例 15-23 中的代码可以编译通过而没有任何错误，但测试会失败：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-23/output.txt}}
```

注意代码 panic 并显示了消息 `already borrowed: BorrowMutError`。这就是 `RefCell<T>` 在运行时处理借用规则违规的方式。

选择在运行时而非编译时捕获借用错误，正如我们在这里所做的，意味着你可能会在开发过程的后期才发现代码中的错误：甚至可能直到代码部署到生产环境才发现。此外，由于在运行时而非编译时跟踪借用，你的代码会产生少量的运行时性能开销。然而，使用 `RefCell<T>` 使得编写一个能够修改自身以记录所见消息的 mock 对象成为可能，而你是在一个只允许不可变值的上下文中使用它。尽管 `RefCell<T>` 有这些权衡，你仍然可以使用它来获得比普通引用更多的功能。

<!-- Old headings. Do not remove or links may break. -->

<a id="having-multiple-owners-of-mutable-data-by-combining-rc-t-and-ref-cell-t"></a>
<a id="allowing-multiple-owners-of-mutable-data-with-rct-and-refcellt"></a>

### 允许可变数据有多个所有者

`RefCell<T>` 的一个常见用法是与 `Rc<T>` 结合使用。回忆一下，`Rc<T>` 允许某些数据有多个所有者，但它只提供对数据的不可变访问。如果你有一个持有 `RefCell<T>` 的 `Rc<T>`，你就可以得到一个既能有多个所有者**又**能修改的值！

例如，回忆一下示例 15-18 中的 cons list 例子，我们使用 `Rc<T>` 来允许多个列表共享另一个列表的所有权。因为 `Rc<T>` 只持有不可变值，所以一旦创建了列表中的值，就无法再修改它们。让我们加入 `RefCell<T>` 来获得修改列表中值的能力。示例 15-24 展示了通过在 `Cons` 定义中使用 `RefCell<T>`，我们可以修改所有列表中存储的值。

<Listing number="15-24" file-name="src/main.rs" caption="使用 `Rc<RefCell<i32>>` 创建一个可以修改的 `List`">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-24/src/main.rs}}
```

</Listing>

我们创建了一个 `Rc<RefCell<i32>>` 的实例，并将其存储在名为 `value` 的变量中，以便稍后可以直接访问它。然后，我们在 `a` 中创建了一个包含 `value` 的 `Cons` 变体的 `List`。我们需要克隆 `value`，这样 `a` 和 `value` 都拥有内部值 `5` 的所有权，而不是将所有权从 `value` 转移到 `a`，也不是让 `a` 从 `value` 借用。

我们将列表 `a` 包装在 `Rc<T>` 中，这样当我们创建列表 `b` 和 `c` 时，它们都可以引用 `a`，就像我们在示例 15-18 中所做的那样。

在创建了 `a`、`b` 和 `c` 中的列表之后，我们想要将 `value` 中的值加 10。我们通过对 `value` 调用 `borrow_mut` 来实现这一点，这里使用了我们在第 5 章["`->` 运算符到哪去了？"][wheres-the---operator]<!-- ignore -->中讨论的自动解引用功能，将 `Rc<T>` 解引用到内部的 `RefCell<T>` 值。`borrow_mut` 方法返回一个 `RefMut<T>` 智能指针，我们对其使用解引用运算符来修改内部值。

当我们打印 `a`、`b` 和 `c` 时，可以看到它们都有修改后的值 `15` 而不是 `5`：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-24/output.txt}}
```

这个技巧非常巧妙！通过使用 `RefCell<T>`，我们拥有了一个对外不可变的 `List` 值。但我们可以使用 `RefCell<T>` 提供的方法来访问其内部可变性，从而在需要时修改数据。借用规则的运行时检查保护我们免受数据竞争的影响，有时为了数据结构的灵活性而牺牲一点速度是值得的。注意 `RefCell<T>` 不适用于多线程代码！`Mutex<T>` 是 `RefCell<T>` 的线程安全版本，我们将在第 16 章讨论 `Mutex<T>`。

[wheres-the---operator]: ch05-03-method-syntax.html#wheres-the---operator
