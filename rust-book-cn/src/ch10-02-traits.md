<!-- Old headings. Do not remove or links may break. -->

<a id="traits-defining-shared-behavior"></a>

## 使用 Trait 定义共同行为

*trait* 定义了某个特定类型所具有的、且能与其他类型共享的功能。我们可以使用 trait 以抽象的方式定义共同行为。我们还可以使用 *trait bounds*（trait 约束）来指定泛型类型可以是任何具有特定行为的类型。

> 注意：trait 类似于其他语言中常被称为*接口*（interfaces）的功能，尽管有一些不同之处。

### 定义 Trait

一个类型的行为由我们能在该类型上调用的方法组成。如果我们能在不同类型上调用相同的方法，那么这些类型就共享了相同的行为。trait 定义是一种将方法签名组合在一起的方式，用于定义实现某种目的所必需的一组行为。

例如，假设我们有多个结构体，它们持有不同种类和数量的文本：`NewsArticle` 结构体持有在某个特定地点发布的新闻报道，而 `SocialPost` 最多可以包含 280 个字符的内容，以及表示它是新帖子、转发还是对另一条帖子的回复的元数据。

我们想要创建一个名为 `aggregator` 的媒体聚合库 crate，它能够显示可能存储在 `NewsArticle` 或 `SocialPost` 实例中的数据摘要。为此，我们需要每个类型提供摘要，我们将通过在实例上调用 `summarize` 方法来请求该摘要。示例 10-12 展示了一个表达此行为的公有 `Summary` trait 的定义。

<Listing number="10-12" file-name="src/lib.rs" caption="一个由 `summarize` 方法提供行为的 `Summary` trait">

```rust,noplayground
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-12/src/lib.rs}}
```

</Listing>

这里，我们使用 `trait` 关键字和 trait 的名称来声明一个 trait，在本例中是 `Summary`。我们还将该 trait 声明为 `pub`，这样依赖于本 crate 的其他 crate 也能使用这个 trait，我们将在后面的示例中看到这一点。在花括号内，我们声明了实现此 trait 的类型所需的方法签名，在本例中是 `fn summarize(&self) -> String`。

在方法签名之后，我们使用分号而不是在花括号中提供实现。实现此 trait 的每个类型都必须为方法体提供自己的自定义行为。编译器会确保任何具有 `Summary` trait 的类型都将拥有与此签名完全一致的 `summarize` 方法。

一个 trait 的体中可以有多个方法：方法签名每行列出一个，每行以分号结尾。

### 为类型实现 Trait

现在我们已经定义了 `Summary` trait 方法的期望签名，接下来可以在媒体聚合器中的类型上实现它了。示例 10-13 展示了在 `NewsArticle` 结构体上实现 `Summary` trait 的代码，它使用标题、作者和位置来创建 `summarize` 的返回值。对于 `SocialPost` 结构体，我们将 `summarize` 定义为用户名后跟帖子的全部文本，并假设帖子内容已经限制在 280 个字符以内。

<Listing number="10-13" file-name="src/lib.rs" caption="在 `NewsArticle` 和 `SocialPost` 类型上实现 `Summary` trait">

```rust,noplayground
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-13/src/lib.rs:here}}
```

</Listing>

在类型上实现 trait 类似于实现常规方法。不同之处在于，在 `impl` 之后，我们放置想要实现的 trait 名称，然后使用 `for` 关键字，再指定要为其实现 trait 的类型名称。在 `impl` 块内，我们放入 trait 定义中的方法签名。我们不再在每个签名后加分号，而是使用花括号并在方法体中填入我们希望该 trait 的方法在特定类型上具有的具体行为。

