## 泛型数据类型

我们使用泛型（generics）来创建函数签名或结构体等条目的定义，然后可以将这些定义用于许多不同的具体数据类型。首先让我们看看如何使用泛型来定义函数、结构体、枚举和方法。接着，我们将讨论泛型对代码性能的影响。

### 在函数定义中使用泛型

当定义一个使用泛型的函数时，我们将泛型放在函数签名中通常用于指定参数和返回值数据类型的位置。这样做使我们的代码更加灵活，为函数的调用者提供更多功能，同时避免代码重复。

继续我们的 `largest` 函数，示例 10-4 展示了两个函数，它们都在切片中查找最大值。然后我们将把它们合并为一个使用泛型的函数。

<Listing number="10-4" file-name="src/main.rs" caption="两个仅在名称和签名中的类型上有所不同的函数">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-04/src/main.rs:here}}
```

</Listing>

`largest_i32` 函数就是我们在示例 10-3 中提取出来的那个，它在切片中查找最大的 `i32`。`largest_char` 函数在切片中查找最大的 `char`。这两个函数体的代码完全相同，所以让我们通过在一个函数中引入泛型类型参数来消除这种重复。

要在一个新的函数中参数化类型，我们需要为类型参数命名，就像为函数的值参数命名一样。你可以使用任何标识符作为类型参数名，但我们会使用 `T`，因为按照惯例，Rust 中的类型参数名很短，通常只有一个字母，并且 Rust 的类型命名约定是大驼峰命名法（UpperCamelCase）。`T` 是 _type_ 的缩写，是大多数 Rust 程序员的默认选择。

当我们在函数体中使用一个参数时，必须在签名中声明该参数名，以便编译器知道这个名称的含义。类似地，当我们在函数签名中使用类型参数名时，必须在使用之前声明它。要定义泛型 `largest` 函数，我们将类型名称声明放在尖括号 `<>` 中，位于函数名和参数列表之间，如下所示：

```rust,ignore
fn largest<T>(list: &[T]) -> &T {
```

我们可以这样理解这个定义："函数 `largest` 对某个类型 `T` 是泛型的。"这个函数有一个名为 `list` 的参数，它是类型 `T` 的值的切片。`largest` 函数将返回一个对相同类型 `T` 的值的引用。

示例 10-5 展示了在签名中使用泛型数据类型的 `largest` 函数定义。该示例还展示了如何用 `i32` 值的切片或 `char` 值的切片来调用该函数。注意这段代码目前还不能编译。

<Listing number="10-5" file-name="src/main.rs" caption="使用泛型类型参数的 `largest` 函数；目前还不能编译">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-05/src/main.rs}}
```

</Listing>

如果现在就编译这段代码，我们会得到如下错误：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-05/output.txt}}
```

帮助文本中提到了 `std::cmp::PartialOrd`，这是一个 trait，我们将在下一节讨论 trait。现在你只需要知道，这个错误表明 `largest` 的函数体不能适用于 `T` 可能代表的所有类型。因为我们想在函数体中比较类型 `T` 的值，所以只能使用值可以排序的类型。为了启用比较功能，标准库提供了 `std::cmp::PartialOrd` trait，你可以在类型上实现它（关于这个 trait 的更多信息请参见附录 C）。为了修复示例 10-5，我们可以按照帮助文本的建议，将 `T` 的有效类型限制为仅实现了 `PartialOrd` 的类型。这样示例就能编译了，因为标准库在 `i32` 和 `char` 上都实现了 `PartialOrd`。

### 在结构体定义中使用泛型

我们同样可以使用 `<>` 语法来定义结构体，使其在一个或多个字段中使用泛型类型参数。示例 10-6 定义了一个 `Point<T>` 结构体，用于保存任意类型的 `x` 和 `y` 坐标值。

<Listing number="10-6" file-name="src/main.rs" caption="一个保存类型为 `T` 的 `x` 和 `y` 值的 `Point<T>` 结构体">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-06/src/main.rs}}
```

</Listing>

在结构体定义中使用泛型的语法与在函数定义中使用的语法类似。首先，在结构体名称后面的尖括号中声明类型参数的名称。然后在结构体定义中使用泛型类型来替代原本需要指定具体数据类型的位置。

