// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyCpcTAAL4Yf9WoKVD_UE6f-_LwE6bDau-M';

// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
var clientId = "357044840397-qs7nu7a17ohiih95v334l6k209qh5oah.apps.googleusercontent.com"

// Scope to use to access user's photos.
var scope = ['https://www.googleapis.com/auth/photos'];

var pickerApiLoaded = false;
var oauthToken;

// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad() {
  gapi.load('auth', {'callback': onAuthApiLoad});
  gapi.load('picker', {'callback': onPickerApiLoad});
}

function onAuthApiLoad() {
  window.gapi.auth.authorize(
      {
        'client_id': clientId,
        'scope': scope,
        'immediate': false
      },
      handleAuthResult);
}

function onPickerApiLoad() {
  pickerApiLoaded = true;
  createPicker();
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    oauthToken = authResult.access_token;
    createPicker();
  }
}

// Create and render a Picker object for picking user Photos.
function createPicker() {
  if (pickerApiLoaded && oauthToken) {
    var picker = new google.picker.PickerBuilder().
        addView(google.picker.ViewId.DOCS).
        setOAuthToken(oauthToken).
        setDeveloperKey(developerKey).
        setCallback(pickerCallback).
        build();
    picker.setVisible(true);
  }
}

// A simple callback implementation.
function pickerCallback(data) {
  var ID = 'nothing';
  if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
    var doc = data[google.picker.Response.DOCUMENTS][0];
    ID = doc[google.picker.Document.ID];
  }
  console.log(ID);
  var request = downloadURL(ID);
  console.log(request)
}

/*
* function which does GET https://www.googleapis.com/drive/v3/files/fileId
*/
function downloadURL(fileID){
  var baseURL = "https://www.googleapis.com/drive/v3/files/"
  var fileAddress = baseURL + fileID
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
      if(xhr.readyState === 4){
          if(xhr.status == 200){
              console.log(xhr.responseText, xhr);
          }
      }
  };
  xhr.open('GET',fileAddress,true);
  xhr.send();

}
