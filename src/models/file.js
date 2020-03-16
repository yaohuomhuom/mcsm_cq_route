const fs = require('fs');
var path = require("path")
var db = require('../db/db.json');

/* module.exports.add = function(data){
	console.log(db instanceof Array)
	if(data instanceof Array){
		db = db.concat(data)
	}else if(data instanceof Object){
		db.push(data)
	}else{
		console.log(data)
	}
	var jsonstr = JSON.stringify(db);
	//将修改后的内容写入文件
	fs.writeFile(path.join(__dirname, '../db/db.json'), jsonstr, function(err) {
	   if (err) {
	      console.error(err);
	   }else{
	       console.log('----------修改成功-------------');
	   }
	    
	}); 
} */
module.exports.replace = function(data){
	db = data;
	var jsonstr = JSON.stringify(db);
	//console.log(jsonstr)
	fs.writeFileSync(path.join(__dirname, '../db/db.json'), jsonstr,'utf8',function(err) {
	   if (err) {
	      console.error(err);
	   }else{
	       console.log('----------修改成功-------------');
	   }
	    
	}); 
}