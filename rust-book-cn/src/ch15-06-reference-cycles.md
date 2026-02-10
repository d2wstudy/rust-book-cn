## 引用循环会导致内存泄漏

Rust 的内存安全保证使得意外创建永远不会被清理的内存（即 _内存泄漏_（memory leak））变得困难，但并非不可能。完全防止内存泄漏并不是 Rust 的保证之一，这意味着内存泄漏在 Rust 中是内存安全的。我们可以看到，通过使用 `Rc<T>` 和 `RefCell<T>`，Rust 允许内存泄漏的发生：可以创建各项互相引用形成循环的引用。这会造成内存泄漏，因为循环中每一项的引用计数永远不会达到 0，值也永远不会被丢弃。

### 创建引用循环

让我们看看引用循环是如何发生的以及如何防止它，首先从示例 15-25 中 `List` 枚举的定义和 `tail` 方法开始。

<Listing number="15-25" file-name="src/main.rs" caption="一个持有 `RefCell<T>` 的 cons list 定义，以便我们可以修改 `Cons` 变体所引用的内容">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-25/src/main.rs:here}}
```

</Listing>

我们使用了示例 15-5 中 `List` 定义的另一个变体。`Cons` 变体中的第二个元素现在是 `RefCell<Rc<List>>`，这意味着不同于示例 15-24 中修改 `i32` 值的做法，我们希望修改 `Cons` 变体所指向的 `List` 值。我们还添加了一个 `tail` 方法，以便在有 `Cons` 变体时能方便地访问第二个元素。

在示例 15-26 中，我们添加了一个使用示例 15-25 中定义的 `main` 函数。这段代码在 `a` 中创建了一个列表，在 `b` 中创建了一个指向 `a` 中列表的列表。然后，它修改 `a` 中的列表使其指向 `b`，从而创建了一个引用循环。在这个过程中，有一些 `println!` 语句来展示各个时刻的引用计数。

<Listing number="15-26" file-name="src/main.rs" caption="创建两个互相指向的 `List` 值的引用循环">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-26/src/main.rs:here}}
```

</Listing>

我们创建了一个 `Rc<List>` 实例，在变量 `a` 中存放了一个初始列表 `5, Nil` 的 `List` 值。然后创建了另一个 `Rc<List>` 实例，在变量 `b` 中存放了包含值 `10` 并指向 `a` 中列表的另一个 `List` 值。

我们修改 `a` 使其指向 `b` 而不是 `Nil`，从而创建了一个循环。我们通过使用 `tail` 方法获取 `a` 中 `RefCell<Rc<List>>` 的引用，并将其存入变量 `link`。然后使用 `RefCell<Rc<List>>` 上的 `borrow_mut` 方法，将其中的值从持有 `Nil` 值的 `Rc<List>` 改为 `b` 中的 `Rc<List>`。

