## 方法

方法与函数类似：我们使用 `fn` 关键字和名称来声明它们，它们可以有参数和返回值，并且包含一些在方法被调用时运行的代码。与函数不同的是，方法是在结构体（或枚举、trait 对象，我们分别在[第 6 章][enums]<!-- ignore -->和[第 18 章][trait-objects]<!-- ignore -->中介绍）的上下文中定义的，并且它们的第一个参数始终是 `self`，代表调用该方法的结构体实例。

<!-- Old headings. Do not remove or links may break. -->

<a id="defining-methods"></a>

### 方法语法

让我们把以 `Rectangle` 实例作为参数的 `area` 函数，改为定义在 `Rectangle` 结构体上的 `area` 方法，如示例 5-13 所示。

<Listing number="5-13" file-name="src/main.rs" caption="在 `Rectangle` 结构体上定义 `area` 方法">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-13/src/main.rs}}
```

</Listing>

为了在 `Rectangle` 的上下文中定义函数，我们为 `Rectangle` 开启一个 `impl`（implementation，实现）块。这个 `impl` 块中的所有内容都将与 `Rectangle` 类型相关联。然后我们将 `area` 函数移到 `impl` 花括号内，并将签名中的第一个（在本例中也是唯一的）参数以及函数体中的所有对应位置改为 `self`。在 `main` 中，之前我们调用 `area` 函数并将 `rect1` 作为参数传入，现在可以改用*方法语法*来调用 `Rectangle` 实例上的 `area` 方法。方法语法跟在实例后面：我们添加一个点号，后跟方法名、圆括号以及任何参数。

在 `area` 的签名中，我们使用 `&self` 而不是 `rectangle: &Rectangle`。`&self` 实际上是 `self: &Self` 的缩写。在 `impl` 块中，`Self` 类型是 `impl` 块所针对的类型的别名。方法的第一个参数必须是名为 `self` 的 `Self` 类型参数，因此 Rust 允许你在第一个参数位置只用 `self` 这个名称来简写。注意，我们仍然需要在 `self` 缩写前面加上 `&` 来表示该方法借用了 `Self` 实例，就像我们在 `rectangle: &Rectangle` 中所做的那样。方法可以获取 `self` 的所有权、像这里一样不可变地借用 `self`，或者可变地借用 `self`，就像对待其他参数一样。

我们在这里选择 `&self` 的原因与在函数版本中使用 `&Rectangle` 的原因相同：我们不想获取所有权，只想读取结构体中的数据，而不是写入。如果我们想在方法执行过程中修改调用该方法的实例，就需要使用 `&mut self` 作为第一个参数。使用 `self` 作为第一个参数来获取实例所有权的方法很少见；这种技术通常用于方法将 `self` 转换为其他东西，并且你希望阻止调用者在转换后继续使用原始实例的场景。

使用方法而非函数的主要原因，除了提供方法语法和不必在每个方法签名中重复 `self` 的类型之外，还在于代码组织。我们将一个类型实例能做的所有事情都放在一个 `impl` 块中，而不是让未来的用户在我们提供的库的各处去寻找 `Rectangle` 的功能。

注意，我们可以选择让方法与结构体的某个字段同名。例如，我们可以在 `Rectangle` 上定义一个同样名为 `width` 的方法：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/no-listing-06-method-field-interaction/src/main.rs:here}}
```

</Listing>

这里我们选择让 `width` 方法在实例的 `width` 字段值大于 `0` 时返回 `true`，等于 `0` 时返回 `false`：我们可以在同名方法中将字段用于任何目的。在 `main` 中，当我们在 `rect1.width` 后面加上圆括号时，Rust 知道我们指的是 `width` 方法。当我们不使用圆括号时，Rust 知道我们指的是 `width` 字段。

通常（但并非总是），当我们给方法取与字段相同的名称时，我们希望它只返回字段中的值而不做其他事情。这样的方法被称为 _getter_，Rust 不会像某些其他语言那样为结构体字段自动实现 getter。getter 很有用，因为你可以将字段设为私有，但将方法设为公有，从而在类型的公有 API 中实现对该字段的只读访问。我们将在[第 7 章][public]<!-- ignore -->中讨论什么是公有和私有，以及如何将字段或方法指定为公有或私有。

> ### `->` 运算符到哪去了？
>
> 在 C 和 C++ 中，调用方法使用两种不同的运算符：如果直接在对象上调用方法，使用 `.`；如果在对象的指针上调用方法并且需要先解引用指针，则使用 `->`。换句话说，如果 `object` 是一个指针，`object->something()` 类似于 `(*object).something()`。
>
> Rust 没有与 `->` 运算符等价的东西；相反，Rust 有一个叫做*自动引用和解引用*（automatic referencing and dereferencing）的特性。调用方法是 Rust 中少数几个具有这种行为的地方之一。
>
> 它的工作原理是这样的：当你使用 `object.something()` 调用方法时，Rust 会自动添加 `&`、`&mut` 或 `*`，以使 `object` 匹配方法的签名。换句话说，以下两种写法是等价的：
>
> <!-- CAN'T EXTRACT SEE BUG https://github.com/rust-lang/mdBook/issues/1127 -->
>
> ```rust
> # #[derive(Debug,Copy,Clone)]
> # struct Point {
> #     x: f64,
> #     y: f64,
> # }
> #
> # impl Point {
> #    fn distance(&self, other: &Point) -> f64 {
> #        let x_squared = f64::powi(other.x - self.x, 2);
> #        let y_squared = f64::powi(other.y - self.y, 2);
> #
> #        f64::sqrt(x_squared + y_squared)
> #    }
> # }
> # let p1 = Point { x: 0.0, y: 0.0 };
> # let p2 = Point { x: 5.0, y: 6.5 };
> p1.distance(&p2);
> (&p1).distance(&p2);
> ```
>
> 第一种写法看起来简洁得多。这种自动引用行为之所以可行，是因为方法有一个明确的接收者——即 `self` 的类型。在给定接收者和方法名的情况下，Rust 可以明确地判断出方法是在读取（`&self`）、修改（`&mut self`）还是消费（`self`）。Rust 对方法接收者隐式借用的这一事实，是让所有权在实践中更加符合人体工程学的重要组成部分。

