## 不安全的 Rust

到目前为止，我们讨论的所有代码都在编译时强制执行了 Rust 的内存安全保证。然而，Rust 内部还隐藏着另一种语言，它不强制执行这些内存安全保证：这就是所谓的**不安全 Rust**（_unsafe Rust_），它的工作方式与常规 Rust 一样，但赋予了我们额外的超能力。

不安全 Rust 之所以存在，是因为静态分析本质上是保守的。当编译器试图判断代码是否遵守了安全保证时，拒绝一些合法的程序总比接受一些非法的程序要好。虽然代码*可能*没有问题，但如果 Rust 编译器没有足够的信息来确认，它就会拒绝该代码。在这种情况下，你可以使用不安全代码来告诉编译器："相信我，我知道自己在做什么。"但请注意，使用不安全 Rust 的风险由你自己承担：如果不安全代码使用不当，就可能出现内存不安全导致的问题，例如空指针解引用。

Rust 拥有不安全的另一面还有一个原因，那就是底层计算机硬件本质上就是不安全的。如果 Rust 不允许你执行不安全操作，你就无法完成某些任务。Rust 需要允许你进行底层系统编程，例如直接与操作系统交互，甚至编写自己的操作系统。底层系统编程正是这门语言的目标之一。接下来让我们探索不安全 Rust 能做什么以及如何使用它。

<!-- Old headings. Do not remove or links may break. -->

<a id="unsafe-superpowers"></a>

### 执行不安全的超能力

要切换到不安全 Rust，请使用 `unsafe` 关键字，然后开始一个包含不安全代码的新代码块。在不安全 Rust 中，你可以执行五种在安全 Rust 中无法执行的操作，我们称之为**不安全超能力**（_unsafe superpowers_）。这些超能力包括：

1. 解引用裸指针。
1. 调用不安全的函数或方法。
1. 访问或修改可变的静态变量。
1. 实现不安全的 trait。
1. 访问 `union` 的字段。

理解这一点很重要：`unsafe` 并不会关闭借用检查器或禁用 Rust 的其他安全检查。如果你在不安全代码中使用引用，它仍然会被检查。`unsafe` 关键字只是让你能够访问上述五种特性，而这些特性不会被编译器进行内存安全检查。你在不安全代码块中仍然能获得一定程度的安全保障。

此外，`unsafe` 并不意味着代码块中的代码一定是危险的，或者一定会出现内存安全问题。其意图是，作为程序员，你将确保 `unsafe` 代码块中的代码以合法的方式访问内存。

人都会犯错，错误在所难免，但通过要求这五种不安全操作必须放在标注了 `unsafe` 的代码块中，你就能知道任何与内存安全相关的错误一定在 `unsafe` 代码块内。保持 `unsafe` 代码块尽可能小，这样在排查内存错误时你会感到庆幸。

为了尽可能隔离不安全代码，最好将这类代码封装在安全的抽象中，并提供安全的 API。我们将在本章后面讨论不安全函数和方法时详细介绍这一点。标准库的部分功能就是作为经过审计的不安全代码之上的安全抽象来实现的。将不安全代码包装在安全抽象中，可以防止 `unsafe` 的使用泄漏到所有你或你的用户可能想要使用 `unsafe` 代码实现的功能的地方，因为使用安全抽象本身是安全的。

让我们依次看看这五种不安全超能力。我们还将介绍一些为不安全代码提供安全接口的抽象。

### 解引用裸指针

在第四章的["悬垂引用"][dangling-references]<!-- ignore -->部分，我们提到编译器会确保引用始终有效。不安全 Rust 有两种新的类型，称为**裸指针**（_raw pointers_），它们类似于引用。与引用一样，裸指针可以是不可变的或可变的，分别写作 `*const T` 和 `*mut T`。这里的星号不是解引用运算符，而是类型名称的一部分。在裸指针的上下文中，**不可变**意味着指针在被解引用后不能直接赋值。

与引用和智能指针不同，裸指针：

- 允许忽略借用规则，可以同时拥有指向同一位置的不可变和可变指针，或者多个可变指针
- 不保证指向有效的内存
- 允许为空
- 不实现任何自动清理

