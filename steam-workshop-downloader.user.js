// ==UserScript==
// @name         Steam Workshop Downloader
// @version      1.4
// @author       ArjixWasTaken
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @description  Quickly download files from the steam workshop using www.steamworkshop.download
// @match        *://*.steamcommunity.com/sharedfiles/filedetails/?id=*
// @match        *://*.steamcommunity.com/workshop/filedetails/?id=*
// @icon         http://steamworkshop.download/favicon.ico
// @run-at       document-end
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
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
      'default': 'false'
    }
  }
});


GM_registerMenuCommand('Settings', () => {
    GM_config.open()
})

unsafeWindow.JSZip = JSZip;
unsafeWindow.saveAs = FileSaver.saveAs;

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

document.addEventListener("DOMContentLoaded", async () => {
    GLOBAL_LINK_CACHE = await GM.getValue("GLOBAL_LINKS_CACHE", {})
    const downloadButton = document.createElement("a");
    downloadButton.id = "SubscribeItemBtn";
    downloadButton.append("Download");



    const collection = document.querySelector(`.subscribeCollection`)
    if (collection == null) {
        // Single file download
        downloadButton.className = "btn_green_white_innerfade btn_border_2px btn_medium";
        downloadButton.onclick = async () => {
            const fileId = window.location.href.match(/id=(\d+)/)[1];
            const downloadLink = await getDownloadLinkForFile(fileId);
            if (downloadLink == undefined) return;
            const blob = await gm_fetch(downloadLink, { responseType: "blob" })

            saveAs(blob.response, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${fileId}).zip`))
        };
        document.querySelector(`.game_area_purchase_game > div`).appendChild(downloadButton);
    } else {
        // Batch file download
        downloadButton.className = "general_btn subscribe"
        collection.insertBefore(downloadButton, document.querySelector(`a.general_btn + span.general_btn.subscribe + div`))
        downloadButton.onclick = async () => {
            const zip = new JSZip();

            console.log("Gathering all the download links...")
            const downloadLinks = []
            for (const node of document.querySelectorAll(`.workshopItem > a[href*="id="]`)) {
                await sleep(50);
                const link = await getDownloadLinkForFile(node.href.match(/id=(\d+)/)[1])
                if (!link) continue;
                downloadLinks.push([node.parentNode.parentNode.querySelector(`.workshopItemTitle`).innerText.trim(), node.href.match(/id=(\d+)/)[1], link])
            }

            console.log("Done gathering all the download links!")

            if (GM_config.get("batchZipEnabled")) {
                 console.log("batchZip is enabled, zipping all the files...")
                for (const [title, fileId, link] of downloadLinks) {
                    const data = await gm_fetch(link, { responseType: "blob" })
                    zip.file(sanitizeFilename(`${title} - ${fileId}.zip`), data.response, { binary: true })
                }
                console.log(zip)
                zip.generateAsync({type:"blob"})
                    .then(function (blob) {
                    saveAs(blob, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]}).zip`));
                });
            } else {
                console.log("batchZip is disabled, downloading all the files individually...")
                for (const [title, fileId, link] of downloadLinks) {
                    saveAs((await gm_fetch(link, { responseType: "blob" })).response, sanitizeFilename(`${title} (${fileId}).zip`))
                    await sleep(500)
                }
            }
        }
    }
});
