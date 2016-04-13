var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var listCSVs = [
  "data/Rock_bands2016-04-10.csv",
  "data/Rock_bands2016-04-11T07:49:09.csv",
  "data/Rock_bands2016-04-11T08:43:07.csv",
  "data/Rock_bands2016-04-11T16:29:04.csv"
]

var artists = [];
listCSVs.forEach(function(d){
  var singleCSV = fs.readFileSync('data/rockit_Rock_2016-04-10.csv').toString()
  converter.fromString(singleCSV, function(err,result){
    result.forEach(function(e){
      artists.push(e);
      console.log(artists.length)
    })
  })
});





// fs.readFile("data/rockit_Rock_2016-04-10.csv", function (err, data) {
//   converter.fromString(data.toString(), function(err,result){
//     result.forEach(function(a,i){
//       i=i+1;
//       console.log(i,a.url)
//
//     })
//   })
// })
