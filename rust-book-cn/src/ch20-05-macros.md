## 宏

我们在本书中一直使用像 `println!` 这样的宏，但还没有完整地探讨宏是什么以及它是如何工作的。**宏**（macro）这个术语指的是 Rust 中的一系列特性——使用 `macro_rules!` 的声明式宏（declarative macros）以及三种过程宏（procedural macros）：

- 自定义 `#[derive]` 宏，用于在结构体和枚举上通过 `derive` 属性自动添加代码
- 类属性宏（attribute-like macros），用于定义可用于任何条目的自定义属性
- 类函数宏（function-like macros），看起来像函数调用，但操作的是作为参数传入的 token

我们将依次介绍这些内容，但首先，让我们看看既然已经有了函数，为什么还需要宏。

### 宏和函数的区别

从根本上说，宏是一种编写代码来生成其他代码的方式，这被称为**元编程**（metaprogramming）。在附录 C 中，我们讨论了 `derive` 属性，它可以为你自动生成各种 trait 的实现。我们在本书中还使用了 `println!` 和 `vec!` 宏。所有这些宏都会**展开**（expand）以生成比你手动编写的更多的代码。

元编程对于减少你需要编写和维护的代码量非常有用，这也是函数的作用之一。然而，宏拥有一些函数所不具备的额外能力。

函数签名必须声明函数的参数数量和类型。而宏可以接受可变数量的参数：我们可以用一个参数调用 `println!("hello")`，也可以用两个参数调用 `println!("hello {}", name)`。此外，宏在编译器解释代码含义之前就会展开，因此宏可以做到一些函数做不到的事情，例如在给定类型上实现一个 trait。函数则不行，因为函数在运行时才被调用，而 trait 需要在编译时实现。

使用宏而非函数的缺点是，宏定义比函数定义更复杂，因为你是在编写生成 Rust 代码的 Rust 代码。由于这种间接性，宏定义通常比函数定义更难阅读、理解和维护。

宏和函数之间还有一个重要区别：在文件中调用宏之前，必须先定义宏或将其引入作用域，而函数则可以在任何地方定义、在任何地方调用。

<!-- Old headings. Do not remove or links may break. -->

<a id="declarative-macros-with-macro_rules-for-general-metaprogramming"></a>

### 用于通用元编程的声明式宏

Rust 中最广泛使用的宏形式是**声明式宏**（declarative macro）。它们有时也被称为"示例宏"（macros by example）、"`macro_rules!` 宏"或简称"宏"。声明式宏的核心是允许你编写类似于 Rust `match` 表达式的东西。正如第六章所讨论的，`match` 表达式是一种控制结构，它接受一个表达式，将表达式的结果值与模式进行比较，然后运行与匹配模式关联的代码。宏也是将一个值与关联了特定代码的模式进行比较：在这种情况下，值是传递给宏的字面 Rust 源代码；模式与该源代码的结构进行比较；每个模式关联的代码在匹配时替换传递给宏的代码。这一切都发生在编译期间。

要定义一个宏，需要使用 `macro_rules!` 构造。让我们通过查看 `vec!` 宏的定义来探索如何使用 `macro_rules!`。第八章介绍了如何使用 `vec!` 宏来创建一个包含特定值的新向量。例如，下面的宏创建了一个包含三个整数的新向量：

```rust
let v: Vec<u32> = vec![1, 2, 3];
```

我们也可以使用 `vec!` 宏来创建一个包含两个整数的向量或一个包含五个字符串切片的向量。我们无法使用函数来做同样的事情，因为我们事先不知道值的数量或类型。

示例 20-35 展示了 `vec!` 宏的一个略微简化的定义。

<Listing number="20-35" file-name="src/lib.rs" caption="`vec!` 宏定义的简化版本">

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-35/src/lib.rs}}
```

</Listing>

> 注意：标准库中 `vec!` 宏的实际定义包含了预先分配正确内存量的代码。那部分代码是一种优化，为了使示例更简单，我们在这里没有包含它。

`#[macro_export]` 注解表示，只要定义了该宏的 crate 被引入作用域，这个宏就应该可用。没有这个注解，宏就无法被引入作用域。

然后我们用 `macro_rules!` 和要定义的宏的名称（**不带**感叹号）来开始宏定义。在本例中，名称是 `vec`，后面跟着花括号，表示宏定义的主体。

