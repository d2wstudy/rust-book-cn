## 使用生命周期验证引用

生命周期（lifetime）是另一种我们已经在使用的泛型。与确保类型具有我们期望的行为不同，生命周期确保引用在我们需要的时候始终有效。

在第四章["引用与借用"][references-and-borrowing]<!-- ignore -->部分中，有一个细节我们没有讨论：Rust 中的每个引用都有一个生命周期，即该引用保持有效的作用域。大多数时候，生命周期是隐式的、可以被推断的，就像大多数时候类型也是可以被推断的一样。只有当存在多种可能的类型时，我们才需要标注类型。类似地，当引用的生命周期可能以不同方式相互关联时，我们就必须标注生命周期。Rust 要求我们使用泛型生命周期参数来标注这些关系，以确保运行时实际使用的引用一定是有效的。

标注生命周期的概念在大多数其他编程语言中并不存在，所以这会让人感到陌生。虽然本章不会完整地覆盖生命周期的所有内容，但我们会讨论你可能遇到生命周期语法的常见场景，帮助你熟悉这个概念。

<!-- Old headings. Do not remove or links may break. -->

<a id="preventing-dangling-references-with-lifetimes"></a>

### 悬垂引用

生命周期的主要目标是防止悬垂引用（dangling references）。如果允许悬垂引用存在，程序就会引用到并非其预期引用的数据。考虑示例 10-16 中的程序，它有一个外部作用域和一个内部作用域。

<Listing number="10-16" caption="尝试使用一个其值已离开作用域的引用">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-16/src/main.rs}}
```

</Listing>

> 注意：示例 10-16、10-17 和 10-23 中声明了没有初始值的变量，因此变量名存在于外部作用域中。乍一看，这似乎与 Rust 没有空值（null）的设计相矛盾。然而，如果我们尝试在赋值之前使用变量，就会得到一个编译时错误，这说明 Rust 确实不允许空值。

外部作用域声明了一个没有初始值的变量 `r`，内部作用域声明了一个初始值为 `5` 的变量 `x`。在内部作用域中，我们尝试将 `r` 的值设置为 `x` 的引用。然后内部作用域结束，我们尝试打印 `r` 中的值。这段代码无法编译，因为 `r` 所引用的值在我们尝试使用它之前就已经离开了作用域。以下是错误信息：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-16/output.txt}}
```

错误信息指出变量 `x` "存活时间不够长"。原因是当内部作用域在第 7 行结束时，`x` 就离开了作用域。但 `r` 在外部作用域中仍然有效；因为它的作用域更大，我们说它"存活得更久"。如果 Rust 允许这段代码运行，`r` 将会引用 `x` 离开作用域时已被释放的内存，我们对 `r` 做的任何操作都不会正确工作。那么，Rust 是如何判定这段代码无效的呢？它使用了借用检查器。

### 借用检查器

Rust 编译器有一个**借用检查器**（_borrow checker_），它通过比较作用域来判断所有借用是否有效。示例 10-17 展示了与示例 10-16 相同的代码，但添加了变量生命周期的标注。

<Listing number="10-17" caption="对 `r` 和 `x` 的生命周期标注，分别命名为 `'a` 和 `'b`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-17/src/main.rs}}
```

</Listing>

这里，我们用 `'a` 标注了 `r` 的生命周期，用 `'b` 标注了 `x` 的生命周期。如你所见，内部的 `'b` 块比外部的 `'a` 生命周期块小得多。在编译时，Rust 比较两个生命周期的大小，发现 `r` 的生命周期是 `'a`，但它引用的内存的生命周期是 `'b`。程序被拒绝，因为 `'b` 比 `'a` 短：引用的对象存活时间没有引用本身长。

示例 10-18 修复了代码，使其不再有悬垂引用，可以正常编译。

<Listing number="10-18" caption="一个有效的引用，因为数据的生命周期比引用更长">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-18/src/main.rs}}
```

</Listing>

这里，`x` 的生命周期是 `'b`，在这种情况下它比 `'a` 更大。这意味着 `r` 可以引用 `x`，因为 Rust 知道 `r` 中的引用在 `x` 有效期间始终有效。

