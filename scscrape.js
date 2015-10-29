#!/usr/bin/env node
// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var downloader = require('./lib/downloader');
var ArgumentParser = require('argparse').ArgumentParser;

// Data from our package, where we keep app-specific configuration.
var packageData = require('./package.json');
var appVersion = packageData.name + ' (' + packageData.version + ')';

var rootParser = new ArgumentParser({
  'version': appVersion,
  'addHelp': true,
  'description': 'Downloads playlists from Soundcloud. To set a permanent download directory, set environment variable $SCSCRAPE_DIR.',
  'epilog': 'See <http://github.com/msikma/scscrape> for more information.'
});
rootParser.addArgument(['--url'], {
  'type': 'string',
  'required': true,
  'help': 'Specify a Soundcloud playlist URL to download.'
});
rootParser.addArgument(['--target'], {
  'type': 'string',
  'required': false,
  'help': 'Target directory to download to. Overrides environment variable.'
});
var args = rootParser.parseArgs();

if (args.target != null) {
  // If we've got a target directory, set it.
  downloader.setTargetDir(args.target);
}
else if (process.env.SCSCRAPE_DIR) {
  // The environment variable has second priority.
  downloader.setTargetDir(process.env.SCSCRAPE_DIR);
}

// Verify that we're able to save files and use cURL.
downloader.verifyEnv().then(function() {
  // Retrieve playlist info, then begin retrieving their actual download links.
  downloader.downloadPlaylist(args.url);
});
