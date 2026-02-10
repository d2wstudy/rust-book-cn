## 使用哈希 map 存储键值对

我们常用集合的最后一个是哈希 map（hash map）。`HashMap<K, V>` 类型使用*哈希函数*（hashing function）将类型为 `K` 的键映射到类型为 `V` 的值，哈希函数决定了键值对在内存中的存储方式。很多编程语言都支持这种数据结构，只是名称各异，比如*哈希*（hash）、*映射*（map）、*对象*（object）、*哈希表*（hash table）、*字典*（dictionary）或*关联数组*（associative array）等。

当你希望不通过索引（像 vector 那样），而是通过任意类型的键来查找数据时，哈希 map 就非常有用了。例如在一个游戏中，你可以用哈希 map 来记录每支队伍的得分，其中键是队伍名称，值是对应的分数。给定一个队伍名称，就能查到它的得分。

本节我们将介绍哈希 map 的基本 API，不过标准库中 `HashMap<K, V>` 上定义的函数还有很多实用功能等待你去发掘。一如既往，请查阅标准库文档以获取更多信息。

### 创建一个新的哈希 map

创建空哈希 map 的一种方式是使用 `new`，然后通过 `insert` 添加元素。在示例 8-20 中，我们记录了 *Blue* 和 *Yellow* 两支队伍的得分。Blue 队初始得分为 10 分，Yellow 队初始得分为 50 分。

<Listing number="8-20" caption="创建一个新的哈希 map 并插入一些键值对">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-20/src/main.rs:here}}
```

</Listing>

注意我们需要先从标准库的集合部分 `use` 引入 `HashMap`。在三种常用集合中，哈希 map 的使用频率最低，因此它没有被包含在预导入（prelude）自动引入作用域的功能中。标准库对哈希 map 的支持也相对较少，例如没有内置的宏来构造它。

和 vector 一样，哈希 map 将数据存储在堆上。这个 `HashMap` 的键类型是 `String`，值类型是 `i32`。与 vector 类似，哈希 map 是同构的：所有的键必须是相同类型，所有的值也必须是相同类型。

### 访问哈希 map 中的值

我们可以通过向 `get` 方法提供键来从哈希 map 中获取值，如示例 8-21 所示。

<Listing number="8-21" caption="访问哈希 map 中 Blue 队的得分">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-21/src/main.rs:here}}
```

</Listing>

这里 `score` 将会是与 Blue 队关联的值，结果为 `10`。`get` 方法返回一个 `Option<&V>`；如果哈希 map 中没有该键对应的值，`get` 会返回 `None`。这段程序通过调用 `copied` 将 `Option<&i32>` 转换为 `Option<i32>`，然后调用 `unwrap_or` 在 `scores` 中没有该键的条目时将 `score` 设为零来处理 `Option`。

我们可以用 `for` 循环以类似遍历 vector 的方式来遍历哈希 map 中的每个键值对：

```rust
{{#rustdoc_include ../listings/ch08-common-collections/no-listing-03-iterate-over-hashmap/src/main.rs:here}}
```

这段代码会以任意顺序打印每个键值对：

```text
Yellow: 50
Blue: 10
```

<!-- Old headings. Do not remove or links may break. -->

<a id="hash-maps-and-ownership"></a>

### 哈希 map 与所有权

对于实现了 `Copy` trait 的类型（如 `i32`），值会被复制进哈希 map。而对于拥有所有权的值（如 `String`），值会被移动，哈希 map 将成为这些值的所有者，如示例 8-22 所示。

<Listing number="8-22" caption="展示键和值在插入后归哈希 map 所有">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-22/src/main.rs:here}}
```

</Listing>

在调用 `insert` 将 `field_name` 和 `field_value` 移入哈希 map 之后，我们就无法再使用这两个变量了。

如果我们将值的引用插入哈希 map，值本身不会被移入哈希 map。引用所指向的值必须至少在哈希 map 有效期间保持有效。我们将在第 10 章的["使用生命周期验证引用"][validating-references-with-lifetimes]<!-- ignore -->部分详细讨论这些问题。

### 更新哈希 map

虽然键值对的数量是可增长的，但每个唯一的键在同一时刻只能关联一个值（反过来则不然：例如 Blue 队和 Yellow 队可以在 `scores` 哈希 map 中都存储值 `10`）。

当你想要修改哈希 map 中的数据时，必须决定如何处理键已经有值的情况。你可以用新值替换旧值，完全忽略旧值；也可以保留旧值而忽略新值，仅在键*没有*值时才插入新值；还可以将旧值和新值组合起来。让我们逐一看看这些做法！

#### 覆盖一个值

如果我们向哈希 map 插入一个键和值，然后用不同的值再次插入相同的键，那么该键关联的值会被替换。即使示例 8-23 中的代码调用了两次 `insert`，哈希 map 也只会包含一个键值对，因为我们两次都是为 Blue 队的键插入值。

<Listing number="8-23" caption="替换某个特定键存储的值">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-23/src/main.rs:here}}
```

</Listing>

这段代码会打印 `{"Blue": 25}`。原来的值 `10` 已经被覆盖了。

