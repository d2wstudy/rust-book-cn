## 什么是所有权？

所有权（ownership）是一组规则，用于管理 Rust 程序的内存使用方式。所有程序在运行时都必须管理其使用计算机内存的方式。有些语言通过垃圾回收机制在程序运行时不断寻找不再使用的内存；另一些语言则要求程序员显式地分配和释放内存。Rust 采用了第三种方式：通过所有权系统管理内存，编译器在编译时会检查一系列规则。如果违反了任何规则，程序将无法编译。所有权的任何特性都不会在程序运行时拖慢速度。

因为所有权对许多程序员来说是一个全新的概念，确实需要一些时间来适应。好消息是，随着你对 Rust 和所有权系统规则的经验越来越丰富，你会越来越自然地编写出安全且高效的代码。坚持下去！

当你理解了所有权，你就拥有了理解 Rust 独特特性的坚实基础。在本章中，你将通过一些围绕非常常见的数据结构——字符串——的示例来学习所有权。

> ### 栈与堆
>
> 许多编程语言不需要你经常考虑栈（stack）和堆（heap）的问题。但在像 Rust 这样的系统编程语言中，值位于栈上还是堆上会影响语言的行为方式，也会影响你必须做出的某些决策。本章后面会结合栈和堆来描述所有权的部分内容，这里先做一个简要的说明。
>
> 栈和堆都是代码在运行时可以使用的内存区域，但它们的组织方式不同。栈按照获取值的顺序存储，并以相反的顺序移除值。这被称为*后进先出（last in, first out, LIFO）*。想象一叠盘子：当你添加更多盘子时，你把它们放在最上面；当你需要一个盘子时，你从最上面取一个。从中间或底部添加或移除盘子就不太方便了！添加数据叫做*入栈（pushing onto the stack）*，移除数据叫做*出栈（popping off the stack）*。栈上存储的所有数据都必须具有已知的固定大小。在编译时大小未知或大小可能变化的数据必须存储在堆上。
>
> 堆的组织性较差：当你把数据放到堆上时，你请求一定量的空间。内存分配器在堆中找到一块足够大的空闲区域，将其标记为已使用，并返回一个*指针（pointer）*，即该位置的地址。这个过程叫做*在堆上分配（allocating on the heap）*，有时简称为*分配（allocating）*（将值压入栈不被视为分配）。因为指向堆的指针是已知的固定大小，你可以将指针存储在栈上，但当你需要实际数据时，必须通过指针去访问。想象一下在餐厅就座的场景：当你进入餐厅时，你说明你们一行有几个人，服务员找到一张能容纳所有人的空桌子并带你们过去。如果你们中有人迟到了，他们可以询问你们坐在哪里来找到你们。
>
> 入栈比在堆上分配更快，因为分配器不需要搜索存储新数据的位置——那个位置总是在栈顶。相比之下，在堆上分配空间需要更多工作，因为分配器必须先找到一块足够大的空间来存放数据，然后进行记录以准备下一次分配。
>
> 访问堆上的数据通常比访问栈上的数据慢，因为你必须通过指针才能到达那里。现代处理器在内存中跳转越少就越快。继续用餐厅的类比，想象一个服务员在许多桌子之间接受点单。最高效的方式是在一张桌子上接完所有点单后再去下一张桌子。先从 A 桌接一个点单，再从 B 桌接一个，然后再回到 A 桌，再去 B 桌，这样的过程会慢得多。同样道理，处理器处理彼此靠近的数据（如栈上的数据）时效率更高，而处理彼此较远的数据（如堆上的数据）时效率较低。
>
> 当你的代码调用一个函数时，传递给函数的值（可能包括指向堆上数据的指针）和函数的局部变量会被压入栈中。当函数结束时，这些值会从栈中弹出。
>
> 跟踪代码的哪些部分正在使用堆上的哪些数据、最小化堆上的重复数据量、以及清理堆上不再使用的数据以避免空间耗尽——这些都是所有权要解决的问题。一旦你理解了所有权，你就不需要经常考虑栈和堆了。但了解所有权的主要目的是管理堆数据，有助于解释它为什么以这种方式工作。

### 所有权规则

首先，让我们看一下所有权规则。在我们学习后面的示例时，请牢记这些规则：

