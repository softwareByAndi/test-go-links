import * as db from "./manage_data.js";

export class Background {
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
        db.load_data(null).then(data => {
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

    handleStorageChange(changes, namespace) {
        // TODO : handle namespace specific changes
        if (changes) {
            console.log(changes)
        }
    }


    handleInstall() {
        db.set_data(db.DEFAULT_DATA).then(() => {
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