现在你已经知道了引用的生命周期在哪里，以及 Rust 如何分析生命周期来确保引用始终有效，接下来让我们探讨函数参数和返回值中的泛型生命周期。

### 函数中的泛型生命周期

我们来编写一个返回两个字符串切片中较长者的函数。这个函数接受两个字符串切片并返回一个字符串切片。在实现 `longest` 函数之后，示例 10-19 中的代码应该打印 `The longest string is abcd`。

<Listing number="10-19" file-name="src/main.rs" caption="一个调用 `longest` 函数来查找两个字符串切片中较长者的 `main` 函数">

```rust,ignore
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-19/src/main.rs}}
```

</Listing>

注意我们希望函数接受字符串切片（即引用）而不是字符串，因为我们不希望 `longest` 函数获取其参数的所有权。关于为什么示例 10-19 中使用这些参数的更多讨论，请参阅第四章的["字符串切片作为参数"][string-slices-as-parameters]<!-- ignore -->部分。

如果我们尝试按示例 10-20 所示来实现 `longest` 函数，它将无法编译。

<Listing number="10-20" file-name="src/main.rs" caption="`longest` 函数的一个实现，返回两个字符串切片中较长者，但尚无法编译">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-20/src/main.rs:here}}
```

</Listing>

我们会得到以下关于生命周期的错误：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-20/output.txt}}
```

帮助文本揭示了返回类型需要一个泛型生命周期参数，因为 Rust 无法判断返回的引用指向的是 `x` 还是 `y`。实际上，我们也不知道，因为函数体中的 `if` 块返回 `x` 的引用，而 `else` 块返回 `y` 的引用！

在定义这个函数时，我们不知道传入的具体值，所以不知道 `if` 分支还是 `else` 分支会执行。我们也不知道传入引用的具体生命周期，所以无法像示例 10-17 和 10-18 那样通过查看作用域来判断返回的引用是否始终有效。借用检查器也无法判断，因为它不知道 `x` 和 `y` 的生命周期与返回值的生命周期之间的关系。为了修复这个错误，我们将添加泛型生命周期参数来定义引用之间的关系，以便借用检查器能够进行分析。

### 生命周期标注语法

生命周期标注不会改变任何引用的存活时长。相反，它们描述了多个引用的生命周期之间的关系，而不影响实际的生命周期。正如函数在签名中指定泛型类型参数后可以接受任何类型一样，函数在指定泛型生命周期参数后也可以接受具有任何生命周期的引用。

生命周期标注有一种略微特殊的语法：生命周期参数的名称必须以撇号（`'`）开头，通常全部小写且非常短，就像泛型类型一样。大多数人使用 `'a` 作为第一个生命周期标注的名称。我们将生命周期参数标注放在引用的 `&` 之后，用一个空格将标注与引用的类型分开。

下面是一些例子——一个没有生命周期参数的 `i32` 引用、一个带有名为 `'a` 的生命周期参数的 `i32` 引用，以及一个同样带有生命周期 `'a` 的 `i32` 可变引用：

```rust,ignore
&i32        // a reference
&'a i32     // a reference with an explicit lifetime
&'a mut i32 // a mutable reference with an explicit lifetime
```

单独一个生命周期标注本身没有太大意义，因为标注的目的是告诉 Rust 多个引用的泛型生命周期参数之间如何相互关联。让我们在 `longest` 函数的上下文中看看生命周期标注是如何相互关联的。

<!-- Old headings. Do not remove or links may break. -->

<a id="lifetime-annotations-in-function-signatures"></a>

### 函数签名中的生命周期标注

要在函数签名中使用生命周期标注，需要在函数名和参数列表之间的尖括号内声明泛型生命周期参数，就像声明泛型类型参数一样。

我们希望签名表达以下约束：只要两个参数都有效，返回的引用就有效。这就是参数生命周期和返回值之间的关系。我们将生命周期命名为 `'a`，然后将其添加到每个引用上，如示例 10-21 所示。

