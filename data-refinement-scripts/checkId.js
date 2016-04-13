var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
var converter2 = new Converter({});

console.log(fs.readFileSync("data/rock_artists 2.csv").toString())

converter.fromString(fs.readFileSync("data/rock_artists 2.csv").toString(), function(err,artists){
  console.log(artists)
  converter2.fromString(fs.readFileSync("data/rockit_Rock_2016-04-10.csv").toString(), function(err,links){

    artists.forEach(function(a,i){
        links.forEach(function(l,j){
          if ( a.url == l.url ) {
            console.log(a.url,i," >>> ",l.url,j)
          }
        });

    })


  })
})
