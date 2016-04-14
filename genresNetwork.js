var fs = require('fs');
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var d3 = require("d3")

var converter = new Converter({});

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

function k_combinations(set, k) {
	var i, j, combs, head, tailcombs;

	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}

	// K-sized set has only one K-sized subset.
	if (k == set.length) {
		return [set];
	}

	// There is N 1-sized subsets in a N-sized set.
	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}

	// Assert {1 < k < set.length}

	// Algorithm description:
	// To get k-combinations of a set, we want to join each element
	// with all (k-1)-combinations of the other elements. The set of
	// these k-sized sets would be the desired result. However, as we
	// represent sets with lists, we need to take duplicates into
	// account. To avoid producing duplicates and also unnecessary
	// computing, we use the following approach: each element i
	// divides the list into three: the preceding elements, the
	// current element i, and the subsequent elements. For the first
	// element, the list of preceding elements is empty. For element i,
	// we compute the (k-1)-computations of the subsequent elements,
	// join each with the element i, and store the joined to the set of
	// computed k-combinations. We do not need to take the preceding
	// elements into account, because they have already been the i:th
	// element so they are already computed and stored. When the length
	// of the subsequent list drops below (k-1), we cannot find any
	// (k-1)-combs, hence the upper limit for the iteration:
	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		// head is a list that includes only our current element.
		head = set.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}

//"name","url","info","likes","genre","img","administrators","bio","albums"
var data = fs.readFileSync('data/rock.tsv');
var nodesRAW = [], nodes = [], edges = [], nonAttivi = []

d3.tsv.parse(data.toString(), function(a){
	// console.log("artist:",a.name)
	//generate array with all the sources (then we will remove duplicates)
	a.genre.replace("  (NON PIU\' ATTIVO)", "").split(", ").forEach(function(e){
      e = e.trim()
      nodesRAW.push(e)
    })
    
	if (a.genre.replace("  (NON PIU\' ATTIVO)", "").split(", ").length > 1) {
		//calculate edges
	    k_combinations( a.genre.trim().replace("  (NON PIU\' ATTIVO)", "").split(", "), 2 ).forEach(function(e){
	      edges.push({
	        sourceLabel:e[0],
	        targetLabel:e[1]
	      })
	    })
	}
}, function(error, rows) {
	console.log(rows);
});

//remove dublicates in nodes array & replace edges names with includes
nodesRAW = d3.set(nodesRAW).values()

	nodesRAW.forEach(function(n,i){
    nodes.push({
		label:n,
		id: i+1
    })
})
nodes.forEach(function(n,i){
	n.id = i+1
})

edges.forEach(function(e){
	nodes.forEach(function(n){
		if (e.sourceLabel == n.label) e.source = n.id
		if (e.targetLabel == n.label) e.target = n.id
	})
})

writeCsv(nodes, ['id','label'], 'data/genres-network/nodes');
writeCsv(edges, ['source','target'], 'data/genres-network/edges');








// converter.fromString(data.toString(), function(err,result){
//   // console.log(result)
//   result.forEach(function(b){
//     // console.log(b.genre)

//     //generate array with all the sources (then we will remove duplicates)
//     b.genre.replace("  (NON PIU\' ATTIVO)", "").split(", ").forEach(function(e){
//       nodesRAW.push(e)
//     })
//     //calculate edges
//     k_combinations(b.genre.replace("  (NON PIU\' ATTIVO)", "").split(", "), 2).forEach(function(e){
//       edges.push({
//         sourceLabel:e[0],
//         targetLabel:e[1]
//       })
//     })
//   })

//   //remove dublicates in nodes array & replace edges names with includes
//   nodesRAW = d3.set(nodesRAW).values()

//   nodesRAW.forEach(function(n,i){
//     nodes.push({
//       label:n,
//       id: i+1
//     })
//   })
//   nodes.forEach(function(n,i){
//     n.id = i+1
//   })

//   edges.forEach(function(e){
//     nodes.forEach(function(n){
//       if (e.sourceLabel == n.label) e.source = n.id
//       if (e.targetLabel == n.label) e.target = n.id
//     })
//   })

//   writeCsv(nodes, ['id','label'], 'genres-network/nodes');
//   writeCsv(edges, ['source','target'], 'genres-network/edges');
// });
