# MdnHub

[(Version française en dessous)](#mdnhubfr).

<section lang="en">
MDNHub is a HTML application that allows to browse a local copy of the wonderful Web documentation hosted on [Mozilla Developer Network](https://developer.mozilla.org/). The application consists only in some HTML, JavaScript and CSS, so you only need a browser, no server. Just copy `mdnhub.html` somewhere on your disk and open it with a Web browser. You can also use [the page hosted by GitHub](http://clochix.github.io/MdnHub/).

It creates a local copy of sections of MDN, either by crawling the site and saving it into a local database, or by importing some hand-made archives.

### Bugs and restrictions

 - there is no full-text search (the underlying technology, IndexedDB, doesn’t support full-text search for now. I may later try to add search with a third party library). Articles can only be filtered on their title;
 - some pages from MDN are missing, this is often due to [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) headers missing on some pages;
 - there are some duplicates in the database, this reflects duplicates inside MDN (same content under different URL). Removing this duplicates shouldn’t be to hard;
 - import is slow, it needs improvements;
 - when you have a few thousand documents inside your database, the full export may run your browser out of memory. You can export a subset of the database limited to URLs containing a string by calling `exportDatabase(string)` into a JavaScript console;

### Tips

 - you can import any URL with CORS enabled. Just fill the URL in the option form, and a pattern. It will crawl the page and all linked pages whose URL matches the pattern. If no pattern is given, it should limit the capture to the page itself;
 - every documentation item has its own hash, so you should be able to navigate inside history, and bookmark pages;
 - you could try to import documentation from other sources by scraping it by hand into a well formed JSON file and importing it. Here’s the file format:
      {
        "http://www…": {
          "title": "My page",
          "content" "Some HTML content"
        }, …
      }
 - you can use a portable version of the application, with CSS and JavaScript inline. See `mdnhub.html`;

### Legals

This application is not in any way affiliated with Mozilla. The application is hacked-with-love by [Clochix](http://clochix.net). The source code is available under the AGPL License. It also uses forked version of the [asyncStorage](https://github.com/mozilla/localforage) library available under an Apache license. The contents are extracted from MDN and available under the [following licenses](https://developer.mozilla.org/en-US/docs/Project:MDN/About#Copyrights_and_licenses).

</section>


<section lang="fr" id="mdnhubfr">
[MDNHub](https://github.com/clochix/MdnHub) est une application HTML qui permet de consulter une copie locale de l’excellente documentation Web hébergée sur [Mozilla Developer Network](https://developer.mozilla.org/). C’est une application utilisant uniquement HTML, JavaScript et CSS, vous n’avez besoin pour l’utiliser que d’un navigateur, il n’y a rien à installer sur un serveur. Il suffit de copier le fichier `mdnhub.html` quelque part sur votre disque et de l’ouvrir. Vous pouvez également utiliser la version hébergée sur [GitHub](http://clochix.github.io/MdnHub/).

Elle crée une copie locale des sections de MDN, soit en aspirant le site, soit en important des archives pré-aspirées.

### Problèmes et limitations

 - pour l’instant, la recherche est limitée aux titres des pages. La technologie utilisée pour stocker les pages localement, IndexedDB, ne permet pas encore de faire de recherche dans le contenu des pages. J’essaierai éventuellement un jour d’ajouter une telle recherche si je trouve une bibliothèque le permettant avec des pré-requis raisonnables ;
 - certaines pages de MDN ne peuvent pas être capturées, car elles ne renvoient pas les entêtes [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing). D’autres sont dupliquées dans la base, lorsqu’elles existent à plusieurs URLs différentes sur le site ;
 - l’import est lent, il y aurait probablement moyen de l’améliorer ;
 - si votre base est grosse, l’export va demander beaucoup de mémoire et risque de faire planter votre navigateur. Vous pouvez limiter l’export aux URL contenant une chaine en tapant par exemple dans une console JavaScript `exportDatabase("CSS");` ;

### Trucs et astuces

 - vous pouvez importer n’importe quelle URL accessible via CORS. Il suffit de saisir l’URL dans le champs ad hoc des contrôles. Par défaut, seule cette URL devrait être importée. Si vous saisissez également un motif, l’application suivra les liens dans la page contenant ce motif ;
 - chaque page de documentation à une URL propre au sein de l’application, vous devriez donc pouvoir utiliser des signets et l’historique de navigation ;
 - vous pouvez essayer d’importer de la documentation extraite d’autres sites en l’extrayant à la main et l’enregistrant dans un fichier JSON, puis en important ce fichier. Le format de fichier est :
      {
        "http://www…": {
          "title": "My page",
          "content" "Some HTML content"
        }, …
      }
 - vous pouvez utiliser une version portable de cette application, comprise entièrement dans le fichier `mdnhub.html` ;

### Blabah administratif

Cette application n’est en rien affiliée à Mozilla. Elle est bidouillée avec amour par [Clochix](http://clochix.net), et sa recette est disponible sous la licence AGPL. Elle utilise une version modifiées de la bibliothèque [asyncStorage](https://github.com/mozilla/localforage), disponible sous la licence Apache. Les contenus extraits de MDN sont disponibles sous [ces licences](https://developer.mozilla.org/en-US/docs/Project:MDN/About#Copyrights_and_licenses).
</section>