通过放弃让 Rust 强制执行这些保证，你可以用安全保障来换取更高的性能，或者与另一种语言或硬件进行交互——在这些场景中 Rust 的保证并不适用。

示例 20-1 展示了如何创建一个不可变和一个可变的裸指针。

<Listing number="20-1" caption="使用裸借用运算符创建裸指针">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-01/src/main.rs:here}}
```

</Listing>

注意这段代码中没有包含 `unsafe` 关键字。我们可以在安全代码中创建裸指针，只是不能在不安全代码块之外解引用裸指针，稍后你就会看到。

我们使用裸借用运算符创建了裸指针：`&raw const num` 创建了一个 `*const i32` 类型的不可变裸指针，`&raw mut num` 创建了一个 `*mut i32` 类型的可变裸指针。因为我们直接从局部变量创建了它们，所以我们知道这些特定的裸指针是有效的，但不能对任意裸指针都做这样的假设。

为了演示这一点，接下来我们将创建一个无法确定其有效性的裸指针，使用 `as` 关键字进行类型转换而不是使用裸借用运算符。示例 20-2 展示了如何创建一个指向内存中任意位置的裸指针。尝试使用任意内存是未定义行为：该地址处可能有数据也可能没有，编译器可能会优化代码使得没有内存访问，或者程序可能因段错误而终止。通常没有充分的理由编写这样的代码，特别是在可以使用裸借用运算符的情况下，但这确实是可能的。

<Listing number="20-2" caption="创建指向任意内存地址的裸指针">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-02/src/main.rs:here}}
```

</Listing>

回忆一下，我们可以在安全代码中创建裸指针，但不能解引用裸指针并读取其指向的数据。在示例 20-3 中，我们对裸指针使用了解引用运算符 `*`，这需要一个 `unsafe` 代码块。

<Listing number="20-3" caption="在 `unsafe` 代码块中解引用裸指针">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-03/src/main.rs:here}}
```

</Listing>

创建指针本身不会造成任何危害；只有当我们尝试访问它所指向的值时，才可能遇到无效值的问题。

还要注意，在示例 20-1 和 20-3 中，我们创建了 `*const i32` 和 `*mut i32` 裸指针，它们都指向 `num` 所在的同一内存位置。如果我们尝试创建一个不可变引用和一个可变引用指向 `num`，代码将无法编译，因为 Rust 的所有权规则不允许在存在不可变引用的同时创建可变引用。而使用裸指针，我们可以创建指向同一位置的可变指针和不可变指针，并通过可变指针修改数据，这可能会导致数据竞争。请务必小心！

既然有这么多危险，为什么还要使用裸指针呢？一个主要的使用场景是与 C 代码交互，你将在下一节中看到。另一个场景是构建借用检查器无法理解的安全抽象。我们将先介绍不安全函数，然后看一个使用不安全代码的安全抽象示例。

### 调用不安全的函数或方法

你可以在不安全代码块中执行的第二种操作是调用不安全函数。不安全函数和方法看起来与常规函数和方法完全一样，只是在定义的其余部分之前多了一个 `unsafe` 关键字。这里的 `unsafe` 关键字表示该函数有一些我们在调用时需要遵守的要求，因为 Rust 无法保证我们已经满足了这些要求。通过在 `unsafe` 代码块中调用不安全函数，我们表明已经阅读了该函数的文档，并承担遵守函数契约的责任。

下面是一个名为 `dangerous` 的不安全函数，它的函数体中什么也不做：

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/no-listing-01-unsafe-fn/src/main.rs:here}}
```

我们必须在单独的 `unsafe` 代码块中调用 `dangerous` 函数。如果我们尝试在没有 `unsafe` 代码块的情况下调用 `dangerous`，将会得到一个错误：

```console
{{#include ../listings/ch20-advanced-features/output-only-01-missing-unsafe/output.txt}}
```

通过 `unsafe` 代码块，我们向 Rust 断言我们已经阅读了函数的文档，理解了如何正确使用它，并且已经验证我们满足了函数的契约。

要在 `unsafe` 函数体中执行不安全操作，你仍然需要使用 `unsafe` 代码块，就像在常规函数中一样，如果你忘记了，编译器会发出警告。这有助于我们保持 `unsafe` 代码块尽可能小，因为不安全操作可能并不需要覆盖整个函数体。

