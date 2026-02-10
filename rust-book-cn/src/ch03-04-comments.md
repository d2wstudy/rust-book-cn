## 注释

所有程序员都力求让自己的代码易于理解，但有时候需要额外的解释说明。在这种情况下，程序员会在源代码中留下_注释（comments）_，编译器会忽略这些注释，但阅读源代码的人可能会觉得它们很有用。

下面是一个简单的注释：

```rust
// hello, world
```

在 Rust 中，惯用的注释风格是以两个斜杠开始，注释持续到该行的末尾。对于超过一行的注释，需要在每一行都加上 `//`，像这样：

```rust
// So we're doing something complicated here, long enough that we need
// multiple lines of comments to do it! Whew! Hopefully, this comment will
// explain what's going on.
```

注释也可以放在包含代码的行的末尾：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-24-comments-end-of-line/src/main.rs}}
```

不过你更常见到的是以下这种格式，注释位于它所注解的代码的上方，单独占一行：

<span class="filename">文件名：src/main.rs</span>

```rust
{{#rustdoc_include ../listings/ch03-common-programming-concepts/no-listing-25-comments-above-line/src/main.rs}}
```

Rust 还有另一种注释，即文档注释（documentation comments），我们将在第 14 章的["将 crate 发布到 Crates.io"][publishing]<!-- ignore -->部分讨论它。

[publishing]: ch14-02-publishing-to-crates-io.html