`vec!` 主体中的结构类似于 `match` 表达式的结构。这里我们有一个分支，其模式为 `( $( $x:expr ),* )`，后面跟着 `=>` 和与该模式关联的代码块。如果模式匹配成功，关联的代码块将被生成。鉴于这是该宏中唯一的模式，因此只有一种有效的匹配方式；任何其他模式都会导致错误。更复杂的宏会有多个分支。

宏定义中有效的模式语法与第十九章介绍的模式语法不同，因为宏模式是与 Rust 代码结构而非值进行匹配的。让我们逐步解析示例 20-29 中的模式片段的含义；完整的宏模式语法请参阅 [Rust 参考手册][ref]。

首先，我们使用一对圆括号来包含整个模式。我们使用美元符号（`$`）在宏系统中声明一个变量，该变量将包含与模式匹配的 Rust 代码。美元符号明确表示这是一个宏变量，而非普通的 Rust 变量。接下来是一对圆括号，用于捕获与括号内模式匹配的值，以便在替换代码中使用。在 `$()` 内部是 `$x:expr`，它匹配任何 Rust 表达式并将该表达式命名为 `$x`。

`$()` 后面的逗号表示，在匹配 `$()` 中代码的每个实例之间，必须出现一个字面逗号分隔符。`*` 指定该模式匹配零个或多个 `*` 之前的内容。

当我们用 `vec![1, 2, 3];` 调用这个宏时，`$x` 模式与三个表达式 `1`、`2` 和 `3` 分别匹配了三次。

现在让我们看看与这个分支关联的代码主体中的模式：`$()*` 内的 `temp_vec.push()` 会为模式中 `$()` 匹配的每个部分生成零次或多次，具体取决于模式匹配了多少次。`$x` 会被替换为每个匹配到的表达式。当我们用 `vec![1, 2, 3];` 调用这个宏时，替换该宏调用所生成的代码如下：

```rust,ignore
{
    let mut temp_vec = Vec::new();
    temp_vec.push(1);
    temp_vec.push(2);
    temp_vec.push(3);
    temp_vec
}
```

我们定义了一个可以接受任意数量、任意类型参数的宏，并且能够生成创建包含指定元素的向量的代码。

要了解更多关于如何编写宏的内容，请查阅在线文档或其他资源，例如由 Daniel Keep 发起、Lukas Wirth 继续维护的 ["The Little Book of Rust Macros"][tlborm]。

### 用于从属性生成代码的过程宏

第二种形式的宏是**过程宏**（procedural macro），它的行为更像函数（也是一种过程）。过程宏接受一些代码作为输入，对这些代码进行操作，然后产生一些代码作为输出，而不是像声明式宏那样匹配模式并用其他代码替换。三种过程宏分别是自定义 `derive`、类属性和类函数，它们的工作方式都类似。

创建过程宏时，其定义必须位于一个具有特殊 crate 类型的独立 crate 中。这是出于复杂的技术原因，我们希望将来能消除这一限制。在示例 20-36 中，我们展示了如何定义一个过程宏，其中 `some_attribute` 是使用特定宏类型的占位符。

<Listing number="20-36" file-name="src/lib.rs" caption="定义过程宏的示例">

```rust,ignore
use proc_macro::TokenStream;

#[some_attribute]
pub fn some_name(input: TokenStream) -> TokenStream {
}
```

</Listing>

定义过程宏的函数接受一个 `TokenStream` 作为输入，并产生一个 `TokenStream` 作为输出。`TokenStream` 类型由 Rust 自带的 `proc_macro` crate 定义，表示一个 token 序列。这就是宏的核心：宏所操作的源代码构成了输入 `TokenStream`，宏产生的代码就是输出 `TokenStream`。该函数还附加了一个属性，用于指定我们正在创建哪种过程宏。同一个 crate 中可以有多种过程宏。

让我们看看不同种类的过程宏。我们将从自定义 `derive` 宏开始，然后解释其他形式的细微差别。

<!-- Old headings. Do not remove or links may break. -->

<a id="how-to-write-a-custom-derive-macro"></a>

### 自定义 `derive` 宏

让我们创建一个名为 `hello_macro` 的 crate，其中定义一个名为 `HelloMacro` 的 trait，该 trait 有一个名为 `hello_macro` 的关联函数。我们不想让用户为每个类型都手动实现 `HelloMacro` trait，而是提供一个过程宏，让用户可以通过 `#[derive(HelloMacro)]` 注解来获得 `hello_macro` 函数的默认实现。默认实现将打印 `Hello, Macro! My name is TypeName!`，其中 `TypeName` 是定义了该 trait 的类型的名称。换句话说，我们将编写一个 crate，使其他程序员能够使用我们的 crate 编写如示例 20-37 所示的代码。

