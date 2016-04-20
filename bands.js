var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var fs = require('fs');
var d3 = require('d3');
var json2csv = require('json2csv');

var nightmare = Nightmare({
  dock: true,
  openDevTools: true,
  waitTimeout: 10000, // in ms
  show: true,
})

var date = new Date().toISOString().slice(0, 19),
    timeToWait = randomly(500,10),
    columsHeaders = ["id","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums", "articles"],
    profileLinks = "data/rock-links.csv",
    savedArtists = 'data/rock.tsv',
    bands=[],
    doneInSession=0,
    fileName = "data/rockDump"+date


fs.readFile(profileLinks, function(err,links){
  links = d3.csv.parse(links.toString())
  console.log("Links of artist's pages:", links.length)

  var profiles = fs.readFileSync(savedArtists);
  profiles = d3.tsv.parse(profiles.toString());
  console.log("Last saved id:",profiles[profiles.length-1].id,"Starting with id",(1*profiles[profiles.length-1].id+1))
  scrapeBandsInfo((1*profiles[profiles.length-1].id),links);
  function scrapeBandsInfo(num,links){
    var thisArtist = {};
    thisArtist.id = num+1;
    console.log("Scraping:",links[num].url)
    nightmare
      .goto(links[num].url)
      .wait(".content-left")
      .wait(timeToWait)
      .inject('js', 'node_modules/jquery/dist/jquery.js')
      .evaluate(function () {
          //take the container of all the relevant info
          return $("div.content-left").html()
      })
      .then(function(html){
        $ = cheerio.load(html);
        thisArtist.name = $("a.nome-artista").text();
        thisArtist.url = links[num].url;
        thisArtist.info = $("div.titolo>div>h4").text();
        thisArtist.likes = $(".testata-artista div.et-preferiti span.num").text();
        thisArtist.genre = $(".testata-artista div.et-gialla div.label").text();
        thisArtist.img = $(".testata-artista .cover").css('background-image');
        thisArtist.administrators = [];
        $(".box-blocco.blocco-articoli .box-table a.post").each(function(){
          thisArtist.administrators.push($(this).attr('href'))
        })
        // Problems in getting social links
        // thisArtist.linkSocials = [];
        // $("div.box-social ul li").each(function(){
        //   thisArtist.linkSocials.push( $(this).attr('href') );
        // })
        // Get Bio
        console.log("Scraping:",links[num].url+"/biografia")
        nightmare
          .goto(links[num].url+"/biografia")
          .wait(".content-left")
          .wait(timeToWait)
          .inject('js', 'node_modules/jquery/dist/jquery.js')
          .evaluate(function () {
              //take the container of all the relevant info
              return $(".content-left").html()
          })
          .then(function(html){
            $ = cheerio.load(html);
            thisArtist.bio = $(".box-blocco").html()
            //Get albums
            console.log("Scraping:",links[num].url+"/discografia")
            nightmare
              .goto(links[num].url+"/discografia")
              .wait(timeToWait)
              .inject('js', 'node_modules/jquery/dist/jquery.js')
              .evaluate(function () {
                  //take the container of all the relevant info
                  return $(".content-left").html()
              })
              .then(function(html){
                thisArtist.albums = []
                $ = cheerio.load(html);
                // console.log("dischi per questo artista:", $(".post").length)
                $(".post").each(function(){
                  thisArtist.albums.push({
                    'name': $(this).find(".titolo .artista").text(),
                    'date': $(this).find(".titolo .anno").text(),
                    'cover': 'http://www.rockit.it'+$(this).find("img").attr("src"),
                    'link': 'http://www.rockit.it'+$(this).find("a").attr("href")
                  })
                })
                // Get articles
                console.log("Scraping:",links[num].url+"/articoli")
                nightmare
                  .goto(links[num].url+"/articoli")
                  .wait(timeToWait)
                  .inject('js', 'node_modules/jquery/dist/jquery.js')
                  .evaluate(function () {
                      //take the container of all the relevant info
                      return $(".content-left").html()
                  })
                  .then(function(html){
                    thisArtist.articles = []
                    $ = cheerio.load(html);
                    $("a.post").each(function(){
                      thisArtist.articles.push({
                        'title': $(this).find(".titolo").text(),
                        'url': 'http://www.rockit.it'+$(this).attr("href"),
                        'date': $(this).find(".data").text()
                      })
                    })
                    // console.log(thisArtist)
                    //Finished the collecting of information, push in the array object
                    bands.push(thisArtist)
                    doneInSession++
                    console.log("Done:",thisArtist.id, thisArtist.name," - Bands done in this session:",doneInSession)
                    appendLastArtist(savedArtists, thisArtist, columsHeaders)
                    if(bands.length%20 == 0){
                      writeCsv(bands, columsHeaders, fileName )
                      bands = []
                      date = new Date().toISOString().slice(0, 19);
                    }
                    //go on with iterative function
                    num++;
                    if (num<=links.length) {
                      scrapeBandsInfo(num,links)
                    }
                  })
              })
          })
      })
  } //Scrape Bands Info
})

function writeCsv(arr, headers, name) {
    json2csv({ data: arr, fields: headers, del: '\t', hasCSVColumnTitle:true, eol:'' }, function(err, tsv) {
        if (err) console.log(err);
        // console.log(tsv)
        fs.writeFile(name+'.tsv', tsv, function(err) {
            if (err) throw err;
            console.log(name+'.tsv','file TSV saved');
        });
    });
}

function appendLastArtist(file, artist, headers){
  // ["id","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"]
  json2csv({ data: artist, fields: headers, del: '\t', hasCSVColumnTitle:false, eol:'\n' }, function(err, tsv) {
      if (err) console.log(err);
      // console.log(tsv)
      fs.appendFileSync(file, tsv//, function (err) {
        // if (err) throw err;
        // console.log(artist.name,'appended to file!');
      //}
      );
      console.log(new Date().toISOString().slice(11, 19), artist.name,'appended to file!')
  });
}

function randomly(max,min) {
  return Math.random() * (max - min) + min;
}