当我们运行这段代码时，暂时保持最后一个 `println!` 被注释掉，我们会得到如下输出：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-26/output.txt}}
```

在我们将 `a` 中的列表改为指向 `b` 之后，`a` 和 `b` 中 `Rc<List>` 实例的引用计数都是 2。在 `main` 的末尾，Rust 丢弃变量 `b`，这将 `b` 的 `Rc<List>` 实例的引用计数从 2 减少到 1。此时 `Rc<List>` 在堆上的内存不会被释放，因为其引用计数是 1 而不是 0。然后 Rust 丢弃 `a`，这同样将 `a` 的 `Rc<List>` 实例的引用计数从 2 减少到 1。这个实例的内存也无法被释放，因为另一个 `Rc<List>` 实例仍然引用着它。分配给列表的内存将永远无法被回收。为了可视化这个引用循环，我们创建了图 15-4 所示的示意图。

<img alt="A rectangle labeled 'a' that points to a rectangle containing the integer 5. A rectangle labeled 'b' that points to a rectangle containing the integer 10. The rectangle containing 5 points to the rectangle containing 10, and the rectangle containing 10 points back to the rectangle containing 5, creating a cycle." src="img/trpl15-04.svg" class="center" />

<span class="caption">图 15-4：列表 `a` 和 `b` 互相指向形成的引用循环</span>

如果你取消最后一个 `println!` 的注释并运行程序，Rust 会尝试打印这个循环，`a` 指向 `b`，`b` 又指向 `a`，如此反复，直到栈溢出。

与实际程序相比，在这个例子中创建引用循环的后果并不严重：在我们创建引用循环之后，程序就结束了。然而，如果一个更复杂的程序在循环中分配了大量内存并长时间持有，程序将使用比实际需要更多的内存，并可能压垮系统，导致可用内存耗尽。

创建引用循环并不容易做到，但也不是不可能。如果你有包含 `Rc<T>` 值的 `RefCell<T>` 值，或者类似的具有内部可变性和引用计数的嵌套类型组合，你必须确保不会创建循环；你不能依赖 Rust 来捕获它们。创建引用循环是程序中的一个逻辑错误，你应该使用自动化测试、代码审查和其他软件开发实践来将其最小化。

避免引用循环的另一个解决方案是重新组织数据结构，使得一些引用表达所有权而另一些引用不表达所有权。这样，你可以拥有由一些所有权关系和一些非所有权关系组成的循环，而只有所有权关系会影响值是否可以被丢弃。在示例 15-25 中，我们总是希望 `Cons` 变体拥有其列表，所以重新组织数据结构是不可能的。让我们看一个使用由父节点和子节点组成的图的例子，来了解非所有权关系何时是防止引用循环的合适方式。

<!-- Old headings. Do not remove or links may break. -->

<a id="preventing-reference-cycles-turning-an-rct-into-a-weakt"></a>

### 使用 `Weak<T>` 避免引用循环

到目前为止，我们已经演示了调用 `Rc::clone` 会增加 `Rc<T>` 实例的 `strong_count`，而 `Rc<T>` 实例只有在其 `strong_count` 为 0 时才会被清理。你也可以通过调用 `Rc::downgrade` 并传入 `Rc<T>` 的引用来创建对 `Rc<T>` 实例中值的弱引用（weak reference）。*强引用*（strong references）是你共享 `Rc<T>` 实例所有权的方式。*弱引用*（weak references）不表达所有权关系，它们的计数不会影响 `Rc<T>` 实例何时被清理。它们不会导致引用循环，因为任何涉及弱引用的循环都会在相关值的强引用计数变为 0 时被打破。

当你调用 `Rc::downgrade` 时，你会得到一个 `Weak<T>` 类型的智能指针。调用 `Rc::downgrade` 不会将 `Rc<T>` 实例的 `strong_count` 加 1，而是将 `weak_count` 加 1。`Rc<T>` 类型使用 `weak_count` 来跟踪存在多少个 `Weak<T>` 引用，类似于 `strong_count`。区别在于 `weak_count` 不需要为 0 就可以清理 `Rc<T>` 实例。

因为 `Weak<T>` 引用的值可能已经被丢弃了，所以要对 `Weak<T>` 所指向的值做任何操作，你必须确保该值仍然存在。通过调用 `Weak<T>` 实例上的 `upgrade` 方法来实现这一点，它会返回一个 `Option<Rc<T>>`。如果 `Rc<T>` 值尚未被丢弃，你会得到 `Some` 结果；如果 `Rc<T>` 值已经被丢弃，你会得到 `None` 结果。因为 `upgrade` 返回的是 `Option<Rc<T>>`，Rust 会确保 `Some` 和 `None` 两种情况都被处理，所以不会出现无效指针。

作为示例，我们将创建一棵树，其中的节点不仅知道自己的子节点，还知道自己的父节点，而不是使用只知道下一项的列表。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-a-tree-data-structure-a-node-with-child-nodes"></a>

#### 创建树形数据结构

首先，我们将构建一棵树，其节点知道自己的子节点。我们将创建一个名为 `Node` 的结构体，它持有自己的 `i32` 值以及对其子 `Node` 值的引用：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-27/src/main.rs:here}}
```

