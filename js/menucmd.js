$("#undo").click( function(){
	programCodeMirror.undo();
});

$("#redo").click( function(){
	programCodeMirror.redo();
});

$("#clear").click( function(){
	$('#newfoldermodal').modal('show');
});

$("#newfilebtn").click( function(){
	var clrtxt = "";
	programCodeMirror.setValue(clrtxt);
	programCodeMirror.clearHistory();
});

$("#cnclnewfile").click( function(){
	$('#newfoldermodal').modal('hide');
});
