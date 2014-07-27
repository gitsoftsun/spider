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
//console.log(brandDictTree["H"]["A"]["N"]["D"]["L"]["O"]["V"]["E"]);
//recusive(brandDictTree);

function matchMaxWord(tree,target,i){
    if(i==undefined) i=0;
    var len = target.length,ch,c;

    if(i<len && tree && Object.keys(tree).length != 0){
	c = target.charCodeAt(i);
	ch = target.charAt(i);
//	console.log(ch);
	if(c==32){
	    return matchMaxWord(tree,target,i+1)+1;
	}
	return matchMaxWord(tree[ch.toUpperCase()],target,i+1)+1;
	/*
	if(c>=65 && c<=90){
	    return Math.max(matchMaxWord(tree[ch],target,i+1),matchMaxWord(tree[ch.toUpperCase()],target,i+1)) + 1;
	}
	if(c>=97 && c<=122){
	    return Math.max(matchMaxWord(tree[ch],target,i+1),matchMaxWord(tree[ch.toLowerCase()],target,i+1))+1;
	}*/

//	result.push(ch);
//	i++;
    }
    return 0;
}

var lines = fs.readFileSync("../result/pc_lefeng_sc.txt").toString().split("\n")
//var title = lines[0].split(',')[3];
//console.log(title);
//var l = matchMaxWord(brandDictTree,title);
//console.log(title.slice(0,l));
lines.forEach(function(line){
    var title = line.split(',')[3];
    if(!title) return;
    
    var maxLen = matchMaxWord(brandDictTree,title);
    console.log("%s --> %s",title,title.slice(0,maxLen));
});
