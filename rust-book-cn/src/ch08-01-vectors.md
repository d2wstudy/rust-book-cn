## 使用 Vector 存储值列表

我们要看的第一个集合类型是 `Vec<T>`，也称为 *vector*。Vector 允许你在单个数据结构中存储多个值，所有值在内存中彼此相邻排列。Vector 只能存储相同类型的值。当你有一组条目的列表时，它们非常有用，例如文件中的文本行或购物车中商品的价格。

### 创建新的 Vector

要创建一个新的空 vector，我们调用 `Vec::new` 函数，如示例 8-1 所示。

<Listing number="8-1" caption="创建一个新的空 vector 来存储 `i32` 类型的值">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-01/src/main.rs:here}}
```

</Listing>

注意这里我们添加了类型标注。因为我们没有向这个 vector 中插入任何值，Rust 不知道我们打算存储什么类型的元素。这是一个重要的点。Vector 是使用泛型（generics）实现的；我们将在第 10 章介绍如何在自己的类型中使用泛型。现在你只需要知道，标准库提供的 `Vec<T>` 类型可以存储任何类型。当我们创建一个用于存储特定类型的 vector 时，可以在尖括号中指定类型。在示例 8-1 中，我们告诉 Rust，`v` 中的 `Vec<T>` 将存储 `i32` 类型的元素。

更常见的情况是，你会用初始值创建 `Vec<T>`，Rust 会推断出你想存储的值的类型，所以你很少需要做这种类型标注。Rust 提供了便捷的 `vec!` 宏，它会创建一个包含你给定值的新 vector。示例 8-2 创建了一个包含值 `1`、`2` 和 `3` 的新 `Vec<i32>`。整数类型是 `i32`，因为这是默认的整数类型，正如我们在第 3 章的["数据类型"][data-types]<!-- ignore -->部分讨论的那样。

<Listing number="8-2" caption="创建一个包含值的新 vector">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-02/src/main.rs:here}}
```

</Listing>

因为我们给出了初始的 `i32` 值，Rust 可以推断出 `v` 的类型是 `Vec<i32>`，所以类型标注不是必需的。接下来，我们来看看如何修改 vector。

### 更新 Vector

要创建一个 vector 然后向其中添加元素，可以使用 `push` 方法，如示例 8-3 所示。

<Listing number="8-3" caption="使用 `push` 方法向 vector 添加值">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-03/src/main.rs:here}}
```

</Listing>

与任何变量一样，如果我们想要能够改变它的值，需要使用 `mut` 关键字使其可变，正如第 3 章所讨论的。我们放入的数字都是 `i32` 类型，Rust 从数据中推断出了这一点，所以我们不需要 `Vec<i32>` 标注。

### 读取 Vector 的元素

有两种方式可以引用 vector 中存储的值：通过索引或使用 `get` 方法。在下面的示例中，我们标注了从这些函数返回的值的类型，以便更加清晰。

示例 8-4 展示了访问 vector 中值的两种方法：索引语法和 `get` 方法。

<Listing number="8-4" caption="使用索引语法和 `get` 方法访问 vector 中的元素">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-04/src/main.rs:here}}
```

</Listing>

这里有几个细节需要注意。我们使用索引值 `2` 来获取第三个元素，因为 vector 使用从零开始的数字索引。使用 `&` 和 `[]` 会给我们一个该索引位置元素的引用。当我们使用 `get` 方法并传入索引作为参数时，我们得到一个 `Option<&T>`，可以与 `match` 一起使用。

Rust 提供了这两种引用元素的方式，以便你可以选择当尝试使用超出现有元素范围的索引值时程序的行为。举个例子，让我们看看当我们有一个包含五个元素的 vector，然后尝试用每种方法访问索引 100 处的元素时会发生什么，如示例 8-5 所示。

<Listing number="8-5" caption="尝试访问包含五个元素的 vector 中索引 100 处的元素">

```rust,should_panic,panics
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-05/src/main.rs:here}}
```

</Listing>

当我们运行这段代码时，第一个 `[]` 方法会导致程序 panic，因为它引用了一个不存在的元素。当你希望程序在尝试访问 vector 末尾之后的元素时崩溃，这个方法最为适用。

当 `get` 方法接收到一个超出 vector 范围的索引时，它会返回 `None` 而不会 panic。如果在正常情况下偶尔可能会访问超出 vector 范围的元素，你应该使用这个方法。你的代码随后将包含处理 `Some(&element)` 或 `None` 的逻辑，正如第 6 章所讨论的。例如，索引可能来自用户输入的数字。如果他们不小心输入了一个过大的数字，程序得到了 `None` 值，你可以告诉用户当前 vector 中有多少个元素，并给他们另一次输入有效值的机会。这比因为一个输入错误就让程序崩溃要友好得多！

当程序拥有一个有效的引用时，借用检查器会执行所有权和借用规则（在第 4 章中介绍）来确保这个引用以及对 vector 内容的任何其他引用保持有效。回忆一下那条规则：你不能在同一作用域中同时拥有可变引用和不可变引用。这条规则适用于示例 8-6，在那里我们持有一个对 vector 中第一个元素的不可变引用，并尝试向末尾添加一个元素。如果我们还试图在函数后面引用那个元素，这个程序将无法工作。

