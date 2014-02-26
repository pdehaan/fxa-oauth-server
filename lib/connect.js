/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Promise = require('./promise');

exports.transform = function fromConnect(middleware) {
  return function toHapi(req) {
    var d = Promise.defer();
    middleware(req.raw.req, req.raw.res, function next(err) {
      if (err) {
        return d.reject(err);
      }
      d.resolve();
    });
    return d;
  };
};
