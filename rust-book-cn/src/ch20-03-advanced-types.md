## 高级类型

Rust 的类型系统有一些我们之前提到过但尚未深入讨论的特性。我们将从整体上讨论 newtype 模式开始，探讨它作为类型为何有用。接着，我们将转向类型别名（type alias），这是一个与 newtype 类似但语义略有不同的特性。我们还会讨论 `!` 类型和动态大小类型（dynamically sized types）。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-the-newtype-pattern-for-type-safety-and-abstraction"></a>

### 使用 Newtype 模式实现类型安全和抽象

本节假设你已经阅读了前面的["使用 Newtype 模式实现外部 Trait"][newtype]<!-- ignore --> 一节。newtype 模式在我们之前讨论的用途之外还有其他用处，包括静态地确保值不会被混淆，以及标明值的单位。你在示例 20-16 中看到了使用 newtype 来标明单位的例子：回忆一下，`Millimeters` 和 `Meters` 结构体将 `u32` 值包装在 newtype 中。如果我们编写了一个参数类型为 `Millimeters` 的函数，就无法编译一个意外地使用 `Meters` 类型或普通 `u32` 值来调用该函数的程序。

我们还可以使用 newtype 模式来抽象掉类型的某些实现细节：新类型可以暴露一个与内部私有类型不同的公有 API。

Newtype 还可以隐藏内部实现。例如，我们可以提供一个 `People` 类型来包装一个 `HashMap<i32, String>`，用于存储人员 ID 与姓名的关联。使用 `People` 的代码只需与我们提供的公有 API 交互，比如一个向 `People` 集合中添加姓名字符串的方法；该代码不需要知道我们在内部为姓名分配了 `i32` 类型的 ID。newtype 模式是一种实现封装以隐藏实现细节的轻量级方式，我们在第 18 章的["封装隐藏了实现细节"][encapsulation-that-hides-implementation-details]<!-- ignore -->一节中讨论过封装。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-type-synonyms-with-type-aliases"></a>

### 类型同义词与类型别名

Rust 提供了声明**类型别名**（type alias）的能力，可以为现有类型赋予另一个名称。为此我们使用 `type` 关键字。例如，我们可以像这样为 `i32` 创建别名 `Kilometers`：

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-04-kilometers-alias/src/main.rs:here}}
```

现在别名 `Kilometers` 是 `i32` 的**同义词**（synonym）；与我们在示例 20-16 中创建的 `Millimeters` 和 `Meters` 类型不同，`Kilometers` 并不是一个独立的新类型。类型为 `Kilometers` 的值将被视为与 `i32` 类型的值完全相同：

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-04-kilometers-alias/src/main.rs:there}}
```

因为 `Kilometers` 和 `i32` 是同一类型，我们可以将两种类型的值相加，也可以将 `Kilometers` 值传递给接受 `i32` 参数的函数。然而，使用这种方式，我们无法获得前面讨论的 newtype 模式所带来的类型检查优势。换句话说，如果我们在某处混淆了 `Kilometers` 和 `i32` 的值，编译器不会给出错误。

类型同义词的主要用途是减少重复。例如，我们可能有一个很长的类型，像这样：

```rust,ignore
Box<dyn Fn() + Send + 'static>
```

在函数签名和类型标注中到处书写这个冗长的类型既烦琐又容易出错。想象一下项目中到处都是像示例 20-25 那样的代码。

<Listing number="20-25" caption="在很多地方使用一个很长的类型">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-25/src/main.rs:here}}
```

</Listing>

类型别名通过减少重复使代码更易于管理。在示例 20-26 中，我们为这个冗长的类型引入了一个名为 `Thunk` 的别名，可以用更短的别名 `Thunk` 替换所有使用该类型的地方。

<Listing number="20-26" caption="引入类型别名 `Thunk` 以减少重复">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-26/src/main.rs:here}}
```

</Listing>

这段代码更容易阅读和编写了！为类型别名选择一个有意义的名称也有助于传达你的意图（_thunk_ 是一个表示"稍后求值的代码"的术语，因此它是存储闭包的恰当名称）。