注意，因为我们只使用了一个泛型类型来定义 `Point<T>`，这个定义表明 `Point<T>` 结构体对某个类型 `T` 是泛型的，并且字段 `x` 和 `y` _都是_ 相同的类型，无论该类型具体是什么。如果我们创建一个具有不同类型值的 `Point<T>` 实例，如示例 10-7 所示，代码将无法编译。

<Listing number="10-7" file-name="src/main.rs" caption="字段 `x` 和 `y` 必须是相同类型，因为它们都具有相同的泛型数据类型 `T`。">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-07/src/main.rs}}
```

</Listing>

在这个例子中，当我们将整数值 `5` 赋给 `x` 时，编译器就知道了这个 `Point<T>` 实例的泛型类型 `T` 是整数。然后当我们为 `y` 指定 `4.0` 时——而 `y` 被定义为与 `x` 相同的类型——我们会得到如下类型不匹配错误：

```console
{{#include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-07/output.txt}}
```

要定义一个 `x` 和 `y` 都是泛型但可以具有不同类型的 `Point` 结构体，我们可以使用多个泛型类型参数。例如，在示例 10-8 中，我们将 `Point` 的定义改为对类型 `T` 和 `U` 泛型，其中 `x` 的类型为 `T`，`y` 的类型为 `U`。

<Listing number="10-8" file-name="src/main.rs" caption="对两个类型泛型的 `Point<T, U>`，使得 `x` 和 `y` 可以是不同类型的值">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-08/src/main.rs}}
```

</Listing>

现在所有展示的 `Point` 实例都是合法的了！你可以在定义中使用任意多个泛型类型参数，但使用过多会使代码难以阅读。如果你发现代码中需要大量泛型类型，这可能意味着你的代码需要重构为更小的部分。

### 在枚举定义中使用泛型

与结构体类似，我们可以定义枚举来在其变体中保存泛型数据类型。让我们再看一下标准库提供的 `Option<T>` 枚举，我们在第六章中使用过它：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

现在这个定义对你来说应该更容易理解了。如你所见，`Option<T>` 枚举对类型 `T` 是泛型的，它有两个变体：`Some` 保存一个类型为 `T` 的值，`None` 变体不保存任何值。通过使用 `Option<T>` 枚举，我们可以表达可选值这一抽象概念，并且因为 `Option<T>` 是泛型的，无论可选值的类型是什么，我们都可以使用这个抽象。

枚举也可以使用多个泛型类型。我们在第九章中使用的 `Result` 枚举的定义就是一个例子：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` 枚举对两个类型 `T` 和 `E` 是泛型的，它有两个变体：`Ok` 保存一个类型为 `T` 的值，`Err` 保存一个类型为 `E` 的值。这个定义使得 `Result` 枚举可以方便地用于任何可能成功（返回某个类型 `T` 的值）或失败（返回某个类型 `E` 的错误）的操作。实际上，这正是我们在示例 9-3 中打开文件时所使用的，当文件成功打开时 `T` 被填充为 `std::fs::File` 类型，当打开文件出现问题时 `E` 被填充为 `std::io::Error` 类型。

当你发现代码中有多个结构体或枚举定义仅在所保存的值的类型上有所不同时，就可以通过使用泛型类型来避免重复。

### 在方法定义中使用泛型

我们可以在结构体和枚举上实现方法（如第五章所做的那样），并在方法定义中使用泛型类型。示例 10-9 展示了我们在示例 10-6 中定义的 `Point<T>` 结构体，以及在其上实现的名为 `x` 的方法。

<Listing number="10-9" file-name="src/main.rs" caption="在 `Point<T>` 结构体上实现一个名为 `x` 的方法，它将返回对类型为 `T` 的 `x` 字段的引用">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-09/src/main.rs}}
```

</Listing>

这里我们在 `Point<T>` 上定义了一个名为 `x` 的方法，它返回对字段 `x` 中数据的引用。

注意，我们必须在 `impl` 后面声明 `T`，这样才能在 `Point<T>` 类型上实现方法时使用 `T`。通过在 `impl` 后面将 `T` 声明为泛型类型，Rust 能够识别出 `Point` 尖括号中的类型是泛型类型而非具体类型。我们可以为这个泛型参数选择一个与结构体定义中声明的泛型参数不同的名称，但使用相同的名称是惯例。如果你在声明了泛型类型的 `impl` 中编写方法，该方法将被定义在该类型的任何实例上，无论最终用什么具体类型替换泛型类型。

在定义类型上的方法时，我们还可以对泛型类型指定约束。例如，我们可以只在 `Point<f32>` 实例上实现方法，而不是在任意泛型类型的 `Point<T>` 实例上。在示例 10-10 中，我们使用了具体类型 `f32`，这意味着我们不需要在 `impl` 后面声明任何类型。

<Listing number="10-10" file-name="src/main.rs" caption="一个仅适用于泛型类型参数 `T` 为特定具体类型的结构体的 `impl` 块">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-10/src/main.rs:here}}
```

</Listing>

这段代码意味着 `Point<f32>` 类型将拥有一个 `distance_from_origin` 方法；而 `T` 不是 `f32` 类型的其他 `Point<T>` 实例则不会定义此方法。该方法计算我们的点到坐标 (0.0, 0.0) 处的点的距离，并使用了仅对浮点类型可用的数学运算。

结构体定义中的泛型类型参数并不总是与该结构体方法签名中使用的泛型类型参数相同。示例 10-11 为 `Point` 结构体使用了泛型类型 `X1` 和 `Y1`，为 `mixup` 方法签名使用了 `X2` 和 `Y2`，以使示例更加清晰。该方法创建一个新的 `Point` 实例，其 `x` 值来自 `self` 的 `Point`（类型为 `X1`），`y` 值来自传入的 `Point`（类型为 `Y2`）。

<Listing number="10-11" file-name="src/main.rs" caption="一个使用了与其结构体定义不同的泛型类型的方法">

```rust
{{#rustdoc_include ../listings/ch10-generic-types-traits-and-lifetimes/listing-10-11/src/main.rs}}
```

</Listing>

在 `main` 中，我们定义了一个 `x` 为 `i32`（值为 `5`）、`y` 为 `f64`（值为 `10.4`）的 `Point`。变量 `p2` 是一个 `x` 为字符串切片（值为 `"Hello"`）、`y` 为 `char`（值为 `c`）的 `Point` 结构体。在 `p1` 上调用 `mixup` 并传入参数 `p2` 得到 `p3`，它的 `x` 是 `i32` 类型，因为 `x` 来自 `p1`。`p3` 的 `y` 是 `char` 类型，因为 `y` 来自 `p2`。`println!` 宏调用将打印 `p3.x = 5, p3.y = c`。

这个例子的目的是展示一种场景：某些泛型参数用 `impl` 声明，而另一些用方法定义声明。这里，泛型参数 `X1` 和 `Y1` 在 `impl` 后面声明，因为它们属于结构体定义。泛型参数 `X2` 和 `Y2` 在 `fn mixup` 后面声明，因为它们只与该方法相关。

### 使用泛型的代码性能

你可能会好奇使用泛型类型参数是否会有运行时开销。好消息是，使用泛型类型不会使你的程序比使用具体类型运行得更慢。

Rust 通过在编译时对使用泛型的代码进行单态化（monomorphization）来实现这一点。_单态化_ 是将泛型代码转换为特定代码的过程，即在编译时填入实际使用的具体类型。在这个过程中，编译器所做的工作与我们在示例 10-5 中创建泛型函数的步骤相反：编译器查看所有调用泛型代码的地方，并为泛型代码被调用时所使用的具体类型生成代码。

让我们通过标准库的泛型 `Option<T>` 枚举来看看这是如何工作的：

```rust
let integer = Some(5);
let float = Some(5.0);
```

当 Rust 编译这段代码时，它会执行单态化。在这个过程中，编译器读取 `Option<T>` 实例中使用的值，并识别出两种 `Option<T>`：一种是 `i32`，另一种是 `f64`。因此，它将 `Option<T>` 的泛型定义展开为两个针对 `i32` 和 `f64` 的特化定义，从而用具体的定义替换了泛型定义。

单态化后的代码看起来类似于以下内容（编译器使用的名称与我们这里用于说明的名称不同）：

<Listing file-name="src/main.rs">

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

</Listing>

泛型 `Option<T>` 被替换为编译器创建的具体定义。因为 Rust 会将泛型代码编译为指定每个实例中具体类型的代码，所以使用泛型不会产生任何运行时开销。当代码运行时，它的表现与我们手动复制每个定义时完全一样。单态化的过程使得 Rust 的泛型在运行时极其高效。
