## 高级 trait

我们在第十章的["定义共享行为的 trait"][traits]<!-- ignore --> 部分首次介绍了 trait，但没有讨论更高级的细节。现在你对 Rust 有了更深入的了解，我们可以深入探讨这些细节了。

<!-- Old headings. Do not remove or links may break. -->

<a id="specifying-placeholder-types-in-trait-definitions-with-associated-types"></a>
<a id="associated-types"></a>

### 使用关联类型定义 trait

**关联类型**（associated types）将一个类型占位符与 trait 关联起来，使得 trait 的方法签名中可以使用这些占位符类型。trait 的实现者将为特定实现指定占位符类型所对应的具体类型。这样，我们就可以定义一个使用某些类型的 trait，而无需在实现该 trait 之前确切知道这些类型是什么。

我们已经将本章中的大多数高级特性描述为很少需要的。关联类型介于两者之间：它们的使用频率低于本书其余部分介绍的特性，但高于本章讨论的许多其他特性。

一个带有关联类型的 trait 的例子是标准库提供的 `Iterator` trait。其关联类型名为 `Item`，代表实现 `Iterator` trait 的类型所迭代的值的类型。`Iterator` trait 的定义如示例 20-13 所示。

<Listing number="20-13" caption="`Iterator` trait 的定义，它有一个关联类型 `Item`">

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-13/src/lib.rs}}
```

</Listing>

`Item` 类型是一个占位符，`next` 方法的定义表明它将返回 `Option<Self::Item>` 类型的值。`Iterator` trait 的实现者将为 `Item` 指定具体类型，而 `next` 方法将返回一个包含该具体类型值的 `Option`。

关联类型可能看起来与泛型（generics）概念类似，后者也允许我们定义一个函数而不指定它能处理的类型。为了理解这两个概念之间的区别，我们来看一个在名为 `Counter` 的类型上实现 `Iterator` trait 的例子，其中指定 `Item` 类型为 `u32`：

<Listing file-name="src/lib.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-22-iterator-on-counter/src/lib.rs:ch19}}
```

</Listing>

这种语法看起来与泛型类似。那么，为什么不直接用泛型来定义 `Iterator` trait 呢？如示例 20-14 所示。

<Listing number="20-14" caption="一个使用泛型的 `Iterator` trait 假想定义">

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-14/src/lib.rs}}
```

</Listing>

区别在于，当使用泛型时（如示例 20-14），我们必须在每个实现中标注类型；因为我们也可以实现 `Iterator<String> for Counter` 或任何其他类型，所以可以为 `Counter` 提供多个 `Iterator` 的实现。换句话说，当一个 trait 有泛型参数时，可以为一个类型多次实现该 trait，每次改变泛型类型参数的具体类型。当我们在 `Counter` 上使用 `next` 方法时，就必须提供类型注解来指明我们想使用哪个 `Iterator` 实现。

而使用关联类型时，我们不需要标注类型，因为不能为一个类型多次实现同一个 trait。在示例 20-13 中使用关联类型的定义里，我们只能选择一次 `Item` 的类型，因为只能有一个 `impl Iterator for Counter`。我们不必在每次调用 `Counter` 的 `next` 方法时都指定我们想要一个 `u32` 值的迭代器。

关联类型也成为 trait 契约的一部分：trait 的实现者必须提供一个类型来替代关联类型占位符。关联类型通常有一个描述该类型用途的名称，在 API 文档中记录关联类型是一个好的实践。

<!-- Old headings. Do not remove or links may break. -->

<a id="default-generic-type-parameters-and-operator-overloading"></a>

### 默认泛型类型参数和运算符重载

当我们使用泛型类型参数时，可以为泛型类型指定一个默认的具体类型。这样，如果默认类型可用，trait 的实现者就无需指定具体类型。声明泛型类型时，使用 `<PlaceholderType=ConcreteType>` 语法来指定默认类型。

这种技术非常有用的一个典型场景是**运算符重载**（operator overloading），即在特定情况下自定义运算符（如 `+`）的行为。

Rust 不允许你创建自己的运算符或重载任意运算符。但你可以通过实现 `std::ops` 中列出的运算符对应的 trait 来重载这些运算和相应的 trait。例如，在示例 20-15 中，我们重载了 `+` 运算符来将两个 `Point` 实例相加。我们通过在 `Point` 结构体上实现 `Add` trait 来做到这一点。

<Listing number="20-15" file-name="src/main.rs" caption="实现 `Add` trait 来重载 `Point` 实例的 `+` 运算符">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-15/src/main.rs}}
```

