## 函数

函数在 Rust 代码中非常普遍。你已经见过了语言中最重要的函数之一：`main` 函数，它是许多程序的入口点。你也见过 `fn` 关键字，它用来声明新函数。

Rust 代码中的函数和变量名使用 _snake case_ 作为惯例风格，即所有字母都是小写并使用下划线分隔单词。下面是一个包含函数定义示例的程序：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-16-functions/src/main.rs}}
```

在 Rust 中定义函数，需要输入 `fn` 后跟函数名和一对圆括号。花括号告诉编译器函数体在哪里开始和结束。

我们可以通过输入函数名后跟一对圆括号来调用已定义的任何函数。因为 `another_function` 已经在程序中定义了，所以可以在 `main` 函数内部调用它。注意，我们在源代码中将 `another_function` 定义在 `main` 函数**之后**；当然也可以定义在它之前。Rust 不关心你在哪里定义函数，只要它们定义在调用者可见的作用域内就行。

让我们新建一个名为 _functions_ 的二进制项目来进一步探索函数。将 `another_function` 的示例放入 _src/main.rs_ 中并运行。你应该会看到如下输出：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-16-functions/output.txt}}
```

这些行按照它们在 `main` 函数中出现的顺序执行。首先打印 "Hello, world!" 消息，然后调用 `another_function` 并打印它的消息。

### 参数

我们可以定义带有**参数**（parameters）的函数，参数是作为函数签名一部分的特殊变量。当函数有参数时，你可以为这些参数提供具体的值。严格来说，这些具体的值叫做**实参**（arguments），但在日常交流中，人们倾向于将**形参**（parameter）和**实参**（argument）这两个词互换使用，既可以指函数定义中的变量，也可以指调用函数时传入的具体值。

在这个版本的 `another_function` 中，我们添加了一个参数：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-17-functions-with-parameters/src/main.rs}}
```

尝试运行这个程序；你应该会得到如下输出：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-17-functions-with-parameters/output.txt}}
```

`another_function` 的声明有一个名为 `x` 的参数。`x` 的类型被指定为 `i32`。当我们将 `5` 传入 `another_function` 时，`println!` 宏会将 `5` 放在格式字符串中包含 `x` 的那对花括号的位置。

在函数签名中，你**必须**声明每个参数的类型。这是 Rust 设计中的一个刻意决定：要求在函数定义中标注类型意味着编译器几乎不需要你在代码的其他地方使用类型标注来推断你指的是什么类型。如果编译器知道函数期望的类型，它还能给出更有帮助的错误信息。

当定义多个参数时，用逗号分隔各个参数声明，像这样：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-18-functions-with-multiple-parameters/src/main.rs}}
```

这个示例创建了一个名为 `print_labeled_measurement` 的函数，它有两个参数。第一个参数名为 `value`，类型是 `i32`。第二个参数名为 `unit_label`，类型是 `char`。然后该函数打印包含 `value` 和 `unit_label` 的文本。

让我们尝试运行这段代码。将你的 _functions_ 项目的 _src/main.rs_ 文件中的程序替换为上面的示例，然后使用 `cargo run` 运行：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-18-functions-with-multiple-parameters/output.txt}}
```

因为我们调用函数时将 `5` 作为 `value` 的值，将 `'h'` 作为 `unit_label` 的值，所以程序输出包含了这些值。

### 语句和表达式

函数体由一系列语句（statements）组成，并可以选择以一个表达式（expression）结尾。到目前为止，我们介绍的函数还没有包含结尾表达式，但你已经见过作为语句一部分的表达式了。因为 Rust 是一门基于表达式的语言，所以理解这一区别很重要。其他语言没有同样的区分，所以让我们来看看什么是语句和表达式，以及它们的区别如何影响函数体。

- **语句**（Statements）是执行某些操作但不返回值的指令。
- **表达式**（Expressions）会计算并产生一个值。

让我们来看一些例子。

实际上我们已经使用过语句和表达式了。使用 `let` 关键字创建变量并为其赋值就是一条语句。在示例 3-1 中，`let y = 6;` 就是一条语句。