类型别名也常与 `Result<T, E>` 类型一起使用以减少重复。考虑标准库中的 `std::io` 模块。I/O 操作通常返回一个 `Result<T, E>` 来处理操作失败的情况。标准库中有一个 `std::io::Error` 结构体，表示所有可能的 I/O 错误。`std::io` 中的许多函数会返回 `Result<T, E>`，其中 `E` 为 `std::io::Error`，例如 `Write` trait 中的这些函数：

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-05-write-trait/src/lib.rs}}
```

`Result<..., Error>` 重复出现了很多次。因此，`std::io` 中有这样一个类型别名声明：

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-06-result-alias/src/lib.rs:here}}
```

因为这个声明位于 `std::io` 模块中，我们可以使用完全限定的别名 `std::io::Result<T>`；也就是说，这是一个将 `E` 填充为 `std::io::Error` 的 `Result<T, E>`。`Write` trait 的函数签名最终看起来像这样：

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-06-result-alias/src/lib.rs:there}}
```

类型别名在两方面提供了帮助：它使代码更容易编写，**并且**为整个 `std::io` 提供了一致的接口。因为它是一个别名，它只是另一个 `Result<T, E>`，这意味着我们可以对它使用任何适用于 `Result<T, E>` 的方法，以及像 `?` 运算符这样的特殊语法。

### 永不返回的 Never 类型

Rust 有一个特殊的类型 `!`，在类型理论术语中被称为**空类型**（empty type），因为它没有任何值。我们更倾向于称它为 **never 类型**，因为它在函数永不返回时充当返回类型。下面是一个例子：

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-07-never-type/src/lib.rs:here}}
```

这段代码读作"函数 `bar` 永不返回"。永不返回的函数被称为**发散函数**（diverging functions）。我们无法创建 `!` 类型的值，因此 `bar` 永远不可能返回。

但是，一个永远无法创建值的类型有什么用呢？回忆一下示例 2-5 中的代码，那是猜数字游戏的一部分；我们在示例 20-27 中重新展示了其中一段。

<Listing number="20-27" caption="一个以 `continue` 结尾的分支的 `match`">

```rust,ignore
{{#rustdoc_include ../listings/ch02-guessing-game-tutorial/listing-02-05/src/main.rs:ch19}}
```

</Listing>

当时我们跳过了这段代码中的一些细节。在第 6 章的["`match` 控制流结构"][the-match-control-flow-construct]<!-- ignore -->一节中，我们讨论过 `match` 的各个分支必须返回相同的类型。因此，例如下面的代码是行不通的：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-08-match-arms-different-types/src/main.rs:here}}
```

这段代码中 `guess` 的类型必须既是整数**又**是字符串，而 Rust 要求 `guess` 只能有一种类型。那么 `continue` 返回什么呢？在示例 20-27 中，我们怎么能从一个分支返回 `u32`，而另一个分支以 `continue` 结尾呢？

你可能已经猜到了，`continue` 的类型是 `!`。也就是说，当 Rust 计算 `guess` 的类型时，它会查看两个 match 分支，前者的值类型为 `u32`，后者的值类型为 `!`。因为 `!` 永远不可能有值，Rust 决定 `guess` 的类型为 `u32`。

描述这种行为的正式说法是：`!` 类型的表达式可以被强制转换为任何其他类型。我们可以用 `continue` 结束这个 `match` 分支，因为 `continue` 不返回值；相反，它将控制流移回循环的顶部，所以在 `Err` 的情况下，我们永远不会给 `guess` 赋值。

never 类型与 `panic!` 宏也很有用。回忆一下我们在 `Option<T>` 值上调用的 `unwrap` 函数，它要么产生一个值，要么 panic，其定义如下：

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-09-unwrap-definition/src/lib.rs:here}}
```

在这段代码中，发生的事情与示例 20-27 中的 `match` 相同：Rust 看到 `val` 的类型是 `T`，而 `panic!` 的类型是 `!`，因此整个 `match` 表达式的结果类型是 `T`。这段代码能够工作，因为 `panic!` 不产生值；它终止了程序。在 `None` 的情况下，我们不会从 `unwrap` 返回值，所以这段代码是合法的。

