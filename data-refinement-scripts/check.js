var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var problem = false;

converter.fromString(fs.readFileSync("data-refinement-sctripts/artists.txt").toString(), function(err,result){
  console.log("\t"+result[0].num);
  result.forEach(function(n,i){
    if (i+1 <result.length) {
      console.log(n.num+"\t"+result[i+1].num);
      if( n.num == result[i+1].num-1){
        // console.log("ok")
      } else {
        problem = true;
        console.log(n.num, result[i+1].num)
      }
    }
    else {

      console.log(n.num)
      if (!problem) console.log("everything seems to be fine");
      if (problem) console.log("It seems there is a problem");
    }
  })
})
