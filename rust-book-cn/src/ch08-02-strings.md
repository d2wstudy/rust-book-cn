## 使用字符串存储 UTF-8 编码的文本

我们在第四章讨论过字符串，现在来更深入地了解它。Rust 新手通常会在字符串上遇到困难，原因有三：Rust 倾向于暴露可能的错误、字符串这种数据结构比许多程序员想象的更复杂，以及 UTF-8 编码。当你从其他编程语言转过来时，这些因素结合在一起会让人觉得很棘手。

我们在集合的语境下讨论字符串，是因为字符串本质上是字节的集合，外加一些在将这些字节解释为文本时提供有用功能的方法。在本节中，我们将讨论 `String` 上那些每种集合类型都有的操作，比如创建、更新和读取。我们还将讨论 `String` 与其他集合的不同之处，特别是由于人和计算机对 `String` 数据的解读方式不同，对 `String` 进行索引会变得很复杂。

<!-- Old headings. Do not remove or links may break. -->

<a id="what-is-a-string"></a>

### 什么是字符串

我们先来明确"字符串"这个术语的含义。Rust 的核心语言中只有一种字符串类型，即字符串切片（string slice）`str`，通常以借用形式 `&str` 出现。在第四章中，我们讨论过字符串切片，它是对存储在其他地方的 UTF-8 编码字符串数据的引用。例如，字符串字面值存储在程序的二进制文件中，因此它们是字符串切片。

`String` 类型由 Rust 标准库提供，而非内置于核心语言中，它是一种可增长、可变、拥有所有权的 UTF-8 编码字符串类型。当 Rustacean 提到 Rust 中的"字符串"时，他们可能指的是 `String` 或字符串切片 `&str` 类型，而不仅仅是其中一种。虽然本节主要讨论 `String`，但这两种类型在 Rust 标准库中都被大量使用，并且 `String` 和字符串切片都是 UTF-8 编码的。

### 新建字符串

许多可用于 `Vec<T>` 的操作同样适用于 `String`，因为 `String` 实际上是对字节向量的封装，附加了一些额外的保证、限制和功能。一个在 `Vec<T>` 和 `String` 上工作方式相同的函数例子是用于创建实例的 `new` 函数，如示例 8-11 所示。

<Listing number="8-11" caption="新建一个空的 `String`">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-11/src/main.rs:here}}
```

</Listing>

这行代码创建了一个名为 `s` 的新空字符串，之后我们可以向其中加载数据。通常我们会有一些初始数据来初始化字符串。为此，我们使用 `to_string` 方法，该方法可用于任何实现了 `Display` trait 的类型，字符串字面值就实现了该 trait。示例 8-12 展示了两个例子。

<Listing number="8-12" caption="使用 `to_string` 方法从字符串字面值创建 `String`">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-12/src/main.rs:here}}
```

</Listing>

这段代码创建了一个包含 `initial contents` 的字符串。

我们也可以使用 `String::from` 函数从字符串字面值创建 `String`。示例 8-13 中的代码等价于示例 8-12 中使用 `to_string` 的代码。

<Listing number="8-13" caption="使用 `String::from` 函数从字符串字面值创建 `String`">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-13/src/main.rs:here}}
```

</Listing>

因为字符串的用途非常广泛，我们可以使用许多不同的泛型 API 来操作字符串，这给了我们很多选择。其中一些看起来可能是多余的，但它们都有各自的用武之地！在这个例子中，`String::from` 和 `to_string` 做的是同样的事情，所以选择哪个取决于风格和可读性偏好。

请记住，字符串是 UTF-8 编码的，所以我们可以在其中包含任何正确编码的数据，如示例 8-14 所示。

<Listing number="8-14" caption="在字符串中存储不同语言的问候语">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-14/src/main.rs:here}}
```

</Listing>

以上都是有效的 `String` 值。

### 更新字符串

`String` 的大小可以增长，其内容也可以改变，就像 `Vec<T>` 的内容一样——只要向其中推入更多数据即可。此外，你还可以方便地使用 `+` 运算符或 `format!` 宏来拼接 `String` 值。