- Rust 中的每一个值都有一个*所有者（owner）*。
- 值在任一时刻有且只有一个所有者。
- 当所有者离开作用域时，值将被丢弃。

### 变量作用域

既然我们已经掌握了基本的 Rust 语法，就不会在示例中包含所有的 `fn main() {` 代码了，所以如果你在跟着操作，请确保手动将以下示例放入 `main` 函数中。这样我们的示例会更简洁一些，让我们能够专注于实际的细节而非样板代码。

作为所有权的第一个示例，我们来看一些变量的作用域。*作用域（scope）*是一个项在程序中有效的范围。看下面这个变量：

```rust
let s = "hello";
```

变量 `s` 引用了一个字符串字面值，其中字符串的值被硬编码到程序的文本中。这个变量从声明的位置开始直到当前作用域结束都是有效的。示例 4-1 展示了一个带有注释的程序，标注了变量 `s` 有效的位置。

<Listing number="4-1" caption="一个变量及其有效的作用域">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-01/src/main.rs:here}}
```

</Listing>

换句话说，这里有两个重要的时间点：

- 当 `s` *进入*作用域时，它是有效的。
- 它一直保持有效，直到*离开*作用域。

目前，作用域与变量有效性之间的关系与其他编程语言类似。现在我们将在此基础上引入 `String` 类型。

### `String` 类型

为了说明所有权的规则，我们需要一个比第 3 章["数据类型"][data-types]<!-- ignore -->部分介绍的那些更复杂的数据类型。之前介绍的类型大小都是已知的，可以存储在栈上，并在其作用域结束时从栈中弹出，而且如果代码的其他部分需要在不同的作用域中使用相同的值，可以快速而简单地复制来创建一个新的独立实例。但我们想看看存储在堆上的数据，并探索 Rust 如何知道何时清理这些数据，`String` 类型就是一个很好的例子。

我们将专注于 `String` 中与所有权相关的部分。这些方面也适用于其他复杂数据类型，无论它们是由标准库提供的还是由你创建的。我们将在[第 8 章][ch8]<!-- ignore -->中讨论 `String` 的非所有权方面。

我们已经见过字符串字面值，即字符串值被硬编码到程序中。字符串字面值很方便，但并不适用于所有需要使用文本的场景。原因之一是它们是不可变的。另一个原因是并非所有字符串值在编写代码时都能确定：例如，如果我们想获取用户输入并存储它怎么办？针对这些场景，Rust 提供了 `String` 类型。这个类型管理分配在堆上的数据，因此能够存储在编译时未知大小的文本。你可以使用 `from` 函数从字符串字面值创建一个 `String`，如下所示：

```rust
let s = String::from("hello");
```

双冒号 `::` 运算符允许我们将这个特定的 `from` 函数置于 `String` 类型的命名空间下，而不是使用类似 `string_from` 这样的名称。我们将在第 5 章的["方法"][methods]<!-- ignore -->部分更详细地讨论这种语法，以及在第 7 章的["引用模块树中项的路径"][paths-module-tree]<!-- ignore -->中讨论模块的命名空间。

这种字符串*可以*被修改：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-01-can-mutate-string/src/main.rs:here}}
```

那么，这里有什么区别呢？为什么 `String` 可以被修改而字面值不行？区别在于这两种类型处理内存的方式不同。

### 内存与分配

对于字符串字面值，我们在编译时就知道其内容，所以文本被直接硬编码到最终的可执行文件中。这就是字符串字面值快速且高效的原因。但这些特性只来源于字符串字面值的不可变性。遗憾的是，我们无法为每一段在编译时大小未知、且在程序运行过程中大小可能变化的文本都在二进制文件中预留一块内存。

对于 `String` 类型，为了支持一段可变的、可增长的文本，我们需要在堆上分配一块在编译时未知大小的内存来存放内容。这意味着：

- 必须在运行时向内存分配器请求内存。
- 需要一种方式在使用完 `String` 后将内存归还给分配器。

第一部分由我们完成：当我们调用 `String::from` 时，它的实现会请求所需的内存。这在编程语言中几乎是通用的做法。

