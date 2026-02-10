## 发布 crate 到 Crates.io

我们已经使用过 [crates.io](https://crates.io/)<!-- ignore --> 上的包作为项目的依赖，但你也可以通过发布自己的包来与其他人分享代码。[crates.io](https://crates.io/)<!-- ignore --> 上的 crate 注册中心会分发你的包的源代码，因此它主要托管开源代码。

Rust 和 Cargo 提供了一些特性，让你发布的包更容易被他人发现和使用。接下来我们将介绍其中一些特性，然后讲解如何发布一个包。

### 编写有用的文档注释

准确地为你的包编写文档将帮助其他用户了解如何以及何时使用它们，因此花时间编写文档是值得的。在第三章中，我们讨论了如何使用两个斜杠 `//` 来注释 Rust 代码。Rust 还有一种专门用于文档的注释，通常称为**文档注释**（documentation comment），它会生成 HTML 文档。这些 HTML 文档展示公有 API 项的文档注释内容，面向那些想要了解如何*使用*你的 crate 的程序员，而不是关注你的 crate 是如何*实现*的。

文档注释使用三个斜杠 `///` 而不是两个，并且支持 Markdown 语法来格式化文本。文档注释放在被注释项的前面。示例 14-1 展示了一个名为 `my_crate` 的 crate 中 `add_one` 函数的文档注释。

<Listing number="14-1" file-name="src/lib.rs" caption="一个函数的文档注释">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-01/src/lib.rs}}
```

</Listing>

这里我们描述了 `add_one` 函数的功能，然后以 `Examples` 标题开始一个新的小节，并提供了演示如何使用 `add_one` 函数的代码。我们可以通过运行 `cargo doc` 来从文档注释生成 HTML 文档。这个命令会运行 Rust 自带的 `rustdoc` 工具，并将生成的 HTML 文档放在 *target/doc* 目录下。

为了方便，运行 `cargo doc --open` 会构建当前 crate 的文档（以及所有依赖的文档），然后在浏览器中打开结果。导航到 `add_one` 函数，你会看到文档注释中的文本是如何渲染的，如图 14-1 所示。

<img alt="Rendered HTML documentation for the `add_one` function of `my_crate`" src="img/trpl14-01.png" class="center" />

<span class="caption">图 14-1：`add_one` 函数的 HTML 文档</span>

#### 常用的文档小节

我们在示例 14-1 中使用了 `# Examples` Markdown 标题来创建一个标题为"Examples"的 HTML 小节。以下是 crate 作者在文档中常用的一些其他小节：

- **Panics**：记录函数可能会 panic 的场景。不希望程序 panic 的调用者应确保不在这些情况下调用该函数。
- **Errors**：如果函数返回 `Result`，描述可能出现的错误类型以及在什么条件下会返回这些错误，这对调用者很有帮助，以便他们能够用不同的方式处理不同类型的错误。
- **Safety**：如果函数调用是 `unsafe` 的（我们将在第二十章讨论不安全代码），应该有一个小节解释为什么该函数是不安全的，并说明函数期望调用者维护的不变量（invariants）。

大多数文档注释不需要所有这些小节，但这是一个很好的检查清单，提醒你用户可能会关心代码的哪些方面。

#### 文档注释作为测试

在文档注释中添加示例代码块可以帮助演示如何使用你的库，而且还有一个额外的好处：运行 `cargo test` 会将文档中的代码示例作为测试运行！没有什么比带有示例的文档更好的了。但也没有什么比因为代码变更而导致示例失效更糟糕的了。如果我们对示例 14-1 中 `add_one` 函数的文档运行 `cargo test`，会在测试结果中看到如下部分：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/listing-14-01/
cargo test
copy just the doc-tests section below
-->

```text
   Doc-tests my_crate

running 1 test
test src/lib.rs - add_one (line 5) ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s
```

现在，如果我们修改了函数或示例，使得示例中的 `assert_eq!` 会 panic，然后再次运行 `cargo test`，我们会看到文档测试捕获到了示例与代码不同步的问题！

<!-- Old headings. Do not remove or links may break. -->

<a id="commenting-contained-items"></a>

#### 包含项注释

`//!` 风格的文档注释为*包含*这些注释的项添加文档，而不是为注释*之后*的项添加文档。我们通常在 crate 根文件（按照惯例是 *src/lib.rs*）或模块内部使用这种文档注释，来为整个 crate 或模块编写文档。

例如，要为包含 `add_one` 函数的 `my_crate` crate 添加描述其用途的文档，我们在 *src/lib.rs* 文件的开头添加以 `//!` 开头的文档注释，如示例 14-2 所示。

