## 使用环境变量

我们将为 `minigrep` 添加一个额外的功能：一个通过环境变量开启的大小写不敏感搜索选项。我们可以将这个功能做成命令行选项，要求用户每次使用时都输入，但将其设为环境变量后，用户只需设置一次环境变量，就可以在该终端会话中进行大小写不敏感的搜索。

<!-- Old headings. Do not remove or links may break. -->
<a id="writing-a-failing-test-for-the-case-insensitive-search-function"></a>

### 为大小写不敏感搜索编写一个失败的测试

我们首先在 `minigrep` 库中添加一个新的 `search_case_insensitive` 函数，当环境变量有值时将调用该函数。我们将继续遵循 TDD 流程，所以第一步仍然是编写一个失败的测试。我们将为新的 `search_case_insensitive` 函数添加一个新测试，并将旧测试从 `one_result` 重命名为 `case_sensitive`，以明确两个测试之间的区别，如示例 12-20 所示。

<Listing number="12-20" file-name="src/lib.rs" caption="为即将添加的大小写不敏感函数添加一个新的失败测试">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-20/src/lib.rs:here}}
```

</Listing>

注意我们也修改了旧测试的 `contents`。我们添加了一行新文本 `"Duct tape."`，使用了大写的 _D_，在大小写敏感搜索时不应匹配查询 `"duct"`。以这种方式修改旧测试有助于确保我们不会意外破坏已经实现的大小写敏感搜索功能。这个测试现在应该能通过，并且在我们实现大小写不敏感搜索时也应该继续通过。

大小写*不敏感*搜索的新测试使用 `"rUsT"` 作为查询字符串。在我们即将添加的 `search_case_insensitive` 函数中，查询 `"rUsT"` 应该匹配包含 `"Rust:"` 的行（大写 _R_）以及 `"Trust me."` 这一行，即使它们的大小写与查询不同。这是我们的失败测试，由于我们还没有定义 `search_case_insensitive` 函数，它将无法编译。你可以像我们在示例 12-16 中为 `search` 函数所做的那样，添加一个始终返回空 vector 的骨架实现，以查看测试编译并失败的情况。

### 实现 `search_case_insensitive` 函数

`search_case_insensitive` 函数如示例 12-21 所示，与 `search` 函数几乎相同。唯一的区别是我们会将 `query` 和每一行 `line` 都转换为小写，这样无论输入参数的大小写如何，在检查该行是否包含查询字符串时它们都是相同的大小写。

<Listing number="12-21" file-name="src/lib.rs" caption="定义 `search_case_insensitive` 函数，在比较之前将查询字符串和行都转换为小写">

```rust,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-21/src/lib.rs:here}}
```

</Listing>

首先，我们将 `query` 字符串转换为小写并存储在一个同名的新变量中，遮蔽了原来的 `query`。对查询字符串调用 `to_lowercase` 是必要的，这样无论用户的查询是 `"rust"`、`"RUST"`、`"Rust"` 还是 `"rUsT"`，我们都会将查询视为 `"rust"`，从而实现大小写不敏感。虽然 `to_lowercase` 能处理基本的 Unicode，但不会百分之百准确。如果我们在编写一个真正的应用程序，这里需要做更多工作，但本节的重点是环境变量而非 Unicode，所以我们就此打住。

注意 `query` 现在是一个 `String` 而非字符串切片，因为调用 `to_lowercase` 会创建新数据而非引用现有数据。以查询 `"rUsT"` 为例：这个字符串切片中并不包含小写的 `u` 或 `t` 供我们使用，所以我们必须分配一个包含 `"rust"` 的新 `String`。现在当我们将 `query` 作为参数传递给 `contains` 方法时，需要添加一个 `&` 符号，因为 `contains` 的签名定义为接受一个字符串切片。

接下来，我们对每一行 `line` 也调用 `to_lowercase` 将所有字符转换为小写。现在我们已经将 `line` 和 `query` 都转换为小写，无论查询的大小写如何，都能找到匹配项。

让我们看看这个实现能否通过测试：

```console
{{#include ../listings/ch12-an-io-project/listing-12-21/output.txt}}
```

测试通过了！现在让我们从 `run` 函数中调用新的 `search_case_insensitive` 函数。首先，我们将在 `Config` 结构体中添加一个配置选项，用于在大小写敏感和大小写不敏感搜索之间切换。添加这个字段会导致编译错误，因为我们还没有在任何地方初始化这个字段：

<span class="filename">文件名：src/main.rs</span>

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-22/src/main.rs:here}}
```

我们添加了一个保存布尔值的 `ignore_case` 字段。接下来，我们需要让 `run` 函数检查 `ignore_case` 字段的值，并据此决定是调用 `search` 函数还是 `search_case_insensitive` 函数，如示例 12-22 所示。这段代码仍然无法编译。

<Listing number="12-22" file-name="src/main.rs" caption="根据 `config.ignore_case` 的值调用 `search` 或 `search_case_insensitive`">

```rust,ignore,does_not_compile
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-22/src/main.rs:there}}
```

</Listing>

最后，我们需要检查环境变量。处理环境变量的函数位于标准库的 `env` 模块中，该模块已经在 _src/main.rs_ 的顶部引入了作用域。我们将使用 `env` 模块中的 `var` 函数来检查名为 `IGNORE_CASE` 的环境变量是否设置了任何值，如示例 12-23 所示。

<Listing number="12-23" file-name="src/main.rs" caption="检查名为 `IGNORE_CASE` 的环境变量是否有任何值">

```rust,ignore,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-23/src/main.rs:here}}
```

</Listing>

这里我们创建了一个新变量 `ignore_case`。为了设置它的值，我们调用 `env::var` 函数并传入 `IGNORE_CASE` 环境变量的名称。`env::var` 函数返回一个 `Result`：如果环境变量被设置为任何值，它将返回包含该环境变量值的成功 `Ok` 变体；如果环境变量未设置，则返回 `Err` 变体。

我们对 `Result` 使用 `is_ok` 方法来检查环境变量是否已设置，这意味着程序应该进行大小写不敏感搜索。如果 `IGNORE_CASE` 环境变量没有被设置为任何值，`is_ok` 将返回 `false`，程序将执行大小写敏感搜索。我们不关心环境变量的*值*，只关心它是否被设置，所以我们使用 `is_ok` 而非 `unwrap`、`expect` 或我们在 `Result` 上见过的其他方法。

我们将 `ignore_case` 变量的值传递给 `Config` 实例，这样 `run` 函数就可以读取该值并决定是调用 `search_case_insensitive` 还是 `search`，正如我们在示例 12-22 中实现的那样。

让我们试一试！首先，在不设置环境变量的情况下运行程序，使用查询 `to`，它应该匹配所有包含全小写单词 _to_ 的行：

```console
{{#include ../listings/ch12-an-io-project/listing-12-23/output.txt}}
```

看起来仍然正常！现在让我们将 `IGNORE_CASE` 设置为 `1`，但使用相同的查询 `to` 来运行程序：

```console
$ IGNORE_CASE=1 cargo run -- to poem.txt
```

如果你使用的是 PowerShell，需要分别设置环境变量和运行程序：

```console
PS> $Env:IGNORE_CASE=1; cargo run -- to poem.txt
```

这会使 `IGNORE_CASE` 在你的 shell 会话的剩余时间内持续生效。可以使用 `Remove-Item` cmdlet 来取消设置：

```console
PS> Remove-Item Env:IGNORE_CASE
```

我们应该能得到包含 _to_ 的行，其中可能有大写字母：

<!-- manual-regeneration
cd listings/ch12-an-io-project/listing-12-23
IGNORE_CASE=1 cargo run -- to poem.txt
can't extract because of the environment variable
-->

```console
Are you nobody, too?
How dreary to be somebody!
To tell your name the livelong day
To an admiring bog!
```

太好了，我们也得到了包含 _To_ 的行！我们的 `minigrep` 程序现在可以通过环境变量控制进行大小写不敏感搜索了。现在你知道了如何管理通过命令行参数或环境变量设置的选项。

有些程序允许对同一配置同时使用命令行参数*和*环境变量。在这种情况下，程序会决定其中一个优先。作为你自己的另一个练习，尝试通过命令行参数或环境变量来控制大小写敏感性。如果程序运行时一个设置为大小写敏感而另一个设置为忽略大小写，请决定命令行参数和环境变量哪个应该优先。

`std::env` 模块还包含许多处理环境变量的实用功能：查看其文档以了解可用的内容。
