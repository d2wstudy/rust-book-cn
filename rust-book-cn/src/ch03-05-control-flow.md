## 控制流

根据条件是否为 `true` 来决定是否运行某段代码，以及在条件为 `true` 时重复运行某段代码，是大多数编程语言的基本构建块。Rust 中用来控制执行流程的最常见结构是 `if` 表达式和循环。

### `if` 表达式

`if` 表达式允许你根据条件对代码进行分支。你提供一个条件，然后声明："如果满足这个条件，就运行这段代码。如果条件不满足，就不运行这段代码。"

在你的 _projects_ 目录下创建一个名为 _branches_ 的新项目来探索 `if` 表达式。在 _src/main.rs_ 文件中输入以下代码：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-26-if-true/src/main.rs}}
```

所有 `if` 表达式都以关键字 `if` 开头，后跟一个条件。在本例中，条件检查变量 `number` 的值是否小于 5。我们将条件为 `true` 时要执行的代码块放在条件之后的花括号内。与 `if` 表达式中的条件相关联的代码块有时被称为*分支*（arm），就像我们在第 2 章["比较猜测的数字与秘密数字"][comparing-the-guess-to-the-secret-number]<!-- ignore -->部分讨论的 `match` 表达式中的分支一样。

我们还可以选择性地包含一个 `else` 表达式（这里我们选择了这样做），以便在条件求值为 `false` 时给程序提供一个替代的代码块来执行。如果你不提供 `else` 表达式且条件为 `false`，程序将直接跳过 `if` 代码块，继续执行后面的代码。

尝试运行这段代码，你应该会看到以下输出：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-26-if-true/output.txt}}
```

让我们试着将 `number` 的值改为一个使条件为 `false` 的值，看看会发生什么：

```rust,ignore
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-27-if-false/src/main.rs:here}}
```

再次运行程序，查看输出：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-27-if-false/output.txt}}
```

还值得注意的是，这段代码中的条件*必须*是 `bool` 类型。如果条件不是 `bool` 类型，就会得到一个错误。例如，尝试运行以下代码：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-28-if-condition-must-be-bool/src/main.rs}}
```

这次 `if` 条件的值为 `3`，Rust 会抛出一个错误：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-28-if-condition-must-be-bool/output.txt}}
```

这个错误表明 Rust 期望一个 `bool` 类型但得到了一个整数。与 Ruby 和 JavaScript 等语言不同，Rust 不会自动将非布尔类型转换为布尔类型。你必须始终显式地为 `if` 提供一个布尔值作为条件。例如，如果我们希望 `if` 代码块仅在数字不等于 `0` 时运行，可以将 `if` 表达式改为如下形式：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-29-if-not-equal-0/src/main.rs}}
```

运行这段代码将打印 `number was something other than zero`。

#### 使用 `else if` 处理多个条件

你可以通过将 `if` 和 `else` 组合成 `else if` 表达式来使用多个条件。例如：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-30-else-if/src/main.rs}}
```

这个程序有四条可能的执行路径。运行后，你应该会看到以下输出：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-30-else-if/output.txt}}
```

当程序执行时，它会依次检查每个 `if` 表达式，并执行第一个条件求值为 `true` 的代码块。注意，尽管 6 可以被 2 整除，但我们并没有看到输出 `number is divisible by 2`，也没有看到 `else` 代码块中的 `number is not divisible by 4, 3, or 2` 文本。这是因为 Rust 只执行第一个条件为 `true` 的代码块，一旦找到一个，就不会再检查其余的条件。

使用过多的 `else if` 表达式会使代码变得杂乱，所以如果你有多个条件分支，可能需要重构代码。第 6 章会介绍一个强大的 Rust 分支结构 `match`，专门用于处理这类情况。

#### 在 `let` 语句中使用 `if`

因为 `if` 是一个表达式，所以我们可以在 `let` 语句的右侧使用它来将结果赋给一个变量，如示例 3-2 所示。

