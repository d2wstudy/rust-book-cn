## 可反驳性：模式是否可能匹配失败

模式有两种形式：可反驳的（refutable）和不可反驳的（irrefutable）。对于任何可能传入的值都能匹配成功的模式是**不可反驳的**。例如 `let x = 5;` 语句中的 `x`，因为 `x` 可以匹配任何值，所以不可能匹配失败。而对于某些可能的值会匹配失败的模式则是**可反驳的**。例如 `if let Some(x) = a_value` 表达式中的 `Some(x)`，如果 `a_value` 变量中的值是 `None` 而不是 `Some`，那么 `Some(x)` 模式就无法匹配。

函数参数、`let` 语句和 `for` 循环只能接受不可反驳的模式，因为当值不匹配时，程序无法执行任何有意义的操作。`if let` 和 `while let` 表达式以及 `let...else` 语句则同时接受可反驳和不可反驳的模式，不过编译器会对不可反驳的模式发出警告，因为根据定义，它们本就是用来处理可能失败的情况的：条件语句的意义就在于能够根据匹配成功或失败来执行不同的操作。

通常你不需要担心可反驳和不可反驳模式之间的区别；但你确实需要熟悉可反驳性的概念，这样当你在错误信息中看到它时才能做出正确的应对。在这些情况下，你需要根据代码的预期行为，修改模式本身或者修改使用模式的语法结构。

让我们来看一个例子，看看当我们尝试在 Rust 要求不可反驳模式的地方使用可反驳模式时会发生什么，反之亦然。示例 19-8 展示了一个 `let` 语句，但我们为模式指定了 `Some(x)`——一个可反驳的模式。如你所料，这段代码无法编译。

<Listing number="19-8" caption="尝试在 `let` 中使用可反驳模式">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-08/src/main.rs:here}}
```

</Listing>

如果 `some_option_value` 的值是 `None`，它就无法匹配 `Some(x)` 模式，这意味着该模式是可反驳的。然而 `let` 语句只能接受不可反驳的模式，因为对于 `None` 值，代码无法执行任何有效的操作。在编译时，Rust 会报错，提示我们在需要不可反驳模式的地方使用了可反驳模式：

```console
{{#include ../listings/ch19-patterns-and-matching/listing-19-08/output.txt}}
```

因为我们没有（也不可能！）用 `Some(x)` 模式覆盖所有合法的值，所以 Rust 理所当然地产生了编译错误。

如果我们在需要不可反驳模式的地方使用了可反驳模式，可以通过修改使用模式的代码来修复：不使用 `let`，而是使用 `let...else`。这样，如果模式不匹配，花括号中的代码就会处理该值。示例 19-9 展示了如何修复示例 19-8 中的代码。

<Listing number="19-9" caption="使用 `let...else` 和代码块来处理可反驳模式，而非使用 `let`">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-09/src/main.rs:here}}
```

</Listing>

我们给代码提供了一条出路！这段代码现在完全合法了，不过这也意味着我们不能在不收到警告的情况下使用不可反驳模式。如果我们给 `let...else` 一个总是能匹配的模式，比如 `x`，如示例 19-10 所示，编译器会发出警告。

<Listing number="19-10" caption="尝试在 `let...else` 中使用不可反驳模式">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-10/src/main.rs:here}}
```

</Listing>

Rust 会提示在 `let...else` 中使用不可反驳模式是没有意义的：

```console
{{#include ../listings/ch19-patterns-and-matching/listing-19-10/output.txt}}
```

因此，`match` 的分支必须使用可反驳模式，最后一个分支除外——它应该使用不可反驳模式来匹配所有剩余的值。Rust 允许我们在只有一个分支的 `match` 中使用不可反驳模式，但这种语法并不是特别有用，完全可以用更简单的 `let` 语句来替代。

现在你已经知道了在哪里使用模式以及可反驳模式与不可反驳模式之间的区别，接下来让我们来介绍可以用于创建模式的所有语法。