#### 创建不安全代码之上的安全抽象

仅仅因为函数包含不安全代码，并不意味着我们需要将整个函数标记为不安全的。事实上，将不安全代码包装在安全函数中是一种常见的抽象方式。作为示例，让我们研究标准库中的 `split_at_mut` 函数，它需要用到一些不安全代码。我们将探索如何实现它。这个安全方法定义在可变切片上：它接受一个切片，并通过在给定索引处分割，将其变为两个切片。示例 20-4 展示了如何使用 `split_at_mut`。

<Listing number="20-4" caption="使用安全的 `split_at_mut` 函数">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-04/src/main.rs:here}}
```

</Listing>

仅使用安全 Rust 无法实现这个函数。一种尝试可能如示例 20-5 所示，但它无法编译。为了简单起见，我们将 `split_at_mut` 实现为函数而非方法，并且只针对 `i32` 类型的切片而非泛型 `T`。

<Listing number="20-5" caption="尝试仅使用安全 Rust 实现 `split_at_mut`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-05/src/main.rs:here}}
```

</Listing>

这个函数首先获取切片的总长度。然后通过检查参数给定的索引是否小于或等于长度，来断言该索引在切片范围内。这个断言意味着，如果我们传入一个大于长度的索引来分割切片，函数会在尝试使用该索引之前 panic。

接着，我们在一个元组中返回两个可变切片：一个从原始切片的开头到 `mid` 索引，另一个从 `mid` 到切片的末尾。

当我们尝试编译示例 20-5 中的代码时，会得到一个错误：

```console
{{#include ../listings/ch20-advanced-features/listing-20-05/output.txt}}
```

Rust 的借用检查器无法理解我们是在借用切片的不同部分；它只知道我们从同一个切片借用了两次。借用切片的不同部分从根本上来说是没问题的，因为两个切片不会重叠，但 Rust 没有聪明到能理解这一点。当我们知道代码是正确的，但 Rust 不知道时，就该使用不安全代码了。

示例 20-6 展示了如何使用 `unsafe` 代码块、裸指针和一些不安全函数调用来实现 `split_at_mut`。

<Listing number="20-6" caption="在 `split_at_mut` 函数的实现中使用不安全代码">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-06/src/main.rs:here}}
```

</Listing>

回忆第四章["切片类型"][the-slice-type]<!-- ignore -->部分，切片是一个指向某些数据的指针加上切片的长度。我们使用 `len` 方法获取切片的长度，使用 `as_mut_ptr` 方法访问切片的裸指针。在这个例子中，因为我们有一个 `i32` 值的可变切片，`as_mut_ptr` 返回一个类型为 `*mut i32` 的裸指针，我们将其存储在变量 `ptr` 中。

我们保留了 `mid` 索引在切片范围内的断言。然后是不安全代码：`slice::from_raw_parts_mut` 函数接受一个裸指针和一个长度，并创建一个切片。我们用这个函数创建了一个从 `ptr` 开始、长度为 `mid` 的切片。然后我们以 `mid` 为参数调用 `ptr` 上的 `add` 方法来获取一个从 `mid` 开始的裸指针，并使用该指针和 `mid` 之后剩余元素的数量作为长度来创建一个切片。

`slice::from_raw_parts_mut` 函数是不安全的，因为它接受一个裸指针，并且必须信任该指针是有效的。裸指针上的 `add` 方法也是不安全的，因为它必须信任偏移位置也是一个有效的指针。因此，我们必须在 `slice::from_raw_parts_mut` 和 `add` 的调用周围放置 `unsafe` 代码块才能调用它们。通过查看代码并添加 `mid` 必须小于或等于 `len` 的断言，我们可以确定 `unsafe` 代码块中使用的所有裸指针都是指向切片内数据的有效指针。这是 `unsafe` 的一种可接受且恰当的用法。

注意我们不需要将最终的 `split_at_mut` 函数标记为 `unsafe`，并且可以从安全 Rust 中调用这个函数。我们创建了一个对不安全代码的安全抽象，其实现以安全的方式使用了 `unsafe` 代码，因为它只从该函数有权访问的数据中创建有效的指针。

相比之下，示例 20-7 中对 `slice::from_raw_parts_mut` 的使用在切片被使用时很可能会崩溃。这段代码取一个任意的内存位置并创建了一个长度为 10,000 的切片。

<Listing number="20-7" caption="从任意内存位置创建切片">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-07/src/main.rs:here}}
```

