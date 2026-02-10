## 测试的组织结构

正如本章开头所提到的，测试是一门复杂的学科，不同的人使用不同的术语和组织方式。Rust 社区将测试分为两大类：单元测试（unit tests）和集成测试（integration tests）。**单元测试**小而专注，每次单独测试一个模块，并且可以测试私有接口。**集成测试**则完全位于你的库外部，以与其他外部代码相同的方式使用你的代码，只使用公有接口，并且每个测试可能会涉及多个模块。

编写这两种测试对于确保你的库的各个部分能够独立地和协同地按预期工作都很重要。

### 单元测试

单元测试的目的是将每个代码单元与其余代码隔离开来进行测试，以便快速定位代码在哪里正常工作、在哪里不正常。你需要将单元测试放在 *src* 目录下的每个文件中，与它们所测试的代码放在一起。惯例是在每个文件中创建一个名为 `tests` 的模块来包含测试函数，并使用 `cfg(test)` 来标注这个模块。

#### `tests` 模块和 `#[cfg(test)]`

`tests` 模块上的 `#[cfg(test)]` 注解告诉 Rust 只在运行 `cargo test` 时才编译和运行测试代码，而在运行 `cargo build` 时不这样做。这在你只想构建库的时候节省了编译时间，也因为测试没有被包含在内而节省了编译产物的空间。你会看到，由于集成测试放在不同的目录中，它们不需要 `#[cfg(test)]` 注解。然而，由于单元测试与代码放在同一个文件中，你需要使用 `#[cfg(test)]` 来指定它们不应被包含在编译结果中。

回忆一下，当我们在本章第一节生成新的 `adder` 项目时，Cargo 为我们生成了如下代码：

<span class="filename">Filename: src/lib.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-01/src/lib.rs}}
```

在自动生成的 `tests` 模块上，`cfg` 属性代表 *configuration*（配置），它告诉 Rust 只有在给定特定配置选项时才应包含后面的项。在这种情况下，配置选项是 `test`，这是 Rust 为编译和运行测试而提供的。通过使用 `cfg` 属性，Cargo 只在我们主动使用 `cargo test` 运行测试时才编译测试代码。这包括该模块中可能存在的任何辅助函数，以及用 `#[test]` 标注的函数。

<!-- Old headings. Do not remove or links may break. -->

<a id="testing-private-functions"></a>

#### 测试私有函数

在测试社区中，关于是否应该直接测试私有函数存在争论，而且其他语言使得测试私有函数变得困难甚至不可能。无论你遵循哪种测试理念，Rust 的隐私规则确实允许你测试私有函数。考虑示例 11-12 中包含私有函数 `internal_adder` 的代码。

