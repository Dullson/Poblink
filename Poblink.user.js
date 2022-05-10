// ==UserScript==
// @name        Poblink
// @version     0.4.1
// @description A script to add path of building links next to build share links
// @license     MIT
// @author      Dullson
// @namespace   https://github.com/Dullson
// @include     https://*
// @grant       none
// @run-at      document-idle
// @updateURL   https://github.com/Dullson/Poblink/raw/master/Poblink.user.js
// @downloadURL https://github.com/Dullson/Poblink/raw/master/Poblink.user.js
// @supportURL  https://github.com/Dullson/Poblink/issues
// ==/UserScript==

const sitePresets = [
  {
    name: 'PoeForum',
    regex: /^https:\/\/www\.pathofexile\.com\/forum\/view-thread\//,
    run: poeForum,
  },
  {
    name: 'Youtube',
    regex: /^https:\/\/www\.youtube\.com\//,
    run: youtube,
  },
  {
    name: 'GoogleDocs',
    regex: /^https:\/\/docs\.google\.com\//,
    run: googleDocs,
  },
  {
    name: 'Reddit',
    regex: /^https:\/\/\w{3}\.reddit\.com\//,
    run: reddit,
  },
  {
    name: 'Pastebin',
    regex: /^https:\/\/pastebin\.com\/\w{8}/,
    run: pastebin,
  },
];

const linkSelectors = [
  {
    id: 'Pastebin',
    url: 'pastebin.com',
    regex: /pastebin\.com\/(\w{8})/,
    query: 'a[href^="https://pastebin.com/"]',
    tryParse: function (str) {
      let match = str.match(this.regex);
      if (match) return `pob:${this.id.toLowerCase()}/${match[1]}`;
    },
  },
  {
    id: 'PoBBin',
    url: 'pobb.in',
    regex: /pobb\.in\/([\w-]{12})/,
    query: 'a[href^="https://pobb.in/"]',
    tryParse: function (str) {
      let match = str.match(this.regex);
      if (match) return `pob:${this.id.toLowerCase()}/${match[1]}`;
    },
  },
  {
    id: 'PoeNinja',
    url: 'poe.ninja',
    regex: /poe\.ninja\/pob\/(\w+)/,
    query: 'a[href^="https://poe.ninja/pob/"]',
    tryParse: function (str) {
      let match = str.match(this.regex);
      if (match) return `pob:${this.id.toLowerCase()}/${match[1]}`;
    },
  },
];


(function initialize() {
  addPoblinkStyle("margin: 1ex; white-space: nowrap;");
  for (const preset of sitePresets) {
    if (document.location.href.match(preset.regex)) {
      console.log(`Poblink: Running ${preset.name} preset.`);
      preset.run();
      return;
    }
  }
  console.log("Poblink: Running Generic preset.");
  genericPreset();
})();

function poeForum() {
  for (const selector of linkSelectors) {
    let snapshot = document.evaluate(
      `//text()[contains(., '${selector.url}') and not(ancestor::a)]`
      , document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < snapshot.snapshotLength; i++) {
      let element = snapshot.snapshotItem(i);
      let pobUrl = selector.tryParse(element.textContent);
      if (!pobUrl) continue;
      let poblinkElement = createPoblinkElement(pobUrl);
      element.parentElement.insertBefore(poblinkElement, element.nextSibling);
    }

  }
  staticSearch(linkSelectors);
}

function pastebin() {
  const selector = linkSelectors.find(s => s.id == "Pastebin");
  let pobUrl = selector.tryParse(document.location.href);
  if (!pobUrl) return;
  let poblinkElement = createPoblinkElement(pobUrl);
  addPoblinkStyle("margin: 0 0 0 20px");
  let infoPanel = document.querySelector(".info-bottom");
  infoPanel.appendChild(poblinkElement);
}

function youtube() {
  const selectors = linkSelectors.map((s) => Object.assign({}, s, {
    regex: new RegExp(s.regex.source.replaceAll('\\/', '%2F'), s.regex.flags),
    query: s.query.replace('^="https://', '*="').replaceAll('/', '%2F'),
  }));
  startObserver(selectors);
}

function googleDocs() {
  const selectors = linkSelectors.map((s) => Object.assign({}, s, {
    query: s.query.replace('^="https://', '*="')
  }));
  staticSearch(selectors);
  startObserver(selectors);
}

function reddit() {
  if (!document.location.host.startsWith('old')) { // new design
    addPoblinkStyle(`
    color: var(--newCommunityTheme-linkText);
    text-decoration: underline;
    `);
  }
  genericPreset();
}

function genericPreset() {
  staticSearch(linkSelectors);
  startObserver(linkSelectors);
}

function staticSearch(selectors) {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector.query)) {
      let pobUrl = selector.tryParse(element.href);
      if (!pobUrl) continue;
      console.log(`Poblink: generating link for ${element.href}`);
      let poblinkElement = createPoblinkElement(pobUrl);
      element.parentElement.insertBefore(poblinkElement, element.nextSibling);
    }
  }
}

function startObserver(selectors) {
  new MutationObserver((mutationRecords, observer) => {
    for (const mutation of mutationRecords) {
      for (const selector of selectors) {
        let elements = [];
        for (const addedNode of mutation.addedNodes) {
          if (!addedNode.tagName) continue;
          if (addedNode.matches(selector.query)) {
            elements.push(addedNode);
          } else {
            for (const e of addedNode.querySelectorAll(selector.query)) {
              elements.push(e);
            }
          }
        }
        if (mutation.target.matches(selector.query)) {
          elements.push(mutation.target);
        }
        for (const element of elements) {
          let pobUrl = selector.tryParse(element.href);
          if (!pobUrl) continue;
          const nextNode = element.nextSibling;
          if (nextNode && nextNode.matches && nextNode.matches('.poblink')) {
            if (nextNode.href !== pobUrl) {
              nextNode.href = pobUrl;
            }
          }
          else {
            console.log(`Poblink: generating link for ${element.href}`);
            let poblinkElement = createPoblinkElement(pobUrl);
            element.parentElement.insertBefore(poblinkElement, nextNode);
          }
        }
      }
      for (const removedNode of mutation.removedNodes) {
        if (!removedNode.tagName) continue;
        if (removedNode.matches('.poblink')) {
          mutation.target.insertBefore(removedNode, mutation.nextSibling);
        }
      }
    }
  })
    .observe(document.documentElement, {
      childList: true,
      subtree: true
    });
}

function createElement(str) {
  let temp = document.createElement('template');
  temp.innerHTML = str.trim();
  return temp.content.firstChild;
}

function createPoblinkElement(url) {
  return createElement(`<a href="${url}" class="poblink">Poblink</a>`);
}

function addPoblinkStyle(style) {
  const styleNode = document.createElement('style');
  styleNode.innerHTML = `.poblink {${style}}`
  document.head.appendChild(styleNode);
}

function elementReady(selector) {
  return new Promise((resolve, reject) => {
    let el = document.querySelector(selector);
    if (el) { resolve(el); }
    new MutationObserver((mutationRecords, observer) => {
      Array.from(document.querySelectorAll(selector)).forEach((element) => {
        resolve(element);
        observer.disconnect();
      });
    })
      .observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
  });
}