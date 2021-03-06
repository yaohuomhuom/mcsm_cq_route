//运行时环境检测
try {
    let versionNum = parseInt(process.version.replace(/v/igm, "").split(".")[0]);
    //尽管我们建议最低版本为 v10 版本
    if (versionNum < 10) {
        console.log("[ WARN ] 您的 Node 运行环境版本似乎低于我们要求的版本.");
        console.log("[ WARN ] 可能会出现未知情况,建议您更新 Node 版本 (>=10.0.0)");
    }
} catch (err) {
    //忽略任何版本检测导致的错误
}

//全局变量 MCSERVER
global.MCSERVER = {};

//测试时检测
MCSERVER.allError = 0;
//自动化部署测试
setTimeout(() => {
    let arg2 = process.argv[2] || '';
    if (arg2 == '--test') {
        MCSERVER.infoLog("Test", "测试过程结束...");
        if (MCSERVER.allError > 0) {
            MCSERVER.infoLog("Test", "测试未通过!");
            process.exit(500);
        }
        MCSERVER.infoLog("Test", "测试通过!");
        process.exit(0);
    }
}, 10000);

const fs = require('fs');
const fsex = require('fs-extra');

//全局仅限本地配置
MCSERVER.localProperty = {};

const tools = require('./core/tools');

//生成第一次配置文件
const INIT_CONFIG_PATH = './model/init_config/';
const PRO_CONFIG = './property.js';
if (!fs.existsSync(PRO_CONFIG))
    tools.mCopyFileSync(INIT_CONFIG_PATH + 'property.js', PRO_CONFIG);

//加载配置
require('./property');


const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const fswatch = require('node-watch');
//gzip压缩
const compression = require('compression');

//各类层装载 与 初始化
const ServerModel = require('./model/ServerModel');
const UserModel = require('./model/UserModel');
const permission = require('./helper/Permission');
const response = require('./helper/Response');
const {
    randomString
} = require('./core/User/CryptoMine');
const counter = require('./core/counter');
const DataModel = require('./core/DataModel');
const ftpServerInterface = require('./ftpd/ftpserver');
const tokenManger = require('./helper/TokenManager');
const nodeSchedule = require("node-schedule");
const Schedule = require('./helper/Schedule');
const NewsCenter = require('./model/NewsCenter');

//控制台颜色
const colors = require('colors');
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'red',
    info: 'green',
    data: 'blue',
    help: 'cyan',
    warn: 'yellow',
    debug: 'magenta',
    error: 'red'
});

//logo输出
const LOGO_FILE_PATH = './core/logo.txt';
let data = fs.readFileSync(LOGO_FILE_PATH, 'utf-8');
console.log(data);

//全局数据中心 记录 CPU 内存 
MCSERVER.dataCenter = {};

//装载log记录器
require('./core/log');
MCSERVER.info('控制面板正在启动中...');

//全局登陆记录器
MCSERVER.login = {};
//全局 在线用户监视器
MCSERVER.onlineUser = {};
//全局 在线 Websocket 监视器
MCSERVER.allSockets = {};
//全局 数据内存记录器
MCSERVER.logCenter = {};
//PAGE 页面数据储存器
MCSERVER.PAGE = {};

//init
MCSERVER.logCenter.initLogData = (objStr, len, def = null) => {
    let tmp = [];
    for (let i = 0; i < len; i++) tmp.push(def);
    MCSERVER.logCenter[objStr] = tmp;
}

//压入方法
MCSERVER.logCenter.pushLogData = (objStr, k, v) => {
    MCSERVER.logCenter[objStr] = MCSERVER.logCenter[objStr].slice(1);
    MCSERVER.logCenter[objStr].push({
        'key': k,
        'val': v
    });
}

//exp 框架
var app = express();
//web Socket 框架
var expressWs = require('express-ws')(app);

//Cookie and Session 的基础功能
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

var UUID = require('uuid');
app.use(session({
    secret: UUID.v4(),
    name: 'MCSM_SESSION_ID',
    cookie: {
        maxAge: MCSERVER.localProperty.session_max_age * 1000 * 60
    },
    resave: false,
    saveUninitialized: false
}));

//使用 gzip 静态文本压缩，但是如果你使用反向代理或某 HTTP 服务自带的gzip，请关闭它
if (MCSERVER.localProperty.is_gzip)
    app.use(compression());

//基础根目录
app.use('/public', express.static('./public'));


// console 中间件挂载
app.use((req, res, next) => {
    // 部分请求不必显示
    if (req.originalUrl.indexOf('/api/') == -1 &&
        req.originalUrl.indexOf('/fs/') == -1 &&
        req.originalUrl.indexOf('/fs_auth/') == -1 &&
        req.originalUrl.indexOf('/fs_auth/') == -1) {
        // MCSERVER.log('[', req.method.cyan, ']', '[', req.ip, ']', req.originalUrl);
    }
    if (MCSERVER.localProperty.is_allow_csrf) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    res.header('X-Frame-Options', 'DENY');
    next();
});


