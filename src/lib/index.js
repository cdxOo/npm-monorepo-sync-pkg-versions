'use strict';
var { promisify } = require('util');
var os = require('os');
var fs = require('fs');
var fspath = require('path');

var globby = require('globby');
var jph = require('json-parse-helpfulerror');
var semutils = require('semver-utils');

var readFile = (...args) => promisify(fs.readFile)(...args, 'utf8');
var writeFile = promisify(fs.writeFile);

var run = async (options) => {
    var { only, fix, prefix, jsonSpaces } = options;

    var paths = globby.sync(
        ['**/package.json'],
        { ignore: '**/node_modules/**'}
    );

    //console.log(options);
    var store = await analyze(paths, { only });
    if (options.fix) {
        try {
            await fixVersions({ store, prefix, jsonSpaces });
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    else {
        console.log(JSON.stringify(store, undefined, 2));
    }
}

var fixVersions = async (bag) => {
    var { store, prefix, jsonSpaces } = bag;
   
    var todo = [];
    for (var name of Object.keys(store)) {
        var versions = [];
        var paths = [];

        for (var version of Object.keys(store[name])) {
            versions.push(version);
            paths.push(...store[name][version]);
        }

        todo.push({ name, versions, paths });
    }

    if (!prefix) {
        for (var it of todo) {
            var { name, versions } = it;
            // FIXME: this wont work with wierd version defintions
            var prefixVariants = (
                versions
                .map(it => semutils.parseRange(it)[0].operator)
                .filter((it, ix, self) => self.indexOf(it) === ix)
            );
            if (prefixVariants.length > 1) {
                throw new Error(`prefix inconsistency in "${name}" must be resolved manually, use --prefix "[variant]"`)
            }
        }
    }

    // FIXME: this is slow but i dont care right now
    for (var it of todo) {
        var { name, versions, paths } = it;
        var latest = versions.sort().pop();

        if (prefix) {
            latest = latest.replace(/^[^0-9]*/, getRealPrefix(prefix));
        }
        console.log(name, latest);

        for (var path of paths) {
            var data = jph.parse(await readFile(path));
            var shouldWrite = false;
            if (data.dependencies && data.dependencies[name]) {
                if (latest !== data.dependencies[name]) {
                    shouldWrite = true;
                }
                data.dependencies[name] = latest;
            }
            if (data.devDependencies && data.devDependencies[name]) {
                if (latest !== data.devDependencies[name]) {
                    shouldWrite = true;
                }
                data.devDependencies[name] = latest;
            }
            if (shouldWrite) {
                await writeFile(
                    path, JSON.stringify(data, undefined, jsonSpaces)
                );
            }
        }
    }
}

var getRealPrefix = (label) => ({
    'patch': '~',
    'minor': '^',
    'above': '>='
}[label]);

var analyze = async (paths, options) => {
    var { only } = options;
    var store = {};
    for (var path of paths) {
        var content = await readFile(path);
        var parsed = jph.parse(content);
        var bag = { store, path, only };

        if (parsed.dependencies) {
            extract({ ...bag, deps: parsed.dependencies });
        }
        if (parsed.devDependencies) {
            extract({ ...bag, deps: parsed.devDependencies });
        }
    }
    
    for (var name of Object.keys(store)) {
        if (Object.keys(store[name]).length < 2) {
            //console.log(name, Object.keys(versions[name]).length)
            delete store[name];
        }
    }
    return store;
}

var extract = (bag) => {
    var { store, path, deps, only } = bag;

    var names = Object.keys(deps).filter(it => (
        !only || only && only.includes(it)
    ));

    for (var name of names) {
        var version = deps[name];
        if (!store[name]) {
            store[name] = { [version]: [ path ]};
        }
        else {
            if (!store[name][version]) {
                store[name][version] = [path];
            }
            else {
                store[name][version].push(path);
            }
        }
    }
}

module.exports = run;
