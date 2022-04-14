'use strict';
var { promisify } = require('util');
var os = require('os');
var fs = require('fs');
var fspath = require('path');

var globby = require('globby');
var jph = require('json-parse-helpfulerror');

var readFile = (...args) => promisify(fs.readFile)(...args, 'utf8')

var run = async (options) => {
    console.log('foo');
    var paths = globby.sync(
        ['**/package.json'],
        { ignore: '**/node_modules/**'}
    );

    for (var path of [ paths[0] ]) {
        var content = await readFile(path);
        var parsed = jph.parse(content);
        console.log(parsed);
    }
}

module.exports = run;