现在库已经在 `NewsArticle` 和 `SocialPost` 上实现了 `Summary` trait，crate 的用户可以像调用常规方法一样在 `NewsArticle` 和 `SocialPost` 的实例上调用 trait 方法。唯一的区别是，用户必须将 trait 和类型一起引入作用域。下面是一个二进制 crate 如何使用我们的 `aggregator` 库 crate 的示例：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-01-calling-trait-method/src/main.rs}}
```

这段代码会打印 `1 new post: horse_ebooks: of course, as you probably already know, people`。

依赖于 `aggregator` crate 的其他 crate 也可以将 `Summary` trait 引入作用域，以便在它们自己的类型上实现 `Summary`。需要注意的一个限制是，只有当 trait 或类型（或两者）属于本地 crate 时，我们才能为类型实现 trait。例如，我们可以在 `aggregator` crate 中为自定义类型 `SocialPost` 实现标准库的 `Display` trait，因为类型 `SocialPost` 是 `aggregator` crate 的本地类型。我们也可以在 `aggregator` crate 中为 `Vec<T>` 实现 `Summary`，因为 trait `Summary` 是 `aggregator` crate 的本地 trait。

但是我们不能为外部类型实现外部 trait。例如，我们不能在 `aggregator` crate 中为 `Vec<T>` 实现 `Display` trait，因为 `Display` 和 `Vec<T>` 都定义在标准库中，不属于我们的 `aggregator` crate。这个限制是一种被称为*一致性*（coherence）的属性的一部分，更具体地说是*孤儿规则*（orphan rule），之所以这样命名是因为父类型不存在。这条规则确保了其他人的代码不会破坏你的代码，反之亦然。如果没有这条规则，两个 crate 可以为同一类型实现同一 trait，Rust 就不知道该使用哪个实现了。

<!-- Old headings. Do not remove or links may break. -->

<a id="default-implementations"></a>

### 使用默认实现

有时为 trait 中的某些或所有方法提供默认行为是很有用的，而不是要求每个类型都实现所有方法。然后，当我们在特定类型上实现 trait 时，可以保留或覆盖每个方法的默认行为。

在示例 10-14 中，我们为 `Summary` trait 的 `summarize` 方法指定了一个默认字符串，而不是像示例 10-12 中那样只定义方法签名。

<Listing number="10-14" file-name="src/lib.rs" caption="定义一个带有 `summarize` 方法默认实现的 `Summary` trait">

```rust,noplayground
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-14/src/lib.rs:here}}
```

</Listing>

要使用默认实现来对 `NewsArticle` 的实例进行摘要，我们指定一个空的 `impl` 块：`impl Summary for NewsArticle {}`。

尽管我们不再直接在 `NewsArticle` 上定义 `summarize` 方法，但我们提供了一个默认实现，并指定 `NewsArticle` 实现了 `Summary` trait。因此，我们仍然可以在 `NewsArticle` 的实例上调用 `summarize` 方法，如下所示：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-02-calling-default-impl/src/main.rs:here}}
```

这段代码会打印 `New article available! (Read more...)`。

创建默认实现并不需要我们修改示例 10-13 中 `SocialPost` 上 `Summary` 的实现。原因是覆盖默认实现的语法与实现没有默认实现的 trait 方法的语法完全相同。

默认实现可以调用同一 trait 中的其他方法，即使那些方法没有默认实现。通过这种方式，trait 可以提供大量有用的功能，而只要求实现者指定其中一小部分。例如，我们可以定义 `Summary` trait，使其拥有一个需要实现的 `summarize_author` 方法，然后定义一个具有默认实现的 `summarize` 方法，该默认实现会调用 `summarize_author` 方法：

```rust,noplayground
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-03-default-impl-calls-other-methods/src/lib.rs:here}}
```

要使用这个版本的 `Summary`，我们只需要在为类型实现 trait 时定义 `summarize_author` 即可：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-03-default-impl-calls-other-methods/src/lib.rs:impl}}
```

在定义了 `summarize_author` 之后，我们可以在 `SocialPost` 结构体的实例上调用 `summarize`，`summarize` 的默认实现会调用我们提供的 `summarize_author` 定义。因为我们已经实现了 `summarize_author`，`Summary` trait 就为我们提供了 `summarize` 方法的行为，而无需我们编写更多代码。效果如下：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-03-default-impl-calls-other-methods/src/main.rs:here}}
```

这段代码会打印 `1 new post: (Read more from @horse_ebooks...)`。

注意，无法从同一方法的覆盖实现中调用该方法的默认实现。

