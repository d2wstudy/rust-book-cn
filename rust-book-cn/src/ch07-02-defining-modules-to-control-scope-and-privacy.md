<!-- Old headings. Do not remove or links may break. -->

<a id="defining-modules-to-control-scope-and-privacy"></a>

## 使用模块控制作用域和私有性

在本节中，我们将讨论模块以及模块系统的其他部分，即允许你为项命名的*路径*（path）；将路径引入作用域的 `use` 关键字；以及使项变为公有的 `pub` 关键字。我们还将讨论 `as` 关键字、外部包和 glob 运算符。

### 模块速查表

在深入了解模块和路径的细节之前，这里提供一个关于模块、路径、`use` 关键字和 `pub` 关键字在编译器中如何工作，以及大多数开发者如何组织代码的快速参考。我们将在本章中逐一介绍这些规则的示例，但这是一个很好的参考，可以帮助你回忆模块的工作方式。

- **从 crate 根开始**：编译 crate 时，编译器首先在 crate 根文件（通常库 crate 是 _src/lib.rs_，二进制 crate 是 _src/main.rs_）中查找要编译的代码。
- **声明模块**：在 crate 根文件中，你可以声明新模块；比如你用 `mod garden;` 声明了一个"garden"模块。编译器会在以下位置查找模块的代码：
  - 内联，在替换 `mod garden` 后面分号的花括号内
  - 在文件 _src/garden.rs_ 中
  - 在文件 _src/garden/mod.rs_ 中
- **声明子模块**：在 crate 根以外的任何文件中，你可以声明子模块。例如，你可能在 _src/garden.rs_ 中声明 `mod vegetables;`。编译器会在以父模块命名的目录中的以下位置查找子模块的代码：
  - 内联，直接跟在 `mod vegetables` 后面，在花括号内而非分号
  - 在文件 _src/garden/vegetables.rs_ 中
  - 在文件 _src/garden/vegetables/mod.rs_ 中
- **模块中代码的路径**：一旦模块成为 crate 的一部分，只要隐私规则允许，你就可以在同一 crate 的任何其他地方通过路径引用该模块中的代码。例如，garden vegetables 模块中的 `Asparagus` 类型可以通过 `crate::garden::vegetables::Asparagus` 找到。
- **私有与公有**：模块内的代码默认对其父模块是私有的。要使模块公有，请使用 `pub mod` 而不是 `mod` 来声明。要使公有模块中的项也变为公有，请在它们的声明前使用 `pub`。
- **`use` 关键字**：在一个作用域内，`use` 关键字创建项的快捷方式，以减少长路径的重复。在任何可以引用 `crate::garden::vegetables::Asparagus` 的作用域中，你可以使用 `use crate::garden::vegetables::Asparagus;` 创建一个快捷方式，之后在该作用域中只需写 `Asparagus` 就可以使用该类型。

这里我们创建一个名为 `backyard` 的二进制 crate 来说明这些规则。该 crate 的目录（同样名为 _backyard_）包含以下文件和目录：

```text
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

本例中的 crate 根文件是 _src/main.rs_，其内容为：

<Listing file-name="src/main.rs">

```rust,noplayground,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/quick-reference-example/src/main.rs}}
```

</Listing>

`pub mod garden;` 这一行告诉编译器包含在 _src/garden.rs_ 中找到的代码，即：

<Listing file-name="src/garden.rs">

```rust,noplayground,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/quick-reference-example/src/garden.rs}}
```

</Listing>

这里，`pub mod vegetables;` 意味着 _src/garden/vegetables.rs_ 中的代码也被包含进来。该代码为：

```rust,noplayground,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/quick-reference-example/src/garden/vegetables.rs}}
```

现在让我们深入了解这些规则的细节，并通过实际操作来演示它们！

### 在模块中组织相关代码

*模块*让我们可以在 crate 内组织代码，以提高可读性和复用性。模块还允许我们控制项的*私有性*，因为模块内的代码默认是私有的。私有项是不对外提供的内部实现细节。我们可以选择将模块及其中的项设为公有，这样就可以暴露它们，允许外部代码使用和依赖它们。

作为示例，让我们编写一个提供餐厅功能的库 crate。我们将定义函数的签名但留空函数体，以便专注于代码的组织而非餐厅的实现。

在餐饮业中，餐厅的某些部分被称为*前台*（front of house），其他部分被称为*后台*（back of house）。前台是顾客所在的区域；这包括领位员安排顾客就座、服务员接受点单和收款、以及调酒师调制饮品的地方。后台是厨师在厨房工作、洗碗工清洁餐具、以及经理处理行政事务的地方。

为了以这种方式组织我们的 crate，我们可以将其函数组织到嵌套的模块中。通过运行 `cargo new restaurant --lib` 创建一个名为 `restaurant` 的新库。然后将示例 7-1 中的代码输入到 _src/lib.rs_ 中，定义一些模块和函数签名；这段代码是前台部分。

<Listing number="7-1" file-name="src/lib.rs" caption="一个包含其他模块的 `front_of_house` 模块，这些模块又包含函数">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-01/src/lib.rs}}
```

</Listing>

我们使用 `mod` 关键字后跟模块名称来定义模块（本例中为 `front_of_house`）。模块的主体放在花括号内。在模块内部，我们可以放置其他模块，如本例中的 `hosting` 和 `serving` 模块。模块还可以包含其他项的定义，如结构体、枚举、常量、trait，以及如示例 7-1 中的函数。

通过使用模块，我们可以将相关的定义组织在一起，并说明它们为什么相关。使用这段代码的程序员可以根据分组来导航代码，而不必通读所有定义，从而更容易找到与他们相关的定义。向这段代码添加新功能的程序员也会知道应该把代码放在哪里，以保持程序的组织性。

前面我们提到 _src/main.rs_ 和 _src/lib.rs_ 被称为 _crate 根_。之所以这样命名，是因为这两个文件中任何一个的内容都会在 crate 模块结构的根部形成一个名为 `crate` 的模块，这个结构被称为*模块树*（module tree）。

示例 7-2 展示了示例 7-1 中代码结构的模块树。

<Listing number="7-2" caption="示例 7-1 中代码的模块树">

```text
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

</Listing>

这棵树展示了一些模块如何嵌套在其他模块内部；例如，`hosting` 嵌套在 `front_of_house` 内部。这棵树还展示了一些模块是*兄弟*（sibling）关系，意味着它们定义在同一个模块中；`hosting` 和 `serving` 是定义在 `front_of_house` 中的兄弟模块。如果模块 A 包含在模块 B 内部，我们说模块 A 是模块 B 的*子*模块，模块 B 是模块 A 的*父*模块。注意，整个模块树的根是名为 `crate` 的隐式模块。

模块树可能会让你联想到计算机上文件系统的目录树；这是一个非常恰当的类比！就像文件系统中的目录一样，你使用模块来组织代码。就像目录中的文件一样，我们需要一种方法来找到我们的模块。
