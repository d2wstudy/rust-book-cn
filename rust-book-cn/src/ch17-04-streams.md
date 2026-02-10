<!-- Old headings. Do not remove or links may break. -->

<a id="streams"></a>

## 流（Stream）：序列化的 Future

回忆一下本章前面["消息传递"][17-02-messages]<!-- ignore -->一节中我们如何使用异步通道的接收端。异步 `recv` 方法会随时间推移产生一系列元素。这是一种更通用的模式的实例，称为**流**（_stream_）。许多概念天然适合用流来表示：队列中逐渐可用的元素、文件系统中因完整数据集太大而无法一次性放入内存时逐块拉取的数据，或者随时间从网络到达的数据。因为流本身就是 future，我们可以将它们与任何其他类型的 future 配合使用，并以有趣的方式组合它们。例如，我们可以批量处理事件以避免触发过多的网络调用，为长时间运行的操作序列设置超时，或者对用户界面事件进行节流以避免不必要的工作。

我们在第 13 章["Iterator Trait 和 `next` 方法"][iterator-trait]<!-- ignore -->一节中已经见过元素序列，当时我们学习了 Iterator trait。但迭代器和异步通道接收端之间有两个区别。第一个区别是时间：迭代器是同步的，而通道接收端是异步的。第二个区别是 API。直接使用 `Iterator` 时，我们调用其同步的 `next` 方法。而对于 `trpl::Receiver` 流，我们调用的是异步的 `recv` 方法。除此之外，这些 API 的使用感受非常相似，这种相似性并非巧合。流就像是异步形式的迭代。不过，`trpl::Receiver` 专门用于等待接收消息，而通用的流 API 要广泛得多：它像 `Iterator` 一样提供下一个元素，但以异步的方式进行。

Rust 中迭代器和流之间的相似性意味着我们实际上可以从任何迭代器创建流。与迭代器一样，我们可以通过调用流的 `next` 方法然后 await 其输出来使用流，如示例 17-21 所示（该代码暂时还无法编译）。

<Listing number="17-21" caption="从迭代器创建流并打印其值" file-name="src/main.rs">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch17-async-await/listing-17-21/src/main.rs:stream}}
```

</Listing>

我们从一个数字数组开始，将其转换为迭代器，然后调用 `map` 将所有值翻倍。接着使用 `trpl::stream_from_iter` 函数将迭代器转换为流。然后，我们使用 `while let` 循环遍历流中到达的每个元素。

遗憾的是，当我们尝试运行这段代码时，它无法编译，而是报告没有可用的 `next` 方法：

<!-- manual-regeneration
cd listings/ch17-async-await/listing-17-21
cargo build
copy only the error output
-->

```text
error[E0599]: no method named `next` found for struct `tokio_stream::iter::Iter` in the current scope
  --> src/main.rs:10:40
   |
10 |         while let Some(value) = stream.next().await {
   |                                        ^^^^
   |
   = help: items from traits can only be used if the trait is in scope
help: the following traits which provide `next` are implemented but not in scope; perhaps you want to import one of them
   |
1  + use crate::trpl::StreamExt;
   |
1  + use futures_util::stream::stream::StreamExt;
   |
1  + use std::iter::Iterator;
   |
1  + use std::str::pattern::Searcher;
   |
help: there is a method `try_next` with a similar name
   |
10 |         while let Some(value) = stream.try_next().await {
   |                                        ~~~~~~~~
```

正如输出所解释的，编译器报错的原因是我们需要将正确的 trait 引入作用域才能使用 `next` 方法。根据我们目前的讨论，你可能会合理地认为这个 trait 是 `Stream`，但实际上是 `StreamExt`。`Ext` 是 _extension_（扩展）的缩写，这是 Rust 社区中用一个 trait 扩展另一个 trait 的常见模式。

`Stream` trait 定义了一个底层接口，它实际上结合了 `Iterator` 和 `Future` trait。`StreamExt` 在 `Stream` 之上提供了一组更高级的 API，包括 `next` 方法以及其他类似于 `Iterator` trait 所提供的实用方法。`Stream` 和 `StreamExt` 目前还不是 Rust 标准库的一部分，但大多数生态系统中的 crate 使用类似的定义。

修复编译器错误的方法是添加一条 `trpl::StreamExt` 的 `use` 语句，如示例 17-22 所示。

<Listing number="17-22" caption="成功地使用迭代器作为流的基础" file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch17-async-await/listing-17-22/src/main.rs:all}}
```

</Listing>

将所有这些部分组合在一起，这段代码就能按我们期望的方式工作了！更重要的是，现在我们已经将 `StreamExt` 引入了作用域，就可以使用它的所有实用方法了，就像使用迭代器一样。

[17-02-messages]: ch17-02-concurrency-with-async.html#message-passing
[iterator-trait]: ch13-02-iterators.html#the-iterator-trait-and-the-next-method
