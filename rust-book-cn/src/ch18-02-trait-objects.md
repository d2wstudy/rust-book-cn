<!-- Old headings. Do not remove or links may break. -->

<a id="using-trait-objects-that-allow-for-values-of-different-types"></a>

## 使用 trait 对象来抽象共同行为

在第 8 章中，我们提到过 vector 的一个限制是它只能存储同一种类型的元素。我们在示例 8-9 中创建了一个变通方案，定义了一个 `SpreadsheetCell` 枚举，其变体可以持有整数、浮点数和文本。这意味着我们可以在每个单元格中存储不同类型的数据，同时仍然拥有一个代表一行单元格的 vector。当我们在编译时就知道可互换的项是一组固定类型时，这是一个非常好的解决方案。

然而，有时我们希望库的用户能够扩展在特定场景下有效的类型集合。为了展示如何实现这一点，我们将创建一个示例图形用户界面（GUI）工具，它遍历一个项目列表，对每个项目调用 `draw` 方法将其绘制到屏幕上——这是 GUI 工具的常见技术。我们将创建一个名为 `gui` 的库 crate，其中包含一个 GUI 库的结构。这个 crate 可能包含一些供人们使用的类型，例如 `Button` 或 `TextField`。此外，`gui` 的用户还希望创建自己的可绘制类型：例如，一个程序员可能会添加 `Image`，另一个可能会添加 `SelectBox`。

在编写这个库时，我们无法知道和定义其他程序员可能想要创建的所有类型。但我们知道 `gui` 需要跟踪许多不同类型的值，并且需要对每个不同类型的值调用 `draw` 方法。它不需要确切知道调用 `draw` 方法时会发生什么，只需要知道该值有这个方法可供调用。

在有继承的语言中，我们可能会定义一个名为 `Component` 的类，其上有一个名为 `draw` 的方法。其他类，如 `Button`、`Image` 和 `SelectBox`，会继承 `Component` 从而继承 `draw` 方法。它们可以各自重写 `draw` 方法来定义自己的自定义行为，但框架可以将所有类型视为 `Component` 实例并对它们调用 `draw`。但由于 Rust 没有继承，我们需要另一种方式来组织 `gui` 库，以允许用户创建与库兼容的新类型。

### 定义共同行为的 trait

为了实现我们希望 `gui` 具有的行为，我们将定义一个名为 `Draw` 的 trait，其中有一个名为 `draw` 的方法。然后，我们可以定义一个接受 trait 对象的 vector。**trait 对象**（trait object）同时指向一个实现了指定 trait 的类型实例，以及一个用于在运行时查找该类型上 trait 方法的表。我们通过指定某种指针（如引用或 `Box<T>` 智能指针），然后加上 `dyn` 关键字，再指定相关的 trait 来创建 trait 对象。（我们将在第 20 章的["动态大小类型与 `Sized` trait"][dynamically-sized]<!-- ignore -->中讨论 trait 对象必须使用指针的原因。）我们可以使用 trait 对象来代替泛型或具体类型。无论在哪里使用 trait 对象，Rust 的类型系统都会在编译时确保在该上下文中使用的任何值都实现了 trait 对象的 trait。因此，我们不需要在编译时知道所有可能的类型。

我们之前提到过，在 Rust 中，我们避免将结构体和枚举称为"对象"，以区别于其他语言中的对象。在结构体或枚举中，结构体字段中的数据和 `impl` 块中的行为是分开的，而在其他语言中，数据和行为组合成一个概念通常被称为对象。trait 对象与其他语言中的对象不同，因为我们不能向 trait 对象添加数据。trait 对象不像其他语言中的对象那样通用：它们的特定用途是允许对共同行为进行抽象。

示例 18-3 展示了如何定义一个名为 `Draw` 的 trait，其中有一个名为 `draw` 的方法。

