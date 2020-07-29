module.exports = class UserDataList {
	constructor( data ) {
		//{ username, qqid, server}
	    
		this.list = data;
		this.length = data.length
	}
	isBan(data){
		if(!this.list){
			return false;
		}
		
		var userdata = this.list.find(v=> v.qqid == data)||this.list.find(v=> v.username.toLowerCase() == (typeof data == "string"?data.toLowerCase():false))
		if(userdata&&userdata.ban){
			return true;
		}else{
			return false;
		}
	}
	
	changeData(find,key,data){
		if(!this.list){
			return false;
		}
		for (var v of this.list) {
			if(v.qqid == find||v.username.toLowerCase() == (typeof find == "string"?find.toLowerCase():false)){
				v[key] = data;
				return v;
			}
		}
		return false;
	}
	
	isExist(data){
		if(!this.list){
			return false;
		}
		
		var userdata = this.list.find(v=> v.qqid == data)||this.list.find(v=> v.username.toLowerCase() == (typeof data == "string"?data.toLowerCase():false))
		if(userdata){
			return true;
		}else{
			return false;
		}
	}
	
	getExist(data){
		if(!this.list){
			return false;
		}
		/* console.log(data,typeof data == "string")
		console.log(typeof data == "string"?data.toLowerCase():false); */
		var userdata = this.list.find(v=> v.qqid == data)||this.list.find(v=> v.username.toLowerCase() == (typeof data == "string"?data.toLowerCase():false))
		if(userdata){
			return userdata;
		}else{
			return false;
		}
	}
	
	getIndex(data){
		if(!this.list){
			return false;
		}
		var userdata = this.list.find(v=> v.qqid == data)||this.list.find(v=> v.username.toLowerCase() ==  (typeof data == "string"?data.toLowerCase():false))
		var userindex = this.list.indexOf(userdata);
		if(userindex){
			return userindex;
		}else{
			return false;
		}
	}
	
	addUserData(name,qqid){
		if(!this.list){
			return false;
		}
		var userdata = this.list.find(v=>{v.qqid == qqid})||this.list.find(v=>{v.username.toLowerCase()  == name.toLowerCase()})
		if(!userdata){
			this.list.push({"username":name,"qqid":qqid,"server":[]}) 
			return true;
		}else{
			return false;
		}
		
	}
	
	delUserData(data){
		if(!this.list){
			return false;
		}
		for(var key in this.list){
			if(this.list[key].username.toLowerCase()  ==  (typeof data == "string"?data.toLowerCase():false) ||this.list[key].qqid == data){
				this.list.splice(key,1);
				return true;
			}
		}
		return false;
	}
	
	delServer(data,server){
		if(!this.list){
			return false;
		}
		for(var key in this.list){
			if(this.list[key].username.toLowerCase()  == (typeof data == "string"?data.toLowerCase():false) ||this.list[key].qqid == data){
				this.list[key].server = this.list[key].server.filter(v => !server.includes(v));
				return true;
			}
		}
		return false;
	}
	
	addServer(name,qqid,server){
		if(!this.list){
			return false;
		}
		for(var key in this.list){
			if(this.list[key].username.toLowerCase()  == name.toLowerCase() ||this.list[key].qqid == qqid){
				for(var item of server){
					if(!this.list[key].server.includes(item)){
						this.list[key].server.push(item);
					}
				}
				return key;
			}
		}
		this.list.push({"username":name,"qqid":qqid,"server":server}) 
		
		return this.list.length-1;
	}
	
}