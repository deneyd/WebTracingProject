// init the vue instance
var vm = new Vue({
  el: '#app',
  data: {
    email: {
      data: '',
      warning: {
        status: false,
        msg: '',
      }
    },
    password: {
      data: '',
      warning: {
        status: false,
        msg: '',
      }
    },
    isRemember: '',
    formWarning: {
      status: false,
      msg: '',
    },
    role: '0',
    openIdModalHidden: true,
  }
});

// create checks for email and password
var checkEmail = function() {
  let regex = /^[A-Za-z0-9\-._]+@[A-Za-z0-9\-_.]+\.[A-Za-z]{2,6}$/g;
  if (!regex.test(vm.email.data)) {
    vm.email.warning.status = true;
    vm.email.warning.msg = 'Please enter a valid email';
    return false;
  }
  vm.email.warning.msg = '';
  vm.email.warning.status = false;
  return true;
};
var checkPassword = function() {
  let regex = /^.{8,}$/g;
  if (!regex.test(vm.password.data)) {
    vm.password.warning.status = true;
    vm.password.warning.msg = 'Please enter a valid password';
    return false;
  }
  vm.password.warning.msg = '';
  vm.password.warning.status = false;
  return true;
};
vm.password.check = checkPassword;
vm.email.check = checkEmail;

// creates a modal to prompt the user's role when signing using openid
var openIdModal = new bootstrap.Modal(document.getElementById('openIdModal'), {
  backdrop: 'static',
  keyboard: false,
});
function confirmOpenId() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        let res = JSON.parse(this.responseText);
        if (res.status == 'OK') {
          window.location.href = res.path;
        }
      } else if (this.status == 500) {
          vm.formWarning.msg = 'Server error. Please try again later.';
          vm.formWarning.status = true;
      }
    }
  };
  xhttp.open('POST', '/signup/openid', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify({ user_type: vm.role }));
  openIdModalHidden = true;
  openIdModal.hide();
}
function cancelOpenId() {
  if (gapi.auth2) { gapi.auth2.getAuthInstance().disconnect(); }
  // place for fb
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      FB.logout();
    }
  });
  var xhttp = new XMLHttpRequest();
  xhttp.open('GET', '/signup/openid/cancel', true);
  xhttp.send();
  openIdModal.hide();
  openIdModalHidden = true;
}

// login function
function login() {
  vm.formWarning.msg = '';
  vm.formWarning.status = false;
  let flag1 = checkPassword();
  let flag2 = checkEmail();
  if (flag1 && flag2) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        vm.password.data = '';
        if (this.status == 200) {
          window.location.assign(window.location.protocol+'//'+window.location.hostname+':'+window.location.port+'/users');
        } else if (this.status == 404) {
          vm.formWarning.msg = 'Wrong email/password. Please try again.';
          vm.formWarning.status = true;
          vm.email.warning.status = true;
          vm.password.warning.status = true;
        } else if (this.status == 500) {
          vm.formWarning.msg = 'Server error. Please try again later.';
          vm.formWarning.status = true;
        }
      }
    };
    xhttp.open('POST', '/login', true);
    xhttp.setRequestHeader('content-type', 'application/json');
    xhttp.send(JSON.stringify({ email: vm.email.data, password: vm.password.data, isRemember: vm.isRemember }));
  }
}

// change page to signup
function goSignup() {
  window.location.assign(window.location.protocol+'//'+window.location.hostname+':'+window.location.port+'/signup');
}
