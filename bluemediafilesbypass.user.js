// ==UserScript==
// @name         IGG Games Bypass
// @namespace    http://tampermonkey.net/
// @version      0.4
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
            if (child.tagName === "SCRIPT" && child.matches('body > *')) {
                const src = child.innerHTML;

                if (/Goroi_n_Create_Button\(['"]/.test(src)) {
                    child.innerHTML = src
                        .replace("var i = 5;", "var i = 0;")
                        .replace(/}, \d+\);/, "}, 1);")
                        .replace("document.getElementById('dem').innerHTML = i;", "")
                        .replace(/jQuery.*?;/, "");
                } else if (/var Time_Start = (.*?);/.test(src)) {
                    child.innerHTML = src.replace(/var Time_Start = (.*?);/, (m, t) => `var Time_Start = ${t}-(10*1000)`);
                } else { child.remove(); }
            }

            if (child.tagName === "FORM") { child.style.display = "none"; }

            if (child.id?.startsWith("ads-") || child.id === "anti-adblock" || child?.nodeName === "#comment") child.remove();
            else if (child?.matches?.('.item')) child.remove();
            else if (child.tagName === "SPAN" && child.innerText.includes("Thank you for your visit")) child.innerText = "Thank you for your visit, redirecting to the file host...";
            else if (child.tagName === "IMG" && child.id === "top-image") child.src = "https://media.discordapp.net/stickers/1039992459209490513.png";
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
