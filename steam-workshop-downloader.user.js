// ==UserScript==
// @name         Steam Workshop Downloader
// @version      1.5
// @author       ArjixWasTaken
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @description  Quickly download files from the steam workshop using www.steamworkshop.download
// @match        *://*.steamcommunity.com/sharedfiles/filedetails/?id=*
// @match        *://*.steamcommunity.com/workshop/filedetails/?id=*
// @icon         http://steamworkshop.download/favicon.ico
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/progressbar.js/1.1.0/progressbar.min.js
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM.getValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==


GM_config.init(
{
  'id': 'SteamWorkshopDownloader',
  'fields':
  {
    'batchZipEnabled':
    {
      'label': 'Zip-up batch downloads.',
      'type': 'checkbox',
      'default': false
    }
  }
});


GM_registerMenuCommand('Settings', () => {
    GM_config.open()
})

// Passing these two utilities to the global scope.
unsafeWindow.JSZip = JSZip;
unsafeWindow.saveAs = FileSaver.saveAs;
unsafeWindow.ProgressBar = FileSaver.ProgressBar;

// stolen from: https://github.com/parshap/node-sanitize-filename/blob/master/index.js
var illegalRe = /[\/\?<>\\:\*\|"]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var windowsTrailingRe = /[\. ]+$/;

function sanitize(input, replacement) {
  if (typeof input !== 'string') {
    throw new Error('Input must be string');
  }
  var sanitized = input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);
  return sanitized
}

const sanitizeFilename = function (input, options) {
  var replacement = (options && options.replacement) || '';
  var output = sanitize(input, replacement);
  if (replacement === '') {
    return output;
  }
  return sanitize(output, '');
};
//


const gm_fetch = (link, options) => {
    return new Promise((resolve, reject) => {
        const data = {
            ...options,
            method: options.method || "GET",
            url: link,
            onload: (res) => resolve(res),
        };
        console.log(data);
        GM_xmlhttpRequest(data);
    });
}
unsafeWindow.gm_fetch = gm_fetch
unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest


var GLOBAL_LINK_CACHE = {}
const sleep = ms => new Promise(r => setTimeout(r, ms));


const getDownloadLinkForFile = async (fileId) => {
    const appId = document.querySelector(`a[href*="/app/"]`).href.match(/\/app\/(\d+)/)[1];
    console.log("Attempting to get the download link for", fileId)

    if (GLOBAL_LINK_CACHE[fileId] != undefined) return GLOBAL_LINK_CACHE[fileId];

    const res = await gm_fetch("http://steamworkshop.download/online/steamonline.php", {
        method: "POST",
        data: `app=${appId}&item=${fileId}`,
        headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Host: "steamworkshop.download",
                Origin: "http://steamworkshop.download",
                Referer: `http://steamworkshop.download/download/view/${fileId}`,
            },
    });
    const data = res.response;
    if (/href=['"].*?['"]/.test(data)) {
        console.log("Found download link.");
        GLOBAL_LINK_CACHE[fileId] = data.match(/href=['"](.*?)['"]/)[1];
        await GM.setValue("GLOBAL_LINKS_CACHE", GLOBAL_LINK_CACHE)
        return GLOBAL_LINK_CACHE[fileId];
    } else {
        console.log("No download link found for", fileId);
    }
}


const initiateProgressBar = () => {
    let progressBar = document.querySelector("#progress-bar-container")
    if (progressBar == null) {
        progressBar = document.createElement("div")
        progressBar.id = "progress-bar-container"
        progressBar.margin = "20px"
        progressBar.width = "400px"
        progressBar.height = "8px"
        progressBar.style.display = "none"
        let detailBox = document.querySelector(`.detailBox > .game_area_purchase_margin`)
        if (!detailBox) detailBox = Array.from(document.querySelectorAll(`.detailBox`)).pop()
        detailBox.insertBefore(progressBar, detailBox.children[0])
    }
    return progressBar
}


document.addEventListener("DOMContentLoaded", async () => {
    GLOBAL_LINK_CACHE = await GM.getValue("GLOBAL_LINKS_CACHE", {})
    const downloadButton = document.createElement("a");
    downloadButton.id = "SubscribeItemBtn";
    downloadButton.append("Download");



    const collection = document.querySelector(`.subscribeCollection`)

    const progressBarNode = initiateProgressBar()
    var bar = new ProgressBar.Line(progressBarNode, {
        strokeWidth: 2,
        easing: 'easeInOut',
        color: '#FFEA82',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: {width: '100%', height: '100%'},
        from: {color: '#FFEA82'},
        to: {color: '#ED6A5A'},
        step: (state, bar) => {
            bar.path.setAttribute('stroke', state.color);
        }
    });

    if (collection == null) {
        // Single file download
        downloadButton.className = "btn_green_white_innerfade btn_border_2px btn_medium";
        downloadButton.onclick = async () => {
            progressBarNode.style.display = ""
            const fileId = window.location.href.match(/id=(\d+)/)[1];
            const downloadLink = await getDownloadLinkForFile(fileId);
            if (downloadLink == undefined) return;
            const blob = await gm_fetch(downloadLink, { responseType: "blob", onprogress: ({ position, totalSize }) => bar.set(position / totalSize) })

            saveAs(blob.response, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${fileId}).zip`))
            progressBarNode.style.display = "none"
        };
        document.querySelector(`.game_area_purchase_game > div`).appendChild(downloadButton);
    } else {
        // Batch file download
        downloadButton.append(" All")
        downloadButton.className = "general_btn subscribe"
        collection.insertBefore(downloadButton, document.querySelector(`a.general_btn + span.general_btn.subscribe + div`))
        downloadButton.onclick = async () => {
            const batchZipEnabled = GM_config.get("batchZipEnabled")
            progressBarNode.style.display = ""

            console.log("Gathering all the download links...")
            const downloadLinks = []
            const fileNodes = Array.from(document.querySelectorAll(`.workshopItem > a[href*="id="]`))
            for (const node of fileNodes) {
                bar.set((fileNodes.indexOf(node) / fileNodes.length) * (batchZipEnabled ? 0.2 : 1))
                await sleep(100);
                const link = await getDownloadLinkForFile(node.href.match(/id=(\d+)/)[1])
                if (!link) continue;
                downloadLinks.push([node.parentNode.parentNode.querySelector(`.workshopItemTitle`).innerText.trim(), node.href.match(/id=(\d+)/)[1], link])
            }

            console.log("Done gathering all the download links!")

            if (batchZipEnabled) {
                let progressDone = 0.2

                const zip = new JSZip();
                console.log("batchZip is enabled, zipping all the files...")
                let i = 0
                for (const [title, fileId, link] of downloadLinks) {
                    i++;
                    bar.set(progressDone + (i / downloadLinks.length) * 0.3 )
                    const data = await gm_fetch(link, { responseType: "blob" })
                    zip.file(sanitizeFilename(`${title} - ${fileId}.zip`), data.response, { binary: true })
                }
                console.log(zip)
                zip.generateAsync({type:"blob"}, ({ percent }) => bar.set(0.5 + (percent/100) * 0.5 ))
                    .then(function (blob) {
                    saveAs(blob, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]}).zip`));
                    progressBarNode.style.display = "none"
                });
            } else {
                console.log("batchZip is disabled, downloading all the files individually...")
                for (const [title, fileId, link] of downloadLinks) {
                    saveAs((await gm_fetch(link, { responseType: "blob" })).response, sanitizeFilename(`${title} (${fileId}).zip`))
                    await sleep(500)
                }
                progressBarNode.style.display = "none"
            }
        }
    }
});
