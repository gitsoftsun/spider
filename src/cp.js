var cp = require('child_process')
var child = cp.fork('./cp_worker.js');
child.send('hello child!');