<Listing number="18-3" file-name="src/lib.rs" caption="定义 `Draw` trait">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-03/src/lib.rs}}
```

</Listing>

这个语法应该很熟悉，我们在第 10 章讨论过如何定义 trait。接下来是一些新语法：示例 18-4 定义了一个名为 `Screen` 的结构体，它持有一个名为 `components` 的 vector。这个 vector 的类型是 `Box<dyn Draw>`，这是一个 trait 对象；它是 `Box` 中任何实现了 `Draw` trait 的类型的替身。

<Listing number="18-4" file-name="src/lib.rs" caption="定义 `Screen` 结构体，其 `components` 字段持有一个实现了 `Draw` trait 的 trait 对象的 vector">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-04/src/lib.rs:here}}
```

</Listing>

在 `Screen` 结构体上，我们将定义一个名为 `run` 的方法，它会对每个 `components` 调用 `draw` 方法，如示例 18-5 所示。

<Listing number="18-5" file-name="src/lib.rs" caption="`Screen` 上的 `run` 方法，对每个组件调用 `draw` 方法">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-05/src/lib.rs:here}}
```

</Listing>

这与定义一个使用带有 trait 约束的泛型类型参数的结构体的工作方式不同。泛型类型参数一次只能替换为一个具体类型，而 trait 对象允许在运行时用多个具体类型来填充 trait 对象。例如，我们可以使用泛型和 trait 约束来定义 `Screen` 结构体，如示例 18-6 所示。

<Listing number="18-6" file-name="src/lib.rs" caption="使用泛型和 trait 约束的 `Screen` 结构体及其 `run` 方法的替代实现">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-06/src/lib.rs:here}}
```

</Listing>

这将限制我们的 `Screen` 实例只能拥有一个全部是 `Button` 类型或全部是 `TextField` 类型的组件列表。如果你只需要同质集合，使用泛型和 trait 约束是更好的选择，因为定义会在编译时被单态化以使用具体类型。

另一方面，使用 trait 对象的方法，一个 `Screen` 实例可以持有一个同时包含 `Box<Button>` 和 `Box<TextField>` 的 `Vec<T>`。让我们看看这是如何工作的，然后讨论其运行时性能影响。

### 实现 trait

现在我们将添加一些实现 `Draw` trait 的类型。我们将提供 `Button` 类型。实际实现一个 GUI 库超出了本书的范围，所以 `draw` 方法的主体不会有任何有用的实现。为了想象实现可能是什么样子，`Button` 结构体可能有 `width`、`height` 和 `label` 字段，如示例 18-7 所示。

<Listing number="18-7" file-name="src/lib.rs" caption="实现了 `Draw` trait 的 `Button` 结构体">

```rust,noplayground
{{#rustdoc_include ../listings/ch18-oop/listing-18-07/src/lib.rs:here}}
```

</Listing>

`Button` 上的 `width`、`height` 和 `label` 字段会与其他组件的字段不同；例如，`TextField` 类型可能有这些相同的字段外加一个 `placeholder` 字段。我们想要在屏幕上绘制的每个类型都会实现 `Draw` trait，但会在 `draw` 方法中使用不同的代码来定义如何绘制该特定类型，就像这里的 `Button` 一样（没有实际的 GUI 代码，如前所述）。例如，`Button` 类型可能有一个额外的 `impl` 块，包含与用户点击按钮时发生的事情相关的方法。这类方法不适用于 `TextField` 等类型。

如果使用我们库的人决定实现一个具有 `width`、`height` 和 `options` 字段的 `SelectBox` 结构体，他们也会在 `SelectBox` 类型上实现 `Draw` trait，如示例 18-8 所示。

<Listing number="18-8" file-name="src/main.rs" caption="另一个 crate 使用 `gui` 并在 `SelectBox` 结构体上实现 `Draw` trait">

```rust,ignore
{{#rustdoc_include ../listings/ch18-oop/listing-18-08/src/main.rs:here}}
```

</Listing>

我们库的用户现在可以编写他们的 `main` 函数来创建一个 `Screen` 实例。他们可以通过将 `SelectBox` 和 `Button` 各自放入 `Box<T>` 使其成为 trait 对象，然后添加到 `Screen` 实例中。接着他们可以在 `Screen` 实例上调用 `run` 方法，这会对每个组件调用 `draw`。示例 18-9 展示了这个实现。