</Listing>

`add` 方法将两个 `Point` 实例的 `x` 值和 `y` 值分别相加，创建一个新的 `Point`。`Add` trait 有一个名为 `Output` 的关联类型，用于确定 `add` 方法的返回类型。

这段代码中的默认泛型类型位于 `Add` trait 内。以下是它的定义：

```rust
trait Add<Rhs=Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

这段代码看起来应该很熟悉：一个带有一个方法和一个关联类型的 trait。新的部分是 `Rhs=Self`：这种语法称为**默认类型参数**（default type parameters）。`Rhs` 泛型类型参数（"right-hand side" 的缩写，即"右侧"）定义了 `add` 方法中 `rhs` 参数的类型。如果我们在实现 `Add` trait 时没有为 `Rhs` 指定具体类型，`Rhs` 的类型将默认为 `Self`，也就是我们正在实现 `Add` 的那个类型。

当我们为 `Point` 实现 `Add` 时，使用了 `Rhs` 的默认值，因为我们想要将两个 `Point` 实例相加。让我们来看一个实现 `Add` trait 时自定义 `Rhs` 类型而不使用默认值的例子。

我们有两个结构体 `Millimeters` 和 `Meters`，分别持有不同单位的值。这种将已有类型薄薄地包装在另一个结构体中的做法被称为**新类型模式**（newtype pattern），我们将在["使用新类型模式实现外部 trait"][newtype]<!-- ignore --> 部分更详细地介绍。我们想要将毫米值与米值相加，并让 `Add` 的实现正确地进行转换。我们可以为 `Millimeters` 实现 `Add`，并将 `Meters` 作为 `Rhs`，如示例 20-16 所示。

<Listing number="20-16" file-name="src/lib.rs" caption="在 `Millimeters` 上实现 `Add` trait，以便将 `Millimeters` 和 `Meters` 相加">

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-16/src/lib.rs}}
```

</Listing>

为了将 `Millimeters` 和 `Meters` 相加，我们指定 `impl Add<Meters>` 来设置 `Rhs` 类型参数的值，而不是使用默认的 `Self`。

默认类型参数主要用于两种场景：

1. 在不破坏现有代码的情况下扩展类型
2. 允许在大多数用户不需要的特定场景中进行自定义

标准库的 `Add` trait 就是第二种用途的例子：通常你会将两个相同类型的值相加，但 `Add` trait 提供了超越这一点的自定义能力。在 `Add` trait 定义中使用默认类型参数意味着大多数时候你不需要指定额外的参数。换句话说，省去了一些实现样板代码，使得使用该 trait 更加方便。

第一种用途与第二种类似，但方向相反：如果你想为现有 trait 添加一个类型参数，可以给它一个默认值，这样就能在不破坏现有实现代码的情况下扩展 trait 的功能。

<!-- Old headings. Do not remove or links may break. -->

<a id="fully-qualified-syntax-for-disambiguation-calling-methods-with-the-same-name"></a>
<a id="disambiguating-between-methods-with-the-same-name"></a>

### 消除同名方法的歧义

Rust 并不阻止一个 trait 拥有与另一个 trait 同名的方法，也不阻止你在同一个类型上实现这两个 trait。甚至可以直接在类型上实现一个与 trait 方法同名的方法。