我们希望 `Node` 拥有其子节点，并且希望与变量共享这种所有权，以便我们可以直接访问树中的每个 `Node`。为此，我们将 `Vec<T>` 的元素定义为 `Rc<Node>` 类型的值。我们还希望能修改哪些节点是另一个节点的子节点，因此在 `children` 中用 `RefCell<T>` 包裹了 `Vec<Rc<Node>>`。

接下来，我们将使用这个结构体定义，创建一个名为 `leaf` 的 `Node` 实例（值为 `3`，没有子节点），以及另一个名为 `branch` 的实例（值为 `5`，`leaf` 作为其子节点之一），如示例 15-27 所示。

<Listing number="15-27" file-name="src/main.rs" caption="创建一个没有子节点的 `leaf` 节点和一个以 `leaf` 作为子节点的 `branch` 节点">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-27/src/main.rs:there}}
```

</Listing>

我们克隆了 `leaf` 中的 `Rc<Node>` 并将其存储在 `branch` 中，这意味着 `leaf` 中的 `Node` 现在有两个所有者：`leaf` 和 `branch`。我们可以通过 `branch.children` 从 `branch` 访问到 `leaf`，但无法从 `leaf` 访问到 `branch`。原因是 `leaf` 没有对 `branch` 的引用，也不知道它们之间存在关联。我们希望 `leaf` 知道 `branch` 是它的父节点。接下来我们就来实现这一点。

#### 增加从子节点到父节点的引用

为了让子节点知道它的父节点，我们需要在 `Node` 结构体定义中添加一个 `parent` 字段。问题在于决定 `parent` 的类型应该是什么。我们知道它不能包含 `Rc<T>`，因为那样会创建一个引用循环：`leaf.parent` 指向 `branch`，而 `branch.children` 指向 `leaf`，这会导致它们的 `strong_count` 值永远不会为 0。

从另一个角度思考这些关系，父节点应该拥有其子节点：如果父节点被丢弃，其子节点也应该被丢弃。然而，子节点不应该拥有其父节点：如果我们丢弃一个子节点，父节点应该仍然存在。这正是弱引用的用武之地！

因此，我们将 `parent` 的类型设为 `Weak<T>` 而不是 `Rc<T>`，具体来说是 `RefCell<Weak<Node>>`。现在我们的 `Node` 结构体定义如下：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-28/src/main.rs:here}}
```

一个节点将能够引用其父节点，但不拥有其父节点。在示例 15-28 中，我们更新 `main` 以使用这个新定义，这样 `leaf` 节点就有了一种引用其父节点 `branch` 的方式。