然而，第二部分有所不同。在有*垃圾回收器（garbage collector, GC）*的语言中，GC 会跟踪并清理不再使用的内存，我们不需要操心。在大多数没有 GC 的语言中，识别内存何时不再使用并调用代码显式释放它是我们的责任，就像请求内存时一样。正确地做到这一点历来是一个困难的编程问题。如果忘记了，就会浪费内存。如果释放得太早，就会产生无效变量。如果释放了两次，那也是一个 bug。我们需要精确地将一次 `allocate` 与一次 `free` 配对。

Rust 采取了不同的路径：一旦拥有内存的变量离开作用域，内存就会自动归还。下面是示例 4-1 中作用域示例的一个版本，使用 `String` 代替字符串字面值：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-02-string-scope/src/main.rs:here}}
```

有一个自然的时间点可以将 `String` 所需的内存归还给分配器：当 `s` 离开作用域时。当变量离开作用域时，Rust 会为我们调用一个特殊的函数。这个函数叫做 `drop`，`String` 的作者可以在其中放置归还内存的代码。Rust 在右花括号处自动调用 `drop`。

> 注意：在 C++ 中，这种在项的生命周期结束时释放资源的模式有时被称为*资源获取即初始化（Resource Acquisition Is Initialization, RAII）*。如果你使用过 RAII 模式，那么 Rust 中的 `drop` 函数对你来说会很熟悉。

这种模式对 Rust 代码的编写方式有着深远的影响。现在看起来可能很简单，但在更复杂的情况下——当我们希望多个变量使用我们在堆上分配的数据时——代码的行为可能会出乎意料。让我们来探索其中一些情况。

<!-- Old headings. Do not remove or links may break. -->

<a id="ways-variables-and-data-interact-move"></a>

#### 变量与数据交互的方式：移动

在 Rust 中，多个变量可以以不同的方式与同一数据交互。示例 4-2 展示了一个使用整数的例子。

<Listing number="4-2" caption="将变量 `x` 的整数值赋给 `y`">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-02/src/main.rs:here}}
```

</Listing>

我们大概能猜到这段代码在做什么："将值 `5` 绑定到 `x`；然后复制 `x` 中的值并将其绑定到 `y`。"现在我们有了两个变量 `x` 和 `y`，它们都等于 `5`。事实确实如此，因为整数是具有已知固定大小的简单值，这两个 `5` 值都被压入了栈中。

现在让我们看看 `String` 版本：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-03-string-move/src/main.rs:here}}
```

这看起来非常相似，所以我们可能会假设它的工作方式相同：即第二行会复制 `s1` 中的值并将其绑定到 `s2`。但实际情况并非如此。

看一下图 4-1，了解 `String` 底层发生了什么。`String` 由三部分组成，如左侧所示：一个指向存放字符串内容的内存的指针、一个长度和一个容量。这组数据存储在栈上。右侧是堆上存放内容的内存。

<img alt="Two tables: the first table contains the representation of s1 on the
stack, consisting of its length (5), capacity (5), and a pointer to the first
value in the second table. The second table contains the representation of the
string data on the heap, byte by byte." src="img/trpl04-01.svg" class="center"
style="width: 50%;" />

<span class="caption">图 4-1：将值 `"hello"` 绑定给 `s1` 的 `String` 在内存中的表示</span>

长度是 `String` 的内容当前使用的内存量（以字节为单位）。容量是 `String` 从分配器获得的总内存量（以字节为单位）。长度和容量之间的区别很重要，但在当前上下文中并不重要，所以现在可以忽略容量。

当我们将 `s1` 赋值给 `s2` 时，`String` 的数据被复制了，这意味着我们复制了栈上的指针、长度和容量。我们并没有复制指针所指向的堆上的数据。换句话说，内存中的数据表示如图 4-2 所示。

<img alt="Three tables: tables s1 and s2 representing those strings on the
stack, respectively, and both pointing to the same string data on the heap."
src="img/trpl04-02.svg" class="center" style="width: 50%;" />

<span class="caption">图 4-2：变量 `s2` 拥有 `s1` 的指针、长度和容量的副本时的内存表示</span>

这个表示*不*像图 4-3 那样，如果 Rust 同时复制了堆上的数据，内存就会是那个样子。如果 Rust 这样做了，当堆上的数据很大时，`s2 = s1` 操作在运行时性能上可能会非常昂贵。

<img alt="Four tables: two tables representing the stack data for s1 and s2,
and each points to its own copy of string data on the heap."
src="img/trpl04-03.svg" class="center" style="width: 50%;" />

<span class="caption">图 4-3：如果 Rust 同时复制堆数据，`s2 = s1` 可能的另一种表示</span>

前面我们说过，当变量离开作用域时，Rust 会自动调用 `drop` 函数并清理该变量的堆内存。但图 4-2 显示两个数据指针指向了同一个位置。这就有问题了：当 `s2` 和 `s1` 离开作用域时，它们都会尝试释放相同的内存。这被称为*二次释放（double free）*错误，是我们之前提到的内存安全 bug 之一。释放内存两次可能导致内存损坏，进而可能导致安全漏洞。

为了确保内存安全，在 `let s2 = s1;` 这行之后，Rust 认为 `s1` 不再有效。因此，当 `s1` 离开作用域时，Rust 不需要释放任何东西。看看在创建 `s2` 之后尝试使用 `s1` 会发生什么——它不会工作：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-04-cant-use-after-move/src/main.rs:here}}
```

