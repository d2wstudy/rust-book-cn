<!-- Old headings. Do not remove or links may break. -->

<a id="treating-smart-pointers-like-regular-references-with-the-deref-trait"></a>
<a id="treating-smart-pointers-like-regular-references-with-deref"></a>

## 像常规引用一样使用智能指针

实现 `Deref` trait 允许你自定义**解引用运算符**（dereference operator）`*` 的行为（不要与乘法运算符或通配符运算符混淆）。通过以一种使智能指针能被当作常规引用来对待的方式实现 `Deref`，你可以编写操作引用的代码，并将该代码同样用于智能指针。

让我们首先看看解引用运算符如何与常规引用配合工作。然后，我们将尝试定义一个行为类似于 `Box<T>` 的自定义类型，看看为什么解引用运算符在我们新定义的类型上不能像引用那样工作。我们将探索如何通过实现 `Deref` trait 使智能指针能够以类似引用的方式工作。最后，我们将了解 Rust 的解引用强制转换（deref coercion）特性，以及它如何让我们既能使用引用也能使用智能指针。

<!-- Old headings. Do not remove or links may break. -->

<a id="following-the-pointer-to-the-value-with-the-dereference-operator"></a>
<a id="following-the-pointer-to-the-value"></a>

### 通过引用追踪值

常规引用是一种指针，理解指针的一种方式是将其看作指向存储在其他位置的值的箭头。在示例 15-6 中，我们创建了一个 `i32` 值的引用，然后使用解引用运算符来追踪引用到达值。

<Listing number="15-6" file-name="src/main.rs" caption="使用解引用运算符追踪指向 `i32` 值的引用">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-06/src/main.rs}}
```

</Listing>

变量 `x` 持有一个 `i32` 值 `5`。我们将 `y` 设置为 `x` 的引用。我们可以断言 `x` 等于 `5`。然而，如果我们想对 `y` 中的值进行断言，就必须使用 `*y` 来追踪引用所指向的值（也就是**解引用**），这样编译器才能比较实际的值。一旦对 `y` 解引用，我们就可以访问 `y` 所指向的整数值，从而与 `5` 进行比较。

如果我们尝试写 `assert_eq!(5, y);`，则会得到如下编译错误：

```console
{{#include ../listings/ch15-smart-pointers/output-only-01-comparing-to-reference/output.txt}}
```

不允许将一个数字与一个数字的引用进行比较，因为它们是不同的类型。我们必须使用解引用运算符来追踪引用所指向的值。

### 像引用一样使用 `Box<T>`

我们可以将示例 15-6 中的代码改写为使用 `Box<T>` 而不是引用；示例 15-7 中对 `Box<T>` 使用的解引用运算符与示例 15-6 中对引用使用的解引用运算符功能相同。

<Listing number="15-7" file-name="src/main.rs" caption="对 `Box<i32>` 使用解引用运算符">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-07/src/main.rs}}
```

</Listing>

示例 15-7 与示例 15-6 的主要区别在于，这里我们将 `y` 设置为一个指向 `x` 值的拷贝的 box 实例，而不是指向 `x` 值的引用。在最后的断言中，我们可以使用解引用运算符来追踪 box 的指针，就像 `y` 是引用时所做的那样。接下来，我们将通过定义自己的 box 类型来探索 `Box<T>` 的特殊之处——是什么使我们能够对其使用解引用运算符。

### 定义自己的智能指针

让我们构建一个类似于标准库提供的 `Box<T>` 类型的包装类型，来体验智能指针类型在默认情况下与引用的行为有何不同。然后，我们将了解如何添加使用解引用运算符的能力。

> 注意：我们即将构建的 `MyBox<T>` 类型与真正的 `Box<T>` 有一个很大的区别：我们的版本不会将数据存储在堆上。这个示例的重点是 `Deref`，因此数据实际存储在哪里不如类似指针的行为重要。

`Box<T>` 类型最终被定义为一个包含一个元素的元组结构体，所以示例 15-8 以同样的方式定义了 `MyBox<T>` 类型。我们还将定义一个 `new` 函数来匹配 `Box<T>` 上定义的 `new` 函数。

<Listing number="15-8" file-name="src/main.rs" caption="定义 `MyBox<T>` 类型">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-08/src/main.rs:here}}
```

</Listing>

我们定义了一个名为 `MyBox` 的结构体并声明了一个泛型参数 `T`，因为我们希望该类型能持有任意类型的值。`MyBox` 类型是一个包含一个 `T` 类型元素的元组结构体。`MyBox::new` 函数接受一个 `T` 类型的参数，并返回一个持有传入值的 `MyBox` 实例。

让我们尝试将示例 15-7 中的 `main` 函数添加到示例 15-8 中，并将其改为使用我们定义的 `MyBox<T>` 类型而不是 `Box<T>`。示例 15-9 中的代码无法编译，因为 Rust 不知道如何解引用 `MyBox`。

<Listing number="15-9" file-name="src/main.rs" caption="尝试以使用引用和 `Box<T>` 相同的方式使用 `MyBox<T>`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-09/src/main.rs:here}}
```

