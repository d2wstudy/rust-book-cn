## 读取文件

现在我们来添加读取 `file_path` 参数所指定文件的功能。首先，我们需要一个用于测试的示例文件：我们将使用一个包含少量文本、多行内容且有一些重复单词的文件。示例 12-3 是一首 Emily Dickinson 的诗，非常适合作为测试用例！在项目根目录下创建一个名为 _poem.txt_ 的文件，输入这首诗"I'm Nobody! Who are you?"

<Listing number="12-3" file-name="poem.txt" caption="Emily Dickinson 的一首诗是很好的测试用例">

```text
{{#include ../listings/ch12-an-io-project/listing-12-03/poem.txt}}
```

</Listing>

文本准备好之后，编辑 _src/main.rs_ 并添加读取文件的代码，如示例 12-4 所示。

<Listing number="12-4" file-name="src/main.rs" caption="读取第二个参数所指定的文件内容">

```rust,should_panic,noplayground
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-04/src/main.rs:here}}
```

</Listing>

首先，我们通过 `use` 语句引入标准库的相关部分：我们需要 `std::fs` 来处理文件。

在 `main` 中，新增的语句 `fs::read_to_string` 接受 `file_path`，打开该文件，并返回一个 `std::io::Result<String>` 类型的值，其中包含文件的内容。

之后，我们再次添加了一个临时的 `println!` 语句，在文件读取完成后打印 `contents` 的值，以便检查程序到目前为止是否正常工作。

让我们用任意字符串作为第一个命令行参数（因为我们还没有实现搜索部分），用 _poem.txt_ 文件作为第二个参数来运行这段代码：

```console
{{#rustdoc_include ../listings/ch12-an-io-project/listing-12-04/output.txt}}
```

很好！代码读取并打印了文件的内容。但这段代码有一些不足之处。目前，`main` 函数承担了多项职责：通常来说，如果每个函数只负责一个功能，函数会更加清晰且易于维护。另一个问题是我们没有尽可能好地处理错误。程序目前还很小，所以这些不足还不是大问题，但随着程序的增长，要想干净利落地修复它们就会越来越难。在开发程序时尽早开始重构是一个好习惯，因为重构少量代码要容易得多。我们接下来就来做这件事。
