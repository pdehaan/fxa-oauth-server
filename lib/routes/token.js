/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');
const Joi = Hapi.types;
const Boom = Hapi.error;

const db = require('../db');

module.exports = {
  validate: {
    payload: {
      /*jshint camelcase: false*/
      client_id: Joi.string().required(),
      client_secret: Joi.string().required(),
      code: Joi.string().required()
    }
  },
  response: {
    schema: {
      access_token: Joi.string().required(),
      scopes: Joi.array(),
      token_type: Joi.string().valid('bearer')
    }
  },
  handler: function tokenEndpoint(req, reply) {
    db.getClient(req.payload.client_id).then(function(client) {
      if (!client) {
        throw Boom.notFound();
      } else if (!client.whitelisted) {
        // TODO: implement external clients so we can remove this
        throw Boom.notImplemented();
      } else if (client.secret !== req.payload.client_secret) {
        throw Boom.badRequest();
      }

      return client;
    })
    .then(function(client) {
      return db.getCode(req.payload.code).then(function(code) {
        if (!code) {
          throw Boom.badRequest();
        } else if (code.clientId !== client.uid) {
          throw Boom.badRequest();
        }
        return code;
      });
    })
    .then(db.generateToken)
    .done(function(token) {
      reply({
        access_token: token.uid,
        token_type: token.type,
        scopes: [] // XXX: token.scope.split(',')?
      });
    }, reply);
  }
};

