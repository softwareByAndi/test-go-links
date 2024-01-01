/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/apis/api.js":
/*!*************************!*\
  !*** ./src/apis/api.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   API: () => (/* binding */ API)
/* harmony export */ });
const API = chrome;

/***/ }),

/***/ "./src/background/background.js":
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Background: () => (/* binding */ Background)
/* harmony export */ });
/* harmony import */ var _manage_data_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./manage_data.js */ "./src/background/manage_data.js");


class Background {
    constructor(browser_api) {
        this.api = browser_api;
        this.HOST_NAMES = {
            GO_DOMAINS: ['go', 'dev', 'eng', 'learn', 'docs', 'git']
                .map(domain => `https://${domain}/`),
            BLACKLIST: ['localhost', 'http://*'] // blacklist non-secure sites for now.
        };
        this.HOST_REGEX = Object.fromEntries(
            Object.entries(this.HOST_NAMES)
                .map(([key, value]) => [
                    key,
                    value.map(domain => new RegExp(
                        `^${domain}*$`
                            .replaceAll('**', '*')
                            .replaceAll('*', '.*')
                    ))
                ])
        )
        _manage_data_js__WEBPACK_IMPORTED_MODULE_0__.load_data(null).then(data => {
            this.data = data;
        });
    }

    run() {
        this.registerListeners();
        console.log('hello world')
    }

    registerListeners() {
        this.api.webRequest.onBeforeRequest.addListener(
            this.reRouteGoRequests.bind(this),
            {urls: ['<all_urls>']},
            ['blocking']
        );

        this.api.runtime.onInstalled.addListener(this.handleInstall.bind(this));
        this.api.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    }


    get_blacklist_redirect(url) {
        const host_index = this.HOST_REGEX.BLACKLIST.findIndex(domain => url.match(domain))
        if (host_index !== -1) {
            window.alert(`this site is blacklisted: ${this.HOST_REGEX.BLACKLIST[host_index].toString()} :  ${url}`)
            return {redirectUrl: this.data.routes['404']};
        }
        return null
    }

    reRouteGoRequests(requestDetails) {
        // match against the whitelist.
        if (!this.HOST_REGEX.GO_DOMAINS.some(domain => requestDetails.url.match(domain))) {
            // if not in whitelist, check blacklist
           return this.get_blacklist_redirect(requestDetails.url);
        }

        // url matches go_domain, so we can do stuff
        const redirect_url = this.find_route(requestDetails.url);

        return this.get_blacklist_redirect(redirect_url)
            || {redirectUrl: redirect_url};
    }


    find_route(raw_url) {
        const [_scheme, url] = raw_url.split('://');
        const [domain, ...raw_path] = url.split('/');
        const path = raw_path.map(key => this.data?.aliases?.[key] || key)

        // window.alert(path)

        let states = [{state: this.data?.routes?.[domain], path: ''}]
        for (let i = 0; i < path.length; i++) {
            const previous_states = states;
            states = [];
            for (const current_state of previous_states) {
                for (const key of path) {
                    if (current_state.state?.[key]) {
                        states.push({state: current_state.state[key], path: `${current_state.path}${key}/`});
                    }
                }
            }
        }
        // window.alert(JSON.stringify(states, null, 2))

        return !path.length
            ? this.data.routes['404']
            : states[0]?.state || this.data.routes['404'];
    }

    async handleStorageChange(changes, _storage_location) {
        // TODO : handle namespace specific changes
        console.log('handleStorageChange: ', changes, ' : ', _storage_location)
        if (changes) {
            this.data = await _manage_data_js__WEBPACK_IMPORTED_MODULE_0__.load_data(null);
            console.log('storage change: ', changes)
        }
    }


    handleInstall() {
        _manage_data_js__WEBPACK_IMPORTED_MODULE_0__.set_data(_manage_data_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_DATA).then(() => {
            console.log('GoLinks installed');
        });

        // FIXME : create returns undefined...

        // teach chrome to treat `go/` as a domain instead of as a search
        // this.HOST_NAMES.GO_DOMAINS.forEach(async url => {
        //     this.api.tabs.create({url: url, active: false})?.then(newTab => {
        //         this.api.tabs.onUpdated.addListener((tabId, changeInfo) => {
        //             if (tabId === newTab.id && (changeInfo.status === 'complete' || changeInfo.status === 'loading')) {
        //                 this.api.tabs.remove(tabId);
        //             }
        //         })
        //     });
        // });

    }
}






