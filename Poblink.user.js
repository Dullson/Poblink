// ==UserScript==
// @name        Poblink
// @version     0.2.0
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

const presets = [{
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
    name: 'Twitch',
    regex: /^https:\/\/www\.twitch\.tv\//,
    run: twitch,
  },
  {
    name: 'Reddit',
    regex: /^https:\/\/www\.reddit\.com\//,
    run: reddit,
  },
  // { // code imports are not implemented yet
  //   name: 'Poe.ninja',
  //   regex: /^https:\/\/poe\.ninja\/\w+?\/builds\/char/,
  //   run: poeNinja,
  // },
  // {
  //   name: 'Pastebin',
  //   regex: /^https:\/\/pastebin\.com\/\w{8}/,
  //   run: pastebin,
  // },
];

(function initialize() {
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


function poeNinja() {
  new MutationObserver((mutationRecords, observer) => {
      for (const mutation of mutationRecords) {
        for (const addedNode of mutation.addedNodes) {
          if ((input = addedNode.querySelector('input[aria-label="Import code for Path of Building"]'))) {
            observer.disconnect();
            let code = input.value;
            let parent = input.parentElement;
            parent.style.flex = 1;
            let poblinkElement = createElement(`<div class="poblinkpair" style="display: flex"><a class="css-10qj5h4" href="pob:${code}">Poblink</a></div>`);
            parent.parentElement.insertBefore(poblinkElement, parent.nextSibling);
            document.querySelector('.poblinkpair').prepend(parent);
            return;
          }
        }
      }
    })
    .observe(document.documentElement, {
      childList: true,
      subtree: true
    });
}

function youtube() {
  const regex = /pastebin\.com%2F(\w{8})/;
  const query = 'a[href*="pastebin.com%2F"]';

  for (const element of document.querySelectorAll(query)) {
    let pbId = element.href.match(regex)[1];
    console.log(`static adding id ${pbId}`);
    let poblinkElement = createElement(`<a id="poblink" href="${createPobPastebinLink(pbId)}" class="poblink" style="margin: 1ex">Poblink</a>`);
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }
  new MutationObserver((mutationRecords, observer) => {
      for (const mutation of mutationRecords) {
        for (const addedNode of mutation.addedNodes) {
          if (!addedNode.tagName) continue
          let elements = [];
          if (addedNode.matches(query)) {
            elements.push(addedNode);
          } else {
            for (const element of addedNode.querySelectorAll(query)) {
              elements.push(element)
            }
          }
          for (const element of elements) {
            if (element.nextSibling.matches("#poblink")) continue;
            let match = element.href.match(regex);
            if (!match) continue;
            let pbId = match[1];
            console.log(`dynamic adding pbId ${pbId}`);
            let poblinkElement = createElement(`<a id="poblink" href="${createPobPastebinLink(pbId)}" class="poblink" style="margin: 1ex">Poblink</a>`);
            element.parentElement.insertBefore(poblinkElement, element.nextSibling);
          }
        }
        if (mutation.type === "childList" & mutation.target.matches(query)) {
          let element = mutation.target;
          if (element.nextSibling.matches(".poblink")) {
            let match = element.href.match(regex);
            if (!match) break;
            let pbId = match[1];
            console.log(`updating pbId ${pbId}`);
            element.nextSibling.href = createPobPastebinLink(pbId);
          }
        }
      }
    })
    .observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
}

function poeForum() {
  const regex = /https:\/\/pastebin\.com\/(\w{8})/;
  let snapshot = document.evaluate("//text()[contains(., 'pastebin.com') and not(ancestor::a)]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0; i < snapshot.snapshotLength; i++) {
    let element = snapshot.snapshotItem(i);
    let pbId = element.textContent.match(regex)[1];
    let poblinkElement = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin: 1ex">Poblink</a>`);
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }

  for (const element of document.querySelectorAll('a[href^="https://pastebin.com/"]')) {
    let pbId = element.href.match(regex)[1];
    let poblinkElement = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin: 1ex">Poblink</a>`);
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }
}

function pastebin() {
  let code = document.querySelector(".de1").textContent;
  let infoPanel = document.querySelector(".info-bottom");
  let element = createElement(`<a href="pob:${code}" style="margin-left: 22px">Poblink</a>`);
  infoPanel.appendChild(element);
}

async function twitch() {
  const regex = /https:\/\/pastebin\.com\/(\w{8})/;
  let chatContainer = await elementReady('.chat-scrollable-area__message-container');
  new MutationObserver((mutationRecords, observer) => {
      for (const mutation of mutationRecords) {
        for (const addedNode of mutation.addedNodes) {
          for (const element of addedNode.querySelectorAll('.message a[href^="https://pastebin.com/"]')) {
            console.log(element);
            let pbId = element.href.match(regex)[1];
            let poblinkElement = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin: 1ex">Poblink</a>`);
            element.parentElement.insertBefore(poblinkElement, element.nextSibling);
          }
        }
      }
    })
    .observe(chatContainer, {
      childList: true,
    });
}

function reddit() {
  const regex = /https:\/\/pastebin\.com\/(\w{8})/;
  const query = 'a[href^="https://pastebin.com/"]';

  function parseElements(elements) {
    for (const element of elements) {
      let match = element.href.match(regex);
      if (!match) continue;
      let pbId = match[1];
      let poblinkElement = createElement(`
      <a href="${createPobPastebinLink(pbId)}"
      class="poblink" 
      style="
        margin: 1ex;
        color: var(--newCommunityTheme-linkText);
        text-decoration: underline;
      ">Poblink</a>
      `);
      element.parentElement.insertBefore(poblinkElement, element.nextSibling);
    }
  }
  parseElements(document.querySelectorAll(query));

  new MutationObserver((mutationRecords, observer) => {
      for (const mutation of mutationRecords) {
        for (const addedNode of mutation.addedNodes) {
          if (!addedNode.tagName) continue;
          let elements = [];
          if (addedNode.matches(query)) {
            elements.push(addedNode);
          } else {
            for (const e of addedNode.querySelectorAll(query)) {
              elements.push(e);
            }
          }
          parseElements(elements)
        }
        // reddit is removing our links for some reason
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

function genericPreset() {
  const regex = /https:\/\/pastebin\.com\/(\w{8})/;
  for (const element of document.querySelectorAll('a[href^="https://pastebin.com/"]')) {
    let match = element.href.match(regex);
    if (!match) continue;
    let pbId = match[1];
    let poblinkElement = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin: 1ex">Poblink</a>`);
    element.parentElement.insertBefore(poblinkElement, element.nextSibling);
  }
  new MutationObserver((mutationRecords, observer) => {
      for (const mutation of mutationRecords) {
        for (const addedNode of mutation.addedNodes) {
          if (!addedNode.tagName) continue;
          let elements = [];
          if (addedNode.matches('a[href^="https://pastebin.com/"]')) {
            elements.push(addedNode);
          } else {
            for (const e of addedNode.querySelectorAll('a[href^="https://pastebin.com/"]')) {
              elements.push(e);
            }
          }
          for (const element of elements) {
            if (!element.href) console.log(element, elements);
            let match = element.href.match(regex);
            if (!match) continue;
            let pbId = match[1];
            let poblinkElement = createElement(`<a href="${createPobPastebinLink(pbId)}" style="margin: 1ex">Poblink</a>`);
            element.parentElement.insertBefore(poblinkElement, element.nextSibling);
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

function createPobPastebinLink(id) {
  return `pob:pastebin/${id}`;
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