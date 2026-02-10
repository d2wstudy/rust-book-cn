## 定义枚举

结构体提供了一种将相关字段和数据组合在一起的方式，比如带有 `width` 和 `height` 的 `Rectangle`；而枚举则提供了一种表达"某个值是一组可能值之一"的方式。例如，我们可能想表达 `Rectangle` 是一组可能的形状之一，这组形状还包括 `Circle` 和 `Triangle`。为此，Rust 允许我们将这些可能性编码为一个枚举。

让我们看一个可能需要用代码来表达的场景，来理解为什么在这种情况下枚举比结构体更有用、更合适。假设我们需要处理 IP 地址。目前，IP 地址有两个主要的标准：IPv4 和 IPv6。因为我们的程序只会遇到这两种可能的 IP 地址，所以可以 _枚举（enumerate）_ 出所有可能的变体，这也是枚举名称的由来。

任何一个 IP 地址要么是 IPv4 地址，要么是 IPv6 地址，不可能同时属于两者。IP 地址的这一特性使得枚举数据结构非常适合这个场景，因为一个枚举值只能是其变体之一。IPv4 和 IPv6 地址本质上都是 IP 地址，所以当代码处理适用于任何类型 IP 地址的场景时，它们应该被视为同一类型。

我们可以通过定义一个 `IpAddrKind` 枚举并列出 IP 地址可能的类型 `V4` 和 `V6` 来在代码中表达这个概念。这些就是枚举的变体：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-01-defining-enums/src/main.rs:def}}
```

`IpAddrKind` 现在是一个自定义数据类型，我们可以在代码的其他地方使用它。

### 枚举值

我们可以像这样创建 `IpAddrKind` 两个变体的实例：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-01-defining-enums/src/main.rs:instance}}
```

注意，枚举的变体位于其标识符的命名空间下，我们使用双冒号来分隔。这很有用，因为现在 `IpAddrKind::V4` 和 `IpAddrKind::V6` 这两个值都属于同一类型：`IpAddrKind`。这样我们就可以定义一个接受任意 `IpAddrKind` 的函数：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-01-defining-enums/src/main.rs:fn}}
```

然后用任一变体来调用这个函数：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-01-defining-enums/src/main.rs:fn_call}}
```

使用枚举还有更多优势。进一步思考我们的 IP 地址类型，目前我们还没有办法存储实际的 IP 地址 _数据_，只知道它是哪种 _类型_。鉴于你刚在第 5 章学习了结构体，你可能会想用结构体来解决这个问题，如示例 6-1 所示。

<Listing number="6-1" caption="使用 `struct` 存储 IP 地址的数据和 `IpAddrKind` 变体">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-01/src/main.rs:here}}
```

</Listing>

这里我们定义了一个结构体 `IpAddr`，它有两个字段：一个是 `IpAddrKind` 类型（我们之前定义的枚举）的 `kind` 字段，另一个是 `String` 类型的 `address` 字段。我们创建了这个结构体的两个实例。第一个是 `home`，它的 `kind` 值为 `IpAddrKind::V4`，关联的地址数据是 `127.0.0.1`。第二个实例是 `loopback`，它的 `kind` 值是 `IpAddrKind` 的另一个变体 `V6`，关联的地址是 `::1`。我们用结构体将 `kind` 和 `address` 值捆绑在一起，这样变体就与值关联起来了。

然而，仅用枚举来表达同样的概念会更加简洁：我们可以将数据直接放入每个枚举变体中，而不是将枚举放在结构体里。这个新的 `IpAddr` 枚举定义表明 `V4` 和 `V6` 变体都将关联 `String` 值：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-02-enum-with-data/src/main.rs:here}}
```

我们将数据直接附加到枚举的每个变体上，因此不需要额外的结构体。这里还更容易看到枚举工作方式的另一个细节：我们定义的每个枚举变体的名称也会成为一个构造该枚举实例的函数。也就是说，`IpAddr::V4()` 是一个函数调用，它接受一个 `String` 参数并返回一个 `IpAddr` 类型的实例。定义枚举时，我们自动获得了这个构造函数。

