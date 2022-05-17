// ==UserScript==
// @name         Steam Workshop Downloader
// @version      1.3
// @author       ArjixWasTaken
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @description  Quickly download files from the steam workshop- using steamworkshopdownloader.io.
// @match        *://*.steamcommunity.com/sharedfiles/filedetails/?id=*
// @match        *://*.steamcommunity.com/workshop/filedetails/?id=*
// @icon         http://steamworkshop.download/favicon.ico
// @run-at       document-end
// @require      https://raw.githubusercontent.com/Stuk/jszip/c00440a28addc800f924472bf351fc710e118776/dist/jszip.min.js
// @require      https://raw.githubusercontent.com/eligrey/FileSaver.js/43bbd2f0ae6794f8d452cd360e9d33aef6071234/dist/FileSaver.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

unsafeWindow.JSZip = JSZip;
unsafeWindow.saveAs = FileSaver.saveAs;

// https://github.com/parshap/node-sanitize-filename/blob/master/index.js
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


const GLOBAL_CACHE = {}
const sleep = ms => new Promise(r => setTimeout(r, ms));


const getDownloadLinkForFile = async (fileId) => {
    const appId = document.querySelector(`a[href*="/app/"]`).href.match(/\/app\/(\d+)/)[1];
    console.log("Attempting to get the download link for", fileId)

    if (GLOBAL_CACHE[fileId] != undefined) return GLOBAL_CACHE[fileId];

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
        GLOBAL_CACHE[fileId] = data.match(/href=['"](.*?)['"]/)[1];
        return GLOBAL_CACHE[fileId];
    } else {
        console.log("No download link found for", fileId);
    }
}



document.addEventListener("DOMContentLoaded", async () => {
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

            for (const [title, fileId, link] of downloadLinks) {
                const data = await gm_fetch(link, { responseType: "blob" })
                zip.file(sanitizeFilename(`${title} - ${fileId}.zip`), data.response, { binary: true })
            }
            console.log(zip)
            zip.generateAsync({type:"blob"})
                .then(function (blob) {
                saveAs(blob, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]}).zip`));
            });
        }
    }
});
