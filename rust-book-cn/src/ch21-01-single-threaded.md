## 构建单线程 Web 服务器

我们将从一个单线程 Web 服务器开始。在开始之前，让我们先快速了解一下构建 Web 服务器所涉及的协议。这些协议的细节超出了本书的范围，但简要的概述将为你提供所需的背景知识。

Web 服务器涉及的两个主要协议是*超文本传输协议*（*HTTP*）和*传输控制协议*（*TCP*）。这两种协议都是*请求-响应*协议，即*客户端*发起请求，*服务器*监听请求并向客户端提供响应。请求和响应的内容由协议定义。

TCP 是较低层的协议，描述了信息如何从一个服务器传输到另一个服务器，但不指定信息的具体内容。HTTP 建立在 TCP 之上，定义了请求和响应的内容。从技术上讲，HTTP 可以与其他协议配合使用，但在绝大多数情况下，HTTP 通过 TCP 发送数据。我们将直接处理 TCP 和 HTTP 请求与响应的原始字节。

### 监听 TCP 连接

我们的 Web 服务器需要监听 TCP 连接，这是我们要做的第一件事。标准库提供了 `std::net` 模块来实现这一功能。让我们按照惯例创建一个新项目：

```console
$ cargo new hello
     Created binary (application) `hello` project
$ cd hello
```

现在在 _src/main.rs_ 中输入示例 21-1 中的代码。这段代码将在本地地址 `127.0.0.1:7878` 上监听传入的 TCP 流。当收到传入的流时，它会打印 `Connection established!`。

<Listing number="21-1" file-name="src/main.rs" caption="监听传入的流并在收到流时打印消息">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-01/src/main.rs}}
```

</Listing>

通过 `TcpListener`，我们可以在地址 `127.0.0.1:7878` 上监听 TCP 连接。在这个地址中，冒号前面的部分是一个代表你计算机的 IP 地址（每台计算机上都一样，并非特指作者的计算机），`7878` 是端口号。我们选择这个端口有两个原因：HTTP 通常不在这个端口上接受请求，所以我们的服务器不太可能与你机器上运行的其他 Web 服务器冲突；而且 7878 就是在电话键盘上输入 _rust_ 的按键。

这个场景中的 `bind` 函数类似于 `new` 函数，它会返回一个新的 `TcpListener` 实例。这个函数之所以叫 `bind`，是因为在网络术语中，连接到一个端口进行监听被称为"绑定到端口"。

`bind` 函数返回一个 `Result<T, E>`，表示绑定可能会失败。例如，如果我们运行了两个程序实例，就会有两个程序监听同一个端口。因为我们只是出于学习目的编写一个基础服务器，所以不会去处理这类错误；我们使用 `unwrap` 在发生错误时直接停止程序。

`TcpListener` 上的 `incoming` 方法返回一个迭代器，它给出一系列流（更具体地说，是 `TcpStream` 类型的流）。单个*流*（stream）代表客户端和服务器之间的一个打开的连接。*连接*（connection）是指完整的请求和响应过程：客户端连接到服务器，服务器生成响应，然后服务器关闭连接。因此，我们将从 `TcpStream` 中读取客户端发送的内容，然后将响应写入流中以将数据发送回客户端。总体而言，这个 `for` 循环将依次处理每个连接，并为我们生成一系列需要处理的流。

目前，我们对流的处理包括：如果流有任何错误，就调用 `unwrap` 终止程序；如果没有错误，程序就打印一条消息。我们将在下一个示例中为成功的情况添加更多功能。当客户端连接到服务器时，我们可能从 `incoming` 方法收到错误，这是因为我们实际上并不是在遍历连接，而是在遍历*连接尝试*。连接可能因为多种原因而不成功，其中许多是操作系统特定的。例如，许多操作系统对同时打开的连接数有限制；超过该数量的新连接尝试将产生错误，直到一些已打开的连接被关闭。

让我们试试运行这段代码！在终端中执行 `cargo run`，然后在 Web 浏览器中加载 _127.0.0.1:7878_。浏览器应该会显示类似"连接被重置"的错误消息，因为服务器目前没有发送任何数据。但当你查看终端时，应该能看到浏览器连接到服务器时打印的几条消息！

```text
     Running `target/debug/hello`
