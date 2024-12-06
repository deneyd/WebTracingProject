// provides function for google signin
function gOnFailure() {
  vm.formWarning.msg = 'Error. Please try again later.';
  vm.formWarning.status = true;
}
function gOnSuccess(googleUser) {
  vm.formWarning.msg = '';
  vm.formWarning.status = false;
  var idToken = googleUser.getAuthResponse().id_token;
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
  xhttp.open('POST', '/login/google', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify({ token: idToken }));
}
function gRenderSignup() {
  gapi.signin2.render('g-signin', {
    'scope': 'profile email',
    'width': 300,
    'height': 42,
    'longtitle': true,
    'theme': 'light',
    'onsuccess': gOnSuccess,
    'onfailure': gOnFailure
  });
}
