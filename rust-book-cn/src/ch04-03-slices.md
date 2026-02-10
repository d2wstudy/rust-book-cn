## 切片类型

切片（slice）允许你引用一个[集合](ch08-00-common-collections.md)<!-- ignore -->中连续的元素序列。切片是一种引用，因此它没有所有权。

这里有一个小的编程问题：编写一个函数，该函数接受一个由空格分隔的单词组成的字符串，并返回在该字符串中找到的第一个单词。如果函数在字符串中没有找到空格，则整个字符串一定是一个单词，此时应返回整个字符串。

> 注意：为了介绍切片，本节假设只处理 ASCII 字符；关于 UTF-8 处理的更全面讨论，请参阅第 8 章的["使用字符串存储 UTF-8 编码的文本"][strings]<!-- ignore -->部分。

让我们来思考一下，在不使用切片的情况下，这个函数的签名应该怎么写，以此来理解切片将要解决的问题：

```rust,ignore
fn first_word(s: &String) -> ?
```

`first_word` 函数有一个类型为 `&String` 的参数。我们不需要所有权，所以这样做没问题。（在惯用的 Rust 中，函数不会获取其参数的所有权，除非确实需要，其原因会随着我们继续学习而变得清晰。）但是我们应该返回什么呢？我们实际上没有办法表达字符串的*一部分*。不过，我们可以返回单词末尾的索引，即空格所在的位置。让我们试试这个方法，如示例 4-7 所示。

<Listing number="4-7" file-name="src/main.rs" caption="返回 `String` 参数的字节索引值的 `first_word` 函数">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-07/src/main.rs:here}}
```

</Listing>

因为我们需要逐个检查 `String` 中的元素来判断某个值是否为空格，所以我们使用 `as_bytes` 方法将 `String` 转换为字节数组。

```rust,ignore
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-07/src/main.rs:as_bytes}}
```

接下来，我们使用 `iter` 方法在字节数组上创建一个迭代器：

```rust,ignore
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-07/src/main.rs:iter}}
```

我们将在[第 13 章][ch13]<!-- ignore -->中更详细地讨论迭代器。现在只需要知道，`iter` 是一个返回集合中每个元素的方法，而 `enumerate` 会包装 `iter` 的结果，将每个元素作为元组的一部分返回。`enumerate` 返回的元组中，第一个元素是索引，第二个元素是对集合元素的引用。这比我们自己计算索引要方便一些。

因为 `enumerate` 方法返回一个元组，我们可以使用模式来解构该元组。我们将在[第 6 章][ch6]<!-- ignore -->中更详细地讨论模式。在 `for` 循环中，我们指定了一个模式，其中 `i` 是元组中的索引，`&item` 是元组中的单个字节。因为我们从 `.iter().enumerate()` 中获得的是元素的引用，所以在模式中使用了 `&`。

在 `for` 循环内部，我们使用字节字面量语法来搜索代表空格的字节。如果找到了空格，就返回该位置。否则，使用 `s.len()` 返回字符串的长度。

```rust,ignore
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-07/src/main.rs:inside_for}}
```

现在我们有了一种方法来找出字符串中第一个单词末尾的索引，但有一个问题。我们返回的是一个独立的 `usize`，但它只在 `&String` 的上下文中才有意义。换句话说，因为它是一个与 `String` 分离的值，所以无法保证它在将来仍然有效。考虑一下示例 4-8 中的程序，它使用了示例 4-7 中的 `first_word` 函数。

<Listing number="4-8" file-name="src/main.rs" caption="存储调用 `first_word` 函数的结果，然后更改 `String` 的内容">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-08/src/main.rs:here}}
```

</Listing>

这个程序编译时不会产生任何错误，而且如果我们在调用 `s.clear()` 之后使用 `word`，也同样不会报错。因为 `word` 与 `s` 的状态完全没有关联，`word` 仍然包含值 `5`。我们可以尝试用值 `5` 配合变量 `s` 来提取第一个单词，但这将是一个 bug，因为自从我们将 `5` 保存到 `word` 之后，`s` 的内容已经改变了。

不得不担心 `word` 中的索引与 `s` 中的数据不同步，这既繁琐又容易出错！如果我们再编写一个 `second_word` 函数，管理这些索引会更加脆弱。它的签名将不得不是这样的：

```rust,ignore
fn second_word(s: &String) -> (usize, usize) {
```

现在我们要跟踪一个起始索引*和*一个结束索引，而且我们有更多从特定状态的数据中计算出来、却完全不与该状态绑定的值。我们有三个不相关的变量需要保持同步。

幸运的是，Rust 为这个问题提供了一个解决方案：字符串切片。

### 字符串切片

字符串切片（string slice）是对 `String` 中连续元素序列的引用，它看起来像这样：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-17-slice/src/main.rs:here}}
```

`hello` 不是对整个 `String` 的引用，而是对 `String` 的一部分的引用，通过额外的 `[0..5]` 部分来指定。我们使用方括号内的范围 `[starting_index..ending_index]` 来创建切片，其中 _`starting_index`_ 是切片中的第一个位置，_`ending_index`_ 是切片中最后一个位置加一。在内部，切片数据结构存储了切片的起始位置和长度，长度对应于 _`ending_index`_ 减去 _`starting_index`_。因此，对于 `let world = &s[6..11];`，`world` 将是一个切片，包含一个指向 `s` 索引 6 处字节的指针，长度值为 `5`。

图 4-7 用图表展示了这一点。

<img alt="Three tables: a table representing the stack data of s, which points
to the byte at index 0 in a table of the string data &quot;hello world&quot; on
the heap. The third table represents the stack data of the slice world, which
has a length value of 5 and points to byte 6 of the heap data table."
src="img/trpl04-07.svg" class="center" style="width: 50%;" />

<span class="caption">图 4-7：引用 `String` 一部分的字符串切片</span>

使用 Rust 的 `..` 范围语法，如果你想从索引 0 开始，可以省略两个点号之前的值。换句话说，以下两种写法是等价的：

```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```

同样地，如果切片包含 `String` 的最后一个字节，可以省略尾部的数字。这意味着以下两种写法是等价的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[3..len];
let slice = &s[3..];
```

