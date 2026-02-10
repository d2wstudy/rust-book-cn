## 高级函数与闭包

本节将探讨一些与函数和闭包相关的高级特性，包括函数指针和返回闭包。

### 函数指针

我们已经讨论过如何将闭包传递给函数；其实你也可以将普通函数传递给函数！当你想传递一个已经定义好的函数而不是重新定义一个闭包时，这种技巧非常有用。函数会被强制转换为 `fn` 类型（注意是小写的 _f_），不要与 `Fn` 闭包 trait 混淆。`fn` 类型被称为**函数指针**（function pointer）。通过函数指针传递函数，可以让你将函数作为参数传递给其他函数。

指定参数为函数指针的语法与闭包类似，如示例 20-28 所示。这里我们定义了一个函数 `add_one`，它将参数加 1。函数 `do_twice` 接受两个参数：一个函数指针，指向任何接受 `i32` 参数并返回 `i32` 的函数，以及一个 `i32` 值。`do_twice` 函数调用 `f` 两次，每次传入 `arg` 值，然后将两次函数调用的结果相加。`main` 函数以 `add_one` 和 `5` 作为参数调用 `do_twice`。

<Listing number="20-28" file-name="src/main.rs" caption="使用 `fn` 类型接受函数指针作为参数">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-28/src/main.rs}}
```

</Listing>

这段代码会打印 `The answer is: 12`。我们指定 `do_twice` 中的参数 `f` 是一个 `fn`，它接受一个 `i32` 类型的参数并返回一个 `i32`。然后我们可以在 `do_twice` 的函数体中调用 `f`。在 `main` 中，我们可以将函数名 `add_one` 作为第一个参数传递给 `do_twice`。

与闭包不同，`fn` 是一个类型而不是一个 trait，因此我们直接将 `fn` 指定为参数类型，而不是声明一个以 `Fn` trait 作为 trait bound 的泛型类型参数。

函数指针实现了所有三个闭包 trait（`Fn`、`FnMut` 和 `FnOnce`），这意味着你总是可以将函数指针作为参数传递给期望接收闭包的函数。最佳实践是使用泛型类型和闭包 trait 之一来编写函数，这样你的函数既能接受函数也能接受闭包。

话虽如此，有一种情况你可能只想接受 `fn` 而不是闭包，那就是与没有闭包的外部代码交互时：C 函数可以接受函数作为参数，但 C 语言没有闭包。

作为一个既可以使用内联闭包也可以使用具名函数的例子，让我们看看标准库中 `Iterator` trait 提供的 `map` 方法的用法。要使用 `map` 方法将一个数字向量转换为字符串向量，我们可以使用闭包，如示例 20-29 所示。

<Listing number="20-29" caption="使用闭包配合 `map` 方法将数字转换为字符串">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-29/src/main.rs:here}}
```

</Listing>

或者，我们也可以将一个函数作为 `map` 的参数来代替闭包。示例 20-30 展示了这种写法。

<Listing number="20-30" caption="使用 `String::to_string` 函数配合 `map` 方法将数字转换为字符串">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-30/src/main.rs:here}}
```

</Listing>

注意，这里我们必须使用在["高级 trait"][advanced-traits]<!-- ignore --> 一节中讨论过的完全限定语法，因为有多个名为 `to_string` 的函数可用。

这里我们使用的是 `ToString` trait 中定义的 `to_string` 函数，标准库为所有实现了 `Display` 的类型都实现了该 trait。

回忆一下第 6 章["枚举值"][enum-values]<!-- ignore --> 一节的内容，我们定义的每个枚举变体的名称也会成为一个初始化函数。我们可以将这些初始化函数用作实现了闭包 trait 的函数指针，这意味着我们可以将初始化函数指定为接受闭包的方法的参数，如示例 20-31 所示。

<Listing number="20-31" caption="使用枚举初始化函数配合 `map` 方法从数字创建 `Status` 实例">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-31/src/main.rs:here}}
```

</Listing>

这里我们通过使用 `Status::Value` 的初始化函数，对 `map` 所调用的范围中的每个 `u32` 值创建了 `Status::Value` 实例。有些人喜欢这种风格，有些人则更喜欢使用闭包。它们会编译成相同的代码，所以请使用你觉得更清晰的风格。

### 返回闭包

闭包由 trait 表示，这意味着你不能直接返回闭包。在大多数需要返回 trait 的场景中，你可以改用实现了该 trait 的具体类型作为函数的返回值。但是，对于闭包你通常无法这样做，因为它们没有可返回的具体类型；例如，如果闭包从其作用域中捕获了值，你就不能使用函数指针 `fn` 作为返回类型。

相反，你通常会使用我们在第 10 章学到的 `impl Trait` 语法。你可以使用 `Fn`、`FnOnce` 和 `FnMut` 来返回任何函数类型。例如，示例 20-32 中的代码可以正常编译。

<Listing number="20-32" caption="使用 `impl Trait` 语法从函数返回闭包">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-32/src/lib.rs}}
```

</Listing>

然而，正如我们在第 13 章["闭包类型推断和标注"][closure-types]<!-- ignore --> 一节中提到的，每个闭包也是其自身独特的类型。如果你需要处理多个具有相同签名但不同实现的函数，就需要为它们使用 trait 对象。考虑一下如果你编写如示例 20-33 所示的代码会发生什么。

<Listing file-name="src/main.rs" number="20-33" caption="创建一个由返回 `impl Fn` 类型的函数所定义的闭包 `Vec<T>`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-33/src/main.rs}}
```

</Listing>

这里有两个函数 `returns_closure` 和 `returns_initialized_closure`，它们都返回 `impl Fn(i32) -> i32`。注意它们返回的闭包是不同的，尽管它们实现了相同的类型。如果我们尝试编译这段代码，Rust 会告诉我们这行不通：

```text
{{#include ../listings/ch20-advanced-features/listing-20-33/output.txt}}
```

错误信息告诉我们，每当我们返回一个 `impl Trait` 时，Rust 会创建一个唯一的**不透明类型**（opaque type），这是一种我们无法看到 Rust 为我们构造的内部细节的类型，我们也无法猜测 Rust 会生成什么类型来自己编写。因此，即使这些函数返回的闭包实现了相同的 trait `Fn(i32) -> i32`，Rust 为每个闭包生成的不透明类型也是不同的。（这类似于 Rust 为不同的异步块生成不同的具体类型，即使它们具有相同的输出类型，正如我们在第 17 章["`Pin` 类型和 `Unpin` trait"][future-types]<!-- ignore --> 中看到的那样。）我们已经多次见过这个问题的解决方案：使用 trait 对象，如示例 20-34 所示。

<Listing number="20-34" caption="创建一个由返回 `Box<dyn Fn>` 的函数所定义的闭包 `Vec<T>`，使它们具有相同的类型">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-34/src/main.rs:here}}
```

</Listing>

这段代码可以正常编译。关于 trait 对象的更多内容，请参阅第 18 章["使用 trait 对象来抽象共同行为"][trait-objects]<!-- ignore --> 一节。

接下来，让我们看看宏！

[advanced-traits]: ch20-02-advanced-traits.html#advanced-traits
[enum-values]: ch06-01-defining-an-enum.html#enum-values
[closure-types]: ch13-01-closures.html#closure-type-inference-and-annotation
[future-types]: ch17-03-more-futures.html
[trait-objects]: ch18-02-trait-objects.html