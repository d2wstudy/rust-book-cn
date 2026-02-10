## 将模块拆分到不同文件

到目前为止，本章中的所有示例都在一个文件中定义了多个模块。当模块变大时，你可能希望将它们的定义移到单独的文件中，以便更容易导航代码。

例如，让我们从示例 7-17 中包含多个餐厅模块的代码开始。我们将把模块提取到文件中，而不是在 crate 根文件中定义所有模块。在本例中，crate 根文件是 _src/lib.rs_，但这个过程同样适用于 crate 根文件为 _src/main.rs_ 的二进制 crate。

首先，我们将 `front_of_house` 模块提取到它自己的文件中。删除 `front_of_house` 模块花括号内的代码，只留下 `mod front_of_house;` 声明，这样 _src/lib.rs_ 就包含如示例 7-21 所示的代码。注意，在我们创建示例 7-22 中的 _src/front_of_house.rs_ 文件之前，这段代码无法编译。

<Listing number="7-21" file-name="src/lib.rs" caption="声明 `front_of_house` 模块，其主体将在 *src/front_of_house.rs* 中">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-21-and-22/src/lib.rs}}
```

</Listing>

接下来，将花括号内的代码放入一个名为 _src/front_of_house.rs_ 的新文件中，如示例 7-22 所示。编译器知道要查找这个文件，因为它在 crate 根中遇到了名为 `front_of_house` 的模块声明。

<Listing number="7-22" file-name="src/front_of_house.rs" caption="*src/front_of_house.rs* 中 `front_of_house` 模块内部的定义">

```rust,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-21-and-22/src/front_of_house.rs}}
```

</Listing>

注意，你只需要在模块树中使用 `mod` 声明加载文件*一次*。一旦编译器知道该文件是项目的一部分（并且根据你放置 `mod` 语句的位置知道代码在模块树中的位置），项目中的其他文件应该使用路径来引用已加载文件的代码，如["引用模块项的路径"][paths]<!-- ignore -->部分所述。换句话说，`mod` *不是*你在其他编程语言中可能见过的"include"操作。

接下来，我们将 `hosting` 模块也提取到它自己的文件中。过程略有不同，因为 `hosting` 是 `front_of_house` 的子模块，而不是根模块的子模块。我们将把 `hosting` 的文件放在一个以其在模块树中的祖先命名的新目录中，在本例中是 _src/front_of_house_。

要开始移动 `hosting`，我们将 _src/front_of_house.rs_ 改为只包含 `hosting` 模块的声明：

<Listing file-name="src/front_of_house.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/no-listing-02-extracting-hosting/src/front_of_house.rs}}
```

</Listing>

然后，我们创建一个 _src/front_of_house_ 目录和一个 _hosting.rs_ 文件，来包含 `hosting` 模块中的定义：

<Listing file-name="src/front_of_house/hosting.rs">

```rust,ignore
{{#rustdoc_include ../listings/ch07-managing-growing-projects/no-listing-02-extracting-hosting/src/front_of_house/hosting.rs}}
```

</Listing>

如果我们把 _hosting.rs_ 放在 _src_ 目录中，编译器会认为 _hosting.rs_ 的代码属于在 crate 根中声明的 `hosting` 模块，而不是作为 `front_of_house` 模块的子模块声明的。编译器关于检查哪些文件对应哪些模块代码的规则，意味着目录和文件更紧密地匹配模块树。

> ### 备用文件路径
>
> 到目前为止，我们介绍的是 Rust 编译器使用的最惯用的文件路径，但 Rust 也支持一种较旧的文件路径风格。对于在 crate 根中声明的名为 `front_of_house` 的模块，编译器会在以下位置查找模块的代码：
>
> - _src/front_of_house.rs_（我们介绍的方式）
> - _src/front_of_house/mod.rs_（较旧的风格，仍然支持的路径）
>
> 对于名为 `hosting` 的 `front_of_house` 子模块，编译器会在以下位置查找模块的代码：
>
> - _src/front_of_house/hosting.rs_（我们介绍的方式）
> - _src/front_of_house/hosting/mod.rs_（较旧的风格，仍然支持的路径）
>
> 如果对同一个模块同时使用两种风格，会得到编译器错误。在同一个项目中对不同模块混合使用两种风格是允许的，但可能会让浏览你项目的人感到困惑。
>
> 使用名为 _mod.rs_ 的文件的风格的主要缺点是，你的项目最终可能会有很多名为 _mod.rs_ 的文件，当你在编辑器中同时打开它们时会很容易混淆。

我们已经将每个模块的代码移到了单独的文件中，而模块树保持不变。`eat_at_restaurant` 中的函数调用无需任何修改即可工作，即使定义位于不同的文件中。这种技术让你可以在模块增长时将它们移到新文件中。

注意，_src/lib.rs_ 中的 `pub use crate::front_of_house::hosting` 语句也没有改变，`use` 对哪些文件作为 crate 的一部分被编译也没有任何影响。`mod` 关键字声明模块，Rust 会在与模块同名的文件中查找该模块的代码。

## 总结

Rust 允许你将一个包拆分为多个 crate，将一个 crate 拆分为多个模块，这样你就可以从一个模块引用另一个模块中定义的项。你可以通过指定绝对路径或相对路径来实现这一点。这些路径可以通过 `use` 语句引入作用域，这样你就可以在该作用域中多次使用该项时使用更短的路径。模块代码默认是私有的，但你可以通过添加 `pub` 关键字使定义变为公有。

在下一章中，我们将介绍标准库中的一些集合数据结构，你可以在组织良好的代码中使用它们。

[paths]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