<Listing number="10-21" file-name="src/main.rs" caption="`longest` 函数定义，指定签名中所有引用必须具有相同的生命周期 `'a`">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-21/src/main.rs:here}}
```

</Listing>

这段代码应该能够编译，并在与示例 10-19 中的 `main` 函数一起使用时产生我们期望的结果。

函数签名现在告诉 Rust，对于某个生命周期 `'a`，函数接受两个参数，它们都是至少与生命周期 `'a` 存活一样长的字符串切片。函数签名还告诉 Rust，从函数返回的字符串切片将至少与生命周期 `'a` 存活一样长。实际上，这意味着 `longest` 函数返回的引用的生命周期，等于传入参数所引用的值的生命周期中较小的那个。这些关系正是我们希望 Rust 在分析这段代码时使用的。

记住，当我们在函数签名中指定生命周期参数时，我们并没有改变任何传入或返回值的生命周期。相反，我们是在指定借用检查器应该拒绝任何不满足这些约束的值。注意 `longest` 函数不需要确切知道 `x` 和 `y` 会存活多久，只需要知道有某个作用域可以替代 `'a` 来满足这个签名。

在函数中标注生命周期时，标注放在函数签名中，而不是函数体中。生命周期标注成为函数契约的一部分，就像签名中的类型一样。让函数签名包含生命周期契约意味着 Rust 编译器的分析可以更简单。如果函数的标注方式或调用方式有问题，编译器错误可以更精确地指出代码中的问题和约束。相反，如果 Rust 编译器对生命周期关系做更多推断，编译器可能只能指出距离问题根源很远的代码使用处。

当我们向 `longest` 传入具体的引用时，替代 `'a` 的具体生命周期是 `x` 的作用域与 `y` 的作用域重叠的部分。换句话说，泛型生命周期 `'a` 将获得等于 `x` 和 `y` 的生命周期中较小者的具体生命周期。因为我们用相同的生命周期参数 `'a` 标注了返回的引用，所以返回的引用在 `x` 和 `y` 的生命周期中较小者的范围内也是有效的。

让我们看看生命周期标注如何通过传入具有不同具体生命周期的引用来约束 `longest` 函数。示例 10-22 是一个简单的例子。

<Listing number="10-22" file-name="src/main.rs" caption="使用 `longest` 函数处理具有不同具体生命周期的 `String` 值的引用">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-22/src/main.rs:here}}
```

</Listing>

在这个例子中，`string1` 在外部作用域结束前都有效，`string2` 在内部作用域结束前有效，而 `result` 引用的内容在内部作用域结束前有效。运行这段代码，你会看到借用检查器通过了检查；它能编译并打印 `The longest string is long string is long`。

接下来，让我们试一个例子来说明 `result` 中引用的生命周期必须是两个参数中较小的那个生命周期。我们将 `result` 变量的声明移到内部作用域之外，但将赋值留在包含 `string2` 的内部作用域中。然后，我们将使用 `result` 的 `println!` 移到内部作用域之外、内部作用域结束之后。示例 10-23 中的代码将无法编译。

<Listing number="10-23" file-name="src/main.rs" caption="尝试在 `string2` 离开作用域后使用 `result`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-23/src/main.rs:here}}
```

</Listing>

当我们尝试编译这段代码时，会得到以下错误：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-23/output.txt}}
```

错误表明，要使 `result` 在 `println!` 语句中有效，`string2` 需要在外部作用域结束前一直有效。Rust 之所以知道这一点，是因为我们用相同的生命周期参数 `'a` 标注了函数参数和返回值的生命周期。

作为人类，我们可以看出 `string1` 比 `string2` 长，因此 `result` 将包含一个指向 `string1` 的引用。因为 `string1` 还没有离开作用域，所以对 `string1` 的引用在 `println!` 语句中仍然有效。然而，编译器在这种情况下无法看出引用是有效的。我们已经告诉 Rust，`longest` 函数返回的引用的生命周期等于传入引用的生命周期中较小的那个。因此，借用检查器不允许示例 10-23 中的代码，因为它可能包含无效引用。

试着设计更多实验，改变传入 `longest` 函数的引用的值和生命周期，以及返回引用的使用方式。在编译之前，先假设你的实验是否能通过借用检查器；然后检查你的判断是否正确！

<!-- Old headings. Do not remove or links may break. -->

<a id="thinking-in-terms-of-lifetimes"></a>

### 深入理解生命周期

