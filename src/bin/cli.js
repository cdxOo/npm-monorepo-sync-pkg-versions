'use strict';
var { program } = require('commander');
var pkg = require('../../package.json');
var fixer = require('../lib');

program
    .version(pkg.version)
    .description('some description')
    .usage('some usage')

var cliOptions = [
    {
        long: 'foo',
        short: 'f',
        arg: 'int',
        description: 'foo descr',
        defaults: 42,
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

    program.option(
        `${short}${long}${arg}`,
        description,
        parse,
        defaults
    )
}

program.parse(process.argv);
fixer({
    ...program.opts,
    cli: true
});
