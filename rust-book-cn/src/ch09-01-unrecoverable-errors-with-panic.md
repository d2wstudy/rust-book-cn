## 用 `panic!` 处理不可恢复的错误

有时候代码中会发生糟糕的事情，而你对此无能为力。在这些情况下，Rust 提供了 `panic!` 宏。在实践中有两种方式会导致 panic：执行某个会导致代码 panic 的操作（例如访问数组越界），或者显式调用 `panic!` 宏。在这两种情况下，我们都会在程序中引发 panic。默认情况下，这些 panic 会打印一条失败信息，展开（unwind）并清理栈，然后退出。通过设置环境变量，你还可以让 Rust 在 panic 发生时显示调用栈，以便更容易追踪 panic 的来源。

> ### 对 Panic 进行栈展开或终止
>
> 默认情况下，当 panic 发生时，程序开始*展开*（unwinding），这意味着 Rust 会沿着栈往回走，清理它遇到的每个函数的数据。然而，这种回溯和清理工作量很大。因此 Rust 允许你选择另一种方式：立即*终止*（aborting），即不清理就结束程序。
>
> 程序使用的内存随后需要由操作系统来清理。如果你的项目需要使生成的二进制文件尽可能小，可以通过在 *Cargo.toml* 文件的相应 `[profile]` 部分添加 `panic = 'abort'` 来将 panic 时的行为从展开切换为终止。例如，如果你想在发布模式下 panic 时终止，可以添加：
>
> ```toml
> [profile.release]
> panic = 'abort'
> ```

让我们在一个简单的程序中尝试调用 `panic!`：

<Listing file-name="src/main.rs">

```rust,should_panic,panics
{{#rustdoc_include ../listings/ch09-error-handling/no-listing-01-panic/src/main.rs}}
```

</Listing>

当你运行这个程序时，你会看到类似这样的输出：

```console
{{#include ../listings/ch09-error-handling/no-listing-01-panic/output.txt}}
```

`panic!` 调用产生了最后两行中的错误信息。第一行显示了我们的 panic 信息以及源代码中 panic 发生的位置：*src/main.rs:2:5* 表示这是 *src/main.rs* 文件的第二行第五个字符。

在这个例子中，所指示的行是我们代码的一部分，如果我们查看那一行，就会看到 `panic!` 宏调用。在其他情况下，`panic!` 调用可能在我们的代码所调用的代码中，错误信息报告的文件名和行号将是别人代码中调用 `panic!` 宏的位置，而不是我们代码中最终导致 `panic!` 调用的那一行。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-a-panic-backtrace"></a>

我们可以使用 `panic!` 调用来源的函数回溯（backtrace）来找出导致问题的代码部分。为了理解如何使用 `panic!` 回溯，让我们看另一个例子，看看当 `panic!` 调用来自库代码（由于我们代码中的 bug）而不是直接来自我们的代码调用宏时是什么样的。示例 9-1 中的代码尝试访问 vector 中超出有效索引范围的索引。

<Listing number="9-1" file-name="src/main.rs" caption="尝试访问超出 vector 末尾的元素，这将导致 `panic!` 调用">

```rust,should_panic,panics
{{#rustdoc_include ../listings/ch09-error-handling/listing-09-01/src/main.rs}}
```

</Listing>

这里，我们尝试访问 vector 的第 100 个元素（索引为 99，因为索引从零开始），但 vector 只有三个元素。在这种情况下，Rust 会 panic。使用 `[]` 应该返回一个元素，但如果你传入了一个无效的索引，Rust 在这里无法返回一个正确的元素。

在 C 语言中，尝试读取数据结构末尾之后的内容是未定义行为。你可能会得到内存中对应于该数据结构中那个元素位置的任何值，即使该内存并不属于该结构。这被称为*缓冲区越读*（buffer overread），如果攻击者能够操纵索引来读取存储在数据结构之后的、本不应被允许访问的数据，就可能导致安全漏洞。

为了保护你的程序免受这类漏洞的影响，如果你尝试读取一个不存在的索引处的元素，Rust 会停止执行并拒绝继续。让我们试试看：

```console
{{#include ../listings/ch09-error-handling/listing-09-01/output.txt}}
```

这个错误指向了 *main.rs* 的第 4 行，也就是我们尝试访问 `v` 中索引 99 的地方。

`note:` 那一行告诉我们可以设置 `RUST_BACKTRACE` 环境变量来获取导致错误的完整回溯。*回溯*（backtrace）是到达当前位置所调用的所有函数的列表。Rust 中的回溯与其他语言中的一样：阅读回溯的关键是从顶部开始读，直到看到你编写的文件。那就是问题的起源位置。该位置上方的行是你的代码调用的代码；下方的行是调用你代码的代码。这些前后的行可能包括核心 Rust 代码、标准库代码或你使用的 crate。让我们通过将 `RUST_BACKTRACE` 环境变量设置为除 `0` 以外的任何值来获取回溯。示例 9-2 展示了你将看到的类似输出。

<!-- manual-regeneration
cd listings/ch09-error-handling/listing-09-01
RUST_BACKTRACE=1 cargo run
copy the backtrace output below
check the backtrace number mentioned in the text below the listing
-->

<Listing number="9-2" caption="当设置了 `RUST_BACKTRACE` 环境变量时，`panic!` 调用生成的回溯信息">

```console
$ RUST_BACKTRACE=1 cargo run
thread 'main' panicked at src/main.rs:4:6:
index out of bounds: the len is 3 but the index is 99
stack backtrace:
   0: rust_begin_unwind
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/std/src/panicking.rs:692:5
   1: core::panicking::panic_fmt
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/core/src/panicking.rs:75:14
   2: core::panicking::panic_bounds_check
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/core/src/panicking.rs:273:5
   3: <usize as core::slice::index::SliceIndex<[T]>>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/slice/index.rs:274:10
   4: core::slice::index::<impl core::ops::index::Index<I> for [T]>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/slice/index.rs:16:9
   5: <alloc::vec::Vec<T,A> as core::ops::index::Index<I>>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/alloc/src/vec/mod.rs:3361:9
   6: panic::main
             at ./src/main.rs:4:6
   7: core::ops::function::FnOnce::call_once
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/ops/function.rs:250:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

</Listing>

输出内容很多！你看到的确切输出可能因操作系统和 Rust 版本而异。要获取包含这些信息的回溯，必须启用调试符号。在使用 `cargo build` 或 `cargo run` 且不带 `--release` 标志时，调试符号默认是启用的，就像我们这里一样。

在示例 9-2 的输出中，回溯的第 6 行指向了我们项目中导致问题的那一行：*src/main.rs* 的第 4 行。如果我们不希望程序 panic，应该从第一个提到我们编写的文件的行所指向的位置开始调查。在示例 9-1 中，我们故意编写了会 panic 的代码，修复 panic 的方法是不要请求超出 vector 索引范围的元素。当你的代码将来发生 panic 时，你需要弄清楚代码对什么值执行了什么操作导致了 panic，以及代码应该怎么做。

我们将在本章后面的["要不要 `panic!`"][to-panic-or-not-to-panic]<!-- ignore -->部分回到 `panic!`，讨论什么时候应该和不应该使用 `panic!` 来处理错误条件。接下来，我们将看看如何使用 `Result` 从错误中恢复。

[to-panic-or-not-to-panic]: ch09-03-to-panic-or-not-to-panic.html#to-panic-or-not-to-panic
