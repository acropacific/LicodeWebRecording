var serverUrl = "/";
var localStream, room, recording, recordingId, dataStream,play;
var privateRoom;
var priFlag; //to mark playing recording publicly or privately
var isPublished = false;
var streamPlayedOne,streamPlayedTwo;
var button_1,button_2;

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
  results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

function startRecording() {
  if (room !== undefined){
    if (!recording){
    dataStream.sendData({text:"recordMe", stream:localStream.getID()});
	recording = true;      
     document.getElementById("recordButton").innerHTML = "STOP"; 
    } 
    else {
    dataStream.sendData({text:"stopRecording", stream:localStream.getID()});
    recording = false;
    document.getElementById("recordButton").innerHTML = "START"; 
    }
  } 
};

function playRecording(recordingID){
  document.getElementById("playpause").innerHTML = "PLAY RECORDING" + recordingID;
  dataStream.sendData({text:"playRecording",stream:recordingID,user:localStream.getID()});
};

function removeRecording(recordingID){
  document.getElementById("playpause").innerHTML = "" ;
  dataStream.sendData({text:"removeRecording",stream:recordingID});
};

  var createToken = function(userName, role, callback) {
    var req = new XMLHttpRequest();
    var url = serverUrl + 'createToken/';
    var body = {userName: userName, role: role};
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        callback(req.responseText);
      }
    };
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
  };

  var deleteRoom = function(roomId){
    console.log("deleteRoom ",roomId);
    var req = new XMLHttpRequest;
    var url = serverUrl + 'deleteRoom/';
    var body = {roomId:roomId};
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type','application/json');
    req.send(JSON.stringify(body));
  };

