# 一个 I/O 项目：构建命令行程序

本章是对你目前所学众多技能的一次回顾，同时也会探索标准库的更多功能。我们将构建一个与文件和命令行输入/输出交互的命令行工具，来实践你已经掌握的一些 Rust 概念。

Rust 的速度、安全性、单二进制文件输出以及跨平台支持，使其成为创建命令行工具的理想语言。因此在我们的项目中，我们将实现自己版本的经典命令行搜索工具 `grep`（**g**lobally search a **r**egular **e**xpression and **p**rint，即全局正则表达式搜索与打印）。在最简单的使用场景中，`grep` 在指定文件中搜索指定的字符串。为此，`grep` 接受一个文件路径和一个字符串作为参数，然后读取文件，找到文件中包含该字符串参数的行，并将这些行打印出来。

在此过程中，我们将展示如何让命令行工具使用许多其他命令行工具都会用到的终端功能。我们将读取环境变量的值，以允许用户配置工具的行为。我们还会将错误信息打印到标准错误输出流（`stderr`）而非标准输出（`stdout`），这样用户就可以将成功的输出重定向到文件，同时仍然能在屏幕上看到错误信息。

Rust 社区成员 Andrew Gallant 已经创建了一个功能完备、速度极快的 `grep` 版本，名为 `ripgrep`。相比之下，我们的版本会相当简单，但本章将为你提供理解像 `ripgrep` 这样的真实项目所需的背景知识。

我们的 `grep` 项目将综合运用你目前学到的多个概念：

- 代码组织（[第七章][ch7]<!-- ignore -->）
- 使用 vector 和字符串（[第八章][ch8]<!-- ignore -->）
- 错误处理（[第九章][ch9]<!-- ignore -->）
- 在适当的地方使用 trait 和生命周期（[第十章][ch10]<!-- ignore -->）
- 编写测试（[第十一章][ch11]<!-- ignore -->）

我们还会简要介绍闭包（closure）、迭代器（iterator）和 trait 对象，[第十三章][ch13]<!-- ignore -->和[第十八章][ch18]<!-- ignore -->将详细讲解这些内容。

[ch7]: ch07-00-managing-growing-projects-with-packages-crates-and-modules.html
[ch8]: ch08-00-common-collections.html
[ch9]: ch09-00-error-handling.html
[ch10]: ch10-00-generics.html
[ch11]: ch11-00-testing.html
[ch13]: ch13-00-functional-features.html
[ch18]: ch18-00-oop.html