<!-- Old headings. Do not remove or links may break. -->

<a id="traits-as-parameters"></a>

### 将 Trait 作为参数

现在你已经知道如何定义和实现 trait，我们可以探索如何使用 trait 来定义接受多种不同类型的函数。我们将使用在示例 10-13 中为 `NewsArticle` 和 `SocialPost` 类型实现的 `Summary` trait 来定义一个 `notify` 函数，该函数在其 `item` 参数上调用 `summarize` 方法，而 `item` 参数是某个实现了 `Summary` trait 的类型。为此，我们使用 `impl Trait` 语法，如下所示：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-04-traits-as-parameters/src/lib.rs:here}}
```

我们为 `item` 参数指定了 `impl` 关键字和 trait 名称，而不是具体类型。该参数接受任何实现了指定 trait 的类型。在 `notify` 的函数体中，我们可以在 `item` 上调用任何来自 `Summary` trait 的方法，例如 `summarize`。我们可以调用 `notify` 并传入任何 `NewsArticle` 或 `SocialPost` 的实例。如果用其他类型（如 `String` 或 `i32`）调用该函数则无法编译，因为这些类型没有实现 `Summary`。

<!-- Old headings. Do not remove or links may break. -->

<a id="fixing-the-largest-function-with-trait-bounds"></a>

#### Trait Bound 语法

`impl Trait` 语法适用于简单的情况，但它实际上是一种更长形式的语法糖，这种更长的形式被称为 *trait bound*（trait 约束）；它看起来像这样：

```rust,ignore
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

这种更长的形式与前一节中的示例等价，但更加冗长。我们将 trait bound 与泛型类型参数的声明放在一起，位于冒号之后、尖括号之内。

`impl Trait` 语法很方便，在简单情况下使代码更加简洁，而完整的 trait bound 语法则能在其他情况下表达更多的复杂性。例如，我们可以有两个实现了 `Summary` 的参数。使用 `impl Trait` 语法看起来像这样：

```rust,ignore
pub fn notify(item1: &impl Summary, item2: &impl Summary) {
```

如果我们希望此函数允许 `item1` 和 `item2` 具有不同的类型（只要两个类型都实现了 `Summary`），使用 `impl Trait` 是合适的。但如果我们想要强制两个参数具有相同的类型，就必须使用 trait bound，像这样：

```rust,ignore
pub fn notify<T: Summary>(item1: &T, item2: &T) {
```

指定为 `item1` 和 `item2` 参数类型的泛型类型 `T` 约束了该函数，使得作为 `item1` 和 `item2` 参数传入的值的具体类型必须相同。

<!-- Old headings. Do not remove or links may break. -->

<a id="specifying-multiple-trait-bounds-with-the--syntax"></a>

#### 通过 `+` 语法指定多个 Trait Bound

我们还可以指定多个 trait bound。假设我们希望 `notify` 在 `item` 上既能使用显示格式化，又能使用 `summarize`：我们在 `notify` 的定义中指定 `item` 必须同时实现 `Display` 和 `Summary`。我们可以使用 `+` 语法来实现：

```rust,ignore
pub fn notify(item: &(impl Summary + Display)) {
```

`+` 语法同样适用于泛型类型上的 trait bound：

```rust,ignore
pub fn notify<T: Summary + Display>(item: &T) {
```

指定了这两个 trait bound 后，`notify` 的函数体就可以调用 `summarize` 并使用 `` 来格式化 `item` 了。

#### 通过 `where` 从句使 Trait Bound 更清晰

使用过多的 trait bound 也有缺点。每个泛型都有自己的 trait bound，因此有多个泛型类型参数的函数可能会在函数名和参数列表之间包含大量的 trait bound 信息，使得函数签名难以阅读。为此，Rust 提供了另一种语法，允许在函数签名之后的 `where` 从句中指定 trait bound。所以，与其这样写：

```rust,ignore
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {
```

