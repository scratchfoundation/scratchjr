var MediaLib = function() {};

MediaLib.path ="./svglibrary/";

// Sample project names are localized in Samples.js
MediaLib.samples = [
	"samples/Star.txt"
]

// The names here are only for compatibility with the asset tool - they are localized below
MediaLib.backgrounds = [
	{"md5":"Farm.svg","width":480,"height":360,"ext":"svg","name":"Farm"}
]


// The names here are only for compatibility with the asset tool - they are localized below
MediaLib.sprites = [
{"md5":"Star.svg","width":80,"height":101,"ext":"svg","name":"Star","order":"characters,07 weather","tags":["characters","07 weather"]}
];

// Localize names of sprites
for (var i = 0; i < MediaLib.sprites.length; i++) {
    MediaLib.sprites[i].name = Localization.localize("CHARACTER_" + MediaLib.sprites[i].md5);
}

// Localize names of backgrounds
for (var i = 0; i < MediaLib.backgrounds.length; i++) {
    MediaLib.backgrounds[i].name = Localization.localize("BACKGROUND_" + MediaLib.backgrounds[i].md5);
}

// Generate dictionary references to sprites and backgrounds (MediaLib.keys)
MediaLib.keys = {};
for (var i = 0; i < MediaLib.backgrounds.length; i++) {
   var bg = MediaLib.backgrounds[i];
   MediaLib.keys[bg.md5] = {width: bg.width, height: bg.height, name: bg.name};
}

for (var i = 0; i < MediaLib.sprites.length; i++) {
   var spr = MediaLib.sprites[i];
   MediaLib.keys[spr.md5] = {width: spr.width, height: spr.height, name: spr.name};
}

MediaLib.sounds =  ["pop.mp3"];
