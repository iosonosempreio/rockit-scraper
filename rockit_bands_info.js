var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var nightmare = Nightmare({
  show: false,
  openDevTools: false
})

function writeCsv(arr, headers, name) {
    // console.log("writing csv");
    json2csv({ data: arr, fields: headers }, function(err, csv) {
        if (err) console.log(err);
        // console.log(csv)
        fs.writeFile(name+'.csv', csv, function(err) {
            if (err) throw err;
            console.log('file CSV saved');
        });
    });
}
var date = new Date().toISOString().slice(0, 19);

//get bands links from external CSV
var category = "Rock";
var bands = [];
var fileName = "data/"+category+"_bands"+date;
var urlList = fs.readFileSync('data/rockit_Rock_2016-04-10.csv');

converter.fromString(urlList.toString(), function(err,result){
  console.log("Number of bandsUrls:",result.length)
  var listOfUrls=[];
  result.forEach(function(d,i){
    listOfUrls.push(d.url);
  })
  i=3837;
  scrapeBandsInfo(i);
  function scrapeBandsInfo(num){
    var thisArtist = {};
    nightmare
      .goto(listOfUrls[num])
      .wait(".content-left")
      .wait(Math.random() * (3000 - 500) + 500)
      .inject('js', 'node_modules/jquery/dist/jquery.js')
      .evaluate(function () {
          //take the container of all the relevant info
          return $("div.content-left").html()
      })
      .then(function(html){
        // console.log(listOfUrls[num])

        $ = cheerio.load(html);
        thisArtist.name = $("a.nome-artista").text();
        thisArtist.url = listOfUrls[num];
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

        nightmare
          .goto(listOfUrls[num]+"/biografia")
          .wait(".content-left")
          .wait(Math.random() * (3000 - 500) + 500)
          .inject('js', 'node_modules/jquery/dist/jquery.js')
          .evaluate(function () {
              //take the container of all the relevant info
              return $(".content-left").html()
          })
          .then(function(html){
            $ = cheerio.load(html);
            thisArtist.bio = $(".box-blocco").html()
            //Get albums
            nightmare
              .goto(listOfUrls[num]+"/discografia")
              .wait(Math.random() * (3000 - 500) + 500)
              .inject('js', 'node_modules/jquery/dist/jquery.js')
              .evaluate(function () {
                  //take the container of all the relevant info
                  return $(".content-left").html()
              })
              .then(function(html){
                thisArtist.albums = []
                $ = cheerio.load(html);
                console.log("dischi per questo artista:", $(".post").length)
                $(".post").each(function(){
                  thisArtist.albums.push({
                    'name': $(this).find(".titolo .artista").text(),
                    'date': $(this).find(".titolo .anno").text(),
                    'cover': 'http://www.rockit.it'+$(this).find("img").attr("src"),
                    'link': 'http://www.rockit.it'+$(this).find("a").attr("href")
                  })
                })

                nightmare
                  .goto(listOfUrls[num]+"/articoli")
                  .wait(Math.random() * (3000 - 500) + 500)
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
                    //Finished the collecting of information, push in the array object
                    bands.push(thisArtist)
                    console.log(num,thisArtist)
                    writeCsv(bands, ["name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"], fileName )
                    //go on with iterative function
                    num++;
                    if (num<listOfUrls.length){
                      scrapeBandsInfo(num)
                    }
                  })
              })
          })
      })
  }

});
