## 一个使用结构体的示例程序

为了理解何时需要使用结构体，让我们编写一个计算长方形面积的程序。我们将从使用单独的变量开始，然后逐步重构程序，直到使用结构体为止。

让我们用 Cargo 创建一个名为 _rectangles_ 的新二进制项目，它将接收以像素为单位的长方形宽度和高度，并计算长方形的面积。示例 5-8 展示了在项目的 _src/main.rs_ 中实现这一功能的一种简短方式。

<Listing number="5-8" file-name="src/main.rs" caption="通过分别指定宽度和高度变量来计算长方形的面积">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-08/src/main.rs:all}}
```

</Listing>

现在，使用 `cargo run` 运行这个程序：

```console
{{#include ../listings/ch05-using-structs-to-structure-related-data/listing-05-08/output.txt}}
```

这段代码通过对每个维度调用 `area` 函数成功计算出了长方形的面积，但我们还可以做得更好，让代码更加清晰和可读。

这段代码的问题在 `area` 的签名中显而易见：

```rust,ignore
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-08/src/main.rs:here}}
```

`area` 函数本应计算一个长方形的面积，但我们编写的函数有两个参数，而且程序中没有任何地方表明这两个参数是相关联的。将宽度和高度组合在一起会更具可读性，也更易于管理。我们已经在第 3 章的["元组类型"][the-tuple-type]<!-- ignore -->部分讨论过一种实现方式：使用元组。

### 使用元组进行重构

示例 5-9 展示了使用元组的另一个版本。

<Listing number="5-9" file-name="src/main.rs" caption="使用元组来指定长方形的宽度和高度">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-09/src/main.rs}}
```

</Listing>

从某种程度上说，这个程序更好了。元组让我们增加了一些结构性，而且现在只需传递一个参数。但从另一方面来说，这个版本却不够清晰：元组不会为其元素命名，所以我们必须通过索引来访问元组的各个部分，这使得计算过程不够直观。

混淆宽度和高度对于面积计算来说无关紧要，但如果我们想在屏幕上绘制长方形，那就很重要了！我们必须记住 `width` 是元组索引 `0`，而 `height` 是元组索引 `1`。如果其他人使用我们的代码，他们更难弄清楚并记住这一点。因为我们没有在代码中传达数据的含义，所以现在更容易引入错误。

<!-- Old headings. Do not remove or links may break. -->

<a id="refactoring-with-structs-adding-more-meaning"></a>

### 使用结构体进行重构

我们使用结构体通过标注数据来增加含义。我们可以将正在使用的元组转换为一个结构体，为整体和各个部分都赋予名称，如示例 5-10 所示。

<Listing number="5-10" file-name="src/main.rs" caption="定义 `Rectangle` 结构体">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-10/src/main.rs}}
```

</Listing>

这里我们定义了一个结构体并命名为 `Rectangle`。在花括号内，我们将字段定义为 `width` 和 `height`，它们的类型都是 `u32`。然后，在 `main` 中，我们创建了一个宽度为 `30`、高度为 `50` 的 `Rectangle` 特定实例。

我们的 `area` 函数现在只有一个参数，我们将其命名为 `rectangle`，其类型是 `Rectangle` 结构体实例的不可变借用。正如第 4 章所提到的，我们希望借用结构体而不是获取其所有权。这样，`main` 就保留了所有权，可以继续使用 `rect1`，这也是我们在函数签名和调用函数时使用 `&` 的原因。

`area` 函数访问 `Rectangle` 实例的 `width` 和 `height` 字段（注意，访问借用的结构体实例的字段不会移动字段值，这就是你经常看到结构体借用的原因）。现在 `area` 的函数签名准确地表达了我们的意图：使用 `Rectangle` 的 `width` 和 `height` 字段来计算其面积。这传达了宽度和高度是相互关联的，并为这些值提供了描述性的名称，而不是使用元组的索引值 `0` 和 `1`。这在清晰度上是一个胜利。

<!-- Old headings. Do not remove or links may break. -->

<a id="adding-useful-functionality-with-derived-traits"></a>

### 通过派生 trait 增加功能

在调试程序时，如果能打印 `Rectangle` 的实例并查看其所有字段的值，那将非常有用。示例 5-11 尝试像前面章节中那样使用 [`println!` 宏][println]<!-- ignore -->。但这行不通。

<Listing number="5-11" file-name="src/main.rs" caption="尝试打印 `Rectangle` 实例">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-11/src/main.rs}}
```

</Listing>

编译这段代码时，我们会得到一个错误，其核心信息如下：

```text
{{#include ../listings/ch05-using-structs-to-structure-related-data/listing-05-11/output.txt:3}}
```

`println!` 宏可以执行多种格式化操作，默认情况下，花括号告诉 `println!` 使用名为 `Display` 的格式化方式：面向最终用户的直接输出。我们之前见过的基本类型默认都实现了 `Display`，因为向用户展示 `1` 或其他基本类型只有一种方式。但对于结构体，`println!` 应该如何格式化输出就不那么明确了，因为有更多的显示可能性：要不要逗号？要不要打印花括号？是否应该显示所有字段？由于这种歧义性，Rust 不会尝试猜测我们的意图，结构体也没有提供 `Display` 的实现来配合 `println!` 和 `{}` 占位符使用。

