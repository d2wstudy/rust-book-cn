## 所有可以使用模式的位置

模式（pattern）在 Rust 中随处可见，而你其实已经在不知不觉中大量使用了它们！本节将讨论所有可以使用模式的位置。

### `match` 分支

如第六章所述，我们在 `match` 表达式的分支中使用模式。从形式上讲，`match` 表达式的定义是：关键字 `match`、一个要匹配的值，以及一个或多个匹配分支——每个分支由一个模式和一个表达式组成，当值与该分支的模式匹配时就会执行对应的表达式，如下所示：

<!--
  Manually formatted rather than using Markdown intentionally: Markdown does not
  support italicizing code in the body of a block like this!
-->

<pre><code>match <em>VALUE</em> {
    <em>PATTERN</em> => <em>EXPRESSION</em>,
    <em>PATTERN</em> => <em>EXPRESSION</em>,
    <em>PATTERN</em> => <em>EXPRESSION</em>,
}</code></pre>

例如，下面是示例 6-5 中的 `match` 表达式，它匹配变量 `x` 中的 `Option<i32>` 值：

```rust,ignore
match x {
    None => None,
    Some(i) => Some(i + 1),
}
```

这个 `match` 表达式中的模式是每个箭头左边的 `None` 和 `Some(i)`。

`match` 表达式的一个要求是必须**穷尽**（exhaustive）所有可能性，即 `match` 表达式中值的所有可能情况都必须被覆盖。确保覆盖所有可能性的一种方法是在最后一个分支使用一个通配模式：例如，一个匹配任意值的变量名永远不会失败，因此可以覆盖所有剩余情况。

特殊模式 `_` 可以匹配任何值，但它不会绑定到变量，因此常用于最后一个匹配分支。例如，当你想忽略所有未指定的值时，`_` 模式就很有用。我们将在本章后面的["忽略模式中的值"][ignoring-values-in-a-pattern]<!-- ignore -->部分更详细地介绍 `_` 模式。

### `let` 语句

在本章之前，我们只明确讨论过在 `match` 和 `if let` 中使用模式，但实际上我们在其他地方也用过模式，包括 `let` 语句。例如，考虑这个简单的 `let` 变量赋值：

```rust
let x = 5;
```

每次你像这样使用 `let` 语句时，你就在使用模式，尽管你可能没有意识到！更正式地说，`let` 语句的形式如下：

<!--
  Manually formatted rather than using Markdown intentionally: Markdown does not
  support italicizing code in the body of a block like this!
-->

<pre>
<code>let <em>PATTERN</em> = <em>EXPRESSION</em>;</code>
</pre>

在像 `let x = 5;` 这样的语句中，PATTERN 位置上的变量名只是模式的一种特别简单的形式。Rust 将表达式与模式进行比较，并绑定它找到的所有名称。所以在 `let x = 5;` 这个例子中，`x` 是一个模式，意思是"将匹配到的值绑定到变量 `x`"。因为名称 `x` 就是整个模式，所以这个模式实际上意味着"将所有值绑定到变量 `x`，无论值是什么"。

为了更清楚地看到 `let` 的模式匹配特性，考虑示例 19-1，它使用 `let` 中的模式来解构一个元组。


<Listing number="19-1" caption="使用模式解构元组并一次创建三个变量">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-01/src/main.rs:here}}
```

</Listing>

这里我们将一个元组与一个模式进行匹配。Rust 将值 `(1, 2, 3)` 与模式 `(x, y, z)` 进行比较，发现值与模式匹配——也就是说，两者的元素数量相同——于是 Rust 将 `1` 绑定到 `x`，`2` 绑定到 `y`，`3` 绑定到 `z`。你可以把这个元组模式看作是三个独立的变量模式嵌套在一起。

如果模式中的元素数量与元组中的元素数量不匹配，整体类型就不匹配，我们会得到一个编译器错误。例如，示例 19-2 展示了尝试将一个包含三个元素的元组解构为两个变量的情况，这是行不通的。

<Listing number="19-2" caption="错误地构造了一个变量数量与元组元素数量不匹配的模式">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-02/src/main.rs:here}}
```

</Listing>

尝试编译这段代码会产生如下类型错误：

```console
{{#include ../listings/ch19-patterns-and-matching/listing-19-02/output.txt}}
```

要修复这个错误，我们可以使用 `_` 或 `..` 来忽略元组中的一个或多个值，正如你将在["忽略模式中的值"][ignoring-values-in-a-pattern]<!-- ignore -->部分看到的那样。如果问题是模式中变量太多，解决方案是通过移除变量来使类型匹配，使变量数量等于元组中的元素数量。

### 条件 `if let` 表达式

在第六章中，我们讨论了如何使用 `if let` 表达式，它主要是编写只匹配一种情况的 `match` 的简写方式。`if let` 可以有一个对应的 `else`，当 `if let` 中的模式不匹配时执行 `else` 中的代码。

