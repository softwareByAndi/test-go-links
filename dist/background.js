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
            BLACKLIST: ['chrome*://*', 'localhost', 'http://*'] // blacklist non-secure sites for now.
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

    handleStorageChange(changes, _namespace) {
        // TODO : handle namespace specific changes
        if (changes) {
            console.log(changes)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFPOzs7Ozs7Ozs7Ozs7Ozs7QUNBZ0M7O0FBRWhDO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsT0FBTztBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixPQUFPO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFZO0FBQ3BCO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLHFCQUFxQjtBQUNsQztBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELGtEQUFrRCxLQUFLLElBQUk7QUFDakgsb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLGdCQUFnQjtBQUNoQjs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsdUJBQXVCLDZDQUE2QztBQUNwRSx3QkFBd0IsaUJBQWlCO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsMENBQTBDLG1CQUFtQixFQUFFLElBQUksR0FBRztBQUMzRztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQSxRQUFRLHFEQUFXLENBQUMseURBQWU7QUFDbkM7QUFDQSxTQUFTOztBQUVUOztBQUVBO0FBQ0E7QUFDQSxxQ0FBcUMsd0JBQXdCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCLGdCQUFnQjtBQUNoQixZQUFZOztBQUVaO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2SG1DOzs7QUFHNUI7QUFDUDtBQUNBLFFBQVEsNkNBQUc7QUFDWDtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRU87QUFDUDtBQUNBLFFBQVEsNkNBQUc7QUFDWDtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztVQ3hGQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7OztBQ05zQztBQUNNOztBQUU1Qyx1QkFBdUIsc0RBQVUsQ0FBQyw2Q0FBRztBQUNyQyxpQiIsInNvdXJjZXMiOlsid2VicGFjazovL3Rlc3QtZ28tbGlua3MvLi9zcmMvYXBpcy9hcGkuanMiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy8uL3NyYy9iYWNrZ3JvdW5kL2JhY2tncm91bmQuanMiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy8uL3NyYy9iYWNrZ3JvdW5kL21hbmFnZV9kYXRhLmpzIiwid2VicGFjazovL3Rlc3QtZ28tbGlua3Mvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGVzdC1nby1saW5rcy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3Rlc3QtZ28tbGlua3Mvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly90ZXN0LWdvLWxpbmtzLy4vc3JjL2JhY2tncm91bmQvZW50cnlfcG9pbnRzL2Nocm9tZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQVBJID0gY2hyb21lOyIsImltcG9ydCAqIGFzIGRiIGZyb20gXCIuL21hbmFnZV9kYXRhLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBCYWNrZ3JvdW5kIHtcbiAgICBjb25zdHJ1Y3Rvcihicm93c2VyX2FwaSkge1xuICAgICAgICB0aGlzLmFwaSA9IGJyb3dzZXJfYXBpO1xuICAgICAgICB0aGlzLkhPU1RfTkFNRVMgPSB7XG4gICAgICAgICAgICBHT19ET01BSU5TOiBbJ2dvJywgJ2RldicsICdlbmcnLCAnbGVhcm4nLCAnZG9jcycsICdnaXQnXVxuICAgICAgICAgICAgICAgIC5tYXAoZG9tYWluID0+IGBodHRwczovLyR7ZG9tYWlufS9gKSxcbiAgICAgICAgICAgIEJMQUNLTElTVDogWydjaHJvbWUqOi8vKicsICdsb2NhbGhvc3QnLCAnaHR0cDovLyonXSAvLyBibGFja2xpc3Qgbm9uLXNlY3VyZSBzaXRlcyBmb3Igbm93LlxuICAgICAgICB9O1xuICAgICAgICB0aGlzLkhPU1RfUkVHRVggPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgICAgICBPYmplY3QuZW50cmllcyh0aGlzLkhPU1RfTkFNRVMpXG4gICAgICAgICAgICAgICAgLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBbXG4gICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUubWFwKGRvbWFpbiA9PiBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgICAgICAgICAgICAgYF4ke2RvbWFpbn0qJGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZUFsbCgnKionLCAnKicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2VBbGwoJyonLCAnLionKVxuICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgIF0pXG4gICAgICAgIClcbiAgICAgICAgZGIubG9hZF9kYXRhKG51bGwpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBydW4oKSB7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICByZWdpc3Rlckxpc3RlbmVycygpIHtcbiAgICAgICAgdGhpcy5hcGkud2ViUmVxdWVzdC5vbkJlZm9yZVJlcXVlc3QuYWRkTGlzdGVuZXIoXG4gICAgICAgICAgICB0aGlzLnJlUm91dGVHb1JlcXVlc3RzLmJpbmQodGhpcyksXG4gICAgICAgICAgICB7dXJsczogWyc8YWxsX3VybHM+J119LFxuICAgICAgICAgICAgWydibG9ja2luZyddXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5hcGkucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcih0aGlzLmhhbmRsZUluc3RhbGwuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYXBpLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKHRoaXMuaGFuZGxlU3RvcmFnZUNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cblxuICAgIGdldF9ibGFja2xpc3RfcmVkaXJlY3QodXJsKSB7XG4gICAgICAgIGNvbnN0IGhvc3RfaW5kZXggPSB0aGlzLkhPU1RfUkVHRVguQkxBQ0tMSVNULmZpbmRJbmRleChkb21haW4gPT4gdXJsLm1hdGNoKGRvbWFpbikpXG4gICAgICAgIGlmIChob3N0X2luZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KGB0aGlzIHNpdGUgaXMgYmxhY2tsaXN0ZWQ6ICR7dGhpcy5IT1NUX1JFR0VYLkJMQUNLTElTVFtob3N0X2luZGV4XS50b1N0cmluZygpfSA6ICAke3VybH1gKVxuICAgICAgICAgICAgcmV0dXJuIHtyZWRpcmVjdFVybDogdGhpcy5kYXRhLnJvdXRlc1snNDA0J119O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgcmVSb3V0ZUdvUmVxdWVzdHMocmVxdWVzdERldGFpbHMpIHtcbiAgICAgICAgLy8gbWF0Y2ggYWdhaW5zdCB0aGUgd2hpdGVsaXN0LlxuICAgICAgICBpZiAoIXRoaXMuSE9TVF9SRUdFWC5HT19ET01BSU5TLnNvbWUoZG9tYWluID0+IHJlcXVlc3REZXRhaWxzLnVybC5tYXRjaChkb21haW4pKSkge1xuICAgICAgICAgICAgLy8gaWYgbm90IGluIHdoaXRlbGlzdCwgY2hlY2sgYmxhY2tsaXN0XG4gICAgICAgICAgIHJldHVybiB0aGlzLmdldF9ibGFja2xpc3RfcmVkaXJlY3QocmVxdWVzdERldGFpbHMudXJsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVybCBtYXRjaGVzIGdvX2RvbWFpbiwgc28gd2UgY2FuIGRvIHN0dWZmXG4gICAgICAgIGNvbnN0IHJlZGlyZWN0X3VybCA9IHRoaXMuZmluZF9yb3V0ZShyZXF1ZXN0RGV0YWlscy51cmwpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldF9ibGFja2xpc3RfcmVkaXJlY3QocmVkaXJlY3RfdXJsKVxuICAgICAgICAgICAgfHwge3JlZGlyZWN0VXJsOiByZWRpcmVjdF91cmx9O1xuICAgIH1cblxuXG4gICAgZmluZF9yb3V0ZShyYXdfdXJsKSB7XG4gICAgICAgIGNvbnN0IFtfc2NoZW1lLCB1cmxdID0gcmF3X3VybC5zcGxpdCgnOi8vJyk7XG4gICAgICAgIGNvbnN0IFtkb21haW4sIC4uLnJhd19wYXRoXSA9IHVybC5zcGxpdCgnLycpO1xuICAgICAgICBjb25zdCBwYXRoID0gcmF3X3BhdGgubWFwKGtleSA9PiB0aGlzLmRhdGE/LmFsaWFzZXM/LltrZXldIHx8IGtleSlcblxuICAgICAgICAvLyB3aW5kb3cuYWxlcnQocGF0aClcblxuICAgICAgICBsZXQgc3RhdGVzID0gW3tzdGF0ZTogdGhpcy5kYXRhPy5yb3V0ZXM/Lltkb21haW5dLCBwYXRoOiAnJ31dXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcHJldmlvdXNfc3RhdGVzID0gc3RhdGVzO1xuICAgICAgICAgICAgc3RhdGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRfc3RhdGUgb2YgcHJldmlvdXNfc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgcGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudF9zdGF0ZS5zdGF0ZT8uW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlcy5wdXNoKHtzdGF0ZTogY3VycmVudF9zdGF0ZS5zdGF0ZVtrZXldLCBwYXRoOiBgJHtjdXJyZW50X3N0YXRlLnBhdGh9JHtrZXl9L2B9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB3aW5kb3cuYWxlcnQoSlNPTi5zdHJpbmdpZnkoc3RhdGVzLCBudWxsLCAyKSlcblxuICAgICAgICByZXR1cm4gIXBhdGgubGVuZ3RoXG4gICAgICAgICAgICA/IHRoaXMuZGF0YS5yb3V0ZXNbJzQwNCddXG4gICAgICAgICAgICA6IHN0YXRlc1swXT8uc3RhdGUgfHwgdGhpcy5kYXRhLnJvdXRlc1snNDA0J107XG4gICAgfVxuXG4gICAgaGFuZGxlU3RvcmFnZUNoYW5nZShjaGFuZ2VzLCBfbmFtZXNwYWNlKSB7XG4gICAgICAgIC8vIFRPRE8gOiBoYW5kbGUgbmFtZXNwYWNlIHNwZWNpZmljIGNoYW5nZXNcbiAgICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYW5nZXMpXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGhhbmRsZUluc3RhbGwoKSB7XG4gICAgICAgIGRiLnNldF9kYXRhKGRiLkRFRkFVTFRfREFUQSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnR29MaW5rcyBpbnN0YWxsZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRklYTUUgOiBjcmVhdGUgcmV0dXJucyB1bmRlZmluZWQuLi5cblxuICAgICAgICAvLyB0ZWFjaCBjaHJvbWUgdG8gdHJlYXQgYGdvL2AgYXMgYSBkb21haW4gaW5zdGVhZCBvZiBhcyBhIHNlYXJjaFxuICAgICAgICAvLyB0aGlzLkhPU1RfTkFNRVMuR09fRE9NQUlOUy5mb3JFYWNoKGFzeW5jIHVybCA9PiB7XG4gICAgICAgIC8vICAgICB0aGlzLmFwaS50YWJzLmNyZWF0ZSh7dXJsOiB1cmwsIGFjdGl2ZTogZmFsc2V9KT8udGhlbihuZXdUYWIgPT4ge1xuICAgICAgICAvLyAgICAgICAgIHRoaXMuYXBpLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKCh0YWJJZCwgY2hhbmdlSW5mbykgPT4ge1xuICAgICAgICAvLyAgICAgICAgICAgICBpZiAodGFiSWQgPT09IG5ld1RhYi5pZCAmJiAoY2hhbmdlSW5mby5zdGF0dXMgPT09ICdjb21wbGV0ZScgfHwgY2hhbmdlSW5mby5zdGF0dXMgPT09ICdsb2FkaW5nJykpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIHRoaXMuYXBpLnRhYnMucmVtb3ZlKHRhYklkKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIH0pXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICB9XG59XG5cblxuXG5cbiIsImltcG9ydCB7QVBJfSBmcm9tICcuLi9hcGlzL2FwaS5qcyc7XG5cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRfZGF0YShuYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBBUEkuc3RvcmFnZS5sb2NhbC5nZXQobmFtZXNwYWNlIHx8IG51bGwsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gIW5hbWVzcGFjZSA/IHJlc3VsdCA6IHJlc3VsdFtuYW1lc3BhY2VdO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRfZGF0YShkYXRhKSB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQVBJLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9EQVRBID0ge1xuICAgIHJvdXRlczoge1xuICAgICAgICAnNDA0JzogJ2h0dHBzOi8vaHR0cC5jYXQvNDA0JyxcbiAgICAgICAgJ2dvJzoge1xuICAgICAgICAgICAgJ2dpdGh1Yic6ICdodHRwczovL2dpdGh1Yi5jb20vc29mdHdhcmVCeUFuZGknLFxuICAgICAgICAgICAgJ2NoYXQnOiAnaHR0cHM6Ly9jaGF0Lm9wZW5haS5jb20nLFxuICAgICAgICAgICAgJ2dtYWlsJzogJ2h0dHBzOi8vbWFpbC5nb29nbGUuY29tL21haWwvdS8wLyNpbmJveCcsXG4gICAgICAgICAgICAnZ29vZ2xlX2NhbGVuZGFyJzogJ2h0dHBzOi8vY2FsZW5kYXIuZ29vZ2xlLmNvbS9jYWxlbmRhci9yJyxcbiAgICAgICAgfSxcbiAgICAgICAgJ2dpdCc6IHtcbiAgICAgICAgICAgICdob21lJzogJ2h0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0d2FyZUJ5QW5kaScsXG4gICAgICAgIH0sXG4gICAgICAgICdsZWFybic6IHtcbiAgICAgICAgICAgICd2dWxrYW4nOiB7XG4gICAgICAgICAgICAgICAgJ3R1dG9yaWFsJzogJ2h0dHBzOi8vdnVsa2FuLXR1dG9yaWFsLmNvbS8nLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnZG9jcyc6IHtcbiAgICAgICAgICAgICd2dWxrYW4nOiB7XG4gICAgICAgICAgICAgICAgJ2hvbWUnOiAnaHR0cHM6Ly93d3cua2hyb25vcy5vcmcvdnVsa2FuLycsXG4gICAgICAgICAgICAgICAgJ3NwZWMnOiAnaHR0cHM6Ly93d3cua2hyb25vcy5vcmcvcmVnaXN0cnkvdnVsa2FuL3NwZWNzLzEuMi1leHRlbnNpb25zL2h0bWwvaW5kZXguaHRtbCcsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGtleXdvcmRzOiB7XG4gICAgICAgICdnaXRodWInOiB0cnVlLFxuICAgICAgICAnbGVhcm4nOiB0cnVlLFxuICAgICAgICAnc3R1ZHknOiB0cnVlLFxuICAgICAgICAnZG9jdW1lbnRhdGlvbic6IHRydWUsXG4gICAgICAgICd0dXRvcmlhbCc6IHRydWUsXG4gICAgICAgICdnb29nbGVfZHJpdmUnOiB0cnVlLFxuICAgICAgICAndnVsa2FuJzogdHJ1ZSxcbiAgICAgICAgJ2dtYWlsJzogdHJ1ZSxcbiAgICAgICAgJ2dvb2dsZV9jYWxlbmRhcic6IHRydWUsXG4gICAgfSxcbiAgICBhbGlhc2VzOiB7XG4gICAgICAgICdnaCc6ICdnaXRodWInLFxuICAgICAgICAnZ2l0JzogJ2dpdGh1YicsXG4gICAgICAgICdsJzogJ2xlYXJuJyxcbiAgICAgICAgJ2xuJzogJ2xlYXJuJyxcbiAgICAgICAgJ2xybic6ICdsZWFybicsXG4gICAgICAgICdzJzogJ3N0dWR5JyxcbiAgICAgICAgJ3N0JzogJ3N0dWR5JyxcbiAgICAgICAgJ2RvYyc6ICdkb2N1bWVudGF0aW9uJyxcbiAgICAgICAgJ2RvY3MnOiAnZG9jdW1lbnRhdGlvbicsXG4gICAgICAgICd0dXQnOiAndHV0b3JpYWwnLFxuICAgICAgICAnZCc6ICdnb29nbGVfZHJpdmUnLFxuICAgICAgICAnZHInOiAnZ29vZ2xlX2RyaXZlJyxcbiAgICAgICAgJ2dkJzogJ2dvb2dsZV9kcml2ZScsXG4gICAgICAgICdkcml2ZSc6ICdnb29nbGVfZHJpdmUnLFxuICAgICAgICAndmsnOiAndnVsa2FuJyxcbiAgICAgICAgJ20nOiAnZ21haWwnLFxuICAgICAgICAnZ20nOiAnZ21haWwnLFxuICAgICAgICAnbWFpbCc6ICdnbWFpbCcsXG4gICAgICAgICdlbWFpbCc6ICdnbWFpbCcsXG4gICAgICAgICdjJzogJ2dvb2dsZV9jYWxlbmRhcicsXG4gICAgICAgICdnYyc6ICdnb29nbGVfY2FsZW5kYXInLFxuICAgICAgICAnY2FsJzogJ2dvb2dsZV9jYWxlbmRhcicsXG4gICAgICAgICdjYWxlbic6ICdnb29nbGVfY2FsZW5kYXInLFxuICAgIH1cbn07XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7QVBJfSBmcm9tICcuLi8uLi9hcGlzL2FwaS5qcyc7XG5pbXBvcnQge0JhY2tncm91bmR9IGZyb20gXCIuLi9iYWNrZ3JvdW5kLmpzXCI7XG5cbmNvbnN0IGJhY2tncm91bmQgPSBuZXcgQmFja2dyb3VuZChBUEkpO1xuYmFja2dyb3VuZC5ydW4oKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=