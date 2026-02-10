## Cargo 工作空间

在第 12 章中，我们构建了一个包含二进制 crate 和库 crate 的包。随着项目的发展，你可能会发现库 crate 越来越大，你想要将包进一步拆分为多个库 crate。Cargo 提供了一个叫做**工作空间**（_workspaces_）的功能，可以帮助管理多个相互关联、协同开发的包。

### 创建工作空间

**工作空间**（_workspace_）是一组共享同一个 _Cargo.lock_ 和输出目录的包。让我们用工作空间来创建一个项目——我们会使用简单的代码，以便专注于工作空间的结构。组织工作空间有多种方式，我们只展示其中一种常见的方式。我们的工作空间将包含一个二进制 crate 和两个库 crate。二进制 crate 提供主要功能，并依赖于这两个库 crate。其中一个库 crate 提供 `add_one` 函数，另一个库 crate 提供 `add_two` 函数。这三个 crate 将属于同一个工作空间。我们先为工作空间创建一个新目录：

```console
$ mkdir add
$ cd add
```

接下来，在 _add_ 目录中创建 _Cargo.toml_ 文件来配置整个工作空间。这个文件不会有 `[package]` 部分，而是以 `[workspace]` 部分开头，这样我们就可以向工作空间添加成员。我们还特意在工作空间中将 `resolver` 的值设置为 `"3"`，以使用 Cargo 最新最好的解析算法：

<span class="filename">Filename: Cargo.toml</span>

```toml
{{#include ../listings/ch14-more-about-cargo/no-listing-01-workspace/add/Cargo.toml}}
```

接下来，我们在 _add_ 目录中运行 `cargo new` 来创建 `adder` 二进制 crate：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/output-only-01-adder-crate/add
remove `members = ["adder"]` from Cargo.toml
rm -rf adder
cargo new adder
copy output below
-->

```console
$ cargo new adder
     Created binary (application) `adder` package
      Adding `adder` as member of workspace at `file:///projects/add`
