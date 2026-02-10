## 引用与借用

示例 4-5 中元组代码的问题在于，我们必须将 `String` 返回给调用函数，这样在调用 `calculate_length` 之后才能继续使用这个 `String`，因为 `String` 已经被移动到了 `calculate_length` 中。作为替代，我们可以提供一个指向 `String` 值的引用（reference）。引用类似于指针，它是一个地址，我们可以通过它访问存储在该地址的数据；这些数据由其他变量拥有。与指针不同的是，引用在其生命周期内保证指向某个特定类型的有效值。

下面展示如何定义和使用一个 `calculate_length` 函数，它以对象的引用作为参数，而不是获取值的所有权：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-07-reference/src/main.rs:all}}
```

</Listing>

首先，注意变量声明和函数返回值中所有的元组代码都消失了。其次，注意我们将 `&s1` 传入 `calculate_length`，并且在函数定义中，我们接受的是 `&String` 而不是 `String`。这些 & 符号代表引用，它们允许你引用某个值而不获取其所有权。图 4-6 展示了这个概念。

<img alt="Three tables: the table for s contains only a pointer to the table
for s1. The table for s1 contains the stack data for s1 and points to the
string data on the heap." src="img/trpl04-06.svg" class="center" />

<span class="caption">图 4-6：`&String` `s` 指向 `String` `s1` 的示意图</span>

> 注意：与使用 `&` 进行引用相反的操作是 _解引用_（dereferencing），使用解引用运算符 `*` 来完成。我们将在第 8 章看到解引用运算符的一些用法，并在第 15 章详细讨论解引用的细节。

让我们仔细看看这里的函数调用：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-07-reference/src/main.rs:here}}
```

`&s1` 语法让我们创建一个 _引用_ `s1` 的值但不拥有它的引用。因为引用并不拥有它，所以当引用停止使用时，它所指向的值不会被丢弃。

同样，函数签名使用 `&` 来表明参数 `s` 的类型是一个引用。让我们加一些解释性的注释：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-08-reference-with-annotations/src/main.rs:here}}
```

变量 `s` 有效的作用域与任何函数参数的作用域相同，但当 `s` 停止使用时，引用所指向的值不会被丢弃，因为 `s` 没有所有权。当函数使用引用而不是实际值作为参数时，我们不需要返回值来归还所有权，因为我们从未拥有过所有权。

我们将创建引用的行为称为 _借用_（borrowing）。就像在现实生活中，如果一个人拥有某样东西，你可以从他那里借用。用完之后，你必须归还。你并不拥有它。

那么，如果我们尝试修改借用的内容会怎样呢？试试示例 4-6 中的代码。剧透：这行不通！

<Listing number="4-6" file-name="src/main.rs" caption="尝试修改借用的值">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/listing-04-06/src/main.rs}}
```

</Listing>

这是错误信息：

```console
{{#include ../listings/ch04-understanding-ownership/listing-04-06/output.txt}}
```

正如变量默认是不可变的，引用也是如此。我们不允许修改引用所指向的内容。

### 可变引用

我们可以通过一些小改动来修复示例 4-6 中的代码，使其允许我们修改借用的值，这就是使用 _可变引用_（mutable reference）：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-09-fixes-listing-04-06/src/main.rs}}
```

</Listing>

首先，我们将 `s` 改为 `mut`。然后，在调用 `change` 函数的地方使用 `&mut s` 创建一个可变引用，并更新函数签名以接受一个可变引用 `some_string: &mut String`。这清楚地表明 `change` 函数将会修改它所借用的值。

可变引用有一个很大的限制：如果你有一个值的可变引用，就不能再有该值的其他引用。下面这段尝试创建两个 `s` 的可变引用的代码会失败：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-10-multiple-mut-not-allowed/src/main.rs:here}}
```

</Listing>

这是错误信息：

```console
{{#include ../listings/ch04-understanding-ownership/no-listing-10-multiple-mut-not-allowed/output.txt}}
```

这个错误说明代码是无效的，因为我们不能同时多次将 `s` 作为可变引用借用。第一个可变借用在 `r1` 中，它必须持续到在 `println!` 中使用为止，但在创建这个可变引用和使用它之间，我们又尝试在 `r2` 中创建另一个借用相同数据的可变引用。