<!-- Old headings. Do not remove or links may break. -->

<a id="only-inserting-a-value-if-the-key-has-no-value"></a>

#### 仅在键不存在时插入键值对

一个常见的需求是检查某个键是否已经存在于哈希 map 中，然后根据情况采取不同的操作：如果键已经存在，保持现有值不变；如果键不存在，则插入该键和对应的值。

哈希 map 为此提供了一个专门的 API，叫做 `entry`，它接受你想要检查的键作为参数。`entry` 方法的返回值是一个名为 `Entry` 的枚举，表示一个可能存在也可能不存在的值。假设我们想检查 Yellow 队的键是否有关联的值，如果没有，就插入值 `50`，Blue 队也是一样。使用 `entry` API，代码如示例 8-24 所示。

<Listing number="8-24" caption="使用 `entry` 方法仅在键没有值时才插入">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-24/src/main.rs:here}}
```

</Listing>

`Entry` 上的 `or_insert` 方法被定义为：如果对应的 `Entry` 键存在，就返回该值的可变引用；如果不存在，就将参数作为新值插入，并返回新值的可变引用。这种方式比我们自己编写逻辑要简洁得多，而且与借用检查器配合得更好。

运行示例 8-24 中的代码会打印 `{"Yellow": 50, "Blue": 10}`。第一次调用 `entry` 会插入 Yellow 队的键和值 `50`，因为 Yellow 队还没有值。第二次调用 `entry` 不会修改哈希 map，因为 Blue 队已经有了值 `10`。

#### 根据旧值更新

哈希 map 的另一个常见用法是查找某个键的值，然后基于旧值进行更新。例如，示例 8-25 展示了统计文本中每个单词出现次数的代码。我们使用哈希 map，以单词作为键，递增计数值来记录每个单词出现的次数。如果是第一次遇到某个单词，就先插入值 `0`。

<Listing number="8-25" caption="使用哈希 map 存储单词和计数来统计单词出现次数">

```rust
{{#rustdoc_include ../listings/ch08-common-collections/listing-08-25/src/main.rs:here}}
```

</Listing>

这段代码会打印 `{"world": 2, "hello": 1, "wonderful": 1}`。你可能会看到键值对以不同的顺序打印出来：回顾["访问哈希 map 中的值"][access]<!-- ignore -->部分，遍历哈希 map 的顺序是任意的。

`split_whitespace` 方法返回一个迭代器，遍历 `text` 中以空白字符分隔的子切片。`or_insert` 方法返回指定键对应值的可变引用（`&mut V`）。这里我们将这个可变引用存储在 `count` 变量中，因此要对该值赋值，必须先使用星号（`*`）解引用 `count`。这个可变引用在 `for` 循环结束时离开作用域，所以所有这些修改都是安全的，符合借用规则。

### 哈希函数

`HashMap` 默认使用一种叫做 *SipHash* 的哈希函数，它能够抵御涉及哈希表的拒绝服务（DoS）攻击[^siphash]<!-- ignore -->。这并不是最快的哈希算法，但为了更好的安全性而牺牲一些性能是值得的。如果你分析代码后发现默认的哈希函数对你的场景来说太慢了，可以通过指定不同的哈希器（hasher）来切换到另一种函数。*哈希器*是一个实现了 `BuildHasher` trait 的类型。我们将在[第 10 章][traits]<!-- ignore -->讨论 trait 以及如何实现它们。你不一定需要从头实现自己的哈希器；[crates.io](https://crates.io/)<!-- ignore --> 上有其他 Rust 用户分享的库，提供了许多常见哈希算法的哈希器实现。

[^siphash]: [https://en.wikipedia.org/wiki/SipHash](https://en.wikipedia.org/wiki/SipHash)

## 总结

vector、字符串和哈希 map 在程序中需要存储、访问和修改数据时提供了大量必要的功能。以下是一些你现在应该有能力解决的练习：

1. 给定一个整数列表，使用 vector 返回列表的中位数（排序后位于中间位置的值）和众数（出现次数最多的值；这里哈希 map 会很有用）。
1. 将字符串转换为 Pig Latin。每个单词的第一个辅音字母被移到单词末尾并加上 *ay*，所以 *first* 变成 *irst-fay*。以元音字母开头的单词则在末尾加上 *hay*（*apple* 变成 *apple-hay*）。请注意 UTF-8 编码的相关细节！
1. 使用哈希 map 和 vector，创建一个文本界面来允许用户向公司的部门中添加员工姓名。例如，"Add Sally to Engineering" 或 "Add Amir to Sales"。然后让用户获取某个部门所有人员的列表，或者按部门分类、按字母顺序排列的公司全体人员列表。

标准库 API 文档描述了 vector、字符串和哈希 map 上的方法，这些方法对完成上述练习会很有帮助！

我们正在进入更复杂的程序领域，其中操作可能会失败，所以现在是讨论错误处理的好时机。接下来我们就来讨论这个话题！

[validating-references-with-lifetimes]: ch10-03-lifetime-syntax.html#validating-references-with-lifetimes
[access]: #accessing-values-in-a-hash-map
[traits]: ch10-02-traits.html
