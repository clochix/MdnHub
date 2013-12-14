//jshint browser: true
/*global asyncStorage: true */
/*
function $$(sel) {
  "use strict";
  return [].slice.call(document.querySelectorAll(sel));
}
*/
var queue, queued, errors,
    nbSaved = 0, nbQueued = 0,
    eSaved, eQueued,
    matchesSelector = document.documentElement.matchesSelector ||
                      document.documentElement.webkitMatchesSelector ||
                      document.documentElement.mozMatchesSelector ||
                      document.documentElement.oMatchesSelector ||
                      document.documentElement.msMatchesSelector;

/**
 * Perform XHR
 */
function getUrl(url, cb) {
  "use strict";
  //console.log("--- GETTING " + url);
  var xhr = new XMLHttpRequest();
  xhr.onload = function (e) {
    xhr.responseXML.url = url;
    cb(null, xhr.responseXML);
  };
  xhr.onerror = function (e) {
    cb("Error : " + xhr.status + " " + e + " on " + url, {url: url});
  };
  xhr.open('GET', url, true);
  xhr.responseType = "document";
  xhr.send();
}

/**
 * Extract components from URL
 */
function splitUrl(url) {
  "use strict";
  var domain = new RegExp("((http.?://[^/]+).*/)([^?]*).?(.*$)").exec(url);
  if (domain !== null) {
    return {
      domain: domain[2],
      base:   domain[1],
      last:   domain[3]
    };
  } else {
    return {
      domain: '',
      base:   '',
      last:   ''
    };
  }
}

/**
 * Extract URLs from document
 *
 * @param {String}   url   base URL
 * @param {String}   match
 * @param {Document} doc
 *
 * @return {Array}
 */
function extractUrl(url, match, doc) {
  "use strict";
  var full = splitUrl(url),
      urls = [];
  Array.prototype.forEach.call(doc.querySelectorAll("a[href*='" + match + "']"), function (a) {
    var href;
    if (!a.classList.contains('new') && !(/has not yet been/.test(a.title))) {
      href = a.getAttribute("href");
      if (href.substr(0, 4) !== 'http') {
        if (href.substr(0, 1) === '/') {
          href = full.domain + href;
        } else {
          href = full.base + href;
        }
      }
      urls.push(href);
    }
  });
  return urls;
}

/**
 * Helper - perform action on root children matching selector
 *
 * @param {DOMNode}  root
 * @param {String}   sel
 * @param {Function} action
 */
function forSel(root, sel, action) {
  "use strict";
  Array.prototype.forEach.call(root.querySelectorAll(sel), action);
}

/**
 * Clean DOM
 *
 * @param {DOMNode}  root
 * @param {String}   url
 */
function cleanHtml(root, url) {
  "use strict";
  var full = splitUrl(url);
  forSel(root, 'script, style', function (e) {
    e.parentNode.removeChild(e);
  });
  forSel(root, '* [id]', function (e) {
    e.removeAttribute('id');
  });
  forSel(root, '* [class]', function (e) {
    e.removeAttribute('class');
  });
  forSel(root, '* [style]', function (e) {
    e.removeAttribute('style');
  });
  forSel(root, '* a[href]', function (e) {
    e.setAttribute('target', '_blank');
  });
  forSel(root, '* img[src]:not([src^=http])', function (e) {
    var src = e.getAttribute('src');
    if (src.substr(0, 1) === '/') {
      e.setAttribute('src', full.domain + src);
    } else {
      e.setAttribute('src', full.base + src);
    }
  });
  forSel(root, '* a[href]:not([href^=http])', function (e) {
    var src = e.getAttribute('href');
    if (src) {
      if (src.substr(0, 1) === '/') {
        e.setAttribute('href', full.domain + src);
      } else {
        e.setAttribute('href', full.base + src);
      }
    }
  });
}

/**
 * handle URL
 */