/***/ }),

/***/ "./src/background/manage_data.js":
/*!***************************************!*\
  !*** ./src/background/manage_data.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_DATA: () => (/* binding */ DEFAULT_DATA),
/* harmony export */   load_data: () => (/* binding */ load_data),
/* harmony export */   set_data: () => (/* binding */ set_data)
/* harmony export */ });
/* harmony import */ var _apis_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../apis/api.js */ "./src/apis/api.js");



async function load_data(namespace) {
    return await new Promise((resolve, reject) => {
        _apis_api_js__WEBPACK_IMPORTED_MODULE_0__.API.storage.local.get(namespace || null, function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                const data = !namespace ? result : result[namespace];
                resolve(data)
            }
        });
    });
}

async function set_data(data) {
    return await new Promise((resolve, reject) => {
        _apis_api_js__WEBPACK_IMPORTED_MODULE_0__.API.storage.local.set(data, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data);
            }
        });
    })
}

const DEFAULT_DATA = {
    routes: {
        '404': 'https://http.cat/404',
        'go': {
            'github': 'https://github.com/softwareByAndi',
            'chat': 'https://chat.openai.com',
            'gmail': 'https://mail.google.com/mail/u/0/#inbox',
            'google_calendar': 'https://calendar.google.com/calendar/r',
        },
        'git': {
            'home': 'https://github.com/softwareByAndi',
        },
        'learn': {
            'vulkan': {
                'tutorial': 'https://vulkan-tutorial.com/',
            }
        },
        'docs': {
            'vulkan': {
                'home': 'https://www.khronos.org/vulkan/',
                'spec': 'https://www.khronos.org/registry/vulkan/specs/1.2-extensions/html/index.html',
            }
        }
    },
    keywords: {
        'github': true,
        'learn': true,
        'study': true,
        'documentation': true,
        'tutorial': true,
        'google_drive': true,
        'vulkan': true,
        'gmail': true,
        'google_calendar': true,
    },
    aliases: {
        'gh': 'github',
        'git': 'github',
        'l': 'learn',
        'ln': 'learn',
        'lrn': 'learn',
        's': 'study',
        'st': 'study',
        'doc': 'documentation',
        'docs': 'documentation',
        'tut': 'tutorial',
        'd': 'google_drive',
        'dr': 'google_drive',
        'gd': 'google_drive',
        'drive': 'google_drive',
        'vk': 'vulkan',
        'm': 'gmail',
        'gm': 'gmail',
        'mail': 'gmail',
        'email': 'gmail',
        'c': 'google_calendar',
        'gc': 'google_calendar',
        'cal': 'google_calendar',
        'calen': 'google_calendar',
    }
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************************************!*\
  !*** ./src/background/entry_points/chrome.js ***!
  \***********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _apis_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../apis/api.js */ "./src/apis/api.js");
/* harmony import */ var _background_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../background.js */ "./src/background/background.js");



