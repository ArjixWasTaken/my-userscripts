// ==UserScript==
// @name         Youtube Music Enhancer
// @namespace    https://github.com/ArjixWasTaken/my-userscripts
// @version      0.0.3
// @description  Port of some of the plugins available at https://github.com/th-ch/youtube-music
// @author       Arjix
// @license      MIT
// @match        *://music.youtube.com/*
// @require      https://greasyfork.org/scripts/423851-simple-youtube-age-restriction-bypass/code/Simple%20YouTube%20Age%20Restriction%20Bypass.user.js
// @grant        unsafeWindow
// ==/UserScript==

"use strict";

const win = unsafeWindow;

const jsonLoad = (json) => {
    try {
        return JSON.parse(json);
    } catch {}
};

const Settings = {
    get() {
        return (
            jsonLoad(win.localStorage.getItem("ytmusic.enhancer.settings")) ||
            {}
        );
    },
    set(settings) {
        win.localStorage.setItem(
            "ytmusic.enhancer.settings",
            JSON.stringify(settings)
        );
    },
    update(key, value) {
        this.set(Object.assign(this.get(), { [key]: value }));
    },
};

let ignored = {
    id: ["volume-slider", "expand-volume-slider"],
    types: ["mousewheel", "keydown", "keyup"],
};

win.Element.prototype._addEventListener = Element.prototype.addEventListener;
win.Element.prototype.addEventListener = function (
    type,
    listener,
    useCapture = false
) {
    if (!(ignored.id.includes(this.id) && ignored.types.includes(type))) {
        this._addEventListener(type, listener, useCapture);
    }
};

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
                if (element?.matches && element?.matches(selector)) {
                    observer.disconnect();
                    callback(element);
                    break aa;
                }
            }
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
    });
};

const createElement = (tagName, options = {}) => {
    const ops = options || {};
    const elem = document.createElement(tagName);

    for (const key in ops) {
        if (key === "children") {
            for (const child of ops.children) elem.appendChild(child);
            delete ops.children;
        }
    }

    return Object.assign(elem, ops);
};

// https://stackoverflow.com/a/33176845/13077523
function GM_addStyle(css) {
    const style =
        document.getElementById("GM_addStyleBy8626") ||
        (function () {
            const style = createElement("style", {
                type: "text/css",
                id: "GM_addStyleBy8626",
            });
            document.head.appendChild(style);
            return style;
        })();
    const sheet = style.sheet;
    sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
}

