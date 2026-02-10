## 附录 C：可派生的 trait

在本书的各个章节中，我们讨论过 `derive` 属性，它可以应用于结构体或枚举的定义。`derive` 属性会生成代码，在你用 `derive` 语法标注的类型上，以默认实现的方式实现对应的 trait。

在本附录中，我们提供了标准库中所有可以与 `derive` 一起使用的 trait 的参考。每个小节涵盖：

- 派生该 trait 将启用哪些运算符和方法
- `derive` 提供的 trait 实现做了什么
- 实现该 trait 对类型意味着什么
- 允许或不允许实现该 trait 的条件
- 需要该 trait 的操作示例

如果你希望获得与 `derive` 属性所提供的不同的行为，请查阅[标准库文档](../std/index.html)<!-- ignore -->中每个 trait 的详细信息，了解如何手动实现它们。

这里列出的 trait 是标准库中唯一可以通过 `derive` 在你的类型上实现的 trait。标准库中定义的其他 trait 没有合理的默认行为，因此需要你以符合自身目标的方式来实现它们。

一个不能被派生的 trait 的例子是 `Display`，它处理面向最终用户的格式化。你应该始终考虑向最终用户展示一个类型的恰当方式。最终用户应该被允许看到类型的哪些部分？他们会觉得哪些部分是相关的？什么样的数据格式对他们最有意义？Rust 编译器没有这种洞察力，因此无法为你提供合适的默认行为。

本附录中提供的可派生 trait 列表并不是详尽无遗的：库可以为自己的 trait 实现 `derive`，使得可以使用 `derive` 的 trait 列表真正是开放式的。实现 `derive` 涉及使用过程宏（procedural macro），这在第 20 章的["自定义 `derive` 宏"][custom-derive-macros]<!-- ignore -->部分有介绍。

### 用于程序员输出的 `Debug`

`Debug` trait 启用格式化字符串中的调试格式化，你可以通过在 `{}` 占位符中添加 `:?` 来使用它。

`Debug` trait 允许你以调试为目的打印类型的实例，这样你和使用你类型的其他程序员就可以在程序执行的某个特定点检查实例的内容。

`Debug` trait 是必需的，例如在使用 `assert_eq!` 宏时。如果相等断言失败，这个宏会打印作为参数传入的实例的值，以便程序员可以看到为什么两个实例不相等。

### 用于相等比较的 `PartialEq` 和 `Eq`

`PartialEq` trait 允许你比较类型的实例以检查是否相等，并启用 `==` 和 `!=` 运算符的使用。

派生 `PartialEq` 会实现 `eq` 方法。当在结构体上派生 `PartialEq` 时，只有当_所有_字段都相等时两个实例才相等，只要有_任何_字段不相等则实例不相等。当在枚举上派生时，每个变体等于自身，不等于其他变体。

`PartialEq` trait 是必需的，例如在使用 `assert_eq!` 宏时，该宏需要能够比较两个类型实例是否相等。

`Eq` trait 没有方法。它的作用是表明对于被标注类型的每一个值，该值都等于自身。`Eq` trait 只能应用于同时实现了 `PartialEq` 的类型，但并非所有实现了 `PartialEq` 的类型都能实现 `Eq`。浮点数类型就是一个例子：浮点数的实现规定，两个非数值（`NaN`）实例彼此不相等。

需要 `Eq` 的一个例子是 `HashMap<K, V>` 中的键，这样 `HashMap<K, V>` 才能判断两个键是否相同。

### 用于排序比较的 `PartialOrd` 和 `Ord`

`PartialOrd` trait 允许你比较类型的实例以进行排序。实现了 `PartialOrd` 的类型可以使用 `<`、`>`、`<=` 和 `>=` 运算符。你只能在同时实现了 `PartialEq` 的类型上应用 `PartialOrd` trait。

派生 `PartialOrd` 会实现 `partial_cmp` 方法，它返回一个 `Option<Ordering>`，当给定的值无法产生排序时返回 `None`。即使该类型的大多数值可以比较，仍有一个无法产生排序的值的例子，那就是浮点数的 `NaN` 值。对任何浮点数和 `NaN` 浮点值调用 `partial_cmp` 都会返回 `None`。

当在结构体上派生时，`PartialOrd` 按照字段在结构体定义中出现的顺序依次比较每个字段的值。当在枚举上派生时，在枚举定义中较早声明的变体被认为小于较晚列出的变体。

`PartialOrd` trait 是必需的，例如 `rand` crate 中的 `gen_range` 方法，它在由范围表达式指定的区间内生成随机值。