const background = new _background_js__WEBPACK_IMPORTED_MODULE_1__.Background(_apis_api_js__WEBPACK_IMPORTED_MODULE_0__.API);
background.run();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFPOzs7Ozs7Ozs7Ozs7Ozs7QUNBZ0M7O0FBRWhDO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsT0FBTztBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixPQUFPO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFZO0FBQ3BCO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQWEscUJBQXFCO0FBQ2xDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0Qsa0RBQWtELEtBQUssSUFBSTtBQUNqSCxvQkFBb0I7QUFDcEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsZ0JBQWdCO0FBQ2hCOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSx1QkFBdUIsNkNBQTZDO0FBQ3BFLHdCQUF3QixpQkFBaUI7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQywwQ0FBMEMsbUJBQW1CLEVBQUUsSUFBSSxHQUFHO0FBQzNHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsc0RBQVk7QUFDMUM7QUFDQTtBQUNBOzs7QUFHQTtBQUNBLFFBQVEscURBQVcsQ0FBQyx5REFBZTtBQUNuQztBQUNBLFNBQVM7O0FBRVQ7O0FBRUE7QUFDQTtBQUNBLHFDQUFxQyx3QkFBd0I7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0I7QUFDcEIsZ0JBQWdCO0FBQ2hCLFlBQVk7O0FBRVo7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFIbUM7OztBQUc1QjtBQUNQO0FBQ0EsUUFBUSw2Q0FBRztBQUNYO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFTztBQUNQO0FBQ0EsUUFBUSw2Q0FBRztBQUNYO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O1VDeEZBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7O0FDTnNDO0FBQ007O0FBRTVDLHVCQUF1QixzREFBVSxDQUFDLDZDQUFHO0FBQ3JDLGlCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy8uL3NyYy9hcGlzL2FwaS5qcyIsIndlYnBhY2s6Ly90ZXN0LWdvLWxpbmtzLy4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC5qcyIsIndlYnBhY2s6Ly90ZXN0LWdvLWxpbmtzLy4vc3JjL2JhY2tncm91bmQvbWFuYWdlX2RhdGEuanMiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90ZXN0LWdvLWxpbmtzL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90ZXN0LWdvLWxpbmtzL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3Rlc3QtZ28tbGlua3MvLi9zcmMvYmFja2dyb3VuZC9lbnRyeV9wb2ludHMvY2hyb21lLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBBUEkgPSBjaHJvbWU7IiwiaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4vbWFuYWdlX2RhdGEuanNcIjtcblxuZXhwb3J0IGNsYXNzIEJhY2tncm91bmQge1xuICAgIGNvbnN0cnVjdG9yKGJyb3dzZXJfYXBpKSB7XG4gICAgICAgIHRoaXMuYXBpID0gYnJvd3Nlcl9hcGk7XG4gICAgICAgIHRoaXMuSE9TVF9OQU1FUyA9IHtcbiAgICAgICAgICAgIEdPX0RPTUFJTlM6IFsnZ28nLCAnZGV2JywgJ2VuZycsICdsZWFybicsICdkb2NzJywgJ2dpdCddXG4gICAgICAgICAgICAgICAgLm1hcChkb21haW4gPT4gYGh0dHBzOi8vJHtkb21haW59L2ApLFxuICAgICAgICAgICAgQkxBQ0tMSVNUOiBbJ2xvY2FsaG9zdCcsICdodHRwOi8vKiddIC8vIGJsYWNrbGlzdCBub24tc2VjdXJlIHNpdGVzIGZvciBub3cuXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuSE9TVF9SRUdFWCA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuSE9TVF9OQU1FUylcbiAgICAgICAgICAgICAgICAubWFwKChba2V5LCB2YWx1ZV0pID0+IFtcbiAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5tYXAoZG9tYWluID0+IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICAgICAgICAgICAgICBgXiR7ZG9tYWlufSokYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlQWxsKCcqKicsICcqJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZUFsbCgnKicsICcuKicpXG4gICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgXSlcbiAgICAgICAgKVxuICAgICAgICBkYi5sb2FkX2RhdGEobnVsbCkudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJ1bigpIHtcbiAgICAgICAgdGhpcy5yZWdpc3Rlckxpc3RlbmVycygpO1xuICAgICAgICBjb25zb2xlLmxvZygnaGVsbG8gd29ybGQnKVxuICAgIH1cblxuICAgIHJlZ2lzdGVyTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmFwaS53ZWJSZXF1ZXN0Lm9uQmVmb3JlUmVxdWVzdC5hZGRMaXN0ZW5lcihcbiAgICAgICAgICAgIHRoaXMucmVSb3V0ZUdvUmVxdWVzdHMuYmluZCh0aGlzKSxcbiAgICAgICAgICAgIHt1cmxzOiBbJzxhbGxfdXJscz4nXX0sXG4gICAgICAgICAgICBbJ2Jsb2NraW5nJ11cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmFwaS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKHRoaXMuaGFuZGxlSW5zdGFsbC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5hcGkuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIodGhpcy5oYW5kbGVTdG9yYWdlQ2hhbmdlLmJpbmQodGhpcykpO1xuICAgIH1cblxuXG4gICAgZ2V0X2JsYWNrbGlzdF9yZWRpcmVjdCh1cmwpIHtcbiAgICAgICAgY29uc3QgaG9zdF9pbmRleCA9IHRoaXMuSE9TVF9SRUdFWC5CTEFDS0xJU1QuZmluZEluZGV4KGRvbWFpbiA9PiB1cmwubWF0Y2goZG9tYWluKSlcbiAgICAgICAgaWYgKGhvc3RfaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoYHRoaXMgc2l0ZSBpcyBibGFja2xpc3RlZDogJHt0aGlzLkhPU1RfUkVHRVguQkxBQ0tMSVNUW2hvc3RfaW5kZXhdLnRvU3RyaW5nKCl9IDogICR7dXJsfWApXG4gICAgICAgICAgICByZXR1cm4ge3JlZGlyZWN0VXJsOiB0aGlzLmRhdGEucm91dGVzWyc0MDQnXX07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICByZVJvdXRlR29SZXF1ZXN0cyhyZXF1ZXN0RGV0YWlscykge1xuICAgICAgICAvLyBtYXRjaCBhZ2FpbnN0IHRoZSB3aGl0ZWxpc3QuXG4gICAgICAgIGlmICghdGhpcy5IT1NUX1JFR0VYLkdPX0RPTUFJTlMuc29tZShkb21haW4gPT4gcmVxdWVzdERldGFpbHMudXJsLm1hdGNoKGRvbWFpbikpKSB7XG4gICAgICAgICAgICAvLyBpZiBub3QgaW4gd2hpdGVsaXN0LCBjaGVjayBibGFja2xpc3RcbiAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X2JsYWNrbGlzdF9yZWRpcmVjdChyZXF1ZXN0RGV0YWlscy51cmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXJsIG1hdGNoZXMgZ29fZG9tYWluLCBzbyB3ZSBjYW4gZG8gc3R1ZmZcbiAgICAgICAgY29uc3QgcmVkaXJlY3RfdXJsID0gdGhpcy5maW5kX3JvdXRlKHJlcXVlc3REZXRhaWxzLnVybCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X2JsYWNrbGlzdF9yZWRpcmVjdChyZWRpcmVjdF91cmwpXG4gICAgICAgICAgICB8fCB7cmVkaXJlY3RVcmw6IHJlZGlyZWN0X3VybH07XG4gICAgfVxuXG5cbiAgICBmaW5kX3JvdXRlKHJhd191cmwpIHtcbiAgICAgICAgY29uc3QgW19zY2hlbWUsIHVybF0gPSByYXdfdXJsLnNwbGl0KCc6Ly8nKTtcbiAgICAgICAgY29uc3QgW2RvbWFpbiwgLi4ucmF3X3BhdGhdID0gdXJsLnNwbGl0KCcvJyk7XG4gICAgICAgIGNvbnN0IHBhdGggPSByYXdfcGF0aC5tYXAoa2V5ID0+IHRoaXMuZGF0YT8uYWxpYXNlcz8uW2tleV0gfHwga2V5KVxuXG4gICAgICAgIC8vIHdpbmRvdy5hbGVydChwYXRoKVxuXG4gICAgICAgIGxldCBzdGF0ZXMgPSBbe3N0YXRlOiB0aGlzLmRhdGE/LnJvdXRlcz8uW2RvbWFpbl0sIHBhdGg6ICcnfV1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c19zdGF0ZXMgPSBzdGF0ZXM7XG4gICAgICAgICAgICBzdGF0ZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY3VycmVudF9zdGF0ZSBvZiBwcmV2aW91c19zdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X3N0YXRlLnN0YXRlPy5ba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzLnB1c2goe3N0YXRlOiBjdXJyZW50X3N0YXRlLnN0YXRlW2tleV0sIHBhdGg6IGAke2N1cnJlbnRfc3RhdGUucGF0aH0ke2tleX0vYH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHdpbmRvdy5hbGVydChKU09OLnN0cmluZ2lmeShzdGF0ZXMsIG51bGwsIDIpKVxuXG4gICAgICAgIHJldHVybiAhcGF0aC5sZW5ndGhcbiAgICAgICAgICAgID8gdGhpcy5kYXRhLnJvdXRlc1snNDA0J11cbiAgICAgICAgICAgIDogc3RhdGVzWzBdPy5zdGF0ZSB8fCB0aGlzLmRhdGEucm91dGVzWyc0MDQnXTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVTdG9yYWdlQ2hhbmdlKGNoYW5nZXMsIF9zdG9yYWdlX2xvY2F0aW9uKSB7XG4gICAgICAgIC8vIFRPRE8gOiBoYW5kbGUgbmFtZXNwYWNlIHNwZWNpZmljIGNoYW5nZXNcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsZVN0b3JhZ2VDaGFuZ2U6ICcsIGNoYW5nZXMsICcgOiAnLCBfc3RvcmFnZV9sb2NhdGlvbilcbiAgICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IGF3YWl0IGRiLmxvYWRfZGF0YShudWxsKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdG9yYWdlIGNoYW5nZTogJywgY2hhbmdlcylcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgaGFuZGxlSW5zdGFsbCgpIHtcbiAgICAgICAgZGIuc2V0X2RhdGEoZGIuREVGQVVMVF9EQVRBKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdHb0xpbmtzIGluc3RhbGxlZCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBGSVhNRSA6IGNyZWF0ZSByZXR1cm5zIHVuZGVmaW5lZC4uLlxuXG4gICAgICAgIC8vIHRlYWNoIGNocm9tZSB0byB0cmVhdCBgZ28vYCBhcyBhIGRvbWFpbiBpbnN0ZWFkIG9mIGFzIGEgc2VhcmNoXG4gICAgICAgIC8vIHRoaXMuSE9TVF9OQU1FUy5HT19ET01BSU5TLmZvckVhY2goYXN5bmMgdXJsID0+IHtcbiAgICAgICAgLy8gICAgIHRoaXMuYXBpLnRhYnMuY3JlYXRlKHt1cmw6IHVybCwgYWN0aXZlOiBmYWxzZX0pPy50aGVuKG5ld1RhYiA9PiB7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5hcGkudGFicy5vblVwZGF0ZWQuYWRkTGlzdGVuZXIoKHRhYklkLCBjaGFuZ2VJbmZvKSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGlmICh0YWJJZCA9PT0gbmV3VGFiLmlkICYmIChjaGFuZ2VJbmZvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlJyB8fCBjaGFuZ2VJbmZvLnN0YXR1cyA9PT0gJ2xvYWRpbmcnKSkge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgdGhpcy5hcGkudGFicy5yZW1vdmUodGFiSWQpO1xuICAgICAgICAvLyAgICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgfSlcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9KTtcblxuICAgIH1cbn1cblxuXG5cblxuIiwiaW1wb3J0IHtBUEl9IGZyb20gJy4uL2FwaXMvYXBpLmpzJztcblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZF9kYXRhKG5hbWVzcGFjZSkge1xuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIEFQSS5zdG9yYWdlLmxvY2FsLmdldChuYW1lc3BhY2UgfHwgbnVsbCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSAhbmFtZXNwYWNlID8gcmVzdWx0IDogcmVzdWx0W25hbWVzcGFjZV07XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldF9kYXRhKGRhdGEpIHtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBBUEkuc3RvcmFnZS5sb2NhbC5zZXQoZGF0YSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0RBVEEgPSB7XG4gICAgcm91dGVzOiB7XG4gICAgICAgICc0MDQnOiAnaHR0cHM6Ly9odHRwLmNhdC80MDQnLFxuICAgICAgICAnZ28nOiB7XG4gICAgICAgICAgICAnZ2l0aHViJzogJ2h0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0d2FyZUJ5QW5kaScsXG4gICAgICAgICAgICAnY2hhdCc6ICdodHRwczovL2NoYXQub3BlbmFpLmNvbScsXG4gICAgICAgICAgICAnZ21haWwnOiAnaHR0cHM6Ly9tYWlsLmdvb2dsZS5jb20vbWFpbC91LzAvI2luYm94JyxcbiAgICAgICAgICAgICdnb29nbGVfY2FsZW5kYXInOiAnaHR0cHM6Ly9jYWxlbmRhci5nb29nbGUuY29tL2NhbGVuZGFyL3InLFxuICAgICAgICB9LFxuICAgICAgICAnZ2l0Jzoge1xuICAgICAgICAgICAgJ2hvbWUnOiAnaHR0cHM6Ly9naXRodWIuY29tL3NvZnR3YXJlQnlBbmRpJyxcbiAgICAgICAgfSxcbiAgICAgICAgJ2xlYXJuJzoge1xuICAgICAgICAgICAgJ3Z1bGthbic6IHtcbiAgICAgICAgICAgICAgICAndHV0b3JpYWwnOiAnaHR0cHM6Ly92dWxrYW4tdHV0b3JpYWwuY29tLycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdkb2NzJzoge1xuICAgICAgICAgICAgJ3Z1bGthbic6IHtcbiAgICAgICAgICAgICAgICAnaG9tZSc6ICdodHRwczovL3d3dy5raHJvbm9zLm9yZy92dWxrYW4vJyxcbiAgICAgICAgICAgICAgICAnc3BlYyc6ICdodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS92dWxrYW4vc3BlY3MvMS4yLWV4dGVuc2lvbnMvaHRtbC9pbmRleC5odG1sJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAga2V5d29yZHM6IHtcbiAgICAgICAgJ2dpdGh1Yic6IHRydWUsXG4gICAgICAgICdsZWFybic6IHRydWUsXG4gICAgICAgICdzdHVkeSc6IHRydWUsXG4gICAgICAgICdkb2N1bWVudGF0aW9uJzogdHJ1ZSxcbiAgICAgICAgJ3R1dG9yaWFsJzogdHJ1ZSxcbiAgICAgICAgJ2dvb2dsZV9kcml2ZSc6IHRydWUsXG4gICAgICAgICd2dWxrYW4nOiB0cnVlLFxuICAgICAgICAnZ21haWwnOiB0cnVlLFxuICAgICAgICAnZ29vZ2xlX2NhbGVuZGFyJzogdHJ1ZSxcbiAgICB9LFxuICAgIGFsaWFzZXM6IHtcbiAgICAgICAgJ2doJzogJ2dpdGh1YicsXG4gICAgICAgICdnaXQnOiAnZ2l0aHViJyxcbiAgICAgICAgJ2wnOiAnbGVhcm4nLFxuICAgICAgICAnbG4nOiAnbGVhcm4nLFxuICAgICAgICAnbHJuJzogJ2xlYXJuJyxcbiAgICAgICAgJ3MnOiAnc3R1ZHknLFxuICAgICAgICAnc3QnOiAnc3R1ZHknLFxuICAgICAgICAnZG9jJzogJ2RvY3VtZW50YXRpb24nLFxuICAgICAgICAnZG9jcyc6ICdkb2N1bWVudGF0aW9uJyxcbiAgICAgICAgJ3R1dCc6ICd0dXRvcmlhbCcsXG4gICAgICAgICdkJzogJ2dvb2dsZV9kcml2ZScsXG4gICAgICAgICdkcic6ICdnb29nbGVfZHJpdmUnLFxuICAgICAgICAnZ2QnOiAnZ29vZ2xlX2RyaXZlJyxcbiAgICAgICAgJ2RyaXZlJzogJ2dvb2dsZV9kcml2ZScsXG4gICAgICAgICd2ayc6ICd2dWxrYW4nLFxuICAgICAgICAnbSc6ICdnbWFpbCcsXG4gICAgICAgICdnbSc6ICdnbWFpbCcsXG4gICAgICAgICdtYWlsJzogJ2dtYWlsJyxcbiAgICAgICAgJ2VtYWlsJzogJ2dtYWlsJyxcbiAgICAgICAgJ2MnOiAnZ29vZ2xlX2NhbGVuZGFyJyxcbiAgICAgICAgJ2djJzogJ2dvb2dsZV9jYWxlbmRhcicsXG4gICAgICAgICdjYWwnOiAnZ29vZ2xlX2NhbGVuZGFyJyxcbiAgICAgICAgJ2NhbGVuJzogJ2dvb2dsZV9jYWxlbmRhcicsXG4gICAgfVxufTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHtBUEl9IGZyb20gJy4uLy4uL2FwaXMvYXBpLmpzJztcbmltcG9ydCB7QmFja2dyb3VuZH0gZnJvbSBcIi4uL2JhY2tncm91bmQuanNcIjtcblxuY29uc3QgYmFja2dyb3VuZCA9IG5ldyBCYWNrZ3JvdW5kKEFQSSk7XG5iYWNrZ3JvdW5kLnJ1bigpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==