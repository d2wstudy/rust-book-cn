<!-- Old headings. Do not remove or links may break. -->

<a id="closures-anonymous-functions-that-can-capture-their-environment"></a>
<a id="closures-anonymous-functions-that-capture-their-environment"></a>

## 闭包

Rust 的闭包（closures）是可以保存在变量中或作为参数传递给其他函数的匿名函数。你可以在一个地方创建闭包，然后在不同的上下文中调用它。与函数不同，闭包可以捕获其定义所在作用域中的值。我们将展示闭包的这些特性如何实现代码复用和行为定制。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-an-abstraction-of-behavior-with-closures"></a>
<a id="refactoring-using-functions"></a>
<a id="refactoring-with-closures-to-store-code"></a>
<a id="capturing-the-environment-with-closures"></a>

### 捕获环境

我们首先来看看如何使用闭包来捕获定义它们的环境中的值以供后续使用。场景如下：我们的 T 恤公司时不时会向邮件列表中的某人赠送一件独家限量版 T 恤作为促销活动。邮件列表中的人可以选择在个人资料中添加自己喜欢的颜色。如果被选中获得免费 T 恤的人设置了喜欢的颜色，他们就会得到那个颜色的 T 恤。如果这个人没有指定喜欢的颜色，他们就会得到公司目前库存最多的那个颜色。

有很多方式可以实现这个功能。在这个例子中，我们将使用一个名为 `ShirtColor` 的枚举，它有 `Red` 和 `Blue` 两个变体（为了简单起见，限制了可用颜色的数量）。我们用一个 `Inventory` 结构体来表示公司的库存，它有一个名为 `shirts` 的字段，包含一个 `Vec<ShirtColor>` 来表示当前库存的 T 恤颜色。定义在 `Inventory` 上的 `giveaway` 方法获取免费 T 恤获奖者的可选颜色偏好，并返回这个人将得到的 T 恤颜色。这个设置如示例 13-1 所示。

<Listing number="13-1" file-name="src/main.rs" caption="T 恤公司赠品场景">

```rust,noplayground
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-01/src/main.rs}}
```

</Listing>

在 `main` 中定义的 `store` 还剩两件蓝色 T 恤和一件红色 T 恤用于这次限量版促销活动。我们为一个偏好红色 T 恤的用户和一个没有任何偏好的用户分别调用了 `giveaway` 方法。

同样，这段代码可以用很多方式实现，这里为了聚焦于闭包，我们只使用了你已经学过的概念，除了 `giveaway` 方法体中使用了闭包。在 `giveaway` 方法中，我们将用户偏好作为 `Option<ShirtColor>` 类型的参数获取，并对 `user_preference` 调用 `unwrap_or_else` 方法。[`Option<T>` 上的 `unwrap_or_else` 方法][unwrap-or-else]<!-- ignore -->由标准库定义。它接受一个参数：一个不带任何参数的闭包，该闭包返回一个 `T` 类型的值（与 `Option<T>` 的 `Some` 变体中存储的类型相同，在这里是 `ShirtColor`）。如果 `Option<T>` 是 `Some` 变体，`unwrap_or_else` 返回 `Some` 中的值。如果 `Option<T>` 是 `None` 变体，`unwrap_or_else` 调用闭包并返回闭包的返回值。

我们指定闭包表达式 `|| self.most_stocked()` 作为 `unwrap_or_else` 的参数。这是一个本身不带参数的闭包（如果闭包有参数，它们会出现在两个竖线之间）。闭包体调用了 `self.most_stocked()`。我们在这里定义了闭包，而 `unwrap_or_else` 的实现会在需要结果时才执行这个闭包。

运行这段代码会打印以下内容：

```console
{{#include ../listings/ch13-functional-features/listing-13-01/output.txt}}
```

这里有一个有趣的方面：我们传递了一个在当前 `Inventory` 实例上调用 `self.most_stocked()` 的闭包。标准库不需要了解我们定义的 `Inventory` 或 `ShirtColor` 类型，也不需要了解我们在这个场景中想要使用的逻辑。闭包捕获了对 `self` 这个 `Inventory` 实例的不可变引用，并将其与我们指定的代码一起传递给 `unwrap_or_else` 方法。而函数则无法以这种方式捕获其环境。

<!-- Old headings. Do not remove or links may break. -->

<a id="closure-type-inference-and-annotation"></a>

### 闭包类型推断和标注

