var serverUrl = "/";
var localStream, room, recording, recordingId, dataStream,play;
var isPublished = false;
//var playRecording = [];
var streamPlayedOne,streamPlayedTwo;
function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function startRecording() {

   
  if (room !== undefined){
    if (!recording){
    dataStream.sendData({text:"recordMe", stream:localStream.getID()});
	recording = true;      
   // console.log("start recording");
     document.getElementById("mark").innerHTML = "Start Recording!"; 
    } else {
    dataStream.sendData({text:"stopRecording", stream:localStream.getID()});
      recording = false;
     document.getElementById("mark").innerHTML = "Recording Stoped!"; 
   // console.log("stop recording");
    }
  }
 
};

function playRecording(recordingID){
//	console.log("play recording");
	console.log("recordingID!!",recordingID);
	document.getElementById("playpause").innerHTML = "PLAY RECORDING" + recordingID;
	dataStream.sendData({text:"playRecording",stream:recordingID});

};

function removeRecording(recordingID){
	document.getElementById("playpause").innerHTML = "STOP RECORDING" + recordingID;
	dataStream.sendData({text:"removeRecording",stream:recordingID});
}

/*function togglePlayPause() { 
    var playpause = document.getElementById("playpause"); 
    if (audio.paused || audio.ended) { 
        playpause.title = "pause"; 
        playpause.innerHTML = "pause"; 
        audio.play(); 
    } else { 
        playpause.title = "play"; 
        playpause.innerHTML = "play"; 
        audio.pause(); 
    } 
}*/

window.onload = function () {
  recording = false;
  play = false;
  var screen = getParameterByName("screen");
  var config = {audio: true, video: false, data: true, screen: screen, videoSize: [640, 480, 640, 480],attributes:{type:'localStream'}};
  // If we want screen sharing we have to put our Chrome extension id. The default one only works in our Lynckia test servers.
  // If we are not using chrome, the creation of the stream will fail regardless.
  if (screen){
    config.extensionId = "okeephmleflklcdebijnponpabbmmgeo";
  }
  dataStream = Erizo.Stream({audio:false, video:false, data:true, attributes:{type:'clientStream'}}); 
  localStream = Erizo.Stream(config);
  var createToken = function(userName, role, callback) {

    var req = new XMLHttpRequest();
    var url = serverUrl + 'createToken/';
    var body = {username: userName, role: role};

    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        callback(req.responseText);
      }
    };

    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
  };

  createToken("user", "presenter", function (response) {
    var token = response;
    console.log(token);
    room = Erizo.Room({token: token});

      localStream.addEventListener("access-accepted", function () {
      var subscribeToStreams = function (streams) {
        for (var index in streams) {
          var stream = streams[index];
	if (localStream.getID() !== stream.getID()) {
         if(stream.getAttributes().type =='recording'){
		if(stream.getID() == streamPlayedOne.getID())
	   	 room.subscribe(stream);
		}
	else
	   	 room.subscribe(stream);
		
	}
        }
      };

	
      var loadRecordings = function(){
	dataStream.sendData({text:"loadRecordings"});
	console.log("loadRecordings");
	}


      room.addEventListener("room-connected", function (roomEvent) {
        room.publish(localStream, {maxVideoBW: 3000, minVideoBW:500});
        room.publish(dataStream);
	//function(){
	// console.log("dataStream published!!");	
	// loadRecordings();
//	});
        subscribeToStreams(roomEvent.streams);
      });

       
       room.addEventListener("stream-subscribed", function(streamEvent) {
        var stream = streamEvent.stream;
        var div = document.createElement('div');
        div.setAttribute("style", "width: 320px; height: 240px;");
        div.setAttribute("id", "test" + stream.getID());
        if(stream.hasAudio())
	{	
        document.getElementById("section").appendChild(div);
        stream.show("test"+stream.getID());
	}
	else{


	stream.addEventListener("stream-data", function(evt){
		console.log("recor",evt.msg.text);
		if(evt.msg.text == "PLAY"){
		streamPlayedOne = Erizo.Stream({audio:true, video:false, recording:evt.msg.stream, attributes:{type:'recording'}});
		room.publish(streamPlayedOne);
//		playRecording[playID]=streamPlayed;   
		}
		
		if(evt.msg.text == "recordingList"){
		console.log("recordingList print !!!");
		for(var i = 1; i <= evt.msg.stream; i++){
			var txt = document.creamentElement("p");
			txt.innerHtml ="recording"+i;
			document.getElementById("recordingList").appendChild(txt);
	                
			txt.onclick = function(){
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
		}
		}

		if(evt.msg.text == "recordingID"){
		 console.log("recordingID !!!");
        	var txt = document.createElement("p");
                txt.innerHTML ="recording "+ evt.msg.stream;
                document.getElementById("recordingList").appendChild(txt);
                txt.onclick = function(){
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
		}


		if(evt.msg.text == "STOP"){
	//	room.unsubscribe(evt.msg.stream);
		console.log("STOP TEST!!!",streamPlayedOne);
	//	console.log("StreamPlayed showing!!!",streamPlayedTwo.showing);
//		console.log("STREAMplayed ID!!!",streamPlayedTwo.getID());
		console.log("room remoteStreams!!!",room.remoteStreams);
		console.log("room localStreams!!!",room.remoteStreams);
	//	console.log("stop test!!",room);
//		streamPlayedTwo.stop();
		streamPlayedOne.close();
/*		room.unpublish(streamPlayedOne,function(result, error){
                if (result === undefined){
                 console.log("Error unpublishing", error);
                 } else {
                 console.log("Stream unsubscribed!");
                console.log("room remoteStreams 2!!!",room.remoteStreams);
		console.log("room localStreams 1!!!",room.remoteStreams);
                 }
});*/
	/*	room.unsubscribe(streamPlayedTwo, function(result, error){
 		 if (result === undefined){
   		 console.log("Error unsubscribing", error);
 		 } else {
   		 console.log("Stream unsubscribed!");
		console.log("room remoteStreams 2!!!",room.remoteStreams);
 		 }
		});*/		
		}
	});
 }
});


      room.addEventListener("stream-added", function (streamEvent) {
        var streams = [];
        streams.push(streamEvent.stream);
        subscribeToStreams(streams);
	if(streamEvent.stream.getAttributes().type == 'clientStream')
	loadRecordings();
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
