## 定义并实例化结构体

结构体和我们在["元组类型"][tuples]<!-- ignore -->小节中讨论过的元组类似，它们都包含多个相关的值。和元组一样，结构体的各个部分可以是不同的类型。但与元组不同的是，在结构体中你需要为每个数据片段命名，从而清楚地表明各个值的含义。有了这些名称，结构体比元组更加灵活：你不必依赖数据的顺序来指定或访问实例中的值。

要定义一个结构体，我们使用 `struct` 关键字并为整个结构体命名。结构体的名称应当描述被组合在一起的数据片段的意义。然后，在花括号内，我们定义每个数据片段的名称和类型，我们称之为**字段**（_field_）。例如，示例 5-1 展示了一个存储用户账户信息的结构体。

<Listing number="5-1" file-name="src/main.rs" caption="一个 `User` 结构体定义">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-01/src/main.rs:here}}
```

</Listing>

定义了结构体之后，要使用它就需要创建该结构体的一个**实例**（_instance_），为每个字段指定具体的值。创建实例时，先写出结构体的名称，然后加上花括号，里面包含 _`key: value`_ 键值对，其中键是字段的名称，值是我们想要存储在这些字段中的数据。字段的顺序不必与结构体定义中声明的顺序一致。换句话说，结构体定义就像是该类型的通用模板，而实例则用特定的数据填充这个模板来创建该类型的值。例如，我们可以像示例 5-2 那样声明一个特定的用户。

<Listing number="5-2" file-name="src/main.rs" caption="创建一个 `User` 结构体的实例">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-02/src/main.rs:here}}
```

</Listing>

要从结构体中获取某个特定的值，可以使用点号表示法。例如，要访问这个用户的电子邮件地址，可以使用 `user1.email`。如果实例是可变的，我们可以通过点号表示法对某个特定字段进行赋值来修改它的值。示例 5-3 展示了如何修改一个可变 `User` 实例中 `email` 字段的值。

<Listing number="5-3" file-name="src/main.rs" caption="修改 `User` 实例中 `email` 字段的值">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-03/src/main.rs:here}}
```

</Listing>

注意，整个实例必须是可变的；Rust 不允许我们仅将某些字段标记为可变。和任何表达式一样，我们可以在函数体的最后一个表达式中构造结构体的新实例，从而隐式地返回这个新实例。

示例 5-4 展示了一个 `build_user` 函数，它接受电子邮件和用户名作为参数，返回一个 `User` 实例。`active` 字段的值为 `true`，`sign_in_count` 的值为 `1`。

<Listing number="5-4" file-name="src/main.rs" caption="一个接受电子邮件和用户名并返回 `User` 实例的 `build_user` 函数">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-04/src/main.rs:here}}
```

</Listing>

将函数参数命名为与结构体字段相同的名称是合理的，但不得不重复书写 `email` 和 `username` 字段名和变量名就有些繁琐了。如果结构体有更多字段，重复每个名称会更加烦人。好在有一种便捷的简写语法！

<!-- Old headings. Do not remove or links may break. -->

<a id="using-the-field-init-shorthand-when-variables-and-fields-have-the-same-name"></a>

### 使用字段初始化简写语法

因为在示例 5-4 中参数名与结构体字段名完全相同，我们可以使用**字段初始化简写**（_field init shorthand_）语法来重写 `build_user`，使其行为完全一致，但无需重复书写 `username` 和 `email`，如示例 5-5 所示。

