(function () {
  var path = window.location.pathname;
  var currentLang = path.indexOf("/zh/") !== -1 ? "zh" : "en";
  var targetLang = currentLang === "en" ? "zh" : "en";

  // Inject fade transition CSS
  var style = document.createElement("style");
  style.textContent =
    "#mdbook-content { transition: opacity 0.25s ease; }" +
    "#mdbook-content.lang-fade { opacity: 0; }";
  document.head.appendChild(style);

  function getTargetHref() {
    var href = window.location.href.split("#")[0];
    return href.replace("/" + currentLang + "/", "/" + targetLang + "/");
  }

  function swapContent(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");

    // Swap main content
    var newMain = doc.querySelector("#mdbook-content main");
    var oldMain = document.querySelector("#mdbook-content main");
    if (newMain && oldMain) {
      oldMain.innerHTML = newMain.innerHTML;
    }

    // Update page title
    var newTitle = doc.querySelector("title");
    if (newTitle) document.title = newTitle.textContent;

    // Update menu title
    var newMenuTitle = doc.querySelector(".menu-title");
    var oldMenuTitle = document.querySelector(".menu-title");
    if (newMenuTitle && oldMenuTitle) {
      oldMenuTitle.textContent = newMenuTitle.textContent;
    }

    // Reload sidebar toc iframe
    var tocIframe = document.querySelector(".sidebar-iframe-outer");
    if (tocIframe) {
      var tocSrc = tocIframe.getAttribute("src");
      var newTocUrl = getTargetHref().replace(/[^/]*$/, "") + tocSrc;
      tocIframe.setAttribute("src", newTocUrl);
    }
  }

  function updateSwitcherState() {
    // Flip language state
    var tmp = currentLang;
    currentLang = targetLang;
    targetLang = tmp;

    // Update button
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.textContent = currentLang === "en" ? "中文" : "English";
      btn.title = currentLang === "en" ? "切换到中文" : "Switch to English";
    }
  }

  function doSwitch() {
    var targetUrl = getTargetHref();
    var hash = window.location.hash || "";
    var content = document.getElementById("mdbook-content");

    // Fade out
    content.classList.add("lang-fade");

    setTimeout(function () {
      fetch(targetUrl)
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          return res.text();
        })
        .then(function (html) {
          swapContent(html);
          history.pushState(null, "", targetUrl + hash);
          updateSwitcherState();
          content.classList.remove("lang-fade");
        })
        .catch(function () {
          // Fallback: regular navigation
          window.location.href = targetUrl + hash;
        });
    }, 250);
  }

  function createSwitcher() {
    var rightButtons = document.querySelector(".right-buttons");
    if (!rightButtons) return;

    var btn = document.createElement("a");
    btn.id = "lang-toggle";
    btn.className = "icon-button";
    btn.title = currentLang === "en" ? "切换到中文" : "Switch to English";
    btn.style.cssText =
      "cursor:pointer;font-size:14px;padding:0 8px;line-height:50px;font-weight:bold;";
    btn.textContent = currentLang === "en" ? "中文" : "English";
    btn.addEventListener("click", doSwitch);

    rightButtons.insertBefore(btn, rightButtons.firstChild);
  }

  // Handle browser back/forward after pushState
  window.addEventListener("popstate", function () {
    window.location.reload();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createSwitcher);
  } else {
    createSwitcher();
  }
})();