指定生命周期参数的方式取决于函数的具体行为。例如，如果我们将 `longest` 函数的实现改为始终返回第一个参数而不是最长的字符串切片，就不需要为 `y` 参数指定生命周期。以下代码可以编译：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-08-only-one-reference-with-lifetime/src/main.rs:here}}
```

</Listing>

我们为参数 `x` 和返回类型指定了生命周期参数 `'a`，但没有为参数 `y` 指定，因为 `y` 的生命周期与 `x` 或返回值的生命周期没有任何关系。

当从函数返回引用时，返回类型的生命周期参数需要与某个参数的生命周期参数匹配。如果返回的引用**不**指向某个参数，那它必定指向函数内部创建的值。然而，这将是一个悬垂引用，因为该值会在函数结束时离开作用域。考虑以下无法编译的 `longest` 函数实现：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-09-unrelated-lifetime/src/main.rs:here}}
```

</Listing>

这里，即使我们为返回类型指定了生命周期参数 `'a`，这个实现仍然无法编译，因为返回值的生命周期与参数的生命周期完全无关。以下是我们得到的错误信息：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-09-unrelated-lifetime/output.txt}}
```

问题在于 `result` 在 `longest` 函数结束时离开作用域并被清理。我们还试图从函数返回一个指向 `result` 的引用。没有任何方式可以通过指定生命周期参数来改变这个悬垂引用的问题，Rust 也不会允许我们创建悬垂引用。在这种情况下，最好的修复方法是返回一个拥有所有权的数据类型而不是引用，这样调用函数就负责清理该值。

归根结底，生命周期语法就是将函数的各个参数和返回值的生命周期关联起来。一旦它们关联起来，Rust 就有了足够的信息来允许内存安全的操作，并拒绝那些会创建悬垂指针或以其他方式违反内存安全的操作。

<!-- Old headings. Do not remove or links may break. -->

<a id="lifetime-annotations-in-struct-definitions"></a>

### 结构体定义中的生命周期标注

到目前为止，我们定义的结构体都持有拥有所有权的类型。我们也可以定义持有引用的结构体，但在这种情况下，需要为结构体定义中的每个引用添加生命周期标注。示例 10-24 中有一个名为 `ImportantExcerpt` 的结构体，它持有一个字符串切片。

<Listing number="10-24" file-name="src/main.rs" caption="一个持有引用的结构体，需要生命周期标注">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-24/src/main.rs}}
```

</Listing>

这个结构体有一个名为 `part` 的字段，它持有一个字符串切片，即一个引用。与泛型数据类型一样，我们在结构体名称后的尖括号内声明泛型生命周期参数的名称，以便在结构体定义的主体中使用该生命周期参数。这个标注意味着 `ImportantExcerpt` 的实例不能比它在 `part` 字段中持有的引用存活得更久。

这里的 `main` 函数创建了一个 `ImportantExcerpt` 结构体的实例，它持有变量 `novel` 所拥有的 `String` 的第一个句子的引用。`novel` 中的数据在 `ImportantExcerpt` 实例创建之前就已经存在。此外，`novel` 在 `ImportantExcerpt` 离开作用域之后才离开作用域，所以 `ImportantExcerpt` 实例中的引用是有效的。

### 生命周期省略

你已经了解到每个引用都有一个生命周期，并且需要为使用引用的函数或结构体指定生命周期参数。然而，我们在示例 4-9 中有一个函数（在示例 10-25 中再次展示），它在没有生命周期标注的情况下也能编译。

