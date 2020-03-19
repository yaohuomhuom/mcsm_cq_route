const fs = require('fs');
var path = require("path")
 module.exports.create =function(name){
	 fs.writeFileSync(path.join(__dirname, "../db/"+name+".json"),"[]",'utf8',function(err) {
	    if (err) {
	       console.error(err);
	    }
	 }); 
 }
 module.exports.read = function(name){
	 try{
	 	if(!fs.existsSync(path.join(__dirname, "../db/"+name+".json"))){
	 		 module.exports.create(name);
	 	 }
	 	var jsonstrfs = fs.readFileSync(path.join(__dirname, "../db/"+name+".json"), "utf8");
	 	return JSON.parse(jsonstrfs)
	 }catch(e){
	 	console.error(err);
	 }
}
module.exports.replace = function(name,data){
	var jsonstr = JSON.stringify(data);
	//console.log(jsonstr)
	fs.writeFileSync(path.join(__dirname, "../db/"+name+".json"), jsonstr,'utf8',function(err) {
	   if (err) {
	      console.error(err);
	   }
	}); 
}