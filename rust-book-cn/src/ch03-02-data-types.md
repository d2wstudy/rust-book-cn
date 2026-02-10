## 数据类型

Rust 中的每一个值都属于某种**数据类型**（data type），这告诉 Rust 数据的具体形式，从而让它知道如何处理这些数据。我们将介绍两大类数据类型：标量类型和复合类型。

请记住，Rust 是一门**静态类型**（statically typed）语言，这意味着在编译期就必须知道所有变量的类型。编译器通常可以根据值及其使用方式推断出我们想要的类型。当存在多种可能的类型时，比如第 2 章["比较猜测的数字与秘密数字"][comparing-the-guess-to-the-secret-number]<!-- ignore -->部分中使用 `parse` 将 `String` 转换为数值类型时，就必须添加类型注解，像这样：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

如果不添加上面代码中的 `: u32` 类型注解，Rust 会显示如下错误，表示编译器需要更多信息来确定我们想使用哪种类型：

```console
{{#include ../listings/ch03-common-programming-concepts/output-only-01-no-type-annotations/output.txt}}
```

后续你会看到其他数据类型的各种类型注解。

### 标量类型

**标量**（scalar）类型表示单个值。Rust 有四种基本的标量类型：整数、浮点数、布尔值和字符。你可能在其他编程语言中见过它们。下面来看看它们在 Rust 中是如何工作的。

#### 整数类型

**整数**（integer）是没有小数部分的数字。我们在第 2 章使用过一种整数类型 `u32`。这个类型声明表明，它关联的值应该是一个占用 32 位空间的无符号整数（有符号整数类型以 `i` 开头，而不是 `u`）。表 3-1 展示了 Rust 内置的整数类型。我们可以使用其中任何一种来声明整数值的类型。

<span class="caption">表 3-1：Rust 中的整数类型</span>

| 长度 | 有符号 | 无符号 |
| ------- | ------- | -------- |
| 8 位 | `i8` | `u8` |
| 16 位 | `i16` | `u16` |
| 32 位 | `i32` | `u32` |
| 64 位 | `i64` | `u64` |
| 128 位 | `i128` | `u128` |
| 取决于架构 | `isize` | `usize` |

每种变体要么是有符号的，要么是无符号的，并且有明确的大小。**有符号**和**无符号**指的是数字是否可能为负数——换句话说，数字是否需要带一个符号（有符号），还是只会是正数因而可以不带符号来表示（无符号）。这就像在纸上写数字一样：当符号很重要时，数字会带上加号或减号；而当可以确定数字是正数时，就不需要写符号。有符号数使用[二进制补码][twos-complement]<!-- ignore -->表示法存储。

每种有符号变体可以存储从 −(2<sup>n − 1</sup>) 到 2<sup>n − 1</sup> − 1 的数字（含两端），其中 *n* 是该变体使用的位数。因此 `i8` 可以存储从 −(2<sup>7</sup>) 到 2<sup>7</sup> − 1 的数字，即 −128 到 127。无符号变体可以存储从 0 到 2<sup>n</sup> − 1 的数字，所以 `u8` 可以存储从 0 到 2<sup>8</sup> − 1 的数字，即 0 到 255。

此外，`isize` 和 `usize` 类型取决于程序运行所在计算机的架构：在 64 位架构上是 64 位，在 32 位架构上是 32 位。

你可以用表 3-2 中所示的任何形式来编写整数字面量。注意，可以是多种数值类型的字面量允许添加类型后缀来指定类型，例如 `57u8`。数字字面量还可以使用 `_` 作为视觉分隔符以便于阅读，例如 `1_000`，它与 `1000` 的值相同。

<span class="caption">表 3-2：Rust 中的整数字面量</span>

| 数字字面量 | 示例 |
| ---------------- | ------------- |
| 十进制 | `98_222` |
| 十六进制 | `0xff` |
| 八进制 | `0o77` |
| 二进制 | `0b1111_0000` |
| 字节（仅限 `u8`） | `b'A'` |

那么如何知道该使用哪种整数类型呢？如果你不确定，Rust 的默认值通常是不错的起点：整数类型默认为 `i32`。需要使用 `isize` 或 `usize` 的主要场景是对某种集合进行索引。

