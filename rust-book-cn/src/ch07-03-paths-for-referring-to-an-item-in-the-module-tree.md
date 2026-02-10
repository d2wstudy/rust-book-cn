## 引用模块树中条目的路径

为了告诉 Rust 在模块树中的哪里可以找到一个条目，我们使用路径，就像在文件系统中导航时使用路径一样。要调用一个函数，我们需要知道它的路径。

路径有两种形式：

- *绝对路径*（absolute path）是从 crate 根开始的完整路径；对于来自外部 crate 的代码，绝对路径以 crate 名称开头；对于来自当前 crate 的代码，则以字面量 `crate` 开头。
- *相对路径*（relative path）从当前模块开始，使用 `self`、`super` 或当前模块中的标识符。

绝对路径和相对路径后面都跟着一个或多个由双冒号（`::`）分隔的标识符。

回到示例 7-1，假设我们想调用 `add_to_waitlist` 函数。这等同于在问：`add_to_waitlist` 函数的路径是什么？示例 7-3 包含了示例 7-1 中去掉了一些模块和函数后的内容。

我们将展示两种从 crate 根中定义的新函数 `eat_at_restaurant` 调用 `add_to_waitlist` 函数的方式。这些路径是正确的，但还有另一个问题会导致这个示例无法按原样编译。我们稍后会解释原因。

`eat_at_restaurant` 函数是我们库 crate 公共 API 的一部分，所以我们用 `pub` 关键字标记它。在["使用 `pub` 关键字暴露路径"][pub]<!-- ignore -->部分，我们将更详细地介绍 `pub`。

