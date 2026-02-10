## 使用 `Box<T>` 指向堆上的数据

最简单直接的智能指针是 box，其类型写作 `Box<T>`。Box 允许你将数据存储在堆（heap）上而非栈（stack）上，留在栈上的则是指向堆数据的指针。关于栈和堆的区别，可以回顾第 4 章的内容。

Box 除了将数据存储在堆上而非栈上之外，没有额外的性能开销。不过它也没有太多额外的功能。你最常在以下场景中使用它们：

- 当你有一个在编译时无法确定大小的类型，而你又想在要求确切大小的上下文中使用该类型的值时
- 当你有大量数据，想要转移所有权同时确保数据不会被复制时
- 当你想拥有一个值，且只关心它实现了某个特定 trait 而不关心其具体类型时

我们将在["使用 Box 实现递归类型"](#enabling-recursive-types-with-boxes)<!-- ignore -->一节中演示第一种情况。对于第二种情况，转移大量数据的所有权可能会花费较长时间，因为数据会在栈上被复制。为了提升性能，我们可以将大量数据存储在堆上的 box 中。这样，只有少量的指针数据在栈上被复制，而它所引用的数据则保持在堆上的同一位置不动。第三种情况被称为 _trait 对象_（trait object），第 18 章的["使用 trait 对象来抽象不同类型的共同行为"][trait-objects]<!-- ignore -->专门讨论了这个主题。所以你在这里学到的内容，将在那一节中再次用到！

<!-- Old headings. Do not remove or links may break. -->

<a id="using-boxt-to-store-data-on-the-heap"></a>

### 在堆上存储数据

在讨论 `Box<T>` 的堆存储用例之前，我们先介绍其语法以及如何与存储在 `Box<T>` 中的值进行交互。

示例 15-1 展示了如何使用 box 在堆上存储一个 `i32` 值。

<Listing number="15-1" file-name="src/main.rs" caption="使用 box 在堆上存储一个 `i32` 值">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-01/src/main.rs}}
```

</Listing>

我们定义了变量 `b`，其值是一个指向值 `5` 的 `Box`，而 `5` 被分配在堆上。这个程序会打印 `b = 5`；在这种情况下，我们可以像访问栈上数据一样访问 box 中的数据。和任何拥有所有权的值一样，当 box 离开作用域时——就像 `b` 在 `main` 函数末尾那样——它会被释放。释放同时发生在 box 本身（存储在栈上）和它所指向的数据（存储在堆上）。

将单个值放在堆上并不是很有用，所以你不会经常单独以这种方式使用 box。将像单个 `i32` 这样的值放在栈上——它们默认就存储在那里——在大多数情况下更为合适。让我们来看一个如果没有 box 就无法定义某些类型的场景。

### 使用 Box 实现递归类型

_递归类型_（recursive type）的值可以包含另一个同类型的值作为自身的一部分。递归类型带来了一个问题，因为 Rust 需要在编译时知道一个类型占用多少空间。然而，递归类型的值的嵌套理论上可以无限继续下去，所以 Rust 无法知道该值需要多少空间。因为 box 有一个已知的大小，我们可以通过在递归类型定义中插入一个 box 来实现递归类型。

作为递归类型的一个例子，让我们来探索 cons list。这是一种在函数式编程语言中常见的数据类型。我们将定义的 cons list 类型除了递归部分之外非常简单直接；因此，这个例子中的概念在你遇到涉及递归类型的更复杂场景时都会很有用。

<!-- Old headings. Do not remove or links may break. -->

<a id="more-information-about-the-cons-list"></a>

#### 理解 Cons List

_cons list_ 是一种源自 Lisp 编程语言及其方言的数据结构，由嵌套的配对组成，是 Lisp 版本的链表。它的名字来自 Lisp 中的 `cons` 函数（_construct function_ 的缩写），该函数从两个参数构造一个新的配对。通过对一个由值和另一个配对组成的配对调用 `cons`，我们可以构造出由递归配对组成的 cons list。

例如，下面是一个包含列表 `1, 2, 3` 的 cons list 的伪代码表示，每个配对用括号括起来：

```text
(1, (2, (3, Nil)))
```

cons list 中的每个元素包含两个部分：当前项的值和下一项。列表中的最后一个元素只包含一个叫做 `Nil` 的值，没有下一项。cons list 通过递归调用 `cons` 函数来生成。表示递归基本情况的规范名称是 `Nil`。注意，这与第 6 章讨论的 "null" 或 "nil" 概念不同，后者表示无效或缺失的值。

cons list 在 Rust 中并不是一种常用的数据结构。在 Rust 中，当你需要一个元素列表时，`Vec<T>` 通常是更好的选择。其他更复杂的递归数据类型在各种场景中_确实_很有用，但从本章的 cons list 开始，我们可以在不受太多干扰的情况下探索 box 如何让我们定义递归数据类型。

示例 15-2 包含了一个 cons list 的枚举定义。注意这段代码还无法编译，因为 `List` 类型没有已知的大小，我们稍后会演示这一点。

<Listing number="15-2" file-name="src/main.rs" caption="第一次尝试定义一个枚举来表示 `i32` 值的 cons list 数据结构">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-02/src/main.rs:here}}
```

