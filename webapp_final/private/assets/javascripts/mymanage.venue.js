// init vm
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
    venueinfo: {
      ids: [],
      form: [],
      status: true,
      warnMsg: [],
      change: function(field, id) {
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
          xhttp.open('POST', `/venues/${id}/update`, true);
          xhttp.setRequestHeader('content-type', 'application/json');
          xhttp.send(JSON.stringify({ field: field.id, data: field.data }));
        }
      },
      remove: null,
    },
    venueadd: {
      form: [],
      show: false,
      submit: null,
      warnMsg: '',
    },
    clean: null,
    venuehistory: {
      tables: [],
      curr: '-1',
      status: true,
    }
  },
  computed: {
    currVenueHistory: function() {
      let ind = this.venuehistory.curr;
      if (ind != '-1') {
        return this.venuehistory.tables[ind].rows;
      } else {
        return [];
      }
    },
  }
});

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

// assign a clean up function for data
var cleanup = function(form) {
  form.forEach((item, i) => {
    item.data = '';
  });
};
vm.clean = cleanup;

// assign a function to remove a venue
var removeVenue = function(id, index) {
  vm.venueinfo.warnMsg[index] = '';
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        location.reload();
      } else {
        vm.venueinfo.warnMsg[index] = 'Something went wrong. Please try again later.';
      }
    }
  };
  xhttp.open('GET', `/venues/${id}/remove`, true);
  xhttp.send();
};
vm.venueinfo.remove = removeVenue;



// populate the fields of user info section
const userinfoField = {
  num: 4,
  names: ['First name', 'Last name', 'Email address', 'Phone number'],
  widths: ['6', '6', '12', '12'],
  canUpdates: [true, true, false, true],
  ids: ['firstName', 'lastName', 'email', 'phone'],
  regexs: [/^[A-Za-z\s0-9]{1,64}$/, /^[A-Za-z\\s0-9]{1,64}$/, /$/, /^$|^((\\+61)?0?[23478][0-9]{8})$/ ],
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

// function to request check in history for a venue
function getVenueHistory(id) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        vm.venuehistory.tables.push({ id: id, rows: JSON.parse(this.responseText)});
      } else {
        vm.venuehistory.status = false;
      }
    }
  };
  xhttp.open('GET', `/venues/${id}/history`, true);
  xhttp.send();
}

// populate the venue info section
const venueinfoField = {
  num: 6,
  names: ['ID', 'Name', 'Check in code', 'Address', 'Phone number', 'Description'],
  ids: ['id', 'name', 'checkinCode', 'address', 'phone', 'description'],
  canUpdates: [false, true, false, false, true, true],
  regexs: ['', /^[A-Za-z\s0-9]{1,64}$/, '', '', /^$|^((\\+61)?0?[23478][0-9]{8})$/, /^.{0,255}$/],
};
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4) {
    if (this.status == 200) {
      var results = JSON.parse(this.responseText);
      results.forEach((res, i) => {
        // get the check in history for each id
        getVenueHistory(res.id);
        vm.venueinfo.warnMsg.push('');
        vm.venueinfo.ids.push(res.id);
        var form = [];
        for (let j=0; j<venueinfoField.num; j++) {
          var field = {
            name: venueinfoField.names[j],
            id: venueinfoField.ids[j],
            canUpdate: venueinfoField.canUpdates[j],
            regex: venueinfoField.regexs[j],
            data: res[venueinfoField.ids[j]],
            status: true,
            warnMsg: '',
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
          form.push(field);
        }
        vm.venueinfo.form.push(form);
      });
    } else {
      vm.venueinfo.status;
    }
  }
};
xhttp.open('GET', '/venues/get/owned', true);
xhttp.send();


// populate venue adding section
const venueaddField = {
  num: 7,
  names: ['Business name', 'Business address street', 'Business address suburb/city', 'Business address state', 'Business address postcode', 'Business contact number', 'Description'],
  ids: ['name', 'addressStreet', 'addressSuburb', 'addressState', 'addressPostcode', 'phone', 'description'],
  widths: ['12', '12', '12', '6', '6', '12', '12'],
  types: ['text', 'text', 'text', 'select', 'text', 'text', 'textarea'],
  regexs: [/^.{1,64}$/, /^.+$/, /^.+$/, /^(SA)|(WA)|(QLD)|(VIC)|(NSW)|(TAS)$/, /^[0-9]{4}$/, /^((\+61)?0?[23478][0-9]{8})$/, /^.{0,255}$/],
  isRequireds: [true, true, true, true, true, true, false],
};
for (let i=0; i<venueaddField.num; i++) {
  let field = {
    name: venueaddField.names[i],
    id: venueaddField.ids[i],
    width: venueaddField.widths[i],
    type: venueaddField.types[i],
    regex: venueaddField.regexs[i],
    data: '',
    warnMsg: '',
    status: true,
    isRequired: venueaddField.isRequireds[i],
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
  vm.venueadd.form.push(field);
}
vm.venueadd.form[3].options = [
  { state: 'New South Wales', id: 'NSW' },
  { state: 'Queensland', id: 'QLD' },
  { state: 'Victoria', id: 'VIC' },
  { state: 'Tasmania', id: 'TAS' },
  { state: 'South Australia', id: 'SA' },
  { state: 'Western Australia', id: 'WA' }
];

// assing a function to submit a new veneu
var submitVenueadd = function() {
  var resume = true;
  var packet = {};
  vm.venueadd.form.forEach((item, i) => {
    item.check();
    if (item.status == false) resume = false;
    packet[item.id] = item.data;
  });
  if (resume) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          vm.clean(vm.venueadd.form);
          location.reload();
        } else if (this.status == 400) {
          let res = JSON.parse(this.responseText);
          if (res.error == 'BAD ADDRESS') {
            vm.venueadd.warnMsg = 'Server cannot recognise the address';
          } else {
            vm.venueadd.warnMsg = 'Invalid fields.';
          }
        } else if (this.status == 500) {
          vm.venueadd.warnMsg = 'Server error. Please try again later.';
        }
      }
    };
    xhttp.open('POST', '/venues/register', true);
    xhttp.setRequestHeader('content-type', 'application/json');
    console.log(packet);
    xhttp.send(JSON.stringify(packet));
  }
};
vm.venueadd.submit = submitVenueadd;