当调用同名方法时，你需要告诉 Rust 你想使用哪一个。考虑示例 20-17 中的代码，我们定义了两个 trait `Pilot` 和 `Wizard`，它们都有一个名为 `fly` 的方法。然后我们在一个已经直接实现了 `fly` 方法的 `Human` 类型上实现了这两个 trait。每个 `fly` 方法做的事情各不相同。

<Listing number="20-17" file-name="src/main.rs" caption="定义了两个拥有 `fly` 方法的 trait 并在 `Human` 类型上实现，同时直接在 `Human` 上也实现了 `fly` 方法">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-17/src/main.rs:here}}
```

</Listing>

当我们在 `Human` 实例上调用 `fly` 时，编译器默认调用直接实现在该类型上的方法，如示例 20-18 所示。

<Listing number="20-18" file-name="src/main.rs" caption="在 `Human` 实例上调用 `fly`">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-18/src/main.rs:here}}
```

</Listing>

运行这段代码会打印出 `*waving arms furiously*`，表明 Rust 调用了直接实现在 `Human` 上的 `fly` 方法。

要调用 `Pilot` trait 或 `Wizard` trait 中的 `fly` 方法，我们需要使用更明确的语法来指定我们想调用哪个 `fly` 方法。示例 20-19 演示了这种语法。

