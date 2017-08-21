/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file wsprovider.js
 * @authors:
 *   Ales Katona <almindor@gmail.com>
 * @date 2017
 */

var errors = require('../node_modules/web3/lib/web3/errors');
var WebSocket = require('ws');

/**
 * WsProvider should be used to send rpc calls over websockets
 */
var WsProvider = function (host, options, callback) {
  var _this = this;
  this.host = host || 'ws://localhost:8546';
  this.responseCallbacks = {};
  this.connection = new WebSocket(this.host, options);

  this.connection.on('open', function() {
    if (callback) {
      return callback();
    }
  })

  this.connection.on('close', function() {
    _this._timeout();
  });

  this.connection.on('error', function(e) {
    console.error('WS Connection Error', e);
    _this._timeout();
  });

  this.connection.on('message', function(msg) {
    try {
      result = JSON.parse(msg);
      var id = result.id;
      // fire the callback
      if(_this.responseCallbacks[id]) {
        _this.responseCallbacks[id](null, result);
        delete _this.responseCallbacks[id];
      }
    } catch (e) {
      throw errors.InvalidResponse(e.data);
    }

    return result;
  });
};

/**
 * Should be called to make sync request
 *
 * @method send
 * @param {Object} payload
 * @return {Object} result
 */
WsProvider.prototype.send = function (payload) {
  throw new Error('You tried to send "'+ payload.method +'" synchronously. Synchronous requests are not supported by the WS provider.');
};

/**
 * Should be used to make async request
 *
 * @method sendAsync
 * @param {Object} payload
 * @param {Function} callback triggered on end with (err, result)
 */
WsProvider.prototype.sendAsync = function (payload, callback) {
  this.connection.send(JSON.stringify(payload));
  this._addResponseCallback(payload, callback);
};

/**
 * Synchronously tries to make WS request
 *
 * @method isConnected
 * @return {Boolean} returns true if request haven't failed. Otherwise false
 */
WsProvider.prototype.isConnected = function () {
  return this.connection.readyState === WebSocket.OPEN;
};

/**
Adds a callback to the responseCallbacks object,
which will be called if a response matching the response Id will arrive.

@method _addResponseCallback
*/
WsProvider.prototype._addResponseCallback = function(payload, callback) {
    var id = payload.id || payload[0].id;
    var method = payload.method || payload[0].method;

    this.responseCallbacks[id] = callback;
    this.responseCallbacks[id].method = method;
};

/**
Timeout all requests when the end/error event is fired

@method _timeout
*/
WsProvider.prototype._timeout = function() {
    for(var key in this.responseCallbacks) {
        if(this.responseCallbacks.hasOwnProperty(key)){
            this.responseCallbacks[key](errors.InvalidConnection('on WS'));
            delete this.responseCallbacks[key];
        }
    }
};

module.exports = WsProvider;
