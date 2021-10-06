// ==UserScript==
// @name         odesli.co
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Embeds odesli.co inside youtube
// @author       Arjix
// @include     /youtube.com/
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
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
 
 
const embedHTML = `
<iframe id="odeliscoEmbed"
    width="80%"
    height="52"
    src="https://odesli.co/embed/?url=https://song.link/y/YOUTUBE_VIDEO_ID&theme=dark"
    frameborder="0"
    allowfullscreen
    sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
    allow="clipboard-read; clipboard-write">
</iframe>
`
 
 
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
    waitForElem(`.ytd-video-secondary-info-renderer #upload-info`, (elem) => {
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
