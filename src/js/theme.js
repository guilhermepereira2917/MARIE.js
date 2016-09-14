$(document).ready(function(){
      if(localStorage.getItem('theme')=='lighttheme'){
        $('#mode').attr('href','/css/styleLight.css');
      } else if (localStorage.getItem('theme') == 'darktheme') {
        $('#mode').attr('href','/css/styleDark.css');
      }
});