<Listing number="20-37" file-name="src/main.rs" caption="使用我们的过程宏时，crate 用户能够编写的代码">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-37/src/main.rs}}
```

</Listing>

当我们完成后，这段代码将打印 `Hello, Macro! My name is Pancakes!`。第一步是创建一个新的库 crate，如下所示：

```console
$ cargo new hello_macro --lib
```

接下来，在示例 20-38 中，我们将定义 `HelloMacro` trait 及其关联函数。

<Listing file-name="src/lib.rs" number="20-38" caption="一个简单的 trait，我们将配合 `derive` 宏使用">

```rust,noplayground
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-38/hello_macro/src/lib.rs}}
```

</Listing>

我们有了一个 trait 和它的函数。此时，crate 的用户可以自己实现该 trait 来达到期望的功能，如示例 20-39 所示。

<Listing number="20-39" file-name="src/main.rs" caption="如果用户手动实现 `HelloMacro` trait 的话会是什么样子">

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-39/pancakes/src/main.rs}}
```

</Listing>

然而，他们需要为每个想要使用 `hello_macro` 的类型都编写实现代码块；我们希望让他们免于这项工作。

此外，我们目前还无法为 `hello_macro` 函数提供一个能打印实现了该 trait 的类型名称的默认实现：Rust 没有反射能力，因此无法在运行时查找类型的名称。我们需要一个宏来在编译时生成代码。

下一步是定义过程宏。在撰写本文时，过程宏需要位于自己的 crate 中。最终这一限制可能会被取消。组织 crate 和宏 crate 的惯例如下：对于名为 `foo` 的 crate，自定义 `derive` 过程宏 crate 命名为 `foo_derive`。让我们在 `hello_macro` 项目内创建一个名为 `hello_macro_derive` 的新 crate：

```console
$ cargo new hello_macro_derive --lib
```

我们的两个 crate 紧密相关，因此我们在 `hello_macro` crate 的目录内创建过程宏 crate。如果我们修改了 `hello_macro` 中的 trait 定义，也需要同步修改 `hello_macro_derive` 中过程宏的实现。这两个 crate 需要分别发布，使用这些 crate 的程序员需要同时添加两者作为依赖并将它们引入作用域。我们也可以让 `hello_macro` crate 将 `hello_macro_derive` 作为依赖并重新导出过程宏代码。但是，我们目前的项目结构方式使得程序员即使不需要 `derive` 功能也可以使用 `hello_macro`。

我们需要将 `hello_macro_derive` crate 声明为过程宏 crate。我们还需要 `syn` 和 `quote` crate 的功能，稍后你就会看到，因此需要将它们添加为依赖。将以下内容添加到 `hello_macro_derive` 的 _Cargo.toml_ 文件中：

<Listing file-name="hello_macro_derive/Cargo.toml">

```toml
{{#include ../listings/ch20-advanced-features/listing-20-40/hello_macro/hello_macro_derive/Cargo.toml:6:12}}
```

</Listing>

要开始定义过程宏，请将示例 20-40 中的代码放入 `hello_macro_derive` crate 的 _src/lib.rs_ 文件中。注意，在我们添加 `impl_hello_macro` 函数的定义之前，这段代码无法编译。

<Listing number="20-40" file-name="hello_macro_derive/src/lib.rs" caption="大多数过程宏 crate 处理 Rust 代码所需的代码">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-40/hello_macro/hello_macro_derive/src/lib.rs}}
```

</Listing>

注意我们将代码拆分成了 `hello_macro_derive` 函数和 `impl_hello_macro` 函数，前者负责解析 `TokenStream`，后者负责转换语法树：这使得编写过程宏更加方便。外层函数（本例中的 `hello_macro_derive`）的代码在你见到或创建的几乎每个过程宏 crate 中都是相同的。内层函数（本例中的 `impl_hello_macro`）的函数体中指定的代码则会因过程宏的用途不同而不同。

我们引入了三个新的 crate：`proc_macro`、[`syn`][syn]<!-- ignore --> 和 [`quote`][quote]<!-- ignore -->。`proc_macro` crate 随 Rust 一起提供，因此不需要将它添加到 _Cargo.toml_ 的依赖中。`proc_macro` crate 是编译器的 API，允许我们从代码中读取和操作 Rust 代码。

`syn` crate 将 Rust 代码从字符串解析为一个我们可以对其执行操作的数据结构。`quote` crate 将 `syn` 数据结构转换回 Rust 代码。这些 crate 使得解析我们可能想要处理的任何类型的 Rust 代码变得简单得多：编写一个完整的 Rust 代码解析器绝非易事。

当我们库的用户在一个类型上指定 `#[derive(HelloMacro)]` 时，`hello_macro_derive` 函数就会被调用。这是因为我们在这里用 `proc_macro_derive` 注解了 `hello_macro_derive` 函数，并指定了名称 `HelloMacro`，它与我们的 trait 名称匹配；这是大多数过程宏遵循的惯例。