</Listing>

我们并不拥有这个任意位置的内存，也无法保证这段代码创建的切片包含有效的 `i32` 值。尝试将 `values` 当作有效切片使用会导致未定义行为。

#### 使用 `extern` 函数调用外部代码

有时你的 Rust 代码可能需要与其他语言编写的代码进行交互。为此，Rust 提供了 `extern` 关键字，用于创建和使用**外部函数接口**（_Foreign Function Interface，FFI_），这是一种编程语言定义函数并允许不同（外部）编程语言调用这些函数的方式。

示例 20-8 演示了如何设置与 C 标准库中 `abs` 函数的集成。在 `extern` 块中声明的函数从 Rust 代码调用时通常是不安全的，因此 `extern` 块也必须标记为 `unsafe`。原因是其他语言不强制执行 Rust 的规则和保证，Rust 也无法检查它们，所以确保安全的责任落在了程序员身上。

<Listing number="20-8" file-name="src/main.rs" caption="声明并调用在另一种语言中定义的 `extern` 函数">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-08/src/main.rs}}
```

</Listing>

在 `unsafe extern "C"` 块中，我们列出了想要调用的来自其他语言的外部函数的名称和签名。`"C"` 部分定义了外部函数使用的**应用程序二进制接口**（_application binary interface，ABI_）：ABI 定义了如何在汇编层面调用函数。`"C"` ABI 是最常见的，遵循 C 编程语言的 ABI。关于 Rust 支持的所有 ABI 的信息，可以在 [Rust 参考手册][ABI]中找到。

在 `unsafe extern` 块中声明的每个条目都隐式地是不安全的。然而，有些 FFI 函数*确实*可以安全调用。例如，C 标准库中的 `abs` 函数没有任何内存安全方面的顾虑，并且我们知道它可以用任何 `i32` 来调用。在这种情况下，我们可以使用 `safe` 关键字来声明这个特定的函数是安全可调用的，即使它在 `unsafe extern` 块中。一旦做了这个更改，调用它就不再需要 `unsafe` 代码块了，如示例 20-9 所示。

<Listing number="20-9" file-name="src/main.rs" caption="在 `unsafe extern` 块中显式地将函数标记为 `safe` 并安全地调用它">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-09/src/main.rs}}
```

</Listing>

将函数标记为 `safe` 并不会使其本质上变得安全！相反，这就像你对 Rust 做出的一个承诺，保证它是安全的。确保这个承诺得到遵守仍然是你的责任！

#### 从其他语言调用 Rust 函数

我们也可以使用 `extern` 来创建一个允许其他语言调用 Rust 函数的接口。我们不需要创建整个 `extern` 块，而是在相关函数的 `fn` 关键字之前添加 `extern` 关键字并指定要使用的 ABI。我们还需要添加 `#[unsafe(no_mangle)]` 注解来告诉 Rust 编译器不要修改（mangle）这个函数的名称。**名称修改**（_Mangling_）是编译器将我们给函数起的名称更改为包含更多信息的不同名称的过程，这些信息供编译过程的其他部分使用，但对人类来说可读性较差。每种编程语言的编译器对名称的修改方式略有不同，因此为了让 Rust 函数能被其他语言命名，我们必须禁用 Rust 编译器的名称修改。这是不安全的，因为在没有内置名称修改的情况下，不同库之间可能会出现名称冲突，所以确保导出的名称安全是我们的责任。

在下面的例子中，我们让 `call_from_c` 函数在编译为共享库并从 C 链接后，可以从 C 代码中访问：

```
#[unsafe(no_mangle)]
pub extern "C" fn call_from_c() {
    println!("Just called a Rust function from C!");
}
```

这种 `extern` 的用法只需要在属性中使用 `unsafe`，而不需要在 `extern` 块上使用。

### 访问或修改可变的静态变量

在本书中，我们还没有讨论过全局变量。Rust 确实支持全局变量，但它们与 Rust 的所有权规则可能会产生冲突。如果两个线程访问同一个可变全局变量，就可能导致数据竞争。

