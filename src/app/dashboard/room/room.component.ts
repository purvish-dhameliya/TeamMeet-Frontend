// @ts-nocheck
import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
  HostListener,
  Inject,
  OnDestroy,
} from "@angular/core";
import {
  Router
} from "@angular/router";
import {
  DatePipe
} from '@angular/common'
import {
  AuthService
} from "src/service/auth.service";
import {
  MatSnackBar, MAT_SNACK_BAR_DATA
} from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import stopMediaStream from 'stop-media-stream';



@Component({
  selector: 'app-room',
  templateUrl: 'room.component.html',
  styleUrls: ['room.component.css']
})
export class RoomComponent implements OnInit,OnDestroy {
  localDisplayName = JSON.parse(localStorage.getItem('user')).fname
  lastname: string = JSON.parse(localStorage.getItem('user')).lname
  loadSpinner: boolean = true;
  mediaConstrain = {
    video: {
      width: {
        max: 854
      },
      height: {
        max: 480
      },
      framerate: 30
    },
    audio: {echoCancellation:true}
  }
  peerConnectionConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {urls:'turn:numb.viagenie.ca', username:'yejiwar336@edmondpt.com', credential:"yejiwar336@edmondpt.com"}
    ]
  }
  uid = localStorage.getItem('uid');
  picurl;
  @ViewChild('main_video_div') videoChatContainer: ElementRef | any;
  @ViewChild('videos') videosdiv: ElementRef | any;
  localUuid: string;
  localDisplayName: string;
  localStream: MediaStream;
  serverConnection: WebSocket;
  peerConnections: any = [];
  roomName: string;
  message: string = '';
  const observer = new ResizeObserver(() => {
    if(location.pathname == '/room'){
      Dish() 
    }
  });
  toggled: boolean = false;
  msgbox = document.getElementById('msgbox')
  isChatOn: boolean = false;
  screenShareStream: MediaStream;
  datePipe = new DatePipe('en-US');
  unreadmessagesgcount = 0;
  islocalmuted: boolean = false;
  isScreenShared: boolean = false;
  islocalplay: boolean = true;
  isroomcreator: boolean;
  userslist: boolean = false;
  baseurl;
  peerUuid;
  numberofparticipants:numberb = 1;
  

  constructor(private router: Router, private authservice: AuthService, public snackbar: MatSnackBar, public dialog: MatDialog) {
    window.onbeforeunload = ()=>{
      // debugger;
      this.hangup()
      function sleep(delay){
        const start  = new Date().getTime();
        while(new Date().getTime() < start +delay);
      }
      sleep(2000)
    }
    
   }

  numberofcamera: number = 0;
  async ngOnInit() {
    this.localUuid = this.createUUID();
    this.roomName = localStorage.getItem('roomId');
    if (!this.roomName) {
      this.router.navigateByUrl('/dashboard')
      return
    }
    this.isroomcreator = localStorage.getItem('admin') ? true : false
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return;
    }
    await navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          if (device.kind == "videoinput") { this.numberofcamera++ }
        });
      })
      .catch((err) => {
        console.log(err.name + ": " + err.message);
      });

    if (this.numberofcamera == 0) {
      if(this.isroomcreator){this.authservice.deleteroom({roomid:this.roomName}).subscribe(res=>{console.log(res)})}
      this.snackbar.open("sorry you can't have a camera", 'ok', { direction: 6000 })
      this.router.navigateByUrl('/dashboard')
      return
      //end of checking number of camera
    } else {
      //if user have camera then proceed
      this.getuserpermisssion()
      
      this.baseurl = this.authservice.baseurl
      this.picurl = localStorage.getItem('profilepic')

      setTimeout(()=>{this.start()},300)
    }

    

    this.observer.observe(this.videosdiv.nativeElement);

    //add my name tile in user list
    {var userlistul = document.getElementById('user-list')
    var list = document.createElement('li')
    list.classList.add('my-user-list-tile')
    list.innerHTML = `<img class="user-image" src="${this.picurl}" >
                      <div class="name-div">
                      <span class='user-name'>${this.localDisplayName} ${this.lastname}</span>
                      <span class='user-type'>me</span>
                      </div>
                      <div style="float:right;line-height:70px; padding-right:8px;">
                      <mat-icon role="img" class="mat-icon notranslate material-icons mat-icon-no-color" id="${this.localUuid}_mic" data-mat-icon-type="font" style="vertical-align:middle;display:none">mic</mat-icon>
                      <mat-icon role="img" class="mat-icon notranslate material-icons mat-icon-no-color" id="${this.localUuid}_mic_off" data-mat-icon-type="font" style="vertical-align:middle;">mic_off</mat-icon>
                      </div>
                      `

    userlistul?.append(list)
    }
  }

  //send message if user pressed enter key
  handleKeyUp(e) {
    if (e.keyCode === 13) {
      this.sendMessage(e.srcElement.value)
    }
  }

  //mute all participant except Organizer
  muteall() {
    this.serverConnection.send(JSON.stringify({ 'roomName': this.roomName, 'dest': 'all', 'muteall': 'muteall' }))
  }

  //send message to server
  sendMessage(message) {
    if (message != '' && message != undefined && message != message.replace(/\s/g, '').length && message !== " ") {
      this.message = message

      function urlify(text) {
        var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        //var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url,b,c) {
            var url2 = (c == 'www.') ?  'http://' +url : url;
            return '<a href="' +url2+ '" target="_blank">' + url + '</a>';
        }) 
      }

      this.message= urlify(this.message)
      
      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'SenderName': this.localDisplayName,
        'message': this.message,
        'uuid': this.localUuid,
        'picurl': this.picurl,
        'dest': 'all'
      }));
      var date = new Date()
      date = this.datePipe.transform(date, 'h:mm a')

      const element = document.createElement('li');
      
      element.innerHTML = `<div><img src="${this.picurl}"  class='own-profile profile-icon'><p class='own-name'>${this.localDisplayName}</p></div>${this.message}&nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`;
      element.classList.add("myMsg");
      document.getElementById('message-list').appendChild(element);
      this.message = '';
      setTimeout(()=>{
        var items = document.getElementById('message-list').querySelectorAll("li");
        var last = items[items.length - 1];
        last.scrollIntoView();
      },100)
      var inputfield = document.getElementById('msgbox')
      inputfield?.focus()
    }
  }

  filesend(event){
    let file = event.target.files[0];
    // debugger
    if (!file) {
      return
    }
    if (file.size > 5000000) {
      alert('File should be smaller than 5MB')
      return
    }
    var type = event.target.files[0].type
    console.log(type)
    var filename = event.target.files[0].name
    var reader = new FileReader();
    var readerforlink = new FileReader();
    var rawData = new ArrayBuffer();
    reader.readAsArrayBuffer(file);

    reader.onload = (e)=> {
      
      rawData = e.target.result;
      console.log(rawData)
      
      // console.log(JSON.stringify(Array.from(new Uint8Array(rawData))))
      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'SenderName': this.localDisplayName,
        'picurl': this.picurl,
        'time':new Date(),
        "type":"filemsg",
        "uuid":this.localUuid,
        "filename":filename,
        "data":Array.from(new Uint8Array(rawData)),
        "filetype":type,
        'dest': 'all'
      })) ;    
    }
    readerforlink.readAsDataURL(file)
    var src="";
    readerforlink.onload = (e:any)=>{
      src = e.target.result
      var date = new Date()
      date = this.datePipe.transform(date, 'h:mm a')
      const element = document.createElement('li');
      if(type=="image/jpeg"|| type=="image/png" || type=="image/gif" || type=="image/svg+xml")
      { 
        element.innerHTML = `<div><img src="${this.picurl}"  class='own-profile profile-icon'><p class='own-name'>${this.localDisplayName}</p></div>
        <img src="${src}" class="chat-attachment">
        &nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`; 
        element.style.padding ="10px 5px"
      }else if(type=="video/mp4" || type=="video/3gpp" ||	type=="video/quicktime" || type=="video/x-msvideo" || type=="video/webm" || type=="video/x-matroska" )
      { 
        element.innerHTML = `<div><img src="${this.picurl}"  class='own-profile profile-icon'><p class='own-name'>${this.localDisplayName}</p></div>
        <video src="${src}" controls class="chat-attachment" muted="true"></video>
        &nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`; 
        element.style.padding ="10px 5px"
      }else if(type=="audio/mpeg" || type=="audio/ogg" || type=="audio/wav" || type=="audio/aac" || type=="audio/mp4" || type=="audio/x-aiff" || type=="audio/vnd.wav"){
        element.innerHTML = `<div><img src="${this.picurl}"  class='own-profile profile-icon'><p class='own-name'>${this.localDisplayName}</p></div>
        <audio controls class="chat-attachment" muted="true"><source src="${src}"></source> </audio>
        <span>${filename}</span>
        &nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`; 
        element.style.width="100%"
      }else {
        element.innerHTML = `<div><img src="${this.picurl}"  class='own-profile profile-icon'><p class='own-name'>${this.localDisplayName}</p></div>
        <div class="file-container">
        <span class="file-icon">insert_drive_file</span>
        <span class="file-name"> ${filename}</span>
        <a href="${src}" style="text-decoration: none;color:inherit;" target="_blank" download="${filename}">
        <span class="file-download">download</span>
        </a>
        </div>
        &nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`
      }
      
      element.classList.add("myMsg");
      document.getElementById('message-list').appendChild(element);
      document.getElementById('msgfile').value = null
      setTimeout(()=>{
        var items = document.getElementById('message-list').querySelectorAll("li");
        var last = items[items.length - 1];
        last.scrollIntoView();
      },100)
    }
  }

  //microphone mute unmute 
  @HostListener('document:keyup.control.alt.2')
  muteUnmute() {
      if(this.localStream){
      let enabled = this.localStream.getAudioTracks()[0].enabled;
      if (enabled == true) {
        this.localStream.getAudioTracks()[0].enabled = false;
        this.islocalmuted = true
        if (this.serverConnection) {
          this.serverConnection.send(JSON.stringify({
            'roomName': this.roomName,
            'uuid': this.localUuid,
            "mic": "off",
            'dest': 'all'
          }));
        }
        document.getElementById(`${this.localUuid}_mic`).style.display = "none";
        document.getElementById(`${this.localUuid}_mic_off`).style.display = "inline-block";
      } else {
        this.localStream.getAudioTracks()[0].enabled = true;
        this.islocalmuted = false
        if (this.serverConnection) {
          this.serverConnection.send(JSON.stringify({
            'roomName': this.roomName,
            'uuid': this.localUuid,
            "mic": "on",
            'dest': 'all'
          }));
        }
        document.getElementById(`${this.localUuid}_mic`).style.display = "inline-block";
        document.getElementById(`${this.localUuid}_mic_off`).style.display = "none";
      }
    }else{return}
  }

  //camera on off
  @HostListener('document:keyup.control.alt.1')
  playStop(): void {
    if (this.isScreenShared) {
      this.snackbar.open("Stop ScreenSharing to turn on camera", "ok", {
        duration: 6000,
        horizontalPosition: "start",
        verticalPosition: "top"
      })
      return
    } else {
      let enabled = this.localStream.getVideoTracks()[0].enabled;
      if (enabled) {
        this.hideVideo()
        this.islocalplay = false;
      } else {
        this.showVideo()
        this.islocalplay = true;
      }
    }
  }

  //show video when turn on camera
  showVideo() {
    this.serverConnection.send(JSON.stringify({
      'roomName': this.roomName,
      'uuid': this.localUuid,
      "video": "play",
      'dest': 'all'
    }));
    var localvideo = document.getElementById("localVideo")
    localvideo.style.display = "flex"
    var localimgdiv = document.getElementById("localimgdiv")
    localimgdiv.style.display = "none"
    this.localStream.getVideoTracks()[0].enabled = true;
  }

  //gide video when turn off camera
  hideVideo() {
    this.serverConnection.send(JSON.stringify({
      'roomName': this.roomName,
      'uuid': this.localUuid,
      "video": "stop",
      'dest': 'all'
    }));
    var localvideo = document.getElementById("localVideo")
    localvideo.style.display = "none"
    var localimgdiv = document.getElementById("localimgdiv")
    localimgdiv.style.display = "flex"
    this.localStream.getVideoTracks()[0].enabled = false;
  }

  //show-Hide Chat Component
  @HostListener('document:keyup.control.alt.3')
  chat() {
    this.userslist = false;
    Dish()
    this.unreadmessagesgcount = 0
    if (!this.isChatOn) {
      this.videoChatContainer.nativeElement.classList.add('setVideoWidth')
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'block'
      this.isChatOn = !this.isChatOn
      
      var inputfield = document.getElementById('msgbox')
      inputfield.focus()
      //@ts-ignore
      Dish()
    } else {
      this.videoChatContainer.nativeElement.classList.remove('setVideoWidth')
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'none'
      this.isChatOn = !this.isChatOn
      //@ts-ignore
      Dish()
    }
  }

  //Show-Hide User-list Component
  showuserslist() {
    this.isChatOn = false;
    if (this.userslist == false) {
      this.videoChatContainer.nativeElement.classList.add('setVideoWidth')
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'block'
      this.userslist = true;
    } else {
      this.videoChatContainer.nativeElement.classList.remove('setVideoWidth')
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'none'
      this.userslist = false;
    }

  }

  //screenshare 
  screenshare() {
    if (!this.isScreenShared) {

      navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      }).then((stream) => {
        this.screenShareStream = stream
        this.snackbar.open("Warning: Your camera is turned off while ScreenSharing", "ok", {
          duration: 6000,
          horizontalPosition: "start",
          "verticalPosition": "top"
        })
        
        var localvideo = document.getElementById("localVideo")
        localvideo?.style.display = "flex"
        var localimgdiv = document.getElementById("localimgdiv")
        localimgdiv?.style.display = "none"
        this.islocalplay = false;
        this.isScreenShared = true;
        this.showVideo()
        var length = Object.keys(this.peerConnections).length
        if(stream){
          var tracks = this.localStream.getVideoTracks()
          tracks.forEach(function (track) {
            track.stop();
          });
          document.getElementById('localVideo').srcObject = this.screenShareStream
        }

        if(length > 0)
        {
          Object.keys(this.peerConnections).forEach(key=>{
            this.peerConnections[key].pc.getSenders().forEach(
              (rtpSender) => {
                if(rtpSender.track){
                if (rtpSender.track.kind == 'video') {
                    rtpSender.replaceTrack(this.screenShareStream.getVideoTracks()[0]).then(() => {
                    var localVideo = document.getElementById('localVideo')
                    localVideo.srcObject = this.screenShareStream
                    this.isScreenShared = true
                    this.screenShareStream.getVideoTracks()[0].onended = () => {
                      this.isScreenShared = true
  
                      this.screenshare()
                      this.isScreenShared = false
                    };
                  }).catch(function (error) {
                    console.log("Could not replace video track: " + error);
                  });
                }
              }
              }
            );
          })
        }
      }, (err) => {
        console.error('failed to Screenshare', err)
      })
    } else {
      var tracks = this.screenShareStream.getTracks()
      tracks.forEach(function (track) {
        track.stop();
      });

      navigator.mediaDevices.getUserMedia(this.mediaConstrain).then((stream) => {

        this.localStream.removeTrack(this.localStream.getVideoTracks()[0])
        console.log(this.localStream.getTracks())
        this.localStream.addTrack(stream.getVideoTracks()[0])
        if (!this.islocalplay) {
          this.serverConnection.send(JSON.stringify({
            'roomName': this.roomName,
            'uuid': this.localUuid,
            "video": "stop",
            'dest': 'all'
          }));
          var localvideo = document.getElementById("localVideo")
          localvideo?.style.display = "none"
          var localimgdiv = document.getElementById("localimgdiv")
          localimgdiv?.style.display = "flex"
          this.localStream.getVideoTracks()[0].enabled = false;
        }

        if (stream) {
          if(this.islocalmuted){
            this.localStream.getAudioTracks()[0].enabled = false;
          }else{
            this.localStream.getAudioTracks()[0].enabled = true;
          }
          this.isScreenShared = false
          var localVideo = document.getElementById('localVideo')
          localVideo.srcObject = this.localStream
        }
        
        if(Object.keys(this.peerConnections).length > 0)
        {
          Object.keys(this.peerConnections).forEach(key=>{
          this.peerConnections[key].pc.getSenders().forEach(
            (rtpSender) => {
              if (rtpSender.track.kind == 'video') {
                rtpSender.replaceTrack(this.localStream.getVideoTracks()[0])
                .catch(function (error) {
                  this.errorHandler(error)
                });
              }
            }
          );
          })
        }

        
      }, (err) => {
        console.error('failed to Screenshare', err)
      })
    }
  }

  //fullscreen video 
  fullscreenvideo(videoEl) {
    if (videoEl.parentElement) {

      var video = videoEl.parentElement
      video.removeAttribute('style')
    } else {
      var video = videoEl.currentTarget.parentElement
      video.removeAttribute('style')
      if(this.isMobile())
      {video.getElementsByClassName('video-img')[0].getElementsByTagName('img')[0].style.height="auto"}
    }
    {
      this.dialog.open(videoDialog, {
        disableClose: true,
        width: "95vw",
        height: "95vh",
        maxHeight: "95vh",
        maxWidth: "95vw"
      })
    }
    var temp = document.getElementsByClassName('content-video')[0]
    temp?.appendChild(video)
    
    if(this.isMobile()){
      fullscreen('mobile')
    }else fullscreen('other')
  }


  //Call Hangup
  hangupcount = 0
  async hangup(): Promise<void> {
    if(this.hangupcount == 0){
      if(this.roomName){
        this.hangupcount ++
        var audio = document.getElementById('callend-audio')
        setTimeout(() => {
          audio.play()
        }, 200);
        if (this.serverConnection) {
          this.serverConnection.send(JSON.stringify({
            'roomName': this.roomName,
            'uuid': this.localUuid,
            'close': 'close',
            'dest': 'all'
          }))
        }
        console.log({ val: '-1', 'roomid': this.roomName });
        
        this.authservice.updateroomuser({ val: '-1', 'roomid': this.roomName }).subscribe(res => {
        console.log(res)
        }, err => { console.log(err.message) })
        
        localStorage.removeItem('roomId')
        localStorage.removeItem('admin')
        
        stopMediaStream(this.localStream);

        if(this.isScreenShared || this.screenShareStream){
          stopMediaStream(this.screenShareStream)
        }
        this.router.navigate(['/dashboard'])
      }
    }
  }

  ngOnDestroy(){
    this.hangup()
  }


  //Check my brower type
  myBrowser() {

    if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {

      return 'Opera';

    } else if (navigator.userAgent.indexOf("Chrome") != -1) {

      return 'Chrome';

    } else if (navigator.userAgent.indexOf("Safari") != -1) {

      return 'Safari';

    } else if (navigator.userAgent.indexOf("Firefox") != -1) {

      return 'Firefox';

    } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {

      return 'IE';

    } else {

      return 'unknown';

    }

  }

  //get User Camera and Microphone Permission
  async getuserpermisssion() {
    if (this.isMobile && this.myBrowser =="safari") { return null}
    else{
      var camera:boolean
      var mic:boolean
      
      if(this.myBrowser()=="Chrome"){
        await navigator.permissions.query({ name: 'camera' })
        .then((permissionObj) => {
          if (permissionObj.state == "denied") {
            camera = false
          } 
        })
        .catch((error) => {
          this.errorHandler(error)
        })

      await navigator.permissions.query({
        name: 'microphone'
      })
        .then((permissionObj) => {
          if (permissionObj.state == "denied") {
            mic = false
          }
        })
        .catch((error) => {
          this.errorHandler(error)
        })
      }

      if(this.myBrowser()=="Firefox"){
        await navigator.mediaDevices.getUserMedia({ audio: true}).then((stream:MediaStream)=> {
          if(stream){stream.getTracks().forEach(track => {track.stop()}); stopMediaStream(stream)}
          
        }).catch(error=>{console.log(error);mic=false});

        await navigator.mediaDevices.getUserMedia({video:true}).then((stream:MediaStream)=> {
          
          if(stream){stream.getTracks().forEach(track => {track.stop()}); stopMediaStream(stream)}
          
        }).catch(error=>{console.log(error);camera=false});
      }

      
        if(camera == false || mic == false){
          this.snackbar._openedSnackBarRef?.dismiss()
          this.dialog.open(permissionblock,{disableClose: true, panelClass: ['full-screen-modal']})
          if(this.isroomcreator){this.authservice.deleteroom({roomid:this.roomName}).subscribe(res=>{console.log(res)})}
          this.router.navigateByUrl('/dashboard')
        }
    }
  }

  arrange(){Dish()}


  const getvideowithmediadevice = async ()=>{
    await navigator.mediaDevices.getUserMedia(this.mediaConstrain)
      .then(stream => {
        this.processwithstream(stream)
      }).catch(error=>{this.errorHandler(error)})

      // set up websocket and message all existing clients
      .then(() => {
          this.createconnectionwithwebsocket()
          this.loadSpinner = false
      }).catch(error=>{this.errorHandler(error)});
  }

  const getvideowithgetusermedia = async ()=>{
    await navigator.getUserMedia(this.mediaConstrain)
    .then(stream => {
      this.processwithstream(stream)
    }).catch(this.errorHandler)

    // set up websocket and message all existing clients
    .then(() => {
        this.createconnectionwithwebsocket()
        this.loadSpinner = false
    }).catch(this.errorHandler);
  }

  getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

    return raw ? parseInt(raw[2], 10) : false;
  }

  const processwithstream = (stream:MediaStream):void => {
        
    this.localStream = stream
    document.getElementById('localVideo').muted = true;
    document.getElementById('localVideo').srcObject = this.localStream;
    
      this.muteUnmute()
      var imgdiv = document.getElementById('localimgdiv')
      imgdiv.style.display = "none"
      imgdiv.getElementsByTagName('img')[0].src = this.picurl
      var spandiv = document.getElementById('locallabel')
      spandiv?.innerText = this.localDisplayName + '(me)'
      if (stream) {
        this.authservice.updateroomuser({ val: '+1', 'roomid': this.roomName }).subscribe(res => {
          console.log(res)
          localStorage.removeItem('roomId')
        }, err => {
          console.log(err.message);
        })
      }
  }

  //create new connection with webserver
  const createconnectionwithwebsocket = () =>{
    this.serverConnection = new WebSocket('wss://' + this.baseurl.substr(7));

      this.serverConnection.onmessage = this.gotMessageFromServer.bind(this);
      this.serverConnection.onopen = event => {
        this.serverConnection.send(JSON.stringify({
          'roomName': this.roomName,
          'displayName': this.localDisplayName,
          'lname': this.lastname,
          "type": this.isroomcreator ? 'Organizer' : 'Joined',
          "ismuted":this.islocalmuted,
          "isplay": this.islocalplay,
          "picurl": this.picurl,
          'uuid': this.localUuid,
          'dest': 'all'
        }));
      }
  }


  //start Call
  async start() {
    
    // if (navigator.mediaDevices.getUserMedia) {
    

      //check for webrtc api support
      if(this.isMobile()){var apitype = navigator.getUserMedia}else{var apitype = navigator.mediaDevices.getUserMedia}
      
      if(!apitype){
        this.snackbar.open("Sorry Your Browser Can't Support Webrtc. Try Latest Version Of CHROME","ok",{duration:6000})
        this.router.navigateByUrl('/dashboard')
        return;
      }

      if(this.isMobile())
      {
        if(this.myBrowser()=="Firefox")
        {
          this.getvideowithmediadevice()
        }else if(this.getChromeVersion()>= 53){
          if(navigator.mediaDevices.getUserMedia){
            this.getvideowithmediadevice()
          }else{
            this.getvideowithgetusermedia()
          }
        }
        else
        {
          this.getvideowithgetusermedia()
        }
      }
      else{
        this.getvideowithmediadevice()
      }
      // setTimeout(()=>{},1500)  
  }

  gotMessageFromServer(message) {

    var signal = JSON.parse(message.data);
    var peerUuid = signal.uuid;
    // Ignore messages that are not for us or from ourselves
    if (peerUuid == this.localUuid || (signal.dest != this.localUuid && signal.dest != 'all')) return;
    if (signal.close == 'close' && signal.uuid !== this.localUuid) {
      this.dialog.closeAll()
      setTimeout(() => {
        var isHangedUp = true;
        this.checkPeerDisconnect(null, signal.uuid, isHangedUp) 
      }, 500);
    }
    if (signal.video) {
      if (signal.video == "stop") {
        var div = document.getElementById("remoteVideo_" + peerUuid)
        div?.children[0].style.display = "flex"
        div?.children[1].style.display = "none"
      } else if (signal.video == "play") {
        var div = document.getElementById("remoteVideo_" + peerUuid)
        div?.children[0].style.display = "none"
        div?.children[1].style.display = "flex"
      }
    }

    if (signal.message || signal.type=="filemsg") {
      const element = document.createElement('li');
      var date = this.datePipe.transform(signal.time, 'h:mm a')
      if(signal.message)
      {element.innerHTML = `<div><img src="${signal.picurl}"  class='other-profile profile-icon'><p class='other-name'>${signal.SenderName}</p></div>${signal.message}&nbsp;<span style="float:right;margin-left:5px;"><sub style="font-size:small; color:lightgrey;opacity:0.65;">${date}</sub></span>`;}
      else if(signal.type){
      var temp= new Uint8Array(signal.data)
      var blob=new Blob([temp], {type: signal.filetype});// change resultByte to bytes

      // var link=document.createElement('a');  
      // link.href=window.URL.createObjectURL(blob);
      var link=window.URL.createObjectURL(blob);
        if(signal.filetype =="image/jpeg" || signal.filetype =="image/png" || signal.filetype=="image/gif" || signal.filetype=="image/svg+xml"){
        element.innerHTML = `<div><img src="${signal.picurl}"  class='other-profile profile-icon'><p class='other-name'>${signal.SenderName}</p></div>
          <img src="${link}" class="chat-attachment">&nbsp;<span style="float:right;margin-left:5px;">
          <sub style="font-size:small; color:lightgrey;opacity:0.65;">${date}</sub></span>`;
          element.style.padding ="10px 5px"
        }else if(signal.filetype=="video/mp4" || signal.filetype=="video/3gpp" ||	signal.filetype=="video/quicktime" || signal.filetype=="video/x-msvideo" || signal.filetype=="video/webm" || signal.filetype=="video/x-matroska"){
          element.innerHTML = `<div><img src="${signal.picurl}"  class='other-profile profile-icon'><p class='other-name'>${signal.SenderName}</p></div>
          <video src="${link}" muted="true" controls class="chat-attachment"></video>
          &nbsp;<span style="float:right;margin-left:5px;"><sub style="font-size:small; color:lightgrey;opacity:0.65;">${date}</sub></span>`;
          element.style.padding ="10px 5px"
        }else if(signal.filetype=="audio/mpeg" || signal.filetype=="audio/ogg" || signal.filetype=="audio/wav" || signal.filetype=="audio/aac" || signal.filetype=="audio/mp4" || signal.filetype=="audio/x-aiff" || signal.filetype=="audio/vnd.wav"){
          element.innerHTML = `<div><img src="${signal.picurl}"  class='other-profile profile-icon'><p class='other-name'>${signal.SenderName}</p></div>
          <audio controls class="chat-attachment" muted="true"><source src="${link}"></source> </audio>
          <span>${signal.filename}</span>
          &nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;">${date}</sub></span>`; 
          element.style.width="100%"
        }else {
          element.innerHTML = `<div><img src="${signal.picurl}"  class='other-profile profile-icon'><p class='other-name'>${signal.SenderName}</p></div>
          <div class="file-container">
          <span class="file-icon">insert_drive_file</span>
          <span class="file-name"> ${signal.filename}</span>
          <a href="${link}" style="text-decoration: none;color:inherit;" target="_blank" download="${signal.filename}"><span class="file-download">download</span></a>
          </div>
          &nbsp;<span style="float:right;margin-left:5px;"><sub style="font-size:small; color:lightgrey;opacity:0.65;">${date}</sub><span>`
        }
      }
      element.classList.add("msg");
      document.getElementById('message-list').appendChild(element);
      
      setTimeout(()=>{
        var items = document.getElementById('message-list').querySelectorAll("li");
        var last = items[items.length - 1];
        last.scrollIntoView();
      },100)
      
      if (!this.isChatOn) {
        this.unreadmessagesgcount++
      }
    }

    if ((signal.dest == this.localUuid) && signal.kick == "kick") {
      this.snackbar.open("You are kicked out by your Organizer", "ok", { duration: 10000, verticalPosition: "top", horizontalPosition: "start" })
      
        this.hangup()
    }

    if (signal.displayName && signal.dest == 'all') {
      // set up peer connection object for a newcomer peer
      var condition: boolean;
      if (signal.startWithScreenShare == true) {
        condition = true
      } else {
        condition = signal.isplay
      }
      this.setUpPeer(condition, signal.ismuted,signal.picurl, peerUuid, signal.displayName, signal.lname, signal.type, false);

      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'displayName': this.localDisplayName,
        "lname": this.lastname,
        "type": this.isroomcreator ? 'Organizer' : 'Joined',
        "startWithScreenShare": this.isScreenShared,
        "ismuted":this.islocalmuted,
        "isplay": this.islocalplay,
        "picurl": this.picurl,
        'uuid': this.localUuid,
        'dest': peerUuid
      }));
    } else if (signal.displayName && signal.dest == this.localUuid) {
      // initiate call if we are the newcomer peer
      var condition: boolean;
      var test
      if (signal.startWithScreenShare == true) {
        condition = true
      } else {
        condition = signal.isplay
      }
      this.setUpPeer(condition, signal.ismuted,signal.picurl, peerUuid, signal.displayName, signal.lname, signal.type, true);

    } else if (signal.sdp) {
      this.peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        // Only create answers in response to offers
        if (signal.sdp.type == 'offer') {
          this.peerConnections[peerUuid].pc.createAnswer().then(description => this.createdDescription(description, peerUuid)).catch(this.errorHandler);
        }
      }).catch(this.errorHandler);

    } else if (signal.ice) {
      this.peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(this.errorHandler);
    } else if (signal.muteall) {
      if (!this.isroomcreator) {
        if (!this.islocalmuted) {
          this.muteUnmute();
          this.snackbar.open("You are muted by Organizer", "", { duration: 6000, verticalPosition: "top", horizontalPosition: "start" })
        }
      }
    } else if (signal.mic) {
      if (signal.mic == "on") {
        document.getElementById(`${peerUuid}_mic`).style.display = "inline-block";
        document.getElementById(`${peerUuid}_mic_off`).style.display = "none";
      } else {
        document.getElementById(`${peerUuid}_mic`).style.display = "none";
        document.getElementById(`${peerUuid}_mic_off`).style.display = "inline-block";
      }
    }

  }

  async setUpPeer(isplay,ismuted, picurl, peerUuid, displayName, lname, type, initCall) {

    this.peerConnections[peerUuid] = {
      'roomName': this.roomName,
      'displayName': displayName,
      'lname': lname,
      'type': type,
      'pc': new RTCPeerConnection(this.peerConnectionConfig),
      "picurl": picurl
    };
    this.peerConnections[peerUuid].pc.onicecandidate = event => this.gotIceCandidate(event, peerUuid);
    this.peerConnections[peerUuid].pc.ontrack = event => this.gotRemoteStream(event, peerUuid, picurl, isplay, ismuted);
    this.peerConnections[peerUuid].pc.oniceconnectionstatechange = event => this.checkPeerDisconnect(event, peerUuid, false);
    // this.peerConnections[peerUuid].pc.pc.ondatachannel = (event) => {
    //   const { channel } = event;
  
    //   channel.onmessage = (event) => {
    //     console.log(event.data);
    //     channel.send('Hi back!')
    //   }
    // };
    if (this.isScreenShared) {
      if(this.myBrowser()=="Safari"){
        var tracks = this.screenShareStream.getTracks()
        console.log(tracks)
        tracks.forEach(track => this.peerConnections[peerUuid].pc.addTrack(track, this.screenShareStream));
      }else
      {
      this.peerConnections[peerUuid].pc.addStream(this.screenShareStream);
      }
    } else {
      if(this.myBrowser()=="Safari"){
        var tracks = this.localStream.getTracks()
        console.log(tracks)
        tracks.forEach(track => this.peerConnections[peerUuid].pc.addTrack(track, this.localStream));
      }
      else{
      this.peerConnections[peerUuid].pc.addStream(this.localStream);
      }
    }

    if (initCall) {
      this.peerConnections[peerUuid].pc.createOffer().then(description => this.createdDescription(description, peerUuid)).catch(this.errorHandler);
    }
    this.numberofparticipants++
  }

  gotIceCandidate(event, peerUuid) {
    if (event.candidate != null) {
      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'ice': event.candidate,
        'uuid': this.localUuid,
        'dest': peerUuid
      }));
    }
  }

  createdDescription(description, peerUuid) {
    this.peerConnections[peerUuid].pc.setLocalDescription(description).then(() => {
      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'sdp': this.peerConnections[peerUuid].pc.localDescription,
        'uuid': this.localUuid,
        'dest': peerUuid
      }));
    }).catch(this.errorHandler);
  }

  count = 0
  gotRemoteStream(event, peerUuid, picurl, isplay, ismuted) {
  
    if (this.count > 0) {
      this.count = 0;
      return
    }

    if (this.count == 0) {
      //assign stream to new HTML video element
      var vidElement = document.createElement('video');
      vidElement.setAttribute('playsinline', '')
      vidElement.setAttribute('autoplay', '');
      vidElement.setAttribute('class', "remoteVideo")
      vidElement.srcObject = event.streams[0];

      var vidContainer = document.createElement('div');
      vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
      var imgdiv = document.createElement('div')
      imgdiv.id = "remoteimgdiv"
      imgdiv.classList.add('video-img')
      if (isplay == true) {
        imgdiv.style.display = "none"
      } else {
        imgdiv.style.display = "flex"
      }
      var img = new Image
      img.src = picurl
      imgdiv.appendChild(img)
      vidContainer?.appendChild(imgdiv)
      vidContainer.setAttribute('class', 'Camera');
      var btn = document.createElement('button')
      btn.innerHTML = `<mat-icon _ngcontent-jrg-c156="" role="img" class="mat-icon notranslate material-icons mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font"> fullscreen</mat-icon>`
      btn.setAttribute('class', 'fullscreen-button')
      btn.addEventListener("click", this.fullscreenvideo.bind(this));
      vidContainer.appendChild(vidElement);
      vidContainer.appendChild(this.makeLabel(this.peerConnections[peerUuid].displayName));
      vidContainer?.appendChild(btn)
      document.getElementById('Dish').appendChild(vidContainer);
      
      var userlistul = document.getElementById('user-list')
      var list = document.createElement('li')
      list.id = peerUuid;
      list.classList.add('user-list-tile')
      list.innerHTML = `
                        <img class="user-image" src="${picurl}" >
                        <div class="name-div">
                        <span class='user-name'>${this.peerConnections[peerUuid].displayName} ${this.peerConnections[peerUuid].lname}</span>
                        <span class="user-type">${this.peerConnections[peerUuid].type}</span>
                        </div>
                        <div style="float:right;line-height:70px;padding-right:8px;">
                        <mat-icon role="img" class="mat-icon notranslate material-icons mat-icon-no-color" id="${peerUuid}_mic" data-mat-icon-type="font" style="vertical-align:middle;${ismuted?"display:none":""}">mic</mat-icon>
                        <mat-icon role="img" class="mat-icon notranslate material-icons mat-icon-no-color" id="${peerUuid}_mic_off" data-mat-icon-type="font" style="vertical-align:middle;${ismuted?"":"display:none"}">mic_off</mat-icon>
                        </div>
                        <span id="${peerUuid}_kickout" class="hover-show">kick out</span>
                        `
      list.getElementsByClassName(`hover-show`)[0].addEventListener("click", this.kick.bind(this));
      userlistul?.append(list)
      Dish()
    }
    this.count++
  }

  kick(element) {
    var fullid = (element.srcElement.id)
    var id = fullid.split('_kickout')[0]
    if (this.isroomcreator) {
      this.serverConnection.send(JSON.stringify({
        'roomName': this.roomName,
        'kick': "kick",
        'dest': id
      }))
    } else {
      this.snackbar.open('You have insufficient rights to kick out', 'ok', { duration: 6000, verticalPosition: "top", horizontalPosition: "start" })
    }
  }

  checkPeerDisconnect(event, peerUuid, isHangedUp) {
    var state;

    if (isHangedUp == true) {
      if(this.peerConnections[peerUuid])
      {
        this.numberofparticipants--
        this.peerConnections[peerUuid].pc.close()
        state = this.peerConnections[peerUuid].pc.iceConnectionState;
        delete this.peerConnections[peerUuid];
        document.getElementById('Dish').removeChild(document.getElementById('remoteVideo_' + peerUuid));
        document.getElementById('user-list').removeChild(document.getElementById(peerUuid))
        Dish()
      }
    } else {
      
      if(this.peerConnections[peerUuid])
      {
        state = this.peerConnections[peerUuid].pc.iceConnectionState;
        if (state === "failed" || state === "closed" || state === "disconnected") {
          this.numberofparticipants--
          delete this.peerConnections[peerUuid];
          if(document.getElementById('Dish'))
          {
            document.getElementById('Dish').removeChild(document.getElementById('remoteVideo_' + peerUuid));
            document.getElementById('user-list').removeChild(document.getElementById(peerUuid))
            Dish()
          }
        }
      }
    }
    //console.l(`connection with peer ${peerUuid} ${state}`);
  }

  makeLabel(label) {
    var vidLabel = document.createElement('span');
    vidLabel.appendChild(document.createTextNode(label));
    vidLabel.setAttribute('class', 'videoLabel');
    return vidLabel;
  }

  errorHandler(error) {
    console.log(error);
    if(error.name == "NotReadableError"){
      this.snackbar.dismiss()
      alert("error occurred at getting video from your camera. Try after closing all application which are currently accessing your camera. If error eontinue occurring write to Contact Us.");
      if(this.isroomcreator){this.authservice.deleteroom({roomid:this.roomName}).subscribe(res=>{console.log(res)})}
      this.router.navigateByUrl('/dashboard')
    }
  }

  createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  isMobile() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true
    }
    else {
      return false
    }
  }

}

