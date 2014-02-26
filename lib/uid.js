/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const crypto = require('crypto');

function uid(length) {
  return crypto.randomBytes(length / 2).toString('hex');
}

function fn(length) {
  return function udid() {
    return uid(length);
  };
}

uid.id = fn(16);
uid.secret = fn(128);
uid.code = fn(32);
uid.token = fn(64);

module.exports = uid;