Connection established!
Connection established!
Connection established!
```

有时你会看到一个浏览器请求打印了多条消息；原因可能是浏览器在请求页面的同时还请求了其他资源，比如浏览器标签页中显示的 _favicon.ico_ 图标。

也可能是因为服务器没有响应任何数据，浏览器尝试多次连接服务器。当 `stream` 在循环末尾离开作用域并被丢弃时，连接会作为 `drop` 实现的一部分被关闭。浏览器有时会通过重试来处理关闭的连接，因为问题可能是暂时的。

浏览器有时还会在不发送任何请求的情况下打开多个到服务器的连接，以便后续发送请求时能更快地完成。在这种情况下，我们的服务器会看到每个连接，无论该连接上是否有任何请求。许多基于 Chrome 的浏览器版本都会这样做；你可以通过使用隐私浏览模式或使用其他浏览器来禁用这种优化。

重要的是，我们已经成功获取了一个 TCP 连接的句柄！

记得在运行完某个版本的代码后按 <kbd>ctrl</kbd>-<kbd>C</kbd> 停止程序。然后，在每次修改代码后通过执行 `cargo run` 命令重新启动程序，以确保你运行的是最新的代码。

### 读取请求

让我们来实现从浏览器读取请求的功能！为了将获取连接和对连接执行操作这两个关注点分离开来，我们将启动一个新函数来处理连接。在这个新的 `handle_connection` 函数中，我们将从 TCP 流中读取数据并打印出来，以便查看浏览器发送的数据。将代码修改为示例 21-2 所示的样子。

<Listing number="21-2" file-name="src/main.rs" caption="从 `TcpStream` 中读取数据并打印">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-02/src/main.rs}}
```

</Listing>

我们将 `std::io::BufReader` 和 `std::io::prelude` 引入作用域，以获取用于读写流的 trait 和类型。在 `main` 函数的 `for` 循环中，我们不再打印表示建立了连接的消息，而是调用新的 `handle_connection` 函数并将 `stream` 传递给它。

在 `handle_connection` 函数中，我们创建了一个新的 `BufReader` 实例来包装 `stream` 的引用。`BufReader` 通过替我们管理对 `std::io::Read` trait 方法的调用来添加缓冲。

我们创建了一个名为 `http_request` 的变量来收集浏览器发送到服务器的请求行。通过添加 `Vec<_>` 类型注解，我们表明希望将这些行收集到一个 vector 中。

`BufReader` 实现了 `std::io::BufRead` trait，该 trait 提供了 `lines` 方法。`lines` 方法通过在遇到换行字节时分割数据流，返回一个 `Result<String, std::io::Error>` 的迭代器。为了获取每个 `String`，我们对每个 `Result` 进行 `map` 和 `unwrap`。如果数据不是有效的 UTF-8 编码，或者从流中读取时出现问题，`Result` 可能是一个错误。同样，生产环境的程序应该更优雅地处理这些错误，但为了简单起见，我们选择在出错时停止程序。

浏览器通过连续发送两个换行符来表示 HTTP 请求的结束，因此为了从流中获取一个请求，我们持续获取行直到遇到空字符串。将这些行收集到 vector 中后，我们使用美化的调试格式打印它们，以便查看 Web 浏览器发送给服务器的指令。

让我们试试这段代码！启动程序并在 Web 浏览器中再次发起请求。注意，我们仍然会在浏览器中看到错误页面，但程序在终端中的输出现在看起来类似这样：

<!-- manual-regeneration
cd listings/ch21-web-server/listing-21-02
cargo run
make a request to 127.0.0.1:7878
Can't automate because the output depends on making requests
-->

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/hello`
Request: [
    "GET / HTTP/1.1",
    "Host: 127.0.0.1:7878",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language: en-US,en;q=0.5",
    "Accept-Encoding: gzip, deflate, br",
    "DNT: 1",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Dest: document",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-User: ?1",
    "Cache-Control: max-age=0",
]
```

根据你使用的浏览器不同，可能会得到略有不同的输出。现在我们打印了请求数据，可以通过查看请求第一行中 `GET` 后面的路径来了解为什么一个浏览器请求会产生多个连接。如果重复的连接都在请求 _/_，我们就知道浏览器在反复尝试获取 _/_，因为它没有从我们的程序得到响应。

让我们分析一下这些请求数据，了解浏览器在向我们的程序请求什么。

<!-- Old headings. Do not remove or links may break. -->

<a id="a-closer-look-at-an-http-request"></a>
<a id="looking-closer-at-an-http-request"></a>

### 深入了解 HTTP 请求

HTTP 是一种基于文本的协议，请求的格式如下：

```text
Method Request-URI HTTP-Version CRLF
headers CRLF
message-body
```

第一行是*请求行*（request line），包含客户端请求的相关信息。请求行的第一部分表示所使用的方法，例如 `GET` 或 `POST`，描述了客户端发起请求的方式。我们的客户端使用了 `GET` 请求，表示它在请求信息。

请求行的下一部分是 _/_，表示客户端请求的*统一资源标识符*（*URI*）：URI 与*统一资源定位符*（*URL*）几乎相同，但不完全一样。URI 和 URL 之间的区别对于本章的目的并不重要，但 HTTP 规范使用的是 *URI* 这个术语，所以我们可以在这里将 *URL* 和 *URI* 视为同义词。

