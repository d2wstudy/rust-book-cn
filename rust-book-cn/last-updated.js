(function () {
  function getPageKey() {
    var path = window.location.pathname;
    var seg = path.split("/").pop() || "index.html";
    if (seg === "" || seg.endsWith("/")) seg = "index.html";
    return seg.replace(/\.html$/, ".md");
  }

  function isChinesePage() {
    var path = window.location.pathname;
    if (path.indexOf("/zh/") !== -1) return true;
    if (path.indexOf("/en/") !== -1) return false;
    return true; // standalone mdbook serve, assume Chinese
  }

  function inject() {
    if (!isChinesePage()) {
      remove();
      return;
    }
    var data = window.LAST_UPDATED_DATA;
    var key = getPageKey();
    if (!data || !data[key]) {
      remove();
      return;
    }
    var main = document.querySelector("main");
    if (!main) return;

    var el = main.querySelector(".last-updated");
    if (!el) {
      el = document.createElement("div");
      el.className = "last-updated";
      main.appendChild(el);
    }
    el.textContent = "\u672C\u9875\u6700\u540E\u66F4\u65B0\uFF1A" + data[key];
    el.style.cssText =
      "margin-top:2em;padding-top:0.8em;" +
      "border-top:1px solid var(--table-border-color,#ddd);" +
      "font-size:0.85em;color:var(--sidebar-non-existant,#aaa);" +
      "text-align:right;";
  }

  function remove() {
    var el = document.querySelector("main .last-updated");
    if (el) el.remove();
  }

  // Initial load
  inject();

  // Re-inject after lang-switch AJAX navigation
  var main = document.querySelector("main");
  if (main) {
    new MutationObserver(function () {
      setTimeout(inject, 50);
    }).observe(main, { childList: true });
  }
})();