`hello_macro_derive` 函数首先将 `input` 从 `TokenStream` 转换为一个我们可以解释和操作的数据结构。这就是 `syn` 发挥作用的地方。`syn` 中的 `parse` 函数接受一个 `TokenStream` 并返回一个表示解析后 Rust 代码的 `DeriveInput` 结构体。示例 20-41 展示了解析 `struct Pancakes;` 字符串时得到的 `DeriveInput` 结构体的相关部分。

<Listing number="20-41" caption="解析示例 20-37 中带有宏属性的代码时得到的 `DeriveInput` 实例">

```rust,ignore
DeriveInput {
    // --snip--

    ident: Ident {
        ident: "Pancakes",
        span: #0 bytes(95..103)
    },
    data: Struct(
        DataStruct {
            struct_token: Struct,
            fields: Unit,
            semi_token: Some(
                Semi
            )
        }
    )
}
```

</Listing>

这个结构体的字段表明我们解析的 Rust 代码是一个单元结构体，其 `ident`（标识符，即名称）为 `Pancakes`。这个结构体上还有更多字段用于描述各种 Rust 代码；更多信息请查阅 [`syn` 的 `DeriveInput` 文档][syn-docs]。

很快我们将定义 `impl_hello_macro` 函数，这是我们构建想要包含的新 Rust 代码的地方。但在此之前，请注意我们的 `derive` 宏的输出也是一个 `TokenStream`。返回的 `TokenStream` 会被添加到 crate 用户编写的代码中，因此当他们编译自己的 crate 时，就会获得我们在修改后的 `TokenStream` 中提供的额外功能。

你可能已经注意到，我们调用了 `unwrap`，使得 `hello_macro_derive` 函数在 `syn::parse` 函数调用失败时会 panic。过程宏在遇到错误时必须 panic，因为 `proc_macro_derive` 函数必须返回 `TokenStream` 而不是 `Result`，以符合过程宏 API 的要求。我们在这里使用 `unwrap` 简化了示例；在生产代码中，你应该使用 `panic!` 或 `expect` 提供更具体的错误信息。

现在我们有了将被注解的 Rust 代码从 `TokenStream` 转换为 `DeriveInput` 实例的代码，让我们来生成在被注解类型上实现 `HelloMacro` trait 的代码，如示例 20-42 所示。

<Listing number="20-42" file-name="hello_macro_derive/src/lib.rs" caption="使用解析后的 Rust 代码实现 `HelloMacro` trait">

```rust,ignore
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-42/hello_macro/hello_macro_derive/src/lib.rs:here}}
```

</Listing>

我们通过 `ast.ident` 获取了一个包含被注解类型名称（标识符）的 `Ident` 结构体实例。示例 20-41 中的结构体表明，当我们对示例 20-37 中的代码运行 `impl_hello_macro` 函数时，得到的 `ident` 的 `ident` 字段值为 `"Pancakes"`。因此，示例 20-42 中的 `name` 变量将包含一个 `Ident` 结构体实例，打印时将是字符串 `"Pancakes"`，即示例 20-37 中结构体的名称。

`quote!` 宏让我们定义想要返回的 Rust 代码。编译器期望的东西与 `quote!` 宏执行的直接结果不同，因此我们需要将其转换为 `TokenStream`。我们通过调用 `into` 方法来完成这一转换，它会消费这个中间表示并返回所需的 `TokenStream` 类型的值。

`quote!` 宏还提供了一些非常酷的模板机制：我们可以输入 `#name`，`quote!` 就会用变量 `name` 中的值替换它。你甚至可以做一些类似于常规宏工作方式的重复操作。详细介绍请查阅 [`quote` crate 的文档][quote-docs]。

我们希望过程宏为用户注解的类型生成 `HelloMacro` trait 的实现，这可以通过 `#name` 获取。trait 实现有一个函数 `hello_macro`，其函数体包含我们想要提供的功能：打印 `Hello, Macro! My name is` 以及被注解类型的名称。

