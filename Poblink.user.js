// ==UserScript==
// @name        Poblink
// @version     0.3.0
// @description A script to add path of building links next to pastebin links
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

const presets = [
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

console.log = function () { };

(function initialize() {
  addPoblinkStyle("margin: 1ex; white-space: nowrap;");
  for (const preset of presets) {
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
  const selectors = {
    regex: /https:\/\/pastebin\.com\/(\w{8})/,
    query: 'a[href^="https://pastebin.com/"]'
  };
  let snapshot = document.evaluate("//text()[contains(., 'pastebin.com') and not(ancestor::a)]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0; i < snapshot.snapshotLength; i++) {
    let element = snapshot.snapshotItem(i);
    let match = element.textContent.match(selectors.regex);
    if (!match) continue;
    let pbId = match[1];
    let poblinkElement = createPoblinkElement(createPobPastebinLink(pbId))
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }
  staticSearch(selectors);
}

function pastebin() {
  const regex = /https:\/\/pastebin\.com\/(\w{8})/;
  let match = document.location.href.match(regex);
  if (!match) return;
  let pbId = match[1];
  let infoPanel = document.querySelector(".info-bottom");
  let element = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin-left: 22px">Poblink</a>`);
  infoPanel.appendChild(element);
}

function youtube() {
  const selectors = {
    regex: /pastebin\.com%2F(\w{8})/,
    query: 'a[href*="pastebin.com%2F"]'
  };
  startObserver(selectors);
}

function reddit() {
  if (!document.location.host.startsWith('old')) { // new design
    addPoblinkStyle("color: var(--newCommunityTheme-linkText);text-decoration: underline;");
  }
  genericPreset();
}

function genericPreset() {
  const selectors = {
    regex: /https:\/\/pastebin\.com\/(\w{8})/,
    query: 'a[href^="https://pastebin.com/"]'
  };
  staticSearch(selectors);
  startObserver(selectors);
}

function staticSearch(selectors) {
  for (const element of document.querySelectorAll(selectors.query)) {
    let match = element.href.match(selectors.regex);
    if (!match) continue;
    let pbId = match[1];
    let poblinkElement = createPoblinkElement(createPobPastebinLink(pbId));
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }
}

function startObserver(selectors) {
  new MutationObserver((mutationRecords, observer) => {
    for (const mutation of mutationRecords) {
      let elements = [];
      for (const addedNode of mutation.addedNodes) {
        if (!addedNode.tagName) continue;
        if (addedNode.matches(selectors.query)) {
          elements.push(addedNode);
        } else {
          for (const e of addedNode.querySelectorAll(selectors.query)) {
            elements.push(e);
          }
        }
      }
      if (mutation.target.matches(selectors.query)) {
        elements.push(mutation.target);
      }
      for (const element of elements) {
        let match = element.href.match(selectors.regex);
        if (!match) continue;
        let pbId = match[1];
        let pbUri = createPobPastebinLink(pbId);
        if (element.nextSibling && element.nextSibling.matches('.poblink')) {
          if (element.nextSibling.href !== pbUri) {
            element.nextSibling.href = pbUri;
          }
        }
        else {
          let poblinkElement = createPoblinkElement(pbUri);
          element.parentElement.insertBefore(poblinkElement, element.nextSibling);
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

function createPobPastebinLink(id) {
  return `pob:pastebin/${id}`;
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