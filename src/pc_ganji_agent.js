var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Agent() {
    this.resultDir = "../result/";
    this.agentFile = "ganji_agent.txt";
    this.dataDir = '../appdata/';
    this.cityFile = "ganji.city.txt";
    this.cities = {};
    this.rentFile = "ganji_rent.txt";
    this.doneAgents = {};
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
Agent.prototype.init = function () {
    if (fs.existsSync(this.resultDir + this.agentFile)) {
        fs.readFileSync(this.resultDir + this.agentFile).toString().split('\n').forEach(function (line) {
            if (!line || line=='\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            that.doneAgents[vals[2]+vals[4]] = true;
        });
    } else {
        console.log("[WARN] Agent File not found");
    }
    //load done agent file
    /*var cmps = this.doneCompanys = {};
    if (fs.existsSync(this.resultDir + this.companyFile)) {
        fs.readFileSync(this.resultDir + this.companyFile).toString().split("\n").forEach(function (line) {
            if (!line || line == '\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            cmps[vals[0]] = { id: vals[0], name: vals[1], member: vals[2], ind: vals[3] };
        });
    }
    
    console.log("company load done.");
    */
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
	if(fields[5]>0){
	    var t =  { "postPath": fields[1], "member":fields[5],"city":fields[2]};
	    this.tasks.push(t);
	}
    },this);
    console.log("[INFO] task count: %d",this.tasks.length);
}
Agent.prototype.wgetOneAgent = function () {
    if (this.tasks.length == 0) {
        console.log("[DONE] job done.");
        return;
    }
    var t = this.tasks.shift();
    
    console.log("[GET ] %s",JSON.stringify(t));
    var code = this.cities[t.city].code;
    var opt = new helper.basic_options(code+'.ganji.com',t.postPath);
    opt.agent = false;
    helper.request_data(opt, null, function (data, args) {
        that.processOneAgent(data,args);
    }, t);
}

Agent.prototype.processOneAgent = function (data, args) {
    if(!data){
	console.log("no data.");
	setTimeout(function () {
            that.wgetOneAgent();
	}, (Math.random() * 1 + 2) * 1000);
    }
    var $ = cheerio.load(data);
    var personUrl = $("div.person-name span a").attr("href");
    args[0].name = $("div.person-name span").text().trim();
    args[0].cmp = $("p.company-name").text().trim();
    args[0].url = personUrl;
    var matches = personUrl && personUrl.match(/fang_(\d+)/);
    if(matches && matches.length>1){
	args[0].id = matches[1];
    }
    
    var record = (args[0].id||"") + ','+args[0].city + ',' + args[0].name + ',' + (args[0].member) + ',' + args[0].cmp + '\n';
    fs.appendFileSync(this.resultDir + this.agentFile,record);
    this.doneAgents[args[0].name+args[0].cmp] = true;
    console.log("[DONE] %s",record);
    setTimeout(function () {
        that.wgetOneAgent();
    }, (Math.random() * 1 + 2) * 1000);
}

Agent.prototype.startEach = function () {
    console.log("[INFO] Start get each agent.");
    this.wgetOneAgent();
}
var worker = new Agent();
var that = worker;
worker.init();
worker.startEach();