<Listing number="5-5" file-name="src/main.rs" caption="由于 `username` 和 `email` 参数与结构体字段同名，`build_user` 函数使用了字段初始化简写">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-05/src/main.rs:here}}
```

</Listing>

这里我们创建了 `User` 结构体的一个新实例，该结构体有一个名为 `email` 的字段。我们想将 `email` 字段的值设置为 `build_user` 函数的 `email` 参数的值。因为 `email` 字段和 `email` 参数同名，所以只需写 `email` 而不必写 `email: email`。

<!-- Old headings. Do not remove or links may break. -->

<a id="creating-instances-from-other-instances-with-struct-update-syntax"></a>

### 使用结构体更新语法创建实例

有时候，创建一个新的结构体实例时，大部分值来自另一个同类型的实例，只修改其中一些值，这是很常见的需求。你可以使用**结构体更新语法**（_struct update syntax_）来实现。

首先，示例 5-6 展示了不使用更新语法，以常规方式在 `user2` 中创建一个新的 `User` 实例。我们为 `email` 设置了新值，其他字段则使用示例 5-2 中创建的 `user1` 的相同值。

<Listing number="5-6" file-name="src/main.rs" caption="使用 `user1` 的大部分值创建一个新的 `User` 实例">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-06/src/main.rs:here}}
```

</Listing>

使用结构体更新语法，我们可以用更少的代码达到相同的效果，如示例 5-7 所示。`..` 语法指定了未显式设置的其余字段应与给定实例中的对应字段具有相同的值。

<Listing number="5-7" file-name="src/main.rs" caption="使用结构体更新语法为 `User` 实例设置新的 `email` 值，同时使用 `user1` 的其余值">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/listing-05-07/src/main.rs:here}}
```

</Listing>

示例 5-7 中的代码同样在 `user2` 中创建了一个实例，它的 `email` 值不同，但 `username`、`active` 和 `sign_in_count` 字段的值与 `user1` 相同。`..user1` 必须放在最后，用于指定其余字段应从 `user1` 的对应字段获取值，但我们可以按任意顺序为任意数量的字段指定值，与结构体定义中字段的顺序无关。

注意，结构体更新语法使用了 `=`，就像赋值一样；这是因为它会移动数据，正如我们在["变量与数据交互的方式（一）：移动"][move]<!-- ignore -->小节中看到的那样。在这个例子中，创建 `user2` 之后我们就不能再使用 `user1` 了，因为 `user1` 的 `username` 字段中的 `String` 已经被移动到了 `user2` 中。如果我们为 `user2` 的 `email` 和 `username` 都赋予了新的 `String` 值，从而只使用了 `user1` 的 `active` 和 `sign_in_count` 值，那么在创建 `user2` 之后 `user1` 仍然是有效的。`active` 和 `sign_in_count` 的类型都实现了 `Copy` trait，所以我们在["只在栈上的数据：拷贝"][copy]<!-- ignore -->小节中讨论的行为在这里适用。在这个例子中我们也仍然可以使用 `user1.email`，因为它的值并没有被移出 `user1`。

<!-- Old headings. Do not remove or links may break. -->

<a id="using-tuple-structs-without-named-fields-to-create-different-types"></a>

### 使用没有命名字段的元组结构体来创建不同的类型

Rust 还支持一种看起来类似于元组的结构体，称为**元组结构体**（_tuple struct_）。元组结构体拥有结构体名称所赋予的额外含义，但其字段没有名称；它们只有字段的类型。当你想给整个元组一个名称，使其成为与其他元组不同的类型，同时像普通结构体那样为每个字段命名又显得冗余时，元组结构体就很有用。

要定义元组结构体，以 `struct` 关键字和结构体名称开头，后跟元组中的类型。例如，这里我们定义并使用了两个名为 `Color` 和 `Point` 的元组结构体：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/no-listing-01-tuple-structs/src/main.rs}}
```

</Listing>

注意，`black` 和 `origin` 是不同的类型，因为它们是不同元组结构体的实例。你定义的每个结构体都是自己独有的类型，即使结构体中的字段可能具有相同的类型。例如，一个接受 `Color` 类型参数的函数不能接受 `Point` 作为参数，即使这两个类型都由三个 `i32` 值组成。除此之外，元组结构体实例的行为与元组类似：你可以将它们解构为单独的部分，也可以使用 `.` 后跟索引来访问单个值。与元组不同的是，解构元组结构体时需要指明结构体的类型名称。例如，我们可以写 `let Point(x, y, z) = origin;` 来将 `origin` 点中的值解构到名为 `x`、`y` 和 `z` 的变量中。

