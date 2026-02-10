## 用 `Result` 处理可恢复的错误

大多数错误并没有严重到需要程序完全停止运行的程度。有时候一个函数失败了，其原因是你可以轻松理解并做出应对的。例如，如果你尝试打开一个文件但操作失败了，原因是文件不存在，你可能想要创建这个文件而不是终止进程。

回忆一下第 2 章 ["使用 `Result` 处理潜在的失败"][handle_failure]<!-- ignore --> 中提到的，`Result` 枚举定义了两个变体：`Ok` 和 `Err`，如下所示：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T` 和 `E` 是泛型（generics）类型参数：我们将在第 10 章详细讨论泛型。你现在需要知道的是，`T` 代表操作成功时 `Ok` 变体中返回值的类型，而 `E` 代表操作失败时 `Err` 变体中返回的错误类型。因为 `Result` 拥有这些泛型类型参数，我们可以在许多不同的场景中使用 `Result` 类型及其上定义的函数，这些场景中成功值和错误值的类型可能各不相同。

让我们调用一个返回 `Result` 值的函数，因为该函数可能会失败。在示例 9-3 中，我们尝试打开一个文件。

<Listing number="9-3" file-name="src/main.rs" caption="打开一个文件">

```rust
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-03/src/main.rs}}
```

</Listing>

`File::open` 的返回类型是 `Result<T, E>`。泛型参数 `T` 已经被 `File::open` 的实现填充为成功值的类型 `std::fs::File`，即一个文件句柄。错误值中使用的 `E` 类型是 `std::io::Error`。这个返回类型意味着对 `File::open` 的调用可能成功并返回一个可供读写的文件句柄，也可能失败：例如，文件可能不存在，或者我们可能没有访问该文件的权限。`File::open` 函数需要有一种方式来告诉我们它是成功还是失败了，同时给我们提供文件句柄或错误信息。这正是 `Result` 枚举所传达的信息。

当 `File::open` 成功时，变量 `greeting_file_result` 中的值将是一个包含文件句柄的 `Ok` 实例。当它失败时，`greeting_file_result` 中的值将是一个包含更多错误信息的 `Err` 实例。

我们需要在示例 9-3 的代码基础上，根据 `File::open` 返回的值采取不同的操作。示例 9-4 展示了一种使用基本工具——我们在第 6 章讨论过的 `match` 表达式——来处理 `Result` 的方式。

<Listing number="9-4" file-name="src/main.rs" caption="使用 `match` 表达式处理可能返回的 `Result` 变体">

```rust,should_panic
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-04/src/main.rs}}
```

</Listing>

注意，与 `Option` 枚举一样，`Result` 枚举及其变体已经通过 prelude 引入了作用域，所以我们不需要在 `match` 分支中的 `Ok` 和 `Err` 变体前指定 `Result::`。

当结果是 `Ok` 时，这段代码会从 `Ok` 变体中返回内部的 `file` 值，然后我们将这个文件句柄赋值给变量 `greeting_file`。在 `match` 之后，我们就可以使用这个文件句柄进行读写操作了。

`match` 的另一个分支处理从 `File::open` 得到 `Err` 值的情况。在这个例子中，我们选择调用 `panic!` 宏。如果当前目录中没有名为 *hello.txt* 的文件并运行这段代码，我们将看到 `panic!` 宏输出的以下信息：

```console
{{#include ../listings/ch09-error-handling/listing-09-04/output.txt}}
```

和往常一样，这个输出准确地告诉了我们哪里出了问题。

### 匹配不同的错误

示例 9-4 中的代码不管 `File::open` 因为什么原因失败都会 `panic!`。然而，我们希望针对不同的失败原因采取不同的操作。如果 `File::open` 因为文件不存在而失败，我们想要创建文件并返回新文件的句柄。如果 `File::open` 因为其他原因失败——例如，因为我们没有打开文件的权限——我们仍然希望代码像示例 9-4 那样 `panic!`。为此，我们添加了一个内层 `match` 表达式，如示例 9-5 所示。

<Listing number="9-5" file-name="src/main.rs" caption="以不同的方式处理不同类型的错误">

<!-- ignore this test because otherwise it creates hello.txt which causes other
tests to fail lol -->

```rust,ignore
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-05/src/main.rs}}
```

</Listing>

`File::open` 在 `Err` 变体中返回的值类型是 `io::Error`，这是标准库提供的一个结构体。这个结构体有一个 `kind` 方法，我们可以调用它来获取一个 `io::ErrorKind` 值。`io::ErrorKind` 枚举由标准库提供，它的变体代表了 `io` 操作可能产生的不同类型的错误。我们要使用的变体是 `ErrorKind::NotFound`，它表示我们尝试打开的文件尚不存在。所以，我们对 `greeting_file_result` 进行匹配，同时还有一个对 `error.kind()` 的内层匹配。

我们要在内层匹配中检查的条件是 `error.kind()` 返回的值是否是 `ErrorKind` 枚举的 `NotFound` 变体。如果是，我们尝试使用 `File::create` 创建文件。然而，因为 `File::create` 也可能失败，我们需要在内层 `match` 表达式中添加第二个分支。当文件无法创建时，会打印一条不同的错误信息。外层 `match` 的第二个分支保持不变，所以程序在遇到除文件缺失以外的任何错误时都会 panic。

> #### 使用 `match` 处理 `Result<T, E>` 的替代方案
>
> `match` 用得真多！`match` 表达式非常有用，但也非常原始。在第 13 章中，你将学习闭包（closures），它与 `Result<T, E>` 上定义的许多方法配合使用。在代码中处理 `Result<T, E>` 值时，这些方法可以比使用 `match` 更加简洁。
>
> 例如，这是另一种编写与示例 9-5 相同逻辑的方式，这次使用了闭包和 `unwrap_or_else` 方法：
>
> <!-- CAN'T EXTRACT SEE https://github.com/rust-lang/mdBook/issues/1127 -->
>
> ```rust,ignore
> use std::fs::File;
> use std::io::ErrorKind;
>
> fn main() {
>     let greeting_file = File::open("hello.txt").unwrap_or_else(|error| {
>         if error.kind() == ErrorKind::NotFound {
>             File::create("hello.txt").unwrap_or_else(|error| {
>                 panic!("Problem creating the file: {error:?}");
>             })
>         } else {
>             panic!("Problem opening the file: {error:?}");
>         }
>     });
> }
> ```
>
> 虽然这段代码的行为与示例 9-5 相同，但它不包含任何 `match` 表达式，读起来更加清晰。在阅读完第 13 章之后，回来看看这个例子，并在标准库文档中查阅 `unwrap_or_else` 方法。当你处理错误时，还有更多这样的方法可以帮你简化大量嵌套的 `match` 表达式。

<!-- Old headings. Do not remove or links may break. -->

<a id="shortcuts-for-panic-on-error-unwrap-and-expect"></a>

#### 错误时 panic 的快捷方式

使用 `match` 已经足够好用了，但它可能有点冗长，而且并不总能很好地传达意图。`Result<T, E>` 类型上定义了许多辅助方法来执行各种更具体的任务。`unwrap` 方法是一个快捷方法，其实现方式与我们在示例 9-4 中编写的 `match` 表达式一样。如果 `Result` 值是 `Ok` 变体，`unwrap` 会返回 `Ok` 中的值。如果 `Result` 是 `Err` 变体，`unwrap` 会为我们调用 `panic!` 宏。下面是 `unwrap` 的一个使用示例：

<Listing file-name="src/main.rs">

```rust,should_panic
{{#rustdoc_include ../listings/ch09-error-handling/no-listing-04-unwrap/src/main.rs}}
```

</Listing>

如果我们在没有 *hello.txt* 文件的情况下运行这段代码，将会看到 `unwrap` 方法调用 `panic!` 时产生的错误信息：

<!-- manual-regeneration
cd listings/ch09-error-handling/no-listing-04-unwrap
cargo run
copy and paste relevant text
-->

```text
thread 'main' panicked at src/main.rs:4:49:
called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

类似地，`expect` 方法让我们还能选择 `panic!` 的错误信息。使用 `expect` 而不是 `unwrap` 并提供良好的错误信息可以传达你的意图，使追踪 panic 的来源更加容易。`expect` 的语法如下所示：

<Listing file-name="src/main.rs">

```rust,should_panic
{{#rustdoc_include ../listings/ch09-error-handling/no-listing-05-expect/src/main.rs}}
```

</Listing>

我们使用 `expect` 的方式与 `unwrap` 相同：返回文件句柄或调用 `panic!` 宏。`expect` 在调用 `panic!` 时使用的错误信息将是我们传递给 `expect` 的参数，而不是 `unwrap` 使用的默认 `panic!` 信息。它看起来是这样的：

<!-- manual-regeneration
cd listings/ch09-error-handling/no-listing-05-expect
cargo run
copy and paste relevant text
-->

```text
thread 'main' panicked at src/main.rs:5:10:
hello.txt should be included in this project: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

在生产级别的代码中，大多数 Rustacean 会选择 `expect` 而不是 `unwrap`，并给出更多关于为什么该操作应该总是成功的上下文信息。这样，如果你的假设被证明是错误的，你就有更多的信息可用于调试。

### 传播错误

当一个函数的实现中调用了可能会失败的操作时，除了在函数内部处理错误之外，你还可以将错误返回给调用代码，让它来决定如何处理。这被称为**传播**（propagating）错误，它将更多的控制权交给调用代码，因为调用代码可能拥有更多的信息或逻辑来决定应该如何处理错误，而这些信息在你的代码上下文中可能并不具备。

例如，示例 9-6 展示了一个从文件中读取用户名的函数。如果文件不存在或无法读取，这个函数会将这些错误返回给调用它的代码。

<Listing number="9-6" file-name="src/main.rs" caption="一个使用 `match` 将错误返回给调用代码的函数">

<!-- Deliberately not using rustdoc_include here; the `main` function in the
file panics. We do want to include it for reader experimentation purposes, but
don't want to include it for rustdoc testing purposes. -->

```rust
{{#include ../listings/ch09-error-handling/listing-09-06/src/main.rs:here}}
```

</Listing>

这个函数可以用更简短的方式来编写，但我们先手动完成大部分工作以便探索错误处理；最后，我们会展示更简短的方式。让我们先看看函数的返回类型：`Result<String, io::Error>`。这意味着该函数返回一个 `Result<T, E>` 类型的值，其中泛型参数 `T` 被填充为具体类型 `String`，泛型类型 `E` 被填充为具体类型 `io::Error`。

如果这个函数没有遇到任何问题就成功了，调用这个函数的代码将收到一个包含 `String` 的 `Ok` 值——即这个函数从文件中读取到的 `username`。如果这个函数遇到了任何问题，调用代码将收到一个包含 `io::Error` 实例的 `Err` 值，其中包含了关于问题的更多信息。我们选择 `io::Error` 作为这个函数的返回类型，是因为它恰好是这个函数体中可能失败的两个操作——`File::open` 函数和 `read_to_string` 方法——所返回的错误值类型。

函数体首先调用 `File::open` 函数。然后，我们用一个类似于示例 9-4 中的 `match` 来处理 `Result` 值。如果 `File::open` 成功了，模式变量 `file` 中的文件句柄就成为可变变量 `username_file` 的值，函数继续执行。在 `Err` 的情况下，我们不调用 `panic!`，而是使用 `return` 关键字提前从整个函数返回，并将来自 `File::open` 的错误值（现在在模式变量 `e` 中）作为这个函数的错误值传回给调用代码。

所以，如果我们在 `username_file` 中有了文件句柄，函数接着在变量 `username` 中创建一个新的 `String`，并对 `username_file` 中的文件句柄调用 `read_to_string` 方法，将文件内容读入 `username`。`read_to_string` 方法也返回一个 `Result`，因为即使 `File::open` 成功了，它也可能失败。所以我们需要另一个 `match` 来处理这个 `Result`：如果 `read_to_string` 成功了，那么我们的函数就成功了，我们将文件中的用户名（现在在 `username` 中）包装在 `Ok` 中返回。如果 `read_to_string` 失败了，我们以与处理 `File::open` 返回值的 `match` 相同的方式返回错误值。不过，我们不需要显式地写 `return`，因为这是函数中的最后一个表达式。

调用这段代码的代码随后将处理获得的 `Ok` 值（包含用户名）或 `Err` 值（包含 `io::Error`）。调用代码来决定如何处理这些值。如果调用代码得到一个 `Err` 值，它可以调用 `panic!` 使程序崩溃，可以使用默认用户名，也可以从文件以外的地方查找用户名，等等。我们没有足够的信息来了解调用代码实际上想要做什么，所以我们将所有的成功或错误信息向上传播，让它来适当地处理。

这种传播错误的模式在 Rust 中非常常见，因此 Rust 提供了问号运算符 `?` 来简化这一过程。

<!-- Old headings. Do not remove or links may break. -->

<a id="a-shortcut-for-propagating-errors-the--operator"></a>

#### `?` 运算符快捷方式

示例 9-7 展示了 `read_username_from_file` 的一个实现，它与示例 9-6 具有相同的功能，但这个实现使用了 `?` 运算符。

<Listing number="9-7" file-name="src/main.rs" caption="一个使用 `?` 运算符将错误返回给调用代码的函数">

<!-- Deliberately not using rustdoc_include here; the `main` function in the
file panics. We do want to include it for reader experimentation purposes, but
don't want to include it for rustdoc testing purposes. -->

```rust
{{#include ../listings/ch09-error-handling/listing-09-07/src/main.rs:here}}
```

</Listing>

放在 `Result` 值之后的 `?` 的工作方式几乎与我们在示例 9-6 中定义的用来处理 `Result` 值的 `match` 表达式一样。如果 `Result` 的值是 `Ok`，`Ok` 中的值将从这个表达式返回，程序继续执行。如果值是 `Err`，`Err` 将从整个函数返回，就好像我们使用了 `return` 关键字一样，这样错误值就传播给了调用代码。

示例 9-6 中的 `match` 表达式与 `?` 运算符之间有一个区别：`?` 运算符所调用的错误值会经过 `from` 函数的处理，该函数定义在标准库的 `From` trait 中，用于将值从一种类型转换为另一种类型。当 `?` 运算符调用 `from` 函数时，收到的错误类型会被转换为当前函数返回类型中定义的错误类型。当一个函数返回一种错误类型来表示函数可能失败的所有方式时，这非常有用，即使其中各部分可能因为许多不同的原因而失败。

例如，我们可以将示例 9-7 中的 `read_username_from_file` 函数改为返回一个我们定义的名为 `OurError` 的自定义错误类型。如果我们还定义了 `impl From<io::Error> for OurError` 来从 `io::Error` 构造 `OurError` 的实例，那么 `read_username_from_file` 函数体中的 `?` 运算符调用就会调用 `from` 并转换错误类型，而无需在函数中添加任何额外的代码。

在示例 9-7 的上下文中，`File::open` 调用末尾的 `?` 会将 `Ok` 中的值返回给变量 `username_file`。如果发生错误，`?` 运算符会提前从整个函数返回，并将任何 `Err` 值传给调用代码。同样的逻辑也适用于 `read_to_string` 调用末尾的 `?`。

`?` 运算符消除了大量样板代码，使这个函数的实现更加简洁。我们甚至可以通过在 `?` 之后立即链式调用方法来进一步缩短代码，如示例 9-8 所示。

<Listing number="9-8" file-name="src/main.rs" caption="在 `?` 运算符之后链式调用方法">

<!-- Deliberately not using rustdoc_include here; the `main` function in the
file panics. We do want to include it for reader experimentation purposes, but
don't want to include it for rustdoc testing purposes. -->

```rust
{{#include ../listings/ch09-error-handling/listing-09-08/src/main.rs:here}}
```

</Listing>

我们将 `username` 中新 `String` 的创建移到了函数的开头；这部分没有变化。我们没有创建变量 `username_file`，而是将 `read_to_string` 的调用直接链接到 `File::open("hello.txt")?` 的结果上。我们在 `read_to_string` 调用的末尾仍然有一个 `?`，并且当 `File::open` 和 `read_to_string` 都成功时，我们仍然返回包含 `username` 的 `Ok` 值，而不是返回错误。功能与示例 9-6 和示例 9-7 相同；这只是一种不同的、更符合人体工程学的写法。

示例 9-9 展示了一种使代码更加简短的方式，使用了 `fs::read_to_string`。

<Listing number="9-9" file-name="src/main.rs" caption="使用 `fs::read_to_string` 而不是先打开再读取文件">

<!-- Deliberately not using rustdoc_include here; the `main` function in the
file panics. We do want to include it for reader experimentation purposes, but
don't want to include it for rustdoc testing purposes. -->

```rust
{{#include ../listings/ch09-error-handling/listing-09-09/src/main.rs:here}}
```

</Listing>

将文件内容读取到字符串中是一个相当常见的操作，因此标准库提供了便捷的 `fs::read_to_string` 函数，它会打开文件、创建一个新的 `String`、读取文件内容、将内容放入那个 `String` 并返回它。当然，使用 `fs::read_to_string` 没有给我们解释所有错误处理的机会，所以我们先用了较长的方式。

<!-- Old headings. Do not remove or links may break. -->

<a id="where-the--operator-can-be-used"></a>

#### 哪里可以使用 `?` 运算符

`?` 运算符只能用在返回类型与 `?` 所作用的值兼容的函数中。这是因为 `?` 运算符被定义为从函数中提前返回一个值，与我们在示例 9-6 中定义的 `match` 表达式的方式相同。在示例 9-6 中，`match` 使用的是 `Result` 值，提前返回的分支返回了一个 `Err(e)` 值。函数的返回类型必须是 `Result`，这样才能与这个 `return` 兼容。

在示例 9-10 中，让我们看看如果在返回类型与我们使用 `?` 的值的类型不兼容的 `main` 函数中使用 `?` 运算符，会得到什么错误。

<Listing number="9-10" file-name="src/main.rs" caption="尝试在返回 `()` 的 `main` 函数中使用 `?` 将无法编译">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-10/src/main.rs}}
```

</Listing>

这段代码打开一个文件，这可能会失败。`?` 运算符跟在 `File::open` 返回的 `Result` 值之后，但这个 `main` 函数的返回类型是 `()`，而不是 `Result`。当我们编译这段代码时，会得到以下错误信息：

```console
{{#include ../listings/ch09-error-handling/listing-09-10/output.txt}}
```

这个错误指出我们只能在返回 `Result`、`Option` 或其他实现了 `FromResidual` 的类型的函数中使用 `?` 运算符。

要修复这个错误，你有两个选择。一个选择是修改函数的返回类型，使其与你使用 `?` 运算符的值兼容，只要没有限制阻止你这样做。另一个选择是使用 `match` 或 `Result<T, E>` 的某个方法，以适当的方式处理 `Result<T, E>`。

错误信息还提到 `?` 也可以用于 `Option<T>` 值。与在 `Result` 上使用 `?` 一样，你只能在返回 `Option` 的函数中对 `Option` 使用 `?`。在 `Option<T>` 上调用 `?` 运算符时的行为与在 `Result<T, E>` 上调用时类似：如果值是 `None`，`None` 会在此处从函数提前返回。如果值是 `Some`，`Some` 中的值就是表达式的结果值，函数继续执行。示例 9-11 展示了一个在给定文本中查找第一行最后一个字符的函数。

<Listing number="9-11" caption="在 `Option<T>` 值上使用 `?` 运算符">

```rust
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-11/src/main.rs:here}}
```

</Listing>

这个函数返回 `Option<char>`，因为那个位置可能有字符，也可能没有。这段代码接受 `text` 字符串切片参数，并对其调用 `lines` 方法，该方法返回一个遍历字符串中各行的迭代器。因为这个函数想要检查第一行，所以它对迭代器调用 `next` 来获取第一个值。如果 `text` 是空字符串，这次 `next` 调用将返回 `None`，此时我们使用 `?` 来停止并从 `last_char_of_first_line` 返回 `None`。如果 `text` 不是空字符串，`next` 将返回一个包含 `text` 中第一行字符串切片的 `Some` 值。

`?` 提取出字符串切片，我们可以对该字符串切片调用 `chars` 来获取其字符的迭代器。我们感兴趣的是第一行的最后一个字符，所以我们调用 `last` 来返回迭代器中的最后一项。这是一个 `Option`，因为第一行可能是空字符串；例如，如果 `text` 以空行开头但其他行有字符，如 `"\nhi"`。不过，如果第一行有最后一个字符，它将在 `Some` 变体中返回。中间的 `?` 运算符给了我们一种简洁的方式来表达这个逻辑，让我们可以在一行中实现这个函数。如果我们不能在 `Option` 上使用 `?` 运算符，就必须使用更多的方法调用或 `match` 表达式来实现这个逻辑。

注意，你可以在返回 `Result` 的函数中对 `Result` 使用 `?` 运算符，也可以在返回 `Option` 的函数中对 `Option` 使用 `?` 运算符，但不能混用。`?` 运算符不会自动将 `Result` 转换为 `Option`，反之亦然；在这些情况下，你可以使用 `Result` 上的 `ok` 方法或 `Option` 上的 `ok_or` 方法来显式地进行转换。

到目前为止，我们使用的所有 `main` 函数都返回 `()`。`main` 函数很特殊，因为它是可执行程序的入口点和退出点，对其返回类型有一些限制，以确保程序按预期运行。

幸运的是，`main` 也可以返回 `Result<(), E>`。示例 9-12 使用了示例 9-10 中的代码，但我们将 `main` 的返回类型改为 `Result<(), Box<dyn Error>>`，并在末尾添加了返回值 `Ok(())`。这段代码现在可以编译了。

<Listing number="9-12" file-name="src/main.rs" caption="将 `main` 改为返回 `Result<(), E>` 允许在 `Result` 值上使用 `?` 运算符">

```rust,ignore
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-12/src/main.rs}}
```

</Listing>

`Box<dyn Error>` 类型是一个 trait 对象，我们将在第 18 章的 ["使用 trait 对象来抽象共同行为"][trait-objects]<!-- ignore --> 中讨论。目前，你可以将 `Box<dyn Error>` 理解为"任何类型的错误"。在错误类型为 `Box<dyn Error>` 的 `main` 函数中对 `Result` 值使用 `?` 是允许的，因为它允许任何 `Err` 值提前返回。即使这个 `main` 函数体只会返回 `std::io::Error` 类型的错误，但通过指定 `Box<dyn Error>`，即使在 `main` 函数体中添加了返回其他错误的代码，这个签名仍然是正确的。

当 `main` 函数返回 `Result<(), E>` 时，如果 `main` 返回 `Ok(())`，可执行文件将以 `0` 值退出；如果 `main` 返回 `Err` 值，则以非零值退出。用 C 语言编写的可执行文件在退出时返回整数：成功退出的程序返回整数 `0`，出错的程序返回某个非 `0` 的整数。Rust 也从可执行文件返回整数，以兼容这一惯例。

`main` 函数可以返回任何实现了 [`std::process::Termination` trait][termination]<!-- ignore --> 的类型，该 trait 包含一个返回 `ExitCode` 的 `report` 函数。请查阅标准库文档以获取关于为你自己的类型实现 `Termination` trait 的更多信息。

现在我们已经讨论了调用 `panic!` 或返回 `Result` 的细节，让我们回到如何决定在哪些情况下使用哪种方式的话题。

[handle_failure]: ch02-00-guessing-game-tutorial.html#handling-potential-failure-with-result
[trait-objects]: ch18-02-trait-objects.html#using-trait-objects-to-abstract-over-shared-behavior
[termination]: ../std/process/trait.Termination.html