不如使用 `where` 从句，像这样：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-07-where-clause/src/lib.rs:here}}
```

这个函数的签名更加整洁：函数名、参数列表和返回类型紧密相邻，类似于没有大量 trait bound 的函数。

### 返回实现了 Trait 的类型

我们也可以在返回值位置使用 `impl Trait` 语法来返回某个实现了 trait 的类型的值，如下所示：

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-05-returning-impl-trait/src/lib.rs:here}}
```

通过使用 `impl Summary` 作为返回类型，我们指定 `returns_summarizable` 函数返回某个实现了 `Summary` trait 的类型，而无需指明具体类型。在本例中，`returns_summarizable` 返回一个 `SocialPost`，但调用此函数的代码不需要知道这一点。

仅通过 trait 来指定返回类型的能力在闭包和迭代器的上下文中特别有用，我们将在第 13 章中介绍它们。闭包和迭代器创建的类型只有编译器知道，或者类型名非常长。`impl Trait` 语法让你可以简洁地指定一个函数返回某个实现了 `Iterator` trait 的类型，而无需写出很长的类型名。

不过，只有在返回单一类型时才能使用 `impl Trait`。例如，下面这段代码将返回类型指定为 `impl Summary`，但返回的可能是 `NewsArticle` 或 `SocialPost`，这是行不通的：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-06-impl-trait-returns-one-type/src/lib.rs:here}}
```

由于编译器中 `impl Trait` 语法的实现方式的限制，不允许返回 `NewsArticle` 或 `SocialPost` 中的任意一个。我们将在第 18 章的["使用 Trait 对象来抽象不同类型的共同行为"][trait-objects]<!-- ignore -->一节中介绍如何编写具有此行为的函数。

### 使用 Trait Bound 有条件地实现方法

通过在使用泛型类型参数的 `impl` 块中使用 trait bound，我们可以有条件地为实现了指定 trait 的类型实现方法。例如，示例 10-15 中的类型 `Pair<T>` 总是实现 `new` 函数来返回一个新的 `Pair<T>` 实例（回忆一下第 5 章["方法语法"][methods]<!-- ignore -->一节中提到的 `Self` 是 `impl` 块所针对类型的类型别名，在本例中是 `Pair<T>`）。但在下一个 `impl` 块中，`Pair<T>` 只有在其内部类型 `T` 实现了启用比较功能的 `PartialOrd` trait *和*启用打印功能的 `Display` trait 时，才会实现 `cmp_display` 方法。

<Listing number="10-15" file-name="src/lib.rs" caption="根据 trait bound 有条件地在泛型类型上实现方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-15/src/lib.rs}}
```

</Listing>

我们也可以有条件地为实现了另一个 trait 的任何类型实现某个 trait。对满足 trait bound 的任何类型实现 trait 被称为*覆盖实现*（blanket implementations），这在 Rust 标准库中被广泛使用。例如，标准库为任何实现了 `Display` trait 的类型实现了 `ToString` trait。标准库中的 `impl` 块类似于如下代码：

```rust,ignore
impl<T: Display> ToString for T {
    // --snip--
}
```

因为标准库有这个覆盖实现，我们可以在任何实现了 `Display` trait 的类型上调用 `ToString` trait 定义的 `to_string` 方法。例如，我们可以将整数转换为对应的 `String` 值，因为整数实现了 `Display`：

```rust
let s = 3.to_string();
```

覆盖实现出现在 trait 文档的"Implementors"部分中。

trait 和 trait bound 让我们能够使用泛型类型参数来减少重复代码，同时向编译器指明我们希望泛型类型具有特定的行为。编译器随后可以利用 trait bound 信息来检查我们代码中使用的所有具体类型是否提供了正确的行为。在动态类型语言中，如果我们在一个没有定义某方法的类型上调用该方法，会在运行时得到一个错误。但 Rust 将这些错误移到了编译时，迫使我们在代码能够运行之前就修复问题。此外，我们不必编写在运行时检查行为的代码，因为我们已经在编译时进行了检查。这样做在不放弃泛型灵活性的前提下提升了性能。

[trait-objects]: ch18-02-trait-objects.html#using-trait-objects-to-abstract-over-shared-behavior
[methods]: ch05-03-method-syntax.html#method-syntax
