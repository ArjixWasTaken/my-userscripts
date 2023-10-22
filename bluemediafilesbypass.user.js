// ==UserScript==
// @name         IGG Games Bypass
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       Arjix
// @match        *://bluemediafile.site/url-generator*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bluemediafile.site
// @grant        none
// @run-at       document-start
// ==/UserScript==

let count = 0;
new MutationObserver(async (mutations, observer) => {
    for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        for (const child of mutation.addedNodes) {

            if (count === 2) {
                observer.disconnect();
                break;
            }

            if (child.tagName === "SCRIPT") {
                const src = child.innerHTML;

                if (/Goroi_n_Create_Button\(['"]/.test(src)) {
                    child.innerHTML = src
                        .replace("var i = 5;", "var i = 0;")
                        .replace(/}, \d+\);/, "}, 1);")
                        .replace(/jQuery.*?;/, "");

                    count++;
                }

                if (/var Time_Start = (.*?);/.test(src)) {
                    child.innerHTML = src.replace(/var Time_Start = (.*?);/, (m, t) => `var Time_Start = ${t}-(10*1000)`);
                    count++;
                }
            }
        }
    }
}).observe(document, { subtree: true, childList: true });
