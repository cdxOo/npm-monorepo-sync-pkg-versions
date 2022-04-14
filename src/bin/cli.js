#!/usr/bin/env node

'use strict';
var { program } = require('commander');
var pkg = require('../../package.json');
var fixer = require('../lib');

program
    .version(pkg.version)
    .description('some description')
    .usage('some usage')

var cliOptions = [
    //{
    //    long: 'foo',
    //    short: 'f',
    //    arg: 'int',
    //    description: 'foo descr',
    //    defaults: 42,
    //    parse: str => parseInt(str)
    //},
    {
        long: 'only',
        arg: 'packages...',
        description: 'only include the given packages',
        parse: (it, acc) => ([ ...acc, it ]),
        defaults: []
    },
    {
        long: 'fix',
        description: 'fix version inconsistencies using the latest local version',
    },
    {
        long: 'prefix',
        arg: ['exact', 'patch', 'minor', 'above'],
        description: 'enforce semver prefix; patch = "~", minor="^", above=">="'
    },
    {
        long: 'json-spaces',
        arg: 'n',
        description: 'output json indent spacing',
        defaults: 2,
        parse: str => parseInt(str)
    }
]

var identity = x => x;

for (var it of cliOptions) {
    var {
        long,
        short,
        arg,
        description,
        defaults,
        parse = identity
    } = it;

    short = short ? `-${short}, ` : '';
    long = `--${long}`;
    arg = arg ? ` <${arg}>` : '';

    var def = `${short}${long}${arg}`;
    program.option(
        def,
        description,
        parse,
        defaults
    )
}

program.parse(process.argv);
fixer({
    ...program.opts(),
    cli: true
});
