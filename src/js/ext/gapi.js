(function() {
  // The Browser API key obtained from the Google Developers Console.
  var developerKey = 'AIzaSyCpcTAAL4Yf9WoKVD_UE6f-_LwE6bDau-M';

  // The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
  var clientId = "357044840397-qs7nu7a17ohiih95v334l6k209qh5oah.apps.googleusercontent.com"

  // Scope(s) to use to access various data
  var scope = ['https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/userinfo.profile'];

  var pickerApiLoaded = false;
  var oauthToken;

  // Use the API Loader script to load google.picker and gapi.auth.
  onApiLoad = function() {
    gapi.load('auth', {'callback': onAuthApiLoad});
    gapi.load('picker', {'callback': onPickerApiLoad});
    gapi.client.load('drive', 'v3');
  }

  onAuthApiLoad  = function() {
    window.gapi.auth.authorize(
        {
          'client_id': clientId,
          'scope': scope,
          'immediate': false
        },
        handleAuthResult);
  }

  onPickerApiLoad = function() {
    pickerApiLoaded = true;
    createPicker();
  }

  handleAuthResult  = function(authResult) {
    if (authResult && !authResult.error) {
      oauthToken = authResult.access_token;
      getName();
    }
  }

  /**
   * Google Picker Creation Handler.
   *
   * @return Returns Picker and Handles a callback once file is selected
   */
  createPicker  = function() {
    if (pickerApiLoaded && oauthToken) {
      var view = new google.picker.DocsView().
          setParent('root').
          setIncludeFolders(true);
      var picker = new google.picker.PickerBuilder().
          addView(view).
          setOAuthToken(oauthToken).
          setDeveloperKey(developerKey).
          setCallback(pickerCallback,oauthToken).
          build();
      picker.setVisible(true);
    }
  }

  /**
   * Google Picker Handler.
   *
   * @see createPicker
   * @param  {string} data       Passes authentication
   */
  pickerCallback  = function(data,accessToken) {
    var pickerAction = data[google.picker.Response.ACTION];
    var pickedState = google.picker.Action.PICKED;

    if (pickerAction === pickedState) {
      var doc = data[google.picker.Response.DOCUMENTS][0];    // set the variable doc as First document
      fileID = doc[google.picker.Document.ID];                    // Get FileID
      var folderID = doc[google.picker.Document.PARENT_ID]    // Folder ID Is the file's Parent ID
    } else if (pickerAction === "cancel") {
      NProgress.done();
    }
    if (fileID !== ""){
      readGFile(fileID);
      console.info('The file id ' + fileID + ' is located: ' + folderID);
      sessionStorage.setItem("savedFileID",fileID);             // Save File ID into Session Storage for Reusability Purposes
      sessionStorage.setItem("parentID", folderID);        // Save Folder ID into Session Storage for Reusability Purposes
    } else {
      NProgress.done();
    }
  }

  /**
   * readGFile function
   * @class gapi
   * Load a file from Drive. Fetches both the metadata & content in parallel.
   *
   * @param {String} fileID   the ID of the file to load
   */
   readGFile = function(fileID){
     NProgress.inc(0.2);
     gapi.client.request({
         'path': '/drive/v2/files/'+fileID,
         'method': 'GET',
         callback: function ( theResponseJS, theResponseTXT ) {
             var myToken = gapi.auth.getToken();          // Get new Authentication Token for security purposes
             var xhRequest   = new XMLHttpRequest();
             xhRequest.open('GET', theResponseJS.downloadUrl, true );
             xhRequest.setRequestHeader('Authorization', 'Bearer ' + myToken.access_token );
             xhRequest.onreadystatechange = function( theProgressEvent ) {
                // check if XHR is terminated
                 if (xhRequest.readyState == 4) {
                     NProgress.inc(0.2);
                     if ( xhRequest.status === 200 ) {
                        //  XHR Status 200 is OK
                         NProgress.inc(0.2);
                         code = xhRequest.response;
                         sessionStorage.setItem('gdrivefile',code);
                         $('#o').click();     //this is very buggy and will be improved
                     } else if(xhRequest.status === 404){
                          $('warn-missing-file').show();  // show file missing alert box, if file cannot be found
                     }
                 }
             }
             xhRequest.send();
         }
     });
   }

   /**
    * getName function
    * @class gapi
    * Loads Display Name based on Data from Google+ API
    *
    * @return {String} name
    */
   getName = function(){
    gapi.client.load('plus','v1', function(){
    var request = gapi.client.plus.people.get({
      'userId': 'me'
    });
    request.execute(function(resp) {
      name = resp.displayName;
      console.info('Successfully Logged In');
      console.info('Retrieved profile for:' + name);
      if(name !== undefined || name !== "undefined"){
        $('#nameLink').html('Hello ' + name);
        $('#nameLink').show();
        $('#login').hide();
        $('#gdrive').show();
        $('#logOut').show();
        $('#opensgdModal').show();
        }
      });
    });
  }

  test = function() {
    console.log('Success');
  }

  folderPicker = function(){
      console.info('Loading FilePicker');
      //enable docsView to allow user to pick and interact with Google Drive Folder(s)
      var docsView = new google.picker.DocsView()
          .setIncludeFolders(true)
          .setMimeTypes('application/vnd.google-apps.folder')
          .setSelectFolderEnabled(true);
      if(pickerApiLoaded && oauthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(docsView).
            setOAuthToken(oauthToken).
            setDeveloperKey(developerKey).
            setCallback(function(data){
              var fileName = $("#GFileName").val();
              var fileType = $('#saveGFileMode option:selected').val();

              if(fileName === "" || fileName === null){
                fileName = "code";      //default name set to code.<extension> if not selected
              }
              if(fileType === "" || fileType === null){
                fileType = "mas";      //default name set to <name>.mas if not selected
              }

              var code = sessionStorage.getItem('code');
              var pickerAction = data[google.picker.Response.ACTION];
              var pickedState = google.picker.Action.PICKED;
              if (pickerAction === pickedState) {
                console.log(fileName,fileType);
                var doc = data[google.picker.Response.DOCUMENTS][0];    // set the variable doc as First document
                var locationID = doc[google.picker.Document.PARENT_ID]    // Folder ID Is the file's Parent ID
                console.log(locationID);
                var fullFileName = fileName + "." + fileType;
                console.log(fullFileName);
                saveToGDrive("",locationID,code, fullFileName);
              }
            }).
            build();
        picker.setVisible(true);
      }
  }


  /**
   * saveToGDrive function
   * Load a file from Drive. Fetches both the metadata & content in parallel.
   *
   * @param {string} fileID     Unique File ID from Google Drive which identifies it
   * @param {string} folderId   Unique Folder ID of File ID
   * @param {string} text       text to be updated
   */
  saveToGDrive = function(fileID,folderId,text, filename, callback){
    //NProgress starts with 10% when entering this function

    //GAPI POST/PUT REQUST CONSTs
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";


    var contentType = "plain/text";
    var myToken = gapi.auth.getToken();



    NProgress.inc(0.1);

    if (fileID === "" || fileID === null) {
      var reader = new FileReader();
      var fileData = new Blob([text], {type:'plain/text'});
      reader.readAsBinaryString(fileData);
      reader.onload = function(e) {
      var contentType = fileData.type || 'plain/text';
      var metadata = {
                       'title': filename,
                       'mimeType': contentType,
                       'parents':[{"id": folderId}]
                     };

      var base64Data = btoa(reader.result);
      NProgress.inc(0.2);
      var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim;
      NProgress.inc(0.1);
      var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'fields': ['selfLink'],  //returns Unique Link to file
            'headers': {
                         'Authorization': 'Bearer '+myToken.access_token,
                         'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                       },
            'body': multipartRequestBody
          });
      NProgress.inc(0.1);
      if (!callback){
        callback = function(file) { console.log(file) };
      }
      NProgress.inc(0.2);
      request.execute(function(request){
        savedToURL = request.alternateLink; //view online link
        NProgress.inc(0.1);
        console.log(savedToURL);
        text = 'The file is saved to <a href="' + savedToURL + '" target="_blank">' + savedToURL + '</a>' ;
        $('#linkText').html(text);
        var fileID = request.ID;
        var folderID = request.parents[0].id;
        sessionStorage.setItem("savedFileID",fileID);             // Save File ID into Session Storage for Reusability Purposes
        sessionStorage.setItem("parentID", folderID);        // Save Folder ID into Session Storage for Reusability Purposes
        NProgress.inc(0.1);
        $('#saveLink').modal('toggle');
        NProgress.done();
      });
      }
    } else { //attempt to update file
        var metadata = {'mimeType': contentType,};

        var multipartRequestBody =
            delimiter +  'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter + 'Content-Type: ' + contentType + '\r\n' + '\r\n' +
            text +
            close_delim;

        if (!callback) {
          callback = function(file) {
            console.log("Update Complete ",file);
            var savedToURL = file.alternateLink;
            console.log(savedToURL);
            text = 'The file is located to <a href="' + savedToURL + '" target="_blank">' + savedToURL + '</a>' ;
            $('#linkText').html(text);
            $('#saveLink').modal('toggle');
            NProgress.done();
          };
        }

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files/'+folderId+"?fileId="+fileID+"&uploadType=multipart",
            'method': 'PUT',
            'params': {'fileId': fileID, 'uploadType': 'multipart'},
            'headers': { 'Authorization': 'Bearer '+myToken.access_token,
                         'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'},
            'body': multipartRequestBody,
        });
        request.execute(callback);
        console.log(request.alternateLink);
      }
    }
}());
