<!-- Old headings. Do not remove or links may break. -->

<a id="the-match-control-flow-operator"></a>

## `match` 控制流结构

Rust 有一个极为强大的控制流结构叫做 `match`，它允许你将一个值与一系列模式进行比较，然后根据匹配的模式执行相应的代码。模式可以由字面量值、变量名、通配符和许多其他内容组成；[第 19 章][ch19-00-patterns]<!-- ignore -->涵盖了所有不同种类的模式及其作用。`match` 的强大之处在于模式的表达力，以及编译器会确认所有可能的情况都已被处理。

可以把 `match` 表达式想象成一台硬币分拣机：硬币沿着轨道滑下，轨道上有各种大小的孔，每枚硬币会掉入它遇到的第一个合适的孔中。同样地，值会依次通过 `match` 中的每个模式，在第一个"匹配"的模式处，值会落入相关联的代码块中执行。

说到硬币，让我们用它来作为 `match` 的示例！我们可以编写一个函数，接受一枚未知的美国硬币，以类似于计数机的方式确定它是哪种硬币，并返回其面值（以美分为单位），如示例 6-3 所示。

<Listing number="6-3" caption="一个枚举和一个以枚举成员作为模式的 `match` 表达式">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-03/src/main.rs:here}}
```

</Listing>

让我们来分解 `value_in_cents` 函数中的 `match`。首先，我们写下 `match` 关键字，后跟一个表达式，在本例中是值 `coin`。这看起来与 `if` 使用的条件表达式非常相似，但有一个很大的区别：使用 `if` 时，条件需要求值为布尔值，而这里可以是任何类型。本例中 `coin` 的类型是我们在第一行定义的 `Coin` 枚举。

接下来是 `match` 的分支（arm）。一个分支有两个部分：一个模式和一些代码。这里的第一个分支的模式是值 `Coin::Penny`，然后是 `=>` 运算符，它将模式和要运行的代码分隔开。这个分支中的代码只是值 `1`。每个分支之间用逗号分隔。

当 `match` 表达式执行时，它会按顺序将结果值与每个分支的模式进行比较。如果模式匹配了该值，则执行与该模式关联的代码。如果该模式不匹配，则继续执行下一个分支，就像硬币分拣机一样。我们可以拥有任意多个分支：在示例 6-3 中，我们的 `match` 有四个分支。

与每个分支关联的代码是一个表达式，匹配分支中表达式的结果值就是整个 `match` 表达式的返回值。

如果匹配分支的代码很短，我们通常不使用花括号，就像示例 6-3 中每个分支只返回一个值那样。如果你想在一个匹配分支中运行多行代码，就必须使用花括号，此时分支后面的逗号是可选的。例如，以下代码在每次使用 `Coin::Penny` 调用方法时打印"Lucky penny!"，但仍然返回代码块的最后一个值 `1`：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-08-match-arm-multiple-lines/src/main.rs:here}}
```

### 绑定值的模式

匹配分支的另一个有用特性是它们可以绑定匹配模式中的部分值。这就是我们从枚举成员中提取值的方式。

举个例子，让我们修改一个枚举成员使其内部持有数据。从 1999 年到 2008 年，美国在 25 美分硬币的一面铸造了 50 个州各自不同的设计。其他硬币没有州的设计，所以只有 25 美分硬币有这个额外的值。我们可以通过修改 `Quarter` 成员来包含一个存储在内部的 `UsState` 值，将这个信息添加到我们的 `enum` 中，如示例 6-4 所示。

<Listing number="6-4" caption="一个 `Coin` 枚举，其中 `Quarter` 成员还持有一个 `UsState` 值">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-04/src/main.rs:here}}
```

</Listing>

假设一个朋友正在尝试收集所有 50 个州的 25 美分硬币。在我们按硬币类型分拣零钱的同时，我们还会报出每枚 25 美分硬币对应的州名，这样如果是我们朋友没有的，他们就可以将其加入收藏。

在这段代码的 match 表达式中，我们在匹配 `Coin::Quarter` 成员值的模式中添加了一个名为 `state` 的变量。当 `Coin::Quarter` 匹配时，`state` 变量将绑定到该 25 美分硬币的州值。然后我们可以在该分支的代码中使用 `state`，如下所示：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-09-variable-in-pattern/src/main.rs:here}}
```

如果我们调用 `value_in_cents(Coin::Quarter(UsState::Alaska))`，`coin` 将是 `Coin::Quarter(UsState::Alaska)`。当我们将该值与每个匹配分支进行比较时，在到达 `Coin::Quarter(state)` 之前没有任何分支匹配。此时，`state` 的绑定值将是 `UsState::Alaska`。然后我们可以在 `println!` 表达式中使用该绑定，从而从 `Coin` 枚举的 `Quarter` 成员中获取内部的州值。

<!-- Old headings. Do not remove or links may break. -->

<a id="matching-with-optiont"></a>

### 匹配 `Option<T>`

在上一节中，我们想从 `Option<T>` 的 `Some` 情况中获取内部的 `T` 值；我们同样可以使用 `match` 来处理 `Option<T>`，就像处理 `Coin` 枚举一样！我们不再比较硬币，而是比较 `Option<T>` 的成员，但 `match` 表达式的工作方式保持不变。

假设我们想编写一个函数，接受一个 `Option<i32>`，如果内部有值，就将该值加 1。如果内部没有值，函数应返回 `None` 值，不尝试执行任何操作。

得益于 `match`，这个函数非常容易编写，如示例 6-5 所示。

