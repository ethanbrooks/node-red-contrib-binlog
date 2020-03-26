
import { Red, Node, NodeProperties } from 'node-red';
// import { ZongJi } from 'zongji';
const ZongJi = require('zongji');

interface BinlogProps extends NodeProperties {
  map: any;
  mapType: 'json';
  config: any;
}

interface BinlogEvent {
  map: any;
}

interface BinlogStart {
  serverId?: number; // Default: 1	integer	Unique number (1 - 232) to identify this replication slave instance. Must be specified if running more than one instance of ZongJi. Must be used in start() method for effect.
  startAtEnd?: boolean; // Default: false	boolean	Pass true to only emit binlog events that occur after ZongJi's instantiation. Must be used in start() method for effect.
  filename?:	string;    // 	Begin reading events from this binlog file. If specified together with position, will take precedence over startAtEnd.
  position?:	number; // Begin reading events from this position. Must be included with filename.
  includeEvents?:	Array<string>;	// Example: ['writerows', 'updaterows', 'deleterows'] Array of event names to include
  excludeEvents?: Array<string>;  // Example: ['rotate', 'tablemap'] Array of event names to exclude
  includeSchema?:	object; // Object describing which databases and tables to include (Only for row events). Use database names as the key and pass an array of table names or true (for the entire database). Example: { 'my_database': ['allow_table', 'another_table'], 'another_db': true }
  excludeSchema?:	object;	// Object describing which databases and tables to exclude (Same format as includeSchema) Example: { 'other_db': ['disallowed_table'], 'ex_db': true }
}
/*
interface TableMap {
  timestamp: number; // 1585070110000,
  nextPosition: number; // 566172,
  size: number; // 65
  tableMap: {
    '128': {
      columnSchemas: [Array],
      parentSchema: 'demo',
      tableName: 'customers',
      columns: [Array]
    }
  },
  tableId: 128,
  flags: 1,
  schemaName: 'demo',
  tableName: 'customers',
  columnCount: 11,
  columnTypes: [
    15, 15, 15, 15, 15,
    15, 15, 15, 15, 15,
    15
  ],
  columnsMetadata: [
    { max_length: 5 },
    { max_length: 40 },
    { max_length: 30 },
    { max_length: 30 },
    { max_length: 60 },
    { max_length: 15 },
    { max_length: 15 },
    { max_length: 10 },
    { max_length: 15 },
    { max_length: 24 },
    { max_length: 24 }
  ]
}

interface UpdateRows {

*/