使用枚举而非结构体还有另一个优势：每个变体可以拥有不同类型和数量的关联数据。IPv4 地址总是由四个取值在 0 到 255 之间的数字组成。如果我们想将 `V4` 地址存储为四个 `u8` 值，同时仍将 `V6` 地址表示为一个 `String` 值，用结构体就无法做到。而枚举可以轻松处理这种情况：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-03-variants-with-different-data/src/main.rs:here}}
```

我们已经展示了几种定义数据结构来存储 IPv4 和 IPv6 地址的方式。然而事实上，存储 IP 地址并编码其类型是如此常见，以至于[标准库已经提供了一个可以直接使用的定义！][IpAddr]<!-- ignore -->让我们看看标准库是如何定义 `IpAddr` 的。它拥有与我们定义和使用的完全相同的枚举和变体，但它将地址数据以两个不同结构体的形式嵌入到变体中，每个变体的结构体定义各不相同：

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

这段代码说明你可以在枚举变体中放入任何类型的数据：字符串、数字类型或结构体等等。你甚至可以包含另一个枚举！此外，标准库的类型通常也没有比你自己想出来的复杂多少。

注意，尽管标准库包含了 `IpAddr` 的定义，我们仍然可以创建和使用自己的定义而不会产生冲突，因为我们没有将标准库的定义引入到我们的作用域中。我们将在第 7 章详细讨论如何将类型引入作用域。

让我们看看示例 6-2 中的另一个枚举：这个枚举的变体中嵌入了多种不同的类型。

<Listing number="6-2" caption="一个 `Message` 枚举，其各变体分别存储不同数量和类型的值">

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/listing-06-02/src/main.rs:here}}
```

</Listing>

这个枚举有四个携带不同类型数据的变体：

- `Quit`：没有任何关联数据
- `Move`：有命名字段，类似于结构体
- `Write`：包含一个 `String`
- `ChangeColor`：包含三个 `i32` 值

定义一个如示例 6-2 中这样带有变体的枚举，类似于定义不同种类的结构体，只不过枚举不使用 `struct` 关键字，并且所有变体都归组在 `Message` 类型下。以下结构体可以存储与前面枚举变体相同的数据：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-04-structs-similar-to-message-enum/src/main.rs:here}}
```

但如果我们使用不同的结构体——每个结构体都有自己的类型——我们就不能像使用示例 6-2 中定义的 `Message` 枚举那样轻松地定义一个接受所有这些消息类型的函数，因为 `Message` 枚举是单一类型。

枚举和结构体还有一个相似之处：就像我们可以使用 `impl` 为结构体定义方法一样，我们也可以为枚举定义方法。下面是一个我们可以在 `Message` 枚举上定义的名为 `call` 的方法：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-05-methods-on-enums/src/main.rs:here}}
```

方法体将使用 `self` 来获取调用该方法的值。在这个例子中，我们创建了一个值为 `Message::Write(String::from("hello"))` 的变量 `m`，这就是当 `m.call()` 运行时 `call` 方法体中 `self` 的值。

让我们看看标准库中另一个非常常见且有用的枚举：`Option`。

<!-- Old headings. Do not remove or links may break. -->

<a id="the-option-enum-and-its-advantages-over-null-values"></a>

### `Option` 枚举

本节将探讨 `Option` 的案例研究，它是标准库定义的另一个枚举。`Option` 类型编码了一个非常常见的场景：一个值可能是某个东西，也可能什么都没有。

例如，如果你请求一个非空列表的第一个元素，你会得到一个值。如果你请求一个空列表的第一个元素，你什么也得不到。用类型系统来表达这个概念意味着编译器可以检查你是否处理了所有应该处理的情况；这个功能可以防止在其他编程语言中极为常见的 bug。

编程语言的设计通常从包含哪些特性的角度来考虑，但排除哪些特性同样重要。Rust 没有许多其他语言都有的空值（null）特性。_空值（Null）_ 是一个表示"此处没有值"的值。在有空值的语言中，变量总是处于两种状态之一：空或非空。

Tony Hoare，空值的发明者，在他 2009 年的演讲"空引用：价值十亿美元的错误"中这样说道：

> 我称之为我的十亿美元错误。当时我正在为一门面向对象语言设计第一个全面的引用类型系统。我的目标是确保所有引用的使用都是绝对安全的，由编译器自动执行检查。但我无法抵抗诱惑，加入了空引用，仅仅因为它太容易实现了。这导致了无数的错误、漏洞和系统崩溃，在过去四十年中可能造成了十亿美元的损失。

空值的问题在于，如果你试图将一个空值当作非空值来使用，就会得到某种错误。由于这种空或非空的属性无处不在，犯这类错误极其容易。

然而，空值试图表达的概念仍然是有用的：空值表示一个因某种原因当前无效或不存在的值。

