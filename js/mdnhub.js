//jshint browser: true
/*global asyncStorage: true */
function $$(sel) {
  "use strict";
  return [].slice.call(document.querySelectorAll(sel));
}
var queue, queued, errors,
    nbSaved = 0, nbQueued = 0, nbCurrent,
    eSaved, eQueued, eCurrent,
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
  // Don't remove id and class, to allow some styling of content
  //forSel(root, '* [id]', function (e) {
  //  e.removeAttribute('id');
  //});
  //forSel(root, '* [class]', function (e) {
  //  e.removeAttribute('class');
  //});
  forSel(root, '* [style]', function (e) {
    e.removeAttribute('style');
  });
  // By default, open links in new tab
  forSel(root, '* a[href]', function (e) {
    e.setAttribute('target', '_blank');
  });
  // convert relative path in images sourec and links into absolute path
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
          //console.log("Saved : " + url);
          eSaved.textContent   = nbSaved++;
          eCurrent.textContent = nbCurrent++;
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

/**
 * Exports full database as a JSON file
 * @params {String} limit if set, limit export to urls containing this string
 */
function exportDatabase(limit) {
  "use strict";
  var filter;
  if (limit) {
    filter = function (val, key) { return key.indexOf(limit) !== -1 ? val : false; };
  }
  asyncStorage.getAll(function (val) {
    var blob, a;
    blob = new Blob([JSON.stringify(val)], {type: "application/json"});
    a = document.createElement('a');
    a.download    = "backup.json";
    a.href        = window.URL.createObjectURL(blob);
    a.textContent = "Download backup.json";
    a.dispatchEvent(new window.MouseEvent('click', { 'view': window, 'bubbles': true, 'cancelable': true }));
  }, filter);
}

/**
 * Import database from local file
 * @TODO handle exceptions
 */
function importFile(ev) {
  "use strict";
  var reader = new FileReader(),
      nb = 0, i, numFiles;
  reader.onload = function (e) {
    var imported = JSON.parse(e.target.result),
        toSave = Object.keys(imported).length;
    eSaved.textContent = nb;
    Object.keys(imported).forEach(function (key) {
      asyncStorage.setItem(key, imported[key], function () {
        eSaved.textContent = ++nb;
        eCurrent.textContent = ++nbCurrent;
        if (nb === toSave) {
          window.alert("Done");
        }
      });
    });
  };
  for (i = 0, numFiles = ev.target.files.length; i < numFiles; i++) {
    reader.readAsText(ev.target.files[i]);
  }
}

window.addEventListener('load', function () {
  "use strict";
  var config,
      UI = {};
  ['list', 'result', 'resultContent', 'resultHead', 'search', 'controls', 'scoped', 'mdnsearch'].forEach(function (id) {
    UI[id] = document.getElementById(id);
  });
  eSaved   = document.getElementById('saved');
  eQueued  = document.getElementById('queued');
  eCurrent = document.getElementById('current');
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
    document.body.classList.add('loading');
    asyncStorage.getAll(function (val) {
      var keys = Object.keys(val);
      nbCurrent = keys.length;
      eCurrent.textContent = nbCurrent;
      UI.list.innerHTML = '';
      if (keys.length === 0) {
        // If database is empty, display controls
        UI.controls.classList.remove('hidden');
        UI.list.classList.add('hidden');
      } else {
        keys.sort(function (a, b) {return val[a].toLowerCase() < val[b].toLowerCase() ? -1 : 1; });
        keys.forEach(function (key) {
          var li = document.createElement('li'),
              a  = document.createElement('a');
          li.dataset.key = key;
          li.dataset.txt = val[key].toLowerCase();
          a.dataset.key  = key;
          a.textContent  = val[key];
          a.title        = key + ' - ' + val[key];
          a.href         = '#' + key;
          li.appendChild(a);
          UI.list.appendChild(li);
        });
        filterList();
        if (location.hash) {
          displayItem(location.hash.substr(1));
        }
        UI.search.focus();
        document.body.classList.remove('loading');
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
        UI.resultHead.dataset.key = key;
        UI.resultHead.querySelector('.url').href = key;
        UI.resultHead.querySelector('.url').textContent = val.title;
        UI.resultContent.innerHTML = "<h1>" + val.title + "</h1>\n" + val.content;
        UI.resultHead.classList.remove('hidden');
        window.scrollTo(0, 0);
        $$("#list .current").forEach(function (elmt) {
          elmt.classList.remove('current');
        });
        $$("#list a[data-key='" + key + "']").forEach(function (elmt) {
          elmt.classList.add('current');
          elmt.scrollIntoView();
        });
        document.title = 'MDNHub - ' + val.title;
        if (UI.search.value === '') {
          UI.search.value = val.title;
          filterList();
        }
        location.hash = key;
      }
    });
  }
  // Event Listeners {{
  document.addEventListener('click', function (ev) {
    //jshint maxcomplexity: 20
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
      if (matchesSelector.call(ev.target, "#resultContent a")) {
        target = ev.target;
      } else if (matchesSelector.call(ev.target.parentNode, "#resultContent a")) {
        target = ev.target.parentNode;
      }
      if (target && document.querySelector("#list li[data-key='" + target.href + "']") !== null) {
        ev.preventDefault();
        displayItem(target.href);
      }
      // }}
      // Other actions
      if (ev.target.dataset.action) {
        switch (ev.target.dataset.action) {
        case "clear":
          if (window.confirm("Do You REALLY want to ERASE THE WHOLE DATABASE ???")) {
            asyncStorage.clear(function () {
              initList();
            });
          }
          break;
        case "export":
          exportDatabase();
          break;
        case "spider":
          (function () {
            var base  = document.querySelector("[name=baseURL]").value,
                match = document.querySelector("[name=matchURL]").value;
            if (match === '') {
              match = base;
            }
            spider(base, match);
          }());
          break;
        case "toggle":
          UI.controls.classList.toggle('hidden');
          UI.list.classList.toggle('hidden');
          break;
        }
      }
    }
    if (matchesSelector.call(ev.target, "#resultHead input")) {
      switch (ev.target.name) {
      case "delete":
        asyncStorage.removeItem(UI.resultHead.dataset.key, function () {
          initList();
        });
        break;
      case "update":
        asyncStorage.removeItem(UI.resultHead.dataset.key, function () {
          spider(UI.resultHead.dataset.key, UI.resultHead.dataset.key);
        });
        break;
      }
    }


  });
  document.getElementById('import').addEventListener('change', importFile, false);
  UI.search.addEventListener("focus", function () {
    UI.controls.classList.add('hidden');
    UI.list.classList.remove('hidden');
  }, false);
  UI.search.addEventListener("keyup", filterList, false);
  UI.search.addEventListener("change", filterList);
  UI.search.addEventListener("keyup", function () {
    UI.mdnsearch.href = "https://developer.mozilla.org/en-US/search?q=" + UI.search.value;
  });
  window.addEventListener('hashchange', function () {
    displayItem(location.hash.substr(1));
  });
  // }}

  initList();

});
