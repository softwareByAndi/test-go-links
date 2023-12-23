import {API} from '../../apis/api.js';
import {Background} from "../background.js";

const background = new Background(API);
background.run();