const addNavigationButtons = () => {
    GM_addStyle(`.navigation-item {
        font-family: Roboto, Noto Naskh Arabic UI, Arial, sans-serif;
        font-size: 20px;
        line-height: var(--ytmusic-title-1_-_line-height);
        font-weight: 500;
        --yt-endpoint-color: #fff;
        --yt-endpoint-hover-color: #fff;
        --yt-endpoint-visited-color: #fff;
        display: inline-flex;
        align-items: center;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        margin: 0 var(--ytmusic-pivot-bar-tab-margin);
    }`);

    GM_addStyle(`.navigation-item:hover {
        color: #fff;
    }`);

    GM_addStyle(`.navigation-icon {
        display: inline-flex;
        -ms-flex-align: center;
        -webkit-align-items: center;
        align-items: center;
        -ms-flex-pack: center;
        -webkit-justify-content: center;
        justify-content: center;
        position: relative;
        vertical-align: middle;
        fill: var(--iron-icon-fill-color, currentcolor);
        stroke: none;
        width: var(--iron-icon-width, 24px);
        height: var(--iron-icon-height, 24px);
        animation: var(--iron-icon_-_animation);
    }`);

    const backButton = createElement("div", {
        className: [
            "style-scope",
            "ytmusic-pivot-bar-renderer",
            "navigation-item",
        ].join(" "),
        role: "tab",
        innerHTML: `
                <div
                    class="search-icon style-scope ytmusic-search-box"
                    role="button"
                    tabindex="0"
                    aria-disabled="false"
                    title="Go to previous page"
                >
                    <div
                        id="icon"
                        class="tab-icon style-scope paper-icon-button navigation-icon"
                    >
                        <svg
                            viewBox="0 0 492 492"
                            preserveAspectRatio="xMidYMid meet"
                            focusable="false"
                            class="style-scope iron-icon"
                            style="pointer-events: none; display: block; width: 100%; height: 100%"
                        >
                            <g class="style-scope iron-icon">
                                <path
                                    d="M109.3 265.2l218.9 218.9c5.1 5.1 11.8 7.9 19 7.9s14-2.8 19-7.9l16.1-16.1c10.5-10.5 10.5-27.6 0-38.1L198.6 246.1 382.7 62c5.1-5.1 7.9-11.8 7.9-19 0-7.2-2.8-14-7.9-19L366.5 7.9c-5.1-5.1-11.8-7.9-19-7.9-7.2 0-14 2.8-19 7.9L109.3 227c-5.1 5.1-7.9 11.9-7.8 19.1 0 7.2 2.8 14 7.8 19.1z"
                                ></path>
                            </g>
                        </svg>
                    </div>
                </div>
            `,
        onclick: window.history.back.bind(window.history),
    });

    const forwardButton = createElement("div", {
        className: [
            "style-scope",
            "ytmusic-pivot-bar-renderer",
            "navigation-item",
        ].join(" "),
        role: "tab",
        innerHTML: `
                <div
                    class="search-icon style-scope ytmusic-search-box"
                    role="button"
                    tabindex="0"
                    aria-disabled="false"
                    title="Go to next page"
                >
                    <div
                        id="icon"
                        class="tab-icon style-scope paper-icon-button navigation-icon"
                    >
                        <svg
                            viewBox="0 0 492 492"
                            preserveAspectRatio="xMidYMid meet"
                            focusable="false"
                            class="style-scope iron-icon"
                            style="pointer-events: none; display: block; width: 100%; height: 100%;"
                        >
                            <g class="style-scope iron-icon">
                                <path
                                    d="M382.7,226.8L163.7,7.9c-5.1-5.1-11.8-7.9-19-7.9s-14,2.8-19,7.9L109.5,24c-10.5,10.5-10.5,27.6,0,38.1
                                l183.9,183.9L109.3,430c-5.1,5.1-7.9,11.8-7.9,19c0,7.2,2.8,14,7.9,19l16.1,16.1c5.1,5.1,11.8,7.9,19,7.9s14-2.8,19-7.9L382.7,265
                                c5.1-5.1,7.9-11.9,7.8-19.1C390.5,238.7,387.8,231.9,382.7,226.8z"
                                ></path>
                            </g>
                        </svg>
                    </div>
                </div>
            `,
        click: window.history.forward.bind(window.history),
    });

    const menu = document.querySelector("ytmusic-pivot-bar-renderer");
    menu?.prepend(backButton, forwardButton);
};

