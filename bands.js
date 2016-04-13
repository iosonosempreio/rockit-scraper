var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var nightmare = Nightmare({
  show: true,
  openDevTools: false
})

function writeCsv(arr, headers, name) {
    // console.log("writing csv");
    json2csv({ data: arr, fields: headers }, function(err, csv) {
        if (err) console.log(err);
        // console.log(csv)
        fs.writeFile(name+'.csv', csv, function(err) {
            if (err) throw err;
            console.log('file CSV saved', new Date().toISOString().slice(0, 19));
        });
    });
}

function ReadAppend(file, appendFile){
  fs.readFile(appendFile, function (err, data) {
    if (err) throw err;
    console.log('File was read');

    fs.appendFile(file, data, function (err) {
      if (err) throw err;
      console.log('The "data to append" was appended to file!');

    });
  });
}

function appendLastArtist(file, artist){
  // ["num","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"]
  var arrayObj = []
  arrayObj.push(artist)
  var newLine = "";
  json2csv({ data: arrayObj, fields: columsHeaders }, function(err, csv) {
    newLine = "\n"+csv.replace('"num","name","url","info","likes","genre","img","administrators","bio","albums"\n','')
  });

  fs.appendFile(file, newLine, function (err) {
    if (err) throw err;
    console.log('The "data to append" was appended to file!');
  });
}

function randomly(max,min) {
  return Math.random() * (max - min) + min;
}

// // edit this with your file names
// file = 'name_of_main_file.csv';
// appendFile = 'name_of_second_file_to_combine.csv';
// ReadAppend(file, appendFile);

var date = new Date().toISOString().slice(0, 19);

var timeToWait = randomly(2000,500)

var columsHeaders = ["num","name", "url", "info", "likes", "genre", "img", "administrators", "bio", "albums"]

//get bands links from external CSV
var category = "Rock";
var bands = [];
var fileName = "data/"+category+"_bands"+date;

converter.fromString(fs.readFileSync('data/rockit_Rock_2016-04-10.csv').toString(), function(err,result){
  var listOfUrls=[];
  result.forEach(function(d,i){
    listOfUrls.push(d.url);
  })
  var artistsCSV = 'data/bands_rock.csv';
  var converter2 = new Converter({});
  converter2.fromString(fs.readFileSync(artistsCSV).toString(), function(err,bands){
    if (err) throw err;

    i=bands[bands.length-1].num;
    i++
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
  					thisArtist.num = num;
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
