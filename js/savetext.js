$("#download").click( function() {
  var text = programCodeMirror.getValue();
  var filename = "code"
  var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  saveAs(blob, filename+".mas");
});