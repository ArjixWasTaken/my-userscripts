// ==UserScript==
// @name         odesli.co
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      0.4
// @description  Embeds odesli.co inside youtube
// @author       Arjix & KraXen72
// @license      MIT
// @include     /youtube.com/
// @include     https://tube.cadence.moe*
// @icon        https://www.google.com/s2/favicons?domain=youtube.com
// @require     https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// ==/UserScript==

const onLinkChange = (callback) => {
    let currentUrl = document.location.href
    setInterval(() => {
        if (currentUrl !== document.location.href) {
            callback()
        }
        currentUrl = document.location.href
    }, 300)
}


const embedHTML = `<iframe
  width="${getSite() === "cadence" ? "45%" : "100%"}"
  height="${getSite() === "cadence" ? 38 : 52}"
  id="odeliscoEmbed"
  src="https://embed.odesli.co/?url=https://www.youtube.com/embed/YOUTUBE_VIDEO_ID&theme=dark"
  frameborder="0"
  allowfullscreen
  sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
  allow="clipboard-read; clipboard-write"
  style="${getSite() === "cadence" ? "align-self: center; margin-left: auto; border-radius: 4px" : "margin-top: 1rem; margin-bottom: 1rem; border-radius: 12px"}">
</iframe>`

function getSite() {
  site = ""
  switch (window.location.hostname) {
    case "www.youtube.com":
      return "youtube"
    case "tube.cadence.moe":
      return "cadence"
  }
}

// this already also works on tube.cadence.moe
const getVideoId = () => {
    const regex = /v=([a-zA-Z0-9_-]+)&?/
    return document.location.href.match(regex)?.[1]
}


const waitForElem = (selector, callback) => {
    let found = false
    let elem = document.querySelector(selector)
    const interval = setInterval(() => {
        elem = document.querySelector(selector)
        if (!found &&  elem != null) {
            found = true
            callback(elem)
            clearInterval(interval)
        }
    }, 200)
}

const injectEmbed = (videoID) => {
    let qs = getSite() === "youtube" ? `#bottom-row.ytd-watch-metadata` : `.button-container .border-look[href*="invidio"]`
    waitForElem(qs, (elem) => {
        if (document.querySelector("#odeliscoEmbed") != null) {
            document.querySelector("#odeliscoEmbed").remove()
        }
        $(elem).after(embedHTML.replace("YOUTUBE_VIDEO_ID", videoID))
    })
}


const main = () => {
    let id = getVideoId()
    if (id != undefined) {
        injectEmbed(id)
    }
}

// run the main function, and then rerun when the link changes
main()
onLinkChange(main)
