## 变量与可变性

正如["使用变量存储值"][storing-values-with-variables]<!-- ignore -->一节中提到的，变量默认是不可变的。这是 Rust 提供的众多引导之一，鼓励你以充分利用 Rust 所提供的安全性和简便并发性的方式来编写代码。不过，你仍然可以选择让变量成为可变的。让我们来探讨 Rust 为何鼓励你优先选择不可变性，以及为何有时你可能需要放弃不可变性。

当一个变量是不可变的，一旦值绑定到变量名上，你就无法更改该值。为了说明这一点，请在你的 _projects_ 目录下使用 `cargo new variables` 生成一个名为 _variables_ 的新项目。

然后，在新的 _variables_ 目录中，打开 _src/main.rs_ 并将其代码替换为以下代码（这段代码目前还无法编译）：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-01-variables-are-immutable/src/main.rs}}
```

保存文件并使用 `cargo run` 运行程序。你应该会收到一条关于不可变性错误的错误信息，如下所示：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-01-variables-are-immutable/output.txt}}
```

这个例子展示了编译器如何帮助你发现程序中的错误。编译器错误可能令人沮丧，但实际上它们只是意味着你的程序还没有安全地完成你想让它做的事情；它们并_不_意味着你不是一个好程序员！有经验的 Rustacean 同样会遇到编译器错误。

你收到了错误信息 `` cannot assign twice to immutable variable `x` ``（不能对不可变变量 `x` 进行二次赋值），因为你试图给不可变变量 `x` 赋第二个值。

当我们尝试修改一个被指定为不可变的值时，能够在编译时得到错误是很重要的，因为这种情况恰恰可能导致 bug。如果代码的一部分基于某个值永远不会改变的假设来运行，而代码的另一部分却修改了该值，那么第一部分代码就可能无法按照设计意图工作。这类 bug 的原因在事后往往难以追踪，尤其是当第二段代码只是_偶尔_修改该值时。Rust 编译器保证了当你声明一个值不会改变时，它就真的不会改变，这样你就不必自己去追踪它了。因此你的代码更容易推理。

但可变性也非常有用，能让代码编写起来更加方便。虽然变量默认是不可变的，但你可以像[第 2 章][storing-values-with-variables]<!-- ignore -->中那样，在变量名前加上 `mut` 使其成为可变的。添加 `mut` 还向代码的未来读者传达了意图，表明代码的其他部分将会修改这个变量的值。

例如，让我们将 _src/main.rs_ 修改为以下内容：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-02-adding-mut/src/main.rs}}
```

现在运行这个程序，我们会得到：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-02-adding-mut/output.txt}}
```

使用 `mut` 后，我们可以将绑定到 `x` 的值从 `5` 改为 `6`。最终，是否使用可变性取决于你自己，取决于你认为在特定情况下怎样最清晰。

<!-- Old headings. Do not remove or links may break. -->
<a id="constants"></a>

### 声明常量

与不可变变量类似，_常量_（constants）也是绑定到名称上且不允许更改的值，但常量和变量之间有一些区别。

首先，常量不允许使用 `mut`。常量不仅仅是默认不可变——它们始终是不可变的。你使用 `const` 关键字而非 `let` 关键字来声明常量，并且值的类型_必须_被标注。我们将在下一节["数据类型"][data-types]<!-- ignore -->中介绍类型和类型标注，所以现在不必担心细节。只需知道你必须始终标注类型即可。

常量可以在任何作用域中声明，包括全局作用域，这使得它们对于代码中许多部分都需要知道的值非常有用。

最后一个区别是，常量只能被设置为常量表达式，而不能是只有在运行时才能计算出的值。

下面是一个常量声明的例子：

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

这个常量的名称是 `THREE_HOURS_IN_SECONDS`，它的值被设置为 60（一分钟的秒数）乘以 60（一小时的分钟数）再乘以 3（我们要在程序中计算的小时数）的结果。Rust 对常量的命名约定是使用全大写字母并用下划线分隔单词。编译器能够在编译时计算一组有限的运算，这使得我们可以选择以更易于理解和验证的方式写出这个值，而不是将常量直接设置为 10,800。有关声明常量时可以使用哪些运算的更多信息，请参阅 [Rust 参考手册中关于常量求值的章节][const-eval]。

常量在程序运行的整个期间都有效，作用范围限于声明它们的作用域内。这一特性使得常量对于应用程序领域中程序多个部分可能需要知道的值非常有用，例如游戏中玩家能获得的最大点数，或者光速。

将程序中使用的硬编码值命名为常量，有助于向代码的未来维护者传达该值的含义。同时，如果将来需要更新硬编码值，你只需在代码中修改一处即可。

### 遮蔽

正如你在[第 2 章][comparing-the-guess-to-the-secret-number]<!-- ignore -->的猜数字游戏教程中所见，你可以声明一个与之前变量同名的新变量。Rustacean 们说第一个变量被第二个变量_遮蔽_（shadowed）了，这意味着当你使用该变量名时，编译器看到的是第二个变量。实际上，第二个变量遮盖了第一个，将所有对该变量名的使用都指向自己，直到它自身被遮蔽或作用域结束。我们可以通过使用相同的变量名并重复使用 `let` 关键字来遮蔽一个变量，如下所示：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-03-shadowing/src/main.rs}}
```

这个程序首先将 `x` 绑定到值 `5`。然后通过重复 `let x =` 创建了一个新变量 `x`，取原始值并加 `1`，这样 `x` 的值就变成了 `6`。接着，在花括号创建的内部作用域中，第三个 `let` 语句也遮蔽了 `x`，创建了一个新变量，将前一个值乘以 `2`，使 `x` 的值变为 `12`。当该作用域结束时，内部遮蔽也随之结束，`x` 恢复为 `6`。运行这个程序，它将输出以下内容：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-03-shadowing/output.txt}}
```

遮蔽与将变量标记为 `mut` 不同，因为如果我们不小心尝试在没有使用 `let` 关键字的情况下重新赋值给这个变量，会得到一个编译时错误。通过使用 `let`，我们可以对一个值进行一些变换，但在这些变换完成后，变量仍然是不可变的。

`mut` 与遮蔽的另一个区别是，当我们再次使用 `let` 关键字时，实际上是创建了一个新变量，因此我们可以改变值的类型但复用相同的名称。例如，假设我们的程序要求用户输入空格字符来表示他们想在某些文本之间留多少个空格，然后我们想将该输入存储为一个数字：

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-04-shadowing-can-change-types/src/main.rs:here}}
```

第一个 `spaces` 变量是字符串类型，第二个 `spaces` 变量是数字类型。遮蔽使我们不必想出不同的名称，比如 `spaces_str` 和 `spaces_num`；相反，我们可以复用更简洁的 `spaces` 名称。然而，如果我们尝试对此使用 `mut`，如下所示，将会得到一个编译时错误：

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-05-mut-cant-change-types/src/main.rs:here}}
```

错误提示我们不允许改变变量的类型：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-05-mut-cant-change-types/output.txt}}
```

现在我们已经探讨了变量的工作方式，接下来让我们看看变量可以拥有的更多数据类型。

[comparing-the-guess-to-the-secret-number]: ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[data-types]: ch03-02-data-types.html#data-types
[storing-values-with-variables]: ch02-00-guessing-game-tutorial.html#storing-values-with-variables
[const-eval]: ../reference/const_eval.html
