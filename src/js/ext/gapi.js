(function() {
  // The Browser API key obtained from the Google Developers Console.
  var developerKey = 'AIzaSyCpcTAAL4Yf9WoKVD_UE6f-_LwE6bDau-M';

  // The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
  var clientId = "357044840397-qs7nu7a17ohiih95v334l6k209qh5oah.apps.googleusercontent.com"

  // Scope to use to access user's photos.
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
   * @class gapi
   *
   * @return Returns Picker and Handles a callback once file is selected
   */
  createPicker  = function() {
    if (pickerApiLoaded && oauthToken) {
      var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.DOCS).
          setOAuthToken(oauthToken).
          setDeveloperKey(developerKey).
          setCallback(pickerCallback,oauthToken).
          build();

      picker.setVisible(true);
    }
  }

  /**
   * Google Picker Handler.
   * @class gapi
   *
   * @see createPicker
   * @param  {string} data       Passes authentication
   */
  pickerCallback  = function(data,accessToken) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      var doc = data[google.picker.Response.DOCUMENTS][0];
      ID = doc[google.picker.Document.ID];                    // Get FileID
      var folderID = doc[google.picker.Document.PARENT_ID]    // Folder ID Is the file's Parent ID
    }
    if (ID !== ""){
      console.log(ID);
      readGFile(ID);
      console.log('The file is located: ' + folderID);
      sessionStorage.setItem("savedFileID",ID);             // Save File ID into Session Storage for Reusability Purposes
      sessionStorage.setItem("parentID", folderID);        // Save Folder ID into Session Storage for Reusability Purposes
    }
  }

  /**
   * readGFile function
   * @class gapi
   * Load a file from Drive. Fetches both the metadata & content in parallel.
   *
   * @param {String} fileID ID of the file to load
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
      name = resp.displayName
      console.log('Retrieved profile for:' + name);
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

  /**
   * saveToGDrive function
   * @class gapi
   * Load a file from Drive. Fetches both the metadata & content in parallel.
   *
   * @param {string} fileID     Unique File ID from Google Drive which identifies it
   * @param {string} folderId   Unique Folder ID of File ID
   * @param {string} text       text to be updated
   */
  saveToGDrive = function(fileID,folderId,text, callback){
    //NProgress starts with 10% when entering this function

    //GAPI POST/PUT REQUST CONSTs
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";


    var contentType = "plain/text";
    var myToken = gapi.auth.getToken();

    var filename = $("#GFileName").val();
    var fileType = $('#saveGFileMode option:selected').val();

    filename = filename + "." + fileType;
    NProgress.inc(0.1);

    if (fileID === "" || fileID === null) {
      var reader = new FileReader();
      var fileData = new Blob([text], {type:'plain/text'});
      reader.readAsBinaryString(fileData);
      reader.onload = function(e) {
      var contentType = fileData.type || 'plain/text';
      var metadata = {
                       'title': filename,
                       'mimeType': contentType
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
            'fields': 'selfLink',
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
      console.log(request.id);
      request.execute(function(request){
        savedToURL = request.alternateLink; //view online link
        NProgress.inc(0.1);
        console.log(savedToURL);
        text = 'The file is saved to <a href="' + savedToURL + '" target="_blank">' + savedToURL + '</a>' ;
        $('#linkText').html(text);
        NProgress.inc(0.1);
        $('#saveLink').modal('toggle');
        NProgress.done();
      });
      }
    } else {
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
            savedToURL = request.webViewLink;
            console.log(savedToURL);
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
      }
    }

}());