你也可以同时省略两个值来获取整个字符串的切片。因此，以下两种写法是等价的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &s[..];
```

> 注意：字符串切片的范围索引必须落在有效的 UTF-8 字符边界上。如果你尝试在一个多字节字符的中间创建字符串切片，程序将会报错退出。

了解了这些信息之后，让我们重写 `first_word` 来返回一个切片。表示"字符串切片"的类型写作 `&str`：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-18-first-word-slice/src/main.rs:here}}
```

</Listing>

我们用与示例 4-7 相同的方式获取单词末尾的索引，即查找第一个空格的出现位置。当找到一个空格时，我们使用字符串的起始位置和空格的索引作为起始和结束索引来返回一个字符串切片。

现在当我们调用 `first_word` 时，会得到一个与底层数据绑定的单一值。这个值由切片起始点的引用和切片中元素的数量组成。

返回切片同样适用于 `second_word` 函数：

```rust,ignore
fn second_word(s: &String) -> &str {
```

我们现在有了一个简洁明了的 API，而且更不容易出错，因为编译器会确保对 `String` 的引用始终有效。还记得示例 4-8 中的那个 bug 吗？当时我们获取了第一个单词末尾的索引，然后清空了字符串，导致索引失效。那段代码在逻辑上是不正确的，但并没有立即显示任何错误。如果我们继续尝试对一个已清空的字符串使用第一个单词的索引，问题才会在后面暴露出来。切片使这种 bug 变得不可能发生，并且能让我们更早地发现代码中的问题。使用切片版本的 `first_word` 会抛出一个编译时错误：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-19-slice-error/src/main.rs:here}}
```

</Listing>

这是编译器错误：

```console
{{#include ../listings/ch04-understanding-ownership/no-listing-19-slice-error/output.txt}}
```

回忆一下借用规则：如果我们持有某个值的不可变引用，就不能同时获取它的可变引用。因为 `clear` 需要截断 `String`，它需要获取一个可变引用。`clear` 调用之后的 `println!` 使用了 `word` 中的引用，所以不可变引用在那个时刻必须仍然有效。Rust 不允许 `clear` 中的可变引用和 `word` 中的不可变引用同时存在，因此编译失败。Rust 不仅使我们的 API 更易于使用，还在编译时消除了一整类错误！

<!-- Old headings. Do not remove or links may break. -->

<a id="string-literals-are-slices"></a>

#### 字符串字面量即切片

回忆一下我们之前提到过字符串字面量被存储在二进制文件中。现在我们了解了切片，就可以正确地理解字符串字面量了：

```rust
let s = "Hello, world!";
```

这里 `s` 的类型是 `&str`：它是一个指向二进制文件中特定位置的切片。这也是字符串字面量不可变的原因；`&str` 是一个不可变引用。

#### 字符串切片作为参数

知道了可以对字面量和 `String` 值取切片之后，我们可以对 `first_word` 做进一步改进，那就是它的签名：

```rust,ignore
fn first_word(s: &String) -> &str {
```

更有经验的 Rustacean 会编写如示例 4-9 所示的签名，因为它允许我们对 `&String` 值和 `&str` 值使用同一个函数。

<Listing number="4-9" caption="通过将 `s` 参数的类型改为字符串切片来改进 `first_word` 函数">

```rust,ignore
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-09/src/main.rs:here}}
```

</Listing>

如果我们有一个字符串切片，可以直接传递它。如果我们有一个 `String`，可以传递该 `String` 的切片或对 `String` 的引用。这种灵活性利用了 deref 强制转换（deref coercions）的特性，我们将在第 15 章的["在函数和方法中使用 Deref 强制转换"][deref-coercions]<!-- ignore -->部分介绍。

将函数定义为接受字符串切片而不是 `String` 的引用，可以使我们的 API 更加通用和实用，同时不会损失任何功能：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-09/src/main.rs:usage}}
```

</Listing>

### 其他切片

字符串切片，正如你所想的，是专门针对字符串的。但还有一种更通用的切片类型。考虑这个数组：

```rust
let a = [1, 2, 3, 4, 5];
```

就像我们可能想引用字符串的一部分一样，我们也可能想引用数组的一部分。我们可以这样做：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```

这个切片的类型是 `&[i32]`。它的工作方式与字符串切片相同，通过存储对第一个元素的引用和一个长度来实现。你会在各种其他集合中使用这种切片。我们将在第 8 章讨论 vector 时详细介绍这些集合。

## 总结

所有权、借用和切片这些概念确保了 Rust 程序在编译时的内存安全。Rust 语言让你像其他系统编程语言一样控制内存使用，但数据的所有者在离开作用域时自动清理数据，这意味着你不必编写和调试额外的代码来实现这种控制。

所有权影响着 Rust 许多其他部分的工作方式，因此我们将在本书的其余部分继续讨论这些概念。让我们进入第 5 章，看看如何将多个数据组合到一个 `struct` 中。

[ch13]: ch13-02-iterators.html
[ch6]: ch06-02-match.html#patterns-that-bind-to-values
[strings]: ch08-02-strings.html#storing-utf-8-encoded-text-with-strings
[deref-coercions]: ch15-02-deref.html#using-deref-coercions-in-functions-and-methods
