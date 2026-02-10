## 模式语法

在本节中，我们将汇总所有在模式中有效的语法，并讨论为什么以及何时你可能会用到它们。

### 匹配字面量

如你在第六章中所见，可以直接用模式匹配字面量。以下代码给出了一些示例：

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/no-listing-01-literals/src/main.rs:here}}
```

这段代码会打印 `one`，因为 `x` 的值是 `1`。当你希望代码在获得某个特定具体值时执行某个操作时，这种语法非常有用。

### 匹配命名变量

命名变量是不可反驳的模式，可以匹配任何值，我们在本书中已经多次使用过。然而，在 `match`、`if let` 或 `while let` 表达式中使用命名变量时会有一个复杂之处。由于这些表达式都会开启一个新的作用域，在表达式内部作为模式一部分声明的变量会遮蔽（shadow）外部同名的变量，这与所有变量的行为一致。在示例 19-11 中，我们声明了一个值为 `Some(5)` 的变量 `x` 和一个值为 `10` 的变量 `y`。然后我们对 `x` 的值创建了一个 `match` 表达式。请观察匹配分支中的模式和末尾的 `println!`，在运行代码或继续阅读之前，试着推断出这段代码会打印什么。

<Listing number="19-11" file-name="src/main.rs" caption="一个 `match` 表达式，其中一个分支引入了一个新变量，遮蔽了已有的变量 `y`">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-11/src/main.rs:here}}
```

</Listing>

让我们逐步分析 `match` 表达式运行时发生了什么。第一个匹配分支的模式与 `x` 的定义值不匹配，所以代码继续执行。

第二个匹配分支引入了一个新变量 `y`，它会匹配 `Some` 中的任何值。因为我们处于 `match` 表达式内部的新作用域中，这是一个新的 `y` 变量，而不是我们在开头声明的值为 `10` 的那个 `y`。这个新的 `y` 绑定会匹配 `Some` 中的任何值，而 `x` 正是一个 `Some` 值。因此，这个新的 `y` 绑定到了 `x` 中 `Some` 的内部值。该值是 `5`，所以这个分支的表达式执行并打印 `Matched, y = 5`。

如果 `x` 是 `None` 而不是 `Some(5)`，前两个分支的模式都不会匹配，值将匹配到下划线分支。我们没有在下划线分支的模式中引入 `x` 变量，所以表达式中的 `x` 仍然是未被遮蔽的外部 `x`。在这种假设情况下，`match` 会打印 `Default case, x = None`。

当 `match` 表达式执行完毕后，其作用域结束，内部 `y` 的作用域也随之结束。最后的 `println!` 输出 `at the end: x = Some(5), y = 10`。

要创建一个比较外部 `x` 和 `y` 值的 `match` 表达式，而不是引入一个遮蔽已有 `y` 的新变量，我们需要使用匹配守卫条件。我们将在后面的["使用匹配守卫添加额外条件"](#adding-conditionals-with-match-guards)<!-- ignore -->一节中讨论匹配守卫。

<!-- Old headings. Do not remove or links may break. -->
<a id="multiple-patterns"></a>

### 匹配多个模式

在 `match` 表达式中，可以使用 `|` 语法匹配多个模式，`|` 是模式的**或**运算符。例如，在下面的代码中，我们将 `x` 的值与匹配分支进行比较，第一个分支有一个**或**选项，意味着如果 `x` 的值匹配该分支中的任一值，该分支的代码就会运行：


```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/no-listing-02-multiple-patterns/src/main.rs:here}}
```

这段代码会打印 `one or two`。

### 使用 `..=` 匹配值的范围

`..=` 语法允许我们匹配一个闭区间范围内的值。在下面的代码中，当模式匹配给定范围内的任何值时，该分支就会执行：

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/no-listing-03-ranges/src/main.rs:here}}
```

如果 `x` 是 `1`、`2`、`3`、`4` 或 `5`，第一个分支就会匹配。与使用 `|` 运算符表达相同意思相比，这种语法更加方便；如果使用 `|`，我们就得写成 `1 | 2 | 3 | 4 | 5`。指定范围要简短得多，特别是当我们想匹配比如 1 到 1000 之间的任何数字时！

编译器会在编译时检查范围是否为空，而 Rust 能判断范围是否为空的类型只有 `char` 和数值类型，因此范围只能用于数值或 `char` 值。

下面是一个使用 `char` 值范围的示例：

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/no-listing-04-ranges-of-char/src/main.rs:here}}
```

