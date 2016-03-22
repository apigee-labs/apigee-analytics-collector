#!/usr/bin/env node

var program = require('commander');

program
    .command('traffic', 'Export traffic data.')
    .parse(process.argv);