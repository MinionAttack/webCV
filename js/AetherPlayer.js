/**
 * @author  Payne
 * @email  huyang110yahoo@gmail.com
 * @github  https://github.com/peinhu
 * @site    http://2ndrenais.com
 * @date    2015-08-04
 */

(function () {

  'use strict';

  //Config your player here.
  let config = {
    dataStorage: 'file', // [file|database] The way to storage playlist. If you choose database, then you should declare and assign a JavaScript variable named aetherplayer_playList_database in script tag.
    position: 'leftbottom', // [lefttop|leftbottom|righttop|rightbottom] The position of audio player.
    fontFamily: 'microsoft yahei,arial,sans-serif', // [FONTFAMILY] The fonts of your text.
    autoPlay: false, // [true|false] Start playing music immediately when the data is ready.
    playMode: 'order', // [order|repeat|random] The play mode by default.
    debug: false, // [true|false] Show the debug information in the console.
  };

  let audio, moveLength, _playstatus = 'pause', _playmode, _songindex = 0, preloadImg = [], internal, debug;
  let context, closeAudioContext = false, playList = [], pauseStatusFromPrepareToPlay = false;

  browserDetection();

  playerInit();

  function browserDetection() {
    // https://github.com/lancedikson/bowser#device-flags
    if (bowser.webkit || bowser.blink) { //Chrome based browser
      config.autoPlay = false;
    } else if (bowser.gecko || bowser.msedge) { // Firefox and MS Edge
      config.autoPlay = true;
    }
  }

  //initialization process of the player
  function playerInit() {
    playerAdd();
    audioEventBind();
    buttonEventBind();
    configLoad();
    if (playList.length === 0) return;
    albumPreload();
    prepareToPlay();
  }

  function audioEventBind() {

    audio.addEventListener('playing', function () {
      if (debug) debugOutput('audio - playing:' + playList[_songindex].songName);
    }, true);

    audio.addEventListener('pause', function () {
      if (debug) debugOutput('audio - pause:' + playList[_songindex].songName);
    }, true);

    audio.addEventListener('ended', function () {
      if (bowser.webkit || bowser.blink || bowser.msedge) { //No full support of WebAudio API
        context.close();
        cdPause();
      } else if (bowser.gecko) {
        musicNext();
      }
      if (debug) debugOutput('audio - ended:' + playList[_songindex].songName);
    });

    audio.addEventListener('error', function () {
      setTimeout(function () {
        if (bowser.gecko) {
          musicNext()
        } else {
          cdPause();
        }
      }, 5000);
      if (debug) debugOutput('audio - error:' + playList[_songindex].songName);
    });

    audio.addEventListener('loadeddata', function () {
      if (debug) debugOutput('audio - loadeddata:' + playList[_songindex].songName);
    });

    audio.addEventListener('stalled', function () {
      if (debug) debugOutput('audio - stalled:' + playList[_songindex].songName);
    });

  }

  function buttonEventBind() {

    let eventType = "", isSupportTouch = "ontouchend" in document;

    (isSupportTouch === true) ? eventType = "touchend" : eventType = "mousedown";

    $('#aetherplayer #player-title').addEventListener('mouseover',
      function () {
        internal = setInterval(function () {
          titleMove()
        }, 20);
      }
    );

    $('#aetherplayer #player-title').addEventListener('mouseout',
      function () {
        titleReset();
        clearInterval(internal);
      }
    );

    let playBtnFunc = function () {
      if (_playstatus === 'pause') {
        musicPlay();
        if (debug) debugOutput('button - play');
      } else if (_playstatus === 'playing') {
        musicPause();
        if (debug) debugOutput('button - pause');
      }
    };

    let prevBtnFunc = function () {
      musicPrev();
      if (debug) debugOutput('button - prev');
    };

    let nextBtnFunc = function () {
      musicNext();
      if (debug) debugOutput('button - next');
    };

    let playModeBtnFunc = function () {
      playModeChange();
      if (debug) debugOutput('button - mode:' + _playmode);
    };

    let AlbumShowFunc = function () {
      $('#aetherplayer .player').style.visibility = "visible";
      $('#aetherplayer .player-mask').style.display = "block";
    };

    let AlbumHideFunc = function (e) {
      e.preventDefault();
      $('#aetherplayer .player').style.visibility = "hidden";
      $('#aetherplayer .player-mask').style.display = "none";
    };

    $('#aetherplayer #player-btn-play').addEventListener(eventType, playBtnFunc);
    if (bowser.gecko) {
      $('#aetherplayer #player-btn-backward').addEventListener(eventType, prevBtnFunc);
      $('#aetherplayer #player-btn-forward').addEventListener(eventType, nextBtnFunc);
    }
    $('#aetherplayer #player-btn-playmode').addEventListener(eventType, playModeBtnFunc);
    $('#aetherplayer .player-tiny').addEventListener(eventType, AlbumShowFunc);
    $('#aetherplayer .player-mask').addEventListener(eventType, AlbumHideFunc);
    $('#aetherplayer .player-disk-image').addEventListener("animationend", function () {
      this.className = this.className.replace('fadein', '');
    });
    $('#aetherplayer .player-disk-image').addEventListener("webkitAnimationEnd", function () {
      this.className = this.className.replace('fadein', '');
    });
  }

  function $(node) {
    return document.querySelector(node);
  }

  function playerAdd() {
    let html = '<div  class="player" id="player">'
      + '<div class="player-disk i-circle" >'
      + '<img class="player-disk-image fadein" id="player-disk-image">'
      + '</div>'
      + '<div class="player-disk-circle-big" ><div class="player-disk-circle-small"></div></div>'
      + '<div class="player-title select-disable" id="player-title">'
      + '<span class="player-title-text" id="player-title-text"></span>'
      + '</div>'
      + '<div class="player-btn-playmode select-disable" id="player-btn-playmode"></div>'
      + '<div class="player-btn-backward select-disable" data-toggle="tooltip" data-placement="auto" ' + showButtonPopup() + ' id="player-btn-backward"> <i class="fa fa-step-backward fa-lg player-btn-shadow"></i></div>'
      + '<div class="player-btn-play select-disable" id="player-btn-play" ><i class="fa fa-play fa-lg player-btn-shadow"></i></div>'
      + '<div class="player-btn-forward select-disable" data-toggle="tooltip" data-placement="auto" ' + showButtonPopup() + ' id="player-btn-forward"> <i class="fa fa-step-forward fa-lg player-btn-shadow"></i></div>'
      + '</div>'
      + '<audio id="songs" crossorigin="anonymous" preload="none">The technique used in program is not supported by ancient browser.</audio>'
      + '<div class="player-tiny"><i class="fa fa-volume-up fa-large"></i></div>'
      + '<div class="player-mask" id="player-mask"></div>';
    let newNode = document.createElement("div");
    newNode.innerHTML = html;
    newNode.id = "aetherplayer";
    document.body.appendChild(newNode);
    audio = $("#aetherplayer #songs");
  }

  function showButtonPopup() {
    if (bowser.webkit || bowser.blink || bowser.msedge) { //Chrome based browser or MS Edge
      return 'title="Only supported on Firefox"';
    } else if (bowser.gecko) { // Firefox and MS Edge
      return '';
    }
  }

  //play the song
  function musicPlay() {
    _playstatus = 'playing';
    $('#aetherplayer .fa-volume-up').id = 'twinkling';
    cdPlay();
    if (pauseStatusFromPrepareToPlay) {
      pauseStatusFromPrepareToPlay = false;
      visualizer(audio);
    }
    audio.play();
  }

  //pause the song
  function musicPause() {
    _playstatus = 'pause';
    $('#aetherplayer .fa-volume-up').id = '';
    cdPause();
    audio.pause();
  }

  //change to the next song
  function musicNext() {
    switch (_playmode) {
      case 'order' :
        ++_songindex;
        if (_songindex > playList.length - 1) _songindex = 0;
        break;
      case 'repeat' :
        break;
      case 'random':
        _songindex = randomIndexGet();
        break;
      default :
        break;
    }
    $('#aetherplayer .player-disk-image').className = "player-disk-image fadein";
    prepareToPlay();
  }

  //change to the previous song
  function musicPrev() {
    switch (_playmode) {
      case 'order' :
        --_songindex;
        if (_songindex < 0) _songindex = playList.length - 1;
        break;
      case 'repeat' :
        break;
      case 'random' :
        _songindex = randomIndexGet();
        break;
      default :
        break;
    }
    $('#aetherplayer .player-disk-image').className = "player-disk-image fadein";
    prepareToPlay();
  }

  //do some preprocessing before playing a song
  function prepareToPlay() {
    if (closeAudioContext && context !== undefined) { //MANDATORY RELEASE THE PREVIOUS RESOURCES TO AVOID OBJECT OVERLAPPING AND CPU-MEMORY USE
      context.close();
    }
    context = new AudioContext();
    resourceLoad();
    moveLengthGet();
    if (_playstatus === 'pause') {
      pauseStatusFromPrepareToPlay = true;
      return;
    }
    cdPlay();
    visualizer(audio);
    musicPlay();
  }

  //move the title text
  function titleMove() {
    let nodeObj = $('#player-title-text');
    if (moveLength <= 0) return;
    let mLeft = 0 - nodeObj.offsetLeft;
    if (mLeft >= moveLength) return;
    mLeft += 1;
    nodeObj.style.marginLeft = '-' + mLeft + 'px';
  }

  //get the move length of title text
  function moveLengthGet() {
    let titlewidth = $('#aetherplayer #player-title').offsetWidth;
    let textwidth = $('#aetherplayer #player-title-text').offsetWidth;
    return moveLength = textwidth - titlewidth;
  }

  //preload the album picture by order and set cache
  function albumPreload(index) {
    let imgIndex = arguments[0] ? arguments[0] : 0;
    if (imgIndex >= playList.length) return;
    preloadImg[imgIndex] = new Image();
    preloadImg[imgIndex].src = playList[imgIndex].songCover;
    preloadImg[imgIndex].onload = function () {
      if (imgIndex === 0) $("#aetherplayer #player-disk-image").style.display = "block";
      ++imgIndex;
      albumPreload(imgIndex);
    }
  }

  //load the src, album and title of the audio resource
  function resourceLoad() {
    audio.src = playList[_songindex].songURL;
    $("#aetherplayer #player-disk-image").src = playList[_songindex].songCover;
    $('#aetherplayer #player-title-text').innerHTML = playList[_songindex].songName + " - " + playList[_songindex].artist;
  }

  //make the CD turn
  function cdPlay() {
    $('#aetherplayer #player-btn-play').innerHTML = '<i class="fa fa-pause fa-lg player-btn-shadow"></i>';
    $('#aetherplayer .i-circle').style.animationPlayState = 'running';
    $('#aetherplayer .i-circle').style.webkitAnimationPlayState = 'running';
  }

  //make the CD stop
  function cdPause() {
    $('#aetherplayer #player-btn-play').innerHTML = '<i class="fa fa-play fa-lg player-btn-shadow"></i>';
    $('#aetherplayer .i-circle').style.animationPlayState = 'paused';
    $('#aetherplayer .i-circle').style.webkitAnimationPlayState = 'paused';
  }

  //load the configuration
  function configLoad() {
    for (let conf in config) {
      eval(conf + "Config()");
    }
  }

  //configure the autoplay
  function autoPlayConfig() {
    if (config.autoPlay) {
      _playstatus = 'playing';
      return;
    }
    _playstatus = 'pause';
  }

  //configure the position of audio player
  function positionConfig() {
    $('#aetherplayer #player').className += " player-position-" + config.position;
  }

  //configure the fontFamily
  function fontFamilyConfig() {
    $('#aetherplayer #player').style.fontFamily = config.fontFamily;
  }

  //configure the play mode
  function playModeConfig() {
    playModeApply(config.playMode);
  }

  //configure the debug status
  function debugConfig() {
    debug = config.debug;
    if (debug) debugOutput('debugging');
  }

  function debugOutput(info) {
    console.log("AetherPlayer : " + info);
  }

  //apply the play mode
  function playModeApply(playmode) {
    switch (playmode) {
      case 'order':
        _playmode = 'order';
        $('#aetherplayer #player-btn-playmode').innerHTML = '<i class="fa fa-sort-amount-asc fa-lg player-btn-shadow"></i>';
        $('#aetherplayer #player-btn-playmode').title = "Order";
        break;
      case 'repeat':
        _playmode = 'repeat';
        $('#aetherplayer #player-btn-playmode').innerHTML = '<i class="fa fa-refresh fa-lg player-btn-shadow"></i>';
        $('#aetherplayer #player-btn-playmode').title = "Repeat";
        break;
      case 'random':
        _playmode = 'random';
        $('#aetherplayer #player-btn-playmode').innerHTML = '<i class="fa fa-random fa-lg player-btn-shadow"></i>';
        $('#aetherplayer #player-btn-playmode').title = "Random";
        break;
      default:
        break;
    }
  }

  //change the play mode of audio player
  function playModeChange() {
    let playModeArray = ['order', 'repeat', 'random'], playModeArray_index;
    for (let i = 0; i < playModeArray.length; i++) {
      if (playModeArray[i] === _playmode) {
        playModeArray_index = i;
        break;
      }
    }
    ++playModeArray_index;
    if (playModeArray_index > playModeArray.length - 1) playModeArray_index = 0;
    playModeApply(playModeArray[playModeArray_index]);
  }

  //reset the position of title text
  function titleReset() {
    $('#aetherplayer #player-title-text').style.marginLeft = '0px';
  }

  //get the random index
  function randomIndexGet() {
    let randomIndex = _songindex;
    while (randomIndex === _songindex) { //make sure to get the different index
      randomIndex = Math.floor(Math.random() * playList.length);
    }
    return randomIndex;
  }

  //configure the way to storage data
  function dataStorageConfig() {
    switch (config.dataStorage) {
      case "file":
        playList = aetherplayer_playList_file;
        break;
      case "database":
        playList = aetherplayer_playList_database;
        break;
      default:
        break;
    }
  }

  function visualizer(audio) {
    closeAudioContext = true;
    let src = undefined;
    try {
      src = context.createMediaElementSource(audio);
    } catch (exception) {
      if (!context.close) {
        context.close();
      }
      cdPause();
      if ((exception.code === 11) && (exception.name === 'InvalidStateError')) {
        console.log('Please, use Firefox for a full experience with the music player.');
      }
      return;
    }
    let analyser = context.createAnalyser();
    let canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = 256;
    let ctx = canvas.getContext("2d");

    src.connect(analyser);
    analyser.connect(context.destination);

    analyser.fftSize = 2048;

    let bufferLength = analyser.frequencyBinCount;

    let dataArray = new Uint8Array(bufferLength);

    let WIDTH = ctx.canvas.width;
    let HEIGHT = ctx.canvas.height;

    let barWidth = (WIDTH / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      x = 0;
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        ctx.fillStyle = rainbow(x);
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;

      }
    }

    renderFrame();
  }

  // https://krazydad.com/tutorials/makecolors.php
  function rainbow(bar) {
    let redPhase = 0;
    let greenPhase = (2 * Math.PI) / 3;
    let bluePhase = (4 * Math.PI) / 3;
    let center = 128;
    let width = 127;
    let frequency = (Math.PI * 2) / 2048;

    let red = Math.sin(frequency * bar + redPhase) * width + center;
    let green = Math.sin(frequency * bar + greenPhase) * width + center;
    let blue = Math.sin(frequency * bar + bluePhase) * width + center;

    return RGB2Color(red, green, blue);
  }

  /**
   * @return {string}
   */
  function RGB2Color(red, green, blue) {

    return 'rgb(' + Math.round(red) + ',' + Math.round(green) + ',' + Math.round(blue) + ')';

  }

})();