函数和闭包之间还有更多区别。闭包通常不需要像 `fn` 函数那样标注参数类型或返回值类型。函数需要类型标注，因为类型是暴露给用户的显式接口的一部分。严格定义这个接口对于确保所有人都认同函数使用和返回什么类型的值非常重要。而闭包不会像这样用在暴露的接口中：它们存储在变量中，在使用时不需要命名，也不会暴露给库的用户。

闭包通常很短，只在狭窄的上下文中有意义，而不是在任意场景中使用。在这些有限的上下文中，编译器可以推断参数和返回值的类型，类似于它能够推断大多数变量的类型（也有少数情况下编译器同样需要闭包的类型标注）。

和变量一样，如果我们想增加明确性和清晰度，可以添加类型标注，代价是比严格必要的写法更加冗长。为闭包添加类型标注看起来如示例 13-2 所示的定义。在这个例子中，我们定义了一个闭包并将其存储在变量中，而不是像示例 13-1 那样在传递参数的地方直接定义闭包。

<Listing number="13-2" file-name="src/main.rs" caption="为闭包添加可选的参数和返回值类型标注">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-02/src/main.rs:here}}
```

</Listing>

添加类型标注后，闭包的语法看起来更像函数的语法了。这里我们定义了一个将参数加 1 的函数和一个具有相同行为的闭包，以便对比。我们添加了一些空格来对齐相关部分。这说明了闭包语法与函数语法的相似之处，区别在于使用竖线以及部分语法是可选的：

```rust,ignore
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

第一行展示了一个函数定义，第二行展示了一个完整标注的闭包定义。第三行去掉了闭包定义中的类型标注。第四行去掉了花括号，因为闭包体只有一个表达式，花括号是可选的。这些都是有效的定义，在调用时会产生相同的行为。`add_one_v3` 和 `add_one_v4` 这两行需要闭包被实际使用才能编译，因为类型将从使用方式中推断出来。这类似于 `let v = Vec::new();` 需要类型标注或者向 `Vec` 中插入某种类型的值，Rust 才能推断出类型。

对于闭包定义，编译器会为每个参数和返回值推断出一个具体类型。例如，示例 13-3 展示了一个简短闭包的定义，它只是返回接收到的参数值。这个闭包除了用于本例的演示目的外并没有什么实际用途。注意我们没有为定义添加任何类型标注。因为没有类型标注，我们可以用任何类型调用这个闭包，这里我们第一次用 `String` 调用了它。如果我们接着尝试用整数调用 `example_closure`，就会得到一个错误。

