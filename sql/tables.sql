CREATE TABLE eth_blocks (
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

CREATE TABLE etc_blocks (
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

CREATE TABLE eth_transactions (
  hash TEXT PRIMARY KEY,
  nonce BIGINT,
  blockHash TEXT NOT NULL REFERENCES eth_blocks(hash) ON DELETE CASCADE ON UPDATE CASCADE,
  blockNumber BIGINT NOT NULL REFERENCES eth_blocks("number") ON DELETE CASCADE ON UPDATE CASCADE,
  transactionIndex BIGINT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "value" NUMERIC NOT NULL,
  gas BIGINT NOT NULL,
  gasPrice NUMERIC NOT NULL,
  "input" TEXT
);

CREATE TABLE etc_transactions (
  hash TEXT PRIMARY KEY,
  nonce BIGINT,
  blockHash TEXT NOT NULL REFERENCES etc_blocks(hash) ON DELETE CASCADE ON UPDATE CASCADE,
  blockNumber BIGINT NOT NULL REFERENCES etc_blocks("number") ON DELETE CASCADE ON UPDATE CASCADE,
  transactionIndex BIGINT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "value" NUMERIC NOT NULL,
  gas BIGINT NOT NULL,
  gasPrice NUMERIC NOT NULL,
  "input" TEXT
);

CREATE TABLE eth_uncles (
  hash TEXT PRIMARY KEY,
  blockNumber BIGINT NOT NULL REFERENCES eth_blocks("number") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE etc_uncles (
  hash TEXT PRIMARY KEY,
  blockNumber BIGINT NOT NULL REFERENCES etc_blocks("number") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE VIEW eth_last_block
AS
SELECT b.number
FROM eth_blocks b
WHERE b.number = (SELECT max(b2.number) FROM eth_blocks b2);

CREATE VIEW etc_last_block
AS
SELECT b.number
FROM etc_blocks b
WHERE b.number = (SELECT max(b2.number) FROM etc_blocks b2);

CREATE INDEX idx_eth_transactions_from
ON eth_transactions("from");

CREATE INDEX idx_eth_transactions_to
ON eth_transactions("to");

CREATE INDEX idx_etc_transactions_from
ON etc_transactions("from");

CREATE INDEX idx_etc_transactions_to
ON etc_transactions("to");
