'use strict';

const Callable = require('./callable');
const bodyParser = require('body-parser')
const route = require('express')();
const crypto = require('crypto');
const axios = require('axios');
const assert = require('http-assert')

module.exports = class CQHttp extends Callable {
    constructor({ apiRoot, accessToken, secret }) {
        super('__call__');
        if (apiRoot) {
            const headers = { 'Content-Type': 'application/json' }
            if (accessToken) headers['Authorization'] = `Token ${accessToken}`;
            this.apiClient = axios.create({ baseURL: apiRoot, headers: headers });
        }

        this.secret = secret;
        //this.app = new Koa();
        //this.app.use(bodyParser());
        //this.app.use(route.post('/', this.handle.bind(this)));
		this.router = route.post('/', this.handle.bind(this))
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
