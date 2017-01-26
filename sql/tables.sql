CREATE ROLE etherwriter WITH LOGIN;
ALTER ROLE etherwriter WITH PASSWORD 'password';

CREATE TABLE blocks (
  "number" BIGSERIAL PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  parentHash TEXT NOT NULL,
  nonce TEXT NOT NULL,
  sha3Uncles TEXT NOT NULL,
  logsBloom TEXT NOT NULL,
  transactionsRoot TEXT NOT NULL,
  stateRoot TEXT NOT NULL,
  receiptRoot TEXT NOT NULL,
  miner TEXT NOT NULL,
  difficulty NUMERIC NOT NULL,
  totalDifficulty NUMERIC NOT NULL,
  size BIGINT NOT NULL,
  extraData TEXT NOT NULL,
  gasLimit BIGINT NOT NULL,
  gasUsed BIGINT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL
);

CREATE TABLE transactions (
  hash TEXT PRIMARY KEY,
  nonce BIGINT,
  blockHash TEXT NOT NULL REFERENCES blocks(hash) ON DELETE CASCADE ON UPDATE CASCADE,
  blockNumber BIGINT NOT NULL REFERENCES blocks("number") ON DELETE CASCADE ON UPDATE CASCADE,
  transactionIndex BIGINT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "value" NUMERIC NOT NULL,
  gas BIGINT NOT NULL,
  gasPrice NUMERIC NOT NULL,
  "input" TEXT
);

CREATE TABLE uncles (
  hash TEXT PRIMARY KEY,
  blockNumber BIGINT NOT NULL REFERENCES blocks("number") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE VIEW view_last_block
AS
SELECT b.number
FROM blocks b
WHERE b.number = (SELECT max(b2.number) FROM blocks b2);

CREATE INDEX idx_transactions_from
ON transactions("from");

CREATE INDEX idx_transactions_to
ON transactions("to");

GRANT SELECT ON TABLE view_last_block TO etherwriter;
GRANT INSERT ON TABLE blocks TO etherwriter;
GRANT INSERT, SELECT, UPDATE ON TABLE transactions TO etherwriter;
GRANT INSERT ON TABLE uncles TO etherwriter;
