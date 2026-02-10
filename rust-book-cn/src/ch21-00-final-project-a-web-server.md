# 最终项目：构建多线程 Web 服务器

这是一段漫长的旅程，但我们终于到达了本书的尾声。在本章中，我们将一起构建最后一个项目，来演示最后几章中涵盖的一些概念，同时回顾一些早期的内容。

作为最终项目，我们将构建一个在浏览器中显示 "Hello!" 的 Web 服务器，效果如图 21-1 所示。

以下是我们构建 Web 服务器的计划：

1. 了解一些 TCP 和 HTTP 的基础知识。
2. 在一个套接字（socket）上监听 TCP 连接。
3. 解析少量的 HTTP 请求。
4. 创建合适的 HTTP 响应。
5. 通过线程池提升服务器的吞吐量。

<img alt="Screenshot of a web browser visiting the address 127.0.0.1:8080 displaying a webpage with the text content "Hello! Hi from Rust"" src="img/trpl21-01.png" class="center" style="width: 50%;" />

<span class="caption">图 21-1：我们最终的共享项目</span>

在开始之前，有两点需要说明。首先，我们这里使用的方法并不是用 Rust 构建 Web 服务器的最佳方式。社区成员已经在 [crates.io](https://crates.io/) 上发布了许多生产级别的 crate，它们提供了比我们将要构建的更完善的 Web 服务器和线程池实现。然而，本章的目的是帮助你学习，而不是走捷径。因为 Rust 是一门系统编程语言，我们可以选择想要使用的抽象层级，并且可以深入到比其他语言更底层的级别。

其次，我们在这里不会使用 async 和 await。构建线程池本身就是一个足够大的挑战，无需再加上构建异步运行时！不过，我们会指出 async 和 await 如何适用于本章中遇到的一些相同问题。正如我们在第 17 章中提到的，许多异步运行时底层都使用线程池来管理工作。

因此，我们将手动编写基本的 HTTP 服务器和线程池，以便你能学习到将来可能使用的那些 crate 背后的通用思想和技术。
