var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Agent() {
    console.log('Agent worker starting');
    this.doneCount = 0;
    this.todoCount = 0;
    this.failedCount = 0;
    this.pretodoCount = 0;
    this.predoneCount = 0;
    this.company = {};
    this.cmpDir = "../result/58company/";
    this.resultDir = "../result/";
    this.records = [];
    this.preRecords = [];
    this.cmpHost = "http://qy.58.com";
    this.originalFile = "58.original.txt";
    this.agentFile = "58_agent.txt";
    this.dataDir = '../appdata/';
    this.companyDoneFile = "58cmpout.txt";
    this.cityFile = "58.city.txt";
    this.cities = {};
    this.gotCompanys = {};
    this.gotIds = {};
    this.rentFile = "58_rent.txt";
}
/*
{ name: '酒店诚聘男女服务员包食宿',
  jing: '否',
  top: '否',
  cmpName: '北京酷乐嘉华休闲健身娱乐有限公司',
  time: '今天',
  cmpUrl: 'http://qy.58.com/15278344077830/',
  fileName: '生活 | 服务业,餐饮,服务员,北京,1.html'
};
*/
Company.prototype.init = function () {
    if (fs.existsSync(this.resultDir + this.agentFile)) {
        fs.readFileSync(this.resultDir + this.companyFile).toString().split('\n').forEach(function (line) {
            if (!line || line=='\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            that.company[vals[0]] = { id: vals[0], name: vals[1], member: vals[2], cmp: vals[3] };
        });
    } else {
        console.log("[WARN] Agent File not found");
    }
    
    //load done agent file
    var cmps = this.doneCompanys = {};
    if (fs.existsSync(this.resultDir + this.companyFile)) {
        fs.readFileSync(this.resultDir + this.companyFile).toString().split("\n").forEach(function (line) {
            if (!line || line == '\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            cmps[vals[0]] = { id: vals[0], name: vals[1], member: vals[2], ind: vals[3] };
        });
    }
    
    console.log("company load done.");

    fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').reduce(function(pre,cur){
	if (cur) {
            cur = cur.replace('\r', '');
            var vals = cur.split(',');
            var obj = { name: vals[0], code: vals[1] };
            pre[obj.name] = obj;
        }
        return pre;
    },this.cities);
    
    //load companys that has id and name from cmpIdFile
    /*
    if (fs.existsSync(this.resultDir + this.cmpIdFile)) {
        fs.readFileSync(this.resultDir + this.cmpIdFile).toString().split('\n').reduce(function (pre, cur) {
            if (cur) {
                cur = cur.replace('\r', '');
                var vals = cur.split(',');
                var obj = { id: vals[0], name: vals[1] };
                pre[cur.split(',')[0]] = obj;
            }
            return pre;
        }, this.gotIds);
    }
    */
    console.log("init done.");
    this.tasks = [];
    fs.readFileSync(this.resultDir + this.rentFile).toString().split("\n").forEach(function (line) {
        if (!line) return;
        var fields = line.split(',');
	if(fields[5]){
	    var company = fields[12] && fields[13] && fields[12]+"-"+fields[13];
	    company = company|| fields[12] || "";
	    var t =  { "postPath": fields[1], "name": fields[11],"member":fields[5],"city":fields[2],"cmp":company };
	    this.tasks.push(t);
	}
    },this);
}
Company.prototype.wgetOneAgent = function () {
    if (this.tasks.length == 0) {
        console.log("[DONE] job done.");
        return;
    }
    var t = this.tasks.shift();
    console.log("[GET ] %s", t.name);
    var code = this.cities[t.city].code;
    var opt = new helper.basic_options(code+'.58.com',t.postPath);
    opt.agent = false;
    helper.request_data(opt, null, function (data, args) {
        that.processOneAgent(data,args);
    }, t);
}

Company.prototype.processOneAgent = function (data, args) {
    var $ = cheerio.load(data);
    var jjrLink = $("li.jjrname a");
    if (jjrLink.length>0) {
	args[0].url = jjrLink.attr("href");
	var matches=args[0].url && args[0].url.match(/\/\(d+)\//);
	args[0].id = matches && matches[1];
        var record = args[0].id + ','+args[0].city + ',' + args[0].name + ',' + (args[0].member) + ',' + (args[0].cmp) + '\n';
        fs.appendFileSync(this.resultDir + this.agentFile,record);
        console.log("[DONE] %s", record);
    } else {
	console.log("[WARN] no element on page");
    }
    setTimeout(function () {
        that.wgetOneAgent();
    }, (Math.random() * 1 + 2) * 1000);
}

Company.prototype.startEach = function () {
    console.log("[INFO] Start get each agent.");
    this.wgetOneAgent();
}
var worker = new Agent();
var that = worker;
worker.init();
worker.startEach();
