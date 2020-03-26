const ZongJi = require('zongji');
//import ZongJi from zongji;

const zongji = new ZongJi({
  host     : 'crm-40.neonzoom.com',
  port     : '3307',
  user     : 'root',
  password : 'password',
  debug: false
});

zongji.on('binlog', function(event) {
//  console.log(event.dump());
//  console.log(event.getTypeName());

  switch (event.getTypeName()) {
    case 'BinlogEvent': { // Catch any other events
        console.log( {"BinlogEvent": {
          "tableMap": event.tableMap,
          "row": event.rows,
          "options": event._zongji.options
        }});
      break;
    }
    case 'Rotate': { // Rotate	Insert/Update/Delete Query
      console.log( {"Rotate": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
    case 'Format': { // Autoincrement; and; LAST_INSERT_ID;
      console.log( {"Format": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
    case 'Query': { // 	New Binlog file Not required to be included to rotate to new files, but it is required to be included in order to keep the filename and position properties updated with current values for graceful restarting on errors. format	Format Description
      console.log( {"Query": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
    case 'IntVar': { // 	Transaction ID
      console.log( {"IntVar": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
    case 'Xid': { // 	Before any row event (must be included for any other row events)
      console.log( {"Xid": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
    
    case 'TableMap': { // 	Before any row event (must be included for any other row events)
      console.log( {"TableMap": {
        "tableMap": event.tableMap,
        "timestamp": event.timestamp,
        "nextPosition": event.nextPosition,
        "size": event.size,
        "tableId": event.tableId,
        "flags": event.flags,
        "schemaName": event.schemaName,
        "tableName": event.tableName,
        "columnCount": event.columnCount,
        "columnTypes": event.columnTypes,
        "columnsMetadata": event.columnsMetadata
      }});
      break;
    }

    case 'Unknown': { // 	Before any row event (must be included for any other row events)
      console.log( {"Unknown": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }

    case 'WriteRows': { // Rows inserted, row data array available as rows property on event object
      console.log( {"WriteRows": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }

    case 'UpdateRows': {// Rows changed, row data array available as rows property on event object
      console.log( {"UpdateRows": {
      "tableMap": event.tableMap,
      "row": event.rows,
      "options": event._zongji.options
    }});



      break;
    }

    case 'DeleteRows': {// Rows deleted, row data array available as rows property on event object
      console.log( {"DeleteRows": {
        "tableMap": event.tableMap,
        "row": event.rows,
        "options": event._zongji.options
      }});
      break;
    }
  };
});

 
// Binlog must be started, optionally pass in filters
zongji.start({
  startAtEnd: true,
  includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
});

process.on('SIGINT', function() {
  console.log('Got SIGINT.');
  zongji.stop();
  process.exit();
});