你会得到类似这样的错误，因为 Rust 阻止你使用已失效的引用：

```console
{{#include ../listings/ch04-understanding-ownership/no-listing-04-cant-use-after-move/output.txt}}
```

如果你在使用其他语言时听说过*浅拷贝（shallow copy）*和*深拷贝（deep copy）*这两个术语，那么只复制指针、长度和容量而不复制数据的概念听起来可能像是浅拷贝。但因为 Rust 同时使第一个变量失效了，所以它不叫浅拷贝，而是被称为*移动（move）*。在这个例子中，我们会说 `s1` 被*移动*到了 `s2` 中。所以实际发生的情况如图 4-4 所示。

<img alt="Three tables: tables s1 and s2 representing those strings on the
stack, respectively, and both pointing to the same string data on the heap.
Table s1 is grayed out because s1 is no longer valid; only s2 can be used to
access the heap data." src="img/trpl04-04.svg" class="center" style="width:
50%;" />

<span class="caption">图 4-4：`s1` 失效后的内存表示</span>

这就解决了我们的问题！只有 `s2` 是有效的，当它离开作用域时，只有它会释放内存，问题解决了。

此外，这里隐含着一个设计选择：Rust 永远不会自动创建数据的"深"拷贝。因此，任何*自动*的复制在运行时性能上都可以被认为是低开销的。

#### 作用域与赋值

对于作用域、所有权和通过 `drop` 函数释放内存之间的关系，反过来也是成立的。当你给一个已有变量赋一个全新的值时，Rust 会立即调用 `drop` 并释放原始值的内存。看下面这段代码：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-04b-replacement-drop/src/main.rs:here}}
```

我们首先声明一个变量 `s` 并将其绑定到一个值为 `"hello"` 的 `String`。然后，我们立即创建一个值为 `"ahoy"` 的新 `String` 并将其赋给 `s`。此时，没有任何东西引用堆上的原始值了。图 4-5 展示了此时栈和堆上的数据：

<img alt="One table representing the string value on the stack, pointing to
the second piece of string data (ahoy) on the heap, with the original string
data (hello) grayed out because it cannot be accessed anymore."
src="img/trpl04-05.svg" class="center" style="width: 50%;" />

<span class="caption">图 4-5：初始值被完全替换后的内存表示</span>

因此原始字符串立即离开了作用域。Rust 会对其执行 `drop` 函数，其内存会被立即释放。当我们在最后打印这个值时，它将是 `"ahoy, world!"`。

<!-- Old headings. Do not remove or links may break. -->

<a id="ways-variables-and-data-interact-clone"></a>

#### 变量与数据交互的方式：克隆

如果我们*确实*想要深拷贝 `String` 的堆数据，而不仅仅是栈数据，可以使用一个叫做 `clone` 的通用方法。我们将在第 5 章讨论方法语法，但因为方法是许多编程语言中的常见特性，你之前可能已经见过了。

下面是 `clone` 方法的一个使用示例：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-05-clone/src/main.rs:here}}
```

这段代码可以正常工作，并且显式地产生了图 4-3 所示的行为，即堆数据*确实*被复制了。

当你看到 `clone` 的调用时，你就知道某些任意代码正在被执行，而且这些代码可能开销较大。它是一个视觉上的提示，表明这里发生了一些不同的事情。

#### 只在栈上的数据：Copy

