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
      sessionStorage.setItem('oauth',oauthToken);
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
    token = sessionStorage.getItem('oauth');
    if (pickerApiLoaded && token) {
      var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.DOCS).
          setOAuthToken(token).
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
    var ID = 'nothing';
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      var doc = data[google.picker.Response.DOCUMENTS][0];
      ID = doc[google.picker.Document.ID];
    }
    console.log(ID);
    readGFile(ID);
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
             var myToken = gapi.auth.getToken();
             var myXHR   = new XMLHttpRequest();
             myXHR.open('GET', theResponseJS.downloadUrl, true );
             myXHR.setRequestHeader('Authorization', 'Bearer ' + myToken.access_token );
             myXHR.onreadystatechange = function( theProgressEvent ) {
                 if (myXHR.readyState == 4) {
     //          1=connection ok, 2=Request received, 3=running, 4=terminated
                     NProgress.inc(0.2);
                     if ( myXHR.status == 200 ) {
     //              200=OK
                         NProgress.inc(0.2);
                         code = myXHR.response;
                         sessionStorage.setItem('gdrivefile',code);
                     }
                 }
             }
             myXHR.send();
         }
     });
   }

     /**
      * getName function
      * @class gapi
      * Load a file from Drive. Fetches both the metadata & content in parallel.
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
        if(name != undefined){
          $('#nameLink').html('Hello ' + name);
          $('#nameLink').show();
          $('#login').hide();
        }
      });
    });
   }
}());
