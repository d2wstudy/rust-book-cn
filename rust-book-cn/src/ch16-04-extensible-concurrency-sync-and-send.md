<!-- Old headings. Do not remove or links may break. -->

<a id="extensible-concurrency-with-the-sync-and-send-traits"></a>
<a id="extensible-concurrency-with-the-send-and-sync-traits"></a>

## 使用 `Send` 和 `Sync` 实现可扩展的并发

有趣的是，本章到目前为止讨论的几乎所有并发特性都属于标准库的一部分，而非语言本身。处理并发的方式并不局限于语言或标准库；你完全可以编写自己的并发功能，或者使用他人编写的并发功能。

然而，有两个并发概念是内嵌在语言中而非标准库中的：`std::marker` 中的 `Send` 和 `Sync` trait。

<!-- Old headings. Do not remove or links may break. -->

<a id="allowing-transference-of-ownership-between-threads-with-send"></a>

### 在线程间转移所有权

`Send` 标记 trait 表明实现了 `Send` 的类型的值的所有权可以在线程间转移。几乎所有的 Rust 类型都实现了 `Send`，但也有一些例外，包括 `Rc<T>`：它不能实现 `Send`，因为如果你克隆了一个 `Rc<T>` 值并尝试将克隆的所有权转移到另一个线程，两个线程可能会同时更新引用计数。因此，`Rc<T>` 被设计为用于单线程场景，在这种场景下你不需要付出线程安全的性能开销。

所以，Rust 的类型系统和 trait 约束确保了你永远不会意外地将 `Rc<T>` 值不安全地跨线程传递。当我们在示例 16-14 中尝试这样做时，得到了错误 `` the trait `Send` is not implemented for `Rc<Mutex<i32>>` ``。当我们切换到实现了 `Send` 的 `Arc<T>` 后，代码就能编译通过了。

任何完全由 `Send` 类型组成的类型也会被自动标记为 `Send`。几乎所有原始类型都是 `Send` 的，除了裸指针（raw pointer），我们将在第 20 章讨论它。

<!-- Old headings. Do not remove or links may break. -->

<a id="allowing-access-from-multiple-threads-with-sync"></a>

### 从多个线程访问

`Sync` 标记 trait 表明实现了 `Sync` 的类型可以安全地被多个线程引用。换句话说，对于任意类型 `T`，如果 `&T`（`T` 的不可变引用）实现了 `Send`，那么 `T` 就实现了 `Sync`，这意味着该引用可以安全地发送到另一个线程。与 `Send` 类似，所有原始类型都实现了 `Sync`，完全由实现了 `Sync` 的类型组成的类型也自动实现 `Sync`。

智能指针 `Rc<T>` 同样没有实现 `Sync`，原因与它没有实现 `Send` 相同。`RefCell<T>` 类型（我们在第 15 章讨论过）以及相关的 `Cell<T>` 系列类型也没有实现 `Sync`。`RefCell<T>` 在运行时执行的借用检查不是线程安全的。智能指针 `Mutex<T>` 实现了 `Sync`，可以用于在多个线程间共享访问，正如你在["共享访问 `Mutex<T>`"][shared-access]<!-- ignore -->中所看到的那样。

### 手动实现 `Send` 和 `Sync` 是不安全的

因为完全由实现了 `Send` 和 `Sync` trait 的类型组成的类型也会自动实现 `Send` 和 `Sync`，所以我们不需要手动实现这些 trait。作为标记 trait，它们甚至没有任何需要实现的方法。它们只是用于强制保证与并发相关的不变性。

手动实现这些 trait 涉及编写不安全的 Rust 代码。我们将在第 20 章讨论如何使用不安全的 Rust 代码；目前重要的是，构建不由 `Send` 和 `Sync` 部分组成的新并发类型需要仔细思考以维护安全保证。["Rustonomicon"][nomicon] 中有更多关于这些保证以及如何维护它们的信息。

## 总结

这不是你在本书中最后一次看到并发内容：下一章将专注于异步编程，而第 21 章的项目将在比这里讨论的小示例更加实际的场景中使用本章的概念。

如前所述，由于 Rust 处理并发的方式中只有很少一部分属于语言本身，许多并发解决方案都以 crate 的形式实现。它们的发展速度比标准库更快，所以请务必在网上搜索当前最先进的 crate，以便在多线程场景中使用。

Rust 标准库提供了用于消息传递的通道，以及像 `Mutex<T>` 和 `Arc<T>` 这样可以安全地在并发环境中使用的智能指针类型。类型系统和借用检查器确保使用这些方案的代码不会出现数据竞争或无效引用。一旦你的代码能够编译通过，你就可以放心它能在多线程环境下正常运行，而不会出现其他语言中常见的那些难以追踪的 bug。并发编程不再是一个令人畏惧的概念：放手去让你的程序并发运行吧，无所畏惧！

[shared-access]: ch16-03-shared-state.html#shared-access-to-mutext
[nomicon]: ../nomicon/index.html