<Listing number="15-28" file-name="src/main.rs" caption="一个 `leaf` 节点，持有对其父节点 `branch` 的弱引用">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-28/src/main.rs:there}}
```

</Listing>

创建 `leaf` 节点的方式与示例 15-27 类似，不同之处在于 `parent` 字段：`leaf` 一开始没有父节点，所以我们创建了一个新的空 `Weak<Node>` 引用实例。

此时，当我们尝试通过 `upgrade` 方法获取 `leaf` 的父节点引用时，我们会得到一个 `None` 值。我们可以在第一个 `println!` 语句的输出中看到这一点：

```text
leaf parent = None
```

当我们创建 `branch` 节点时，它的 `parent` 字段中也会有一个新的 `Weak<Node>` 引用，因为 `branch` 没有父节点。我们仍然将 `leaf` 作为 `branch` 的子节点之一。一旦我们有了 `branch` 中的 `Node` 实例，就可以修改 `leaf`，给它一个指向其父节点的 `Weak<Node>` 引用。我们使用 `leaf` 的 `parent` 字段中 `RefCell<Weak<Node>>` 上的 `borrow_mut` 方法，然后使用 `Rc::downgrade` 函数从 `branch` 中的 `Rc<Node>` 创建一个指向 `branch` 的 `Weak<Node>` 引用。

当我们再次打印 `leaf` 的父节点时，这次我们会得到一个持有 `branch` 的 `Some` 变体：现在 `leaf` 可以访问它的父节点了！当我们打印 `leaf` 时，我们也避免了像示例 15-26 中那样最终导致栈溢出的循环；`Weak<Node>` 引用被打印为 `(Weak)`：

```text
leaf parent = Some(Node { value: 5, parent: RefCell { value: (Weak) },
children: RefCell { value: [Node { value: 3, parent: RefCell { value: (Weak) },
children: RefCell { value: [] } }] } })
```

没有无限输出表明这段代码没有创建引用循环。我们也可以通过查看调用 `Rc::strong_count` 和 `Rc::weak_count` 得到的值来确认这一点。

#### 可视化 `strong_count` 和 `weak_count` 的变化

让我们看看 `Rc<Node>` 实例的 `strong_count` 和 `weak_count` 值是如何变化的，方法是创建一个新的内部作用域并将 `branch` 的创建移入该作用域。这样我们就可以看到 `branch` 被创建然后在离开作用域时被丢弃会发生什么。修改如示例 15-29 所示。

<Listing number="15-29" file-name="src/main.rs" caption="在内部作用域中创建 `branch` 并检查强引用和弱引用计数">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-29/src/main.rs:here}}
```

</Listing>

`leaf` 创建之后，其 `Rc<Node>` 的强引用计数为 1，弱引用计数为 0。在内部作用域中，我们创建了 `branch` 并将其与 `leaf` 关联，此时当我们打印计数时，`branch` 中的 `Rc<Node>` 的强引用计数为 1，弱引用计数为 1（因为 `leaf.parent` 通过 `Weak<Node>` 指向了 `branch`）。当我们打印 `leaf` 的计数时，会看到它的强引用计数为 2，因为 `branch` 现在在 `branch.children` 中存储了 `leaf` 的 `Rc<Node>` 的克隆，但弱引用计数仍然为 0。

当内部作用域结束时，`branch` 离开作用域，`Rc<Node>` 的强引用计数减少到 0，因此其 `Node` 被丢弃。来自 `leaf.parent` 的弱引用计数 1 对 `Node` 是否被丢弃没有影响，所以我们不会产生任何内存泄漏！

如果我们在作用域结束后尝试访问 `leaf` 的父节点，我们会再次得到 `None`。在程序结束时，`leaf` 中的 `Rc<Node>` 的强引用计数为 1，弱引用计数为 0，因为变量 `leaf` 现在又是 `Rc<Node>` 的唯一引用了。

所有管理计数和值丢弃的逻辑都内置在 `Rc<T>` 和 `Weak<T>` 以及它们的 `Drop` trait 实现中。通过在 `Node` 的定义中指定从子节点到父节点的关系应该是 `Weak<T>` 引用，你就能够让父节点指向子节点，反之亦然，而不会创建引用循环和内存泄漏。

## 总结

本章介绍了如何使用智能指针来做出与 Rust 默认的常规引用不同的保证和取舍。`Box<T>` 类型具有已知的大小，并指向分配在堆上的数据。`Rc<T>` 类型跟踪堆上数据的引用计数，使得数据可以拥有多个所有者。`RefCell<T>` 类型及其内部可变性为我们提供了一种类型，当我们需要一个不可变类型但又需要改变其内部值时可以使用它；它还在运行时而非编译时强制执行借用规则。

我们还讨论了 `Deref` 和 `Drop` trait，它们实现了智能指针的许多功能。我们探索了可能导致内存泄漏的引用循环，以及如何使用 `Weak<T>` 来防止它们。

如果本章引起了你的兴趣，并且你想实现自己的智能指针，请查阅 ["The Rustonomicon"][nomicon] 以获取更多有用的信息。

接下来，我们将讨论 Rust 中的并发。你甚至会学到一些新的智能指针。

[nomicon]: ../nomicon/index.html
