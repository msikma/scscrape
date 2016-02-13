**Don't use this. It's not working correctly anymore.**

I recommend that you try using [youtube-dl](https://rg3.github.io/youtube-dl/), which works with Soundcloud URLs.

scscrape
========

This is a small script that downloads whole Soundcloud sets, e.g. [https://soundcloud.com/3beat/sets/skepta-blacklisted](https://soundcloud.com/3beat/sets/skepta-blacklisted). It downloads the MP3 files, the cover image, and adds a text file with the description.

It uses [9soundclouddownloader.com](http://9soundclouddownloader.com/) to actually get the MP3 URLs for now, because I'm not sure how to fetch those URLs myself. I'll change that at some point in the future if I have time.

Usage
-----

```
usage: scscrape.js [-h] [-v] --url URL [--target TARGET]

Downloads playlists from Soundcloud. To set a permanent download directory, 
set environment variable $SCSCRAPE_DIR.

Optional arguments:
  -h, --help       Show this help message and exit.
  -v, --version    Show program's version number and exit.
  --url URL        Specify a Soundcloud playlist URL to download.
  --target TARGET  Target directory to download to. Overrides environment 
                   variable.

See <http://github.com/msikma/scscrape> for more information.
```

Copyright
---------

MIT licensed.