module.exports = function (RED: Red) {

  let reconnect = RED.settings.mysqlReconnectTime || 20000;
  let mysqldb = require('mysql');

  function MySQLNode (n) {
    RED.nodes.createNode(this,n);
    this.host = n.host;
    this.port = n.port;
    this.tz = n.tz || 'local';

    this.connected = false;
    this.connecting = false;

    this.dbname = n.db;
    this.setMaxListeners(0);
    let node = this;

    function checkVer () {
      node.connection.query('SELECT version();', [], function (err, rows) {
        if (err) {
          node.connection.release();
          node.error(err);
          node.status({ fill: 'red',shape: 'ring',text: 'Bad Ping' });
          doConnect();
        }
      });
    }

    function doConnect () {
      node.connecting = true;
      node.emit('state','connecting');
      if (!node.pool) {
        node.pool = mysqldb.createPool({
          host : node.host,
          port : node.port,
          user : node.credentials.user,
          password : node.credentials.password,
          database : node.dbname,
          timezone : node.tz,
          insecureAuth: true,
          multipleStatements: true,
          connectionLimit: 25
        });
      }

      node.pool.getConnection(function (err, connection) {
        node.connecting = false;
        if (err) {
          node.emit('state',err.code);
          node.error(err);
          node.tick = setTimeout(doConnect, reconnect);
        } else {
          node.connection = connection;
          node.connected = true;
          node.emit('state','connected');
          node.connection.on('error', function (err) {
            node.connected = false;
            node.connection.release();
            node.emit('state',err.code);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
              doConnect(); // silently reconnect...
            } else if (err.code === 'ECONNRESET') {
              doConnect(); // silently reconnect...
            } else {
              node.error(err);
              doConnect();
            }
          });
          if (!node.check) { node.check = setInterval(checkVer, 290000); }
        }
      });
    }

    this.connect = function () {
      if (!this.connected && !this.connecting) {
        doConnect();
      }
    };

    this.on('close', function (done) {
      if (this.tick) { clearTimeout(this.tick); }
      if (this.check) { clearInterval(this.check); }
      node.connected = false;
      node.emit('state',' ');
      node.pool.end(function (err) { done(); });
    });
  }
  RED.nodes.registerType('MySQLbinlog',MySQLNode, {
    credentials: {
      user: { type: 'text' },
      password: { type: 'password' }
    }
  });

  function BinlogNode (n: any) {
    let node: any = this;
    RED.nodes.createNode(node, n);

   // let node: Node = this;
    let props: BinlogProps = {
      'id': '1',
      'type': 'qwe',
      'name': 'as',
      'map': {},
      'mapType': 'json',
      'config': {}
    };

    let zongji = new ZongJi({
      host     : 'crm-40.neonzoom.com',
      port     : '3307',
      user     : 'root',
      password : 'password',
      debug: false
    });

//      console.log(JSON.parse(config.map).list);

        // Each change to the replication log results in an event

    zongji.on('binlog', function (event) {
  //  console.log(event.dump());
  //  console.log(event.getTypeName());

      switch (event.getTypeName()) {
        case 'BinlogEvent': { // Catch any other events
          node.send({'BinlogEvent': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
        case 'Rotate': { // Rotate	Insert/Update/Delete Query
          node.send({'Rotate': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
        case 'Format': { // Autoincrement; and; LAST_INSERT_ID;
          node.send({'Format': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
        case 'Query': { // 	New Binlog file Not required to be included to rotate to new files, but it is required to be included in order to keep the filename and position properties updated with current values for graceful restarting on errors. format	Format Description
          node.send({'Query': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
        case 'IntVar': { // 	Transaction ID
          node.send({'IntVar': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
        case 'Xid': { // 	Before any row event (must be included for any other row events)
          node.send({'Xid': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }

        case 'TableMap': { // 	Before any row event (must be included for any other row events)
          node.send({'TableMap': {
            'tableMap': event.tableMap,
            'timestamp': event.timestamp,
            'nextPosition': event.nextPosition,
            'size': event.size,
            'tableId': event.tableId,
            'flags': event.flags,
            'schemaName': event.schemaName,
            'tableName': event.tableName,
            'columnCount': event.columnCount,
            'columnTypes': event.columnTypes,
            'columnsMetadata': event.columnsMetadata
          }});
          break;
        }

        case 'Unknown': { // 	Before any row event (must be included for any other row events)
          node.send({'Unknown': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }

        case 'WriteRows': { // Rows inserted, row data array available as rows property on event object
          node.send({'WriteRows': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }

        case 'UpdateRows': {// Rows changed, row data array available as rows property on event object
          node.send({'UpdateRows': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});

          break;
        }

        case 'DeleteRows': {// Rows deleted, row data array available as rows property on event object
          node.send({'DeleteRows': {
            'tableMap': event.tableMap,
            'row': event.rows,
            'options': event._zongji.options
          }});
          break;
        }
      }
    });

/*
    try {
      // Each change to the replication log results in an event
      zongji.on('errorlog', function (error: any) {
        console.log('Error: ' + JSON.stringify(error));
        node.send(error);
      });
    } catch (error) {
      console.log('Error' + error);
      return node.error(error);
    }
*/

    // Binlog must be started, optionally pass in filters
    let binlogStart: BinlogStart = {
      startAtEnd: true,
 //     includeSchema: ['demo'],
      includeEvents: ['updaterows', 'tablemap', 'writerows', 'updaterows', 'deleterows']
    };

    zongji.start(binlogStart);

    process.on('SIGINT', function () {
      zongji.stop();
//        process.exit();
      console.log('zongji stoped');
      node.error('zongji stoped');
    });

    node.on('close', function (done) {
      console.log(done);
      node.error(done);
      zongji.stop();
    });

  }
  RED.nodes.registerType('binlog', BinlogNode);
};
