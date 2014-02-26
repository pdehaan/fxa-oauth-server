/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const url = require('url');

const Hapi = require('hapi');
const Joi = Hapi.types;
const Boom = Hapi.error;

const db = require('../db');

module.exports = {
  validate: {
    query: {
      /*jshint camelcase: false*/
      client_id: Joi.string().required(),
      precode: Joi.string().required(),
      redirect_uri: Joi.string(),
      scope: Joi.string(),
      state: Joi.string()
    }
  },
  handler: function authorizationEndpoint(req, reply) {
    //TODO: verify precode against auth-server, waiting on design doc
    var userid = req.query.precode;
    db.getClient(req.query.client_id)
    .then(function(client) {
      if (!client) {
        throw Boom.notFound();
      } else if (!client.whitelisted) {
        // TODO: implement external clients so we can remove this
        throw Boom.notImplemented();
      }

      if (!req.query.redirect_uri) {
        req.query.redirect_uri = client.redirectUri;
      }
      if (req.query.redirect_uri !== client.redirectUri) {
        throw Boom.badRequest('invalid_request');
      }

      return client;
    })
    .then(function(client) {
      return db.generateCode(client.uid, userid, req.query.scope);
    })
    .done(function(code) {
      // for now, since we only use whitelisted clients, we can just
      // redirect right away with a code
      var redirect = url.parse(req.query.redirect_uri, true);
      if (req.query.state) {
        redirect.query.state = req.query.state;
      }
      redirect.query.code = code;
      delete redirect.search;
      delete redirect.path;
      reply().redirect(url.format(redirect));
    }, reply);
  }
};

