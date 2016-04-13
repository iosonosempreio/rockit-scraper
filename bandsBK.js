var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var nightmare = Nightmare({
  dock: true,
  openDevTools: true,
  show: true,
})

var date = new Date().toISOString().slice(0, 19);
var timeToWait = randomly(2000,500)
var columsHeaders = ["num","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"]
var artistsCSV = 'data/rock.tsv';

converter.fromString(fs.readFileSync('data/rock-links.csv').toString(), function(err,result){

  console.log("listOfUrls",result)

  var converter2 = new Converter({});
  var dataBands = fs.readFileSync(artistsCSV).toString()

  converter2.fromString(dataBands, function(err,bands){
    if (err) {console.log(err);throw err;}
    console.log("bands")
    i=bands[bands.length].num;
    console.log("Number of bandsUrls:",result.length, " - starting from:",i)
    scrapeBandsInfo(i);
    function scrapeBandsInfo(num){
      var thisArtist = {};
      nightmare
        .goto(listOfUrls[num])
        .wait(".content-left")
        .wait(timeToWait)
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
              nightmare
                .goto(listOfUrls[num]+"/discografia")
                .wait(timeToWait)
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
                      //Finished the collecting of information, push in the array object
            					thisArtist.id = num;
            					bands.push(thisArtist)
                      console.log(num,thisArtist.name,thisArtist.genre,thisArtist.albums.length)
                      appendLastArtist(artistsCSV, thisArtist)
                      writeCsv(bands, ["num","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"], fileName )
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


});

function writeCsv(arr, headers, name) {
    // console.log("writing csv");
    json2csv({ data: arr, fields: headers, del: '\t' }, function(err, csv) {
        if (err) console.log(err);
        // console.log(csv)
        fs.writeFile(name+'.csv', csv, function(err) {
            if (err) throw err;
            console.log('file CSV saved', new Date().toISOString().slice(0, 19));
        });
    });
}

function appendLastArtist(file, artist){
  // ["num","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"]
  var arrayObj = []
  arrayObj.push(artist)
  var newLine = "";
  json2csv({ data: arrayObj, fields: columsHeaders, del: '\t' }, function(err, csv) {
    newLine = "\n"+csv.replace('"num"\t"name"\t"url"\t"info"\t"likes"\t"genre"\t"img"\t"administrators"\t"bio"\t"albums"\n','')
  });

  fs.appendFile(file, newLine, function (err) {
    if (err) throw err;
    console.log('The "data to append" was appended to file!');
  });
}

function randomly(max,min) {
  return Math.random() * (max - min) + min;
}
