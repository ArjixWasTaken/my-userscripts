// ==UserScript==
// @name         IGG Games Bypass
// @namespace    http://tampermonkey.net/
// @version      0.2
// @author       Arjix
// @match        *://bluemediafile.site/url-generator*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bluemediafile.site
// @grant        none
// @run-at       document-start
// @description  Bypasses the 6 second countdown that bluemediafiles has.
// ==/UserScript==

/* global nut */

new MutationObserver(async (mutations, observer) => {
    for (const mutation of mutations) {
        for (const child of (mutation.addedNodes || [])) {
            if (child.tagName === "SCRIPT") {
                const src = child.innerHTML;

                if (/Goroi_n_Create_Button\(['"]/.test(src)) {
                    child.innerHTML = src
                        .replace("var i = 5;", "var i = 0;")
                        .replace(/}, \d+\);/, "}, 1);")
                        .replace(/jQuery.*?;/, "");
                }

                if (/var Time_Start = (.*?);/.test(src)) {
                    child.innerHTML = src.replace(/var Time_Start = (.*?);/, (m, t) => `var Time_Start = ${t}-(10*1000)`);
                }
            }
        }

        if (mutation.type === "attributes" &&
            mutation.target.tagName === "INPUT" &&
            mutation.target.id === "url" &&
            mutation.attributeName === "value" &&
            mutation.target.value)
        {
            nut.click();
        }
    }
}).observe(document, { subtree: true, childList: true, attributes: true });