示例 19-3 展示了还可以混合使用 `if let`、`else if` 和 `else if let` 表达式。这样做比 `match` 表达式更灵活，因为 `match` 只能将一个值与模式进行比较。此外，Rust 并不要求一系列 `if let`、`else if` 和 `else if let` 分支中的条件彼此相关。

示例 19-3 中的代码根据一系列条件检查来决定将背景设置为什么颜色。在这个例子中，我们创建了带有硬编码值的变量，而实际程序中这些值可能来自用户输入。

<Listing number="19-3" file-name="src/main.rs" caption="混合使用 `if let`、`else if`、`else if let` 和 `else`">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-03/src/main.rs}}
```

</Listing>

如果用户指定了最喜欢的颜色，就用该颜色作为背景。如果没有指定最喜欢的颜色且今天是星期二，背景颜色就是绿色。否则，如果用户以字符串形式指定了年龄并且我们能成功将其解析为数字，颜色就是紫色或橙色，取决于数字的值。如果以上条件都不满足，背景颜色就是蓝色。

这种条件结构让我们能够支持复杂的需求。使用这里的硬编码值，这个例子会打印 `Using purple as the background color`。

你可以看到 `if let` 也能引入新的遮蔽变量，方式与 `match` 分支相同：`if let Ok(age) = age` 这一行引入了一个新的 `age` 变量，它包含 `Ok` 变体中的值，遮蔽了已有的 `age` 变量。这意味着我们需要将 `if age > 30` 条件放在那个代码块内部：我们不能将这两个条件合并为 `if let Ok(age) = age && age > 30`。我们想要与 30 比较的新 `age` 在新作用域以花括号开始之前是无效的。

使用 `if let` 表达式的缺点是编译器不会检查穷尽性，而 `match` 表达式会。如果我们省略了最后的 `else` 块，从而遗漏了某些情况的处理，编译器不会提醒我们可能存在的逻辑错误。

### `while let` 条件循环

与 `if let` 的构造类似，`while let` 条件循环允许 `while` 循环在模式持续匹配时一直运行。示例 19-4 展示了一个 `while let` 循环，它等待线程之间发送的消息，但这里检查的是 `Result` 而不是 `Option`。

<Listing number="19-4" caption="使用 `while let` 循环在 `rx.recv()` 返回 `Ok` 时持续打印值">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-04/src/main.rs:here}}
```

</Listing>

这个例子会打印 `1`、`2`，然后是 `3`。`recv` 方法从通道的接收端取出第一条消息并返回 `Ok(value)`。当我们在第十六章首次看到 `recv` 时，我们直接对错误进行了解包，或者通过 `for` 循环将其作为迭代器使用。但如示例 19-4 所示，我们也可以使用 `while let`，因为每当有消息到达时 `recv` 方法就返回 `Ok`（只要发送端存在），而一旦发送端断开连接就会产生 `Err`。

### `for` 循环

在 `for` 循环中，紧跟在关键字 `for` 后面的值就是一个模式。例如，在 `for x in y` 中，`x` 就是模式。示例 19-5 演示了如何在 `for` 循环中使用模式来解构（或拆开）一个元组。


<Listing number="19-5" caption="在 `for` 循环中使用模式来解构元组">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-05/src/main.rs:here}}
```

</Listing>

示例 19-5 中的代码会打印如下内容：


```console
{{#include ../listings/ch19-patterns-and-matching/listing-19-05/output.txt}}
```

我们使用 `enumerate` 方法适配迭代器，使其产生一个值及该值的索引，放入一个元组中。第一个产生的值是元组 `(0, 'a')`。当这个值与模式 `(index, value)` 匹配时，`index` 将是 `0`，`value` 将是 `'a'`，从而打印出输出的第一行。


### 函数参数

函数参数也可以是模式。示例 19-6 中的代码声明了一个名为 `foo` 的函数，它接受一个类型为 `i32` 的参数 `x`，现在看起来应该很熟悉了。

<Listing number="19-6" caption="在参数中使用模式的函数签名">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-06/src/main.rs:here}}
```

</Listing>

`x` 部分就是一个模式！正如我们对 `let` 所做的那样，我们可以在函数参数中将元组与模式进行匹配。示例 19-7 在将元组传递给函数时拆分了其中的值。

<Listing number="19-7" file-name="src/main.rs" caption="一个参数解构元组的函数">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-07/src/main.rs}}
```

</Listing>

这段代码打印 `Current location: (3, 5)`。值 `&(3, 5)` 与模式 `&(x, y)` 匹配，所以 `x` 的值是 `3`，`y` 的值是 `5`。

我们也可以在闭包参数列表中使用模式，方式与函数参数列表相同，因为闭包与函数类似，正如第十三章所讨论的那样。

至此，你已经看到了使用模式的多种方式，但模式在每个可以使用它们的地方并不是以相同的方式工作的。在某些地方，模式必须是不可反驳的（irrefutable）；而在另一些情况下，它们可以是可反驳的（refutable）。接下来我们将讨论这两个概念。

[ignoring-values-in-a-pattern]: ch19-03-pattern-syntax.html#ignoring-values-in-a-pattern
