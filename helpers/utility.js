var fs = require('fs')
var brandDictTree = {};

fs.readFileSync("../appdata/lefengBrands.txt").toString().split("\n").forEach(function(line){
    var len = line.length;
    var tree = brandDictTree;
    for(var i=0;i<len;i++){
	var c = line.charAt(i);
	if(!tree[c]){
	    tree[c] = {};
	}
	tree = tree[c];
    }
});

var w = [];
function recusive(tree){
    for(var k in tree){
	w.push(k);
//	console.log(k);
	
	if(Object.keys(tree[k]).length>0){
	    recusive(tree[k]);
	}else{
//	    console.log(w.join(""));
	    w.pop();
	}
    }
}
//console.log(brandDictTree);
recusive(brandDictTree);