最后一部分是客户端使用的 HTTP 版本，然后请求行以 CRLF 序列结束。（*CRLF* 代表*回车*（carriage return）和*换行*（line feed），这些术语来自打字机时代！）CRLF 序列也可以写成 `\r\n`，其中 `\r` 是回车，`\n` 是换行。*CRLF 序列*将请求行与请求数据的其余部分分隔开来。注意，当 CRLF 被打印时，我们看到的是新行的开始，而不是 `\r\n`。

查看我们目前运行程序所收到的请求行数据，可以看到 `GET` 是方法，_/_ 是请求 URI，`HTTP/1.1` 是版本。

在请求行之后，从 `Host:` 开始的其余行都是请求头。`GET` 请求没有请求体。

尝试从不同的浏览器发起请求，或者请求不同的地址，例如 _127.0.0.1:7878/test_，看看请求数据会如何变化。

现在我们知道了浏览器在请求什么，让我们发送一些数据回去！

### 编写响应

我们将实现向客户端请求发送数据的功能。响应的格式如下：

```text
HTTP-Version Status-Code Reason-Phrase CRLF
headers CRLF
message-body
```

第一行是*状态行*（status line），包含响应中使用的 HTTP 版本、一个总结请求结果的数字状态码，以及一个提供状态码文本描述的原因短语。在 CRLF 序列之后是任意数量的响应头、另一个 CRLF 序列，以及响应体。

下面是一个使用 HTTP 1.1 版本、状态码为 200、原因短语为 OK、没有响应头和响应体的示例响应：

```text
HTTP/1.1 200 OK\r\n\r\n
```

状态码 200 是标准的成功响应。这段文本是一个极简的成功 HTTP 响应。让我们将它作为成功请求的响应写入流中！在 `handle_connection` 函数中，移除之前打印请求数据的 `println!`，替换为示例 21-3 中的代码。

<Listing number="21-3" file-name="src/main.rs" caption="将一个极简的成功 HTTP 响应写入流">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-03/src/main.rs:here}}
```

</Listing>

第一行新代码定义了 `response` 变量，它保存成功消息的数据。然后，我们对 `response` 调用 `as_bytes` 将字符串数据转换为字节。`stream` 上的 `write_all` 方法接受一个 `&[u8]` 并将这些字节直接发送到连接中。因为 `write_all` 操作可能会失败，所以我们像之前一样对任何错误结果使用 `unwrap`。同样，在实际应用中，你应该在这里添加错误处理。

有了这些更改，让我们运行代码并发起请求。我们不再向终端打印任何数据，所以除了 Cargo 的输出外不会看到其他输出。当你在 Web 浏览器中加载 _127.0.0.1:7878_ 时，应该会看到一个空白页面而不是错误。你刚刚手动实现了接收 HTTP 请求并发送响应！

### 返回真正的 HTML

让我们实现返回不仅仅是空白页面的功能。在项目目录的根目录（而不是 _src_ 目录）下创建新文件 _hello.html_。你可以输入任何你想要的 HTML；示例 21-4 展示了一种可能的写法。

<Listing number="21-4" file-name="hello.html" caption="一个用于在响应中返回的示例 HTML 文件">

```html
{{#include ../listings/ch21-web-server/listing-21-05/hello.html}}
```

</Listing>

这是一个包含标题和一些文本的最小 HTML5 文档。为了在收到请求时从服务器返回这个文件，我们将按照示例 21-5 所示修改 `handle_connection`，读取 HTML 文件，将其作为响应体添加到响应中，然后发送。

<Listing number="21-5" file-name="src/main.rs" caption="将 *hello.html* 的内容作为响应体发送">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-05/src/main.rs:here}}
```

</Listing>

我们在 `use` 语句中添加了 `fs`，将标准库的文件系统模块引入作用域。将文件内容读取为字符串的代码应该很眼熟；我们在第 12 章示例 12-4 中为 I/O 项目读取文件内容时用过它。

接下来，我们使用 `format!` 将文件内容作为成功响应的响应体添加进去。为了确保 HTTP 响应有效，我们添加了 `Content-Length` 响应头，其值设置为响应体的大小——在这里就是 `hello.html` 的大小。

使用 `cargo run` 运行这段代码，然后在浏览器中加载 _127.0.0.1:7878_；你应该能看到你的 HTML 被渲染出来了！

目前，我们忽略了 `http_request` 中的请求数据，无条件地返回 HTML 文件的内容。这意味着如果你在浏览器中尝试请求 _127.0.0.1:7878/something-else_，你仍然会得到相同的 HTML 响应。目前我们的服务器非常有限，没有做到大多数 Web 服务器所做的事情。我们希望根据请求来定制响应，并且只对格式正确的 _/_ 请求返回 HTML 文件。

### 验证请求并选择性响应

现在，我们的 Web 服务器无论客户端请求什么都会返回文件中的 HTML。让我们添加功能来检查浏览器是否在请求 _/_，如果是则返回 HTML 文件，如果请求其他内容则返回错误。为此我们需要修改 `handle_connection`，如示例 21-6 所示。这段新代码将收到的请求内容与我们已知的 _/_ 请求格式进行比较，并添加 `if` 和 `else` 块来区别处理不同的请求。

<Listing number="21-6" file-name="src/main.rs" caption="对 */* 的请求和其他请求进行不同处理">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-06/src/main.rs:here}}
```

</Listing>

我们只查看 HTTP 请求的第一行，因此不再将整个请求读入 vector，而是调用 `next` 来获取迭代器的第一个元素。第一个 `unwrap` 处理 `Option`，如果迭代器没有元素则停止程序。第二个 `unwrap` 处理 `Result`，效果与示例 21-2 中 `map` 里的 `unwrap` 相同。

接下来，我们检查 `request_line` 是否等于对 _/_ 路径的 GET 请求行。如果是，`if` 块返回我们 HTML 文件的内容。

如果 `request_line` *不*等于对 _/_ 路径的 GET 请求，说明我们收到了其他请求。我们稍后会在 `else` 块中添加代码来响应所有其他请求。

现在运行这段代码并请求 _127.0.0.1:7878_；你应该能看到 _hello.html_ 中的 HTML。如果发起任何其他请求，例如 _127.0.0.1:7878/something-else_，你会看到类似运行示例 21-1 和示例 21-2 中代码时的连接错误。

现在让我们将示例 21-7 中的代码添加到 `else` 块中，返回一个状态码为 404 的响应，表示请求的内容未找到。我们还会返回一些 HTML 来在浏览器中渲染一个页面，向最终用户展示该响应。

<Listing number="21-7" file-name="src/main.rs" caption="当请求的不是 */* 时，返回状态码 404 和错误页面">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-07/src/main.rs:here}}
```