<Listing number="7-3" file-name="src/lib.rs" caption="使用绝对路径和相对路径调用 `add_to_waitlist` 函数">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-03/src/lib.rs}}
```

</Listing>

我们第一次在 `eat_at_restaurant` 中调用 `add_to_waitlist` 函数时，使用的是绝对路径。`add_to_waitlist` 函数与 `eat_at_restaurant` 定义在同一个 crate 中，这意味着我们可以使用 `crate` 关键字来开始一个绝对路径。然后我们依次包含每个后续模块，直到找到 `add_to_waitlist`。你可以想象一个具有相同结构的文件系统：我们会指定路径 `/front_of_house/hosting/add_to_waitlist` 来运行 `add_to_waitlist` 程序；使用 `crate` 名称从 crate 根开始，就像在 shell 中使用 `/` 从文件系统根目录开始一样。

我们第二次在 `eat_at_restaurant` 中调用 `add_to_waitlist` 时，使用的是相对路径。路径以 `front_of_house` 开头，这是与 `eat_at_restaurant` 定义在模块树同一层级的模块名。这里对应的文件系统路径是 `front_of_house/hosting/add_to_waitlist`。以模块名开头意味着该路径是相对的。

选择使用相对路径还是绝对路径，取决于你的项目，也取决于你更可能将条目定义代码与使用该条目的代码分开移动还是一起移动。例如，如果我们将 `front_of_house` 模块和 `eat_at_restaurant` 函数一起移到一个名为 `customer_experience` 的模块中，我们需要更新 `add_to_waitlist` 的绝对路径，但相对路径仍然有效。然而，如果我们单独将 `eat_at_restaurant` 函数移到一个名为 `dining` 的模块中，`add_to_waitlist` 调用的绝对路径将保持不变，但相对路径则需要更新。我们通常倾向于使用绝对路径，因为我们更可能希望独立地移动代码定义和条目调用。

让我们尝试编译示例 7-3，看看为什么它还不能编译！我们得到的错误如示例 7-4 所示。

<Listing number="7-4" caption="构建示例 7-3 中代码时的编译器错误">

```console
{{#include ../listings/ch07-managing-growing-projects/listing-07-03/output.txt}}
```

</Listing>

错误信息表明模块 `hosting` 是私有的。换句话说，我们有 `hosting` 模块和 `add_to_waitlist` 函数的正确路径，但 Rust 不允许我们使用它们，因为它无法访问私有部分。在 Rust 中，所有条目（函数、方法、结构体、枚举、模块和常量）默认对父模块是私有的。如果你想让一个条目（如函数或结构体）成为私有的，只需将它放在一个模块中。

父模块中的条目不能使用子模块中的私有条目，但子模块中的条目可以使用其祖先模块中的条目。这是因为子模块封装并隐藏了它们的实现细节，但子模块可以看到它们被定义时所处的上下文。继续用我们的比喻来说，可以把私有性规则想象成餐厅的后台办公室：里面发生的事情对餐厅顾客来说是私有的，但办公室经理可以看到并管理他们所经营的餐厅中的一切。

Rust 选择让模块系统以这种方式运作，这样隐藏内部实现细节就是默认行为。这样，你就知道可以修改内部代码的哪些部分而不会破坏外部代码。不过，Rust 确实提供了选项，让你可以通过使用 `pub` 关键字将条目设为公有，从而将子模块代码的内部部分暴露给外部的祖先模块。

### 使用 `pub` 关键字暴露路径

让我们回到示例 7-4 中告诉我们 `hosting` 模块是私有的那个错误。我们希望父模块中的 `eat_at_restaurant` 函数能够访问子模块中的 `add_to_waitlist` 函数，因此我们用 `pub` 关键字标记 `hosting` 模块，如示例 7-5 所示。

<Listing number="7-5" file-name="src/lib.rs" caption="将 `hosting` 模块声明为 `pub` 以便在 `eat_at_restaurant` 中使用">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-05/src/lib.rs:here}}
```

</Listing>

不幸的是，示例 7-5 中的代码仍然会产生编译器错误，如示例 7-6 所示。

<Listing number="7-6" caption="构建示例 7-5 中代码时的编译器错误">

```console
{{#include ../listings/ch07-managing-growing-projects/listing-07-05/output.txt}}
```

</Listing>

发生了什么？在 `mod hosting` 前面添加 `pub` 关键字使该模块变为公有。有了这个改变，如果我们能访问 `front_of_house`，就能访问 `hosting`。但 `hosting` 的*内容*仍然是私有的；将模块设为公有并不会使其内容也变为公有。模块上的 `pub` 关键字只是让其祖先模块中的代码可以引用它，而不是访问其内部代码。因为模块是容器，仅仅将模块设为公有并没有太大用处；我们还需要进一步选择将模块内的一个或多个条目也设为公有。

示例 7-6 中的错误表明 `add_to_waitlist` 函数是私有的。私有性规则适用于结构体、枚举、函数和方法，也适用于模块。

让我们也通过在 `add_to_waitlist` 函数定义前添加 `pub` 关键字来将其设为公有，如示例 7-7 所示。

<Listing number="7-7" file-name="src/lib.rs" caption="为 `mod hosting` 和 `fn add_to_waitlist` 添加 `pub` 关键字，使我们可以从 `eat_at_restaurant` 调用该函数">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-07/src/lib.rs:here}}
```

</Listing>

现在代码可以编译了！为了理解为什么添加 `pub` 关键字后我们就能在 `eat_at_restaurant` 中使用这些路径（就私有性规则而言），让我们来看看绝对路径和相对路径。

在绝对路径中，我们从 `crate` 开始，即我们 crate 模块树的根。`front_of_house` 模块定义在 crate 根中。虽然 `front_of_house` 不是公有的，但因为 `eat_at_restaurant` 函数与 `front_of_house` 定义在同一个模块中（也就是说，`eat_at_restaurant` 和 `front_of_house` 是兄弟），我们可以从 `eat_at_restaurant` 引用 `front_of_house`。接下来是标记了 `pub` 的 `hosting` 模块。我们可以访问 `hosting` 的父模块，所以我们可以访问 `hosting`。最后，`add_to_waitlist` 函数标记了 `pub`，而且我们可以访问它的父模块，所以这个函数调用是有效的！

在相对路径中，逻辑与绝对路径相同，只是第一步不同：路径不是从 crate 根开始，而是从 `front_of_house` 开始。`front_of_house` 模块与 `eat_at_restaurant` 定义在同一个模块中，所以从 `eat_at_restaurant` 所在模块开始的相对路径是有效的。然后，因为 `hosting` 和 `add_to_waitlist` 都标记了 `pub`，路径的其余部分也是有效的，这个函数调用是合法的！

如果你计划分享你的库 crate 以便其他项目可以使用你的代码，那么你的公共 API 就是你与 crate 用户之间的契约，决定了他们如何与你的代码交互。围绕管理公共 API 的变更有许多考量，以便让人们更容易依赖你的 crate。这些考量超出了本书的范围；如果你对这个话题感兴趣，请参阅 [Rust API 指南][api-guidelines]。

> #### 同时包含二进制和库的包的最佳实践
>
> 我们提到过，一个包可以同时包含一个 *src/main.rs* 二进制 crate 根和一个 *src/lib.rs* 库 crate 根，并且两个 crate 默认都以包名命名。通常，具有这种同时包含库和二进制 crate 模式的包，会在二进制 crate 中只放足够的代码来启动一个可执行文件，该可执行文件调用库 crate 中定义的代码。这样其他项目就能从包提供的大部分功能中受益，因为库 crate 的代码可以被共享。
>
> 模块树应该定义在 *src/lib.rs* 中。然后，任何公有条目都可以在二进制 crate 中通过以包名开头的路径来使用。二进制 crate 成为库 crate 的用户，就像一个完全外部的 crate 使用该库 crate 一样：它只能使用公共 API。这有助于你设计出良好的 API；你不仅是作者，同时也是客户！
>
> 在[第 12 章][ch12]<!-- ignore -->中，我们将通过一个同时包含二进制 crate 和库 crate 的命令行程序来演示这种组织实践。

### 使用 `super` 开始相对路径

我们可以通过在路径开头使用 `super` 来构建从父模块开始的相对路径，而不是从当前模块或 crate 根开始。这就像在文件系统路径中使用 `..` 语法来进入父目录。使用 `super` 允许我们引用一个我们知道在父模块中的条目，当模块与父模块密切相关但父模块将来可能会被移到模块树的其他位置时，这可以使重新组织模块树更加容易。

考虑示例 7-8 中的代码，它模拟了厨师修正一个错误的订单并亲自将其送到顾客面前的情况。`back_of_house` 模块中定义的 `fix_incorrect_order` 函数通过指定以 `super` 开头的路径来调用父模块中定义的 `deliver_order` 函数。

<Listing number="7-8" file-name="src/lib.rs" caption="使用以 `super` 开头的相对路径调用函数">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-08/src/lib.rs}}
```

