# 面向对象编程特性

<!-- Old headings. Do not remove or links may break. -->

<a id="object-oriented-programming-features-of-rust"></a>

面向对象编程（Object-Oriented Programming，OOP）是一种程序建模方式。对象（object）作为编程概念最早在 20 世纪 60 年代的 Simula 编程语言中被引入。这些对象影响了 Alan Kay 的编程架构，在该架构中对象之间通过消息传递进行交互。为了描述这种架构，他在 1967 年创造了*面向对象编程*（object-oriented programming）这一术语。关于 OOP 的定义众说纷纭，按照某些定义，Rust 是面向对象的；而按照另一些定义，它又不是。在本章中，我们将探讨一些通常被认为是面向对象的特性，以及这些特性如何对应到地道的 Rust 代码中。然后我们会展示如何在 Rust 中实现一个面向对象的设计模式，并讨论这样做与利用 Rust 自身优势来实现替代方案之间的权衡取舍。