`Ord` trait 表明对于被标注类型的任意两个值，都存在有效的排序。`Ord` trait 实现了 `cmp` 方法，它返回 `Ordering` 而非 `Option<Ordering>`，因为有效的排序总是存在的。你只能在同时实现了 `PartialOrd` 和 `Eq`（而 `Eq` 又要求 `PartialEq`）的类型上应用 `Ord` trait。当在结构体和枚举上派生时，`cmp` 的行为与 `PartialOrd` 的派生实现中 `partial_cmp` 的行为相同。

需要 `Ord` 的一个例子是在 `BTreeSet<T>` 中存储值，这是一种根据值的排序顺序来存储数据的数据结构。

### 用于复制值的 `Clone` 和 `Copy`

`Clone` trait 允许你显式地创建一个值的深拷贝，复制过程可能涉及运行任意代码和复制堆上的数据。有关 `Clone` 的更多信息，请参阅第 4 章的["变量与数据交互的方式：克隆"][variables-and-data-interacting-with-clone]<!-- ignore -->部分。

派生 `Clone` 会实现 `clone` 方法，当为整个类型实现时，它会对类型的每个组成部分调用 `clone`。这意味着类型中的所有字段或值也必须实现 `Clone` 才能派生 `Clone`。

需要 `Clone` 的一个例子是在切片上调用 `to_vec` 方法。切片并不拥有它所包含的类型实例，但从 `to_vec` 返回的向量需要拥有其实例，因此 `to_vec` 会对每个元素调用 `clone`。因此，存储在切片中的类型必须实现 `Clone`。

`Copy` trait 允许你仅通过复制存储在栈上的位来复制一个值，不需要运行任何额外的代码。有关 `Copy` 的更多信息，请参阅第 4 章的["仅在栈上的数据：Copy"][stack-only-data-copy]<!-- ignore -->部分。

`Copy` trait 没有定义任何方法，以防止程序员重载这些方法并违反不运行任意代码的假设。这样，所有程序员都可以假定复制一个值会非常快。

你可以在所有组成部分都实现了 `Copy` 的任何类型上派生 `Copy`。实现了 `Copy` 的类型也必须实现 `Clone`，因为实现了 `Copy` 的类型有一个简单的 `Clone` 实现，执行与 `Copy` 相同的任务。

`Copy` trait 很少是必需的；实现了 `Copy` 的类型可以进行优化，这意味着你不必调用 `clone`，从而使代码更简洁。

用 `Copy` 能做到的一切，用 `Clone` 也能做到，只是代码可能会更慢，或者需要在某些地方使用 `clone`。

### 用于将值映射为固定大小值的 `Hash`

`Hash` trait 允许你获取任意大小的类型实例，并使用哈希函数将该实例映射为固定大小的值。派生 `Hash` 会实现 `hash` 方法。`hash` 方法的派生实现会将对类型各个组成部分调用 `hash` 的结果组合起来，这意味着所有字段或值也必须实现 `Hash` 才能派生 `Hash`。

需要 `Hash` 的一个例子是在 `HashMap<K, V>` 中存储键，以便高效地存储数据。

### 用于默认值的 `Default`

`Default` trait 允许你为类型创建一个默认值。派生 `Default` 会实现 `default` 函数。`default` 函数的派生实现会对类型的每个组成部分调用 `default` 函数，这意味着类型中的所有字段或值也必须实现 `Default` 才能派生 `Default`。

`Default::default` 函数通常与第 5 章["使用结构体更新语法从其他实例创建实例"][creating-instances-from-other-instances-with-struct-update-syntax]<!-- ignore -->部分讨论的结构体更新语法结合使用。你可以自定义结构体的几个字段，然后通过 `..Default::default()` 为其余字段设置和使用默认值。

`Default` trait 在你对 `Option<T>` 实例使用 `unwrap_or_default` 方法时是必需的。如果 `Option<T>` 是 `None`，`unwrap_or_default` 方法将返回存储在 `Option<T>` 中的类型 `T` 的 `Default::default` 的结果。

[creating-instances-from-other-instances-with-struct-update-syntax]: ch05-01-defining-structs.html#creating-instances-from-other-instances-with-struct-update-syntax
[stack-only-data-copy]: ch04-01-what-is-ownership.html#stack-only-data-copy
[variables-and-data-interacting-with-clone]: ch04-01-what-is-ownership.html#variables-and-data-interacting-with-clone
[custom-derive-macros]: ch20-05-macros.html#custom-derive-macros
