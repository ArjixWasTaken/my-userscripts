// ==UserScript==
// @name Steam Workshop Downloader
// @description Quickly download files from the steam workshop- using steamworkshopdownloader.io.
// @match       *://*.steamcommunity.com/sharedfiles/filedetails/?id=*
// @match       *://*.steamcommunity.com/workshop/filedetails/?id=*
// @run-at      document-end
// @namespace   https://github.com/ArjixWasTaken
// @grant       GM_xmlhttpRequest
// @grant       GM_download
// @license     MIT
// @version     1.2
// @icon        http://steamworkshop.download/favicon.ico
// ==/UserScript==
 
 
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
 
 
var cached_download_url;
 
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
};
 
document.addEventListener("DOMContentLoaded", async () => {
    const downloadButton = document.createElement("a");
    downloadButton.id = "SubscribeItemBtn";
 
    downloadButton.append("Download");
    downloadButton.className = "btn_green_white_innerfade btn_border_2px btn_medium";
 
    document.querySelector(`.game_area_purchase_game > div`).appendChild(downloadButton);
 
    downloadButton.onclick = async () => {
        const appId = document.querySelector(`a[href*="/app/"]`).href.match(/\/app\/(\d+)/)[1];
        const fileId = window.location.href.match(/id=(\d+)/)[1];
        const title = document.querySelector(`.workshopItemTitle`).innerText.trim()
 
        console.log(appId, fileId);
        if (cached_download_url != undefined) {
            GM_download({ url: cached_download_url, name: sanitizeFilename(`${title} - ${fileId}.zip`) })
            return;
        }
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
        console.log(res);
 
        const data = res.response;
        if (/href='.*?'/.test(data)) {
            console.log("Found download link");
            cached_download_url = data.match(/href='(.*?)'/)[1];
            GM_download({ url: cached_download_url, name: sanitizeFilename(`${title} - ${fileId}.zip`) })
        } else {
            alert("No download link found");
            console.log(data);
        }
    };
});