window.onload = function () {

  document.getElementById('load').addEventListener('click',function(){
    dataStream.sendData({text:"loadRecordings",stream:localStream.getID()});
  },false);

  recording = false;
  play = false;
  var screen = getParameterByName("screen");
  var config = {audio: true, video: false, data: true, screen: screen, videoSize: [640, 480, 640, 480],attributes:{type:'localStream'}};
  if (screen){
   config.extensionId = "okeephmleflklcdebijnponpabbmmgeo";
  }
  dataStream = Erizo.Stream({audio:false, video:false, data:true, attributes:{type:'clientStream'}}); 
  localStream = Erizo.Stream(config);

  createToken("user", "presenter", function (response) {
    var token = response;
    room = Erizo.Room({token: token});

    localStream.addEventListener("access-accepted", function () {
     
      var subscribeToStreams = function (streams) {
        for (var index in streams) {
          var stream = streams[index];
          if (localStream.getID() !== stream.getID() &&dataStream.getID() !== stream.getID()) {
          //  if(stream.getAttributes().type !=='recording'||stream.getID() == streamPlayedOne.getID())
              room.subscribe(stream);
          //  console.log("stream ID ",streamPlayedOne.getID());
          }
       }
     };

      room.addEventListener("room-connected", function (roomEvent) {
        room.publish(localStream, {maxVideoBW: 3000, minVideoBW:500});
        room.publish(dataStream);
        subscribeToStreams(roomEvent.streams);
      });

       room.addEventListener("stream-subscribed", function(streamEvent) {
        var stream = streamEvent.stream;
        var div = document.createElement('div');
        div.setAttribute("style", "width: 320px; height: 240px;");
        div.setAttribute("id", "test" + stream.getID());

        if(stream.hasAudio()){	
        document.getElementById("section").appendChild(div);
        stream.show("test"+stream.getID());
	}
	else{
    stream.addEventListener("stream-data", function(evt){
      console.log("from server side",evt.msg.text);

		if(evt.msg.text == "PLAY"&&evt.msg.user == localStream.getID()){

		streamPlayedOne = Erizo.Stream({audio:true, video:false, recording:evt.msg.stream, attributes:{type:'recording'}});
	//	room.publish(streamPlayedOne);
              if(priFlag){
                console.log("play recording privately!!  ");
                      createToken("recordingPlayer","presenter",function(response){
                        var token = response;
                        privateRoom = Erizo.Room({token:token});
                        privateRoom.connect();

                        privateRoom.addEventListener("room-connected",function(roomEvent){
                                privateRoom.publish(streamPlayedOne);
                              
                              });

                         privateRoom.addEventListener("stream-added",function(streamEvent){
                            privateRoom.subscribe(streamEvent.stream);
                        });

                         privateRoom.addEventListener("stream-subscribed", function(streamEvent) {
                          var stream = streamEvent.stream;
                          var div = document.createElement('div');
                          div.setAttribute("style", "width: 320px; height: 240px;");
                          div.setAttribute("id", "test" + stream.getID());
                          document.getElementById("section").appendChild(div);
                          stream.show("test"+stream.getID());
                        });

                         privateRoom.addEventListener("stream-removed", function (streamEvent) {
                              var stream = streamEvent.stream;
                              if (stream.elementID !== undefined) {
                                var element = document.getElementById(stream.elementID);
                                console.log("privateRoom recording removed",stream.elementID);
                                document.getElementById("section").removeChild(element);    
                              }
                              deleteRoom(privateRoom.roomID);
                            });
                       });
              }
              else{
                console.log("not private!!");
                room.publish(streamPlayedOne);
              }
		}

    if(evt.msg.text == "recordingList"){
      if(evt.msg.stream == localStream.getID()){
        for(var i = 1; i <= evt.msg.len; i++){
			var txt = document.createElement("p");
			txt.innerHTML ="recording "+i;
			document.getElementById("recordingList").appendChild(txt);
                    button_1 = document.createElement("p");
                    button_2 = document.createElement("p");
                 //   button_1.type = "button";
                    button_1.innerHTML = i;
                 //   button_2.type = "button";
                    button_2.innerHTML = i;
                    button_1.onclick = function(){
                        priFlag = false;
                         if(!play){
                                      console.log(button_1);
                                      console.log("playRecording list! ",button_1.innerHTML);
                                      playRecording(button_1.innerHTML);
                                      play = true;
                                      }
                                      else{
                                      play = false;
                                      removeRecording(button_1.innerHTML);
                                      console.log("removeRecording list! ",button_1.innerHTML);
                                      }
                    }

			button_2.onclick = function(){
                        priFlag = true;
                        if(!play){
                        playRecording(b_2_txt);
                        console.log("playRecording List",b_2_txt);
                        play = true;
                        }
                        else{
                        play = false;
                        removeRecording(b_2_txt);
                        console.log("removeRecording List",b_2_txt);
                        }
                	};
                  document.getElementById("recordingList").appendChild(button_1);
                  document.getElementById("recordingList").appendChild(button_2);
                }
              }
            }

		if(evt.msg.text == "recordingID"){
		 console.log("recordingID !!!");
        	var txt = document.createElement("p");
                txt.innerHTML ="recording "+ evt.msg.stream;
                document.getElementById("recordingList").appendChild(txt);
                var button_1 = document.createElement("button");
                var button_2 = document.createElement("button");
                  button_1.onclick = function(){
                    priFlag = false;
  			if(!play){
  			playRecording(evt.msg.stream);
  			console.log("playRecording",evt.msg.stream);
  			play = true;
  			}
  			else{
  			play = false;
  			removeRecording(evt.msg.stream);	
  			console.log("removeRecording",evt.msg.stream);
                          }
                        };

                  button_2.onclick = function(){
                  priFlag = true;
                  if(!play){
                  playRecording(evt.msg.stream);
                  console.log("playRecording",evt.msg.stream);
                  play = true;
                  }
                  else{
                  play = false;
                  removeRecording(evt.msg.stream);  
                  console.log("removeRecording",evt.msg.stream);
                }
              };

                  document.getElementById("recordingList").appendChild(button_1);
                  document.getElementById("recordingList").appendChild(button_2);
                    }

                    if(evt.msg.text == "STOP"){
                      
                     streamPlayedOne.close();
                    console.log("priFlag",priFlag);
                           
                     
                       
                    }
                  });
                  }
                });


      room.addEventListener("stream-added", function (streamEvent) {
        var streams = [];
        streams.push(streamEvent.stream);
        subscribeToStreams(streams);
        console.log(streamEvent.stream.getID(),"stream-added");
        console.log(streamEvent.stream.getAttributes().type ,"type");

      });

     


      room.addEventListener("stream-removed", function (streamEvent) {
        var stream = streamEvent.stream;
        if (stream.elementID !== undefined&&stream.hasAudio()) {
          var element = document.getElementById(stream.elementID);
          console.log("stream removed",stream.elementID)
          document.getElementById("section").removeChild(element);	  
        }
      });
      


      room.addEventListener("stream-failed", function (streamEvent){
          console.log("STREAM FAILED, DISCONNECTION");
          room.disconnect();

      });

      room.connect();
      localStream.show("myVideo");


    });
    localStream.init();
  });
};
