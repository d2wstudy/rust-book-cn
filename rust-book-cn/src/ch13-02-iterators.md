## 使用迭代器处理一系列元素

迭代器模式允许你依次对一个序列中的元素执行某些操作。迭代器负责遍历每个元素以及判断序列何时结束的逻辑。使用迭代器时，你无需自己重新实现这些逻辑。

在 Rust 中，迭代器是 **惰性的**（lazy），这意味着在你调用消费迭代器的方法之前，迭代器不会产生任何效果。例如，示例 13-10 中的代码通过调用 `Vec<T>` 上定义的 `iter` 方法，在 vector `v1` 的元素上创建了一个迭代器。这段代码本身并没有做任何有用的事情。

<Listing number="13-10" file-name="src/main.rs" caption="创建一个迭代器">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-10/src/main.rs:here}}
```

</Listing>

迭代器被存储在 `v1_iter` 变量中。一旦创建了迭代器，我们可以用多种方式来使用它。在示例 3-5 中，我们使用 `for` 循环遍历一个数组，对其中的每个元素执行一些代码。在底层，这实际上隐式地创建并消费了一个迭代器，但在此之前我们一直没有深入探讨其工作原理。

在示例 13-11 中，我们将迭代器的创建与在 `for` 循环中使用迭代器分开了。当使用 `v1_iter` 中的迭代器调用 `for` 循环时，迭代器中的每个元素在循环的一次迭代中被使用，从而打印出每个值。

<Listing number="13-11" file-name="src/main.rs" caption="在 `for` 循环中使用迭代器">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-11/src/main.rs:here}}
```

</Listing>

在标准库中没有提供迭代器的语言中，你可能会通过以下方式实现相同的功能：从索引 0 开始一个变量，用该变量索引 vector 来获取值，然后在循环中递增该变量的值，直到达到 vector 中元素的总数。

迭代器为你处理了所有这些逻辑，减少了你可能搞砸的重复代码。迭代器让你能够更灵活地将相同的逻辑用于多种不同类型的序列，而不仅仅是像 vector 这样可以通过索引访问的数据结构。让我们来看看迭代器是如何做到这一点的。

### `Iterator` Trait 和 `next` 方法

所有迭代器都实现了标准库中定义的一个名为 `Iterator` 的 trait。该 trait 的定义如下：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // methods with default implementations elided
}
```

注意这个定义使用了一些新语法：`type Item` 和 `Self::Item`，它们定义了该 trait 的一个 **关联类型**（associated type）。我们将在第 20 章深入讨论关联类型。现在你只需要知道，这段代码表明实现 `Iterator` trait 要求你同时定义一个 `Item` 类型，而这个 `Item` 类型用于 `next` 方法的返回类型。换句话说，`Item` 类型将是迭代器返回的元素类型。

`Iterator` trait 只要求实现者定义一个方法：`next` 方法，它每次返回迭代器中的一个元素，包裹在 `Some` 中；当迭代结束时，返回 `None`。

我们可以直接在迭代器上调用 `next` 方法；示例 13-12 展示了对从 vector 创建的迭代器反复调用 `next` 所返回的值。

<Listing number="13-12" file-name="src/lib.rs" caption="在迭代器上调用 `next` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-12/src/lib.rs:here}}
```

</Listing>

注意我们需要将 `v1_iter` 声明为可变的：在迭代器上调用 `next` 方法会改变迭代器内部用于跟踪序列位置的状态。换句话说，这段代码 **消费**（consume）了迭代器，或者说用尽了它。每次调用 `next` 都会从迭代器中消费一个元素。而当我们使用 `for` 循环时，不需要将 `v1_iter` 声明为可变的，因为循环获取了 `v1_iter` 的所有权，并在幕后将其变为可变的。

还要注意，从 `next` 调用中获得的值是 vector 中值的不可变引用。`iter` 方法生成的是一个不可变引用的迭代器。如果我们想创建一个获取 `v1` 所有权并返回拥有所有权的值的迭代器，可以调用 `into_iter` 而不是 `iter`。类似地，如果我们想遍历可变引用，可以调用 `iter_mut` 而不是 `iter`。

### 消费迭代器的方法

`Iterator` trait 有许多由标准库提供默认实现的方法；你可以在标准库 API 文档中查阅 `Iterator` trait 来了解这些方法。其中一些方法在其定义中调用了 `next` 方法，这就是为什么实现 `Iterator` trait 时必须实现 `next` 方法的原因。