Rust 能判断出 `'c'` 在第一个模式的范围内，并打印 `early ASCII letter`。

### 解构以分解值

我们还可以使用模式来解构结构体、枚举和元组，以使用这些值的不同部分。让我们逐一介绍。

<!-- Old headings. Do not remove or links may break. -->

<a id="destructuring-structs"></a>

#### 结构体

示例 19-12 展示了一个包含两个字段 `x` 和 `y` 的 `Point` 结构体，我们可以通过 `let` 语句中的模式将其分解。

<Listing number="19-12" file-name="src/main.rs" caption="将结构体的字段解构为单独的变量">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-12/src/main.rs}}
```

</Listing>

这段代码创建了变量 `a` 和 `b`，分别匹配 `p` 结构体的 `x` 和 `y` 字段的值。这个例子表明模式中的变量名不必与结构体的字段名相同。不过，通常会让变量名与字段名一致，以便更容易记住哪个变量来自哪个字段。由于这种用法很常见，而且写成 `let Point { x: x, y: y } = p;` 包含大量重复，Rust 为匹配结构体字段的模式提供了简写形式：只需列出结构体字段的名称，模式创建的变量就会具有相同的名称。示例 19-13 的行为与示例 19-12 中的代码相同，但 `let` 模式中创建的变量是 `x` 和 `y`，而不是 `a` 和 `b`。

<Listing number="19-13" file-name="src/main.rs" caption="使用结构体字段简写来解构结构体字段">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-13/src/main.rs}}
```

</Listing>

这段代码创建了变量 `x` 和 `y`，分别匹配 `p` 变量的 `x` 和 `y` 字段。结果是变量 `x` 和 `y` 包含了 `p` 结构体中的值。

我们也可以在结构体模式中使用字面量值进行解构，而不是为所有字段创建变量。这样做允许我们测试某些字段是否为特定值，同时为其他字段创建变量来解构。

在示例 19-14 中，我们有一个 `match` 表达式，将 `Point` 值分为三种情况：直接位于 `x` 轴上的点（`y = 0` 时为真）、位于 `y` 轴上的点（`x = 0`）、以及不在任何轴上的点。

<Listing number="19-14" file-name="src/main.rs" caption="在一个模式中同时解构和匹配字面量值">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-14/src/main.rs:here}}
```

</Listing>

第一个分支通过指定 `y` 字段的值匹配字面量 `0` 来匹配位于 `x` 轴上的任何点。该模式仍然创建了一个 `x` 变量，可以在该分支的代码中使用。

类似地，第二个分支通过指定 `x` 字段的值为 `0` 来匹配位于 `y` 轴上的任何点，并为 `y` 字段的值创建了一个变量 `y`。第三个分支没有指定任何字面量，因此它匹配任何其他 `Point`，并为 `x` 和 `y` 字段都创建了变量。

在这个例子中，值 `p` 匹配第二个分支，因为 `x` 包含 `0`，所以这段代码会打印 `On the y axis at 7`。

请记住，`match` 表达式在找到第一个匹配的模式后就会停止检查后续分支，所以即使 `Point { x: 0, y: 0 }` 同时在 `x` 轴和 `y` 轴上，这段代码也只会打印 `On the x axis at 0`。

<!-- Old headings. Do not remove or links may break. -->

<a id="destructuring-enums"></a>

#### 枚举

我们在本书中已经解构过枚举（例如第六章的示例 6-5），但还没有明确讨论过解构枚举的模式与枚举中数据的定义方式是对应的。作为示例，在示例 19-15 中，我们使用示例 6-2 中的 `Message` 枚举，并编写一个 `match`，其模式将解构每个内部值。

<Listing number="19-15" file-name="src/main.rs" caption="解构持有不同类型值的枚举变体">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-15/src/main.rs}}
```

