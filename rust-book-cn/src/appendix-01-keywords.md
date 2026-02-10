## 附录 A：关键字

下面的列表包含了 Rust 语言当前或将来会使用的保留关键字。因此，它们不能用作标识符（除非使用原始标识符，我们将在["原始标识符"][raw-identifiers]<!-- ignore -->一节中讨论）。所谓_标识符_，是指函数、变量、参数、结构体字段、模块、crate、常量、宏、静态值、属性、类型、trait 或生命周期的名称。

[raw-identifiers]: #raw-identifiers

### 当前在用的关键字

以下是当前在用的关键字列表及其功能说明。

- **`as`**：执行基本类型转换，消除包含某个项的特定 trait 的歧义，或者在 `use` 语句中重命名项。
- **`async`**：返回一个 `Future` 而不是阻塞当前线程。
- **`await`**：挂起执行，直到 `Future` 的结果就绪。
- **`break`**：立即退出循环。
- **`const`**：定义常量项或常量裸指针。
- **`continue`**：继续下一次循环迭代。
- **`crate`**：在模块路径中，指代 crate 根。
- **`dyn`**：对 trait 对象进行动态分发。
- **`else`**：作为 `if` 和 `if let` 控制流结构的后备分支。
- **`enum`**：定义一个枚举。
- **`extern`**：链接外部函数或变量。
- **`false`**：布尔值 false 字面量。
- **`fn`**：定义函数或函数指针类型。
- **`for`**：遍历迭代器中的元素、实现 trait，或者指定高阶生命周期。
- **`if`**：根据条件表达式的结果进行分支。
- **`impl`**：实现固有功能或 trait 功能。
- **`in`**：`for` 循环语法的一部分。
- **`let`**：绑定一个变量。
- **`loop`**：无条件循环。
- **`match`**：将一个值与模式进行匹配。
- **`mod`**：定义一个模块。
- **`move`**：使闭包获取其所有捕获变量的所有权。
- **`mut`**：在引用、裸指针或模式绑定中表示可变性。
- **`pub`**：在结构体字段、`impl` 块或模块中表示公有可见性。
- **`ref`**：通过引用绑定。
- **`return`**：从函数返回。
- **`Self`**：当前正在定义或实现的类型的类型别名。
- **`self`**：方法的主体，或当前模块。
- **`static`**：全局变量，或持续整个程序执行期间的生命周期。
- **`struct`**：定义一个结构体。
- **`super`**：当前模块的父模块。
- **`trait`**：定义一个 trait。
- **`true`**：布尔值 true 字面量。
- **`type`**：定义类型别名或关联类型。
- **`union`**：定义一个[联合体][union]<!-- ignore -->；仅在联合体声明中用作关键字。
- **`unsafe`**：表示不安全的代码、函数、trait 或实现。
- **`use`**：将符号引入作用域。
- **`where`**：表示约束类型的从句。
- **`while`**：根据表达式的结果进行条件循环。

[union]: ../reference/items/unions.html

### 为将来保留的关键字

以下关键字目前还没有任何功能，但被 Rust 保留以备将来使用：

- `abstract`
- `become`
- `box`
- `do`
- `final`
- `gen`
- `macro`
- `override`
- `priv`
- `try`
- `typeof`
- `unsized`
- `virtual`
- `yield`

### 原始标识符

_原始标识符_（raw identifiers）是一种语法，允许你在通常不允许使用关键字的地方使用关键字。使用原始标识符的方法是在关键字前加上 `r#` 前缀。

例如，`match` 是一个关键字。如果你尝试编译以下使用 `match` 作为函数名的代码：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
fn match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}
```

你会得到以下错误：

```text
error: expected identifier, found keyword `match`
 --> src/main.rs:4:4
  |
4 | fn match(needle: &str, haystack: &str) -> bool {
  |    ^^^^^ expected identifier, found keyword
```

这个错误表明你不能使用关键字 `match` 作为函数标识符。要将 `match` 用作函数名，你需要使用原始标识符语法，如下所示：

<span class="filename">文件名：src/main.rs</span>

```rust
fn r#match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}

fn main() {
    assert!(r#match("foo", "foobar"));
}
```

这段代码可以正常编译。注意函数定义和 `main` 中调用函数时，函数名都带有 `r#` 前缀。

原始标识符允许你使用任何你选择的单词作为标识符，即使该单词恰好是保留关键字。这给了我们更大的自由来选择标识符名称，也让我们能够与使用其他语言编写的程序集成——在那些语言中，这些单词并不是关键字。此外，原始标识符还允许你使用与你的 crate 不同 Rust 版本编写的库。例如，`try` 在 2015 版本中不是关键字，但在 2018、2021 和 2024 版本中是关键字。如果你依赖一个使用 2015 版本编写的库，而该库有一个 `try` 函数，那么你需要使用原始标识符语法（在这种情况下是 `r#try`）来从后续版本的代码中调用该函数。有关版本的更多信息，请参阅[附录 E][appendix-e]<!-- ignore -->。

[appendix-e]: appendix-05-editions.html
