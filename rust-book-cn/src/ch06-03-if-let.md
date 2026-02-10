## 使用 `if let` 和 `let...else` 实现简洁控制流

`if let` 语法让你可以将 `if` 和 `let` 组合成一种更简洁的方式，来处理匹配某个模式的值，同时忽略其余的情况。考虑示例 6-6 中的程序，它对 `config_max` 变量中的 `Option<u8>` 值进行匹配，但只想在值为 `Some` 变体时执行代码。

<Listing number="6-6" caption="一个只关心值为 `Some` 时执行代码的 `match`">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-06/src/main.rs:here}}
```

</Listing>

如果值是 `Some`，我们通过在模式中将值绑定到变量 `max` 来打印出 `Some` 变体中的值。我们不想对 `None` 值做任何处理。为了满足 `match` 表达式的要求，我们不得不在只处理一个变体之后添加 `_ => ()`，这是一段烦人的样板代码。

换一种方式，我们可以使用 `if let` 来更简短地编写这段代码。以下代码的行为与示例 6-6 中的 `match` 相同：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-12-if-let/src/main.rs:here}}
```

`if let` 语法接受一个模式和一个表达式，中间用等号分隔。它的工作方式与 `match` 相同，其中表达式被传给 `match`，而模式则是它的第一个分支。在这个例子中，模式是 `Some(max)`，`max` 绑定到 `Some` 内部的值。然后我们可以在 `if let` 代码块中使用 `max`，就像在对应的 `match` 分支中使用 `max` 一样。`if let` 代码块中的代码只在值匹配模式时才会运行。

使用 `if let` 意味着更少的输入、更少的缩进和更少的样板代码。然而，你失去了 `match` 所强制的穷尽性检查，它能确保你不会遗漏任何情况。选择 `match` 还是 `if let` 取决于你在特定场景中要做什么，以及用简洁性换取穷尽性检查是否是合适的取舍。

换句话说，你可以把 `if let` 看作 `match` 的语法糖，它在值匹配某个模式时运行代码，然后忽略所有其他值。

我们可以在 `if let` 中包含一个 `else`。与 `else` 搭配的代码块等同于与 `match` 表达式中 `_` 分支搭配的代码块，而这个 `match` 表达式就等价于 `if let` 和 `else`。回忆一下示例 6-4 中 `Coin` 枚举的定义，其中 `Quarter` 变体还持有一个 `UsState` 值。如果我们想要统计所有非 25 美分硬币的数量，同时报告 25 美分硬币所属的州，可以使用 `match` 表达式来实现，像这样：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-13-count-and-announce-match/src/main.rs:here}}
```

或者我们可以使用 `if let` 和 `else` 表达式，像这样：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-14-count-and-announce-if-let-else/src/main.rs:here}}
```

## 使用 `let...else` 保持"快乐路径"

一种常见的模式是：当值存在时执行某些计算，否则返回一个默认值。继续我们关于带有 `UsState` 值的硬币的例子，如果我们想根据 25 美分硬币上的州有多古老来说些有趣的话，我们可以在 `UsState` 上引入一个方法来检查州的年龄，像这样：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-07/src/main.rs:state}}
```

然后，我们可以使用 `if let` 来匹配硬币的类型，在条件体内引入一个 `state` 变量，如示例 6-7 所示。

<Listing number="6-7" caption="使用嵌套在 `if let` 内的条件语句来检查某个州是否在 1900 年就已存在">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-07/src/main.rs:describe}}
```

</Listing>

这样确实能完成任务，但它把工作推到了 `if let` 语句的主体内部。如果要做的工作更复杂，可能就很难看清顶层分支之间的关系了。我们也可以利用表达式会产生值这一特性，要么从 `if let` 中产生 `state`，要么提前返回，如示例 6-8 所示。（你也可以用 `match` 做类似的事情。）

<Listing number="6-8" caption="使用 `if let` 来产生一个值或提前返回">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-08/src/main.rs:describe}}
```

</Listing>

不过这样读起来也有点别扭！`if let` 的一个分支产生一个值，而另一个分支则直接从函数返回。

为了让这种常见模式更优雅地表达，Rust 提供了 `let...else`。`let...else` 语法在左侧接受一个模式，在右侧接受一个表达式，与 `if let` 非常相似，但它没有 `if` 分支，只有 `else` 分支。如果模式匹配成功，它会在外层作用域中绑定模式中的值。如果模式_不_匹配，程序将进入 `else` 分支，而该分支必须从函数返回。

在示例 6-9 中，你可以看到使用 `let...else` 替代 `if let` 后，示例 6-8 的代码变成了什么样子。

<Listing number="6-9" caption="使用 `let...else` 来使函数的控制流更清晰">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-09/src/main.rs:describe}}
```

</Listing>

注意，这样代码就保持在函数主体的"快乐路径"上了，不会像 `if let` 那样让两个分支有截然不同的控制流。

如果你遇到程序的逻辑用 `match` 来表达过于冗长的情况，记住 `if let` 和 `let...else` 也是你 Rust 工具箱中的好帮手。

## 总结

我们已经介绍了如何使用枚举来创建可以是一组枚举值之一的自定义类型。我们展示了标准库的 `Option<T>` 类型如何帮助你利用类型系统来防止错误。当枚举值内部包含数据时，你可以使用 `match` 或 `if let` 来提取和使用这些值，具体取决于你需要处理多少种情况。

你的 Rust 程序现在可以使用结构体和枚举来表达领域中的概念了。创建自定义类型用于你的 API 可以确保类型安全：编译器会确保你的函数只接收到每个函数所期望的类型的值。

为了向用户提供一个组织良好、易于使用且只暴露用户所需内容的 API，接下来让我们转向 Rust 的模块系统。