问题其实不在于概念本身，而在于具体的实现方式。因此，Rust 没有空值，但它有一个枚举可以编码值存在或不存在的概念。这个枚举就是 `Option<T>`，它在[标准库中的定义][option]<!-- ignore -->如下：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>` 枚举非常有用，它甚至被包含在了 prelude 中；你不需要显式地将它引入作用域。它的变体也包含在 prelude 中：你可以直接使用 `Some` 和 `None`，而不需要 `Option::` 前缀。`Option<T>` 仍然只是一个普通的枚举，`Some(T)` 和 `None` 仍然是 `Option<T>` 类型的变体。

`<T>` 语法是我们尚未讨论的 Rust 特性。它是一个泛型（generics）类型参数，我们将在第 10 章详细介绍泛型。现在你只需要知道，`<T>` 意味着 `Option` 枚举的 `Some` 变体可以持有任意类型的一个数据，而每个用来替代 `T` 的具体类型都会使整个 `Option<T>` 成为不同的类型。下面是一些使用 `Option` 值来持有数字类型和字符类型的例子：

```rust
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-06-option-examples/src/main.rs:here}}
```

`some_number` 的类型是 `Option<i32>`。`some_char` 的类型是 `Option<char>`，这是一个不同的类型。Rust 可以推断出这些类型，因为我们在 `Some` 变体中指定了值。对于 `absent_number`，Rust 要求我们标注整体的 `Option` 类型：编译器无法仅通过一个 `None` 值来推断对应的 `Some` 变体将持有什么类型。这里我们告诉 Rust，`absent_number` 的类型是 `Option<i32>`。

当我们有一个 `Some` 值时，我们知道值是存在的，并且该值就在 `Some` 中。当我们有一个 `None` 值时，从某种意义上说，它与空值表达的是同一个意思：我们没有一个有效的值。那么，为什么 `Option<T>` 比空值更好呢？

简而言之，因为 `Option<T>` 和 `T`（其中 `T` 可以是任意类型）是不同的类型，编译器不会允许我们将 `Option<T>` 值当作一个确定有效的值来使用。例如，下面的代码无法编译，因为它试图将一个 `i8` 与一个 `Option<i8>` 相加：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch06-enums-and-pattern-matching/no-listing-07-cant-use-option-directly/src/main.rs:here}}
```

运行这段代码，我们会得到类似这样的错误信息：

```console
{{#include ../listings/ch06-enums-and-pattern-matching/no-listing-07-cant-use-option-directly/output.txt}}
```

很严格！实际上，这个错误信息意味着 Rust 不知道如何将 `i8` 和 `Option<i8>` 相加，因为它们是不同的类型。当我们在 Rust 中有一个 `i8` 类型的值时，编译器会确保我们始终拥有一个有效的值。我们可以放心地使用它，而不必在使用前检查是否为空。只有当我们有一个 `Option<i8>`（或者我们正在处理的任何类型的值）时，我们才需要担心可能没有值，而编译器会确保我们在使用该值之前处理了这种情况。

换句话说，在对 `Option<T>` 执行 `T` 的操作之前，你必须先将它转换为 `T`。通常，这有助于捕获空值最常见的问题之一：假设某个值不为空，但实际上它是空的。

消除错误地假设值不为空的风险，让你对代码更有信心。为了拥有一个可能为空的值，你必须显式地将该值的类型设为 `Option<T>` 来选择加入。然后，当你使用该值时，你必须显式地处理值为空的情况。只要一个值的类型不是 `Option<T>`，你就 _可以_ 安全地假设该值不为空。这是 Rust 的一个刻意的设计决策，旨在限制空值的泛滥并提高 Rust 代码的安全性。

那么，当你有一个 `Option<T>` 类型的值时，如何从 `Some` 变体中取出 `T` 值来使用呢？`Option<T>` 枚举有大量在各种场景下都很有用的方法；你可以在[它的文档][docs]<!-- ignore -->中查看。熟悉 `Option<T>` 上的方法将对你的 Rust 之旅非常有帮助。

一般来说，要使用一个 `Option<T>` 值，你需要编写处理每个变体的代码。你需要一些仅在有 `Some(T)` 值时才运行的代码，这些代码可以使用内部的 `T`。你还需要一些仅在有 `None` 值时才运行的代码，这些代码没有可用的 `T` 值。`match` 表达式就是一个与枚举配合使用时能做到这一点的控制流结构：它会根据枚举的不同变体运行不同的代码，并且这些代码可以使用匹配值中的数据。

[IpAddr]: ../std/net/enum.IpAddr.html
[option]: ../std/option/enum.Option.html
[docs]: ../std/option/enum.Option.html
