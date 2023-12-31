import {API} from '../apis/api.js';


export async function load_data(namespace) {
    return await new Promise((resolve, reject) => {
        API.storage.local.get(namespace || null, function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                const data = !namespace ? result : result[namespace];
                resolve(data)
            }
        });
    });
}

export async function set_data(data) {
    return await new Promise((resolve, reject) => {
        API.storage.local.set(data, function() {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data);
            }
        });
    })
}

export const DEFAULT_DATA = {
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