</Listing>

`fix_incorrect_order` 函数在 `back_of_house` 模块中，所以我们可以使用 `super` 进入 `back_of_house` 的父模块，在这个例子中就是 `crate`，即根模块。从那里，我们查找 `deliver_order` 并找到了它。成功！我们认为 `back_of_house` 模块和 `deliver_order` 函数很可能会保持彼此之间的关系，并且如果我们决定重新组织 crate 的模块树，它们会一起移动。因此，我们使用了 `super`，这样如果这段代码被移到不同的模块中，将来需要更新代码的地方会更少。

### 将结构体和枚举设为公有

我们也可以使用 `pub` 将结构体和枚举指定为公有，但 `pub` 与结构体和枚举一起使用时有一些额外的细节。如果我们在结构体定义前使用 `pub`，我们会使结构体公有，但结构体的字段仍然是私有的。我们可以逐个决定每个字段是否公有。在示例 7-9 中，我们定义了一个公有的 `back_of_house::Breakfast` 结构体，其中 `toast` 字段是公有的，但 `seasonal_fruit` 字段是私有的。这模拟了餐厅中顾客可以选择随餐面包的类型，但厨师根据当季和库存情况决定搭配哪种水果的场景。可用的水果变化很快，所以顾客不能选择水果，甚至看不到他们会得到哪种水果。

<Listing number="7-9" file-name="src/lib.rs" caption="一个包含部分公有字段和部分私有字段的结构体">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-09/src/lib.rs}}
```

</Listing>

因为 `back_of_house::Breakfast` 结构体中的 `toast` 字段是公有的，所以在 `eat_at_restaurant` 中我们可以使用点号来读写 `toast` 字段。注意我们不能在 `eat_at_restaurant` 中使用 `seasonal_fruit` 字段，因为 `seasonal_fruit` 是私有的。尝试取消注释修改 `seasonal_fruit` 字段值的那一行，看看会得到什么错误！

另外，请注意因为 `back_of_house::Breakfast` 有一个私有字段，该结构体需要提供一个公有的关联函数来构造 `Breakfast` 的实例（我们在这里将其命名为 `summer`）。如果 `Breakfast` 没有这样的函数，我们就无法在 `eat_at_restaurant` 中创建 `Breakfast` 的实例，因为我们无法在 `eat_at_restaurant` 中设置私有的 `seasonal_fruit` 字段的值。

相比之下，如果我们将一个枚举设为公有，那么它的所有变体都是公有的。我们只需要在 `enum` 关键字前加上 `pub`，如示例 7-10 所示。

<Listing number="7-10" file-name="src/lib.rs" caption="将枚举指定为公有会使其所有变体都成为公有">

```rust,noplayground
{{#rustdoc_include ../listings/ch07-managing-growing-projects/listing-07-10/src/lib.rs}}
```

</Listing>

因为我们将 `Appetizer` 枚举设为了公有，所以我们可以在 `eat_at_restaurant` 中使用 `Soup` 和 `Salad` 变体。

枚举的变体如果不是公有的，枚举就不太有用；如果每次都必须为所有枚举变体标注 `pub` 会很烦人，所以枚举变体默认就是公有的。结构体通常在其字段不公有的情况下也很有用，所以结构体字段遵循默认一切都是私有的通用规则，除非用 `pub` 标注。

还有一种涉及 `pub` 的情况我们尚未介绍，那就是我们最后一个模块系统功能：`use` 关键字。我们将先单独介绍 `use`，然后展示如何组合使用 `pub` 和 `use`。

[pub]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword
[api-guidelines]: https://rust-lang.github.io/api-guidelines/
[ch12]: ch12-00-an-io-project.html