在 Rust 中，全局变量被称为**静态**（_static_）变量。示例 20-10 展示了一个以字符串切片作为值的静态变量的声明和使用示例。

<Listing number="20-10" file-name="src/main.rs" caption="定义和使用不可变的静态变量">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-10/src/main.rs}}
```

</Listing>

静态变量类似于常量，我们在第三章["声明常量"][constants]<!-- ignore -->部分讨论过。按照惯例，静态变量的名称使用 `SCREAMING_SNAKE_CASE` 格式。静态变量只能存储具有 `'static` 生命周期的引用，这意味着 Rust 编译器可以自行推断生命周期，我们不需要显式标注。访问不可变的静态变量是安全的。

常量和不可变静态变量之间有一个微妙的区别：静态变量中的值在内存中有一个固定的地址。使用该值时总是访问相同的数据。而常量则允许在使用时复制其数据。另一个区别是静态变量可以是可变的。访问和修改可变静态变量是**不安全的**（_unsafe_）。示例 20-11 展示了如何声明、访问和修改一个名为 `COUNTER` 的可变静态变量。

<Listing number="20-11" file-name="src/main.rs" caption="读取或写入可变静态变量是不安全的">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-11/src/main.rs}}
```

</Listing>

与常规变量一样，我们使用 `mut` 关键字指定可变性。任何读取或写入 `COUNTER` 的代码都必须在 `unsafe` 代码块中。示例 20-11 中的代码可以编译并打印 `COUNTER: 3`，正如我们所期望的那样，因为它是单线程的。如果多个线程访问 `COUNTER`，很可能会导致数据竞争，因此这是未定义行为。所以我们需要将整个函数标记为 `unsafe`，并记录安全限制，以便任何调用该函数的人知道哪些操作是安全的，哪些不是。

每当我们编写不安全函数时，惯例是编写一个以 `SAFETY` 开头的注释，解释调用者需要做什么才能安全地调用该函数。同样，每当我们执行不安全操作时，惯例是编写一个以 `SAFETY` 开头的注释，解释安全规则是如何被遵守的。

此外，编译器默认会通过编译器 lint 拒绝任何创建可变静态变量引用的尝试。你必须通过添加 `#[allow(static_mut_refs)]` 注解来显式选择退出该 lint 的保护，或者通过裸借用运算符创建的裸指针来访问可变静态变量。这包括引用被隐式创建的情况，例如在这段代码清单中的 `println!` 中使用时。要求通过裸指针创建对静态可变变量的引用，有助于使其安全要求更加明显。

对于全局可访问的可变数据，很难确保不存在数据竞争，这就是为什么 Rust 认为可变静态变量是不安全的。在可能的情况下，最好使用我们在第十六章中讨论的并发技术和线程安全的智能指针，这样编译器就能检查来自不同线程的数据访问是否安全。

### 实现不安全的 trait

我们可以使用 `unsafe` 来实现不安全的 trait。当一个 trait 的至少一个方法具有编译器无法验证的不变量时，该 trait 就是不安全的。我们通过在 `trait` 前添加 `unsafe` 关键字来声明一个 trait 是不安全的，并将该 trait 的实现也标记为 `unsafe`，如示例 20-12 所示。

<Listing number="20-12" caption="定义和实现不安全的 trait">

```rust
{{#rustdoc_include ../listings/ch20-advanced-features/listing-20-12/src/main.rs:here}}
```

</Listing>

通过使用 `unsafe impl`，我们承诺将遵守编译器无法验证的不变量。

举个例子，回忆一下我们在第十六章["`Send` 和 `Sync` 的可扩展并发"][send-and-sync]<!-- ignore -->部分讨论的 `Send` 和 `Sync` 标记 trait：如果我们的类型完全由实现了 `Send` 和 `Sync` 的其他类型组成，编译器会自动实现这些 trait。如果我们实现了一个包含未实现 `Send` 或 `Sync` 的类型（如裸指针）的类型，并且我们想将该类型标记为 `Send` 或 `Sync`，就必须使用 `unsafe`。Rust 无法验证我们的类型是否满足可以安全地跨线程发送或从多个线程访问的保证；因此，我们需要手动进行这些检查，并用 `unsafe` 来表明这一点。