<!-- Old headings. Do not remove or links may break. -->

<a id="unit-like-structs-without-any-fields"></a>

### 没有任何字段的类单元结构体

你也可以定义没有任何字段的结构体！它们被称为**类单元结构体**（_unit-like struct_），因为它们的行为类似于 `()`，即我们在["元组类型"][tuples]<!-- ignore -->小节中提到的单元类型。当你需要在某个类型上实现 trait 但又不需要在类型中存储任何数据时，类单元结构体就很有用。我们将在第 10 章讨论 trait。下面是一个声明并实例化名为 `AlwaysEqual` 的单元结构体的例子：

<Listing file-name="src/main.rs">

```rust
{{#rustdoc_include ../listings/ch05-using-structs-to-structure-related-data/no-listing-04-unit-like-structs/src/main.rs}}
```

</Listing>

要定义 `AlwaysEqual`，我们使用 `struct` 关键字、我们想要的名称，然后加一个分号。不需要花括号或圆括号！然后，我们可以用类似的方式在 `subject` 变量中获取 `AlwaysEqual` 的一个实例：使用我们定义的名称，不需要任何花括号或圆括号。想象一下，以后我们将为这个类型实现某种行为，使得 `AlwaysEqual` 的每个实例始终等于任何其他类型的每个实例，也许是为了在测试中获得已知的结果。实现这种行为不需要任何数据！你将在第 10 章看到如何定义 trait 并在任何类型上实现它们，包括类单元结构体。

> ### 结构体数据的所有权
>
> 在示例 5-1 的 `User` 结构体定义中，我们使用了拥有所有权的 `String` 类型而不是 `&str` 字符串切片类型。这是一个刻意的选择，因为我们希望这个结构体的每个实例都拥有其所有数据，并且只要整个结构体有效，这些数据就有效。
>
> 结构体也可以存储对其他数据的引用，但这需要用到**生命周期**（_lifetime_），这是一个我们将在第 10 章讨论的 Rust 特性。生命周期确保结构体引用的数据在结构体有效期间始终有效。假设你尝试在结构体中存储引用而不指定生命周期，如下面 *src/main.rs* 中所示；这是行不通的：
>
> <Listing file-name="src/main.rs">
>
> <!-- CAN'T EXTRACT SEE https://github.com/rust-lang/mdBook/issues/1127 -->
>
> ```rust,ignore,does_not_compile
> struct User {
>     active: bool,
>     username: &str,
>     email: &str,
>     sign_in_count: u64,
> }
>
> fn main() {
>     let user1 = User {
>         active: true,
>         username: "someusername123",
>         email: "someone@example.com",
>         sign_in_count: 1,
>     };
> }
> ```
>
> </Listing>
>
> 编译器会提示需要生命周期标注：
>
> ```console
> $ cargo run
>    Compiling structs v0.1.0 (file:///projects/structs)
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:3:15
>   |
> 3 |     username: &str,
>   |               ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 ~     username: &'a str,
>   |
>
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:4:12
>   |
> 4 |     email: &str,
>   |            ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 |     username: &str,
> 4 ~     email: &'a str,
>   |
>
> For more information about this error, try `rustc --explain E0106`.
> error: could not compile `structs` (bin "structs") due to 2 previous errors
> ```
>
> 在第 10 章中，我们将讨论如何修复这些错误以便在结构体中存储引用，但现在，我们将使用像 `String` 这样的拥有所有权的类型而不是像 `&str` 这样的引用来避免这些错误。

<!-- manual-regeneration
for the error above
after running update-rustc.sh:
pbcopy < listings/ch05-using-structs-to-structure-related-data/no-listing-02-reference-in-struct/output.txt
paste above
add `> ` before every line -->

[tuples]: ch03-02-data-types.html#the-tuple-type
[move]: ch04-01-what-is-ownership.html#variables-and-data-interacting-with-move
[copy]: ch04-01-what-is-ownership.html#stack-only-data-copy
