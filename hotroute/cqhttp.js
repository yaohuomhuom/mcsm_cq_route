const CQHttp = require('../src/main.js');
const axios = require("../src/models/axios.js")
const serverModel = require('../model/ServerModel');
const db_edit = require('../src/models/file.js');
const route = require('express')();
var bot_set = db_edit.read("bot_set");
var bot = new CQHttp(bot_set);

const get_name_repx = /\/whitelist ([\S]+) ([\S]+)/;
const set_blacklist_repx = /\/wblacklist ([\S]+) ([\S]+)/;
const show_blacklist_repx = /^\/wblacklist show$/;
const set_tallk = /\/tallk ([\S]+) ([\S]+)/;
const set_tallk_regexp = /\/tregexp ([\S]+) ([\S]+)/;
const msg_run_list_regexp = /\/wrunlist/;
var time = null;

const qq_acount_linent = async function(req,res,next){
	var qq_acount = db_edit.read("db_qq");
	var usid = req.body.user_id;var grid = req.body.group_id ;
	if(usid == bot.user_id||grid == bot.group_id){
		next();
	}else if(~qq_acount.indexOf(usid)||~qq_acount.indexOf(grid)){
		next();
	}else{
		res.send("{}");
	}
}

/* const msg_teach_tallk = bot.on('message', async (context) => {
	var teach = context.message.match(set_tallk);
	var teach_regexp = context.message.match(set_tallk_regexp);
	if (teach) {
		bot.on('message', async (cxt) => {
			if (cxt.message == teach[1]) {
				bot('send_msg', {
					...cxt,
					message: teach[2]
				});
			}
		});
		bot('send_msg', {
			...context,
			message: "我学会了！！"
		});
	}
	if (teach_regexp) {
		bot.on('message', async (cxt) => {
			if (cxt.message.match(teach_regexp[1])) {
				bot('send_msg', {
					...cxt,
					message: teach_regexp[2]
				});
			}
		});
		bot('send_msg', {
			...context,
			message: "我学会了！！"
		});
	}
}) */
const set_blacklist = bot.on('message', async (context) => {
	var blacklist = db_edit.read("db_black_list");
	var ctx_blacklist = context.message.match(set_blacklist_repx);
	var show_blacklist = context.message.match(show_blacklist_repx);
	if(show_blacklist){
			bot('send_msg', {
				...context,
				message: "当前服务器黑名单 " + blacklist.join("，")
			});
			db_edit.replace('db_black_list', blacklist);
	}
	if (ctx_blacklist) {
		if (context.sender.role != "owner" && context.sender.role != "admin") {
			bot('send_msg', {
				...context,
				message: "不是管理员，给爷爬"
			});
			return;
		}
		switch (ctx_blacklist[1]) {
			case "delete":
				if (!~blacklist.indexOf(ctx_blacklist[2])) {
					bot('send_msg', {
						...context,
						message: "黑名单内不存在服务器名字"
					});
					return;
				}
				blacklist.splice(blacklist.indexOf(ctx_blacklist[2]), 1)
				var line = blacklist.length ? blacklist.join(",") : "为空";
				bot('send_msg', {
					...context,
					message: ctx_blacklist[2] + "服务器已从黑名单删除\n"
				});
				db_edit.replace('db_black_list', blacklist);
				break;
			case "add":
				if (~blacklist.indexOf(ctx_blacklist[2])) {
					bot('send_msg', {
						...context,
						message: "黑名单内已存在服务器名字"
					});
					return;
				}
				blacklist.push(ctx_blacklist[2])
				bot('send_msg', {
					...context,
					message: ctx_blacklist[2] + "服务器加入黑名单\n"
				});
				db_edit.replace('db_black_list', blacklist);
				break;
			default:
				bot('send_msg', {
					...context,
					message: "未知命令"
				});
				break;
		}

	}
})
const msg_cb = bot.on('message', async (context) => {
	var Commandlist = db_edit.read("db_run_list");
	var blacklist = db_edit.read("db_black_list");
	var id = context.message.match(get_name_repx);
	if (id) {
		if(id[1]!="add"&&id[1]!="delete"){
			bot('send_msg', {
				...context,
				message: "未知命令"
			});
			return;
		}
		if (context.sender.role != "owner" && context.sender.role != "admin"&&id[1]=="delete") {
			bot('send_msg', {
				...context,
				message: "不是管理员，给爷爬"
			});
			return;
		}
		var call = id[1]
		var show_call = ""
		if(call == "add"){ show_call = "加入"}else{show_call = "删除"}
		try {
			var result = await axios.getMojangUUID.get("/" + id[2]);
			if (result.data) {
				bot('send_msg', {
					...context,
					message: "已成功获得uuid和用户id\n" + "用户id:" + result.data.name + "\nuuid:" + result.data.id
				});
				//meta.$send("已成功获得uuid和用户id\n"+"用户id:"+result.data.name+"\nuuid:"+result.data.id);

				var ServerList = serverModel.ServerManager().getServerList();
				var undone = [];
				var done = [];
				for (var v of ServerList) {
					if (~blacklist.indexOf(v.serverName)) {
						continue;
					}
					if (v.data.done) {
						done.push(v.serverName);
						serverModel.sendCommand(v.serverName, "/whitelist " + call + " " + result.data.name);
					} else {
						var reves_name = call=="add"?"delete":"add";
						if(Commandlist[reves_name]){
							var fuc_list = Commandlist[reves_name];
							if(fuc_list[result.data.name]&&~fuc_list[result.data.name].indexOf(v.serverName)){
								var index_key = fuc_list[result.data.name].indexOf(v.serverName)
								Commandlist[reves_name][result.data.name].splice(index_key,1);
								if(!Commandlist[reves_name][result.data.name].length){
									delete Commandlist[reves_name][result.data.name];
								}
								continue;
							}
						}
						undone.push(v.serverName);
						if (!Commandlist[call]) {
							Commandlist[call] = {}
						}
						if (!Commandlist[call][result.data.name]) {
							Commandlist[call][result.data.name] = [];
						}
						Commandlist[call][result.data.name].push(v.serverName);
					}
				};
				if (!undone.length) {
					bot('send_msg', {
						...context,
						message: "已成功"+show_call+ result.data.name + "至所有服务器(除黑名单)",
					});
				} else {
					var line_2 = done.length ? "已"+show_call+":" + done.join(",") + "服务器中\n" : ""
					var line_3 = undone.length ? "未"+show_call+":" + undone.join(",") + "服务器\n未执行命令已压入命令栈\n" : ""
					//var line_4 = blacklist.length ? "服务器黑名单如下" + blacklist.join(",") + "服务器\n" : ""
					bot('send_msg', {
						...context,
						message: result.data.name +show_call+"白名单执行情况如下\n" + line_2 + line_3
					});
				}
				db_edit.replace('db_run_list', Commandlist);
				/* if (!time) {
					time = setInterval(function() {

					}, 3000);
				} */
				/* if(mc_result.status == 200){
					bot('send_msg', {
					    ...context,
					    message: "已成功加入白名单"
					});
					//meta.$send("已成功加入白名单")
				} */
			} else if (result.status == 204 && result.statusText == "No Content") {
				bot('send_msg', {
					...context,
					message: "没有找到对应的用户🐎，请重新输入"
				});
				//meta.$send("没有找到对应的用户🐎，请重新输入")
			} else {
				bot('send_msg', {
					...context,
					message: "未知错误:\n" + "状态🐎:" + result.status + "\n状态说明:" + result.statusText
				});
				//meta.$send("未知错误:\n"+"状态🐎:"+result.status+"\n状态说明:"+result.statusText);
			}
		} catch (e) {
			bot('send_msg', {
				...context,
				message: "超级未知错误:\n" + e
			});
			//meta.$send("超级未知错误:\n"+e);
		}
	}

});
const msg_run_list = bot.on('message', async (context) => {
	var run_list = context.message.match(msg_run_list_regexp);
	var Commandlist = db_edit.read("db_run_list");
	var blacklist = db_edit.read("db_black_list");
	var done = {};
	var close = [];
	var run = [];
	if (run_list) {
		if (context.sender.role != "owner" && context.sender.role != "admin") {
			bot('send_msg', {
				...context,
				message: "不是管理员，给爷爬"
			});
			return;
		}
		for (var fun in Commandlist) {
			for (var name in Commandlist[fun]) {
				for (var index in Commandlist[fun][name]) {
					var serverName = Commandlist[fun][name][index];
					if (~blacklist.indexOf(serverName)) {
						console.log(serverName);
						Commandlist[fun][name].splice(index, 1);
						db_edit.replace('db_run_list', Commandlist);
						continue;
					}
					var server = serverModel.ServerManager().getServer(serverName);
					if (server.isDone()) {
						serverModel.sendCommand(serverName, "/whitelist " + fun + " " + name);
						if(!done[name]){done[name]={}}
						if(!done[name][fun]){done[name][fun]=[]}
						done[name][fun].push(serverName);
						//console.log("补入:" + serverName + " " + fun + " " + name);
						Commandlist[fun][name].splice(index, 1);
						db_edit.replace('db_run_list', Commandlist);
					} else {
						if (server.isRun()) {
							run.push(serverName);
							//console.log(serverName + ":未完成加载");
						} else {
							close.push(serverName);
							console.log(serverName + ":关闭");
						}
					}
					if (!Commandlist[fun][name].length) {delete Commandlist[fun][name];db_edit.replace('db_run_list', Commandlist);}
				}
				if (!Object.keys(Commandlist[fun]).length) {delete Commandlist[fun];db_edit.replace('db_run_list', Commandlist);}
			}
			if (!Object.keys(Commandlist).length) {db_edit.replace('db_run_list', Commandlist);}
		}
		var done_str = ""
		for(var key1 in done){
			var show_call = "";
			if(key1 == "add"){ show_call = " 已加入服务器:"}else{show_call = " 从以下服务器中删除"}
			for(var key2 in done[key1]){
				done_str+="用户名:"+key+"  "+show_call+done[key1].join(",")+"\n";
			}
			
		}
		
		var close_str = close.length?close.join(",")+"  关服中\n":"";
		var run_str = run.length?run.join(",")+"  服务器启动中\n":"";
		bot('send_msg', {
			...context,
			message: done_str+close_str+run_str
		});
	}

}
);




bot.route = route.post('/',qq_acount_linent, bot.handle.bind(bot))
module.exports = bot;
