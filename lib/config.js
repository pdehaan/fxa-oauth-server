/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const path = require('path');

const convict = require('convict');

const conf = convict({
  db: {
    driver: {
      env: 'DB',
      format: ['mysql', 'memory'],
      default: 'memory'
    }
  },
  env: {
    arg: 'node-env',
    doc: 'The current node.js environment',
    env: 'NODE_ENV',
    format: ['dev', 'test', 'stage', 'prod'],
    default: 'dev'
  },
  logging: {
    formatters: {
      doc: 'http://seanmonstar.github.io/intel/#formatters',
      default: {
        console: {
          format: '%(name)s.%(levelname)s: %(message)s',
          colorize: true
        },
        'console_with_time': {
          format: '[%(date)s] %(name)s.%(levelname)s: %(message)s',
          datefmt: '%Y-%m-%d %H:%M:%S.%L',
          colorize: true
        },
        json: {
          format: '%O'
        }
      }
    },
    handlers: {
      doc: 'http://seanmonstar.github.io/intel/#handlers',
      default: {
        console: {
          class: 'intel/handlers/console',
          formatter: 'console'
        }
      }
    },
    loggers: {
      doc: 'http://seanmonstar.github.io/intel/#logging',
      default: {
        fxa: {
          handlers: ['console'],
          handleExceptions: true,
          level: 'ALL',
          propagate: false
        }
      }
    }
  },
  mysql: {
    createSchema: {
      env: 'CREATE_MYSQL_SCHEMA',
      default: true
    },
    user: {
      default: 'root',
      env: 'MYSQL_USERNAME'
    },
    password: {
      default: '',
      env: 'MYSQL_PASSWORD'
    },
    database: {
      default: 'fxa_oauth',
      env: 'MYSQL_DATABASE'
    },
    host: {
      default: '127.0.0.1',
      env: 'MYSQL_HOST'
    },
    port: {
      default: '3306',
      env: 'MYSQL_PORT'
    }
  },
  publicUrl: {
    format: 'url',
    env: 'PUBLIC_URL',
    default: 'http://localhost:9001'
  },
  server: {
    host: {
      env: 'HOST',
      default: 'localhost'
    },
    port: {
      env: 'PORT',
      format: 'port',
      default: 9001
    }
  }
});

var envConfig = path.join(__dirname, '..', 'config', conf.get('env') + '.json');
var files = (envConfig + ',' + process.env.CONFIG_FILES)
  .split(',').filter(fs.existsSync);
conf.loadFile(files);


conf.validate();

module.exports = conf;
