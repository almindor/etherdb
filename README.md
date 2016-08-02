# etherdb
Ethereum to postgreSQL data importer for twin chains (ETH and ETC both in same DB)

Create "etherdb" database with postgreSQL and run `sql/tables.sql` in it via psql
or pgadmin. The connection string to your DB is hardcoded in app.js top, change
as necessary.

NOTE: postgresql 9.5+ required due to upserts.

1. Create "etherdb" database with postgreSQL (`createdb` or via pgAdmin)
2. Run `sql/tables.sql` inside the new DB (`psql` or pgAdmin)
3. Edit `app.js` to change the PSQL connection string if neccessary (defaults to postgres/password)
4. Install dependencies with npm install
5. Run with `node app.js eth` while geth is running in pro-fork mode (and is synced) to get all the blocks and transactions for ETH chain. The app does NOT exit it enters
into sleep mode when done, so check for that.
6. Run with `node app.js etc` while geth is running in oppose-fork mode (and is synced) to get ETC chain data. NOTE: if you need to change data directory and thus
the IPC path use `ETH_IPC_PATH` env var to set it differently when running with ETC.

The default IPC path is set for mac os X to `/Users/<user>/Library/Ethereum/geth.ipc`

NOTE: internal transactions (contract ones) are NOT scraped

The tables are always `<prefix>_blocks`, `<prefix>_transactions` and `<prefix>_uncles` prefix being either `etc` or `eth` depending on chain.