> ##### 整数溢出
>
> 假设你有一个 `u8` 类型的变量，它可以存储 0 到 255 之间的值。如果你试图将变量改为超出该范围的值，比如 256，就会发生**整数溢出**（integer overflow），这可能导致两种行为之一。在调试模式下编译时，Rust 会包含整数溢出检查，如果发生溢出，程序会在运行时 panic。Rust 使用 *panicking* 这个术语来表示程序因错误而退出；我们将在第 9 章的["用 `panic!` 处理不可恢复的错误"][unrecoverable-errors-with-panic]<!-- ignore -->部分更深入地讨论 panic。
>
> 在使用 `--release` 标志的发布模式下编译时，Rust **不会**包含导致 panic 的整数溢出检查。相反，如果发生溢出，Rust 会执行**二进制补码环绕**（two's complement wrapping）。简而言之，超过类型最大值的值会"环绕"到该类型能容纳的最小值。以 `u8` 为例，值 256 变为 0，值 257 变为 1，依此类推。程序不会 panic，但变量的值可能不是你期望的。依赖整数溢出的环绕行为被视为一种错误。
>
> 要显式处理溢出的可能性，可以使用标准库为基本数值类型提供的以下系列方法：
>
> - 使用 `wrapping_*` 方法在所有模式下进行环绕运算，例如 `wrapping_add`。
> - 使用 `checked_*` 方法，如果发生溢出则返回 `None` 值。
> - 使用 `overflowing_*` 方法，返回值和一个表示是否发生溢出的布尔值。
> - 使用 `saturating_*` 方法，在值的最小值或最大值处饱和。

#### 浮点类型

Rust 还有两种基本的**浮点数**（floating-point number）类型，即带小数点的数字。Rust 的浮点类型是 `f32` 和 `f64`，分别占 32 位和 64 位。默认类型是 `f64`，因为在现代 CPU 上，它的速度与 `f32` 大致相同，但精度更高。所有浮点类型都是有符号的。

下面是一个展示浮点数用法的示例：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-06-floating-point/src/main.rs}}
```

浮点数按照 IEEE-754 标准表示。

#### 数值运算

Rust 支持所有数值类型的基本数学运算：加法、减法、乘法、除法和取余。整数除法会向零截断到最接近的整数。下面的代码展示了如何在 `let` 语句中使用各种数值运算：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-07-numeric-operations/src/main.rs}}
```

这些语句中的每个表达式都使用了一个数学运算符，并求值为一个单独的值，然后绑定到一个变量上。[附录 B][appendix_b]<!-- ignore --> 包含了 Rust 提供的所有运算符的列表。

#### 布尔类型

与大多数其他编程语言一样，Rust 中的布尔类型有两个可能的值：`true` 和 `false`。布尔值占一个字节。Rust 中的布尔类型用 `bool` 表示。例如：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-08-boolean/src/main.rs}}
```

使用布尔值的主要方式是通过条件判断，例如 `if` 表达式。我们将在["控制流"][control-flow]<!-- ignore -->部分介绍 `if` 表达式在 Rust 中的工作方式。

#### 字符类型

Rust 的 `char` 类型是语言中最基本的字母类型。下面是一些声明 `char` 值的示例：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-09-char/src/main.rs}}
```

注意，我们用单引号指定 `char` 字面量，而字符串字面量使用双引号。Rust 的 `char` 类型占 4 个字节，表示一个 Unicode 标量值，这意味着它能表示的远不止 ASCII。带重音的字母、中文、日文和韩文字符、emoji 以及零宽空格在 Rust 中都是有效的 `char` 值。Unicode 标量值的范围是 `U+0000` 到 `U+D7FF` 和 `U+E000` 到 `U+10FFFF`（含两端）。不过，"字符"在 Unicode 中并不是一个真正的概念，所以你对"字符"的直觉理解可能与 Rust 中 `char` 的含义不完全一致。我们将在第 8 章的["使用字符串存储 UTF-8 编码的文本"][strings]<!-- ignore -->中详细讨论这个话题。

### 复合类型

**复合类型**（compound type）可以将多个值组合成一个类型。Rust 有两种基本的复合类型：元组和数组。

#### 元组类型

**元组**（tuple）是将多个不同类型的值组合成一个复合类型的通用方式。元组有固定的长度：一旦声明，就不能增长或缩小。

我们通过在圆括号内写一个逗号分隔的值列表来创建元组。元组中每个位置都有一个类型，各个值的类型不必相同。下面的示例中我们添加了可选的类型注解：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-10-tuples/src/main.rs}}
```

变量 `tup` 绑定到整个元组，因为元组被视为单个复合元素。要从元组中获取各个值，可以使用模式匹配来解构元组值，像这样：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-11-destructuring-tuples/src/main.rs}}
```

这个程序首先创建一个元组并将其绑定到变量 `tup`。然后使用 `let` 和一个模式将 `tup` 拆分为三个独立的变量 `x`、`y` 和 `z`。这叫做**解构**（destructuring），因为它将单个元组拆成了三个部分。最后，程序打印出 `y` 的值，即 `6.4`。