最后一个类型为 `!` 的表达式是 `loop`：

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-10-loop-returns-never/src/main.rs:here}}
```

这里循环永远不会结束，所以 `!` 是该表达式的值。然而，如果我们加入了 `break`，情况就不同了，因为循环会在执行到 `break` 时终止。

### 动态大小类型与 `Sized` Trait

Rust 需要了解其类型的某些细节，例如为特定类型的值分配多少空间。这使得其类型系统的一个角落初看起来有些令人困惑：**动态大小类型**（dynamically sized types）的概念。这些类型有时也被称为 _DST_ 或**不定大小类型**（unsized types），它们允许我们编写使用只能在运行时才能知道大小的值的代码。

让我们深入了解一个名为 `str` 的动态大小类型的细节，我们在整本书中一直在使用它。没错，不是 `&str`，而是 `str` 本身就是一个 DST。在很多情况下，比如存储用户输入的文本时，我们在运行时之前无法知道字符串有多长。这意味着我们无法创建 `str` 类型的变量，也无法接受 `str` 类型的参数。考虑以下无法工作的代码：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-11-cant-create-str/src/main.rs:here}}
```

Rust 需要知道为特定类型的任何值分配多少内存，而同一类型的所有值必须使用相同大小的内存。如果 Rust 允许我们编写这段代码，这两个 `str` 值就需要占用相同大小的空间。但它们的长度不同：`s1` 需要 12 字节的存储空间，而 `s2` 需要 15 字节。这就是为什么无法创建一个持有动态大小类型的变量。

那么我们该怎么办呢？在这种情况下，你已经知道答案了：我们将 `s1` 和 `s2` 的类型设为字符串切片（`&str`）而不是 `str`。回忆一下第 4 章["字符串切片"][string-slices]<!-- ignore -->一节，切片数据结构只存储起始位置和切片的长度。因此，虽然 `&T` 是一个存储 `T` 所在内存地址的单一值，但字符串切片是**两个**值：`str` 的地址和它的长度。这样，我们可以在编译时知道字符串切片值的大小：它是 `usize` 长度的两倍。也就是说，无论它引用的字符串有多长，我们总是知道字符串切片的大小。一般来说，这就是 Rust 中使用动态大小类型的方式：它们有一个额外的元数据来存储动态信息的大小。动态大小类型的黄金法则是：我们必须始终将动态大小类型的值放在某种指针之后。

我们可以将 `str` 与各种指针组合使用：例如 `Box<str>` 或 `Rc<str>`。事实上，你之前已经见过这种用法，只不过是用在另一种动态大小类型上：trait。每个 trait 都是一个动态大小类型，我们可以通过 trait 的名称来引用它。在第 18 章的["使用 Trait 对象来抽象共同行为"][using-trait-objects-to-abstract-over-shared-behavior]<!-- ignore -->一节中，我们提到过要将 trait 用作 trait 对象，必须将它们放在指针之后，例如 `&dyn Trait` 或 `Box<dyn Trait>`（`Rc<dyn Trait>` 也可以）。

为了处理 DST，Rust 提供了 `Sized` trait 来确定一个类型的大小在编译时是否已知。这个 trait 会自动为所有在编译时大小已知的类型实现。此外，Rust 会隐式地为每个泛型函数添加 `Sized` 约束。也就是说，像这样的泛型函数定义：

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-12-generic-fn-definition/src/lib.rs}}
```

实际上被当作如下形式处理：

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-13-generic-implicit-sized-bound/src/lib.rs}}
```

默认情况下，泛型函数只能用于在编译时大小已知的类型。然而，你可以使用以下特殊语法来放宽这个限制：

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-14-generic-maybe-sized/src/lib.rs}}
```

`?Sized` 的 trait 约束意味着"`T` 可能是也可能不是 `Sized` 的"，这个标注覆盖了泛型类型必须在编译时具有已知大小的默认行为。具有这种含义的 `?Trait` 语法只适用于 `Sized`，不适用于其他任何 trait。

还要注意，我们将参数 `t` 的类型从 `T` 改为了 `&T`。因为该类型可能不是 `Sized` 的，所以我们需要在某种指针之后使用它。在这个例子中，我们选择了引用。

接下来，我们将讨论函数和闭包！

[encapsulation-that-hides-implementation-details]: ch18-01-what-is-oo.html#encapsulation-that-hides-implementation-details
[string-slices]: ch04-03-slices.html#string-slices
[the-match-control-flow-construct]: ch06-02-match.html#the-match-control-flow-construct
[using-trait-objects-to-abstract-over-shared-behavior]: ch18-02-trait-objects.html#using-trait-objects-to-abstract-over-shared-behavior
[newtype]: ch20-02-advanced-traits.html#implementing-external-traits-with-the-newtype-pattern