<Listing number="3-2" file-name="src/main.rs" caption="将 `if` 表达式的结果赋给一个变量">

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/listing-03-02/src/main.rs}}
```

</Listing>

变量 `number` 将绑定到 `if` 表达式的结果值上。运行这段代码看看会发生什么：

```console
{{#include ../listings/ch03-common-programming-concepts/listing-03-02/output.txt}}
```

记住，代码块的值是其中最后一个表达式的值，而数字本身也是表达式。在本例中，整个 `if` 表达式的值取决于哪个代码块被执行。这意味着 `if` 的每个分支可能产生的结果值必须是相同的类型；在示例 3-2 中，`if` 分支和 `else` 分支的结果都是 `i32` 整数。如果类型不匹配，如下面的例子所示，就会得到一个错误：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-31-arms-must-return-same-type/src/main.rs}}
```

当我们尝试编译这段代码时，会得到一个错误。`if` 和 `else` 分支的值类型不兼容，Rust 会准确地指出程序中问题所在的位置：

```console
{{#include ../listings/ch03-common-programming-concepts/no-listing-31-arms-must-return-same-type/output.txt}}
```

`if` 代码块中的表达式求值为一个整数，而 `else` 代码块中的表达式求值为一个字符串。这行不通，因为变量必须只有一个类型，Rust 需要在编译时就确切地知道 `number` 变量的类型。知道 `number` 的类型可以让编译器在我们使用 `number` 的所有地方验证其类型是否有效。如果 `number` 的类型只能在运行时确定，Rust 就无法做到这一点；如果编译器必须跟踪任何变量的多种假设类型，那么编译器会更加复杂，对代码的保证也会更少。

### 使用循环重复执行

经常需要多次执行同一段代码。为此，Rust 提供了几种*循环*（loop），它们会执行循环体内的代码直到结尾，然后立即从头开始。为了试验循环，让我们创建一个名为 _loops_ 的新项目。

Rust 有三种循环：`loop`、`while` 和 `for`。让我们逐一尝试。

#### 使用 `loop` 重复执行代码

`loop` 关键字告诉 Rust 反复执行一段代码，直到你明确告诉它停止为止。

作为示例，将你 _loops_ 目录中的 _src/main.rs_ 文件修改为如下内容：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-32-loop/src/main.rs}}
```

当我们运行这个程序时，会看到 `again!` 被不断地重复打印，直到我们手动停止程序。大多数终端都支持键盘快捷键 <kbd>ctrl</kbd>-<kbd>C</kbd> 来中断一个陷入无限循环的程序。试一试：

<!-- manual-regeneration
cd listings/ch03-common-programming-concepts/no-listing-32-loop
cargo run
CTRL-C
-->

```console
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/loops`
again!
again!
again!
again!
^Cagain!
```

符号 `^C` 表示你按下了 <kbd>ctrl</kbd>-<kbd>C</kbd>。

在 `^C` 之后你可能会也可能不会看到 `again!` 被打印出来，这取决于程序收到中断信号时代码正执行到循环的哪个位置。

幸运的是，Rust 也提供了一种通过代码跳出循环的方式。你可以在循环中使用 `break` 关键字来告诉程序何时停止执行循环。回忆一下，我们在第 2 章["猜对后退出"][quitting-after-a-correct-guess]<!-- ignore -->部分就这样做过，当用户猜对数字赢得游戏时退出程序。

我们在猜数字游戏中还使用了 `continue`，它在循环中的作用是告诉程序跳过本次迭代中剩余的代码，直接进入下一次迭代。

#### 从循环返回值

`loop` 的一个用途是重试你知道可能会失败的操作，比如检查线程是否完成了它的工作。你可能还需要将该操作的结果从循环中传递给其余代码。为此，你可以在用于停止循环的 `break` 表达式后面添加你想要返回的值；该值将从循环中返回，你可以使用它，如下所示：

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-33-return-value-from-loop/src/main.rs}}
```

在循环之前，我们声明了一个名为 `counter` 的变量并将其初始化为 `0`。然后，我们声明了一个名为 `result` 的变量来保存循环返回的值。在循环的每次迭代中，我们给 `counter` 变量加 `1`，然后检查 `counter` 是否等于 `10`。当等于 `10` 时，我们使用 `break` 关键字并带上值 `counter * 2`。循环之后，我们用分号结束将值赋给 `result` 的语句。最后，我们打印 `result` 中的值，本例中为 `20`。

你也可以在循环内部使用 `return`。`break` 只退出当前循环，而 `return` 始终退出当前函数。

<!-- Old headings. Do not remove or links may break. -->
<a id="loop-labels-to-disambiguate-between-multiple-loops"></a>

#### 使用循环标签消除多个循环之间的歧义

如果存在嵌套循环，`break` 和 `continue` 作用于此处最内层的循环。你可以选择在循环上指定一个*循环标签*（loop label），然后将该标签与 `break` 或 `continue` 一起使用，以指定这些关键字作用于带标签的循环而非最内层循环。循环标签必须以单引号开头。下面是一个包含两个嵌套循环的示例：

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-32-5-loop-labels/src/main.rs}}
```