还有一个细节我们还没有讨论。这段使用整数的代码——其中一部分在示例 4-2 中展示过——可以正常工作且是有效的：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-06-copy/src/main.rs:here}}
```

但这段代码似乎与我们刚学到的内容矛盾：我们没有调用 `clone`，但 `x` 仍然有效，并没有被移动到 `y` 中。

原因是像整数这样在编译时具有已知大小的类型完全存储在栈上，所以复制实际值的速度很快。这意味着我们没有理由在创建变量 `y` 之后让 `x` 失效。换句话说，这里深拷贝和浅拷贝没有区别，所以调用 `clone` 不会与通常的浅拷贝有任何不同，我们可以省略它。

Rust 有一个叫做 `Copy` trait 的特殊注解，可以用在像整数这样存储在栈上的类型上（我们将在[第 10 章][traits]<!-- ignore -->中更多地讨论 trait）。如果一个类型实现了 `Copy` trait，使用它的变量不会移动，而是会被简单地复制，使得赋值给另一个变量后原变量仍然有效。

如果一个类型或其任何部分实现了 `Drop` trait，Rust 不允许我们给该类型添加 `Copy` 注解。如果该类型在值离开作用域时需要执行某些特殊操作，而我们又给它添加了 `Copy` 注解，就会得到一个编译时错误。要了解如何为你的类型添加 `Copy` 注解以实现该 trait，请参阅附录 C 中的["可派生的 trait"][derivable-traits]<!-- ignore -->。

那么，哪些类型实现了 `Copy` trait 呢？你可以查看给定类型的文档来确认，但作为一般规则，任何一组简单标量值都可以实现 `Copy`，而任何需要分配内存或属于某种资源的类型都不能实现 `Copy`。以下是一些实现了 `Copy` 的类型：

- 所有整数类型，如 `u32`。
- 布尔类型 `bool`，值为 `true` 和 `false`。
- 所有浮点类型，如 `f64`。
- 字符类型 `char`。
- 元组，当且仅当其包含的类型也都实现了 `Copy` 时。例如，`(i32, i32)` 实现了 `Copy`，但 `(i32, String)` 没有。

### 所有权与函数

将值传递给函数的机制与将值赋给变量的机制类似。将变量传递给函数会发生移动或复制，就像赋值一样。示例 4-3 是一个带有注释的例子，展示了变量在哪里进入和离开作用域。

<Listing number="4-3" file-name="src/main.rs" caption="带有所有权和作用域注释的函数">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-03/src/main.rs}}
```

</Listing>

如果我们在调用 `takes_ownership` 之后尝试使用 `s`，Rust 会抛出一个编译时错误。这些静态检查保护我们免于犯错。试着在 `main` 中添加使用 `s` 和 `x` 的代码，看看在哪里可以使用它们，以及所有权规则在哪里阻止你这样做。

### 返回值与作用域

返回值也可以转移所有权。示例 4-4 展示了一个返回某些值的函数示例，带有与示例 4-3 类似的注释。

<Listing number="4-4" file-name="src/main.rs" caption="转移返回值的所有权">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-04/src/main.rs}}
```

</Listing>

变量所有权的模式每次都是相同的：将值赋给另一个变量会移动它。当一个包含堆上数据的变量离开作用域时，其值将被 `drop` 清理，除非数据的所有权已经被移动到另一个变量。

虽然这样可以工作，但每个函数都获取所有权然后再返回所有权未免有些繁琐。如果我们想让函数使用一个值但不获取所有权怎么办？如果我们传入的东西还需要传回来才能继续使用，这就相当烦人了，更不用说我们可能还想返回函数体中产生的数据。

Rust 允许我们使用元组返回多个值，如示例 4-5 所示。

<Listing number="4-5" file-name="src/main.rs" caption="返回参数的所有权">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-05/src/main.rs}}
```

</Listing>

但这样做仪式感太强，对于一个应该很常见的概念来说工作量太大了。幸运的是，Rust 提供了一个无需转移所有权就能使用值的特性：引用（references）。

[data-types]: ch03-02-data-types.html#data-types
[ch8]: ch08-02-strings.html
[traits]: ch10-02-traits.html
[derivable-traits]: appendix-03-derivable-traits.html
[methods]: ch05-03-method-syntax.html#methods
[paths-module-tree]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