<Listing number="20-19" file-name="src/main.rs" caption="指定我们想调用哪个 trait 的 `fly` 方法">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-19/src/main.rs:here}}
```

</Listing>

在方法名前指定 trait 名称可以向 Rust 明确我们想调用哪个 `fly` 实现。我们也可以写成 `Human::fly(&person)`，这等价于示例 20-19 中使用的 `person.fly()`，只是在不需要消除歧义时写起来更长一些。

运行这段代码会打印以下内容：

```console
{{#include ../listings/ch20-advanced-features/listing-20-19/output.txt}}
```

因为 `fly` 方法接受一个 `self` 参数，如果有两个**类型**都实现了同一个 **trait**，Rust 可以根据 `self` 的类型来判断应该使用哪个 trait 实现。

然而，不是方法的关联函数没有 `self` 参数。当存在多个类型或 trait 定义了同名的非方法函数时，Rust 并不总能知道你指的是哪个类型，除非你使用完全限定语法（fully qualified syntax）。例如，在示例 20-20 中，我们为一个动物收容所创建了一个 trait，希望将所有小狗命名为 Spot。我们创建了一个 `Animal` trait，其中有一个关联的非方法函数 `baby_name`。`Animal` trait 为结构体 `Dog` 实现，同时我们也直接在 `Dog` 上提供了一个关联的非方法函数 `baby_name`。

<Listing number="20-20" file-name="src/main.rs" caption="一个带有关联函数的 trait 和一个拥有同名关联函数并且也实现了该 trait 的类型">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-20/src/main.rs}}
```

</Listing>

我们在定义于 `Dog` 上的 `baby_name` 关联函数中实现了将所有小狗命名为 Spot 的代码。`Dog` 类型还实现了 `Animal` trait，该 trait 描述了所有动物共有的特征。小狗被称为 puppy，这在 `Dog` 上实现的 `Animal` trait 的 `baby_name` 函数中表达。

在 `main` 中，我们调用了 `Dog::baby_name` 函数，它直接调用了定义在 `Dog` 上的关联函数。这段代码打印以下内容：

```console
{{#include ../listings/ch20-advanced-features/listing-20-20/output.txt}}
```

这不是我们想要的输出。我们想调用的是在 `Dog` 上实现的 `Animal` trait 的 `baby_name` 函数，以便代码打印出 `A baby dog is called a puppy`。我们在示例 20-19 中使用的指定 trait 名称的技巧在这里不起作用；如果我们将 `main` 改为示例 20-21 中的代码，会得到一个编译错误。

<Listing number="20-21" file-name="src/main.rs" caption="尝试调用 `Animal` trait 的 `baby_name` 函数，但 Rust 不知道该使用哪个实现">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-21/src/main.rs:here}}
```

</Listing>

因为 `Animal::baby_name` 没有 `self` 参数，而且可能有其他类型也实现了 `Animal` trait，所以 Rust 无法判断我们想要哪个 `Animal::baby_name` 的实现。我们会得到这个编译错误：

```console
{{#include ../listings/ch20-advanced-features/listing-20-21/output.txt}}
```

为了消除歧义并告诉 Rust 我们想使用 `Dog` 的 `Animal` 实现而不是其他类型的 `Animal` 实现，我们需要使用完全限定语法。示例 20-22 演示了如何使用完全限定语法。

<Listing number="20-22" file-name="src/main.rs" caption="使用完全限定语法来指定我们想调用在 `Dog` 上实现的 `Animal` trait 的 `baby_name` 函数">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-22/src/main.rs:here}}
```

</Listing>

我们在尖括号中为 Rust 提供了类型注解，表明我们想调用 `Dog` 类型作为 `Animal` 时的 `baby_name` 方法，也就是说我们希望在这次函数调用中将 `Dog` 类型视为 `Animal`。这段代码现在会打印出我们想要的内容：

```console
{{#include ../listings/ch20-advanced-features/listing-20-22/output.txt}}
```

一般来说，完全限定语法的定义如下：

```rust,ignore
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

对于不是方法的关联函数，不会有 `receiver`：只有其他参数的列表。你可以在调用函数或方法的任何地方使用完全限定语法。不过，Rust 允许你省略程序中其他信息能够推断出的部分。只有在存在多个同名实现且 Rust 需要帮助来识别你想调用哪个实现时，才需要使用这种更冗长的语法。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-supertraits-to-require-one-traits-functionality-within-another-trait"></a>

### 使用 supertrait

有时你可能会编写一个依赖于另一个 trait 的 trait 定义：要让一个类型实现第一个 trait，你希望要求该类型也实现第二个 trait。这样做是为了让你的 trait 定义能够使用第二个 trait 的关联项。你的 trait 定义所依赖的 trait 被称为你的 trait 的 **supertrait**。

例如，假设我们想创建一个 `OutlinePrint` trait，其中有一个 `outline_print` 方法，它会将给定的值格式化后用星号框起来打印。也就是说，给定一个实现了标准库 `Display` trait 并输出 `(x, y)` 的 `Point` 结构体，当我们在一个 `x` 为 `1`、`y` 为 `3` 的 `Point` 实例上调用 `outline_print` 时，它应该打印以下内容：

```text
**********
*        *
* (1, 3) *
*        *
**********
```

在 `outline_print` 方法的实现中，我们想使用 `Display` trait 的功能。因此，我们需要指定 `OutlinePrint` trait 只对同时实现了 `Display` 的类型有效，并提供 `OutlinePrint` 所需的功能。我们可以在 trait 定义中通过指定 `OutlinePrint: Display` 来做到这一点。这种技术类似于为 trait 添加 trait 约束。示例 20-23 展示了 `OutlinePrint` trait 的实现。

<Listing number="20-23" file-name="src/main.rs" caption="实现需要 `Display` 功能的 `OutlinePrint` trait">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-23/src/main.rs:here}}
```

</Listing>

因为我们指定了 `OutlinePrint` 需要 `Display` trait，所以我们可以使用 `to_string` 函数，该函数会为任何实现了 `Display` 的类型自动实现。如果我们尝试在不添加冒号和 `Display` trait 的情况下使用 `to_string`，会得到一个错误，提示在当前作用域中没有为 `&Self` 类型找到名为 `to_string` 的方法。

让我们看看当我们尝试在一个没有实现 `Display` 的类型（如 `Point` 结构体）上实现 `OutlinePrint` 时会发生什么：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-02-impl-outlineprint-for-point/src/main.rs:here}}
```

</Listing>

我们会得到一个错误，提示需要 `Display` 但未实现：

```console
{{#include ../listings/ch20-advanced-features/no-listing-02-impl-outlineprint-for-point/output.txt}}
```

为了修复这个问题，我们在 `Point` 上实现 `Display` 并满足 `OutlinePrint` 所要求的约束，如下所示：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-03-impl-display-for-point/src/main.rs:here}}
```

</Listing>

这样，在 `Point` 上实现 `OutlinePrint` trait 就能成功编译，我们可以在 `Point` 实例上调用 `outline_print` 来将其显示在星号边框中。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-the-newtype-pattern-to-implement-external-traits-on-external-types"></a>
<a id="using-the-newtype-pattern-to-implement-external-traits"></a>

### 使用新类型模式实现外部 trait

在第十章的["在类型上实现 trait"][implementing-a-trait-on-a-type]<!-- ignore --> 部分，我们提到了孤儿规则（orphan rule），它规定只有当 trait 或类型（或两者）属于本地 crate 时，才允许在该类型上实现该 trait。使用新类型模式（newtype pattern）可以绕过这个限制，它涉及在元组结构体中创建一个新类型。（我们在第五章的["使用元组结构体创建不同类型"][tuple-structs]<!-- ignore --> 部分介绍了元组结构体。）这个元组结构体只有一个字段，是我们想要实现 trait 的类型的薄包装。然后，包装类型属于本地 crate，我们就可以在包装类型上实现 trait。*Newtype* 这个术语源自 Haskell 编程语言。使用这种模式没有运行时性能损耗，包装类型在编译时会被消除。

举个例子，假设我们想在 `Vec<T>` 上实现 `Display`，但孤儿规则阻止我们直接这样做，因为 `Display` trait 和 `Vec<T>` 类型都定义在我们的 crate 之外。我们可以创建一个持有 `Vec<T>` 实例的 `Wrapper` 结构体；然后在 `Wrapper` 上实现 `Display` 并使用 `Vec<T>` 的值，如示例 20-24 所示。

<Listing number="20-24" file-name="src/main.rs" caption="创建一个包装 `Vec<String>` 的 `Wrapper` 类型以实现 `Display`">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-24/src/main.rs}}
```

</Listing>

`Display` 的实现使用 `self.0` 来访问内部的 `Vec<T>`，因为 `Wrapper` 是一个元组结构体，而 `Vec<T>` 是元组中索引为 0 的项。然后我们就可以在 `Wrapper` 上使用 `Display` trait 的功能了。

使用这种技术的缺点是 `Wrapper` 是一个新类型，所以它没有其内部值的方法。我们必须直接在 `Wrapper` 上实现 `Vec<T>` 的所有方法，让这些方法委托给 `self.0`，这样就能像对待 `Vec<T>` 一样对待 `Wrapper`。如果我们希望新类型拥有内部类型的所有方法，可以在 `Wrapper` 上实现 `Deref` trait 来返回内部类型（我们在第十五章的["像常规引用一样对待智能指针"][smart-pointer-deref]<!-- ignore --> 部分讨论了实现 `Deref` trait）。如果我们不希望 `Wrapper` 类型拥有内部类型的所有方法——例如，为了限制 `Wrapper` 类型的行为——我们就只需手动实现我们想要的方法。

即使不涉及 trait，这种新类型模式也很有用。让我们转换视角，来看一些与 Rust 类型系统交互的高级方式。

[newtype]: ch20-02-advanced-traits.html#implementing-external-traits-with-the-newtype-pattern
[implementing-a-trait-on-a-type]: ch10-02-traits.html#implementing-a-trait-on-a-type
[traits]: ch10-02-traits.html
[smart-pointer-deref]: ch15-02-deref.html#treating-smart-pointers-like-regular-references
[tuple-structs]: ch05-01-defining-structs.html#creating-different-types-with-tuple-structs