</Listing>

以下是编译错误的结果：

```console
{{#include ../listings/ch15-smart-pointers/listing-15-09/output.txt}}
```

我们的 `MyBox<T>` 类型不能被解引用，因为我们还没有在该类型上实现这个能力。要启用 `*` 运算符的解引用功能，需要实现 `Deref` trait。

<!-- Old headings. Do not remove or links may break. -->

<a id="treating-a-type-like-a-reference-by-implementing-the-deref-trait"></a>

### 实现 `Deref` Trait

如第 10 章["在类型上实现 trait"][impl-trait]<!-- ignore -->中所讨论的，要实现一个 trait，我们需要为该 trait 的必需方法提供实现。标准库提供的 `Deref` trait 要求我们实现一个名为 `deref` 的方法，该方法借用 `self` 并返回一个指向内部数据的引用。示例 15-10 包含了一个添加到 `MyBox<T>` 定义上的 `Deref` 实现。

<Listing number="15-10" file-name="src/main.rs" caption="在 `MyBox<T>` 上实现 `Deref`">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-10/src/main.rs:here}}
```

</Listing>

`type Target = T;` 语法定义了 `Deref` trait 使用的关联类型。关联类型是一种略有不同的声明泛型参数的方式，但你现在不需要担心它们；我们将在第 20 章中更详细地介绍。

我们在 `deref` 方法体中填入了 `&self.0`，这样 `deref` 就会返回一个指向我们想用 `*` 运算符访问的值的引用；回忆一下第 5 章["使用元组结构体创建不同类型"][tuple-structs]<!-- ignore -->中提到的，`.0` 访问元组结构体中的第一个值。示例 15-9 中对 `MyBox<T>` 值调用 `*` 的 `main` 函数现在可以编译了，并且断言也通过了！

没有 `Deref` trait 的话，编译器只能解引用 `&` 引用。`deref` 方法赋予了编译器这样的能力：对于任何实现了 `Deref` 的类型的值，调用 `deref` 方法即可获得一个它知道如何解引用的引用。

当我们在示例 15-9 中输入 `*y` 时，Rust 在幕后实际运行的是这样的代码：

```rust,ignore
*(y.deref())
```

Rust 将 `*` 运算符替换为先调用 `deref` 方法再进行普通解引用的操作，这样我们就不必考虑是否需要调用 `deref` 方法了。Rust 的这个特性让我们可以编写功能相同的代码，无论我们使用的是常规引用还是实现了 `Deref` 的类型。

`deref` 方法返回值的引用，以及 `*(y.deref())` 中括号外的普通解引用仍然必要，这与所有权系统有关。如果 `deref` 方法直接返回值而不是值的引用，该值就会被移出 `self`。在这种情况下以及大多数使用解引用运算符的情况下，我们并不想获取 `MyBox<T>` 内部值的所有权。

注意，每次我们在代码中使用 `*` 时，`*` 运算符都会被替换为先调用 `deref` 方法再调用一次 `*` 运算符，且仅替换一次。因为 `*` 运算符的替换不会无限递归，我们最终会得到 `i32` 类型的数据，它与示例 15-9 中 `assert_eq!` 里的 `5` 相匹配。

<!-- Old headings. Do not remove or links may break. -->

<a id="implicit-deref-coercions-with-functions-and-methods"></a>
<a id="using-deref-coercions-in-functions-and-methods"></a>

### 在函数和方法中使用解引用强制转换

**解引用强制转换**（deref coercion）将实现了 `Deref` trait 的类型的引用转换为另一种类型的引用。例如，解引用强制转换可以将 `&String` 转换为 `&str`，因为 `String` 实现了 `Deref` trait 并返回 `&str`。解引用强制转换是 Rust 对函数和方法的参数执行的一种便利操作，它仅适用于实现了 `Deref` trait 的类型。当我们将某个特定类型的值的引用作为参数传递给函数或方法，而该引用的类型与函数或方法定义中的参数类型不匹配时，解引用强制转换会自动发生。一系列 `deref` 方法的调用会将我们提供的类型转换为参数所需的类型。

Rust 之所以加入解引用强制转换，是为了让编写函数和方法调用的程序员不必添加那么多显式的 `&` 和 `*` 来进行引用和解引用操作。解引用强制转换特性还让我们可以编写同时适用于引用和智能指针的代码。

为了实际看到解引用强制转换的效果，让我们使用示例 15-8 中定义的 `MyBox<T>` 类型以及示例 15-10 中添加的 `Deref` 实现。示例 15-11 展示了一个具有字符串切片参数的函数定义。

<Listing number="15-11" file-name="src/main.rs" caption="一个 `hello` 函数，其参数 `name` 的类型为 `&str`">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-11/src/main.rs:here}}
```

