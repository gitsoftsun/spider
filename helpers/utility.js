var fs = require('fs')
var brandDictTree = {};

fs.readFileSync("../appdata/lefengBrands.txt").toString().split("\n").forEach(function(line){
    var len = line.length;
    var tree = brandDictTree;
    var reverse;
    var eng = line.match(/[\w\s]+/);
    eng = eng && eng[0];
    if(eng){
	var notEng = line.replace(/[\w\s]+/,'');
	if(notEng){
	    if(line.charCodeAt(0)>122){
		reverse = eng + notEng;
	    }else{
		reverse = notEng + eng;
	    }
	}

    }

    if(reverse){
	for(var i=0;i<len;i++){
	    var c = reverse.charAt(i).toUpperCase();
	    if(!tree[c]){
		tree[c] = {};
	    }
	    tree = tree[c];
	}
    }

    tree = brandDictTree;
    
    for(var i=0;i<len;i++){
	var c = line.charAt(i).toUpperCase();
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
//console.log(brandDictTree["V"]["O"]["G"]);
//recusive(brandDictTree);
exports.tree = brandDictTree;
exports.matchMaxWord = function(tree,target,i){
    if(i==undefined) i=0;
    var len = target.length,ch,c;

    if(i<len && tree && Object.keys(tree).length != 0){
	c = target.charCodeAt(i);
	ch = target.charAt(i);
	if(c==32){
	    return arguments.callee(tree,target,i+1)+1;
	    //return matchMaxWord(tree,target,i+1)+1;
	}
	return arguments.callee(tree[ch.toUpperCase()],target,i+1)+1;
	//return matchMaxWord()+1;
    }
    return 0;
}

var priceList = {};
fs.readFileSync("../result/lefengPriceList.txt").toString().split("\n").reduce(function(pre,cur){
    var vals = cur.split(',');
    pre[vals[0]]=vals[1];
    return pre;
},priceList);

var lines = fs.readFileSync("../result/pc_lefeng_sc.txt").toString().split("\n")
//var title = lines[0].split(',')[3];
//console.log(title);
//var l = matchMaxWord(brandDictTree,title);
//console.log(title.slice(0,l));
lines.forEach(function(line){
    var vals = line.split(',');
    var title = vals[3];
    if(!title) return;
    title = title.replace(/^【[\u4e00-\u9fa5]*】/,'').replace(/（[\u4e00-\u9fa5]*）/,'');
    var unit = title.match(/\d+(mg|g|ml|l|L|ML|MG|G|KG|kg|cm|m|CM|M|KM|km)/);
    if(unit){
	unit = unit[0];
    }
    var maxLen = exports.matchMaxWord(brandDictTree,title);
    var brand = title.slice(0,maxLen);
    
    console.log(line+","+brand+","+unit+","+priceList[vals[4]]);
});
