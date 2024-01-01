import * as db from '../background/manage_data.js'
import {set as _set} from 'lodash'
const MAX_DEPTH = 10;


async function load_data() {
    const list_element = document.getElementById('goLinksList');
    const data = await db.load_data();

    list_element.innerText = JSON.stringify(data.routes, null, 2);
    list_element.style = 'white-space: pre-wrap;';
}


async function set_data() {
    const key_element = document.getElementById('newGoLinkKey');
    const url_element = document.getElementById('newGoLinkURL');

    const [domain, ...keys] = key_element.value?.split('/');
    const url = url_element.value;

    if (!domain || !url) {
        alert('Please enter a domain and url');
        return;
    }
    if (keys?.length > MAX_DEPTH) {
        alert(`Max depth is ${MAX_DEPTH}`);
        return;
    }

    const data = await db.load_data();
    if (data?.routes?.[domain] === undefined) {
        alert(`${domain} is not a valid domain. valid domains include: ${
            Object.keys(data.routes)
                ?.filter(d => d !== '404')
                .join(', ')
        }`);
        return;
    }

    let current = data.routes[domain];
    const path = [domain];
    let depth = 0;
    // generates a path to the new key, creating new objects along the way.
    // As keys may be out of order, (due to combination paths logic), the path may be different from the keys array to prevent duplicate path combinations.
    while (keys.length > 0 && depth < MAX_DEPTH) {
        let found_key = undefined;
        for (const key of keys) {
            if (current[key] !== undefined) {
                found_key = key;
                console.log('found_key: ', key, ' : ', path.join(', '))
                break;
            }
        }
        if (found_key !== undefined) {
            const index = keys.indexOf(found_key);
            keys.splice(index, 1);
        } else {
            found_key = keys.shift();
        }
        if (typeof(current[found_key]) === "string") {
            const user_accept = confirm(`A key already exists at ${path.join('/')}/${found_key} : ${current[found_key]}.\n\n do you wish to overwrite it with ${path.join('/')}/${found_key}/${keys.join('/')} : ${url}?`);
            if (!user_accept) {
                return;
            }
            current[found_key] = undefined;
        }
        if (current[found_key] === undefined) {
            current[found_key] = {};
        }
        path.push(found_key)
        current = current[found_key];
        depth++;
        console.log(path, ' : ', depth, ' : ', current)
    }

    // FIXME : currently, all urls are end-points. so if go/github exists, then go/github/repositories cannot exist, and vice versa.
    // FIXME : have a __url__ key that is the redirect url.
    if (Object.keys(current)?.length > 0) {
        alert(`A key already exists at ${path.join('/')}`);
        return;
    } else {
       _set(data.routes, path, url)
    }
    console.log(`path: ${path.join('/')}`);
    console.log('data:', data)

    await db.set_data(data)
    await load_data();
}


function init() {
    const set_button = document.getElementById('saveGoLinkButton');
    set_button.onclick = set_data;
    load_data().then(() => {console.log('loaded data')})
}

init()