function addUrl(url, match, cb) {
  "use strict";
  url = url.split(/\$|\?|#/)[0];
  cb = cb || function () {};
  if (typeof errors[url] !== "undefined" || typeof queue[url] !== "undefined") {
    return;
  }
  if (url.indexOf('en-US') === -1) {
    return;
  }
  function onGot(err, res) {
    var content = {},
        url = res.url,
        root;
    delete queue[url];
    nbQueued = Object.keys(queue).length;
    eQueued.textContent = nbQueued;
    if (nbQueued === 0) {
      cb();
    }
    if (queued.length > 0) {
      getUrl(queued.shift(), onGot);
    }
    if (err !== null) {
      console.log(err);
      errors[url] = err;
    } else {
      try {
        root = res.getElementById('wiki-content');
        cleanHtml(root, url);
        content.title   = res.getElementsByTagName("h1")[0].textContent;
        content.content = root.innerHTML;
        asyncStorage.setItem(url, content, function () {
          console.log("Saved : " + url);
          eSaved.textContent = nbSaved++;
        });
      } catch (e) {
        console.log(e);
      }
      extractUrl(url, match, res).forEach(function forEach(href) {
        addUrl(href, match, cb);
      });
    }
  }
  asyncStorage.getItem(url, function (value) {
    if (value === null) {
      if (typeof queue[url] === "undefined") {
        queue[url] = {};
        nbQueued = Object.keys(queue).length;
        eQueued.textContent = nbQueued;
        if (nbQueued < 10) {
          getUrl(url, onGot);
        } else {
          queued.push(url);
        }
      }
    }
  });
}
function spider(url, match, cb) {
  "use strict";
  // Init
  queue  = {};
  queued = [];
  errors = {};
  getUrl(url, function (err, res) {
    if (err !== null) {
      console.log(err);
    } else {
      extractUrl(url, match, res).forEach(function forEach(href) {
        addUrl(href, match, cb);
      });
    }
  });
}
window.addEventListener('load', function () {
  "use strict";
  var config,
      UI = {};
  ['list', 'result', 'search', 'controls', 'scoped'].forEach(function (id) {
    UI[id] = document.getElementById(id);
  });
  eSaved  = document.getElementById('saved');
  eQueued = document.getElementById('queued');
  config = {
    css: {
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference",
      match: "CSS"
    },
    html: {
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
      match: "Web/HTML"
    },
    js: {
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
      match: "JavaScript/Reference/"
    },
    webapi: {
      url: "https://developer.mozilla.org/en-US/docs/Web/API",
      match: "Web/API"
    }
  };

  function initList() {
    asyncStorage.getAll(function (val) {
      var keys = Object.keys(val);
      if (keys.length === 0) {
        // If database is empty, display controls
        UI.controls.classList.remove('hidden');
      } else {
        UI.list.innerHTML = '';
        keys.sort(function (a, b) {return val[a].toLowerCase() < val[b].toLowerCase() ? -1 : 1; });
        keys.forEach(function (key) {
          var li = document.createElement('li');
          li.dataset.key = key;
          li.dataset.txt = val[key].toLowerCase();
          li.textContent = val[key];
          li.title       = key + ' - ' + val[key];
          UI.list.appendChild(li);
        });
        filterList();
      }
    }, function (val) { return val.title; });
  }

  function filterList() {
    var val = UI.search.value.toLowerCase();
    if (val === '') {
      UI.scoped.textContent = 'li {display: inherit;}';
    } else {
      UI.scoped.textContent = 'li {display: none;}\nli[data-txt*="' + val + '"] { display: inherit;}';
    }
  }

  function displayItem(key) {
    asyncStorage.getItem(key, function (val) {
      if (val !== null) {
        UI.result.innerHTML = val.content;
        window.scrollTo(0, 0);
      }
    });
  }
  // Event Listeners {{
  document.addEventListener('click', function (ev) {
    //jshint maxcomplexity: 12
    var target;
    if (ev.target.dataset) {
      // start spider {{
      if (ev.target.dataset.spider) {
        spider(config[ev.target.dataset.spider].url, config[ev.target.dataset.spider].match, initList);
      }
      // }}
      // display content {{
      if (ev.target.dataset.key) {
        displayItem(ev.target.dataset.key);
      }
      // }}
      // Navigate inside content {{
      if (matchesSelector.call(ev.target, "#result a")) {
        target = ev.target;
      } else if (matchesSelector.call(ev.target.parentNode, "#result a")) {
        target = ev.target.parentNode;
      }
      if (target && document.querySelector("#list li[data-key='" + target.href + "']") !== null) {
        ev.preventDefault();
        displayItem(target.href);
      }
      // }}
  UI.toggle.addEventListener('click', function (ev) {
    UI.controls.classList.toggle('hidden');
  });
  UI.clear.addEventListener('click', function (ev) {
    if (window.confirm("Do You REALLY want to ERASE THE WHOLE DATABASE ???")) {
      asyncStorage.clear(function () {
        initList();
      });
    }
  });
  UI.search.addEventListener("keyup", filterList, false);
  UI.search.addEventListener("change", filterList);
  // }}

  initList();

});