<Listing number="10-25" file-name="src/lib.rs" caption="我们在示例 4-9 中定义的函数，即使参数和返回类型都是引用，也能在没有生命周期标注的情况下编译">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-25/src/main.rs:here}}
```

</Listing>

这个函数能在没有生命周期标注的情况下编译，这是有历史原因的：在 Rust 的早期版本（1.0 之前），这段代码无法编译，因为每个引用都需要显式的生命周期。那时，函数签名需要写成这样：

```rust,ignore
fn first_word<'a>(s: &'a str) -> &'a str {
```

在编写了大量 Rust 代码之后，Rust 团队发现 Rust 程序员在特定情况下总是反复输入相同的生命周期标注。这些情况是可预测的，并且遵循几种确定性的模式。开发者将这些模式编入了编译器的代码中，这样借用检查器就能在这些情况下推断生命周期，而不需要显式标注。

提到这段 Rust 历史是有意义的，因为未来可能会发现更多确定性的模式并将其添加到编译器中。将来，可能需要的生命周期标注会更少。

编入 Rust 引用分析中的这些模式被称为**生命周期省略规则**（_lifetime elision rules_）。这些不是程序员需要遵循的规则；它们是编译器会考虑的一组特定情况，如果你的代码符合这些情况，就不需要显式编写生命周期。

省略规则并不提供完整的推断。如果在 Rust 应用规则之后，引用的生命周期仍然存在歧义，编译器不会猜测剩余引用的生命周期应该是什么。编译器会给出一个错误，你可以通过添加生命周期标注来解决。

函数或方法参数上的生命周期被称为**输入生命周期**（_input lifetimes_），返回值上的生命周期被称为**输出生命周期**（_output lifetimes_）。

编译器使用三条规则来推断没有显式标注时引用的生命周期。第一条规则适用于输入生命周期，第二条和第三条规则适用于输出生命周期。如果编译器应用完三条规则后仍有无法确定生命周期的引用，编译器将报错。这些规则适用于 `fn` 定义和 `impl` 块。

第一条规则是，编译器为每个引用类型的参数分配一个生命周期参数。换句话说，有一个参数的函数获得一个生命周期参数：`fn foo<'a>(x: &'a i32)`；有两个参数的函数获得两个独立的生命周期参数：`fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`；以此类推。

第二条规则是，如果只有一个输入生命周期参数，那么该生命周期会被赋给所有输出生命周期参数：`fn foo<'a>(x: &'a i32) -> &'a i32`。

第三条规则是，如果有多个输入生命周期参数，但其中一个是 `&self` 或 `&mut self`（因为这是一个方法），那么 `self` 的生命周期会被赋给所有输出生命周期参数。第三条规则使得方法的读写更加简洁，因为需要的符号更少。

让我们假装自己是编译器。我们将应用这些规则来推断示例 10-25 中 `first_word` 函数签名中引用的生命周期。签名一开始没有任何与引用关联的生命周期：

```rust,ignore
fn first_word(s: &str) -> &str {
```

然后编译器应用第一条规则，即每个参数获得自己的生命周期。我们像往常一样称之为 `'a`，现在签名变成了：

```rust,ignore
fn first_word<'a>(s: &'a str) -> &str {
```

第二条规则适用，因为只有一个输入生命周期。第二条规则指定将唯一输入参数的生命周期赋给输出生命周期，所以签名现在变成了：

```rust,ignore
fn first_word<'a>(s: &'a str) -> &'a str {
```

现在这个函数签名中的所有引用都有了生命周期，编译器可以继续分析，而不需要程序员标注这个函数签名中的生命周期。

让我们再看另一个例子，这次使用我们在示例 10-20 中开始处理时没有生命周期参数的 `longest` 函数：

```rust,ignore
fn longest(x: &str, y: &str) -> &str {
```

应用第一条规则：每个参数获得自己的生命周期。这次我们有两个参数而不是一个，所以有两个生命周期：

```rust,ignore
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {
```

可以看到第二条规则不适用，因为有多个输入生命周期。第三条规则也不适用，因为 `longest` 是一个函数而不是方法，所以没有参数是 `self`。在应用完所有三条规则之后，我们仍然没有确定返回类型的生命周期。这就是为什么我们在尝试编译示例 10-20 中的代码时会得到错误：编译器应用了生命周期省略规则，但仍然无法确定签名中所有引用的生命周期。

因为第三条规则实际上只适用于方法签名，接下来我们将在方法的上下文中讨论生命周期，看看为什么第三条规则意味着我们通常不需要在方法签名中标注生命周期。

<!-- Old headings. Do not remove or links may break. -->

<a id="lifetime-annotations-in-method-definitions"></a>

### 方法定义中的生命周期标注

当我们在带有生命周期的结构体上实现方法时，使用的语法与示例 10-11 中泛型类型参数的语法相同。声明和使用生命周期参数的位置取决于它们是与结构体字段相关还是与方法参数和返回值相关。

