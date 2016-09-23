$(document).ready(function(){
      if(localStorage.getItem('theme')=='lighttheme'){
        $('#mode').attr('href','/css/styleLight.css');
        console.info("Switching to Light Theme");
      } else if (localStorage.getItem('theme') == 'darktheme') {
        $('#mode').attr('href','/css/styleDark.css');
        console.info("Switching to Dark Theme");
      }
      $('#displayVersion').click(function(){
        $('#currentVersion').modal('toggle');
      });
});
