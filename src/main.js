'use strict';

const Callable = require('./callable');
const crypto = require('crypto');
const axios = require('axios');
const assert = require('http-assert');

module.exports = class CQHttp extends Callable {
    constructor({ post_url, access_token, secret,group_id,user_id }) {
        super('__call__');
        if (post_url) {
            const headers = { 'Content-Type': 'application/json' }
            if (access_token) headers['Authorization'] = `Token ${access_token}`;
            this.apiClient = axios.create({ baseURL: post_url, headers: headers });
        }

        this.secret = secret;
		this.group_id = group_id||0;
		this.user_id = user_id||0;
        //this.app = new Koa();
        //this.app.use(bodyParser());
        //this.app.use(route.post('/', this.handle.bind(this)));
        this.callbacks = { message: [], event: [], notice: [], request: [] };
    }

    handle(req,res) {
        if (this.secret) {
            // check signature
            assert(req.headers['x-signature'] !== undefined, 401);
            const hmac = crypto.createHmac('sha1', this.secret);
			//console.log(JSON.stringify(req.body));
            hmac.update(JSON.stringify(req.body));
            const sig = hmac.digest('hex');
			//console.log(sig);
			//console.log(req.headers['x-signature']);
            assert(req.headers['x-signature'] === `sha1=${sig}`, 403);
        }
		
        assert(req.body.post_type !== undefined, 400);

        let result = {};
		
		//console.log("运行路由回调",this.callbacks);
        const callbacks = this.callbacks[req.body.post_type];
        if (callbacks) {
            for (const cb of callbacks) {
                // only the result of the last callback matters
                const res = cb(req.body);
                if (res) {
                    result = res;
                }
            }
        }
        res.body = JSON.stringify(result);
		res.send();
    }

    on(post_type, callback) {
        this.callbacks[post_type].push(callback);
        return callback;
    }

    delete(post_type, callback) {
        let idx = this.callbacks[post_type].indexOf(callback);
        while (idx > -1) {
            this.callbacks[post_type].splice(idx, 1);
            idx = this.callbacks[post_type].indexOf(callback);
        }
    }

    __call__(action, params = {}) {
        if (this.apiClient) {
            return this.apiClient.post(`/${action}`, params).then(response => {
				//console.log(response)
                let err = {
                    status: response.status
                };
                if (response.status === 200) {
                    const data = response.data;
                    if (data.status === 'failed') {
                        err.retcode = data.retcode;
                        return Promise.reject(err);
                    }
                    return Promise.resolve(data.data);
                } else {
                    return Promise.reject(err);
                }
            });
        }
    }
}
