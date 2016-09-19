// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyCpcTAAL4Yf9WoKVD_UE6f-_LwE6bDau-M';

// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
var clientId = "357044840397-qs7nu7a17ohiih95v334l6k209qh5oah.apps.googleusercontent.com"

// Scope to use to access user's photos.
var scope = ['https://www.googleapis.com/auth/drive'];

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
  //"https://docs.google.com/uc?id=0Bx2qC5WxhxsacWlobzdLUHVxODg&export=download"
  var downURL = "https://docs.google.com/uc?id=" + ID + "&export=download"
  readfile(downURL);
  console.log(downURL)
}

//readCode() does a GET request for the the file based on the URL
function readfile(URL){
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if(xhr.readyState === 4){
            if(xhr.status == 200){
                loadfile(xhr.responseText, xhr);
                console.log('File Sucessfully Loaded');
            }
            else if(xhr.status == 404){
                $('#warn-missing-file').show();
            }
        }
    };
    xhr.open('GET',URL,true);
    xhr.send();
}

//loadContents() works in conjunction with readCode(), if the server responds with a Code 200
function loadfile(responseText){
    programCodeMirror.setValue(responseText);
}