</Listing>

这段代码会打印 `Change color to red 0, green 160, and blue 255`。尝试修改 `msg` 的值来观察其他分支的代码运行。

对于没有任何数据的枚举变体，如 `Message::Quit`，我们无法进一步解构其值。只能匹配字面量 `Message::Quit` 值，该模式中没有变量。

对于类似结构体的枚举变体，如 `Message::Move`，我们可以使用类似于匹配结构体的模式。在变体名称之后，我们放置花括号并列出带有变量的字段，以便将各部分拆解出来在该分支的代码中使用。这里我们使用了与示例 19-13 中相同的简写形式。

对于类似元组的枚举变体，如持有一个元素的元组的 `Message::Write` 和持有三个元素的元组的 `Message::ChangeColor`，其模式类似于匹配元组的模式。模式中的变量数量必须与我们匹配的变体中的元素数量一致。

<!-- Old headings. Do not remove or links may break. -->

<a id="destructuring-nested-structs-and-enums"></a>

#### 嵌套的结构体和枚举

到目前为止，我们的示例都是匹配一层深度的结构体或枚举，但匹配也可以作用于嵌套的项！例如，我们可以重构示例 19-15 中的代码，在 `ChangeColor` 消息中支持 RGB 和 HSV 颜色，如示例 19-16 所示。

<Listing number="19-16" caption="匹配嵌套的枚举">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-16/src/main.rs}}
```

</Listing>

`match` 表达式中第一个分支的模式匹配包含 `Color::Rgb` 变体的 `Message::ChangeColor` 枚举变体；然后模式绑定到三个内部的 `i32` 值。第二个分支的模式也匹配 `Message::ChangeColor` 枚举变体，但内部枚举匹配的是 `Color::Hsv`。我们可以在一个 `match` 表达式中指定这些复杂的条件，即使涉及两个枚举。

<!-- Old headings. Do not remove or links may break. -->

<a id="destructuring-structs-and-tuples"></a>

#### 结构体和元组

我们可以用更复杂的方式混合、匹配和嵌套解构模式。下面的示例展示了一个复杂的解构，我们在一个元组中嵌套了结构体和元组，并将所有原始值解构出来：

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/no-listing-05-destructuring-structs-and-tuples/src/main.rs:here}}
```

这段代码让我们可以将复杂类型分解为其组成部分，以便分别使用我们感兴趣的值。

使用模式进行解构是一种方便的方式，可以分别使用值的各个部分，例如结构体中每个字段的值。

### 忽略模式中的值

你已经看到，在模式中忽略值有时是很有用的，例如在 `match` 的最后一个分支中，获得一个不做任何事情但能涵盖所有剩余可能值的通配分支。有几种方式可以忽略模式中的整个值或部分值：使用 `_` 模式（你已经见过）、在另一个模式中使用 `_` 模式、使用以下划线开头的名称、或者使用 `..` 来忽略值的剩余部分。让我们来探索如何以及为什么使用这些模式。

<!-- Old headings. Do not remove or links may break. -->

<a id="ignoring-an-entire-value-with-_"></a>

#### 使用 `_` 忽略整个值

我们已经使用过下划线作为通配模式，它可以匹配任何值但不绑定到该值。这在 `match` 表达式的最后一个分支中特别有用，但我们也可以在任何模式中使用它，包括函数参数，如示例 19-17 所示。

<Listing number="19-17" file-name="src/main.rs" caption="在函数签名中使用 `_`">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-17/src/main.rs}}
```

</Listing>

这段代码会完全忽略作为第一个参数传入的值 `3`，并打印 `This code only uses the y parameter: 4`。

在大多数情况下，当你不再需要某个函数参数时，你会修改函数签名使其不包含未使用的参数。忽略函数参数在某些情况下特别有用，例如当你实现一个 trait 时需要特定的类型签名，但你的实现中函数体不需要其中某个参数。这样可以避免编译器发出未使用函数参数的警告，而如果使用一个名称则会触发警告。

<!-- Old headings. Do not remove or links may break. -->

<a id="ignoring-parts-of-a-value-with-a-nested-_"></a>

#### 使用嵌套的 `_` 忽略值的部分

我们也可以在另一个模式内部使用 `_` 来只忽略值的一部分，例如当我们只想测试值的一部分，而在要运行的相应代码中不需要其他部分时。示例 19-18 展示了负责管理设置值的代码。业务需求是不允许用户覆盖已有的自定义设置值，但可以取消设置并在当前未设置时赋予新值。

<Listing number="19-18" caption="在不需要使用 `Some` 内部值时，在匹配 `Some` 变体的模式中使用下划线">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-18/src/main.rs:here}}
```