<Listing number="14-2" file-name="src/lib.rs" caption="整个 `my_crate` crate 的文档">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-02/src/lib.rs:here}}
```

</Listing>

注意，以 `//!` 开头的最后一行之后没有任何代码。因为我们使用的是 `//!` 而不是 `///`，所以我们是在为包含此注释的项编写文档，而不是为此注释之后的项编写文档。在这种情况下，包含此注释的项是 *src/lib.rs* 文件，也就是 crate 根。这些注释描述的是整个 crate。

当我们运行 `cargo doc --open` 时，这些注释会显示在 `my_crate` 文档的首页上，位于 crate 中公有项列表的上方，如图 14-2 所示。

项内部的文档注释对于描述 crate 和模块特别有用。使用它们来解释容器的整体用途，帮助用户理解 crate 的组织结构。

<img alt="Rendered HTML documentation with a comment for the crate as a whole" src="img/trpl14-02.png" class="center" />

<span class="caption">图 14-2：`my_crate` 的渲染文档，包括描述整个 crate 的注释</span>

<!-- Old headings. Do not remove or links may break. -->

<a id="exporting-a-convenient-public-api-with-pub-use"></a>

### 使用 `pub use` 导出方便的公有 API

发布 crate 时，公有 API 的结构是一个重要的考量因素。使用你的 crate 的人不如你熟悉其结构，如果你的 crate 有很深的模块层级，他们可能很难找到想要使用的部分。

在第七章中，我们介绍了如何使用 `pub` 关键字将项设为公有，以及如何使用 `use` 关键字将项引入作用域。然而，你在开发 crate 时觉得合理的结构对用户来说可能并不方便。你可能希望将结构体组织在包含多个层级的层次结构中，但想要使用你定义在深层结构中的类型的人可能很难发现这些类型的存在。他们可能还会觉得输入 `use my_crate::some_module::another_module::UsefulType;` 很烦人，而更希望输入 `use my_crate::UsefulType;`。

好消息是，即使内部结构对其他人从外部库使用起来*不*方便，你也不必重新组织内部结构：你可以使用 `pub use` 重新导出项，创建一个与私有结构不同的公有结构。*重新导出*（re-exporting）会将一个公有项从一个位置公开到另一个位置，就好像它是在另一个位置定义的一样。

例如，假设我们创建了一个名为 `art` 的库来建模艺术概念。在这个库中有两个模块：一个 `kinds` 模块包含两个枚举 `PrimaryColor` 和 `SecondaryColor`，一个 `utils` 模块包含一个名为 `mix` 的函数，如示例 14-3 所示。

<Listing number="14-3" file-name="src/lib.rs" caption="一个将项组织到 `kinds` 和 `utils` 模块中的 `art` 库">

```rust,noplayground,test_harness
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-03/src/lib.rs:here}}
```

</Listing>

图 14-3 展示了 `cargo doc` 为这个 crate 生成的文档首页。

<img alt="Rendered documentation for the `art` crate that lists the `kinds` and `utils` modules" src="img/trpl14-03.png" class="center" />

<span class="caption">图 14-3：`art` 的文档首页，列出了 `kinds` 和 `utils` 模块</span>

注意 `PrimaryColor` 和 `SecondaryColor` 类型没有列在首页上，`mix` 函数也没有。我们必须点击 `kinds` 和 `utils` 才能看到它们。

另一个依赖此库的 crate 需要使用 `use` 语句将 `art` 中的项引入作用域，并指定当前定义的模块结构。示例 14-4 展示了一个使用 `art` crate 中 `PrimaryColor` 和 `mix` 项的 crate 示例。

<Listing number="14-4" file-name="src/main.rs" caption="一个使用 `art` crate 的项并导出其内部结构的 crate">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-04/src/main.rs}}
```

</Listing>

示例 14-4 中使用 `art` crate 的代码的作者必须弄清楚 `PrimaryColor` 在 `kinds` 模块中，而 `mix` 在 `utils` 模块中。`art` crate 的模块结构对于开发 `art` crate 的人来说比对使用它的人更有意义。内部结构对于试图理解如何使用 `art` crate 的人来说没有提供任何有用的信息，反而造成了困惑，因为使用者必须弄清楚去哪里找，还必须在 `use` 语句中指定模块名。

为了从公有 API 中移除内部组织结构，我们可以修改示例 14-3 中的 `art` crate 代码，添加 `pub use` 语句在顶层重新导出这些项，如示例 14-5 所示。

<Listing number="14-5" file-name="src/lib.rs" caption="添加 `pub use` 语句来重新导出项">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-05/src/lib.rs:here}}
```

</Listing>

`cargo doc` 为这个 crate 生成的 API 文档现在会在首页列出并链接重新导出的项，如图 14-4 所示，使得 `PrimaryColor` 和 `SecondaryColor` 类型以及 `mix` 函数更容易被找到。

