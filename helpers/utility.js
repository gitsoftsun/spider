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
console.log(brandDictTree);
//recusive(brandDictTree);

function matchMaxWord(tree,target){
    var len = target.length,i=0;
    var result = [];
    while(i<len && tree[target.charAt(i)] && Object.keys(tree[target.charAt(i)]).length!=0){
	tree = tree[target.charAt(i)];
	result.push(target.charAt(i));
	i++;
    }
    return result.join("");
}

var lines = fs.readFileSync("../result/pc_lefeng_sc.txt").toString().split("\n")
var title = lines[0].split(',')[2];

lines.forEach(function(line){
    var title = line.split(',')[2];
    if(!title) return;
    
    var brand = matchMaxWord(brandDictTree,title);
    //console.log("%s --> %s",title,brand);
});
