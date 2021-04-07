#!/bin/sh
cd ..;
/usr/local/bin/node ./node_modules/webpack/bin/webpack.js --mode=production
# /usr/local/bin/node ./node_modules/webpack/bin/webpack.js --mode=development
rm editions/free/src/app.bundle.js
rm editions/free/src/app.bundle.js.map
cp src/build/bundles/app.bundle.js editions/free/src/
cp src/build/bundles/app.bundle.js.map editions/free/src/