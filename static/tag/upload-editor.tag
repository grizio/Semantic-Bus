<upload-editor >
  <h2 class="center margin-top">Uploader votre fichier</h2>
  <h4 class="center">Ce composant vous permet d'uploader un fichier avec
  </br>une extension
  <b>XLSX</b>
  ou
  <b>CSV</b>
  et de le mapper en
  <b>JSON</b>
</h4>
<div class="progress">
  <div class="progress-bar" role="progressbar">{progress}</div>
</div>
<div class="containerV uplaod-container" style="overflow:inherit">
  <h3 class="{textloadclass}">{textload}</h3>
  <button class="upload-btn" onclick={uploadClick} type="button">Telecharger</button>
  <input id="upload-input" type="file" name="uploads[]"></br>
</div>
<style scope>
upload {
  height: 100%;
  background-color: #4791D2;
}

.upload-container {
  margin-top: 10%;
}
.no-text {
  text-align: center;
  color: red;
}
.yes-text {
  text-align: center;
  color: green;
}
upload {
  text-align: center;
  font-family: 'Raleway', sans-serif;
}
.btn:focus,
.upload-btn:focus {
  outline: 0 !important;
}

.margin-top {
  margin-top: 15% !important;
}

.progress-bar {
  height: 20px;
  background-color: #3883fa;
  border-radius: 5px;
  margin-left: 25%;
  text-align: center;
  font-size: 0.6em;
  color: #FA8900;
}

.row {
  margin-top: 80px;
}

.upload-btn {
  color: #ffffff;
  background-color: #F89406;
  border: none;
  padding: 10px;
  border-radius: 5px 5px 5px 5px;
  text-align: center;
  max-width: 25%;
  margin-left: 35%;
}
.upload-btn.active,
.upload-btn:active,
.upload-btn:focus,
.upload-btn:hover {
  color: #ffffff;
  background-color: #FA8900;
  border: none;
}

.center {
  text-align: center;
}

h4 {
  padding-bottom: 30px;
  color: #B8BDC1;
}

.glyphicon {
  font-size: 5em;
  color: #9CA3A9;
}

h2 {
  margin-top: 15px;
  color: #68757E;
}

.panel {
  padding-top: 20px;
  padding-bottom: 20px;
}

#upload-input {
  display: none;
}
@media (min-width: 768px) {
  .main-container {
    width: 100%;
  }
}
@media (min-width: 992px) {
  .container {
    width: 450px;
  }
}

</style>
<script>

this.innerData = {};
this.progress = 0;
var regex = /\.([^.]+)/g;
this.refuse = "";
this.accept = "";

Object.defineProperty(this, 'data', {
  set: function (data) {
    this.innerData = data;
    this.update();
  }.bind(this),
  get: function () {
    return this.innerData;
  },
  configurable: true
});
this.updateData = function (dataToUpdate) {
  this.innerData = dataToUpdate;
  this.update();
}.bind(this);

RiotControl.on('loading', function (pourcent) {
  this.progress = pourcent + '%';
  $('.progress-bar').width((pourcent / 2) + '%');
  this.update();
}.bind(this))

RiotControl.on('item_is_upload', function () {
  this.progress = "Votre fichier  est chargé";
  this.update();
}.bind(this))

uploadClick() {
  /* processing array buffers, only required for readAsArrayBuffer */
  this.progress = "";
  this.textload = "";
  $('.progress-bar').width(0 + '%');

  function fixdata(data) {
    var o = "",
      l = 0,
      w = 10240;
    for (; l < data.byteLength / w; ++l)
      o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
    return o;
  }

  var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
  $('#upload-input').unbind('change');
  $('#upload-input').click();
  $('#upload-input').on('change', function (e) {
    var files = $(this).get(0).files;
    if (files.length > 0) {
      var formData = new FormData();
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        formData.append('uploads[]', file, file.name);
      }
      RiotControl.trigger('item_current_upload', formData);
    }
  })
}.bind(this)
this.on('mount', function () {
  this.progress = "";
  $('.progress-bar').width(0 + '%');
  RiotControl.on('item_current_changed', this.updateData);
});
this.on('unmount', function () {
  RiotControl.off('item_current_changed', this.updateData);
});
</script>
</upload-editor>
