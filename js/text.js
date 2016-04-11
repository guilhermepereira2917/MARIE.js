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

function saveTextAsFile(){      
    var textToWrite = programCodeMirror.getValue();
    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    var fileNameToSaveAs = "myNewFile.txt";
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    window.URL = window.URL || window.webkitURL;
          
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
}

function destroyClickedElement(event)
{
// remove the link from the DOM
    document.body.removeChild(event.target);
}