</Listing>

我们可以用一个字符串切片作为参数来调用 `hello` 函数，例如 `hello("Rust");`。解引用强制转换使得用 `MyBox<String>` 类型值的引用来调用 `hello` 成为可能，如示例 15-12 所示。

<Listing number="15-12" file-name="src/main.rs" caption="使用 `MyBox<String>` 值的引用调用 `hello`，这得益于解引用强制转换">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-12/src/main.rs:here}}
```

</Listing>

这里我们用参数 `&m` 调用 `hello` 函数，`&m` 是一个 `MyBox<String>` 值的引用。因为我们在示例 15-10 中为 `MyBox<T>` 实现了 `Deref` trait，Rust 可以通过调用 `deref` 将 `&MyBox<String>` 转换为 `&String`。标准库为 `String` 提供了 `Deref` 的实现，它返回一个字符串切片，这在 `Deref` 的 API 文档中有说明。Rust 再次调用 `deref` 将 `&String` 转换为 `&str`，这就与 `hello` 函数的定义匹配了。

如果 Rust 没有实现解引用强制转换，我们就必须编写示例 15-13 中的代码来代替示例 15-12 中的代码，才能用 `&MyBox<String>` 类型的值调用 `hello`。

<Listing number="15-13" file-name="src/main.rs" caption="如果 Rust 没有解引用强制转换，我们不得不编写的代码">

```rust
{{#rustdoc_include ../listings/ch15-smart-pointers/listing-15-13/src/main.rs:here}}
```

</Listing>

`(*m)` 将 `MyBox<String>` 解引用为 `String`。然后 `&` 和 `[..]` 获取了与整个字符串相等的 `String` 的字符串切片，以匹配 `hello` 的签名。没有解引用强制转换的代码涉及这么多符号，更难阅读、编写和理解。解引用强制转换让 Rust 自动为我们处理这些转换。

当相关类型定义了 `Deref` trait 时，Rust 会分析这些类型并根据需要多次调用 `Deref::deref` 以获得匹配参数类型的引用。需要插入 `Deref::deref` 的次数在编译时就已确定，因此利用解引用强制转换不会带来任何运行时开销！

<!-- Old headings. Do not remove or links may break. -->

<a id="how-deref-coercion-interacts-with-mutability"></a>

### 解引用强制转换与可变引用的交互

类似于使用 `Deref` trait 重载不可变引用的 `*` 运算符，你可以使用 `DerefMut` trait 重载可变引用的 `*` 运算符。

Rust 在发现类型和 trait 实现满足以下三种情况时会执行解引用强制转换：

1. 当 `T: Deref<Target=U>` 时，从 `&T` 到 `&U`
2. 当 `T: DerefMut<Target=U>` 时，从 `&mut T` 到 `&mut U`
3. 当 `T: Deref<Target=U>` 时，从 `&mut T` 到 `&U`

前两种情况除了第二种涉及可变性之外是相同的。第一种情况表明，如果你有一个 `&T`，且 `T` 实现了到某个类型 `U` 的 `Deref`，你可以透明地获得一个 `&U`。第二种情况表明，对于可变引用也会发生同样的解引用强制转换。

第三种情况比较微妙：Rust 也会将可变引用强制转换为不可变引用。但反过来是**不**可能的：不可变引用永远不会被强制转换为可变引用。根据借用规则，如果你有一个可变引用，那么该可变引用必须是对该数据的唯一引用（否则程序无法编译）。将一个可变引用转换为一个不可变引用永远不会违反借用规则。而将一个不可变引用转换为可变引用则要求该不可变引用是对该数据的唯一不可变引用，但借用规则无法保证这一点。因此，Rust 无法假设将不可变引用转换为可变引用是可行的。

[impl-trait]: ch10-02-traits.html#implementing-a-trait-on-a-type
[tuple-structs]: ch05-01-defining-structs.html#creating-different-types-with-tuple-structs
