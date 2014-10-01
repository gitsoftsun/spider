var fs = require("fs");

function Sofun() {
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "sofun_activity.txt";
    this.cities = [];
    this.taskQueue = [];
    this.interval = [0, 500];
    this.doneItems = {};
}


Sofun.prototype.init = function () {

}
Sofun.prototype.start = function () {

}

var sofun = new Sofun();
var that = sofun;
sofun.start();