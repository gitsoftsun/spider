var fs=require('fs')
var str = fs.readFileSync('58job.json').toString();
var json = JSON.parse(str);
/*
    for(var cl1 in json){
	for(var cl2 in json[cl1]){
	    for(var cl3 in json[cl1][cl2].cl3){
		var id = json[cl1][cl2].cl3[cl3];
		json[cl1][cl2].cl3[cl3]={'id':id};
	    }
	}
    }
fs.writeFileSync('58job2.json',JSON.stringify(json));

*/