<Listing number="13-3" file-name="src/main.rs" caption="尝试用两种不同类型调用一个类型被推断的闭包">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-03/src/main.rs:here}}
```

</Listing>

编译器给出如下错误：

```console
{{#include ../listings/ch13-functional-features/listing-13-03/output.txt}}
```

第一次用 `String` 值调用 `example_closure` 时，编译器推断 `x` 的类型和闭包的返回类型为 `String`。这些类型随后就被锁定在 `example_closure` 的闭包中，当我们接下来尝试对同一个闭包使用不同类型时，就会得到类型错误。

### 捕获引用或移动所有权

闭包可以通过三种方式从环境中捕获值，这直接对应于函数接受参数的三种方式：不可变借用、可变借用和获取所有权。闭包会根据函数体对捕获值的操作来决定使用哪种方式。

在示例 13-4 中，我们定义了一个闭包，它捕获了对名为 `list` 的 vector 的不可变引用，因为它只需要不可变引用就能打印值。

<Listing number="13-4" file-name="src/main.rs" caption="定义并调用一个捕获不可变引用的闭包">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-04/src/main.rs}}
```

</Listing>

这个例子还说明了变量可以绑定到闭包定义，之后我们可以通过变量名加括号来调用闭包，就好像变量名是函数名一样。

因为我们可以同时拥有多个对 `list` 的不可变引用，所以 `list` 在闭包定义之前的代码、闭包定义之后但调用之前的代码，以及闭包调用之后的代码中都是可访问的。这段代码可以编译、运行，并打印：

```console
{{#include ../listings/ch13-functional-features/listing-13-04/output.txt}}
```

接下来，在示例 13-5 中，我们修改闭包体，使其向 `list` vector 中添加一个元素。闭包现在捕获的是一个可变引用。

<Listing number="13-5" file-name="src/main.rs" caption="定义并调用一个捕获可变引用的闭包">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-05/src/main.rs}}
```

</Listing>

这段代码可以编译、运行，并打印：

```console
{{#include ../listings/ch13-functional-features/listing-13-05/output.txt}}
```

注意在 `borrows_mutably` 闭包的定义和调用之间不再有 `println!`：当 `borrows_mutably` 被定义时，它捕获了对 `list` 的可变引用。闭包调用之后我们没有再使用闭包，所以可变借用就结束了。在闭包定义和闭包调用之间，不允许进行不可变借用来打印，因为当存在可变借用时，不允许其他借用。试着在那里添加一个 `println!`，看看你会得到什么错误信息！

如果你想强制闭包获取它所使用的环境值的所有权，即使闭包体并不严格需要所有权，也可以在参数列表前使用 `move` 关键字。

这个技巧在将闭包传递给新线程以移动数据使其归新线程所有时最为有用。我们将在第 16 章讨论并发时详细讨论线程以及为什么要使用它们，但现在让我们简要探索一下使用需要 `move` 关键字的闭包来生成新线程。示例 13-6 修改了示例 13-4，在新线程而不是主线程中打印 vector。

<Listing number="13-6" file-name="src/main.rs" caption="使用 `move` 强制闭包获取线程中 `list` 的所有权">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-06/src/main.rs}}
```

</Listing>

我们生成了一个新线程，将一个闭包作为参数传递给线程来运行。闭包体打印出列表。在示例 13-4 中，闭包只使用不可变引用捕获了 `list`，因为这是打印它所需的最少访问权限。在这个例子中，即使闭包体仍然只需要不可变引用，我们也需要通过在闭包定义的开头放置 `move` 关键字来指定 `list` 应该被移动到闭包中。如果主线程在对新线程调用 `join` 之前执行了更多操作，新线程可能在主线程的其余部分完成之前结束，或者主线程可能先结束。如果主线程保持了 `list` 的所有权但在新线程之前结束并丢弃了 `list`，那么线程中的不可变引用将会无效。因此，编译器要求将 `list` 移动到传递给新线程的闭包中，以使引用有效。试着去掉 `move` 关键字，或者在闭包定义之后在主线程中使用 `list`，看看你会得到什么编译器错误！

<!-- Old headings. Do not remove or links may break. -->

<a id="storing-closures-using-generic-parameters-and-the-fn-traits"></a>
<a id="limitations-of-the-cacher-implementation"></a>
<a id="moving-captured-values-out-of-the-closure-and-the-fn-traits"></a>
<a id="moving-captured-values-out-of-closures-and-the-fn-traits"></a>

### 将捕获的值移出闭包

一旦闭包从定义它的环境中捕获了引用或获取了值的所有权（从而影响了什么被移 _入_ 闭包），闭包体中的代码定义了当闭包稍后被执行时对引用或值会发生什么（从而影响了什么被移 _出_ 闭包）。

闭包体可以做以下任何事情：将捕获的值移出闭包、修改捕获的值、既不移动也不修改值，或者一开始就不从环境中捕获任何东西。

闭包捕获和处理环境中值的方式影响闭包实现哪些 trait，而 trait 是函数和结构体指定它们可以使用哪种闭包的方式。闭包会自动以累加的方式实现以下一个、两个或全部三个 `Fn` trait，具体取决于闭包体如何处理这些值：

* `FnOnce` 适用于可以被调用一次的闭包。所有闭包至少实现了这个 trait，因为所有闭包都可以被调用。如果一个闭包将捕获的值移出了其闭包体，那么它只会实现 `FnOnce` 而不会实现其他 `Fn` trait，因为它只能被调用一次。
* `FnMut` 适用于不会将捕获的值移出闭包体但可能会修改捕获值的闭包。这些闭包可以被调用多次。
* `Fn` 适用于不会将捕获的值移出闭包体也不会修改捕获值的闭包，以及不从环境中捕获任何东西的闭包。这些闭包可以在不改变其环境的情况下被多次调用，这在诸如多次并发调用闭包等场景中非常重要。

让我们来看看示例 13-1 中使用的 `Option<T>` 上的 `unwrap_or_else` 方法的定义：

```rust,ignore
impl<T> Option<T> {
    pub fn unwrap_or_else<F>(self, f: F) -> T
    where
        F: FnOnce() -> T
    {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

回忆一下，`T` 是表示 `Option` 的 `Some` 变体中值的类型的泛型类型。类型 `T` 也是 `unwrap_or_else` 函数的返回类型：例如，在 `Option<String>` 上调用 `unwrap_or_else` 的代码将得到一个 `String`。

接下来，注意 `unwrap_or_else` 函数有一个额外的泛型类型参数 `F`。`F` 类型是名为 `f` 的参数的类型，也就是我们在调用 `unwrap_or_else` 时提供的闭包。

泛型类型 `F` 上指定的 trait 约束是 `FnOnce() -> T`，这意味着 `F` 必须能够被调用一次、不接受参数并返回一个 `T`。在 trait 约束中使用 `FnOnce` 表达了 `unwrap_or_else` 不会调用 `f` 超过一次的约束。在 `unwrap_or_else` 的函数体中，我们可以看到如果 `Option` 是 `Some`，`f` 不会被调用。如果 `Option` 是 `None`，`f` 将被调用一次。因为所有闭包都实现了 `FnOnce`，`unwrap_or_else` 接受所有三种闭包，尽可能地灵活。

> 注意：如果我们想做的事情不需要从环境中捕获值，可以在需要实现某个 `Fn` trait 的地方使用函数名而不是闭包。例如，对于 `Option<Vec<T>>` 值，我们可以调用 `unwrap_or_else(Vec::new)` 来在值为 `None` 时获取一个新的空 vector。编译器会自动为函数定义实现适用的 `Fn` trait。

现在让我们来看看定义在切片上的标准库方法 `sort_by_key`，看看它与 `unwrap_or_else` 有何不同，以及为什么 `sort_by_key` 使用 `FnMut` 而不是 `FnOnce` 作为 trait 约束。闭包接受一个参数，是对切片中当前正在考虑的元素的引用，并返回一个可以排序的 `K` 类型的值。当你想按每个元素的某个特定属性对切片进行排序时，这个函数非常有用。在示例 13-7 中，我们有一个 `Rectangle` 实例的列表，使用 `sort_by_key` 按 `width` 属性从低到高排序。

<Listing number="13-7" file-name="src/main.rs" caption="使用 `sort_by_key` 按宽度对矩形排序">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-07/src/main.rs}}
```

</Listing>

这段代码打印：

```console
{{#include ../listings/ch13-functional-features/listing-13-07/output.txt}}
```

`sort_by_key` 被定义为接受一个 `FnMut` 闭包的原因是它会多次调用闭包：对切片中的每个元素调用一次。闭包 `|r| r.width` 不会从环境中捕获、修改或移出任何东西，所以它满足 trait 约束要求。

相比之下，示例 13-8 展示了一个只实现 `FnOnce` trait 的闭包的例子，因为它将一个值移出了环境。编译器不允许我们将这个闭包用于 `sort_by_key`。

<Listing number="13-8" file-name="src/main.rs" caption="尝试将一个 `FnOnce` 闭包用于 `sort_by_key`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-08/src/main.rs}}
```

</Listing>

这是一种刻意设计的、迂回的方式（而且行不通），试图在排序 `list` 时计算 `sort_by_key` 调用闭包的次数。这段代码试图通过将 `value`——一个来自闭包环境的 `String`——推入 `sort_operations` vector 来实现计数。闭包捕获了 `value`，然后通过将 `value` 的所有权转移给 `sort_operations` vector 来将 `value` 移出闭包。这个闭包只能被调用一次；第二次调用将无法工作，因为 `value` 已经不在环境中，无法再次被推入 `sort_operations`！因此，这个闭包只实现了 `FnOnce`。当我们尝试编译这段代码时，会得到一个错误，指出 `value` 不能被移出闭包，因为闭包必须实现 `FnMut`：

```console
{{#include ../listings/ch13-functional-features/listing-13-08/output.txt}}
```

错误指向了闭包体中将 `value` 移出环境的那一行。要修复这个问题，我们需要修改闭包体，使其不将值移出环境。在环境中维护一个计数器并在闭包体中递增它的值，是一种更直接的计算闭包被调用次数的方式。示例 13-9 中的闭包可以与 `sort_by_key` 一起使用，因为它只捕获了对 `num_sort_operations` 计数器的可变引用，因此可以被多次调用。

<Listing number="13-9" file-name="src/main.rs" caption="允许将 `FnMut` 闭包用于 `sort_by_key`">

```rust
{{#rustdoc_include ../listings/ch13-functional-features/listing-13-09/src/main.rs}}
```

</Listing>

`Fn` trait 在定义或使用利用闭包的函数或类型时非常重要。在下一节中，我们将讨论迭代器。许多迭代器方法都接受闭包参数，所以在继续学习时请记住这些闭包的细节！

[unwrap-or-else]: ../std/option/enum.Option.html#method.unwrap_or_else