<Listing number="18-9" file-name="src/main.rs" caption="使用 trait 对象来存储实现了相同 trait 的不同类型的值">

```rust,ignore
{{#rustdoc_include ../listings/ch18-oop/listing-18-09/src/main.rs:here}}
```

</Listing>

当我们编写这个库时，我们并不知道有人会添加 `SelectBox` 类型，但我们的 `Screen` 实现能够操作这个新类型并绘制它，因为 `SelectBox` 实现了 `Draw` trait，这意味着它实现了 `draw` 方法。

这个概念——只关心值响应的消息而不关心值的具体类型——类似于动态类型语言中**鸭子类型**（duck typing）的概念：如果它走起来像鸭子，叫起来也像鸭子，那它就是鸭子！在示例 18-5 中 `Screen` 的 `run` 实现中，`run` 不需要知道每个组件的具体类型是什么。它不检查组件是 `Button` 还是 `SelectBox` 的实例，只是对组件调用 `draw` 方法。通过指定 `Box<dyn Draw>` 作为 `components` vector 中值的类型，我们定义了 `Screen` 需要那些可以调用 `draw` 方法的值。

使用 trait 对象和 Rust 的类型系统来编写类似于鸭子类型的代码的优势在于，我们永远不必在运行时检查一个值是否实现了特定方法，也不必担心在值没有实现某个方法时调用它而产生错误。如果值没有实现 trait 对象所需的 trait，Rust 不会编译我们的代码。

例如，示例 18-10 展示了如果我们尝试用 `String` 作为组件来创建 `Screen` 会发生什么。

<Listing number="18-10" file-name="src/main.rs" caption="尝试使用一个未实现 trait 对象的 trait 的类型">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch18-oop/listing-18-10/src/main.rs}}
```

</Listing>

我们会得到这个错误，因为 `String` 没有实现 `Draw` trait：

```console
{{#include ../listings/ch18-oop/listing-18-10/output.txt}}
```

这个错误告诉我们，要么我们传递了一个不该传递给 `Screen` 的东西，应该传递一个不同的类型；要么我们应该在 `String` 上实现 `Draw`，这样 `Screen` 就能对它调用 `draw` 了。

<!-- Old headings. Do not remove or links may break. -->

<a id="trait-objects-perform-dynamic-dispatch"></a>

### 执行动态分发

回顾第 10 章["使用泛型的代码性能"][performance-of-code-using-generics]<!-- ignore -->中关于编译器对泛型执行的单态化过程的讨论：编译器为我们用来替代泛型类型参数的每个具体类型生成非泛型的函数和方法实现。单态化产生的代码执行的是**静态分发**（static dispatch），即编译器在编译时就知道你调用的是哪个方法。这与**动态分发**（dynamic dispatch）相对，动态分发是编译器在编译时无法确定你调用的是哪个方法。在动态分发的情况下，编译器生成的代码会在运行时确定应该调用哪个方法。

当我们使用 trait 对象时，Rust 必须使用动态分发。编译器不知道所有可能与使用 trait 对象的代码一起使用的类型，因此它不知道应该调用哪个类型上实现的哪个方法。相反，在运行时，Rust 使用 trait 对象内部的指针来确定要调用哪个方法。这种查找会产生静态分发不会有的运行时开销。动态分发还阻止编译器选择内联方法的代码，这反过来又阻止了一些优化，而且 Rust 对于在哪里可以使用和不可以使用动态分发有一些规则，称为 **dyn 兼容性**（dyn compatibility）。这些规则超出了本次讨论的范围，但你可以在[参考手册][dyn-compatibility]<!-- ignore -->中阅读更多相关内容。不过，我们确实在示例 18-5 中编写的代码和示例 18-9 中支持的代码中获得了额外的灵活性，所以这是一个需要权衡的取舍。

[performance-of-code-using-generics]: ch10-01-syntax.html#performance-of-code-using-generics
[dynamically-sized]: ch20-03-advanced-types.html#dynamically-sized-types-and-the-sized-trait
[dyn-compatibility]: https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility
