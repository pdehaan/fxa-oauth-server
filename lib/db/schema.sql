CREATE TABLE IF NOT EXISTS clients (
  uid BINARY(16) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  whitelisted BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;