### 带有更多参数的方法

让我们通过在 `Rectangle` 结构体上实现第二个方法来练习使用方法。这次我们希望 `Rectangle` 的一个实例接受另一个 `Rectangle` 实例，如果第二个 `Rectangle` 能完全容纳在 `self`（第一个 `Rectangle`）内则返回 `true`；否则返回 `false`。也就是说，一旦我们定义了 `can_hold` 方法，我们希望能够编写如示例 5-14 所示的程序。

<Listing number="5-14" file-name="src/main.rs" caption="使用尚未编写的 `can_hold` 方法">

```rust,ignore
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-14/src/main.rs}}
```

</Listing>

预期输出如下，因为 `rect2` 的两个维度都小于 `rect1`，而 `rect3` 比 `rect1` 更宽：

```text
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

我们知道要定义一个方法，所以它将位于 `impl Rectangle` 块中。方法名为 `can_hold`，它将接受另一个 `Rectangle` 的不可变借用作为参数。通过查看调用该方法的代码，我们可以判断参数的类型：`rect1.can_hold(&rect2)` 传入了 `&rect2`，即 `rect2`（一个 `Rectangle` 实例）的不可变借用。这是合理的，因为我们只需要读取 `rect2`（而不是写入，那样就需要可变借用了），并且我们希望 `main` 保留 `rect2` 的所有权，以便在调用 `can_hold` 方法之后还能继续使用它。`can_hold` 的返回值将是一个布尔值，其实现将检查 `self` 的宽度和高度是否分别大于另一个 `Rectangle` 的宽度和高度。让我们将新的 `can_hold` 方法添加到示例 5-13 的 `impl` 块中，如示例 5-15 所示。

<Listing number="5-15" file-name="src/main.rs" caption="在 `Rectangle` 上实现 `can_hold` 方法，它接受另一个 `Rectangle` 实例作为参数">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-15/src/main.rs:here}}
```

</Listing>

当我们使用示例 5-14 中的 `main` 函数运行这段代码时，将得到期望的输出。方法可以接受多个参数，我们在 `self` 参数之后将它们添加到签名中，这些参数的工作方式与函数中的参数完全相同。

### 关联函数

所有在 `impl` 块中定义的函数都被称为*关联函数*（associated functions），因为它们与 `impl` 后面命名的类型相关联。我们可以定义不以 `self` 作为第一个参数的关联函数（因此不是方法），因为它们不需要该类型的实例来工作。我们已经使用过一个这样的函数：定义在 `String` 类型上的 `String::from` 函数。

不是方法的关联函数通常用作构造函数，返回结构体的新实例。这些函数通常被命名为 `new`，但 `new` 并不是一个特殊的名称，也不是语言内置的。例如，我们可以选择提供一个名为 `square` 的关联函数，它接受一个维度参数，并将其同时用作宽度和高度，这样就可以更方便地创建正方形的 `Rectangle`，而不必将同一个值指定两次：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/no-listing-03-associated-functions/src/main.rs:here}}
```

返回类型和函数体中的 `Self` 关键字是 `impl` 关键字后面出现的类型的别名，在本例中就是 `Rectangle`。

要调用这个关联函数，我们使用 `::` 语法加上结构体名称；`let sq = Rectangle::square(3);` 就是一个例子。这个函数由结构体命名空间限定：`::` 语法既用于关联函数，也用于模块创建的命名空间。我们将在[第 7 章][modules]<!-- ignore -->中讨论模块。

### 多个 `impl` 块

每个结构体允许拥有多个 `impl` 块。例如，示例 5-15 等价于示例 5-16 中的代码，后者将每个方法放在各自的 `impl` 块中。

<Listing number="5-16" caption="使用多个 `impl` 块重写示例 5-15">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-16/src/main.rs:here}}
```

</Listing>

在这里没有理由将这些方法分到多个 `impl` 块中，但这是合法的语法。我们将在第 10 章讨论泛型和 trait 时看到多个 `impl` 块有用的场景。

## 总结

结构体让你可以创建对你的领域有意义的自定义类型。通过使用结构体，你可以将相关联的数据片段彼此连接起来，并为每个片段命名以使代码更加清晰。在 `impl` 块中，你可以定义与类型相关联的函数，而方法是一种让你指定结构体实例行为的关联函数。

但结构体并不是创建自定义类型的唯一方式：让我们转向 Rust 的枚举特性，为你的工具箱再添一件利器。

[enums]: ch06-00-enums.html
[trait-objects]: ch18-02-trait-objects.md
[public]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword
[modules]: ch07-02-defining-modules-to-control-scope-and-privacy.html
