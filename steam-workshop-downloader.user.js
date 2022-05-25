// ==UserScript==
// @name         Steam Workshop Downloader
// @version      2.0
// @author       ArjixWasTaken
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @description  Quickly download files from the steam workshop using www.steamworkshop.download
// @match        *://*.steamcommunity.com/sharedfiles/filedetails/?id=*
// @match        *://*.steamcommunity.com/workshop/filedetails/?id=*
// @icon         http://steamworkshop.download/favicon.ico
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

unsafeWindow.GM_xmlhttpRequest = GM_xmlhttpRequest;
unsafeWindow.JSZip = JSZip;
unsafeWindow.saveAs = FileSaver.saveAs;
unsafeWindow.ProgressBar = FileSaver.ProgressBar;

// https://stackoverflow.com/a/33176845/13077523
function GM_addStyle(css) {
    const style =
        document.getElementById("GM_addStyleBy8626") ||
        (function () {
            const style = document.createElement("style");
            style.type = "text/css";
            style.id = "GM_addStyleBy8626";
            document.head.appendChild(style);
            return style;
        })();
    const sheet = style.sheet;
    sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
}
//

GM_addStyle(`
    .downloadIcon {
        top: 0px;
        left: 8px;
        width: 16px;
        background-position: 0px 0px;
        background-repeat: no-repeat;
    }`);

GM_addStyle(`
    [data-inline-download-btn]::before {
        content: "↓";
        position: absolute;
        transform: translateX(160%) translateY(15%);
        -webkit-text-stroke: 3px;
    }
    `);

// https://boxicons.com/?query=download
const downArrowIcon = `<div class="downloadIcon"></div>`;
const downloadButtonText = `<span class="downloadBtnText">Download</span>`;
const downloadButtonHTML = `${downArrowIcon}${downloadButtonText}`;

const getDownloadIcon = () => {
    const cuadrado = document.createElement("div");
    cuadrado.className = "cuadrado";
    const triangulo = document.createElement("div");
    triangulo.className = "triangulo";
    const base = document.createElement("div");
    base.className = "base";
    const i = document.createElement("i");
    i.appendChild(cuadrado);
    i.appendChild(triangulo);
    i.appendChild(base);
    return i;
};

GM_config.init({
    id: "SteamWorkshopDownloader",
    fields: {
        batchZipEnabled: {
            label: "Zip-up batch downloads.",
            type: "checkbox",
            default: false,
        },
        skipDownloads: {
            label: "Skip downloads, instead save a file with all the download links (for batch only)",
            type: "checkbox",
            default: false,
        },
    },
});

GM_registerMenuCommand("Settings", () => {
    GM_config.open();
});

// stolen from: https://github.com/parshap/node-sanitize-filename/blob/master/index.js
var illegalRe = /[\/\?<>\\:\*\|"]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var windowsTrailingRe = /[\. ]+$/;

function sanitize(input, replacement) {
    if (typeof input !== "string") {
        throw new Error("Input must be string");
    }
    var sanitized = input
        .replace(illegalRe, replacement)
        .replace(controlRe, replacement)
        .replace(reservedRe, replacement)
        .replace(windowsReservedRe, replacement)
        .replace(windowsTrailingRe, replacement);
    return sanitized;
}

const sanitizeFilename = function (input, options) {
    var replacement = (options && options.replacement) || "";
    var output = sanitize(input, replacement);
    if (replacement === "") {
        return output;
    }
    return sanitize(output, "");
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
};
unsafeWindow.gm_fetch = gm_fetch;

var GLOBAL_LINK_CACHE = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getDownloadLinkForFile = async (fileId) => {
    const appId = document.querySelector(`a[href*="/app/"]`).href.match(/\/app\/(\d+)/)[1];
    console.log("Attempting to get the download link for", fileId);

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
        await GM.setValue("GLOBAL_LINKS_CACHE", GLOBAL_LINK_CACHE);
        return GLOBAL_LINK_CACHE[fileId];
    } else {
        console.log("No download link found for", fileId);
    }
};

const initiateProgressBar = () => {
    let progressBar = document.querySelector("#progress-bar-container");
    if (progressBar == null) {
        progressBar = document.createElement("div");
        progressBar.id = "progress-bar-container";
        progressBar.margin = "20px";
        progressBar.width = "400px";
        progressBar.height = "8px";
        progressBar.style.display = "none";
        let detailBox = document.querySelector(`.detailBox > .game_area_purchase_margin`);
        if (!detailBox) detailBox = document.querySelector(`#mainContentsCollection .detailBox:not(.workshopItemDetails)`);
        detailBox.insertBefore(progressBar, detailBox.children[0]);
    }
    return progressBar;
};

