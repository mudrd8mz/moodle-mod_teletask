// Generated by CoffeeScript 1.8.0
(function() {
  define(["controls", "slideviewer", "chapters", "overlays", "quiz"], function(Controls, SlideViewer, Chapters, Overlays, Quiz) {

    /*
        This is the main class for the video player.
        It is in charge of:
        - public interface to control video player
        - syncing between the 2 videos
        - bootstrapping the whole player
     */
    var VideoPlayer;
    return VideoPlayer = (function() {
      function VideoPlayer($baseElement) {
        this.$baseElement = $baseElement;
        this.isSingle = this.checkSingle();
        this.$videoA = this.$baseElement.find('video.speaker').first();
        this.videoA = this.$videoA[0];
        if (this.isSingle) {
          this.$videoA.parent().width("100%");
        } else {
          this.$videoB = this.$baseElement.find('video.slides').first();
          this.videoB = this.$videoB[0];
        }
        this.playbackRate = 1.0;
        this.volume = 1.0;
        this.muted = false;
        this.quizEnabled = true;
        this.loadCount = 0;
        this.lastCheckTime = 0;
		this.lectureID = $(".quizContent").attr("id");
        $(window).on("videosReady", (function(_this) {
          return function() {
            var callback, preseek, quiz_request, quiz_url;
            _this.controls = new Controls(_this, _this.$baseElement);
            _this.slideViewer = new SlideViewer(_this, _this.$baseElement);
            _this.chapters = new Chapters(_this, _this.$baseElement.find('.chapters ol'));
            _this.overlays = new Overlays(_this, _this.$baseElement.find('#wiki_overlay_container'));
            _this.overlays_links = new Overlays(_this, _this.$baseElement.find('#link_overlay_container'));
            preseek = parseInt(jQuery.deparam(window.location.hash.substring(1))["t"]);
            if (!isNaN(preseek)) {
              _this.seek(preseek);
            }
            callback = function(response) {
              var current_quiz, i, json_quizzes, _i, _ref, _results;
              //json_quizzes = jQuery.parseJSON(response);
			  json_quizzes = response;
              _this.quizzes = new Array(json_quizzes.data.length);
              _results = [];
              for (i = _i = 0, _ref = json_quizzes.data.length - 1; _i <= _ref; i = _i += 1) {
                current_quiz = json_quizzes.data[i];
                _results.push(_this.quizzes[i] = new Quiz(_this, current_quiz.question_id, current_quiz.course_id, current_quiz.question, current_quiz.description, current_quiz.answer_list, current_quiz.correct_answers, current_quiz.explanation, current_quiz.question_type, current_quiz.time));
              }
              return _results;
            };
			if(typeof _this.lectureID !== 'undefined')
			{
				quiz_url = "/selftest/lecture/quizes/" + _this.lectureID + "/";
				quiz_request = $.get(quiz_url, callback);
			}
            _this.slideViewer.buildSlidePreview();
            if (!_this.isSingle) {
              return _this.syncVideo();
            }
          };
        })(this));
        this.$videoA.on("canplay", (function(_this) {
          return function() {
            _this.loadCount++;
            _this.attachEventHandlers();
          };
        })(this));
        if (!this.isSingle) {
          this.$videoB.on("canplay", (function(_this) {
            return function() {
              _this.loadCount++;
              _this.attachEventHandlers();
            };
          })(this));
        }
        if (this.videoA.readyState >= this.videoA.HAVE_FUTURE_DATA) {
          this.$videoA.trigger("canplay");
        }
        if (!this.isSingle && this.videoB.readyState >= this.videoB.HAVE_FUTURE_DATA) {
          this.$videoB.trigger("canplay");
        }
        this.$videoA.click((function(_this) {
          return function() {
            return _this.togglePlay();
          };
        })(this));
        if (!this.isSingle) {
          this.$videoB.click((function(_this) {
            return function() {
              return _this.togglePlay();
            };
          })(this));
        }
        setTimeout(((function(_this) {
          return function() {
            return _this.checkBuffering();
          };
        })(this)), 1000);
      }

      VideoPlayer.prototype.play = function() {
        return this.videoA.play();
      };

      VideoPlayer.prototype.pause = function() {
        return this.videoA.pause();
      };

      VideoPlayer.prototype.togglePlay = function() {
        if (this.videoA.paused) {
          return this.play();
        } else {
          return this.pause();
        }
      };

      VideoPlayer.prototype.seek = function(time) {
        this.currentTime = time;
        this.videoA.currentTime = time;
        return window.location.hash = 't=' + time;
      };

      VideoPlayer.prototype.seekForward = function(seconds) {
        return this.videoA.currentTime += seconds;
      };

      VideoPlayer.prototype.seekBack = function(seconds) {
        return this.videoA.currentTime -= seconds;
      };

      VideoPlayer.prototype.changeSpeed = function(speed) {
        this.playbackRate = speed;
        this.videoA.playbackRate = speed;
        if (!this.isSingle) {
          return this.videoB.playbackRate = speed;
        }
      };

      VideoPlayer.prototype.mute = function(bool) {
        this.muted = bool;
        return this.videoA.muted = bool;
      };

      VideoPlayer.prototype.enableQuiz = function(bool) {
        return this.quizEnabled = bool;
      };

      VideoPlayer.prototype.currentTime = function() {
        return this.videoA.currentTime;
      };

      VideoPlayer.prototype.videoState = function() {
        if (this.videoA.paused) {
          return "paused";
        } else {
          return "playing";
        }
      };

      VideoPlayer.prototype.attachEventHandlers = function() {
        var events;
        if (!this.isSingle && this.loadCount === 2) {
          events = ["play", "pause", "timeupdate", "seeking"];
          events.forEach((function(_this) {
            return function(evt) {
              return _this.$videoA.on(evt, function() {
                if (evt === "seeking" && Math.abs(_this.videoB.currentTime - _this.videoA.currentTime) > 1) {
                  if (_this.videoA.currentTime) {
                    _this.videoB.currentTime = _this.videoA.currentTime;
                  }
                }
                if (evt === "play") {
                  if (_this.videoA.currentTime) {
                    _this.videoB.play(_this.videoA.currentTime);
                  }
                }
                if (evt === "pause") {
                  _this.videoB.pause();
                }
                if (evt === "ratechange") {
                  return _this.videoB.playbackRate = _this.playbackRate;
                }
              });
            };
          })(this));
          $(window).trigger("videosReady");
        }
        if (this.isSingle && this.loadCount === 1) {
          $(window).trigger("videosReady");
        }
      };

      VideoPlayer.prototype.syncVideo = function() {
        if (Math.abs(this.videoB.currentTime - this.videoA.currentTime) > 1) {
          this.videoB.currentTime = this.videoA.currentTime;
        }
        this.chapters.setActiveChapter(this.videoB.currentTime);
        return setTimeout(((function(_this) {
          return function() {
            return _this.syncVideo();
          };
        })(this)), 1000);
      };

      VideoPlayer.prototype.checkBuffering = function() {
        if (this.videoA.currentTime === this.lastCheckTime && !this.videoA.paused) {
          $('.videoPlayer .spinner').show();
        } else {
          $('.videoPlayer .spinner').hide();
          this.lastCheckTime = this.videoA.currentTime;
        }
        return setTimeout(((function(_this) {
          return function() {
            return _this.checkBuffering();
          };
        })(this)), 75);
      };

      VideoPlayer.prototype.checkSingle = function() {
        if (this.$baseElement.find('video.slides').length === 1) {
          return false;
        }
        return true;
      };

      return VideoPlayer;

    })();
  });

}).call(this);