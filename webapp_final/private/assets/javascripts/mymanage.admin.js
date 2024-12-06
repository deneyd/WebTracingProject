var vm = new Vue({
  el: '#app',
  data: {
    userinfo: {
      form: [],
      status: true,
      change: function(field) {
        if (field.status) {
          var xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
              if (this.status == 200) {
                // success
                field.disabled = true;
                field.check();
              } else if (this.status == 400) {
                field.status = false;
                field.warnMsg = 'Invalid '+field.name.toLowerCase();
              } else {
                field.status = false;
                field.warnMsg = 'Server error. Please try again later.';
              }
            }
          };
          xhttp.open('POST', `/users/change/userinfo`, true);
          xhttp.setRequestHeader('content-type', 'application/json');
          xhttp.send(JSON.stringify({ field: field.id, data: field.data }));
        }
      },
    },
    pwd: {
      form: [],
      status: true,
      warnMsg: '',
      change: null,
    },
    manage: {
      usersinfo: [],
      venuesinfo: [],
    },
    checkin: {
      date: '',
      submit: null,
      res: [],
      status: true,
    },
    adminadd: {
      form: [],
      submit: null,
      warnMsh: '',
    },
    clean: null,
  }
});

// assign a clean up function for data
var cleanup = function(form) {
  form.forEach((item, i) => {
    item.data = '';
  });
};
vm.clean = cleanup;

// create a function to submit checkin results
var checkinSubmit = function() {
  if (vm.checkin.date) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          vm.checkin.status = true;
          vm.checkin.res = JSON.parse(this.responseText);
        } else {
          vm.checkin.status = false;
        }
      }
    };
    xhttp.open('GET', `/admins/get/history?date=${encodeURIComponent(vm.checkin.date)}`);
    xhttp.send();
  } else {
    vm.checkin.status = false;
  }
};
vm.checkin.submit = checkinSubmit;

// populate the fields of user info section
const userinfoField = {
  num: 4,
  names: ['First name', 'Last name', 'Email address', 'Phone number'],
  widths: ['6', '6', '12', '12'],
  canUpdates: [true, true, false, true],
  ids: ['firstName', 'lastName', 'email', 'phone'],
  regexs: [/^[A-Za-z\s0-9]{1,64}$/, /^[A-Za-z\\s0-9]{1,64}$/, /$/, /^$|^((\\+61)?0?[23478][0-9]{8})$/],
};
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4) {
    if (this.status == 200) {
      let results = JSON.parse(this.responseText);
      for (let i=0; i<userinfoField.num; i++) {
        var field = {
          name: userinfoField.names[i],
          width: 'col-md-'+userinfoField.widths[i],
          canUpdate: userinfoField.canUpdates[i],
          id: userinfoField.ids[i],
          regex: userinfoField.regexs[i],
          warnMsg: '',
          status: true,
          disabled: true,
          check: function () {
            let regex = new RegExp(this.regex, 'g');
            if (!regex.test(this.data)) {
              this.status = false;
              this.warnMsg = 'Invalid '+this.name.toLowerCase();
            } else {
              this.status = true;
            }
          },
        };
        if (results[userinfoField.ids[i]]) {
          field.data = results[userinfoField.ids[i]];
        } else {
          field.data = 'No information';
        }
        vm.userinfo.form.push(field);
      }
    } else {
      vm.userinfo.status = false;
    }
  }
};
xhttp.open('GET', '/users/get/userinfo', true);
xhttp.send();

// function to checks for validity of password
var oldPwdCheck = function() {
  let regex = /^$|^.{8,}$/g;
  if (regex.test(this.data)) {
    this.status = true;
  } else {
    this.status = false;
  }
};
var newPwdCheck = function() {
  let regex = /^.{8,}$/g;
  let pwd = vm.pwd.form[1];
  let confirm = vm.pwd.form[2];
  if (regex.test(pwd.data)) {
    pwd.status = true;
  } else {
    pwd.status = false;
  }
  if (pwd.data.length != 0) {
    confirm.status = (pwd.data == confirm.data);
  } else {
    confirm.status = true;
  }
};

