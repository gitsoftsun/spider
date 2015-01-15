var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Worker() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.host = '.speiyou.com';
    this.today = new Date().toString();
    this.cities = [{"name":"北京","code":"sbj"},
		   {"name":"天津","code":"stj"},
		   {"name":"太原","code":"ty"},
		   {"name":"石家庄","code":"sjz"},
		   {"name":"上海","code":"ssh"},
		   {"name":"南京","code":"snj"},
		   {"name":"苏州","code":"su"},
		   {"name":"青岛","code":"qd"},
		   {"name":"广州","code":"sgz"},
		   {"name":"深圳","code":"ssz"},
		   {"name":"武汉","code":"swh"},
		   {"name":"长沙","code":"cs"},
		   {"name":"成都","code":"scd"},
		   {"name":"重庆","code":"scq"},
		   {"name":"杭州","code":"shz"},
		   {"name":"郑州","code":"zz"},
		   {"name":"沈阳","code":"sy"},
		   {"name":"西安","code":"sxa"}];
    this.grades = [{"name":"小学英语考级课程","path":"/search/index/subject:/grade:ff80808127fabe0c0127fae69bc1004a/gtype:time"},
		   {"name":"学前班","path":"/search/index/subject:/grade:0/gtype:time"},
		   {"name":"小学一年级","path":"/search/index/subject:/grade:1/gtype:time"},
		   {"name":"小学二年级","path":"/search/index/subject:/grade:2/gtype:time"},
		   {"name":"小学三年级","path":"/search/index/subject:/grade:3/gtype:time"},
		   {"name":"小学四年级","path":"/search/index/subject:/grade:4/gtype:time"},
		   {"name":"小学五年级","path":"/search/index/subject:/grade:5/gtype:time"},
		   {"name":"小学六年级","path":"/search/index/subject:/grade:6/gtype:time"},
		   {"name":"初中一年级","path":"/search/index/subject:/grade:7/gtype:time"},
		   {"name":"初中二年级","path":"/search/index/subject:/grade:8/gtype:time"},
		   {"name":"初中三年级","path":"/search/index/subject:/grade:9/gtype:time"},
		   {"name":"高中一年级","path":"/search/index/subject:/grade:10/gtype:time"},
		   {"name":"高中二年级","path":"/search/index/subject:/grade:11/gtype:time"},
		   {"name":"高中三年级","path":"/search/index/subject:/grade:12/gtype:time"},
		   {"name":"小学组","path":"/search/index/subject:/grade:13/gtype:time"},
		   {"name":"初中组","path":"/search/index/subject:/grade:14/gtype:time"},
		   {"name":"高中组","path":"/search/index/subject:/grade:15/gtype:time"},
		   {"name":"小高组","path":"/search/index/subject:/grade:ff80808144b18aea0144b3fab7a30050/gtype:time"},
		   {"name":"小升初","path":"/search/index/subject:/grade:0000000049571bfa01495ea8e62b468f/gtype:time"}];
    
    this.resultFile = 'peiyou.txt';
    this.tasks = [];
}

Worker.prototype.init = function(){
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.grades.length;j++){
	    this.tasks.push({"city":this.cities[i].name,"code":this.cities[i].code,"grade":this.grades[j].name,"path":this.grades[j].path});
	}
    }
    
    //var arguments = process.argv.splice(2);
    //var start = Number(arguments[0]);
    //var len = Number(arguments[1]);
    //前闭后开区间
    //this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
}

Worker.prototype.start = function(){
    this.init();
    this.wgetList();
}

Worker.prototype.wgetList = function(t){
    if(!t){
	if(this.tasks.length==0){
	    console.log("job done.");
	    return;
	}
	t = this.tasks.shift();
	t.pn = 1;
    }
    var opt = new helper.basic_options(t.code+this.host,t.path);
    //opt.agent = false;
	//console.log(opt);
    console.log("[GET ] %s, %s, %d",t.city,t.grade,t.pn);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Worker.prototype.processList = function(data,args,res){
    if(!data){
	console.log("data empty.");
	setTimeout(function(){
	    that.wgetList(args[0]);
	},1000);
	return;
    }
    
    var $ = cheerio.load(data);
    
    $("section.s-main-box > div.s-r-list").each(function(){
	var teacher = $("div.s-r-list-photo p a",this);
	var tname = teacher.text();
	var turl = teacher.attr("href");
	var detail = $("div.s-r-list-detail div.s-r-list-info",this);
	var price = $("div.price span",detail).text();
	var tit = $("h3 > a",detail).attr('title');
	tit = tit && tit.replace(/\s/g,'');
	//var point = $("div.pf div.fn-left.tea_degree_num",detail).text();
	var major = $("p",detail).eq(0).find("span").eq(0).text();
	major = major && major.replace(/\s/g,'');
	var dt = $("p",detail).eq(1).find("span");
	var start = dt.eq(0).text();
	var time = dt.eq(1).text();
	var addr = $("p",detail).eq(2).text();
	var classType = tit && tit.slice(0,3);
	
	var left = $("div.s-r-list-detail .sk-bm-box p span",this).eq(0).text();
	
	var record = [tname,turl,price,tit,major,args[0].grade,start,time,addr,classType,left,args[0].city,that.today,"\n"].join("\t");
	fs.appendFileSync(that.resultDir+that.resultFile,record);
    });

    var curPage = $(".pagination span");
    if(curPage.length>0 && curPage.next().length>0){
	++args[0].pn;
	args[0].path = curPage.next().attr('href');
	setTimeout(function(){
	    that.wgetList(args[0]);
	},1000);
    }else{
	//no result.
	setTimeout(function(){
	    that.wgetList();
	},1000);

    }
}

var that = new Worker();
that.start();
