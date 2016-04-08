setTimeout(function(){
	var fileInput = document.getElementById('fileInput');
	
	fileInput.addEventListener('change', function(e) {
		var file = fileInput.files[0];
		var textType = /text.*/;

		if (file.type.match(textType)) {
			var reader = new FileReader();

			reader.onload = function(e) {
				programCodeMirror.setValue(reader.result);
				CodeMirror.refresh();
			}

			reader.readAsText(file);	
		} else {
			CodeMirror.refresh(); 
		}
	});
    }, 2000);