</Listing>

这段代码会打印 `Can't overwrite an existing customized value`，然后打印 `setting is Some(5)`。在第一个匹配分支中，我们不需要匹配或使用任何一个 `Some` 变体内部的值，但我们确实需要测试 `setting_value` 和 `new_setting_value` 都是 `Some` 变体的情况。在这种情况下，我们打印不修改 `setting_value` 的原因，并且它不会被修改。

在所有其他情况下（如果 `setting_value` 或 `new_setting_value` 中任一为 `None`），由第二个分支中的 `_` 模式表示，我们希望允许 `new_setting_value` 成为 `setting_value`。

我们也可以在一个模式中的多个位置使用下划线来忽略特定的值。示例 19-19 展示了一个忽略五元组中第二个和第四个值的例子。

<Listing number="19-19" caption="忽略元组中的多个部分">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-19/src/main.rs:here}}
```

</Listing>

这段代码会打印 `Some numbers: 2, 8, 32`，值 `4` 和 `16` 会被忽略。

<!-- Old headings. Do not remove or links may break. -->

<a id="ignoring-an-unused-variable-by-starting-its-name-with-_"></a>

#### 通过以 `_` 开头的名称忽略未使用的变量

如果你创建了一个变量但没有在任何地方使用它，Rust 通常会发出警告，因为未使用的变量可能是一个 bug。然而，有时能够创建一个暂时不会使用的变量是很有用的，例如当你在做原型开发或刚开始一个项目时。在这种情况下，你可以通过让变量名以下划线开头来告诉 Rust 不要警告你这个未使用的变量。在示例 19-20 中，我们创建了两个未使用的变量，但编译这段代码时，我们应该只会收到关于其中一个的警告。

<Listing number="19-20" file-name="src/main.rs" caption="以下划线开头的变量名可以避免未使用变量的警告">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-20/src/main.rs}}
```

</Listing>

这里我们收到了关于未使用变量 `y` 的警告，但没有收到关于 `_x` 的警告。

注意，只使用 `_` 和使用以下划线开头的名称之间有一个微妙的区别。语法 `_x` 仍然会将值绑定到变量，而 `_` 则完全不绑定。为了展示这个区别的重要性，示例 19-21 会给我们一个错误。

<Listing number="19-21" caption="以下划线开头的未使用变量仍然会绑定值，这可能会获取值的所有权">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-21/src/main.rs:here}}
```

</Listing>

我们会收到一个错误，因为 `s` 的值仍然会被移动到 `_s` 中，这阻止了我们再次使用 `s`。然而，单独使用下划线永远不会绑定到值。示例 19-22 可以编译通过，因为 `s` 不会被移动到 `_` 中。

<Listing number="19-22" caption="使用下划线不会绑定值">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-22/src/main.rs:here}}
```

</Listing>

这段代码完全没有问题，因为我们从未将 `s` 绑定到任何东西；它没有被移动。

<a id="ignoring-remaining-parts-of-a-value-with-"></a>

#### 使用 `..` 忽略值的剩余部分

对于有很多部分的值，我们可以使用 `..` 语法来只使用特定部分而忽略其余部分，从而避免为每个被忽略的值列出下划线。`..` 模式会忽略我们在模式其余部分中没有显式匹配的任何部分。在示例 19-23 中，我们有一个在三维空间中保存坐标的 `Point` 结构体。在 `match` 表达式中，我们只想操作 `x` 坐标，而忽略 `y` 和 `z` 字段的值。