</Listing>

这里，我们的响应状态行的状态码为 404，原因短语为 `NOT FOUND`。响应体将是 _404.html_ 文件中的 HTML。你需要在 _hello.html_ 旁边创建一个 _404.html_ 文件作为错误页面；同样，你可以使用任何你想要的 HTML，或者使用示例 21-8 中的示例 HTML。

<Listing number="21-8" file-name="404.html" caption="任何 404 响应所返回页面的示例内容">

```html
{{#include ../listings/ch21-web-server/listing-21-07/404.html}}
```

</Listing>

有了这些更改，再次运行服务器。请求 _127.0.0.1:7878_ 应该返回 _hello.html_ 的内容，而任何其他请求，例如 _127.0.0.1:7878/foo_，应该返回 _404.html_ 中的错误 HTML。

<!-- Old headings. Do not remove or links may break. -->

<a id="a-touch-of-refactoring"></a>

### 重构

目前，`if` 和 `else` 块中有大量重复代码：它们都在读取文件并将文件内容写入流。唯一的区别是状态行和文件名。让我们将这些差异提取到单独的 `if` 和 `else` 行中，将状态行和文件名的值赋给变量，使代码更加简洁；然后在读取文件和写入响应的代码中无条件地使用这些变量。示例 21-9 展示了替换大段 `if` 和 `else` 块后的代码。

<Listing number="21-9" file-name="src/main.rs" caption="重构 `if` 和 `else` 块，使其只包含两种情况之间不同的代码">

```rust,no_run
{{#rustdoc_include ../listings/ch21-web-server/listing-21-09/src/main.rs:here}}
```

</Listing>

现在 `if` 和 `else` 块只在元组中返回状态行和文件名的适当值；然后我们使用 `let` 语句中的模式通过解构将这两个值分别赋给 `status_line` 和 `filename`，如第 19 章所讨论的那样。

之前重复的代码现在位于 `if` 和 `else` 块之外，使用 `status_line` 和 `filename` 变量。这使得两种情况之间的差异更容易看出，也意味着如果我们想要更改文件读取和响应写入的工作方式，只需要在一个地方更新代码。示例 21-9 中代码的行为与示例 21-7 中的完全相同。

我们现在用大约 40 行 Rust 代码实现了一个简单的 Web 服务器，它对一个请求返回一个内容页面，对所有其他请求返回 404 响应。

目前，我们的服务器运行在单线程中，这意味着它一次只能处理一个请求。让我们通过模拟一些慢请求来看看这会如何成为问题。然后，我们将修复它，使服务器能够同时处理多个请求。
