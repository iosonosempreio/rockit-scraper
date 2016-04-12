var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var fs = require('fs');
var json2csv = require('json2csv');

var nightmare = Nightmare({ show: true })

var date = new Date().toISOString().slice(0, 10);
var lst = [
  {
    genre:'Rock',
    url:'http://www.rockit.it/web/cercapagine.php?g=12'
  },
  {
    genre:'Ritmi',
    url:'http://www.rockit.it/web/cercapagine.php?g=82'
  },
  {
    genre:'Pop',
    url:'http://www.rockit.it/web/cercapagine.php?g=18'
  },
  {
    genre:'Cantautore',
    url:'http://www.rockit.it/web/cercapagine.php?g=1'
  },
  {
    genre:'Sperimentale',
    url:'http://www.rockit.it/web/cercapagine.php?g=8'
  }
];


saveURLs(3);

function saveURLs(num) {
  var thisGenre = lst[num].genre;
  var fileName = "rockit_" + thisGenre + "_" + date;
  nightmare
    .goto(lst[num].url)
    .wait('.paginaz')
    .inject('js', 'node_modules/jquery/dist/jquery.js')
    .evaluate(function () {
        //take the number of results for this genre
        return $("div.paginaz > span.gray").html().split(" ")[0]
    })
    .then(function(d) {
      console.log(lst[num].genre, lst[num].url, d);

      var bandUrls = []
      //Bands urls
      var j = 0;
      getBandsPages(j);
      function getBandsPages(num2){
        console.log(">>> Pag", num2, (lst[num].url+"&pag="+num2) )
        nightmare
          .goto(lst[num].url+"&pag="+num2)
          .wait('.results')
          .evaluate(function(){
            return $("#risultati-ricerca").html()
          })
          .then(function(html){
            //Look for the href of bands
            $ = cheerio.load(html);
            // console.log($(".results>li>.info>a"))
            var bnum = 0;
            scrapeBand(bnum);
            function scrapeBand(num3){
              //do things with nightmare
              var urlBand = "http://www.rockit.it" + $(".results>li>.info>a")[num3].attribs.href;
              bandUrls.push({url: urlBand, pagination: num2});
              num3++
              if (num3 < 10) {
                scrapeBand(num3);
              }
            }

            num2++;
            //if (num2 < d/10) {
            if ( num2 <= Math.floor(d/10)+1 ) {
              writeCsv(bandUrls, ["url", "pagination"], fileName )
              getBandsPages(num2);

            }
            else {
              writeCsv(bandUrls, ["url", "pagination"], fileName )
            }
          })
      }
    });
}


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