<Listing number="11-12" file-name="src/lib.rs" caption="测试私有函数">

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-12/src/lib.rs}}
```

</Listing>

注意 `internal_adder` 函数没有标记为 `pub`。测试也只是 Rust 代码，而 `tests` 模块也只是另一个模块。正如我们在["引用模块项的路径"][paths]<!-- ignore -->中讨论的那样，子模块中的项可以使用其祖先模块中的项。在这个测试中，我们通过 `use super::*` 将 `tests` 模块的父模块中的所有项引入作用域，然后测试就可以调用 `internal_adder` 了。如果你认为不应该测试私有函数，Rust 中也没有任何东西会强迫你这样做。

### 集成测试

在 Rust 中，集成测试完全位于你的库外部。它们以与其他代码相同的方式使用你的库，这意味着它们只能调用属于库公有 API 的函数。集成测试的目的是检验你的库的多个部分能否正确地协同工作。那些独立运行时正常的代码单元在集成时可能会出现问题，因此对集成代码的测试覆盖也很重要。要创建集成测试，你首先需要一个 *tests* 目录。

#### *tests* 目录

我们在项目目录的顶层创建一个 *tests* 目录，与 *src* 同级。Cargo 知道在这个目录中查找集成测试文件。然后我们可以创建任意多个测试文件，Cargo 会将每个文件编译为一个独立的 crate。

让我们来创建一个集成测试。在 *src/lib.rs* 文件中仍然保留示例 11-12 的代码，创建一个 *tests* 目录，并新建一个名为 *tests/integration_test.rs* 的文件。你的目录结构应该如下所示：

```text
adder
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── integration_test.rs
```

将示例 11-13 中的代码输入到 *tests/integration_test.rs* 文件中。

<Listing number="11-13" file-name="tests/integration_test.rs" caption="对 `adder` crate 中函数的集成测试">

```rust,ignore
{{#rustdoc_include ../listings/ch11-writing-automated-tests/listing-11-13/tests/integration_test.rs}}
```

</Listing>

*tests* 目录中的每个文件都是一个独立的 crate，所以我们需要将库引入每个测试 crate 的作用域。因此，我们在代码顶部添加了 `use adder::add_two;`，这在单元测试中是不需要的。

我们不需要在 *tests/integration_test.rs* 中的任何代码上标注 `#[cfg(test)]`。Cargo 会特殊对待 *tests* 目录，只在运行 `cargo test` 时才编译这个目录中的文件。现在运行 `cargo test`：

```console
{{#include ../listings/ch11-writing-automated-tests/listing-11-13/output.txt}}
```

输出的三个部分包括单元测试、集成测试和文档测试。注意，如果某个部分中的任何测试失败了，后续部分将不会运行。例如，如果一个单元测试失败了，就不会有集成测试和文档测试的输出，因为这些测试只有在所有单元测试都通过时才会运行。

单元测试部分与我们之前看到的一样：每个单元测试一行（我们在示例 11-12 中添加了一个名为 `internal` 的测试），然后是单元测试的汇总行。

集成测试部分以 `Running tests/integration_test.rs` 这一行开始。接下来，该集成测试中的每个测试函数各占一行，然后在 `Doc-tests adder` 部分开始之前是集成测试结果的汇总行。

每个集成测试文件都有自己的部分，所以如果我们在 *tests* 目录中添加更多文件，就会有更多的集成测试部分。

我们仍然可以通过将测试函数的名称作为 `cargo test` 的参数来运行特定的集成测试函数。要运行某个特定集成测试文件中的所有测试，可以使用 `cargo test` 的 `--test` 参数，后跟文件名：

```console
{{#include ../listings/ch11-writing-automated-tests/output-only-05-single-integration/output.txt}}
```

这个命令只运行 *tests/integration_test.rs* 文件中的测试。

#### 集成测试中的子模块

随着你添加更多的集成测试，你可能希望在 *tests* 目录中创建更多文件来帮助组织它们；例如，你可以按测试的功能来分组测试函数。如前所述，*tests* 目录中的每个文件都会被编译为一个独立的 crate，这对于创建独立的作用域以更好地模拟最终用户使用你的 crate 的方式很有用。然而，这意味着 *tests* 目录中的文件不像 *src* 中的文件那样共享相同的行为，正如你在第 7 章中学到的关于如何将代码分离为模块和文件的内容。

当你有一组辅助函数需要在多个集成测试文件中使用，并且你尝试按照第 7 章["将模块分离到不同文件"][separating-modules-into-files]<!-- ignore -->一节中的步骤将它们提取到一个公共模块中时，*tests* 目录文件的不同行为就最为明显了。例如，如果我们创建 *tests/common.rs* 并在其中放置一个名为 `setup` 的函数，我们可以在 `setup` 中添加一些希望从多个测试文件中的多个测试函数调用的代码：

<span class="filename">Filename: tests/common.rs</span>

```rust,noplayground
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-12-shared-test-code-problem/tests/common.rs}}
```

当我们再次运行测试时，会在测试输出中看到一个新的部分对应 *common.rs* 文件，即使这个文件不包含任何测试函数，我们也没有在任何地方调用 `setup` 函数：

```console
{{#include ../listings/ch11-writing-automated-tests/no-listing-12-shared-test-code-problem/output.txt}}
```

在测试结果中看到 `common` 出现并显示 `running 0 tests` 并不是我们想要的。我们只是想与其他集成测试文件共享一些代码。为了避免 `common` 出现在测试输出中，我们不创建 *tests/common.rs*，而是创建 *tests/common/mod.rs*。项目目录现在看起来像这样：

```text
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    ├── common
    │   └── mod.rs
    └── integration_test.rs
```

这是 Rust 也能理解的旧命名约定，我们在第 7 章的["备用文件路径"][alt-paths]<!-- ignore -->中提到过。以这种方式命名文件告诉 Rust 不要将 `common` 模块视为集成测试文件。当我们将 `setup` 函数的代码移到 *tests/common/mod.rs* 中并删除 *tests/common.rs* 文件后，测试输出中的那个部分就不会再出现了。*tests* 目录的子目录中的文件不会被编译为独立的 crate，也不会在测试输出中有自己的部分。

创建 *tests/common/mod.rs* 之后，我们可以在任何集成测试文件中将其作为模块使用。下面是在 *tests/integration_test.rs* 中的 `it_adds_two` 测试中调用 `setup` 函数的示例：

<span class="filename">Filename: tests/integration_test.rs</span>

```rust,ignore
{{#rustdoc_include ../listings/ch11-writing-automated-tests/no-listing-13-fix-shared-test-code-problem/tests/integration_test.rs}}
```

注意 `mod common;` 声明与我们在示例 7-21 中演示的模块声明相同。然后在测试函数中，我们可以调用 `common::setup()` 函数。

#### 二进制 crate 的集成测试

如果我们的项目是一个只包含 *src/main.rs* 文件而没有 *src/lib.rs* 文件的二进制 crate，我们就无法在 *tests* 目录中创建集成测试，也无法通过 `use` 语句将 *src/main.rs* 文件中定义的函数引入作用域。只有库 crate 才能暴露函数供其他 crate 使用；二进制 crate 是用来独立运行的。

这也是提供二进制文件的 Rust 项目通常会有一个简单的 *src/main.rs* 文件来调用 *src/lib.rs* 文件中逻辑的原因之一。使用这种结构，集成测试**可以**通过 `use` 来测试库 crate，使重要的功能可用。如果重要的功能能正常工作，那么 *src/main.rs* 中的少量代码也能正常工作，而这少量代码不需要被测试。

## 总结

Rust 的测试功能提供了一种方式来指定代码应该如何运行，以确保即使在你做出更改之后，代码仍然按预期工作。单元测试分别测试库的不同部分，并且可以测试私有实现细节。集成测试检查库的多个部分能否正确地协同工作，它们使用库的公有 API 来测试代码，方式与外部代码使用它的方式相同。尽管 Rust 的类型系统和所有权规则有助于防止某些类型的 bug，但测试对于减少与代码预期行为相关的逻辑 bug 仍然很重要。

让我们结合你在本章和之前章节中学到的知识，来做一个项目吧！

[paths]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html
[separating-modules-into-files]: ch07-05-separating-modules-into-different-files.html
[alt-paths]: ch07-05-separating-modules-into-different-files.html#alternate-file-paths