<img alt="Rendered documentation for the `art` crate with the re-exports on the front page" src="img/trpl14-04.png" class="center" />

<span class="caption">图 14-4：`art` 的文档首页，列出了重新导出的项</span>

`art` crate 的用户仍然可以像示例 14-4 那样查看和使用示例 14-3 中的内部结构，也可以使用示例 14-5 中更方便的结构，如示例 14-6 所示。

<Listing number="14-6" file-name="src/main.rs" caption="一个使用 `art` crate 重新导出项的程序">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-06/src/main.rs:here}}
```

</Listing>

在有很多嵌套模块的情况下，使用 `pub use` 在顶层重新导出类型可以显著改善使用该 crate 的人的体验。`pub use` 的另一个常见用途是重新导出当前 crate 中依赖的定义，使该依赖的定义成为你的 crate 公有 API 的一部分。

创建有用的公有 API 结构更像是一门艺术而非科学，你可以不断迭代以找到最适合用户的 API。选择 `pub use` 让你在内部组织 crate 时拥有灵活性，并将内部结构与呈现给用户的结构解耦。看看你安装过的一些 crate 的代码，看看它们的内部结构是否与公有 API 不同。

### 设置 Crates.io 账号

在发布任何 crate 之前，你需要在 [crates.io](https://crates.io/)<!-- ignore --> 上创建一个账号并获取 API 令牌。为此，请访问 [crates.io](https://crates.io/)<!-- ignore --> 的首页并通过 GitHub 账号登录。（目前 GitHub 账号是必需的，但该网站将来可能会支持其他创建账号的方式。）登录后，访问你的账号设置页面 [https://crates.io/me/](https://crates.io/me/)<!-- ignore --> 并获取你的 API 密钥。然后运行 `cargo login` 命令，在提示时粘贴你的 API 密钥，如下所示：

```console
$ cargo login
abcdefghijklmnopqrstuvwxyz012345
```

这个命令会将你的 API 令牌告知 Cargo，并将其存储在本地的 *~/.cargo/credentials.toml* 文件中。注意，这个令牌是**机密信息**：不要与任何人分享。如果你因为任何原因将其分享给了他人，应该立即撤销它并在 [crates.io](https://crates.io/)<!-- ignore --> 上生成一个新的令牌。

### 为新 crate 添加元数据

假设你有一个想要发布的 crate。在发布之前，你需要在 crate 的 *Cargo.toml* 文件的 `[package]` 部分添加一些元数据。

你的 crate 需要一个唯一的名称。当你在本地开发 crate 时，可以随意命名。但是 [crates.io](https://crates.io/)<!-- ignore --> 上的 crate 名称是先到先得的。一旦某个名称被占用，其他人就不能再发布同名的 crate。在尝试发布之前，先搜索你想使用的名称。如果该名称已被使用，你需要找一个其他名称，并编辑 *Cargo.toml* 文件中 `[package]` 部分的 `name` 字段来使用新名称进行发布，如下所示：

<span class="filename">文件名：Cargo.toml</span>

```toml
[package]
name = "guessing_game"
```

即使你选择了一个唯一的名称，此时运行 `cargo publish` 来发布 crate，你仍然会得到一个警告和一个错误：

<!-- manual-regeneration
Create a new package with an unregistered name, making no further modifications
  to the generated package, so it is missing the description and license fields.
cargo publish
copy just the relevant lines below
-->

```console
$ cargo publish
    Updating crates.io index
warning: manifest has no description, license, license-file, documentation, homepage or repository.
See https://doc.rust-lang.org/cargo/reference/manifest.html#package-metadata for more info.
--snip--
error: failed to publish to registry at https://crates.io

Caused by:
  the remote server responded with an error (status 400 Bad Request): missing or empty metadata fields: description, license. Please see https://doc.rust-lang.org/cargo/reference/manifest.html for more information on configuring these fields
```

这个错误是因为你缺少一些关键信息：描述和许可证是必需的，这样人们才能知道你的 crate 做什么以及在什么条款下可以使用它。在 *Cargo.toml* 中，添加一两句话的描述，因为它会出现在搜索结果中与你的 crate 一起显示。对于 `license` 字段，你需要提供一个*许可证标识符值*。[Linux 基金会的软件包数据交换（SPDX）][spdx]列出了可用于此值的标识符。例如，要指定你的 crate 使用 MIT 许可证，添加 `MIT` 标识符：

<span class="filename">文件名：Cargo.toml</span>

```toml
[package]
name = "guessing_game"
license = "MIT"
```

如果你想使用 SPDX 中没有的许可证，你需要将该许可证的文本放在一个文件中，将该文件包含在你的项目中，然后使用 `license-file` 来指定该文件的名称，而不是使用 `license` 键。

关于哪种许可证适合你的项目，这超出了本书的范围。Rust 社区中的许多人以与 Rust 相同的方式为他们的项目授权，使用 `MIT OR Apache-2.0` 双重许可证。这种做法表明你也可以通过 `OR` 分隔多个许可证标识符来为你的项目设置多个许可证。

添加了唯一名称、版本、描述和许可证之后，一个准备好发布的项目的 *Cargo.toml* 文件可能如下所示：

<span class="filename">文件名：Cargo.toml</span>

```toml
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"
description = "A fun game where you guess what number the computer has chosen."
license = "MIT OR Apache-2.0"

