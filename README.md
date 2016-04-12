# rockit-scraper
A scraper for rockit.it

## How it works
Starting from a list of url artist's pages the scraper, this scraper is able to extract the following information:
- artist-id
- name
- url
- info (kind of profile and location)
- likes
- genres
- profile image url
- administrators of the page (to be refined since sometimes it gets some different link, but it is easy to recognize)
- biography (raw html)
- albums (in form of json object with name, date, cover image url, link to album page)

## How to run

### Local Machine
1. For collecting Artist page links run: `node rockit_bands_link.js` (within this file you have to tell the script which genre you want to scrape, find the link in the upper part of the code).
2. Once the first script has done (it takes some hours) a file with all the links has been created. Now you can run `node rockit_bands_info.js`

### Remote Ubuntu Server
1. Install some libraries (?)
2. Run the same scripts as above but append the following at the beginning `xvfb-run`, so: `xvfb-run node rockit_bands_link.js` and `xvfb-run node rockit_bands_info.js`
3. Use screen to make it scraping forever (https://help.ubuntu.com/community/Screen, https://www.mattcutts.com/blog/a-quick-tutorial-on-screen/)

## Credits
Used cool thing found around:
- nightmare.js
- d3.js
- electron
- cheerio.js
- csvtojson
- json2csv
- jquery