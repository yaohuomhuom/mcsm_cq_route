const router = require('express')();
const CQHttp = require('../src/main.js');
const axios = require("../src/models/axios.js")
const serverModel = require('../model/ServerModel');
const bot_set = require("../bot_set.json");
const bot = new CQHttp(bot_set);
const db_edit = require('../src/models/file.js');
var blacklist = ["sb2yaohuom", "yaohuom2", "yaohuom3"];
var Commandlist = require("../src/db/db.json");
var get_name_repx = /\/white ([\S]+)/;
var time = null;
const msg_cb = bot.on('message', async (context) => {
	var call;
	var id = context.message.match(get_name_repx);
	if (id) {
		call = "add"
	}
	if (id) {
		try {
			var result = await axios.getMojangUUID.get("/" + id[1]);
			if (result.data) {
				bot('send_msg', {
					...context,
					message: "已成功获得uuid和用户id\n" + "用户id:" + result.data.name + "\nuuid:" + result.data.id
				});
				//meta.$send("已成功获得uuid和用户id\n"+"用户id:"+result.data.name+"\nuuid:"+result.data.id);

				var ServerList = serverModel.ServerManager().getServerList();
				var undone = 0;
				for (var v of ServerList) {
					if (~blacklist.indexOf(v.serverName)) {
						continue;
					}
					if (v.data.done) {
						serverModel.sendCommand(v.serverName, "/whitelist " + call + " " + result.data.name);
					} else {
						undone++;
						if (!Commandlist[call]) {
							Commandlist[call] = {}
						}
						if (!Commandlist[call][result.data.name]) {
							Commandlist[call][result.data.name] = [];
						}
						Commandlist[call][result.data.name].push(v.serverName);
					}
				};
				if(!undone){
					bot('send_msg', {
						...context,
						message: "已成功加入" + result.data.name + "至所有服务器(除黑名单)",
					});
				}else{
					bot('send_msg', {
						...context,
						message: "已成功加入" + result.data.name + "至"+(ServerList.length-undone-blacklist.length)+"个服务器(除黑名单),未加入服务器命令已压入计划执行队列",
					});
				}
				db_edit.replace(Commandlist);
				if (!time) {
					time = setInterval(function() {
						for (var fun in Commandlist) {
							for (var name in Commandlist[fun]) {
								for (var index in Commandlist[fun][name]) {
									var server = serverModel.ServerManager().getServer(Commandlist[fun][name][index]);
									if (server.isDone()) {
										serverModel.sendCommand(Commandlist[fun][name][index], "/whitelist " + fun + " " + name);

										//console.log("补入:" + serverName + " " + fun + " " + Commandlist[fun][serverName][index]);
										Commandlist[fun][name].splice(index, 1);
										db_edit.replace(Commandlist);
									} else {
										if (server.isRun()) {
											//console.log(Commandlist[fun][name][index] + ":未完成加载");
										} else {
											//console.log(Commandlist[fun][name][index] + ":关闭");
										}
									}
									if (!Commandlist[fun][name].length) {
										delete Commandlist[fun][name]
										db_edit.replace(Commandlist);
										bot('send_msg', {
											...context,
											message: "已成功加入" + name + "至所有服务器(除黑名单)",
										});
									}
								}
								if (!Object.keys(Commandlist[fun]).length) {
									delete Commandlist[fun]
									db_edit.replace(Commandlist);
									bot('send_msg', {
										...context,
										message: "已成功处理所有" + fun + "命令",
									});
								}
								/* 								
								var server = serverModel.ServerManager().getServer(serverName)
								if (server.isDone()) {
									if(!Commandlist[fun][serverName].length){
										delete Commandlist[fun][serverName]
										db_edit.replace(Commandlist);										
									}
									for (var index in Commandlist[fun][serverName]) {
										serverModel.sendCommand(serverName, "/whitelist " + fun + " " + Commandlist[fun][serverName][index]);
										bot('send_msg', {
											...context,
											message: "已成功加入用户至"
										});
										//console.log("补入:" + serverName + " " + fun + " " + Commandlist[fun][serverName][index]);
										Commandlist[fun][serverName].splice(index, 1);
										db_edit.replace(Commandlist);
									}
								}else{
									if(server.isRun()){
										console.log(serverName+":未完成加载");
									}else{
										console.log(serverName+":关闭");				
									}
								} */
							}
							if (!Object.keys(Commandlist).length) {
								clearInterval(time);
								time = null;
								db_edit.replace(Commandlist);
								bot('send_msg', {
									...context,
									message: "已成功处理所有命令",
								});
							}
						}
					}, 3000);
				}
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

module.exports = bot.router;
