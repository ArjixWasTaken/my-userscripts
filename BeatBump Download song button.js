// ==UserScript==
// @name         BeatBump
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      0.1
// @description  Adds a download button to the context menu of songs at beatbump.ml
// @author       Arjix
// @match        https://beatbump.ml/*
// @icon         https://www.google.com/s2/favicons?domain=beatbump.ml
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @grant        unsafeWindow
// @grant        GM_download
// ==/UserScript==



const downloadButtonHTML = `
<div class="dd-item download-btn" tabindex="0">
    <?xml version="1.0" encoding="iso-8859-1"?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="body_1" width="31" height="23">
    <!-- https://www.svgrepo.com/svg/152538/download --!>

        <g transform="matrix(0.4893617 0 0 0.4893617 4.000001 -0)">
	    <g>
            <path d="M22.792 34.706C 22.883999 34.799 22.994999 34.872 23.118 34.923C 23.24 34.973 23.37 35 23.5 35C 23.63 35 23.76 34.973 23.882 34.923C 24.005 34.872 24.115 34.799 24.208 34.706L24.208 34.706L36.207 22.707C 36.598 22.316 36.598 21.684 36.207 21.293001C 35.816 20.902002 35.184002 20.902 34.793 21.293001L34.793 21.293001L24.5 31.586L24.5 1C 24.5 0.44700003 24.052 0 23.5 0C 22.948 0 22.5 0.447 22.5 1L22.5 1L22.5 31.586L12.207 21.293C 11.816 20.901999 11.184 20.901999 10.792999 21.293C 10.4019985 21.684 10.401999 22.316 10.792999 22.706999L10.792999 22.706999L22.792 34.706z" stroke="currentColor" fill="currentColor" fill-rule="nonzero" />
            <path d="M1.5 43L45.5 43C 46.053 43 46.5 42.553 46.5 42C 46.5 41.447 46.053 41 45.5 41L45.5 41L1.5 41C 0.948 41 0.5 41.447 0.5 42C 0.5 42.553 0.948 43 1.5 43z" stroke="currentColor" fill="currentColor" fill-rule="nonzero" />
            <path d="M45.5 45L1.5 45C 0.948 45 0.5 45.447 0.5 46C 0.5 46.553 0.948 47 1.5 47L1.5 47L45.5 47C 46.053 47 46.5 46.553 46.5 46C 46.5 45.447 46.053 45 45.5 45z" stroke="currentColor" fill="currentColor" fill-rule="nonzero" />
	    </g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></g>
    </svg>
    <div class="dd-text">Download</div>
</div>
`
const contextMenuSelector = `.dd-menu > .dd-item:last-of-type, .dd-player > .dd-item:last-of-type`

const globalInfo = {
    isCtxMenuOpen: false
}
const onContextMenuOpen = async (callback) => {
    setInterval(() => {
        let ctxMenu = $(contextMenuSelector)
        if (ctxMenu.length != 0) {
            if (!globalInfo.isCtxMenuOpen) {
                globalInfo.isCtxMenuOpen = true
                callback(ctxMenu)
            }
        } else {
            globalInfo.isCtxMenuOpen = false
        }
    }, 200)
}


onContextMenuOpen(async (menu) => {
    menu.after(downloadButtonHTML)
    $(".download-btn").on("click", downloadCallback)
})


const downloadCallback = () => {
    try {
        GM_download(unsafeWindow.bbPlayer.src, unsafeWindow.bbPlayer.title + ".mp3")
    } catch {
    }
    // alert(`Downloading ${window.bbPlayer.title}\nThe audio file will open up in a new tab, to download, right click and press 'Save Audio As'.`)
}