<Listing number="8-6" caption="在持有元素引用的同时尝试向 vector 添加元素">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-06/src/main.rs:here}}
```

</Listing>

编译这段代码会产生以下错误：

```console
{{#include ../listings/ch08-common-collections/listing-08-06/output.txt}}
```

示例 8-6 中的代码看起来应该可以工作：为什么对第一个元素的引用要关心 vector 末尾的变化呢？这个错误是由于 vector 的工作方式导致的：因为 vector 将值在内存中彼此相邻存储，如果在 vector 当前存储位置没有足够的空间将所有元素放在一起，向 vector 末尾添加新元素可能需要分配新的内存并将旧元素复制到新空间。在这种情况下，对第一个元素的引用将指向已释放的内存。借用规则防止程序陷入这种情况。

> 注意：关于 `Vec<T>` 类型的更多实现细节，请参阅 ["The Rustonomicon"][nomicon]。

### 遍历 Vector 中的值

要依次访问 vector 中的每个元素，我们会遍历所有元素，而不是使用索引逐个访问。示例 8-7 展示了如何使用 `for` 循环获取 `i32` 值的 vector 中每个元素的不可变引用并打印它们。

<Listing number="8-7" caption="使用 `for` 循环遍历元素来打印 vector 中的每个元素">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-07/src/main.rs:here}}
```

</Listing>

我们也可以遍历可变 vector 中每个元素的可变引用，以便对所有元素进行修改。示例 8-8 中的 `for` 循环会给每个元素加上 `50`。

<Listing number="8-8" caption="遍历 vector 中元素的可变引用">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-08/src/main.rs:here}}
```

</Listing>

要修改可变引用所指向的值，我们必须使用 `*` 解引用运算符获取 `i` 中的值，然后才能使用 `+=` 运算符。我们将在第 15 章的["追踪指针指向的值"][deref]<!-- ignore -->部分更多地讨论解引用运算符。

无论是不可变遍历还是可变遍历 vector，都是安全的，这得益于借用检查器的规则。如果我们试图在示例 8-7 和示例 8-8 的 `for` 循环体中插入或删除元素，我们会得到一个类似于示例 8-6 中代码所产生的编译器错误。`for` 循环持有的对 vector 的引用会阻止对整个 vector 的同时修改。

### 使用枚举存储多种类型

Vector 只能存储相同类型的值。这可能会带来不便；确实存在需要存储不同类型元素列表的场景。幸运的是，枚举的变体定义在同一个枚举类型下，所以当我们需要用一个类型来表示不同类型的元素时，可以定义并使用一个枚举！

例如，假设我们想从电子表格的一行中获取值，其中该行的某些列包含整数，某些包含浮点数，某些包含字符串。我们可以定义一个枚举，其变体将持有不同的值类型，所有枚举变体都被视为同一类型：即该枚举的类型。然后我们可以创建一个 vector 来存储该枚举，从而最终存储不同的类型。我们在示例 8-9 中演示了这一点。

<Listing number="8-9" caption="定义一个枚举以在一个 vector 中存储不同类型的值">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-09/src/main.rs:here}}
```

</Listing>

Rust 需要在编译时知道 vector 中会有哪些类型，这样它才能确切地知道在堆上需要多少内存来存储每个元素。我们还必须明确这个 vector 中允许哪些类型。如果 Rust 允许 vector 存储任何类型，那么一个或多个类型可能会导致对 vector 元素执行的操作出错。使用枚举加上 `match` 表达式意味着 Rust 将在编译时确保处理了每种可能的情况，正如第 6 章所讨论的。

如果你不知道程序在运行时会获取哪些类型来存储在 vector 中，枚举技术就不适用了。相反，你可以使用 trait 对象，我们将在第 18 章中介绍。

现在我们已经讨论了使用 vector 的一些最常见方式，请务必查阅 [API 文档][vec-api]<!-- ignore -->以了解标准库在 `Vec<T>` 上定义的所有有用方法。例如，除了 `push` 之外，`pop` 方法会移除并返回最后一个元素。

### 丢弃 Vector 时也会丢弃其元素

与任何其他 `struct` 一样，vector 在离开作用域时会被释放，如示例 8-10 所示。

<Listing number="8-10" caption="展示 vector 及其元素被丢弃的位置">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-10/src/main.rs:here}}
```

</Listing>

当 vector 被丢弃时，它的所有内容也会被丢弃，这意味着它持有的整数将被清理。借用检查器确保对 vector 内容的任何引用只在 vector 本身有效时才被使用。

让我们继续看下一个集合类型：`String`！

[data-types]: ch03-02-data-types.html#data-types
[nomicon]: ../nomicon/vec/vec.html
[vec-api]: ../std/vec/struct.Vec.html
[deref]: ch15-02-deref.html#following-the-pointer-to-the-value-with-the-dereference-operator
