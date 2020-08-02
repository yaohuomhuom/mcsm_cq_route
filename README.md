

基于MCSM与cqhttp-node-sdk的插件路由

[![Status](https://img.shields.io/badge/npm-v6.9.0-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v10.0.0-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-MIT-red.svg)](https://github.com/Suwings/MCSManager)

简介
-----------
这是一款MCSM的route插件，通过对cqhttp-node-sdk项目的修改，以实现在MCSM服务器上同cqhttp交互

**警告**:此插件为魔改和个人向，安全问题方面仅进行了基础的处理，请谨慎使用

目前已实现对多服务器同时执行白名单添加等功能，但因为代码质量过于低下，个人准备进行整理后再进行上传。

如有需求，详细请进入本项目服务的MC服务器的q群进行询问

官网:[PHA](https://pha.pub/ "PHA")

酷Q已死，保持观望将逐步上传一些框架内容，希望还是能活

使用方式
-----------
1. 将仓库移入MCSM文件夹，替换所有重复文件
2. 将bot_set.json中的apiRoot，accessToken，secret更改为cqhttp设置文件里的报文发送网址，Token值，盐值
```javascript
{
	"apiRoot": "http://127.0.0.1:5700/",
	"accessToken": "XX5N3&N#&olO@vAX",
	"secret": "qik2de&8yrtNCHLG"
}
```
3. 安装npm依赖axios http-assert node-watch
```
npm i axios http-assert node-watch
```
4. 运行MCSM
5. 将cqhttp的配置文件地址设置为MCSM服务器地址加上"/cqhttp"
```javascript
{
	 "post_url": "http://127.0.0.1:23333/cqhttp",
}
```

支持命令
-----------
**/white 用户名**：先检查正版服务器uid，再按照情况进行白名单加入；

bot开发
-----------
按照[cqhttp-node-sdk](https://github.com/cqmoe/cqhttp-node-sdk "cqhttp-node-sdk")的文档修改cqhttp.js文件中的bot对象即可。

关于MCSM的魔改
-----------
1.为服务器对象添加done属性，但done属性仅在启动过程完毕后输出"Done! For help,"的MC服务器下有效。

2.添加hotroute文件夹，文件夹下的路由文件将能在被更改，删除，替换后，在不重启MCSM的情况下更新路由，但是在重命名文件时，将会只删除原路由，如需要更新，则请在重命名文件后再修改内部代码，以实现新路由的加入。

问题报告
-----------
本人代码水平不高，在这里也只是抛砖引玉，欢迎各位前来讨论。

感谢
-----------
[cqhttp-node-sdk](https://github.com/cqmoe/cqhttp-node-sdk "cqhttp-node-sdk")原码：

[/src/callable.js](https://github.com/cqmoe/cqhttp-node-sdk/blob/master/src/callable.js "/src/callable.js")

[/src/main.js](https://github.com/cqmoe/cqhttp-node-sdk/blob/master/src/main.js "/src/main.js")

[MCSManager](https://github.com/Suwings/MCSManager "MCSManager")原码：

[core/Process/BaseMcserver.js](https://github.com/Suwings/MCSManager/blob/master/core/Process/BaseMcserver.js "core/Process/BaseMcserver.js")

[core/Process/ServerCenter.js](https://github.com/Suwings/MCSManager/blob/master/core/Process/ServerCenter.js "core/Process/ServerCenter.js")

开源协议
-----------
MIT License