[dependencies]
```

[Cargo 的文档](https://doc.rust-lang.org/cargo/)描述了你可以指定的其他元数据，以确保其他人能更容易地发现和使用你的 crate。

### 发布到 Crates.io

现在你已经创建了账号、保存了 API 令牌、为 crate 选择了名称并指定了必需的元数据，你就可以发布了！发布 crate 会将特定版本上传到 [crates.io](https://crates.io/)<!-- ignore --> 供他人使用。

请注意，发布是**永久性的**。版本永远不能被覆盖，代码也不能被删除（除非在某些特殊情况下）。Crates.io 的一个主要目标是充当代码的永久存档，以便所有依赖 [crates.io](https://crates.io/)<!-- ignore --> 上 crate 的项目都能继续正常构建。允许删除版本将使这一目标无法实现。不过，你可以发布的 crate 版本数量没有限制。

再次运行 `cargo publish` 命令，这次应该会成功：

<!-- manual-regeneration
go to some valid crate, publish a new version
cargo publish
copy just the relevant lines below
-->

```console
$ cargo publish
    Updating crates.io index
   Packaging guessing_game v0.1.0 (file:///projects/guessing_game)
    Packaged 6 files, 1.2KiB (895.0B compressed)
   Verifying guessing_game v0.1.0 (file:///projects/guessing_game)
   Compiling guessing_game v0.1.0
(file:///projects/guessing_game/target/package/guessing_game-0.1.0)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.19s
   Uploading guessing_game v0.1.0 (file:///projects/guessing_game)
    Uploaded guessing_game v0.1.0 to registry `crates-io`
note: waiting for `guessing_game v0.1.0` to be available at registry
`crates-io`.
You may press ctrl-c to skip waiting; the crate should be available shortly.
   Published guessing_game v0.1.0 at registry `crates-io`
```

恭喜！你现在已经与 Rust 社区分享了你的代码，任何人都可以轻松地将你的 crate 添加为他们项目的依赖。

### 发布现有 crate 的新版本

当你对 crate 进行了修改并准备发布新版本时，修改 *Cargo.toml* 文件中指定的 `version` 值并重新发布。根据你所做的更改类型，使用[语义化版本规则][semver]来决定合适的下一个版本号。然后运行 `cargo publish` 来上传新版本。

<!-- Old headings. Do not remove or links may break. -->

<a id="removing-versions-from-cratesio-with-cargo-yank"></a>
<a id="deprecating-versions-from-cratesio-with-cargo-yank"></a>

### 使用 `cargo yank` 弃用 Crates.io 上的版本

虽然你不能删除 crate 的旧版本，但你可以阻止未来的项目将其添加为新的依赖。这在某个 crate 版本因某种原因而损坏时很有用。在这种情况下，Cargo 支持*撤回*（yanking）一个 crate 版本。

*撤回*一个版本会阻止新项目依赖该版本，同时允许所有已经依赖它的现有项目继续正常工作。本质上，撤回意味着所有带有 *Cargo.lock* 的项目不会受到影响，而未来生成的任何 *Cargo.lock* 文件都不会使用被撤回的版本。

要撤回一个 crate 的某个版本，在你之前发布过的 crate 的目录中运行 `cargo yank` 并指定要撤回的版本。例如，如果我们发布了一个名为 `guessing_game` 的 crate 的 1.0.1 版本并想要撤回它，我们可以在 `guessing_game` 的项目目录中运行以下命令：

<!-- manual-regeneration:
cargo yank carol-test --version 2.1.0
cargo yank carol-test --version 2.1.0 --undo
-->

```console
$ cargo yank --vers 1.0.1
    Updating crates.io index
        Yank guessing_game@1.0.1
```

通过在命令中添加 `--undo`，你也可以撤销撤回操作，允许项目重新依赖该版本：

```console
$ cargo yank --vers 1.0.1 --undo
    Updating crates.io index
      Unyank guessing_game@1.0.1
```

撤回*不会*删除任何代码。例如，它无法删除意外上传的机密信息。如果发生了这种情况，你必须立即重置这些机密信息。

[spdx]: https://spdx.org/licenses/
[semver]: https://semver.org/
