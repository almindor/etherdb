var net = require( 'net' );
var async = require( 'async' );
var pg = require( 'pg' );
var conString = "postgres://etherwriter:password@localhost/etherdb";
var Web3 = require( 'web3' );
var web3 = new Web3();
var username = require( 'username' );
var sleep = require( 'sleep' );
var client;
var ipc_path = process.env.ETH_IPC_PATH || '/home/' + username.sync() + '/.local/share/io.parity.ethereum/jsonrpc.ipc';

function mapValue( p, source ) {
  var result = source[p];

  if ( ['number', 'size', 'nonce', 'gasLimit', 'gasUsed', 'difficulty',
        'totalDifficulty', 'blockNumber', 'transactionIndex', 'value',
        'gas', 'gasPrice'].indexOf( p ) >= 0 ) {
    return Number(result);
  }

  if ( ['timestamp'].indexOf( p ) >= 0 ) {
    return new Date(Number(result) * 1000);
  }

  return String(result);
}

function mapField( p ) {
  // skipped fields
  if ( ['transactions', 'uncles', 'creates',
        'raw', 'author', 'mixHash', 'sealFields'].indexOf(p) >= 0 ) {
    return null;
  }

  if ( p == 'receiptsRoot' ) {
    return '"receiptroot"'; // historical name, we used the old one in DB
  }

  if ( p == 'sealFields' ) {
    return '"nonce"'; // parity
  }

  return '"' + p.toLowerCase() + '"';
}

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
};

function writeToDb( source, table, callback ) {
  var fields = [];
  var params = [];
  var values = [];

  var i = 1;
  for ( var p in source ) {
    var field = mapField( p );
    if ( !field ) continue; // skipped field

    fields.push( field );
    values.push( mapValue( p, source ) );
    params.push( '$' + i++ );
  }

  var sql = 'INSERT INTO ' + table + '(' + fields.join(',') + ')\n';
  sql += 'VALUES(' + params.join(',')+ ')\n';

  // upsert on transactions
  if ( table == 'transactions' ) {
    sql += 'ON CONFLICT ON CONSTRAINT transactions_pkey\n';
    sql += 'DO UPDATE SET\n';
    for ( var j = 0; j < fields.length; j++ ) {
      var f = fields[j];
      if ( f == 'hash' ) continue;
      sql += f + ' = excluded.' + f + ',\n';
    }
    sql = sql.replaceAt(sql.length - 2, '\n');
  }

  client.query(sql, values, function(err, result) {
    if( err ) {
      console.error( sql );
      console.error( values );
      return callback( err );
    }
    callback( null, result );
  });
}

function processDetails( block, table, callback ) {
  async.each( block[table], function ( d, done ) {
    if ( table == 'uncles' ) {
      d = { hash: d, blockNumber: block.number }; // we need this in the DB for uncles
    }

    writeToDb( d, table, done );
  }, function ( err ) {
    return callback( err ) ;
  } );
}

function getBlock( err, num, callback ) {
  web3.eth.getBlock(num, true, function( err, block ) {
    if ( err ) {
      return callback( err );
    }

    if ( !block ) {
      return callback();
    }

    if ( block.number % 1000 === 0 ) {
      console.log( block.number );
    }

    writeToDb( block, 'blocks', function( err, result ) {
      if ( err ) {
        return callback( err );
      }

      async.parallel( [
        function ( cb ) {
          processDetails( block, 'transactions', cb );
        },
        function ( cb ) {
          processDetails( block, 'uncles', cb );
        }
      ], function ( err, result ) {
        if ( err ) {
          console.error( err ); // just skip, it seems we're getting dup. transactions sometimes!
        }
        getBlock( null, num + 1, callback );
      } );
    } );
  } );
}

pg.connect(conString, function(err, c, done) {
  if ( err ) {
    console.error('Error on PSQL connection: ' + err);
    return done( err );
  }

  client = c;
  web3.setProvider(new web3.providers.IpcProvider(ipc_path, net));
  var gb_error;

  function getBlocks( callback ) {
    var sql = 'SELECT COALESCE(lb.number, -1) AS max FROM view_last_block lb';
    client.query(sql, [], function( err, result ) {
      if( err ) {
        return callback ( err );
      }

      var fromBlock = (result && result.rows && result.rows.length) ? Number(result.rows[0].max) + 1 : 0;
      console.log( 'Resuming from block: ' + fromBlock );
      getBlock( null, fromBlock, function ( err ) {
        if ( err ) {
          return callback( err );
        }

        console.log( 'Done batch, sleeping 20s' );
        sleep.sleep( 20 );
        return callback();
      } );
    } );
  }

  async.whilst(
    function () {
      return !gb_error;
    },
    getBlocks,
    function ( err, n ) {
      done( err );
      if ( err ) {
        gb_error = err;
        console.error( err, n );
        process.exit(1);
      }
    }
  );
} );