// assign a function to psot the new password to server
var pwdChange = function() {
  vm.pwd.warnMsg = '';
  var resume = true;
  var data = [];
  vm.pwd.form.forEach((item, i) => {
    item.check();
    if (item.status == false) { resume = false; }
    data.push(item.data);
  });
  vm.pwd.form.forEach((item, i) => {
    item.data = '';
  });
  if (resume) {
    vm.pwd.form[1].status = true;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          vm.pwd.status = false;
        } else if (this.status == 400) {
          vm.pwd.warnMsg = 'Invalid field';
        } else if (this.status == 500) {
          vm.pwd.warnMsg = 'Server error. Please try again later';
        } else if (this.status == 403) {
          vm.pwd.form[0].status = false;
          vm.pwd.warnMsg = 'Wrong old password';
        }
      }
    };
    xhttp.open('POST', `/change/password`, true);
    xhttp.setRequestHeader('content-type', 'application/json');
    xhttp.send(JSON.stringify({
      passwordOld: data[0],
      passwordNew: data[1],
    }));
  }
};
vm.pwd.change = pwdChange;

// populate the reset password section
const pwdField = {
  num: 3,
  names: ['Old password', 'New password', 'Confirm new password'],
  ids: ['passwordOld', 'passwordNew', 'passwordNewConfirm'],
  checks: [oldPwdCheck, newPwdCheck, newPwdCheck],
  msgs: ['Leave this field empty if you do not have an old password', '', ''],
};
for (let i=0; i<pwdField.num; i++) {
  var field = {
    id: pwdField.ids[i],
    name: pwdField.names[i],
    check: pwdField.checks[i],
    status: true,
    warnMsg: '',
    data: '',
    msg: pwdField.msgs[i],
  };
  vm.pwd.form.push(field);
}

// get user information from server
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if ((this.readyState == 4) && (this.status == 200)) {
    vm.manage.usersinfo = JSON.parse(this.responseText);
  }
};
xhttp.open('GET', '/admins/get/usersinfo', true);
xhttp.send();

// get venue information form server
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if ((this.readyState == 4) && (this.status == 200)) {
    vm.manage.venuesinfo = JSON.parse(this.responseText);
  }
};
xhttp.open('GET', '/admins/get/venuesinfo', true);
xhttp.send();


// create functions for checking
var regexCheck = function() {
  let regex = new RegExp(this.regex, 'g');
  if (!regex.test(this.data)) {
    this.status = false;
    this.warnMsg = 'Invalid '+this.name.toLowerCase();
  } else {
    this.status = true;
  }
};
var passwordCheck = function() {
  let regex = /^.{8,}$/g;
  let pwd = vm.adminadd.form[3];
  let confirm = vm.adminadd.form[4];
  if (regex.test(pwd.data)) {
    pwd.status = true;
  } else {
    pwd.status = false;
  }
  if (pwd.data.length != 0) {
    confirm.status = (pwd.data == confirm.data);
  } else {
    confirm.status = true;
  }
};

// create function submit new admin
var submitAdmin = function() {
  var resume = true;
  var packet = {};
  vm.adminadd.form.forEach((item, i) => {
    item.check();
    if (item.status == false) resume = false;
    packet[item.id] = item.data;
  });
  if (resume) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          vm.clean(vm.adminadd.form);
          location.reload();
          vm.adminadd.warnMsg = '';
        } else if (this.status == 403) {
          vm.adminadd.warnMsg = 'Email already exists.';
        } else if (this.status == 500) {
          vm.adminadd.warnMsg = 'Server error. Please try again later.';
        }
      }
    };
    xhttp.open('POST', '/admins/signup', true);
    xhttp.setRequestHeader('content-type', 'application/json');
    console.log(packet);
    xhttp.send(JSON.stringify(packet));
  }
};
vm.adminadd.submit = submitAdmin;


// populate admin adding section
const adminaddField = {
  num: 6,
  names: ['First name', 'Last name', 'Email address', 'Password', 'Password Confirm', 'Phone number'],
  ids: ['firstName', 'lastName', 'email', 'password', 'passwordConfirm', 'phone'],
  widths: ['6', '6', '12', '6', '6', '12', '12'],
  regexs: [/^[A-Za-z\s0-9]{1,64}$/, /^[A-Za-z\s0-9]{1,64}$/, /^[A-Za-z0-9\-._]+@[A-Za-z0-9\-_.]+\.[A-Za-z]{2,6}$/, '', '', /^((\+61)?0?[23478][0-9]{8})$/],
  checks: [regexCheck, regexCheck, regexCheck, passwordCheck, passwordCheck, regexCheck],
  types: ['text', 'text', 'text', 'password', 'password', 'text'],
};
for (let i=0; i<adminaddField.num; i++) {
  let field = {
    name: adminaddField.names[i],
    id: adminaddField.ids[i],
    width: 'col-md-'+adminaddField.widths[i],
    regex: adminaddField.regexs[i],
    type: adminaddField.types[i],
    data: '',
    warnMsg: '',
    status: true,
    check: adminaddField.checks[i],
  };
  vm.adminadd.form.push(field);
}