外层循环有标签 `'counting_up`，它将从 0 计数到 2。内层循环没有标签，从 10 倒数到 9。第一个没有指定标签的 `break` 只会退出内层循环。`break 'counting_up;` 语句将退出外层循环。这段代码打印：

```console
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-32-5-loop-labels/output.txt}}
```

<!-- Old headings. Do not remove or links may break. -->
<a id="conditional-loops-with-while"></a>

#### 使用 `while` 简化条件循环

程序经常需要在循环中判断条件。当条件为 `true` 时，循环继续运行。当条件不再为 `true` 时，程序调用 `break` 停止循环。使用 `loop`、`if`、`else` 和 `break` 的组合可以实现这种行为；如果你愿意，现在就可以在程序中尝试一下。然而，这种模式非常常见，所以 Rust 为此提供了一个内置的语言结构，称为 `while` 循环。在示例 3-3 中，我们使用 `while` 让程序循环三次，每次倒计数，然后在循环结束后打印一条消息并退出。

<Listing number="3-3" file-name="src/main.rs" caption="使用 `while` 循环在条件求值为 `true` 时运行代码">

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/listing-03-03/src/main.rs}}
```

</Listing>

这种结构消除了使用 `loop`、`if`、`else` 和 `break` 时所需的大量嵌套，而且更加清晰。当条件求值为 `true` 时代码运行；否则退出循环。

#### 使用 `for` 遍历集合

你可以选择使用 `while` 结构来遍历集合的元素，比如数组。例如，示例 3-4 中的循环打印数组 `a` 中的每个元素。

<Listing number="3-4" file-name="src/main.rs" caption="使用 `while` 循环遍历集合中的每个元素">

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/listing-03-04/src/main.rs}}
```

</Listing>

这里，代码对数组中的元素进行计数。它从索引 `0` 开始，然后循环直到到达数组的最后一个索引（即 `index < 5` 不再为 `true` 时）。运行这段代码将打印数组中的每个元素：

```console
{{#include ../listings/ch03-common-programming-concepts/listing-03-04/output.txt}}
```

所有五个数组值都如预期地出现在终端中。尽管 `index` 在某个时刻会达到 `5`，但循环会在尝试从数组中获取第六个值之前停止执行。

然而，这种方法容易出错；如果索引值或测试条件不正确，可能会导致程序 panic。例如，如果你将数组 `a` 的定义改为只有四个元素，但忘记将条件更新为 `while index < 4`，代码就会 panic。这种方法也比较慢，因为编译器会添加运行时代码，在每次循环迭代中对索引是否在数组范围内进行条件检查。

作为一种更简洁的替代方案，你可以使用 `for` 循环来对集合中的每个元素执行一些代码。`for` 循环看起来像示例 3-5 中的代码。

<Listing number="3-5" file-name="src/main.rs" caption="使用 `for` 循环遍历集合中的每个元素">

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/listing-03-05/src/main.rs}}
```

</Listing>

当我们运行这段代码时，会看到与示例 3-4 相同的输出。更重要的是，我们现在提高了代码的安全性，消除了因超出数组末尾或遍历不够远而遗漏某些元素所可能导致的 bug。`for` 循环生成的机器码也可能更高效，因为不需要在每次迭代时将索引与数组长度进行比较。

使用 `for` 循环，如果你改变了数组中值的数量，不需要像示例 3-4 中的方法那样记得修改其他代码。

`for` 循环的安全性和简洁性使其成为 Rust 中最常用的循环结构。即使在你想要运行某段代码特定次数的情况下，比如示例 3-3 中使用 `while` 循环的倒计时示例，大多数 Rustacean 也会使用 `for` 循环。实现方式是使用标准库提供的 `Range`，它会按顺序生成从一个数字开始到另一个数字之前结束的所有数字。

下面是使用 `for` 循环和我们尚未介绍的 `rev` 方法来反转范围后的倒计时效果：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-34-for-range/src/main.rs}}
```

这段代码是不是更好看了？

## 总结

你做到了！这是相当长的一章：你学习了变量、标量和复合数据类型、函数、注释、`if` 表达式和循环！为了练习本章讨论的概念，尝试编写程序来完成以下任务：

- 在华氏温度和摄氏温度之间进行转换。
- 生成第 *n* 个斐波那契数。
- 打印圣诞颂歌"The Twelve Days of Christmas"的歌词，利用歌曲中的重复部分。

当你准备好继续前进时，我们将讨论 Rust 中一个在其他编程语言中*不*常见的概念：所有权（ownership）。

[comparing-the-guess-to-the-secret-number]: ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[quitting-after-a-correct-guess]: ch02-00-guessing-game-tutorial.html#quitting-after-a-correct-guess
