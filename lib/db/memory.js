/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Promise = require('../promise');
const uid = require('../uid');


/*
 * MemoryStore structure:
 * MemoryStore = {
 *   clients: {
 *     <uid>: {
 *       uid: <uid>,
 *       secret: <string>,
 *       name: <string>,
 *       redirectUri: <string>,
 *       whitelisted: <boolean>
 *     }
 *   },
 *   codes: {
 *     <uid>: {
 *       uid: <uid>,
 *       clientId: <client_uid>,
 *       userId: <user_uid>,
 *       scope: <string>
 *     }
 *   },
 *   tokens: {
 *     <uid>: {
 *       uid: <uid>,
 *       clientId: <client_uid>,
 *       userId: <user_uid>,
 *       type: <string>,
 *       scope: <string>
 *     }
 *   }
 * }
 */
function MemoryStore() {
  if (!(this instanceof MemoryStore)) {
    return new MemoryStore();
  }
  this.clients = {};
  this.codes = {};
  this.tokens = {};
}

MemoryStore.connect = function memoryConnect() {
  return Promise.resolve(new MemoryStore());
};

MemoryStore.prototype = {
  registerClient: function registerClient(client) {
    client.uid = uid.id();
    client.secret = uid.secret();
    this.clients[client.uid] = client;
    return Promise.resolve(client);
  },
  getClient: function getClient(id) {
    return Promise.resolve(this.clients[id]);
  },
  generateCode: function generateCode(clientId, userId, scope) {
    var code = {};
    code.clientId = clientId;
    code.userId = userId;
    code.scope = scope;
    code.uid = uid.id();
    this.codes[code.uid] = code;
    return Promise.resolve(code.uid);
  },
  getCode: function getCode(codeId) {
    return Promise.resolve(this.codes[codeId]);
  },
  generateToken: function generateToken(code) {
    delete this.codes[code.uid];
    var token = {};
    token.uid = uid.token();
    token.clientId = code.clientId;
    token.userId = code.userId;
    token.scope = code.scope;
    token.type = 'bearer';
    this.tokens[token.uid] = token;
    return Promise.resolve(token);
  }
};

module.exports = MemoryStore;