调用 `next` 的方法被称为 **消费适配器**（consuming adapters），因为调用它们会用尽迭代器。一个例子是 `sum` 方法，它获取迭代器的所有权，并通过反复调用 `next` 来遍历所有元素，从而消费迭代器。在遍历过程中，它将每个元素累加到一个总和中，并在迭代完成时返回该总和。示例 13-13 展示了一个使用 `sum` 方法的测试。

<Listing number="13-13" file-name="src/lib.rs" caption="调用 `sum` 方法获取迭代器中所有元素的总和">

```rust,noplayground
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-13/src/lib.rs:here}}
```

</Listing>

在调用 `sum` 之后，我们就不能再使用 `v1_iter` 了，因为 `sum` 获取了我们调用它的迭代器的所有权。

### 产生其他迭代器的方法

**迭代器适配器**（iterator adapters）是定义在 `Iterator` trait 上的方法，它们不会消费迭代器，而是通过改变原始迭代器的某些方面来产生不同的迭代器。

示例 13-14 展示了一个调用迭代器适配器方法 `map` 的例子，它接受一个闭包，在遍历元素时对每个元素调用该闭包。`map` 方法返回一个新的迭代器，产生修改后的元素。这里的闭包创建了一个新的迭代器，其中 vector 的每个元素都会加 1。

<Listing number="13-14" file-name="src/main.rs" caption="调用迭代器适配器 `map` 来创建一个新的迭代器">

```rust,not_desired_behavior
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-14/src/main.rs:here}}
```

</Listing>

不过，这段代码会产生一个警告：

```console
{{#include ../listings/ch13-functional-features/listing-13-14/output.txt}}
```

示例 13-14 中的代码实际上什么也没做；我们指定的闭包从未被调用。这个警告提醒了我们原因：迭代器适配器是惰性的，我们需要在这里消费迭代器。

为了修复这个警告并消费迭代器，我们将使用 `collect` 方法，我们在示例 12-1 中曾与 `env::args` 一起使用过它。这个方法消费迭代器，并将结果值收集到一个集合数据类型中。

在示例 13-15 中，我们将调用 `map` 返回的迭代器遍历的结果收集到一个 vector 中。这个 vector 最终将包含原始 vector 中每个元素加 1 后的值。

<Listing number="13-15" file-name="src/main.rs" caption="调用 `map` 方法创建一个新的迭代器，然后调用 `collect` 方法消费新的迭代器并创建一个 vector">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-15/src/main.rs:here}}
```

</Listing>

因为 `map` 接受一个闭包，所以我们可以指定任何想要对每个元素执行的操作。这是一个很好的例子，展示了闭包如何让你自定义某些行为，同时复用 `Iterator` trait 提供的迭代行为。

你可以链式调用多个迭代器适配器来以可读的方式执行复杂操作。但由于所有迭代器都是惰性的，你必须调用一个消费适配器方法才能从迭代器适配器的调用中获得结果。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-closures-that-capture-their-environment"></a>

### 捕获环境的闭包

许多迭代器适配器接受闭包作为参数，而我们指定给迭代器适配器的闭包通常是捕获其环境的闭包。

在这个例子中，我们将使用接受一个闭包的 `filter` 方法。该闭包从迭代器中获取一个元素并返回一个 `bool`。如果闭包返回 `true`，该值将被包含在 `filter` 产生的迭代中。如果闭包返回 `false`，该值将不会被包含。

在示例 13-16 中，我们使用 `filter` 和一个从环境中捕获 `shoe_size` 变量的闭包来遍历一个 `Shoe` 结构体实例的集合。它将只返回指定尺码的鞋子。

<Listing number="13-16" file-name="src/lib.rs" caption="使用 `filter` 方法和一个捕获 `shoe_size` 的闭包">

```rust,noplayground
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-16/src/lib.rs}}
```

</Listing>

`shoes_in_size` 函数获取一个鞋子 vector 和一个鞋码作为参数。它返回一个只包含指定尺码鞋子的 vector。

在 `shoes_in_size` 的函数体中，我们调用 `into_iter` 来创建一个获取 vector 所有权的迭代器。然后调用 `filter` 将该迭代器适配为一个新的迭代器，只包含闭包返回 `true` 的元素。

闭包从环境中捕获了 `shoe_size` 参数，并将其与每只鞋的尺码进行比较，只保留指定尺码的鞋子。最后，调用 `collect` 将适配后的迭代器返回的值收集到一个 vector 中，由函数返回。

测试表明，当我们调用 `shoes_in_size` 时，只会得到与我们指定的值相同尺码的鞋子。