const addPreciseVolume = (options) => {
    GM_addStyle(`#volumeHud {
        z-index: 999;
        position: absolute;
        transition: opacity 0.6s;
        pointer-events: none;
        padding: 10px;
    }`);

    GM_addStyle(`ytmusic-player[player-ui-state_="MINIPLAYER"] #volumeHud {
        top: 0 !important;
    }`);

    function setVolume(value) {
        options.volume = value;
        Settings.update("volume", value);
        document.querySelector("video").volume = value / 100;
        // change slider position (important)
        updateVolumeSlider();

        // Change tooltips to new value
        setTooltip(value);
        // Show volume slider
        showVolumeSlider();
        // Show volume HUD
        showVolumeHud(value);
    }

    function injectVolumeHud(noVid) {
        if (noVid) {
            const position = "top: 18px; right: 60px;";
            const mainStyle = "font-size: xx-large;";

            document
                .querySelector(".center-content.ytmusic-nav-bar")
                .insertAdjacentHTML(
                    "beforeend",
                    `<span id="volumeHud" style="${
                        position + mainStyle
                    }"></span>`
                );
        } else {
            const position = `top: 10px; left: 10px;`;
            const mainStyle =
                "font-size: xxx-large; webkit-text-stroke: 1px black; font-weight: 600;";

            document
                .querySelector("#song-video")
                .insertAdjacentHTML(
                    "afterend",
                    `<span id="volumeHud" style="${
                        position + mainStyle
                    }"></span>`
                );
        }
    }

    let hudMoveTimeout;
    function moveVolumeHud(showVideo) {
        clearTimeout(hudMoveTimeout);
        const volumeHud = document.querySelector("#volumeHud");
        if (!volumeHud) return;
        hudMoveTimeout = setTimeout(() => {
            volumeHud.style.top = showVideo
                ? `${
                      (document.querySelector("ytmusic-player").clientHeight -
                          document.querySelector("video").clientHeight) /
                      2
                  }px`
                : 0;
        }, 250);
    }

    let hudFadeTimeout;

    function showVolumeHud(volume) {
        let volumeHud = document.querySelector("#volumeHud");
        if (!volumeHud) return;

        volumeHud.textContent = volume + "%";
        volumeHud.style.opacity = 1;

        if (hudFadeTimeout) {
            clearTimeout(hudFadeTimeout);
        }

        hudFadeTimeout = setTimeout(() => {
            volumeHud.style.opacity = 0;
            hudFadeTimeout = null;
        }, 2000);
    }

    /** if (toIncrease = false) then volume decrease */
    function changeVolume(toIncrease) {
        // Apply volume change if valid
        setVolume(
            toIncrease
                ? Math.min(options.volume + 1, 100)
                : Math.max(options.volume - 1, 0)
        );
    }

    function updateVolumeSlider() {
        // Slider value automatically rounds to multiples of 5
        for (const slider of ["#volume-slider", "#expand-volume-slider"]) {
            document.querySelector(slider).value =
                options.volume > 0 && options.volume < 5 ? 5 : options.volume;
        }
    }

    let volumeHoverTimeoutID;
    function showVolumeSlider() {
        const slider = document.querySelector("#volume-slider");
        // This class display the volume slider if not in minimized mode
        slider.classList.add("on-hover");
        // Reset timeout if previous one hasn't completed
        if (volumeHoverTimeoutID) {
            clearTimeout(volumeHoverTimeoutID);
        }
        // Timeout to remove volume preview after 3 seconds if playbar isn't hovered
        volumeHoverTimeoutID = setTimeout(() => {
            volumeHoverTimeoutID = null;
            if (
                !document
                    .querySelector("ytmusic-player-bar")
                    .classList.contains("on-hover")
            ) {
                slider.classList.remove("on-hover");
            }
        }, 3000);
    }

    function setupPlaybar() {
        const playerbar = document.querySelector("ytmusic-player-bar");

        playerbar.addEventListener("wheel", (event) => {
            event.preventDefault();
            // Event.deltaY < 0 means wheel-up
            changeVolume(event.deltaY < 0);
        });
        playerbar.addEventListener("click", () => {
            setVolume(Math.round(document.querySelector("video").volume * 100));
        });

        // Keep track of mouse position for showVolumeSlider()
        playerbar.addEventListener("mouseenter", () => {
            playerbar.classList.add("on-hover");
        });

        playerbar.addEventListener("mouseleave", () => {
            playerbar.classList.remove("on-hover");
        });

        setupSliderObserver();
    }

    function setupSliderObserver() {
        const sliderObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // This checks that volume-slider was manually set
                if (
                    mutation.oldValue !== mutation.target.value &&
                    Math.abs(options.volume - mutation.target.value) > 4
                ) {
                    // Diff>4 means it was manually set
                    setTooltip(mutation.target.value);
                    // saveVolume(mutation.target.value);
                }
            }
        });

        // Observing only changes in 'value' of volume-slider
        sliderObserver.observe(document.querySelector("#volume-slider"), {
            attributeFilter: ["value"],
            attributeOldValue: true,
        });
    }

    const tooltipTargets = [
        "#volume-slider",
        "tp-yt-paper-icon-button.volume",
        "#expand-volume-slider",
        "#expand-volume",
    ];

    function setTooltip(volume) {
        for (const target of tooltipTargets) {
            document.querySelector(target).title = `${volume}%`;
        }
    }

    function setupVideoPlayerOnwheel() {
        document
            .querySelector("#main-panel")
            .addEventListener("wheel", (event) => {
                event.preventDefault();
                // Event.deltaY < 0 means wheel-up
                changeVolume(event.deltaY < 0);
            });
    }

    setupPlaybar();

    // prettier-ignore
    const noVid = document.querySelector("#main-panel")?.computedStyleMap()?.get("display").value === "none";

    injectVolumeHud(noVid);

    if (!noVid) {
        console.log("debug", 1);
        setupVideoPlayerOnwheel();
        console.log("debug", 2);
        document
            .querySelector("video")
            .addEventListener("srcChanged", () => {});
    }

    setVolume(options.volume);
};

const main = async () => {
    const options = {
        volume:
            Settings.get()?.volume ||
            (document.querySelector("video")?.volume || 0.05) * 100,
    };

    addNavigationButtons();
    addPreciseVolume(options);
    console.log("what?");
};

win.addEventListener(
    "load",
    () => {
        win.Element.prototype.addEventListener =
            win.Element.prototype._addEventListener;
        win.Element.prototype._addEventListener = undefined;
        ignored = undefined;
    },
    { once: true }
);

waitForElem("ytmusic-pivot-bar-renderer", main);
