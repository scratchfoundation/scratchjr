import IO from './IO';
import Localization from '../utils/Localization';

let path;
let samples;
let backgrounds;
let sprites;
let legacySprites;
let sounds;
let keys = {};

export default class MediaLib {
    static get path () {
        return path;
    }

    static get samples () {
        return samples;
    }

    static get sprites () {
        return sprites;
    }

    static get backgrounds () {
        return backgrounds;
    }

    static get sounds () {
        return sounds;
    }

    static get keys () {
        return keys;
    }

    static loadMediaLib (root, whenDone) {
        IO.requestFromServer(root + 'media.json', (result) => {
            let parsedResult = JSON.parse(result);
            path = parsedResult.path;
            samples = parsedResult.samples;
            sprites = parsedResult.sprites;
            legacySprites = parsedResult.legacySprites;
            backgrounds = parsedResult.backgrounds;
            sounds = parsedResult.sounds;

            MediaLib.localizeMediaNames();
            MediaLib.generateKeys();

            whenDone();
        });
    }

    static localizeMediaNames () {
        // Localize names of sprites
        for (let i = 0; i < sprites.length; i++) {
            sprites[i].name = Localization.localize('CHARACTER_' + sprites[i].md5);
        }

        // Localize names of backgrounds
        for (let i = 0; i < backgrounds.length; i++) {
            backgrounds[i].name = Localization.localize('BACKGROUND_' + backgrounds[i].md5);
        }

        // Localize names of legacy sprites
        for (let i = 0; i < legacySprites.length; i++) {
            legacySprites[i].name = Localization.localize('CHARACTER_' + legacySprites[i].md5);
        }
    }

    static generateKeys () {
        for (let i = 0; i < backgrounds.length; i++) {
            var bg = backgrounds[i];
            keys[bg.md5] = {width: bg.width, height: bg.height, name: bg.name};
        }

        for (let i = 0; i < sprites.length; i++) {
            var spr = sprites[i];
            keys[spr.md5] = {width: spr.width, height: spr.height, name: spr.name};
        }

        // when we change sprites (or remove them) the old ones still need to be in keys
        // for projects that were created before the change
        for (let i = 0; i < legacySprites.length; i++) {
            var legacySpr = legacySprites[i];
            keys[legacySpr.md5] = {width: legacySpr.width, height: legacySpr.height, name: legacySpr.name};
        }
    }
}
