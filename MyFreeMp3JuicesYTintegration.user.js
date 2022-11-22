// ==UserScript==
// @name         myfreemp3juices integration with youtube!
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      0.1
// @author       Arjix
// @description  uhhhhhh
// @license      MIT
// @match        *://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        unsafeWindow
// ==/UserScript==


unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest;
const gm_fetch = (link, options) => {
    return new Promise((resolve, reject) => {
        const data = {
            ...options,
            method: options?.method || "GET",
            url: link,
            onload: (res) => resolve({
                ...res,
                text: async() => res.responseText,
                json: async() => JSON.parse(res.responseText)
            }),
            onerror: reject,
            fetch: true
        };

        if (!data.headers) data.headers = {}
        data.headers.UserAgent = navigator.userAgent;

        console.log("ayoo???", options.responseType)
        GM_xmlhttpRequest(data);
    });
};
unsafeWindow.gm_fetch = gm_fetch;

const getLink = () => {
    const uri = new URL(document.location.href)
    uri.searchParams.delete("index")
    return uri.toString()
}

const onLinkChange = (callback) => {
    let currentUrl = getLink()
    setInterval(() => {
        if (currentUrl !== getLink()) {
            callback()
        }
        currentUrl = getLink()
    }, 300)
}

const getVideoId = () => {
    const regex = /v=([a-zA-Z0-9_-]+)&?/
    return document.location.href.match(regex)?.[1]
}

const waitForElem = (selector, callback) => {
    const elem = document.querySelector(selector);

    if (elem) {
        callback(elem);
        return;
    }

    let observer = new MutationObserver((mutations) => {
        aa: for (const mutation of mutations) {
            if (!mutation.addedNodes) return;

            for (let element of mutation.addedNodes) {
                if (element.matches(selector)) {
                    observer.disconnect();
                    callback(element);
                    break aa
                }
            }
        }
    })

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

const waitForElemToDisappear = (selector, callback) => {
    if (!document.querySelector(selector)) {
        callback();
    } else {
        setTimeout(function () {
            waitForElemToDisappear(selector, callback);
        }, 100);
    }
};


unsafeWindow.Globals = { btn: null }


const addButtonOnYoutubePlayer = (controlsDiv) => {
    let btn = document.createElement("button");
    btn.appendChild(document.createTextNode("Download"));

    btn.classList.add("ytp-time-display");
    btn.classList.add("ytp-button");
    btn.classList.add("ytp-download-btn");
    btn.style.width = "auto";
    btn.style.display = "none" // by default it is none

    const before = Array.from(controlsDiv.children).find(child => child.innerText.trim().length == 0) || controlsDiv.firstChild
    controlsDiv.insertBefore(btn, before);

    btn.removeEventListener("click", download);
    btn.addEventListener("click", download);

    unsafeWindow.Globals.btn = btn;
};


const download = async () => {
    const title = document.querySelector(`#title[class*="ytd-watch-metadata"] h1`).innerText;
    const json = await gm_fetch("https://myfreemp3juices.cc/api/search.php", {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Referer": "https://myfreemp3juices.cc/",
        },
        data: `q=${encodeURIComponent(title)}&page=0`,
        method: "POST"
    })
      .then(r => r.text())
      .then(r => r.trim().substring(1).replace(/\);$/, ""))
      .then(r => JSON.parse(r))
      .catch(() => ({ response: null }));

    const track = (json.response || []).find(a => a.url != null);

    GM_download(track.url, `${track.artist} - ${track.title}${track.url.match(/\.\w+$/)[0]}`);
}


waitForElem(".ytp-right-controls", controlsDiv => addButtonOnYoutubePlayer(controlsDiv))
setInterval(() => {
    if (unsafeWindow.Globals.btn != null) {
        if (document.querySelector(`#upload-info [class*="ytd-channel-name"] .badge-style-type-verified-artist`) == undefined) {
            unsafeWindow.Globals.btn.style.display = "none"; // we make it invisible
        } else {
            unsafeWindow.Globals.btn.style.display = ""; // we make it visible
        }
    }
}, 300)