<Listing number="19-23" caption="使用 `..` 忽略 `Point` 中除 `x` 以外的所有字段">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-23/src/main.rs:here}}
```

</Listing>

我们列出了 `x` 的值，然后只包含了 `..` 模式。这比必须列出 `y: _` 和 `z: _` 要快捷得多，特别是当我们处理有很多字段的结构体而只有一两个字段相关时。

`..` 语法会扩展为所需数量的值。示例 19-24 展示了如何在元组中使用 `..`。

<Listing number="19-24" file-name="src/main.rs" caption="只匹配元组中的第一个和最后一个值，忽略所有其他值">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-24/src/main.rs}}
```

</Listing>

在这段代码中，第一个和最后一个值分别与 `first` 和 `last` 匹配。`..` 会匹配并忽略中间的所有值。

然而，使用 `..` 必须是无歧义的。如果不清楚哪些值用于匹配、哪些应该被忽略，Rust 会给出错误。示例 19-25 展示了一个有歧义地使用 `..` 的例子，因此无法编译。

<Listing number="19-25" file-name="src/main.rs" caption="尝试以有歧义的方式使用 `..`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-25/src/main.rs}}
```

</Listing>

当我们编译这个例子时，会得到如下错误：

```console
{{#include ../listings/ch19-patterns-and-matching/listing-19-25/output.txt}}
```

Rust 无法确定在匹配 `second` 之前应该忽略元组中的多少个值，以及之后还应该忽略多少个值。这段代码可能意味着我们想忽略 `2`，将 `second` 绑定到 `4`，然后忽略 `8`、`16` 和 `32`；也可能意味着我们想忽略 `2` 和 `4`，将 `second` 绑定到 `8`，然后忽略 `16` 和 `32`；等等。变量名 `second` 对 Rust 来说没有任何特殊含义，所以我们会得到一个编译器错误，因为在两个位置使用 `..` 是有歧义的。

<!-- Old headings. Do not remove or links may break. -->

<a id="extra-conditionals-with-match-guards"></a>

### 使用匹配守卫添加额外条件

**匹配守卫**（match guard）是在 `match` 分支的模式之后指定的额外 `if` 条件，该条件也必须匹配才能选择该分支。匹配守卫对于表达比单独模式更复杂的逻辑非常有用。不过请注意，匹配守卫只能在 `match` 表达式中使用，不能在 `if let` 或 `while let` 表达式中使用。

条件可以使用模式中创建的变量。示例 19-26 展示了一个 `match`，其中第一个分支的模式是 `Some(x)`，并且还有一个匹配守卫 `if x % 2 == 0`（如果数字是偶数则为 `true`）。

<Listing number="19-26" caption="为模式添加匹配守卫">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-26/src/main.rs:here}}
```

</Listing>

这个例子会打印 `The number 4 is even`。当 `num` 与第一个分支的模式比较时，它匹配了，因为 `Some(4)` 匹配 `Some(x)`。然后匹配守卫检查 `x` 除以 2 的余数是否等于 0，因为确实如此，所以选择了第一个分支。

如果 `num` 是 `Some(5)`，第一个分支中的匹配守卫将为 `false`，因为 5 除以 2 的余数是 1，不等于 0。Rust 接着会转到第二个分支，该分支会匹配，因为第二个分支没有匹配守卫，因此匹配任何 `Some` 变体。

无法在模式内部表达 `if x % 2 == 0` 这个条件，所以匹配守卫赋予了我们表达这种逻辑的能力。这种额外表达力的缺点是，当涉及匹配守卫表达式时，编译器不会尝试检查穷尽性。

在讨论示例 19-11 时，我们提到可以使用匹配守卫来解决模式遮蔽问题。回忆一下，我们在 `match` 表达式的模式中创建了一个新变量，而不是使用 `match` 外部的变量。那个新变量意味着我们无法针对外部变量的值进行测试。示例 19-27 展示了如何使用匹配守卫来修复这个问题。

<Listing number="19-27" file-name="src/main.rs" caption="使用匹配守卫来测试与外部变量的相等性">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-27/src/main.rs}}
```

</Listing>

这段代码现在会打印 `Default case, x = Some(5)`。第二个匹配分支的模式没有引入一个会遮蔽外部 `y` 的新变量 `y`，这意味着我们可以在匹配守卫中使用外部的 `y`。我们将模式指定为 `Some(n)` 而不是 `Some(y)`（后者会遮蔽外部的 `y`）。这创建了一个新变量 `n`，它不会遮蔽任何东西，因为 `match` 外部没有 `n` 变量。

匹配守卫 `if n == y` 不是一个模式，因此不会引入新变量。这里的 `y` **就是**外部的 `y`，而不是一个新的遮蔽 `y`，我们可以通过比较 `n` 和 `y` 来查找与外部 `y` 具有相同值的值。

你也可以在匹配守卫中使用**或**运算符 `|` 来指定多个模式；匹配守卫条件将应用于所有模式。示例 19-28 展示了将使用 `|` 的模式与匹配守卫组合时的优先级。这个例子的重要之处在于，`if y` 匹配守卫应用于 `4`、`5` **和** `6`，即使看起来 `if y` 只应用于 `6`。

<Listing number="19-28" caption="将多个模式与匹配守卫组合">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-28/src/main.rs:here}}
```

