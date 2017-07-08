/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

var HIGHEST_POSSIBLE_Z_INDEX = 2147483647;

function takePicture(success, error, opts) {
    if (opts && opts[2] === 1) {
        capture(success, error, opts);
    } else {
        var input = document.createElement('input');
        input.style.position = 'relative';
        input.style.zIndex = HIGHEST_POSSIBLE_Z_INDEX;
        input.className = 'cordova-camera-select';
        input.type = 'file';
        input.name = 'files[]';
        input.style.display = 'none';
        input.accept = "image/*";

        input.onchange = function(inputEvent) {
            var reader = new FileReader();
            reader.onload = function(readerEvent) {
                input.parentNode.removeChild(input);

                var imageData = readerEvent.target.result;

                return success(imageData.substr(imageData.indexOf(',') + 1));
            };

            reader.readAsDataURL(inputEvent.target.files[0]);
        };

        input.click();

        document.body.appendChild(input);
    }
}

function capture(success, errorCallback, opts) {
    var localMediaStream;
    var targetWidth = opts[3];
    var targetHeight = opts[4];

    targetWidth = targetWidth == -1?320:targetWidth;
    targetHeight = targetHeight == -1?240:targetHeight;

    // Div which holds the camera preview.
    var parent = document.createElement('div');

    var video = document.createElement('video');
    // If no options are passed set defaults to nothing.
    if (!opts[10]) {
        opts[10] = {};
    }
    // If no button is supplied create one.
    var capturebutton = opts[10].capturebutton ? opts[10].capturebutton : document.createElement('button');
    if (!opts[10].capturebutton) {
        capturebutton.type = "button";
        capturebutton.innerHTML = 'Capture!';
    }

    var cancelbutton = opts[10].cancelbutton ? opts[10].cancelbutton : document.createElement('button');
    if (!opts[10].cancelbutton) {
        cancelbutton.type = "button";
        cancelbutton.innerHTML = 'Cancel';
    }

    // Only assign styles if options does not have any set.
    if (typeof opts[10] !== 'object') {
        opts[10] = {};
    }
    parent.className = opts[10].className ? opts[10].className : 'cordova-camera-capture';
    // No custom class, setting default to white background with a video preview and capture.     
    if (!opts[10].className) {
        parent.style.position = 'absolute';
        parent.style.zIndex = HIGHEST_POSSIBLE_Z_INDEX;
        parent.style.height = '100%';
        parent.style.width = '100%';
        parent.style.top = 0;
        parent.style.left = 0;
        parent.style.background = 'white';
    }
    if (typeof opts[10].audio === 'undefined') {
        opts[10].audio = true;
    }
    var videoparent = document.createElement('div');
    if (opts[10].className) {
        videoparent.className = opts[10].className+'-content';
    }
    videoparent.className = 'cordova-camera-capture-content';
    videoparent.appendChild(video);
    parent.appendChild(videoparent);

    var buttons = document.createElement('div');
    if (opts[10].className) {
        buttons.className = opts[10].className+'-buttons';
    }
    var div = document.createElement('div');
    if (opts[10].className) {
        div.className = opts[10].className+'-button';
    } else {
        div.style.display = 'inline-block';
        div.style.width = '50%';
        div.style.padding = '4px';
    }
    div.appendChild(capturebutton);
    buttons.appendChild(div);

    div = document.createElement('div');
    if (opts[10].className) {
        div.className = opts[10].className+'-button';
    } else {
        div.style.display = 'inline-block';
        div.style.width = '50%';
        div.style.padding = '4px';
    }
    div.appendChild(cancelbutton);
    buttons.appendChild(div);

    parent.appendChild(buttons);

    // If hover is overlaying other elements prevent clicks from propagating.
    parent.onclick = function (e) {
        e.stopPropagation();
    };

    /**
     * Resize hover.
     */
    var resize = function() {
        var buttonsheight = buttons.getBoundingClientRect().height;
        var screenheight = window.innerHeight;
        var maxheight = screenheight - buttonsheight - 22;

        if (maxheight < 100) {
            maxheight = 100;
        }

        video.style.width = "100%";
        video.style.height = "auto";

        video.style.maxHeight = maxheight + 'px';
        video.className = 'video1';
    };

    /**
     * Stop video, remove event handlers and element nodes.
     */
    var cleanup = function() {
        // Stop video stream, remove video and button.
        // Note that MediaStream.stop() is deprecated as of Chrome 47.
        if (localMediaStream.stop) {
            localMediaStream.stop();
        } else {
            localMediaStream.getTracks().forEach(function (track) {
                track.stop();
            });
        }

        parent.innerHTML = '';
        parent.parentNode.removeChild(parent);
        window.removeEventListener("orientationchange", resize);
        window.removeEventListener("resize", resize);
    };

    cancelbutton.onclick = cleanup;

    capturebutton.onclick = function() {
        // Create a canvas and capture a frame from video stream.
        var canvas = document.createElement('canvas');
        // Reset width and height of video to match the target height and width.
        video.width = targetWidth;
        video.height = targetHeight;

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, targetWidth, targetHeight);

        // Convert image stored in canvas to base64 encoded image.
        var imageData = canvas.toDataURL('image/png');
        imageData = imageData.replace('data:image/png;base64,', '');

        cleanup();
        return success(imageData);
    };

    navigator.getUserMedia = navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia;

    /**
     * Called when stream to camera is allocated successfully.
     */
    var successCallback = function(stream) {
        localMediaStream = stream;
        video.src = window.URL.createObjectURL(localMediaStream);
        video.play();

        document.body.appendChild(parent);

        resize();
        window.addEventListener("orientationchange", resize);
        window.addEventListener("resize", resize);
    };

    if (navigator.getUserMedia) {
        navigator.getUserMedia({video: { width: targetWidth, height: targetHeight }, audio: opts[10].audio}, successCallback, errorCallback);
    } else {
        alert('Browser does not support camera :(');
    }
}

module.exports = {
    takePicture: takePicture,
    cleanup: function(){}
};

require("cordova/exec/proxy").add("Camera",module.exports);