<!-- Old headings. Do not remove or links may break. -->

<a id="appending-to-a-string-with-push_str-and-push"></a>

#### 使用 `push_str` 或 `push` 追加

我们可以使用 `push_str` 方法来追加一个字符串切片，从而使 `String` 增长，如示例 8-15 所示。

<Listing number="8-15" caption="使用 `push_str` 方法向 `String` 追加字符串切片">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-15/src/main.rs:here}}
```

</Listing>

执行这两行代码后，`s` 将包含 `foobar`。`push_str` 方法接受字符串切片作为参数，因为我们不一定需要获取参数的所有权。例如，在示例 8-16 的代码中，我们希望在将 `s2` 的内容追加到 `s1` 之后仍然能够使用 `s2`。

<Listing number="8-16" caption="将字符串切片的内容追加到 `String` 后继续使用该字符串切片">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-16/src/main.rs:here}}
```

</Listing>

如果 `push_str` 方法获取了 `s2` 的所有权，我们就无法在最后一行打印它的值了。不过，这段代码如我们所期望的那样正常工作！

`push` 方法接受一个单独的字符作为参数，并将其添加到 `String` 中。示例 8-17 使用 `push` 方法向 `String` 添加字母 _l_。

<Listing number="8-17" caption="使用 `push` 向 `String` 值添加一个字符">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-17/src/main.rs:here}}
```

</Listing>

执行后，`s` 将包含 `lol`。

<!-- Old headings. Do not remove or links may break. -->

<a id="concatenation-with-the--operator-or-the-format-macro"></a>

#### 使用 `+` 运算符或 `format!` 宏拼接

通常你会想要将两个已有的字符串组合在一起。一种方法是使用 `+` 运算符，如示例 8-18 所示。

<Listing number="8-18" caption="使用 `+` 运算符将两个 `String` 值组合为一个新的 `String` 值">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-18/src/main.rs:here}}
```

</Listing>

字符串 `s3` 将包含 `Hello, world!`。`s1` 在相加后不再有效的原因，以及我们使用 `s2` 的引用的原因，都与使用 `+` 运算符时调用的方法签名有关。`+` 运算符使用了 `add` 方法，其签名大致如下：

```rust,ignore
fn add(self, s: &str) -> String {
```

在标准库中，你会看到 `add` 是使用泛型和关联类型定义的。这里我们替换为了具体类型，这就是用 `String` 值调用此方法时实际发生的情况。我们将在第十章讨论泛型。这个签名为我们提供了理解 `+` 运算符棘手之处所需的线索。

首先，`s2` 前面有一个 `&`，意味着我们将第二个字符串的引用与第一个字符串相加。这是因为 `add` 函数中的 `s` 参数：我们只能将字符串切片加到 `String` 上，不能将两个 `String` 值直接相加。但是等等——`&s2` 的类型是 `&String`，而不是 `add` 第二个参数所指定的 `&str`。那么为什么示例 8-18 能够编译呢？

我们之所以能在 `add` 调用中使用 `&s2`，是因为编译器可以将 `&String` 参数强制转换（coerce）为 `&str`。当我们调用 `add` 方法时，Rust 使用了解引用强制转换（deref coercion），在这里将 `&s2` 转换为 `&s2[..]`。我们将在第十五章更深入地讨论解引用强制转换。因为 `add` 没有获取 `s` 参数的所有权，所以 `s2` 在此操作后仍然是一个有效的 `String`。

其次，我们可以从签名中看到 `add` 获取了 `self` 的所有权，因为 `self` 前面没有 `&`。这意味着示例 8-18 中的 `s1` 将被移动到 `add` 调用中，之后不再有效。所以，虽然 `let s3 = s1 + &s2;` 看起来像是复制了两个字符串并创建了一个新的，但实际上这条语句获取了 `s1` 的所有权，追加了 `s2` 内容的副本，然后返回结果的所有权。换句话说，它看起来像是做了很多复制，但实际上并没有；这种实现比复制更高效。