@Component({
  selector: 'video-dialog',
  templateUrl: 'video-dialog.html',
})
export class videoDialog {

  constructor(public dialogRef: MatDialogRef<videoDialog>, private ngZone: NgZone) {
    var temp = this.dialogRef.getState()
    if (temp == 0) {
      setTimeout(() => {
        var videodiv = document.getElementById('content-video')?.childNodes[0];
        if (videodiv) {
          videodiv.removeAttribute("style");
          videodiv.children[3].style.display = "none";
          videodiv.getElementsByTagName('video')[0].style.objectFit = "contain"
        }
      }, 100)
    }
  }

  close(): void {

    this.ngZone.run(() => {
      this.dialogRef.close()
      var videoContainer = document.getElementById('Dish')
      
      var videodiv = document.getElementById('content-video')?.childNodes[0]
      videoContainer?.appendChild(videodiv)
      videodiv.children[3].style.display = "block"
      videodiv.getElementsByTagName('video')[0].style.objectFit = "cover"
      Dish()
    })
  }
}

@Component({
  selector: 'cSnackbar',
  template: `
            <div style="display:flex;justify-content: space-between;align-items: center; gap:2em">
            <div [innerHTML]="data.html">
            </div>
            <button mat-raised-button color="accent" (click)="snackbar.dismiss()" style="aspect-ration:2/1">
            OK
            </button> </div>`,
})

export class cSnackbar {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any, public snackbar: MatSnackBar) { }
}

@Component({
  selector: 'permissionblock',
  templateUrl: 'permissionblock.html',
  styleUrls:['permissionblock.css']
})

export class permissionblock {
  
  constructor(public dialogRef: MatDialogRef<RoomComponent>, private ngZone: NgZone){}

  close(): void {

    this.ngZone.run(() => {
      this.dialogRef.close()
    })
  }

  myBrowser() {

    if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {

      return 'Opera';

    } else if (navigator.userAgent.indexOf("Chrome") != -1) {

      return 'Chrome';

    } else if (navigator.userAgent.indexOf("Safari") != -1) {

      return 'Safari';

    } else if (navigator.userAgent.indexOf("Firefox") != -1) {

      return 'Firefox';

    } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {

      return 'IE';

    } else {

      return 'unknown';

    }

  }

  isMobile() {
    if (/Android|webOS|iPhone|Mobile|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true
    }
    else {
      return false
    }
  }
}