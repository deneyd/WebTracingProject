// instaniate vue instance
var vm = new Vue({
  el: '#app',
  data: {
    warning: '',
    success: false,
  }
});

// function to confirm the check in
function confirm() {
  vm.warning = '';
  const code = Cookies.get('continue_qr_checkin');
  if (code) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          Cookies.remove('continue_qr_checkin', { path: '/users', domain: location.hostname });
          vm.success = true;
        } else if (this.status == 409) {
          vm.warning = 'You have alredy checked in this venue within the last ten minutes.';
        } else {
          vm.warning = 'Something wrong occurs. Please try again later.';
        }
      }
    };
    xhttp.open('GET', `/users/checkin/${code}?type=qr`);
    xhttp.send();
  } else {
    vm.warning = 'Could not check in. Please scan the qr code again.';
  }
}

// function to cancel the check in
function cancel() {
  Cookies.remove('continue_qr_checkin', { path: '/users', domain: location.hostname });
  window.location.replace(`${location.protocol}//${location.hostname}:${location.port}/users`);
}