这里使用的 `stringify!` 宏是 Rust 内置的。它接受一个 Rust 表达式，如 `1 + 2`，然后在编译时将该表达式转换为字符串字面量，如 `"1 + 2"`。这与 `format!` 或 `println!` 不同，后者会先求值表达式然后将结果转换为 `String`。`#name` 输入可能是一个需要按字面打印的表达式，因此我们使用 `stringify!`。使用 `stringify!` 还能在编译时将 `#name` 转换为字符串字面量，从而节省一次内存分配。

此时，`cargo build` 应该能在 `hello_macro` 和 `hello_macro_derive` 中都成功完成。让我们将这些 crate 与示例 20-37 中的代码连接起来，看看过程宏的实际效果！在你的 _projects_ 目录中使用 `cargo new pancakes` 创建一个新的二进制项目。我们需要在 `pancakes` crate 的 _Cargo.toml_ 中将 `hello_macro` 和 `hello_macro_derive` 添加为依赖。如果你将自己的 `hello_macro` 和 `hello_macro_derive` 版本发布到 [crates.io](https://crates.io/)<!-- ignore -->，它们将是常规依赖；如果没有，你可以将它们指定为 `path` 依赖，如下所示：

```toml
{{#include ../listings/ch20-advanced-features/no-listing-21-pancakes/pancakes/Cargo.toml:6:8}}
```

将示例 20-37 中的代码放入 _src/main.rs_，然后运行 `cargo run`：它应该会打印 `Hello, Macro! My name is Pancakes!`。过程宏中的 `HelloMacro` trait 实现被自动包含进来了，`pancakes` crate 无需自己实现它；`#[derive(HelloMacro)]` 添加了 trait 实现。

接下来，让我们探讨其他种类的过程宏与自定义 `derive` 宏有何不同。

### 类属性宏

类属性宏与自定义 `derive` 宏类似，但它们不是为 `derive` 属性生成代码，而是允许你创建新的属性。它们也更加灵活：`derive` 只能用于结构体和枚举；而属性可以应用于其他条目，例如函数。下面是一个使用类属性宏的例子。假设你有一个名为 `route` 的属性，在使用 Web 应用框架时用于注解函数：

```rust,ignore
#[route(GET, "/")]
fn index() {
```

这个 `#[route]` 属性将由框架定义为一个过程宏。宏定义函数的签名如下所示：

```rust,ignore
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
```

这里我们有两个 `TokenStream` 类型的参数。第一个是属性的内容：即 `GET, "/"` 部分。第二个是属性所附加的条目的主体：在本例中是 `fn index() {}` 以及函数体的其余部分。

除此之外，类属性宏的工作方式与自定义 `derive` 宏相同：你创建一个 `proc-macro` crate 类型的 crate，并实现一个生成所需代码的函数！

### 类函数宏

类函数宏定义的宏看起来像函数调用。与 `macro_rules!` 宏类似，它们比函数更灵活；例如，它们可以接受未知数量的参数。然而，`macro_rules!` 宏只能使用我们在前面["用于通用元编程的声明式宏"][decl]<!-- ignore -->一节中讨论的类 match 语法来定义。类函数宏接受一个 `TokenStream` 参数，其定义使用 Rust 代码操作该 `TokenStream`，与其他两种过程宏一样。一个类函数宏的例子是 `sql!` 宏，它可能像这样调用：

```rust,ignore
let sql = sql!(SELECT * FROM posts WHERE id=1);
```

这个宏会解析其中的 SQL 语句并检查其语法是否正确，这比 `macro_rules!` 宏能做的处理要复杂得多。`sql!` 宏的定义如下：

```rust,ignore
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
```

这个定义与自定义 `derive` 宏的签名类似：我们接收括号内的 token，并返回我们想要生成的代码。

## 总结

呼！现在你的工具箱中又多了一些可能不会经常使用的 Rust 特性，但你会知道它们在非常特定的情况下是可用的。我们介绍了几个复杂的主题，这样当你在错误消息建议或其他人的代码中遇到它们时，就能够识别这些概念和语法。可以将本章作为参考，指引你找到解决方案。

接下来，我们将把本书中讨论的所有内容付诸实践，再做一个项目！

[ref]: ../reference/macros-by-example.html
[tlborm]: https://veykril.github.io/tlborm/
[syn]: https://crates.io/crates/syn
[quote]: https://crates.io/crates/quote
[syn-docs]: https://docs.rs/syn/2.0/syn/struct.DeriveInput.html
[quote-docs]: https://docs.rs/quote
[decl]: #declarative-macros-with-macro_rules-for-general-metaprogramming