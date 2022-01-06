// ==UserScript==
// @name         VueMastery Lesson Description Copier
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      0.5
// @description  Adds a button to copy the lesson description in markdown. (Yes, it converts the html description to markdown)
// @author       Arjix
// @match        https://www.vuemastery.com/courses/*
// @icon         https://www.google.com/s2/favicons?domain=vuemastery.com
// @grant        none
// @require      https://unpkg.com/turndown/dist/turndown.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.13.13/beautify.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.13.13/beautify-css.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.13.13/beautify-html.min.js
// ==/UserScript==
 
const onUriChange = (callback, onHashChange = false) => {
    var currentPage = "";
 
    setInterval(() => {
        if (currentPage != location.href) {
            if (onHashChange) {
                if (currentPage.split("#")[0] != location.href.split("#")[0]) {
                    currentPage = location.href;
                    callback();
                }
            } else {
                currentPage = location.href;
                callback();
            }
        }
    }, 600);
};
 
const createElement = (element, extra) => {
    const x = document.createElement(element);
 
    Object.entries(extra).forEach(([key, value]) => {
        x.setAttribute(key, value);
    });
    return x;
};
 
const waitForEl = (selector, callback) => {
    // https://gist.github.com/chrisjhoughton/7890303
    if (document.querySelector(selector)) {
        callback();
    } else {
        setTimeout(function () {
            waitForEl(selector, callback);
        }, 100);
    }
};
 
const waitForElemToDisappear = (selector, callback) => {
    if (!document.querySelector(selector)) {
        callback();
    } else {
        setTimeout(function () {
            waitForElemToDisappear(selector, callback);
        }, 100);
    }
};
 
const copyToClipboard = (text) => {
    // https://stackoverflow.com/a/46215202/13077523
    const elem = document.createElement("textarea");
    elem.value = text;
    document.body.appendChild(elem);
    elem.select();
    document.execCommand("copy");
    document.body.removeChild(elem);
};
 
const formatCodeBlocks = (text) => {
    var formattedString = "";
    const regex = "```(html|css|js)\n((?:\n|.)*?)```";
 
    const matches = [...text.matchAll(regex)];
    if (matches.length == 0) {
        return text;
    }
    var lastIndex = null;
 
    matches.forEach((match, index) => {
        if (lastIndex != null) {
            formattedString += text.slice(lastIndex, match.index - 1);
            lastIndex = match.index + match[0].length;
        } else {
            lastIndex = match.index + match[0].length;
            formattedString += text.slice(0, match.index - 1);
        }
        switch (match[1]) {
            case "html":
                // alert(match[2]);
                formattedString +=
                    "\n```html\n" + html_beautify(match[2]) + "\n```";
                break;
            case "css":
                // alert(match[2]);
                formattedString +=
                    "\n```css\n" + css_beautify(match[2]) + "\n```";
                break;
            case "js":
                // alert(match[2]);
                formattedString +=
                    "\n```js\n" + js_beautify(match[2]) + "\n```";
                break;
        }
        if (index == matches.length - 1) {
            formattedString += text.slice(lastIndex, text.length - 1);
        }
    });
    return formattedString;
};
 
const f = () => {
    const lessonText = document.querySelector("#lessonContent").innerHTML;
    const turndownService = new TurndownService({ codeBlockStyle: "fenced" });
    const markdown = formatCodeBlocks(turndownService.turndown(lessonText));
    copyToClipboard(markdown);
    alert("copied to clipboard");
};
 
const main = () => {
    waitForElemToDisappear("#dmpDesc", () => {
        const btn = createElement("a", {
            download: "",
            id: "dmpDesc",
            class: "button secondary -full",
            "data-v-33c1ff86": "",
            "data-v-1f426ff6": "",
        });
 
        const svg = createElement("svg", {
            name: "download-cloud",
            type: "feather",
            width: "24",
            height: "24",
            class: "icon",
            "data-v-7a19a3d2": "",
            "data-v-1f426ff6": "",
        });
 
        const use = createElement("use", {
            "xlink:href": "/images/spr-feather.svg#download-cloud",
            "data-v-7a19a3d2": "",
        });
 
        svg.appendChild(use);
        btn.appendChild(svg);
        btn.innerHTML += "Copy lesson MarkDown";
 
        const panel = document.querySelector(
            "#__layout > div > div > div > div.page > div > aside > div > div:nth-child(1) > div.card-body"
        );
        panel.insertBefore(btn, panel.firstElementChild.nextSibling);
        document.getElementById("dmpDesc").onclick = f;
    });
};
 
(function () {
    "use strict";
 
    onUriChange(() => {
        waitForEl("div.card-body", main);
    });
})();