<Listing number="6-5" caption="一个对 `Option<i32>` 使用 `match` 表达式的函数">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-05/src/main.rs:here}}
```

</Listing>

让我们更详细地检查 `plus_one` 的第一次执行。当我们调用 `plus_one(five)` 时，`plus_one` 函数体中的变量 `x` 将具有值 `Some(5)`。然后我们将其与每个匹配分支进行比较：

```rust,ignore
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-05/src/main.rs:first_arm}}
```

`Some(5)` 值不匹配模式 `None`，所以我们继续到下一个分支：

```rust,ignore
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-05/src/main.rs:second_arm}}
```

`Some(5)` 匹配 `Some(i)` 吗？匹配！我们有相同的成员。`i` 绑定到 `Some` 中包含的值，所以 `i` 的值为 `5`。然后执行匹配分支中的代码，我们将 `i` 的值加 1，并用总计值 `6` 创建一个新的 `Some` 值。

现在让我们考虑示例 6-5 中 `plus_one` 的第二次调用，此时 `x` 是 `None`。我们进入 `match` 并与第一个分支进行比较：

```rust,ignore
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-05/src/main.rs:first_arm}}
```

匹配了！没有值可以相加，所以程序停止并返回 `=>` 右侧的 `None` 值。因为第一个分支就匹配了，所以不会再比较其他分支。

将 `match` 与枚举结合在许多场景中都很有用。你会在 Rust 代码中经常看到这种模式：对枚举进行 `match`，将一个变量绑定到内部的数据，然后基于它执行代码。一开始可能有点难以理解，但一旦习惯了，你会希望所有语言都有这个特性。它一直是用户的最爱。

### 匹配是穷尽的

我们还需要讨论 `match` 的另一个方面：分支的模式必须覆盖所有可能性。考虑以下这个有 bug 且无法编译的 `plus_one` 函数版本：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-10-non-exhaustive-match/src/main.rs:here}}
```

我们没有处理 `None` 的情况，所以这段代码会导致 bug。幸运的是，这是 Rust 能够捕获的 bug。如果我们尝试编译这段代码，会得到以下错误：

```console
{{#include ../listings/ch06-enums-and-pattern-matching/no-listing-10-non-exhaustive-match/output.txt}}
```

Rust 知道我们没有覆盖所有可能的情况，甚至知道我们忘记了哪个模式！Rust 中的匹配是*穷尽的*（exhaustive）：我们必须穷举所有可能性，代码才能有效。特别是在 `Option<T>` 的情况下，当 Rust 阻止我们忘记显式处理 `None` 的情况时，它保护我们免于假设自己拥有一个值而实际上可能是空值，从而使前面讨论的价值十亿美元的错误变得不可能发生。

### 通配模式和 `_` 占位符

使用枚举时，我们还可以对少数特定值采取特殊操作，而对所有其他值采取一个默认操作。想象一下我们正在实现一个游戏，如果你掷骰子掷出 3，你的玩家不移动，而是获得一顶新的花哨帽子。如果你掷出 7，你的玩家失去一顶花哨帽子。对于所有其他值，你的玩家在游戏棋盘上移动相应的格数。这是一个实现该逻辑的 `match`，其中骰子掷出的结果是硬编码的而非随机值，所有其他逻辑用没有函数体的函数表示，因为实际实现它们超出了本示例的范围：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-15-binding-catchall/src/main.rs:here}}
```

对于前两个分支，模式是字面量值 `3` 和 `7`。对于覆盖所有其他可能值的最后一个分支，模式是我们选择命名为 `other` 的变量。为 `other` 分支运行的代码通过将该变量传递给 `move_player` 函数来使用它。

即使我们没有列出 `u8` 可能具有的所有值，这段代码也能编译，因为最后一个模式将匹配所有未被特别列出的值。这个通配（catch-all）模式满足了 `match` 必须穷尽的要求。注意，我们必须将通配分支放在最后，因为模式是按顺序求值的。如果我们把通配分支放在前面，其他分支将永远不会运行，所以如果我们在通配分支之后添加分支，Rust 会警告我们！

Rust 还有一个模式，当我们想要通配但不想*使用*通配模式中的值时可以使用：`_` 是一个特殊模式，它匹配任何值但不绑定到该值。这告诉 Rust 我们不会使用该值，所以 Rust 不会警告我们有未使用的变量。

让我们改变游戏规则：现在，如果你掷出 3 或 7 以外的任何数字，你必须重新掷。我们不再需要使用通配值，所以可以将代码改为使用 `_` 而不是名为 `other` 的变量：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-16-underscore-catchall/src/main.rs:here}}
```

这个示例同样满足穷尽性要求，因为我们在最后一个分支中显式地忽略了所有其他值；我们没有遗漏任何东西。

最后，让我们再次改变游戏规则，如果你掷出 3 或 7 以外的任何数字，你的回合什么也不会发生。我们可以使用单元值（我们在["元组类型"][tuples]<!-- ignore -->部分提到的空元组类型）作为 `_` 分支的代码来表达这一点：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-17-underscore-unit/src/main.rs:here}}
```

这里我们明确告诉 Rust，我们不会使用任何不匹配前面分支模式的其他值，并且在这种情况下不想运行任何代码。

关于模式和匹配还有更多内容，我们将在[第 19 章][ch19-00-patterns]<!-- ignore -->中介绍。现在我们将继续学习 `if let` 语法，它在 `match` 表达式显得有些冗长的情况下很有用。

[tuples]: ch03-02-data-types.html#the-tuple-type
[ch19-00-patterns]: ch19-00-patterns.html
