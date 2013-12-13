# MdnHub

Get the content of some sections of the awesome documentation available on [Mozilla Developer Network](https://developer.mozilla.org/) and save it in local storage for offline use.

/!\ The application need to scrap content from the MDN website, which can use a lot of bandwidth, and harm your browser. Scraping of JavaScript documentation is very slow, so it’s probably buggy.

You can manually add content into the local database by calling the spider from a JavaScript console:

    spider("https://developer.mozilla.org/en-US/docs/IndexedDB", "IndexedDB");

This will get all link containing IndexedDB from the main IDB page.


## Licences

MDNHub is available under the AGPL License. It also use a forked version of the [asyncStorage](https://github.com/mozilla/localforage) library available under an Apache license.