结构体字段的生命周期名称总是需要在 `impl` 关键字之后声明，然后在结构体名称之后使用，因为这些生命周期是结构体类型的一部分。

在 `impl` 块内的方法签名中，引用可能与结构体字段中引用的生命周期绑定，也可能是独立的。此外，生命周期省略规则通常使得方法签名中不需要生命周期标注。让我们看一些使用示例 10-24 中定义的 `ImportantExcerpt` 结构体的例子。

首先，我们使用一个名为 `level` 的方法，它唯一的参数是 `self` 的引用，返回值是 `i32`，不是任何东西的引用：

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-10-lifetimes-on-methods/src/main.rs:1st}}
```

`impl` 之后的生命周期参数声明和类型名称之后的使用是必需的，但由于第一条省略规则，我们不需要标注 `self` 引用的生命周期。

下面是第三条生命周期省略规则适用的例子：

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-10-lifetimes-on-methods/src/main.rs:3rd}}
```

这里有两个输入生命周期，所以 Rust 应用第一条生命周期省略规则，给 `&self` 和 `announcement` 各自分配生命周期。然后，因为其中一个参数是 `&self`，返回类型获得 `&self` 的生命周期，所有生命周期都已确定。

### 静态生命周期

有一个特殊的生命周期需要讨论：`'static`，它表示受影响的引用**可以**在程序的整个运行期间存活。所有字符串字面值都具有 `'static` 生命周期，我们可以这样标注：

```rust
let s: &'static str = "I have a static lifetime.";
```

这个字符串的文本直接存储在程序的二进制文件中，而二进制文件始终可用。因此，所有字符串字面值的生命周期都是 `'static`。

你可能会在错误信息中看到使用 `'static` 生命周期的建议。但在为引用指定 `'static` 生命周期之前，请想一想你的引用是否真的在程序的整个生命周期内都存活，以及你是否希望如此。大多数时候，建议使用 `'static` 生命周期的错误信息是由于尝试创建悬垂引用或可用生命周期不匹配导致的。在这种情况下，解决方案是修复这些问题，而不是指定 `'static` 生命周期。

<!-- Old headings. Do not remove or links may break. -->

<a id="generic-type-parameters-trait-bounds-and-lifetimes-together"></a>

## 泛型类型参数、trait 约束和生命周期

让我们简要看一下在同一个函数中同时指定泛型类型参数、trait 约束和生命周期的语法！

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/no-listing-11-generics-traits-and-lifetimes/src/main.rs:here}}
```

这是示例 10-21 中返回两个字符串切片中较长者的 `longest` 函数。但现在它多了一个名为 `ann` 的参数，其泛型类型为 `T`，可以填入任何实现了 `Display` trait 的类型（由 `where` 子句指定）。这个额外的参数将使用 `{}` 打印，因此需要 `Display` trait 约束。因为生命周期是一种泛型，所以生命周期参数 `'a` 和泛型类型参数 `T` 放在函数名后面的同一个尖括号列表中。

## 总结

本章涵盖了很多内容！现在你已经了解了泛型类型参数、trait 和 trait 约束，以及泛型生命周期参数，你已经准备好编写在许多不同场景下都能工作且没有重复的代码了。泛型类型参数让你可以将代码应用于不同的类型。trait 和 trait 约束确保即使类型是泛型的，它们也具有代码所需的行为。你学会了如何使用生命周期标注来确保这些灵活的代码不会产生任何悬垂引用。而所有这些分析都发生在编译时，不会影响运行时性能！

信不信由你，本章讨论的主题还有更多内容可以学习：第十八章讨论 trait 对象，这是使用 trait 的另一种方式。还有一些更复杂的涉及生命周期标注的场景，你只会在非常高级的情况下才需要用到；关于这些内容，你应该阅读 [Rust 参考手册][reference]。接下来，你将学习如何在 Rust 中编写测试，以确保你的代码按预期工作。

[references-and-borrowing]: ch04-02-references-and-borrowing.html#references-and-borrowing
[string-slices-as-parameters]: ch04-03-slices.html#string-slices-as-parameters
[reference]: ../reference/trait-bounds.html