如果需要拼接多个字符串，`+` 运算符的行为就变得笨拙了：

```rust
{{#rustdoc_include ../listings/ch08-common-collections/no-listing-01-concat-multiple-strings/src/main.rs:here}}
```

此时 `s` 将是 `tic-tac-toe`。面对这么多 `+` 和 `"` 字符，很难看清到底发生了什么。对于更复杂的字符串组合，我们可以改用 `format!` 宏：

```rust
{{#rustdoc_include ../listings/ch08-common-collections/no-listing-02-format/src/main.rs:here}}
```

这段代码同样将 `s` 设置为 `tic-tac-toe`。`format!` 宏的工作方式类似于 `println!`，但它不是将输出打印到屏幕上，而是返回一个包含内容的 `String`。使用 `format!` 的代码版本更易于阅读，而且 `format!` 宏生成的代码使用引用，因此这个调用不会获取任何参数的所有权。

### 索引字符串

在许多其他编程语言中，通过索引引用字符串中的单个字符是有效且常见的操作。然而，如果你尝试在 Rust 中使用索引语法访问 `String` 的部分内容，你会得到一个错误。请看示例 8-19 中的无效代码。

<Listing number="8-19" caption="尝试对 `String` 使用索引语法">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-19/src/main.rs:here}}
```

</Listing>

这段代码会产生如下错误：

```console
{{#include ../listings/ch08-common-collections/listing-08-19/output.txt}}
```

错误信息说明了一切：Rust 字符串不支持索引。但为什么不支持呢？要回答这个问题，我们需要讨论 Rust 如何在内存中存储字符串。

#### 内部表示

`String` 是对 `Vec<u8>` 的封装。让我们看看示例 8-14 中一些正确编码的 UTF-8 示例字符串。首先是这个：

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-14/src/main.rs:spanish}}
```

在这个例子中，`len` 将是 `4`，这意味着存储字符串 `"Hola"` 的向量长度为 4 字节。这些字母中的每一个在 UTF-8 编码中都占 1 个字节。然而，下面这行可能会让你感到意外（注意这个字符串以大写的西里尔字母 _Ze_ 开头，而不是数字 3）：

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-14/src/main.rs:russian}}
```

如果有人问这个字符串有多长，你可能会说 12。但 Rust 的答案是 24：这是用 UTF-8 编码 "Здравствуйте" 所需的字节数，因为该字符串中的每个 Unicode 标量值都占 2 个字节的存储空间。因此，对字符串字节的索引并不总是能对应到一个有效的 Unicode 标量值。为了说明这一点，请看下面这段无效的 Rust 代码：

```rust,ignore,does_not_compile
let hello = "Здравствуйте";
let answer = &hello[0];
```

你已经知道 `answer` 不会是 `З`，即第一个字母。当用 UTF-8 编码时，`З` 的第一个字节是 `208`，第二个字节是 `151`，所以 `answer` 似乎应该是 `208`，但 `208` 本身并不是一个有效的字符。如果用户请求这个字符串的第一个字母，返回 `208` 很可能不是他们想要的结果；然而，这是 Rust 在字节索引 0 处唯一拥有的数据。用户通常不希望得到字节值，即使字符串只包含拉丁字母也是如此：如果 `&"hi"[0]` 是有效代码并返回字节值，它将返回 `104`，而不是 `h`。

因此，答案是：为了避免返回意外的值并导致可能不会立即被发现的 bug，Rust 根本不编译这段代码，从而在开发过程的早期就防止了误解。

<!-- Old headings. Do not remove or links may break. -->

<a id="bytes-and-scalar-values-and-grapheme-clusters-oh-my"></a>

#### 字节、标量值和字形簇

关于 UTF-8 的另一个要点是，从 Rust 的角度来看，实际上有三种相关的方式来理解字符串：字节、标量值和字形簇（grapheme clusters，最接近我们所说的"字母"的概念）。

如果我们看用天城文书写的印地语单词 "नमस्ते"，它以 `u8` 值的向量形式存储，看起来像这样：

```text
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164,
224, 165, 135]
```

这是 18 个字节，也是计算机最终存储这些数据的方式。如果我们将它们视为 Unicode 标量值——也就是 Rust 的 `char` 类型所表示的——这些字节看起来像这样：

```text
['न', 'म', 'स', '्', 'त', 'े']
```

这里有六个 `char` 值，但第四个和第六个不是字母：它们是单独存在时没有意义的变音符号。最后，如果我们将它们视为字形簇，就会得到一个人所认为的组成这个印地语单词的四个字母：

```text
["न", "म", "स्", "ते"]
```

Rust 提供了不同的方式来解释计算机存储的原始字符串数据，这样每个程序都可以选择它所需要的解释方式，无论数据使用的是哪种人类语言。

Rust 不允许我们通过索引 `String` 来获取字符的最后一个原因是，索引操作预期总是花费常数时间（O(1)）。但对于 `String`，无法保证这样的性能，因为 Rust 必须从头遍历内容到索引位置，以确定有多少个有效字符。

### 字符串切片

对字符串进行索引通常不是一个好主意，因为字符串索引操作应该返回什么类型并不明确：是字节值、字符、字形簇还是字符串切片。因此，如果你确实需要使用索引来创建字符串切片，Rust 要求你更加明确。

与其使用 `[]` 配合单个数字进行索引，你可以使用 `[]` 配合一个范围来创建包含特定字节的字符串切片：

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

这里，`s` 将是一个 `&str`，包含字符串的前 4 个字节。前面我们提到过，这些字符每个占 2 个字节，这意味着 `s` 将是 `Зд`。

如果我们尝试只截取一个字符的部分字节，比如 `&hello[0..1]`，Rust 会在运行时 panic，就像访问向量中的无效索引一样：

```console
{{#include ../listings/ch08-common-collections/output-only-01-not-char-boundary/output.txt}}
```

使用范围创建字符串切片时应当谨慎，因为这样做可能会导致程序崩溃。

<!-- Old headings. Do not remove or links may break. -->

<a id="methods-for-iterating-over-strings"></a>

### 遍历字符串

操作字符串片段的最佳方式是明确表示你想要的是字符还是字节。对于单个 Unicode 标量值，使用 `chars` 方法。对 "Зд" 调用 `chars` 会分离出并返回两个 `char` 类型的值，你可以遍历结果来访问每个元素：

```rust
for c in "Зд".chars() {
    println!("{c}");
}
```

这段代码将打印如下内容：

```text
З
д
```

另外，`bytes` 方法返回每个原始字节，这在某些场景下可能更合适：

```rust
for b in "Зд".bytes() {
    println!("{b}");
}
```

这段代码将打印组成这个字符串的 4 个字节：

```text
208
151
208
180
```

但请务必记住，有效的 Unicode 标量值可能由多个字节组成。

从字符串中获取字形簇（如天城文）是很复杂的，因此标准库没有提供这个功能。如果你需要这个功能，可以在 [crates.io](https://crates.io/)<!-- ignore --> 上找到相关的 crate。

<!-- Old headings. Do not remove or links may break. -->

<a id="strings-are-not-so-simple"></a>

### 字符串并不简单

总而言之，字符串是复杂的。不同的编程语言在如何向程序员呈现这种复杂性方面做出了不同的选择。Rust 选择将正确处理 `String` 数据作为所有 Rust 程序的默认行为，这意味着程序员必须在前期投入更多精力来处理 UTF-8 数据。这种权衡暴露了比其他编程语言中更多的字符串复杂性，但它可以防止你在开发后期处理涉及非 ASCII 字符的错误。

好消息是，标准库基于 `String` 和 `&str` 类型提供了大量功能来帮助正确处理这些复杂情况。请务必查阅文档，了解诸如用于在字符串中搜索的 `contains` 和用于将字符串的一部分替换为另一个字符串的 `replace` 等实用方法。

让我们转向一个稍微简单一点的话题：哈希 map！