//基础的根目录路由
app.get(['/login', '/l', '/', '/logined'], function (req, res) {
    permission.needLogin(req, res, () => {
        res.redirect('/public/#welcome');
    }, () => {
        res.redirect(MCSERVER.localProperty.login_url);
    });
});

//自动装载所有路由
let routeList = fs.readdirSync('./route/');
for (let key in routeList) {
    let name = routeList[key].replace('.js', '');
    app.use('/' + name, require('./route/' + name));
}

//自动装载热路由
function addhotroute(dir) {
	var fsdir = dir||"./hotroute/";
	let hotRoute = fs.readdirSync(fsdir);
	for (let key in hotRoute) {
		if(hotRoute[key].substr(-3,3)!=".js"){
					MCSERVER.infoLog('INFO', '热路由插件:'+hotRoute[key]+'丢弃');
					continue;
				}	
	    let name = hotRoute[key].replace('.js', '');		
		if(app._router.stack.find(v =>{return  v.name == "fun_"+name})){continue;}
		if(app._router.stack.find(v =>{return  name.match(v.regexp)&&v.name!="fun_"+name })){
			MCSERVER.infoLog('INFO', '热路由插件:'+name+'此路由名已被静态路由注册');
			continue;
			}		
		let new_require = require('./hotroute/' + name);
		if(!new_require.route){
			MCSERVER.infoLog('INFO', '热路由插件:'+name+'没有路由对象');
			continue;
		}
		let _fun  = {["fun_"+name](req, res, next){ new_require.route(req, res, next)}};
		app.use('/' + name,_fun["fun_"+name]);
		MCSERVER.infoLog('INFO', '热路由插件:'+name+'加载完成');
	}
}
addhotroute();
//自动监听更新热路由
var lastUpdateTime = 0;
(function  hot_route_watch() {
	fswatch("./hotroute/", (event, dirfilename)=> {
		
		let path = require("path");
		//获取路径处理依赖
		let extname = path.extname(dirfilename);
		//获取文件后缀
		MCSERVER.infoLog('INFO', '热路由插件 extname:'+extname);
		//打印文件后缀
		let basename = path.basename(dirfilename);
		//获取文件最后部分
		MCSERVER.infoLog('INFO', '热路由插件 basename:'+basename);
		//打印文件最后部分
		let name = path.basename(dirfilename,".js");
		
		MCSERVER.infoLog('INFO', '热路由插件 name:'+name);
		//打印文件名
		if(extname!=".js"){
			MCSERVER.infoLog('INFO', '热路由插件:'+dirfilename+" "+event+'暂时不支持');
			//非js文件不更新
			return;
			
		}
		if(name!="cqhttp"){
			MCSERVER.infoLog('INFO', '热路由插件 : 为服务器稳定,关闭除cqhttp以外的热更新');
			//单一更新确认，需要在未来加入可编辑的json文件来存储可热更新的js文件名。
			return;
		}
		try{
			let diff = Date.now() - lastUpdateTime;
			lastUpdateTime = Date.now();
			if (diff < 1000) return;
			//监测确认更新，理论上有很大的缺陷需要深入学习一下fs的监听函数	
			if(event == "update"){
				delete require.cache[path.join(__dirname,'./hotroute/'+basename)];
				//删除node require中的对应模块的缓存
				//console.log("更新路由回调",require('./hotroute/' + filename).callbacks);
				let new_require_update = require('./hotroute/' + name);
				//定义变量为新模块
				if(!new_require_update.route){
					MCSERVER.infoLog('INFO', '热路由插件:'+name+'没有路由对象');
					return;
				}
				//如果模块的为空，则退出
				var  _fun_  = {["fun_"+name](req, res, next){ require('./hotroute/' + name).route(req, res, next)}};
				//在对象中定义自定义名称函数并调用新模块函数
				var  undone = 0;
				
					app._router.stack = app._router.stack.map(v => {
						
						if(v.name == "fun_"+name){
							v.handle = _fun_["fun_"+name];
							MCSERVER.infoLog('INFO', '热路由函数:'+v.name+'函数更新');
							undone++;
						}
						return v;
						});
						//替换路由中的已存在路由的处理钩子函数
					if(!undone){
						//未找到，则加入新的勾子处理函数
						MCSERVER.infoLog('INFO', '热路由插件:'+name+'不存在对应函数，添加新路由');
						//删除重复逻辑
/* 						let new_require_add = require('./hotroute/' + name);
						if(!new_require_add.route){
							MCSERVER.infoLog('INFO', '热路由插件:'+name+'没有路由对象');
							return;
						}
						let _fun_  = {["fun_"+name](req, res, next){ new_require_add.route(req, res, next)}}; */
						app.use('/' + name,_fun_["fun_"+name]);
						MCSERVER.infoLog('INFO', '热路由插件:'+name+'加载完成');
						return;
					}
					MCSERVER.infoLog('INFO', '热路由插件:'+name+'更新完毕');				
			}else if(event == "remove"){				
					app._router.stack = app._router.stack.filter(v => {return v.name != "fun_"+name});				
					delete require.cache[path.join(__dirname,'./hotroute/'+basename)];
					MCSERVER.infoLog('INFO', '热路由插件:'+name+'删除完毕');							
			}
		}catch(e){
			console.error(e);
		}
	  });
	}
	)()

