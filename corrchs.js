var http = require('http');

http.createServer(function (request, response) {
// Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Content-Type', 'application/json; charset=UTF-8');
    response.setHeader('Transfer-Encoding', 'chunked');

    if ( request.method === 'OPTIONS' ) {
        response.writeHead(200);
        response.end();
        return;
    }    

    sendChunk(response);


}).listen(process.env.VMC_APP_PORT || 1337, null);


/*functions*/
gxMap = new Map();


generateRandomValues = function( numberOfValues, maxX, maxY ) {

    for ( var i = 0;  i < numberOfValues; i++ ) {
      var _x = Math.floor(Math.random() * maxX) + 1;
      var _y = Math.floor(Math.random() * maxY) + 1;
      gxMap.set( "elem"+i, {x:_x, y:_y} );
    }
    
    return false;
}


newzoom = function(maxx, maxy, w, h, z, dx, dy) {
    
    var _calcx, _calcy,_count, _key2, _obj;

    xMap2 = new Map();

    /* reduce the real values to a tiny map, grouping by scaling and rounding proximity 
     * as the scale z is shorter more real point go to the same graphic point */
     
     
    gxMap.forEach( function(value, key, map) {

        _calcx = Math.round((value.x - dx/z)*z);    
        _calcy = Math.round((value.y - dy/z)*z);

        _real = [];

        if (_calcx >= 0 && _calcx <= w &&
            _calcy >= 0 && _calcy <= h) {

            _count=0;
            _key2 = _calcx + "-" + _calcy;
            _obj = xMap2.get(_key2);

            //if the point alrady exists, add one to the counter the point stores. To know how many real points are in a graphic point 
            
            if (_obj) {
              _count = _obj.count;
              _real = _obj.real;
            }
            
            _real.push({x: value.x, y: value.y});
            
            //removing the duplicates
            _set = new Set(_real);
            _real = Array.from(_set);
            
            xMap2.set(_key2, {count: _count + 1, d: false, real: _real});
            
        }
    });
    
    return( simpleDensityCleaning(3, xMap2) );
}


    
simpleDensityCleaning = function(radius, xMap2) {
    
    xMap2.forEach( function(value, key, map) {

        /*if not flagged to delete*/
        if ( !value.d) {
            _key = key.split("-");
            _x = parseInt(_key[0]);
            _y = parseInt(_key[1]);
            _count = value.count;
            for ( var iX = - radius;  iX < radius; iX ++ ) {
                
                _tX = _x + iX;
                for ( var iY = - radius;  iY < radius; iY ++ ) {
                    
                    _tY = _y + iY;
                    
                    if(_tX != parseInt(_x) || _tY != parseInt(_y)) {
                        _el = xMap2.get(_tX + "-" + _tY);
                        if ( _el && _el != undefined ) {  
                            if (_el.count <= _count) {
                                /*flag the neighbour element to be deleted*/
                                xMap2.set(_tX + "-" + _tY, {count: _el.count, d:true});
                            }
                            else {
                                /*flag this element to be deleted*/
                                xMap2.set(key, {count: _count, d:true});
                                
                                //stop the cleancy for this element
                                _iX = radius;
                                _iY = radius;
                                
                            }
                        }
                    }                   
                }
            }
            
        }
    });
        
    /*create the new array with the elements not flagged to delete */
    _xmap = new Map();
    
    xMap2.forEach( function(value, key, map) {

        /*if not flagged to delete*/
        if ( !value.d) {
            _xmap.set(key, {count: value.count, real: value.real});
        }
        else {
            /*some element was deleted*/
            _someElementsDeleted = true;
        }
    });
    
    xMap2 = _xmap;

    //console.log(xMap2);
    console.log(xMap2.size);

    xArray2 = [];

    var i = 0;
    xMap2.forEach( function(value, key, map) {    
        xArray2.push({k: key, i:i, v:value, extra:{a: "01234567890123456789", b:"0123456789012345678901234567890123456789", c: "0123456789012345678901234567890123456789"}});
        i++;
        console.log("i:>> "+i + " <<");
    });
    var _z = JSON.stringify(xArray2);
    //console.log(_z);
    console.log(xMap2.size);
    console.log(_z.length);  
console.log("xArray2.length: " +xArray2.length);
    return(xArray2);
}   


sendChunk = function(response) {

console.log("gLastChunkSent: " + gLastChunkSent);
    var initialRecord = gLastChunkSent * gRecordsxChunk;
    var  endRecord = (gLastChunkSent + 1) * gRecordsxChunk;

    if (gData.length < endRecord) {
        endRecord = gData.length;
    }

    var _chunk = [];

    var i;
    for (i = initialRecord; i < endRecord; i++ )  {
        _chunk.push(gData[i]);
    }

console.log("i: " + i + "  - gData.length: " + gData.length);

    if (gInterval) {
        clearInterval(gInterval);
    }

    if (i < gData.length) {

        console.log("****");
        //console.log(JSON.stringify(_chunk));
        console.log("****");

        response.write( JSON.stringify({ chunkPayLoad: _chunk, chunkN: gLastChunkSent+1, chunks: gMaxChunks }) );

        gInterval = setInterval(function() { sendChunk(response); }, gChunkInterval);
        gLastChunkSent++;
    } 
    else {
        response.end( JSON.stringify({ chunkPayLoad: _chunk, chunkN: gLastChunkSent+1, chunks: gMaxChunks }) );
        gLastChunkSent = 0;
    }

} 

/****************************
     S t a r t
**************************/
generateRandomValues(1000, 1000, 1000);

var gData = newzoom( 1000, 1000, 700, 700, 0.7, 0, 0);

console.log("gData.length: " + gData.length);

/*remaining starting the dtaa chinking*/
var averageRecordSize = 200;
var desiredChunkSize = 2*1024;   //300kBytes

var gRecordsxChunk = Math.floor(desiredChunkSize/ averageRecordSize);
var gMaxChunks = Math.ceil(gData.length / gRecordsxChunk); 
var gLastChunkSent = 0;
var gChunkInterval = 50; //milliseconds elapsed until next chunk sent.
var gInterval;

console.log("gRecordsxChunk: " + gRecordsxChunk ); 

console.log("gMaxChunks: " + gMaxChunks ); 