我们也可以通过句点（`.`）后跟要访问的值的索引来直接访问元组元素。例如：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-12-tuple-indexing/src/main.rs}}
```

这个程序创建了元组 `x`，然后使用各自的索引访问元组的每个元素。与大多数编程语言一样，元组的第一个索引是 0。

没有任何值的元组有一个特殊的名字叫**单元**（unit）。这个值及其对应的类型都写作 `()`，表示一个空值或空的返回类型。如果表达式不返回任何其他值，就会隐式返回单元值。

#### 数组类型

另一种包含多个值的集合是**数组**（array）。与元组不同，数组中的每个元素必须是相同的类型。与某些其他语言中的数组不同，Rust 中的数组长度是固定的。

我们将值写在方括号内，用逗号分隔，来创建数组：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-13-arrays/src/main.rs}}
```

当你希望数据分配在栈上而不是堆上时（我们将在[第 4 章][stack-and-heap]<!-- ignore -->更详细地讨论栈和堆），或者当你希望确保始终有固定数量的元素时，数组非常有用。不过数组不如 vector 类型灵活。vector 是标准库提供的类似集合类型，它**可以**增长或缩小，因为其内容存储在堆上。如果你不确定该用数组还是 vector，大概率应该使用 vector。[第 8 章][vectors]<!-- ignore -->会更详细地讨论 vector。

然而，当你知道元素数量不需要改变时，数组更加实用。例如，如果你在程序中使用月份名称，你可能会使用数组而不是 vector，因为你知道它总是包含 12 个元素：

```rust
let months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
```

数组类型的写法是在方括号内写上每个元素的类型、一个分号，然后是数组中元素的数量，像这样：

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

这里 `i32` 是每个元素的类型。分号后面的数字 `5` 表示数组包含五个元素。

你也可以通过指定初始值、一个分号和数组长度（放在方括号内）来初始化一个所有元素都相同的数组，如下所示：

```rust
let a = [3; 5];
```

名为 `a` 的数组将包含 `5` 个元素，所有元素的初始值都是 `3`。这与写 `let a = [3, 3, 3, 3, 3];` 效果相同，只是更简洁。

<!-- Old headings. Do not remove or links may break. -->
<a id="accessing-array-elements"></a>

#### 访问数组元素

数组是一块已知固定大小的连续内存，可以分配在栈上。你可以使用索引来访问数组的元素，像这样：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-14-array-indexing/src/main.rs}}
```

在这个例子中，名为 `first` 的变量将获得值 `1`，因为这是数组中索引 `[0]` 处的值。名为 `second` 的变量将从数组中索引 `[1]` 处获得值 `2`。

#### 无效的数组元素访问

让我们看看如果你尝试访问超出数组末尾的元素会发生什么。假设你运行以下代码，类似于第 2 章的猜数字游戏，从用户那里获取一个数组索引：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,panics
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-15-invalid-array-access/src/main.rs}}
```

这段代码编译成功。如果你使用 `cargo run` 运行并输入 `0`、`1`、`2`、`3` 或 `4`，程序会打印出数组中对应索引处的值。如果你输入一个超出数组末尾的数字，比如 `10`，你会看到类似这样的输出：

<!-- manual-regeneration
cd listings/ch03-common-programming-concepts/no-listing-15-invalid-array-access
cargo run
10
-->

```console
thread 'main' panicked at src/main.rs:19:19:
index out of bounds: the len is 5 but the index is 10
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

程序在索引操作中使用无效值时产生了运行时错误。程序以错误信息退出，没有执行最后的 `println!` 语句。当你尝试使用索引访问元素时，Rust 会检查你指定的索引是否小于数组长度。如果索引大于或等于数组长度，Rust 会 panic。这个检查必须在运行时进行，尤其是在这种情况下，因为编译器不可能知道用户稍后运行代码时会输入什么值。

这是 Rust 内存安全原则的一个实际体现。在许多底层语言中，这种检查不会执行，当你提供一个不正确的索引时，可能会访问到无效的内存。Rust 通过立即退出而不是允许内存访问并继续执行来保护你免受这类错误的影响。第 9 章将更多地讨论 Rust 的错误处理，以及如何编写既不会 panic 也不会允许无效内存访问的可读、安全的代码。

[comparing-the-guess-to-the-secret-number]: ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[twos-complement]: https://en.wikipedia.org/wiki/Two%27s_complement
[control-flow]: ch03-05-control-flow.html#control-flow
[strings]: ch08-02-strings.html#storing-utf-8-encoded-text-with-strings
[stack-and-heap]: ch04-01-what-is-ownership.html#the-stack-and-the-heap
[vectors]: ch08-01-vectors.html
[unrecoverable-errors-with-panic]: ch09-01-unrecoverable-errors-with-panic.html
[appendix_b]: appendix-02-operators.md
