#!/usr/bin/env node


var ArgumentParser = require('argparse').ArgumentParser;

// Data from our package, where we keep app-specific configuration.
var packageData = require('./package.json');
var appVersion = packageData.name + ' (' + packageData.version + ')';

var rootParser = new ArgumentParser({
  'version': appVersion,
  'addHelp': true,
  'description': 'Scrapes playlists from Soundcloud.',
  'epilog': 'See <http://github.com/some/url> for more information.'
});
rootParser.addArgument(['--url'], {
  'type': 'string',
  'required': true,
  'help': 'Specify the URL to scrape.'
});
rootParser.parseArgs();
