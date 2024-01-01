import * as db from '../background/manage_data.js'
import {set as _set} from 'lodash'
const MAX_DEPTH = 10;

const input_elements = {

}
var data = undefined;

function init() {
    // INITIALIZATION
    load_data().then(() => { console.log('loaded data')})
    const button_set_golink = document.getElementById('button-save-golink');
    const button_set_alias = document.getElementById('button-save-alias');
    const nav_link_elems = [...document.querySelectorAll('.nav-golink-tabs') || []];
    input_elements.golink = {
        key: document.getElementById('input-golink-key'),
        url: document.getElementById('input-golink-url'),
        }
    input_elements.alias = {
        key: document.getElementById('input-alias-key'),
        tag: document.getElementById('input-alias-tag'),
    }


    // LISTENERS
    button_set_golink.onclick = set_golink;
    button_set_alias.onclick = set_alias;
    input_elements.alias.key .onkeyup = () => render_alias(search_alias()?.value);
    input_elements.alias.tag .onkeyup = () => render_alias(search_alias()?.value);
    input_elements.golink.key.onkeyup = () => render_golink(search_golink()?.value);
    input_elements.golink.url.onkeyup = () => render_golink(search_golink()?.value);


    for (const nav_link of nav_link_elems) {
        nav_link.onclick = () => {
            const tab_id = nav_link.getAttribute('data-tab-id');
            // console.log('tab_id: ', tab_id)
            const tab_elems = [...document.querySelectorAll('.tab') || []];
            // console.log('tab_elems: ', tab_elems)
            for (const tab_elem of tab_elems) {
                tab_elem.classList.add('hidden')
            }
            for (const nav_link of nav_link_elems) {
                nav_link.classList.remove('active');
            }
            const elem = document.getElementById(tab_id);
            elem.classList.remove('hidden');
            nav_link.classList.add('active');
        }
    }
}


async function load_data() {
    // INITIALIZATION
    data = await db.load_data();

    // RENDER
    render_golink(search_golink()?.value);
    render_alias(search_alias()?.value);
}

function render_golink(filtered_results) {
    const elem_view_golinks = document.getElementById('view-golinks');
    elem_view_golinks.innerText = JSON.stringify(filtered_results, null, 2);
    elem_view_golinks.style = 'white-space: pre-wrap;';
}
function render_alias(filtered_results) {
    const elem_view_aliases = document.getElementById('view-aliases');
    elem_view_aliases.innerText = JSON.stringify(filtered_results, null, 2);
    elem_view_aliases.style = 'white-space: pre-wrap;';
}

function search_golink() {
    // FIXME : move logic from set_golink into here
    // TODO : filter routes by search path
    return {
        errors: [], // TODO : add error checking and validations
        value: data.routes // FIXME : replace with filtered routes
    };
}

function search_alias() {
    // INITIALIZATION
    const _key = input_elements.alias.key?.value;
    const _tag = input_elements.alias.tag?.value;
    const key = _key?.trim()?.toLowerCase() || '';
    const tag = _tag?.trim()?.toLowerCase() || '';

    console.log('searching: ', key, ' : ', tag)

    // TRANSFORMATION
    const matching_aliases = (!key && !tag)
        ? data?.aliases
        : Object.fromEntries(
            Object.entries(data?.aliases || {})
                .filter(([k, t]) => (!!key && k.includes(key)) || (!!tag && t.includes(tag)) )
        )

    console.log('matching_aliases: ', matching_aliases)

    return {
        errors: [], // TODO : add error checking and validations
        value: matching_aliases
    };
}


async function set_golink() {
    // INITIALIZATION
    const key_element = document.getElementById('input-golink-key');
    const url_element = document.getElementById('input-golink-url');
    const [domain, ...raw_keys] = key_element.value?.split('/');
    const url = url_element.value;

    if (!domain || !url) { // VALIDATION
        alert('Please enter a domain and url');
        return;
    }
    if (raw_keys?.length > MAX_DEPTH) { // VALIDATION
        alert(`Max depth is ${MAX_DEPTH}`);
        return;
    }

    data = await db.load_data(); // INITIALIZATION
    if (data?.routes?.[domain] === undefined) { // VALIDATION
        alert(`${domain} is not a valid domain. valid domains include: ${
            Object.keys(data.routes)
                ?.filter(d => d !== '404')
                .join(', ')
        }`);
        return;
    }

    // TRANSFORMATION & SEARCH
    const keys = raw_keys.map(key => data?.aliases?.[key] || key)
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
        // VALIDATION
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
    if (Object.keys(current)?.length > 0) { // VALIDATION
        alert(`A key already exists at ${path.join('/')}`);
        return;
    } else {
        _set(data.routes, path, url)
    }
    console.log(`path: ${path.join('/')}`);
    console.log('data:', data)

    // PERSISTENCE
    await db.set_data(data)
    await load_data();
}


async function set_alias() {
    // INITIALIZATION
    const key = document.getElementById('input-alias-key')?.value;
    const tag = document.getElementById('input-alias-tag')?.value;
    if (!key || !tag) { // VALIDATION
        alert('Please enter a key and tag');
        return;
    }
    data = await db.load_data();
    if (!data) { // VALIDATION
        alert('No data found');
        return;
    }
    if (!data.aliases) { // INITIALIZATION
        data.aliases = {};
    }
    if (data.aliases[key] !== undefined) { // VALIDATION
        const user_accept = confirm(`An alias already exists for ${key} = ${data.aliases[key]}. Do you wish to overwrite it with ${key} = ${tag}? \n note that this will affect aliased paths that others may be using.`);
        if (!user_accept) {
            return;
        }
    }

    // PERSISTENCE
    data.aliases[key] = tag;
    await db.set_data(data);
    await load_data();
}



init()