如果我们继续阅读错误信息，会发现这条有用的提示：

```text
{{#include ../listings/ch05-using-structs-to-structure-related-data/listing-05-11/output.txt:9:10}}
```

让我们试试看！现在 `println!` 宏调用将变为 `println!("rect1 is {rect1:?}");`。在花括号内放置 `:?` 说明符会告诉 `println!` 我们想要使用名为 `Debug` 的输出格式。`Debug` trait 使我们能够以对开发者有用的方式打印结构体，以便在调试代码时查看其值。

使用这个更改编译代码。糟糕！我们仍然得到一个错误：

```text
{{#include ../listings/ch05-using-structs-to-structure-related-data/output-only-01-debug/output.txt:3}}
```

不过，编译器再次给了我们一条有用的提示：

```text
{{#include ../listings/ch05-using-structs-to-structure-related-data/output-only-01-debug/output.txt:9:10}}
```

Rust 确实包含了打印调试信息的功能，但我们必须显式地选择启用，才能让结构体使用该功能。为此，我们在结构体定义之前添加外部属性 `#[derive(Debug)]`，如示例 5-12 所示。

<Listing number="5-12" file-name="src/main.rs" caption="添加属性以派生 `Debug` trait，并使用调试格式打印 `Rectangle` 实例">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-12/src/main.rs}}
```

</Listing>

现在运行程序，不会再有任何错误，我们将看到如下输出：

```console
{{#include ../listings/ch05-using-structs-to-structure-related-data/listing-05-12/output.txt}}
```

不错！虽然输出不是最漂亮的，但它显示了该实例所有字段的值，这在调试时绝对有帮助。当我们有更大的结构体时，拥有更易读的输出会很有用；在这种情况下，我们可以在 `println!` 字符串中使用 `{:#?}` 而不是 `{:?}`。在本例中，使用 `{:#?}` 风格将输出如下内容：

```console
{{#include ../listings/ch05-using-structs-to-structure-related-data/output-only-02-pretty-debug/output.txt}}
```

另一种使用 `Debug` 格式打印值的方式是使用 [`dbg!` 宏][dbg]<!-- ignore -->，它会获取表达式的所有权（与 `println!` 接收引用不同），打印 `dbg!` 宏调用在代码中所在的文件名和行号以及该表达式的结果值，并返回该值的所有权。

> 注意：调用 `dbg!` 宏会打印到标准错误控制台流（`stderr`），而 `println!` 则打印到标准输出控制台流（`stdout`）。我们将在[第 12 章的"将错误信息重定向到标准错误"部分][err]<!-- ignore -->中详细讨论 `stderr` 和 `stdout`。

下面是一个示例，我们对赋给 `width` 字段的值以及 `rect1` 中整个结构体的值感兴趣：

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/no-listing-05-dbg-macro/src/main.rs}}
```

我们可以将 `dbg!` 包裹在表达式 `30 * scale` 周围，因为 `dbg!` 会返回表达式值的所有权，所以 `width` 字段将获得与没有 `dbg!` 调用时相同的值。我们不希望 `dbg!` 获取 `rect1` 的所有权，所以在下一次调用中使用了 `rect1` 的引用。下面是这个示例的输出：

```console
{{#include ../listings/ch05-using-structs-to-structure-related-data/no-listing-05-dbg-macro/output.txt}}
```

我们可以看到，第一部分输出来自 _src/main.rs_ 第 10 行，我们在那里调试表达式 `30 * scale`，其结果值为 `60`（为整数实现的 `Debug` 格式化只打印它们的值）。_src/main.rs_ 第 14 行的 `dbg!` 调用输出了 `&rect1` 的值，即 `Rectangle` 结构体。这个输出使用了 `Rectangle` 类型的美化 `Debug` 格式。当你试图弄清楚代码在做什么时，`dbg!` 宏会非常有帮助！

除了 `Debug` trait 之外，Rust 还提供了许多可以通过 `derive` 属性使用的 trait，它们能为我们的自定义类型添加有用的行为。这些 trait 及其行为列在[附录 C][app-c]<!-- ignore --> 中。我们将在第 10 章介绍如何通过自定义行为来实现这些 trait，以及如何创建你自己的 trait。除了 `derive` 之外还有许多其他属性；更多信息请参阅 [Rust 参考手册的"属性"部分][attributes]。

我们的 `area` 函数非常专一：它只计算长方形的面积。如果能将这个行为更紧密地与 `Rectangle` 结构体关联起来会很有帮助，因为它不适用于任何其他类型。让我们看看如何继续重构这段代码，将 `area` 函数转变为定义在 `Rectangle` 类型上的 `area` 方法。

[the-tuple-type]: ch03-02-data-types.html#the-tuple-type
[app-c]: appendix-03-derivable-traits.md
[println]: ../std/macro.println.html
[dbg]: ../std/macro.dbg.html
[err]: ch12-06-writing-to-stderr-instead-of-stdout.html
[attributes]: ../reference/attributes.html
