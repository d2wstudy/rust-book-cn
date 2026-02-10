## 使用 `Drop` Trait 运行清理代码

对智能指针模式而言，第二个重要的 trait 是 `Drop`，它允许你自定义当值即将离开作用域时的行为。你可以为任何类型实现 `Drop` trait，这些代码可用于释放文件或网络连接等资源。

我们在智能指针的上下文中介绍 `Drop`，是因为 `Drop` trait 的功能几乎总是在实现智能指针时使用。例如，当 `Box<T>` 被丢弃时，它会释放 box 所指向的堆上空间。

在某些语言中，对于某些类型，程序员每次使用完这些类型的实例后都必须手动调用代码来释放内存或资源。例如文件句柄、套接字和锁。如果程序员忘记了，系统可能会过载并崩溃。在 Rust 中，你可以指定每当值离开作用域时运行一段特定的代码，编译器会自动插入这些代码。因此，你无需在程序中到处小心翼翼地放置清理代码——你仍然不会泄漏资源！

你可以通过实现 `Drop` trait 来指定值离开作用域时要运行的代码。`Drop` trait 要求你实现一个名为 `drop` 的方法，它接受一个 `self` 的可变引用。为了观察 Rust 何时调用 `drop`，我们先用 `println!` 语句来实现 `drop`。

示例 15-14 展示了一个 `CustomSmartPointer` 结构体，它唯一的自定义功能是在实例离开作用域时打印 `Dropping CustomSmartPointer!`，以展示 Rust 何时运行 `drop` 方法。

<Listing number="15-14" file-name="src/main.rs" caption="一个实现了 `Drop` trait 的 `CustomSmartPointer` 结构体，我们会在这里放置清理代码">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-14/src/main.rs}}
```

</Listing>

`Drop` trait 包含在 prelude 中，所以我们无需将其引入作用域。我们在 `CustomSmartPointer` 上实现了 `Drop` trait，并提供了一个调用 `println!` 的 `drop` 方法实现。`drop` 方法体是你放置当类型实例离开作用域时要运行的任何逻辑的地方。我们在这里打印一些文本，以直观地展示 Rust 何时调用 `drop`。

在 `main` 中，我们创建了两个 `CustomSmartPointer` 实例，然后打印了 `CustomSmartPointers created`。在 `main` 的末尾，我们的 `CustomSmartPointer` 实例将离开作用域，Rust 会调用我们放在 `drop` 方法中的代码，打印出最终的消息。注意我们不需要显式调用 `drop` 方法。

当我们运行这个程序时，会看到如下输出：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-14/output.txt}}
```

Rust 在实例离开作用域时自动为我们调用了 `drop`，执行了我们指定的代码。变量以其创建顺序的相反顺序被丢弃，所以 `d` 在 `c` 之前被丢弃。这个例子的目的是让你直观地了解 `drop` 方法的工作方式；通常你会指定类型需要运行的清理代码，而不是打印消息。

<!-- Old headings. Do not remove or links may break. -->

<a id="dropping-a-value-early-with-std-mem-drop"></a>

遗憾的是，禁用自动 `drop` 功能并不简单。通常也不需要禁用它；`Drop` trait 的核心意义就在于它会被自动处理。然而，有时你可能希望提前清理某个值。一个例子是使用管理锁的智能指针时：你可能希望强制调用释放锁的 `drop` 方法，以便同一作用域中的其他代码可以获取该锁。Rust 不允许你手动调用 `Drop` trait 的 `drop` 方法；如果你想在值离开作用域之前强制丢弃它，需要调用标准库提供的 `std::mem::drop` 函数。

如果我们尝试通过修改示例 15-14 中的 `main` 函数来手动调用 `Drop` trait 的 `drop` 方法，将无法通过编译，如示例 15-15 所示。

<Listing number="15-15" file-name="src/main.rs" caption="尝试手动调用 `Drop` trait 的 `drop` 方法来提前清理">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-15/src/main.rs:here}}
```

</Listing>

当我们尝试编译这段代码时，会得到如下错误：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-15/output.txt}}
```

这个错误信息表明我们不允许显式调用 `drop`。错误信息中使用了术语**析构函数**（_destructor_），这是清理实例的函数的通用编程术语。**析构函数**与**构造函数**（_constructor_）相对应，构造函数用于创建实例。Rust 中的 `drop` 函数就是一种特定的析构函数。

Rust 不允许我们显式调用 `drop`，因为 Rust 仍然会在 `main` 末尾自动对该值调用 `drop`。这会导致**双重释放**（double free）错误，因为 Rust 会尝试清理同一个值两次。

我们既不能禁用值离开作用域时自动插入的 `drop`，也不能显式调用 `drop` 方法。所以，如果我们需要强制提前清理一个值，可以使用 `std::mem::drop` 函数。

`std::mem::drop` 函数不同于 `Drop` trait 中的 `drop` 方法。我们通过将想要强制丢弃的值作为参数传递给它来调用。该函数位于 prelude 中，所以我们可以修改示例 15-15 中的 `main` 来调用 `drop` 函数，如示例 15-16 所示。

<Listing number="15-16" file-name="src/main.rs" caption="调用 `std::mem::drop` 来在值离开作用域之前显式丢弃它">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-16/src/main.rs:here}}
```

</Listing>

运行这段代码会打印如下内容：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-16/output.txt}}
```

文本 ``Dropping CustomSmartPointer with data `some data`!`` 打印在 `CustomSmartPointer created` 和 `CustomSmartPointer dropped before the end of main` 之间，表明 `drop` 方法的代码在此处被调用以丢弃 `c`。

你可以通过多种方式使用 `Drop` trait 实现中指定的代码来使清理变得方便且安全：例如，你可以用它来创建自己的内存分配器！借助 `Drop` trait 和 Rust 的所有权系统，你不必记得手动清理，因为 Rust 会自动完成。

你也不必担心因意外清理仍在使用的值而导致的问题：确保引用始终有效的所有权系统同样保证了 `drop` 只会在值不再被使用时调用一次。

现在我们已经了解了 `Box<T>` 和智能指针的一些特性，接下来让我们看看标准库中定义的其他几种智能指针。
