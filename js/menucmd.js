$("#undo").click( function(){
	programCodeMirror.undo();
});

$("#redo").click( function(){
	programCodeMirror.redo();
});


$("#clear").click( function(){
	var r = confirm("Are you sure, you want to clear everything.");
	if (r == true) {
		var clrtxt = "";
		programCodeMirror.setValue(clrtxt);
		programCodeMirror.clearHistory();
	}
});