<Listing number="3-1" file-name="src/main.rs" caption="包含一条语句的 `main` 函数声明">

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/listing-03-01/src/main.rs}}
```

</Listing>

函数定义也是语句；上面的整个示例本身就是一条语句。（不过我们很快会看到，调用函数**不是**语句。）

语句不返回值。因此，你不能将一条 `let` 语句赋值给另一个变量，就像下面的代码尝试做的那样；你会得到一个错误：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-19-statements-vs-expressions/src/main.rs}}
```

运行这个程序时，你会得到如下错误：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-19-statements-vs-expressions/output.txt}}
```

`let y = 6` 语句不返回值，所以 `x` 没有可以绑定的东西。这与其他语言中的行为不同，比如 C 和 Ruby，在那些语言中赋值会返回所赋的值。在那些语言中，你可以写 `x = y = 6`，使 `x` 和 `y` 都拥有值 `6`；但在 Rust 中不是这样的。

表达式会计算出一个值，并且构成了你在 Rust 中编写的大部分代码。考虑一个数学运算，比如 `5 + 6`，这是一个计算结果为 `11` 的表达式。表达式可以是语句的一部分：在示例 3-1 中，语句 `let y = 6;` 中的 `6` 就是一个计算结果为 `6` 的表达式。调用函数是一个表达式。调用宏是一个表达式。用花括号创建的新作用域块也是一个表达式，例如：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-20-blocks-are-expressions/src/main.rs}}
```

这个表达式：

```rust,ignore
{
    let x = 3;
    x + 1
}
```

是一个代码块，在这个例子中，它的计算结果为 `4`。这个值作为 `let` 语句的一部分绑定到 `y` 上。注意 `x + 1` 这一行末尾没有分号，这与你目前见过的大多数代码行不同。表达式不包含结尾的分号。如果你在表达式末尾加上分号，它就变成了语句，而语句不会返回值。在接下来探索函数返回值和表达式时，请记住这一点。

### 带返回值的函数

函数可以向调用它的代码返回值。我们不需要为返回值命名，但必须在箭头（`->`）后面声明它的类型。在 Rust 中，函数的返回值等同于函数体最后一个表达式的值。你可以使用 `return` 关键字并指定一个值来提前从函数返回，但大多数函数隐式地返回最后一个表达式。下面是一个返回值的函数示例：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-21-function-return-values/src/main.rs}}
```

`five` 函数中没有函数调用、宏调用，甚至没有 `let` 语句——只有数字 `5` 本身。这在 Rust 中是一个完全有效的函数。注意函数的返回类型也被指定了，即 `-> i32`。尝试运行这段代码；输出应该如下所示：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-21-function-return-values/output.txt}}
```

`five` 函数中的 `5` 就是函数的返回值，这就是返回类型为 `i32` 的原因。让我们更详细地看看。有两个重要的细节：首先，`let x = five();` 这一行表明我们使用函数的返回值来初始化一个变量。因为函数 `five` 返回 `5`，所以这一行等同于：

```rust
let x = 5;
```

其次，`five` 函数没有参数并定义了返回值的类型，但函数体只是一个孤零零的 `5`，没有分号，因为它是一个表达式，我们想要返回它的值。

让我们看另一个例子：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-22-function-parameter-and-return/src/main.rs}}
```

运行这段代码会打印 `The value of x is: 6`。但如果我们在包含 `x + 1` 的行末尾加上分号，将它从表达式变为语句，会发生什么呢？

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-23-statements-dont-return-values/src/main.rs}}
```

编译这段代码会产生如下错误：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-23-statements-dont-return-values/output.txt}}
```

主要的错误信息 `mismatched types` 揭示了这段代码的核心问题。函数 `plus_one` 的定义说明它将返回一个 `i32`，但语句不会计算出一个值，这由单元类型 `()` 表示。因此，实际上什么也没有返回，这与函数定义相矛盾，从而导致了错误。在这个输出中，Rust 提供了一条可能有助于修正此问题的信息：它建议删除分号，这样就能修复这个错误。
