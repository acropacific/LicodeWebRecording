var serverUrl = "/";
var localStream, room, recording, recordingId, dataStream,play;
var privateRoom;
var priFlag; //to mark playing recording publicly or privately
var isPublished = false;
var streamPlayedOne,streamPlayedTwo;
var playId;// to mark the recordingID that being played
 var person ;// to refer to userName

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
  dataStream.sendData({text:"playRecording",stream:recordingID,user:localStream.getID()});
};

function removeRecording(recordingID){
  
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
        

        if(stream.hasAudio()){	
          var div = document.createElement('div');
        div.setAttribute("style", "width: 320px; height: 200px;");
        div.setAttribute("id", "test"+stream.getID());
        document.getElementById("section").appendChild(div);
        stream.show("test"+stream.getID());
	}
	else{
    stream.addEventListener("stream-data", function(evt){
      console.log("from server side",evt.msg.text);

      if(evt.msg.text == "PLAY"){
        playId = evt.msg.playId;
		if(evt.msg.user == localStream.getID()){

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
                            document.getElementById("playpause").innerHTML = "PLAY recording " + playId + " privately";
                        });

                         privateRoom.addEventListener("stream-subscribed", function(streamEvent) {
                          var stream = streamEvent.stream;
                          var div = document.createElement('div');
                          div.setAttribute("style", "width: 320px; height: 200px;");
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
                              document.getElementById("playpause").innerHTML = "" ;
                              //deleteRoom(privateRoom.roomID);
                            });
                       });
              }
              else{
                console.log("not private!!");
                room.publish(streamPlayedOne);
              }
		}
  }
    if(evt.msg.text == "recordingList"){
      if(evt.msg.stream == localStream.getID()){
        for(var i = 1; i <= evt.msg.len; i++){
			var txt = document.createElement("p");
			txt.innerHTML ="recording "+i;
			document.getElementById("recordingList").appendChild(txt);
                    button_1 = document.createElement("button");
                    button_2 = document.createElement("button");
                 //   button_1.type = "button";
                    button_1.innerHTML = i;
                 //   button_2.type = "button";
                    button_2.innerHTML = i;
                    button_1.onclick = function(){
                        priFlag = false;
                         if(!play){
                                      console.log(this);
                                      console.log("playRecording list! ",this.innerHTML);
                                      playRecording(this.innerHTML);
                                      play = true;
                                      }
                                      else{
                                      play = false;
                                      removeRecording(this.innerHTML);
                                      console.log("removeRecording list! ",this.innerHTML);
                                      }
                    }

			button_2.onclick = function(){
                        priFlag = true;
                        if(!play){
                        playRecording(this.innerHTML);
                        console.log("playRecording List",this.innerHTML);
                        play = true;
                        }
                        else{
                        play = false;
                        removeRecording(this.innerHTML);
                        console.log("removeRecording List",this.innerHTML);
                        }
                	};
                  document.getElementById("recordingList").appendChild(button_1);
                  document.getElementById("recordingList").appendChild(button_2);
                }
              }
            }

		if(evt.msg.text == "recordingID"){

        	      var txt = document.createElement("p");
                txt.innerHTML ="recording "+ evt.msg.stream;
                document.getElementById("recordingList").appendChild(txt);
                var button_1 = document.createElement("button");
                var button_2 = document.createElement("button");
                button_1.innerHTML = evt.msg.stream;
                button_2.innerHTML = evt.msg.stream;
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


                    if(evt.msg.text == "addNewUser"){
                      console.log(evt.msg.userName);
                      var userList = evt.msg.userName;
                     
                    for (var index in userList) {
                        var name = userList[index];
                     console.log(index);
                            
                          if (name !== " ") {
                            var txt = document.createElement("p");
                              txt.innerHTML = name;
                              txt.id = index;
                              if(document.getElementById(index) == undefined)
                                    document.getElementById("userList").appendChild(txt);


          }
          else
            if(document.getElementById(index) !== undefined)
              document.getElementById("userList").removeChild(document.getElementById(index));
       }
                           
                     
                       
                    }
                  });
                  }
                });


      room.addEventListener("stream-added", function (streamEvent) {
        var streams = [];
        streams.push(streamEvent.stream);
        subscribeToStreams(streams);
        if(streamEvent.stream.getAttributes().type == "recording"){
          document.getElementById("playpause").innerHTML = "PLAY recording " + playId + " publicly";
        }
        if(streamEvent.stream.getID() == localStream.getID()){
         
            person = prompt("Please enter your name","");
  if (person != null) {
   /* var txt = document.createElement("p");
    txt.innerHTML = person;
    txt.id = localStream.getID();
    document.getElementById("userList").appendChild(txt);*/
    dataStream.sendData({text:"userName",userName:person,streamId:localStream.getID()});
         console.log("userName 3",localStream.getID(),person);
    }
        }
      });

     


      room.addEventListener("stream-removed", function (streamEvent) {
        var stream = streamEvent.stream;
        if (stream.elementID !== undefined&&stream.hasAudio()) {
          var element = document.getElementById(stream.elementID);
          console.log("stream removed",stream.elementID)
          document.getElementById("section").removeChild(element);	  
        }
        if(stream.getAttributes().type == "recording")
          document.getElementById("playpause").innerHTML = "" ;
        
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