process.on("uncaughtException", function (err) {
    //是否出过错误,本变量用于自动化测试
    MCSERVER.allError++;
    //打印出错误
    MCSERVER.error('错误报告:', err);
});

process.on('unhandledRejection', (reason, p) => {
    MCSERVER.error('错误报告:', reason);
});

//初始化目录结构环境
(function initializationRun() {
    const USERS_PATH = './users/';
    const SERVER_PATH = './server/';
    const SERVER_PATH_CORE = './server/server_core/';
    const SERVER_PATH_SCH = './server/schedule/';
    const CENTEN_LOG_JSON_PATH = './core/info.json';
    const PUBLIC_URL_PATH = './public/common/URL.js';
    const RECORD_PARH = './server/record_tmp/'

    try {
        if (!fs.existsSync(USERS_PATH)) fs.mkdirSync(USERS_PATH);
        if (!fs.existsSync(SERVER_PATH)) fs.mkdirSync(SERVER_PATH);
        if (!fs.existsSync(SERVER_PATH_CORE)) fs.mkdirSync(SERVER_PATH_CORE);
        if (!fs.existsSync(SERVER_PATH_SCH)) fs.mkdirSync(SERVER_PATH_SCH);
        if (!fs.existsSync(RECORD_PARH)) fs.mkdirSync(RECORD_PARH);

        // 生成不 git 同步的文件
        if (!fs.existsSync(CENTEN_LOG_JSON_PATH))
            tools.mCopyFileSync(INIT_CONFIG_PATH + 'info_reset.json', CENTEN_LOG_JSON_PATH);
        if (!fs.existsSync(PUBLIC_URL_PATH))
            tools.mCopyFileSync(INIT_CONFIG_PATH + 'INIT_URL.js', PUBLIC_URL_PATH);

    } catch (err) {
        MCSERVER.error('初始化文件环境失败,建议重启,请检查以下报错:', err);
    }
})();

//开始对 Oneline File Manager 模块进行必要的初始化
MCSERVER.infoLog('OnlineFs', '正在初始化文件管理路由与中间件 ');

//必须先进行登陆 且 fs API 请求必须为 Ajax 请求，得以保证跨域阻止
app.use(['/fs/mkdir', '/fs/rm', '/fs/patse', '/fs/cp', '/fs/rename', '/fs/ls'], function (req, res, next) {
    if (req.session.fsos && req.xhr) {
        next();
        return;
    }
    res.status(403).send('禁止访问:权限不足！您不能直接访问文件在线管理程序 API，请通过正常流程！');
});

//载入在线文件管理路由
app.use('/fs_auth', require('./onlinefs/controller/auth'));
app.use('/fs', require('./onlinefs/controller/function'));

//初始化各个模块
(function initializationProm() {

    MCSERVER.infoLog('Module', '正在初始化用户管理模块');
    counter.init();
    UserModel.userCenter().initUser();

    MCSERVER.infoLog('Module', '正在初始化服务端管理模块');
    ServerModel.ServerManager().loadALLMinecraftServer();

    MCSERVER.infoLog('Module', '正在初始化计划任务模块');
    Schedule.init();

    var host = MCSERVER.localProperty.http_ip;
    var port = MCSERVER.localProperty.http_port;

    if (host == '::')
        host = '127.0.0.1';

    //App Http listen
    app.listen(MCSERVER.localProperty.http_port, MCSERVER.localProperty.http_ip, () => {

        MCSERVER.infoLog('HTTP', 'HTTP 模块监听: [ http://' + (host || '127.0.0.1'.yellow) + ':' + port + ' ]');

        //现在执行 FTP 服务器启动过程
        ftpServerInterface.initFTPdServerOptions({
            host: MCSERVER.localProperty.ftp_ip || '127.0.0.1',
            port: MCSERVER.localProperty.ftp_port,
            tls: null
        });

        if (MCSERVER.localProperty.ftp_is_allow)
            require('./ftpd/index'); //执行ftp逻辑

        MCSERVER.infoLog('INFO', '配置文件: property.js 文件');
        MCSERVER.infoLog('INFO', '文档参阅: https://github.com/suwings/mcsmanager');

        if (MCSERVER.allError <= 0) {
            MCSERVER.infoLog('INFO', '控制面板已经启动');
        } else {
            MCSERVER.infoLog('INFO', '控制面板启动异常');
        }
    });


})();


//用于捕捉前方所有路由都未经过的请求，则可为 404 页面
app.get('*', function (req, res) {
    //404 页面
    res.redirect('/public/template/404_page.html');
    res.end();
})


//设置定时获取最新新闻动态
//这里是每23小时59分59秒更新一次
nodeSchedule.scheduleJob('59 59 */23 * * * ', function () {
    MCSERVER.infoLog('INFO', '自动更新新闻动态与最新消息');
    NewsCenter.requestNews();
});
//重启自动获取一次
NewsCenter.requestNews();


//程序退出信号处理
require('./core/procexit');