const getStatusLabel = () => {
    let statusLabel = document.querySelector("#progress-status-label");
    if (statusLabel == null) {
        statusLabel = document.createElement("div");
        statusLabel.id = "progress-status-label";
        statusLabel.style.display = "none";
        let detailBox = document.querySelector(`.detailBox > .game_area_purchase_margin`);
        if (!detailBox) detailBox = document.querySelector(`#mainContentsCollection .detailBox:not(.workshopItemDetails)`);
        detailBox.insertBefore(statusLabel, detailBox.children[1]);
    }
    return statusLabel;
};

const updateStatusLabel = (status, visibility) => {
    const statusLabel = getStatusLabel();
    statusLabel.style.display = visibility ? "" : "none";
    statusLabel.innerText = "Status: " + status;
};

const animateShake = (node) => {
    return node.animate(
        [
            { transform: "translate(15px)" }, //  0%
            { transform: "translate(-15px)" }, // 20%
            { transform: "translate(10px)" }, // 40%
            { transform: "translate(-10px)" }, // 60%
            { transform: "translate(5px)" }, // 80%
            { transform: "translate(0px)" }, // 100%
        ],
        {
            duration: 500, // half a second
            iterations: 1, //  run once
            easing: "linear",
        }
    );
};

const injectDownloadButtons = async () => {
    const collectionItems = Array.from(document.querySelectorAll(".collectionItem"));
    for (const collectionItem of collectionItems) {
        const fileId = collectionItem.outerHTML.match(/href=["'].*?id=(\d+)["']/)?.[1];
        const title = collectionItem.querySelector(".workshopItemTitle").innerText.trim();
        const subscriptionControls = collectionItem.querySelector(".subscriptionControls");

        const downloadProgress = document.createElement("div");
        downloadProgress.style.width = "30px";
        downloadProgress.style.height = "30px";
        downloadProgress.style.cursor = "pointer";
        downloadProgress.style.marginTop = "100%";
        downloadProgress.dataset.inlineDownloadBtn = undefined;

        const bar = new ProgressBar.Circle(downloadProgress, {
            color: "#FFEA82",
            trailColor: "#eee",
            trailWidth: 1,
            duration: 2000,
            easing: "bounce",
            strokeWidth: 6,
            from: { color: "#FFEA82", a: 0 },
            to: { color: "#ED6A5A", a: 1 },
            step: function (state, circle) {
                circle.path.setAttribute("stroke", state.color);
            },
        });

        downloadProgress.onclick = async () => {
            await bar.animate(0.1);
            const downloadLink = await getDownloadLinkForFile(fileId);
            await bar.animate(0.2);
            await sleep(200);

            if (downloadLink == undefined) {
                bar.animate(0);
                await sleep(200);
                animateShake(downloadProgress).onfinish = () => {
                    downloadProgress.onclick = () => animateShake(downloadProgress);
                };
                // remove the onclick event, therefore disabling the "button"
                return;
            }

            const blob = await gm_fetch(downloadLink, {
                responseType: "blob",
                onprogress: ({ position, totalSize }) => bar.animate(0.2 + (position / totalSize) * 0.8),
            });
            saveAs(blob.response, sanitizeFilename(`${title} (${fileId}).zip`));
        };
        subscriptionControls.appendChild(downloadProgress);
    }
};

const queue = (callback) => {
    setTimeout(() => {
        if (document.readyState === "complete") {
            callback();
        } else {
            queue(callback);
        }
    }, 50);
};

queue(async () => {
    GLOBAL_LINK_CACHE = await GM.getValue("GLOBAL_LINKS_CACHE", {});

    injectDownloadButtons();

    const downloadButton = document.createElement("span");
    downloadButton.innerHTML = downloadButtonHTML;

    const collection = document.querySelector(`.subscribeCollection`);

    const progressBarNode = initiateProgressBar();
    var bar = new ProgressBar.Line(progressBarNode, {
        strokeWidth: 2,
        easing: "easeInOut",
        color: "#FFEA82",
        trailColor: "#eee",
        trailWidth: 1,
        svgStyle: { width: "100%", height: "100%" },
        from: { color: "#FFEA82" },
        to: { color: "#ED6A5A" },
        step: (state, bar) => {
            bar.path.setAttribute("stroke", state.color);
        },
        duration: 200,
    });

    if (collection == null) {
        // Single file download
        downloadButton.className = "btn_green_white_innerfade btn_border_2px btn_medium";
        downloadButton.onclick = async () => {
            progressBarNode.style.display = "";
            const fileId = window.location.href.match(/id=(\d+)/)[1];
            updateStatusLabel("Fetching download link...", true);
            const downloadLink = await getDownloadLinkForFile(fileId);
            if (downloadLink == undefined) {
                updateStatusLabel("Failed to find download link", true);
                return;
            }
            updateStatusLabel("Found download link", true);
            const blob = await gm_fetch(downloadLink, {
                responseType: "blob",
                onprogress: ({ position, totalSize }) => bar.animate(position / totalSize),
            });
            saveAs(blob.response, sanitizeFilename(`${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${fileId}).zip`));

            setTimeout(() => {
                progressBarNode.style.display = "none";
                updateStatusLabel("Idle", false);
            }, 1000);
        };
        document.querySelector(`.game_area_purchase_game > div`).appendChild(downloadButton);
    } else {
        // Batch file download
        downloadButton.style.alignItems = "";
        downloadButton.style.justifyContent = "";

        downloadButton.children[1].append(" All");
        downloadButton.className = "general_btn subscribe";
        collection.insertBefore(downloadButton, document.querySelector(`a.general_btn + span.general_btn.subscribe + div`));
        downloadButton.onclick = async () => {
            bar.set(0);
            const batchZipEnabled = GM_config.get("batchZipEnabled");
            const skipDownloads = GM_config.get("skipDownloads");
            progressBarNode.style.display = "";

            console.log("Gathering all the download links...");
            const downloadLinks = [];
            const fileNodes = Array.from(document.querySelectorAll(`.workshopItem > a[href*="id="]`));
            updateStatusLabel(`Gathering all the download links (0/${fileNodes.length})`, true);

            for (const node of fileNodes) {
                const i = fileNodes.indexOf(node) + 1;
                bar.set((i / fileNodes.length) * 0.3);
                updateStatusLabel(`Gathering all the download links (${i}/${fileNodes.length})`, true);
                await sleep(100);
                const link = await getDownloadLinkForFile(node.href.match(/id=(\d+)/)[1]);
                if (!link) continue;
                downloadLinks.push([
                    node.parentNode.parentNode.querySelector(`.workshopItemTitle`).innerText.trim(),
                    node.href.match(/id=(\d+)/)[1],
                    link,
                ]);
            }
            updateStatusLabel(`Found ${downloadLinks.length} download links out of the ${fileNodes.length} files.`, true);

            console.log("Done gathering all the download links!");
            await sleep(200);

            if (skipDownloads) {
                bar.animate(0.6);
                updateStatusLabel(`\`skipDownloads\` is enabled, generating the txt file...`, true);
                await sleep(100);

                let txt =
                    '# Download links for "' +
                    `${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]})\"\n`;

                for (const item of downloadLinks) {
                    bar.animate(0.6 + (downloadLinks.indexOf(item) / downloadLinks.length) * 0.4);
                    const [title, fileId, link] = item;
                    txt += `${link}\n  out=${sanitizeFilename(title + " (" + fileId + ")")}.zip\n`;
                }

                const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
                saveAs(
                    blob,
                    sanitizeFilename(
                        `${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]}).txt`
                    )
                );
                setTimeout(() => {
                    progressBarNode.style.display = "none";
                    updateStatusLabel("Idle", false);
                }, 1000);
                return;
            }

            if (batchZipEnabled) {
                let progressDone = 0.3;

                const zip = new JSZip();
                console.log("batchZip is enabled, zipping all the files...");
                let i = 0;
                for (const [title, fileId, link] of downloadLinks) {
                    i++;
                    updateStatusLabel(`Downloading file #${i}...`, true);
                    bar.set(progressDone + (i / downloadLinks.length) * 0.4);
                    const data = await gm_fetch(link, { responseType: "blob" });
                    zip.file(sanitizeFilename(`${title} - ${fileId}.zip`), data.response, { binary: true });
                }
                updateStatusLabel(`Done downloading all the files!`, true);
                await sleep(200);

                zip.generateAsync({ type: "blob" }, ({ percent }) => {
                    bar.animate(0.7 + (percent / 100) * 0.3);
                    updateStatusLabel(`Creating archive (${percent.toFixed(2)}%)`, true);
                }).then(function (blob) {
                    updateStatusLabel(`Finished creation of the archive!`, true);
                    saveAs(
                        blob,
                        sanitizeFilename(
                            `${document.querySelector(`.workshopItemTitle`).innerText.trim()} (${window.location.href.match(/id=(\d+)/)[1]}).zip`
                        )
                    );
                    setTimeout(() => {
                        progressBarNode.style.display = "none";
                        updateStatusLabel("Idle", false);
                    }, 1000);
                });
            } else {
                console.log("batchZip is disabled, downloading all the files individually...");
                let i = 0;
                for (const [title, fileId, link] of downloadLinks) {
                    i++;
                    updateStatusLabel(`Downloading file #${i}...`, true);
                    saveAs((await gm_fetch(link, { responseType: "blob" })).response, sanitizeFilename(`${title} (${fileId}).zip`));
                    bar.animate(0.3 + (i / downloadLinks.length) * 0.7);
                    await sleep(500);
                }
                setTimeout(() => {
                    progressBarNode.style.display = "none";
                    updateStatusLabel("Idle", false);
                }, 1000);
            }
        };
    }
});