```

在工作空间内运行 `cargo new` 还会自动将新创建的包添加到工作空间 _Cargo.toml_ 中 `[workspace]` 定义的 `members` 键中，如下所示：

```toml
{{#include ../listings/ch14-more-about-cargo/output-only-01-adder-crate/add/Cargo.toml}}
```

此时，我们可以运行 `cargo build` 来构建工作空间。_add_ 目录中的文件应该如下所示：

```text
├── Cargo.lock
├── Cargo.toml
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

工作空间在顶层有一个 _target_ 目录，编译产物会放在这里；`adder` 包没有自己的 _target_ 目录。即使我们在 _adder_ 目录内运行 `cargo build`，编译产物仍然会出现在 _add/target_ 中，而不是 _add/adder/target_ 中。Cargo 之所以这样组织工作空间的 _target_ 目录，是因为工作空间中的 crate 之间本来就是要相互依赖的。如果每个 crate 都有自己的 _target_ 目录，那么每个 crate 都必须重新编译工作空间中的其他 crate，才能将产物放到自己的 _target_ 目录中。通过共享一个 _target_ 目录，各个 crate 可以避免不必要的重复构建。

### 在工作空间中创建第二个包

接下来，让我们在工作空间中创建另一个成员包，命名为 `add_one`。生成一个名为 `add_one` 的新库 crate：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/output-only-02-add-one/add
remove `"add_one"` from `members` list in Cargo.toml
rm -rf add_one
cargo new add_one --lib
copy output below
-->

```console
$ cargo new add_one --lib
     Created library `add_one` package
      Adding `add_one` as member of workspace at `file:///projects/add`
```

顶层的 _Cargo.toml_ 现在会在 `members` 列表中包含 _add_one_ 路径：

<span class="filename">Filename: Cargo.toml</span>

```toml
{{#include ../listings/ch14-more-about-cargo/no-listing-02-workspace-with-two-crates/add/Cargo.toml}}
```

你的 _add_ 目录现在应该有这些目录和文件：

```text
├── Cargo.lock
├── Cargo.toml
├── add_one
│   ├── Cargo.toml
│   └── src
│       └── lib.rs
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

在 _add_one/src/lib.rs_ 文件中，添加一个 `add_one` 函数：

<span class="filename">Filename: add_one/src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch14-more-about-cargo/no-listing-02-workspace-with-two-crates/add/add_one/src/lib.rs}}
```

现在我们可以让包含二进制 crate 的 `adder` 包依赖包含库的 `add_one` 包。首先，需要在 _adder/Cargo.toml_ 中添加对 `add_one` 的路径依赖。

<span class="filename">Filename: adder/Cargo.toml</span>

```toml
{{#include ../listings/ch14-more-about-cargo/no-listing-02-workspace-with-two-crates/add/adder/Cargo.toml:6:7}}
```

Cargo 不会假设工作空间中的 crate 之间存在相互依赖关系，所以我们需要显式声明依赖关系。

接下来，在 `adder` crate 中使用 `add_one` crate 的 `add_one` 函数。打开 _adder/src/main.rs_ 文件，修改 `main` 函数来调用 `add_one` 函数，如示例 14-7 所示。

<Listing number="14-7" file-name="adder/src/main.rs" caption="在 `adder` crate 中使用 `add_one` 库 crate">

```rust,ignore
{{#rustdoc_include ../listings/ch14-more-about-cargo/listing-14-07/add/adder/src/main.rs}}
```

</Listing>

让我们在顶层 _add_ 目录中运行 `cargo build` 来构建工作空间！

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/listing-14-07/add
cargo build
copy output below; the output updating script doesn't handle subdirectories in paths properly
-->

```console
$ cargo build
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.22s
```

要从 _add_ 目录运行二进制 crate，可以通过 `cargo run` 的 `-p` 参数指定要运行的工作空间中的包名：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/listing-14-07/add
cargo run -p adder
copy output below; the output updating script doesn't handle subdirectories in paths properly
-->

```console
$ cargo run -p adder
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/adder`
Hello, world! 10 plus one is 11!
```

这会运行 _adder/src/main.rs_ 中的代码，它依赖于 `add_one` crate。

<!-- Old headings. Do not remove or links may break. -->

<a id="depending-on-an-external-package-in-a-workspace"></a>

### 依赖外部包

注意工作空间只在顶层有一个 _Cargo.lock_ 文件，而不是在每个 crate 的目录中各有一个。这确保了所有 crate 使用相同版本的所有依赖。如果我们将 `rand` 包添加到 _adder/Cargo.toml_ 和 _add_one/Cargo.toml_ 文件中，Cargo 会将它们解析为同一个版本的 `rand`，并记录在唯一的 _Cargo.lock_ 中。让工作空间中的所有 crate 使用相同的依赖，意味着这些 crate 之间始终是兼容的。让我们在 _add_one/Cargo.toml_ 文件的 `[dependencies]` 部分添加 `rand` crate，以便在 `add_one` crate 中使用它：

<!-- When updating the version of `rand` used, also update the version of
`rand` used in these files so they all match:
* ch02-00-guessing-game-tutorial.md
* ch07-04-bringing-paths-into-scope-with-the-use-keyword.md
-->

<span class="filename">Filename: add_one/Cargo.toml</span>

```toml
{{#include ../listings/ch14-more-about-cargo/no-listing-03-workspace-with-external-dependency/add/add_one/Cargo.toml:6:7}}
```

现在我们可以在 _add_one/src/lib.rs_ 文件中添加 `use rand;`，然后在 _add_ 目录中运行 `cargo build` 来构建整个工作空间，这会引入并编译 `rand` crate。我们会得到一个警告，因为我们并没有使用引入作用域的 `rand`：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/no-listing-03-workspace-with-external-dependency/add
cargo build
copy output below; the output updating script doesn't handle subdirectories in paths properly
-->

```console
$ cargo build
    Updating crates.io index
  Downloaded rand v0.8.5
   --snip--
   Compiling rand v0.8.5
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
warning: unused import: `rand`
 --> add_one/src/lib.rs:1:5
  |
1 | use rand;
  |     ^^^^
  |
  = note: `#[warn(unused_imports)]` on by default

warning: `add_one` (lib) generated 1 warning (run `cargo fix --lib -p add_one` to apply 1 suggestion)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.95s
```

顶层的 _Cargo.lock_ 现在包含了 `add_one` 对 `rand` 的依赖信息。然而，即使 `rand` 在工作空间的某处被使用了，我们也不能在工作空间的其他 crate 中使用它，除非也将 `rand` 添加到它们的 _Cargo.toml_ 文件中。例如，如果我们在 `adder` 包的 _adder/src/main.rs_ 文件中添加 `use rand;`，会得到一个错误：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/output-only-03-use-rand/add
cargo build
copy output below; the output updating script doesn't handle subdirectories in paths properly
-->

```console
$ cargo build
  --snip--
   Compiling adder v0.1.0 (file:///projects/add/adder)
error[E0432]: unresolved import `rand`
 --> adder/src/main.rs:2:5
  |
2 | use rand;
  |     ^^^^ no external crate `rand`
```

要解决这个问题，需要编辑 `adder` 包的 _Cargo.toml_ 文件，将 `rand` 也声明为它的依赖。构建 `adder` 包时会将 `rand` 添加到 _Cargo.lock_ 中 `adder` 的依赖列表中，但不会额外下载 `rand` 的副本。Cargo 会确保工作空间中每个包里使用 `rand` 包的 crate 都使用相同的版本，只要它们指定了兼容的 `rand` 版本，这既节省了空间，也确保了工作空间中的 crate 之间相互兼容。

如果工作空间中的 crate 指定了同一依赖的不兼容版本，Cargo 会分别解析它们，但仍会尽量减少解析的版本数量。

### 为工作空间添加测试

作为另一个改进，让我们在 `add_one` crate 中为 `add_one::add_one` 函数添加一个测试：

<span class="filename">Filename: add_one/src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch14-more-about-cargo/no-listing-04-workspace-with-tests/add/add_one/src/lib.rs}}
```

现在在顶层 _add_ 目录中运行 `cargo test`。在这样结构的工作空间中运行 `cargo test` 会运行工作空间中所有 crate 的测试：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/no-listing-04-workspace-with-tests/add
cargo test
copy output below; the output updating script doesn't handle subdirectories in
paths properly
-->

```console
$ cargo test
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.20s
     Running unittests src/lib.rs (target/debug/deps/add_one-93c49ee75dc46543)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/adder-3a47283c568d2b6a)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出的第一部分显示 `add_one` crate 中的 `it_works` 测试通过了。第二部分显示在 `adder` crate 中没有找到任何测试，最后一部分显示在 `add_one` crate 中没有找到文档测试。

我们也可以在顶层目录中使用 `-p` 参数并指定 crate 名称，来运行工作空间中某个特定 crate 的测试：

<!-- manual-regeneration
cd listings/ch14-more-about-cargo/no-listing-04-workspace-with-tests/add
cargo test -p add_one
copy output below; the output updating script doesn't handle subdirectories in paths properly
-->

```console
$ cargo test -p add_one
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.00s
     Running unittests src/lib.rs (target/debug/deps/add_one-93c49ee75dc46543)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

这个输出表明 `cargo test` 只运行了 `add_one` crate 的测试，而没有运行 `adder` crate 的测试。

如果你要将工作空间中的 crate 发布到 [crates.io](https://crates.io/)<!-- ignore -->，工作空间中的每个 crate 都需要单独发布。与 `cargo test` 类似，我们可以使用 `-p` 参数并指定要发布的 crate 名称来发布工作空间中的某个特定 crate。

作为额外的练习，请以类似 `add_one` crate 的方式向这个工作空间添加一个 `add_two` crate！

随着项目的增长，可以考虑使用工作空间：相比一大坨代码，工作空间让你能够使用更小、更易理解的组件。此外，将 crate 放在同一个工作空间中，可以让经常同时修改的 crate 之间更容易协调。
