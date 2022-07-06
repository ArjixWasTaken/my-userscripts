// ==UserScript==
// @name         HentaiCosplays Batch Downloader
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      1.0
// @description  Downloads an archive of all the images contained in a single post of hentai-cosplays.com
// @author       ArjixWasTaken
// @match        https://hentai-cosplays.com/image/*/page/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hentai-cosplays.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/progressbar.js/1.1.0/progressbar.min.js
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @license      MIT
// ==/UserScript==


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


const parser = new DOMParser();
const htmlToDoc = (text) => parser.parseFromString(text, "text/html")

const queue = (callback) => {
    setTimeout(() => {
        if (document.readyState === "complete") {
            callback();
        } else {
            queue(callback);
        }
    }, 200);
};


const gm_fetch = (link, options) => {
    return new Promise((resolve, reject) => {
        const data = {
            ...options,
            method: options?.method || "GET",
            url: link,
            onload: (res) => resolve(res),
        };
        console.log(data);
        GM_xmlhttpRequest(data);
    });
};
unsafeWindow.gm_fetch = gm_fetch;


const GetAllImageLinks = async (bar) => {
    const pages = Array.from(new Set(Array.from(document.querySelector("#paginator").querySelectorAll("a[href]")).map(a => a.href)));
    const imageLinks = Array.from(document.querySelectorAll(`#display_image_detail > .icon-overlay > a > img`)).map(img => img.src);

    for (const page of pages) {
        await bar.animate((pages.indexOf(page)/pages.length)*0.4)
        const res = await (await fetch(page)).text()
        const doc = htmlToDoc(res)
        imageLinks.push(...Array.from(doc.querySelectorAll(`#display_image_detail > .icon-overlay > a > img`)).map(img => img.src))
    }

    return imageLinks.map(link => {
        const split = link.split("/")
        return split.filter((a, b) => b != split.length-2).join("/")
    })
}

const DownloadAllImages = async (links, bar) => {
    const images = []

    for (const link of links) {
        await bar.animate(0.4 + ((links.indexOf(link)/links.length)*0.3))
        const fileName = new URL(link).pathname.split("/").pop()
        images.push({ name: fileName, data: (await gm_fetch(link, { responseType: "blob" })).response })
    }

    return images
}

const initiateProgressBar = () => {
    let progressBar = document.querySelector("#progress-bar-container");
    if (progressBar == null) {
        progressBar = document.createElement("div");
        progressBar.id = "progress-bar-container";
        progressBar.margin = "20px";
        progressBar.width = "400px";
        progressBar.height = "8px";
        let detailBox = document.querySelector(`#left_sidebar > .left_sideber_body`);
        detailBox.appendChild(progressBar);
    }
    return progressBar;
};

const getStatusLabel = () => {
    let statusLabel = document.querySelector("#progress-status-label");
    if (statusLabel == null) {
        statusLabel = document.createElement("div");
        statusLabel.id = "progress-status-label";
        let detailBox = document.querySelector(`#left_sidebar > .left_sideber_body`);
        detailBox.appendChild(statusLabel)
    }
    return statusLabel;
};

const updateStatusLabel = (status, visibility) => {
    const statusLabel = getStatusLabel();
    statusLabel.style.display = visibility ? "" : "none";
    statusLabel.innerText = "Status: " + status;
};

queue(async () => {
const sidebar = document.querySelector("#left_sidebar")
const div = document.createElement("div")
div.className = "left_sideber_body"

sidebar.insertBefore(div, sidebar.children[0])

const downloadBtn = document.createElement("button")
downloadBtn.innerText = "Download All"
div.appendChild(downloadBtn)

downloadBtn.onclick = async () => {
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

    const images = await GetAllImageLinks(bar);
    console.log(images)
    const data = await DownloadAllImages(images, bar)

    const zip = new JSZip();
    for (const image of data) {
        zip.file(sanitizeFilename(image.name), image.data, { binary: true });
    }

    zip.generateAsync({ type: "blob" }, ({ percent }) => {
        bar.animate(0.7 + (percent / 100) * 0.3);
    }).then(function (blob) {
        saveAs(
            blob,
            sanitizeFilename(`${document.querySelector("#title").innerText}.zip`)
        );
    });
}
})