这个限制以一种非常受控的方式允许修改，但防止同一数据在同一时间被多个可变引用访问。这是很多 Rust 新手会感到困扰的地方，因为大多数语言允许你随时进行修改。这个限制的好处是 Rust 可以在编译时就防止数据竞争（data race）。_数据竞争_ 类似于竞态条件，当以下三种行为同时发生时就会产生：

- 两个或更多指针同时访问同一数据。
- 至少有一个指针正在写入数据。
- 没有同步数据访问的机制。

数据竞争会导致未定义行为，在运行时尝试追踪它们时可能难以诊断和修复；Rust 通过拒绝编译存在数据竞争的代码来从根本上防止这个问题！

和往常一样，我们可以使用花括号来创建一个新的作用域，从而允许多个可变引用，只是不能 _同时_ 拥有：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-11-muts-in-separate-scopes/src/main.rs:here}}
```

Rust 对组合使用可变引用和不可变引用也有类似的规则。这段代码会产生一个错误：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-12-immutable-and-mutable-not-allowed/src/main.rs:here}}
```

这是错误信息：

```console
{{#include ../listings/ch04-understanding-ownership/no-listing-12-immutable-and-mutable-not-allowed/output.txt}}
```

哇！当我们已经有一个同一值的不可变引用时，我们 _也_ 不能同时拥有该值的可变引用。

不可变引用的使用者不会期望值在他们眼皮底下突然改变！然而，多个不可变引用是允许的，因为仅仅读取数据的人无法影响其他人对数据的读取。

注意，引用的作用域从它被引入的地方开始，一直持续到最后一次使用该引用的地方。例如，下面的代码可以编译，因为不可变引用的最后一次使用是在 `println!` 中，这发生在可变引用被引入之前：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-13-reference-scope-ends/src/main.rs:here}}
```

不可变引用 `r1` 和 `r2` 的作用域在 `println!` 之后结束，也就是它们最后一次被使用的地方，这在可变引用 `r3` 创建之前。这些作用域没有重叠，所以这段代码是允许的：编译器可以判断出引用在作用域结束之前的某个点已经不再被使用了。

尽管借用错误有时可能令人沮丧，但请记住，这是 Rust 编译器在早期（编译时而非运行时）就指出了潜在的 bug，并准确地告诉你问题出在哪里。这样你就不必去追踪为什么你的数据不是你以为的那样了。

### 悬垂引用

在使用指针的语言中，很容易错误地创建一个 _悬垂指针_（dangling pointer）——一个引用了内存中某个位置的指针，而该内存可能已经被释放并分配给了其他人。在 Rust 中，编译器保证引用永远不会成为悬垂引用：如果你持有某些数据的引用，编译器会确保数据不会在引用之前离开作用域。

让我们尝试创建一个悬垂引用，看看 Rust 如何通过编译时错误来防止它：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-14-dangling-reference/src/main.rs}}
```

</Listing>

这是错误信息：

```console
{{#include ../listings/ch04-understanding-ownership/no-listing-14-dangling-reference/output.txt}}
```

这个错误信息涉及一个我们尚未介绍的特性：生命周期（lifetime）。我们将在第 10 章详细讨论生命周期。但是，如果你忽略关于生命周期的部分，这条信息确实包含了这段代码为什么有问题的关键：

```text
this function's return type contains a borrowed value, but there is no value
for it to be borrowed from
```

让我们仔细看看 `dangle` 代码的每个阶段到底发生了什么：

<Listing file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-15-dangling-reference-annotated/src/main.rs:here}}
```

</Listing>

因为 `s` 是在 `dangle` 内部创建的，当 `dangle` 的代码执行完毕时，`s` 将会被释放。但我们尝试返回一个指向它的引用。这意味着这个引用将指向一个无效的 `String`。这可不行！Rust 不会允许我们这样做。

这里的解决方案是直接返回 `String`：

```rust
{{#rustdoc_include ../listings/ch04-understanding-ownership/no-listing-16-no-dangle/src/main.rs:here}}
```

这样就没有任何问题了。所有权被移出，没有任何东西被释放。

### 引用的规则

让我们回顾一下我们讨论过的关于引用的内容：

- 在任意给定时刻，你 _要么_ 只能有一个可变引用，_要么_ 只能有任意数量的不可变引用。
- 引用必须始终有效。

接下来，我们将看看另一种不同类型的引用：切片（slice）。