</Listing>

> 注意：我们在这个例子中实现的 cons list 只存储 `i32` 值。我们本可以使用泛型来实现它，正如第 10 章讨论的那样，这样就能定义一个可以存储任意类型值的 cons list 类型。

使用 `List` 类型来存储列表 `1, 2, 3` 的代码如示例 15-3 所示。

<Listing number="15-3" file-name="src/main.rs" caption="使用 `List` 枚举来存储列表 `1, 2, 3`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-03/src/main.rs:here}}
```

</Listing>

第一个 `Cons` 值存储了 `1` 和另一个 `List` 值。这个 `List` 值是另一个 `Cons` 值，存储了 `2` 和又一个 `List` 值。这个 `List` 值又是一个 `Cons` 值，存储了 `3` 和一个 `List` 值，最后这个 `List` 值是 `Nil`，即表示列表结束的非递归变体。

如果我们尝试编译示例 15-3 中的代码，会得到如示例 15-4 所示的错误。

<Listing number="15-4" caption="尝试定义递归枚举时得到的错误">

```console
{{#include ../listings/ch15-smart-pointers/listing-15-03/output.txt}}
```

</Listing>

错误信息显示这个类型"具有无限大小"。原因是我们定义的 `List` 有一个递归的变体：它直接持有另一个自身类型的值。因此，Rust 无法计算出存储一个 `List` 值需要多少空间。让我们来分析为什么会得到这个错误。首先，我们来看看 Rust 如何决定存储一个非递归类型的值需要多少空间。

#### 计算非递归类型的大小

回忆一下我们在第 6 章讨论枚举定义时在示例 6-2 中定义的 `Message` 枚举：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-02/src/main.rs:here}}
```

为了确定为一个 `Message` 值分配多少空间，Rust 会遍历每个变体，看哪个变体需要最多的空间。Rust 发现 `Message::Quit` 不需要任何空间，`Message::Move` 需要足够存储两个 `i32` 值的空间，以此类推。因为只会使用一个变体，所以一个 `Message` 值最多需要的空间就是存储其最大变体所需的空间。

将此与 Rust 尝试确定像示例 15-2 中 `List` 枚举这样的递归类型需要多少空间时的情况进行对比。编译器首先查看 `Cons` 变体，它持有一个 `i32` 类型的值和一个 `List` 类型的值。因此，`Cons` 需要的空间等于一个 `i32` 的大小加上一个 `List` 的大小。为了计算 `List` 类型需要多少内存，编译器查看其变体，从 `Cons` 变体开始。`Cons` 变体持有一个 `i32` 类型的值和一个 `List` 类型的值，这个过程会无限继续下去，如图 15-1 所示。

<img alt="An infinite Cons list: a rectangle labeled 'Cons' split into two smaller rectangles. The first smaller rectangle holds the label 'i32', and the second smaller rectangle holds the label 'Cons' and a smaller version of the outer 'Cons' rectangle. The 'Cons' rectangles continue to hold smaller and smaller versions of themselves until the smallest comfortably sized rectangle holds an infinity symbol, indicating that this repetition goes on forever." src="img/trpl15-01.svg" class="center" style="width: 50%;" />

<span class="caption">图 15-1：由无限个 `Cons` 变体组成的无限 `List`</span>

<!-- Old headings. Do not remove or links may break. -->

<a id="using-boxt-to-get-a-recursive-type-with-a-known-size"></a>

#### 使递归类型具有已知大小

因为 Rust 无法计算出递归定义的类型需要分配多少空间，编译器给出了一个包含有用建议的错误信息：

<!-- manual-regeneration
after doing automatic regeneration, look at listings/ch15-smart-pointers/listing-15-03/output.txt and copy the relevant line
-->

```text
help: insert some indirection (e.g., a `Box`, `Rc`, or `&`) to break the cycle
  |
2 |     Cons(i32, Box<List>),
  |               ++++    +
```

在这个建议中，_间接引用_（indirection）意味着我们不直接存储一个值，而是应该修改数据结构，通过存储一个指向该值的指针来间接地存储它。

因为 `Box<T>` 是一个指针，Rust 始终知道一个 `Box<T>` 需要多少空间：指针的大小不会因为它所指向的数据量而改变。这意味着我们可以在 `Cons` 变体中放入一个 `Box<T>`，而不是直接放入另一个 `List` 值。`Box<T>` 将指向下一个 `List` 值，该值将位于堆上而非 `Cons` 变体内部。从概念上讲，我们仍然有一个由列表嵌套列表创建的列表，但这种实现方式现在更像是将各项并排放置，而非嵌套在彼此内部。

我们可以将示例 15-2 中 `List` 枚举的定义和示例 15-3 中 `List` 的用法修改为示例 15-5 中的代码，这样就能编译通过了。

<Listing number="15-5" file-name="src/main.rs" caption="使用 `Box<T>` 的 `List` 定义，以获得已知大小">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-05/src/main.rs}}
```

</Listing>

`Cons` 变体需要一个 `i32` 的大小加上存储 box 指针数据的空间。`Nil` 变体不存储任何值，因此它比 `Cons` 变体需要更少的栈空间。我们现在知道任何 `List` 值都将占用一个 `i32` 的大小加上一个 box 指针数据的大小。通过使用 box，我们打破了无限递归链，编译器就能计算出存储一个 `List` 值所需的大小了。图 15-2 展示了现在 `Cons` 变体的样子。

<img alt="A rectangle labeled 'Cons' split into two smaller rectangles. The first smaller rectangle holds the label 'i32', and the second smaller rectangle holds the label 'Box' with one inner rectangle that contains the label 'usize', representing the finite size of the box's pointer." src="img/trpl15-02.svg" class="center" />

<span class="caption">图 15-2：不再是无限大小的 `List`，因为 `Cons` 持有的是一个 `Box`</span>

Box 只提供了间接引用和堆分配功能；它们没有其他特殊能力，比如我们将在其他智能指针类型中看到的那些。它们也没有这些特殊能力带来的性能开销，因此在像 cons list 这样只需要间接引用功能的场景中非常有用。我们将在第 18 章中看到更多 box 的使用场景。

`Box<T>` 类型是智能指针，因为它实现了 `Deref` trait，这使得 `Box<T>` 的值可以像引用一样被使用。当一个 `Box<T>` 值离开作用域时，由于 `Drop` trait 的实现，box 所指向的堆数据也会被清理。这两个 trait 对于本章其余部分将讨论的其他智能指针类型所提供的功能更加重要。让我们更详细地探索这两个 trait。

[trait-objects]: ch18-02-trait-objects.html#using-trait-objects-to-abstract-over-shared-behavior