### 访问联合体的字段

只能与 `unsafe` 一起使用的最后一种操作是访问联合体（union）的字段。**联合体**（*union*）类似于 `struct`，但在特定实例中同一时间只使用一个已声明的字段。联合体主要用于与 C 代码中的联合体进行交互。访问联合体的字段是不安全的，因为 Rust 无法保证当前存储在联合体实例中的数据类型。你可以在 [Rust 参考手册][unions]中了解更多关于联合体的信息。

### 使用 Miri 检查不安全代码

编写不安全代码时，你可能想检查所写的代码是否确实安全且正确。最好的方法之一是使用 Miri，这是一个用于检测未定义行为的官方 Rust 工具。借用检查器是一个在编译时工作的**静态**工具，而 Miri 是一个在运行时工作的**动态**工具。它通过运行你的程序或测试套件来检查代码，并在你违反它所理解的 Rust 工作规则时进行检测。

使用 Miri 需要 Rust 的 nightly 版本（我们在[附录 G：Rust 是如何构建的以及 "Nightly Rust"][nightly]<!-- ignore -->中有更多介绍）。你可以通过输入 `rustup +nightly component add miri` 来安装 Rust 的 nightly 版本和 Miri 工具。这不会改变你的项目使用的 Rust 版本；它只是将该工具添加到你的系统中，以便你在需要时使用。你可以通过输入 `cargo +nightly miri run` 或 `cargo +nightly miri test` 在项目上运行 Miri。

为了展示 Miri 有多大帮助，让我们看看对示例 20-7 运行它时会发生什么。

```console
{{#include ../listings/ch20-advanced-features/listing-20-07/output.txt}}
```

Miri 正确地警告我们将整数转换为指针可能有问题，但 Miri 无法确定是否存在问题，因为它不知道该指针的来源。然后，Miri 在示例 20-7 存在未定义行为的地方返回了一个错误，因为我们有一个悬垂指针。感谢 Miri，我们现在知道存在未定义行为的风险，可以思考如何使代码变得安全。在某些情况下，Miri 甚至可以提供修复错误的建议。

Miri 并不能捕获你在编写不安全代码时可能犯的所有错误。Miri 是一个动态分析工具，所以它只能捕获实际运行的代码中的问题。这意味着你需要将它与良好的测试技术结合使用，以增强对所编写的不安全代码的信心。Miri 也不能覆盖代码可能不健全的所有方式。

换句话说：如果 Miri *确实*捕获了一个问题，你就知道存在 bug，但仅仅因为 Miri *没有*捕获 bug 并不意味着不存在问题。不过它确实能捕获很多问题。试着在本章其他不安全代码的示例上运行它，看看它会怎么说！

你可以在 [Miri 的 GitHub 仓库][miri]中了解更多关于 Miri 的信息。

<!-- Old headings. Do not remove or links may break. -->

<a id="when-to-use-unsafe-code"></a>

### 正确使用不安全代码

使用 `unsafe` 来执行刚才讨论的五种超能力并没有错，也不会受到非议，但要让 `unsafe` 代码正确运行确实更加棘手，因为编译器无法帮助维护内存安全。当你有理由使用 `unsafe` 代码时，你可以这样做，而显式的 `unsafe` 标注使得在问题发生时更容易追踪问题的根源。每当你编写不安全代码时，都可以使用 Miri 来帮助你更有信心地确认代码遵守了 Rust 的规则。

要更深入地探索如何有效地使用不安全 Rust，请阅读 Rust 的官方 `unsafe` 指南 [The Rustonomicon][nomicon]。

[dangling-references]: ch04-02-references-and-borrowing.html#dangling-references
[ABI]: ../reference/items/external-blocks.html#abi
[constants]: ch03-01-variables-and-mutability.html#declaring-constants
[send-and-sync]: ch16-04-extensible-concurrency-sync-and-send.html
[the-slice-type]: ch04-03-slices.html#the-slice-type
[unions]: ../reference/items/unions.html
[miri]: https://github.com/rust-lang/miri
[editions]: appendix-05-editions.html
[nightly]: appendix-07-nightly-rust.html
[nomicon]: https://doc.rust-lang.org/nomicon/
