// facebook login realted functions
function fbOnConnected(response) {
  let token = response.accessToken;
  let id = response.userID;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        let res = JSON.parse(this.responseText);
        if (res.status == 'REQUIRE INFO') {
          openIdModal.show();
          openIdModalHidden = false;
        } else if (res.status == 'OK') {
          window.location.href = res.path;
        }
      } else if (this.status == 500) {
          vm.formWarning.msg = 'Server error. Please try again later.';
          vm.formWarning.status = true;
      }
    }
  };
  xhttp.open('POST', '/login/facebook', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify({ token: token, id: id }));
}
function fbSignUp() {
  FB.login(function(response) {
    if (response.status === 'connected') {
      fbOnConnected(response.authResponse);
    }
  },
  {scope: 'public_profile,email'});
}

// init the fb sdk
window.fbAsyncInit = function() {
  FB.init({
    appId      : '554734292186755',
    cookie     : true,
    xfbml      : true,
    version    : 'v10.0'
  });
  FB.AppEvents.logPageView();
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      fbOnConnected(response.authResponse);
    }
  });
};
(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
