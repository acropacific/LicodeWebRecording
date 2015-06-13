/*global require, __dirname, console*/
var express = require('express'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler'),
    morgan = require('morgan'),
    net = require('net'),
    N = require('./nuve'),
    fs = require("fs"),
    config = require('./licode_config'),
    Erizo = require('./erizofc');

var app = express();

// app.configure ya no existe
"use strict";
app.use(errorhandler({
    dumpExceptions: true,
    showStack: true
}));
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


var localStream = Erizo.Stream({audio:false, video:false, data: true, attributes:{type:'serverStream'}});
var serverUrl = "http://localhost:3001/";
var theStreams = [];
var recordingList = [];
var recordingID;
var streamPlayed;
var username;
var role;
var startErizoFc = function (token){
    var room;
    room = Erizo.Room({token: token});
     console.log("create erizofc");
     console.log("room");
      room.connect();
      
    room.addEventListener("room-connected", function(event) {
        console.log("Fake client Connected!");
        room.publish(localStream);
    });

    room.addEventListener("stream-added", function(event) {
        console.log('stream added', event.stream.getID());
        theStreams[event.stream.getID()]=event.stream;
        if(!event.stream.hasAudio()&&event.stream.getID() !== localStream.getID())
                room.subscribe(event.stream,{audio: false, video: false, data:true});
    });


    room.addEventListener("stream-subscribed", function(streamEvent) {
        var stream = streamEvent.stream;
	stream.addEventListener("stream-data", function(evt){
            console.log('Received data ', evt.msg, 'from stream ', evt.stream.getAttributes().type);
	
	  if (evt.msg.text=="recordMe") {
                room.startRecording(theStreams[evt.msg.stream], function (id) {
                recordingList[recordingID]=id;
                localStream.sendData({text:"recordingID", stream:recordingID+1});   
		});
	  }
      
	  if (evt.msg.text=="stopRecording") {
                    room.stopRecording(recordingList[recordingID], function (id) {
                        recordingID++;
                    });
                }

                if (evt.msg.text=="playRecording") {
                    localStream.sendData({text:"PLAY", stream:recordingList[Number(evt.msg.stream)-1],user:evt.msg.user,playId:evt.msg.stream});   
                }
	  
	  if(evt.msg.text=="removeRecording"){
	       localStream.sendData({text:"STOP"});   		
	  }
	
	  if(evt.msg.text=="loadRecordings"){
               localStream.sendData({text:"recordingList",len:recordingList.length,stream:evt.msg.stream});
               console.log("recordingList !!!",recordingList.length);
	  }

	});
    });

    room.addEventListener("stream-removed", function (streamEvent) {
        var stream = streamEvent.stream;
        if (stream.elementID !== undefined) {
     //     var element = document.getElementById(stream.elementID);
       //   document.body.removeChild(element);
	console.log(stream.elementID,' has been removed');
        }
      });

   
};



N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

var myRoom;

N.API.getRooms(function(roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);

    //check and see if one of these rooms is 'basicExampleRoom'
    for (var room in rooms) {
        if (rooms[room].name === 'basicExampleRoom'){
            myRoom = rooms[room]._id;
        }
       /* if(rooms[room].name === 'privateRoom'){
               N.API.deleteRoom(rooms[room]._id, function(result) {
                console.log('Result: ', result);
            });
        }*/
    }
    if (!myRoom) {

        N.API.createRoom('basicExampleRoom', function(roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        console.log('Using room', myRoom);
    }

    var room = myRoom,
    username = "erizoFc",
    role = "presenter";
    N.API.createToken(room, username, role, function(token) {
            recordingID = 0;
            startErizoFc(token);
    });

});


app.get('/getRooms/', function(req, res) {
    "use strict";
    N.API.getRooms(function(rooms) {
        res.send(rooms);
    });
});

app.get('/getUsers/:room', function(req, res) {
    "use strict";
    var room = req.params.room;
    N.API.getUsers(room, function(users) {
        res.send(users);
    });
});

app.post('/createToken/', function(req, res) {
    "use strict";
     var room;
     console.log("!!!!!",req.body.userName);
    username = req.body.userName;

    role = req.body.role;
    if(username =="recordingPlayer"){
           N.API.createRoom('privateRoom', function(roomID) {
            room = roomID._id;
            console.log('Created room ', room);
            N.API.createToken(room, username, role, function(token) {
            res.send(token);
    });
        });
    }
    else{
    room = myRoom;
    N.API.createToken(room, username, role, function(token) {
        //console.log(token);
        res.send(token);
    });
    }
});

app.post('/deleteRoom',function(req,res){
    var roomId = req.body.roomId;
    N.API.deleteRoom(roomId, function(result) {
  console.log('Result: ', result);
});
})

app.use(function(req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

app.listen(3001);
console.log('server has started')