</Listing>

匹配条件表明该分支只在 `x` 的值等于 `4`、`5` 或 `6` **并且** `y` 为 `true` 时才匹配。当这段代码运行时，第一个分支的模式匹配了，因为 `x` 是 `4`，但匹配守卫 `if y` 为 `false`，所以第一个分支没有被选择。代码转到第二个分支，它匹配了，程序打印 `no`。原因是 `if` 条件应用于整个模式 `4 | 5 | 6`，而不仅仅是最后一个值 `6`。换句话说，匹配守卫相对于模式的优先级行为如下：

```text
(4 | 5 | 6) if y => ...
```

而不是这样：

```text
4 | 5 | (6 if y) => ...
```

运行代码后，优先级行为就很明显了：如果匹配守卫只应用于使用 `|` 运算符指定的值列表中的最后一个值，那么该分支就会匹配，程序就会打印 `yes`。

<!-- Old headings. Do not remove or links may break. -->

<a id="-bindings"></a>

### 使用 `@` 绑定

**at** 运算符 `@` 允许我们在测试一个值是否匹配模式的同时，创建一个保存该值的变量。在示例 19-29 中，我们想测试 `Message::Hello` 的 `id` 字段是否在 `3..=7` 范围内。我们还想将该值绑定到变量 `id`，以便在与该分支关联的代码中使用它。

<Listing number="19-29" caption="使用 `@` 在模式中测试值的同时绑定该值">

```rust
{{#rustdoc_include ../listings/ch19-patterns-and-matching/listing-19-29/src/main.rs:here}}
```

</Listing>

这个例子会打印 `Found an id in range: 5`。通过在范围 `3..=7` 之前指定 `id @`，我们在测试值是否匹配范围模式的同时，将匹配到的值捕获到了名为 `id` 的变量中。

在第二个分支中，模式里只指定了一个范围，与该分支关联的代码没有一个包含 `id` 字段实际值的变量。`id` 字段的值可能是 10、11 或 12，但与该模式对应的代码不知道具体是哪个。模式代码无法使用 `id` 字段的值，因为我们没有将 `id` 值保存到变量中。

在最后一个分支中，我们指定了一个没有范围的变量，此时我们确实可以在该分支的代码中使用名为 `id` 的变量中的值。原因是我们使用了结构体字段简写语法。但我们没有像前两个分支那样对 `id` 字段的值应用任何测试：任何值都会匹配这个模式。

使用 `@` 可以让我们在一个模式中同时测试一个值并将其保存到变量中。

## 总结

Rust 的模式在区分不同类型的数据方面非常有用。当在 `match` 表达式中使用时，Rust 会确保你的模式覆盖了每一个可能的值，否则程序将无法编译。`let` 语句和函数参数中的模式使这些构造更加有用，能够将值解构为更小的部分并将这些部分赋值给变量。我们可以创建简单或复杂的模式来满足我们的需求。

接下来，在本书倒数第二章中，我们将探讨 Rust 各种特性的一些高级方面。
