// init vue
var vm = new Vue({
  el: '#app',
  data: {
    userinfoForm: [],
    userinfoFormStatus: true,
    pwdForm: [],
    pwdFormWarn: '',
    pwdFormStatus: false,
    reqChange: null,
    checkin: {
      code: '',
      msg: '',
      status: false,
    },
    history: [],
    historyStatus: false,
    historyPage: 0,
    historyDate: '',
    historyCurrPage: '1',
  },
  computed: {
    historyMin: function() {
      if (this.history.length > 0) return this.history[0].time.toISOString().split('T')[0];
    },
    historyMax: function() {
      if (this.history.length > 0) return this.history[this.history.length-1].time.toISOString().split('T')[0];
    },
    historyDisplay: function() {
      var history = this.history;
      var historyDate = this.historyDate;
      if (historyDate) {
        var table = [];
        history.forEach((record, i) => {
          var date = new Date(historyDate);
          record.marker.remove();
          if (date.toDateString() == record.time.toDateString()) {
            record.marker.addTo(map);
            table.push(record);
          }
        });
        return table;
      } else {
        return history;
      }
    },
    historyTable: function() {
      let j = 0;
      var table = [];
      var page = [];
      this.historyDisplay.forEach((history, i) => {
        j++;
        history.id = i+1;
        page.push(history);
        if (j == 5) {
          j = 0;
          table.push(page);
          page = [];
        }
      });
      if (page.length > 0) {
        table.push(page);
      }
      return table;
    }
  }
});

// init map
mapboxgl.accessToken = 'pk.eyJ1Ijoid2RjZ3BhcGkiLCJhIjoiY2tvbDZ6aTN6MDYzNzJwcHJ0cW0zbm1rbyJ9.Ri2eAzlWdPBvPtPptM50GA';
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [138.6007, -34.928], // starting position [lng, lat]
    zoom: 9.6 // starting zoom
});


var postChangeRequest = function(field) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        // success
        field.disabled = true;
        field.check();
      } else if (this.status == 400) {
        field.status = false;
        field.msg = 'Invalid '+field.name.toLowerCase();
      } else {
        field.status = false;
        field.msg = 'Server error. Please try again later.';
      }
    }
  };
  xhttp.open('POST', `/users/change/userinfo`, true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify({ field: field.id, data: field.data }));
};
vm.reqChange = postChangeRequest;

// get user information
function fetchUserInfo() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        initUserinfoForm(JSON.parse(this.responseText));
      } else {
        vm.userinfoFormStatus = false;
      }
    }
  };
  xhttp.open('GET', '/users/get/userinfo', true);
  xhttp.send();
}

// user form validation
var checkName = function() {
  let regex = /^[A-Za-z\s0-9]{1,64}$/g;
  if (!regex.test(this.data)) {
    this.status = false;
    this.msg = 'Invalid '+this.name.toLowerCase();
  } else {
    this.status = true;
  }
};
var checkPhone = function() {
  let regex = /^$|^((\+61)?0?[23478][0-9]{8})$/g;
  if (!regex.test(this.data)) {
    this.status = false;
    this.msg = 'Invalid '+this.name.toLowerCase();
  } else {
    this.status = true;
  }
};
var empty = function() {return true;};
var numFields = 7;
var fieldIds = ['firstName', 'lastName', 'email', 'address', 'phone', 'birthDate', 'gender'];
var fieldNames = ['First name', 'Last name', 'Email address', 'Home address', 'Phone number', 'Date of birth', 'Gender'];
var fieldWidths = ['6', '6', '12', '12', '12', '6', '6'];
var fieldUpdates = [true, true, false, false, true, false, false];
var fieldChecks = [checkName, checkName, empty, empty, checkPhone, empty, empty];
function initUserinfoForm(res) {
  for (let i=0; i<numFields; i++) {
    var field = {};
    field.name = fieldNames[i];
    field.canUpdate = fieldUpdates[i];
    field.width = 'col-md-'+fieldWidths[i];
    field.id = fieldIds[i];
    field.disabled = true;
    field.status = true;
    field.msg = '';
    field.check = fieldChecks[i];
    if (fieldIds[i] == 'address') {
      if (res.address === null) {
        field.data = 'No information';
      } else {
        field.data = res.address.formatted;
      }
    } else if (fieldIds[i] == 'gender') {
      switch (res.gender) {
        case 'N' :
          field.data = 'Prefer not to say';
          break;
        case 'M' :
          field.data = 'Male';
          break;
        case 'F':
          field.data = 'Female';
          break;
      }
    } else {
      if (res[fieldIds[i]]) {
        field.data = res[fieldIds[i]];
      } else {
        field.data = 'No information';
      }
    }
    vm.userinfoForm.push(field);
  }
}

// password form validation
var checkPassword = function() {
  let regex = /^$|^.{8,}$/g;
  if (regex.test(this.data)) {
    this.status = true;
  } else {
    this.status = false;
  }
};
var checkPasswordNew = function() {
  let regex = /^.{8,}$/g;
  if (regex.test(vm.pwdForm[1].data)) {
    vm.pwdForm[1].status = true;
  } else {
    vm.pwdForm[1].status = false;
  }
  if (vm.pwdForm[1].data.length != 0) {
    vm.pwdForm[2].status = (vm.pwdForm[1].data == vm.pwdForm[2].data);
  } else {
    vm.pwdForm[2].status = true;
  }
};
const numPwdFields = 3;
const pwdFieldIds = ['pwdOld', 'pwdNew', 'pwdNewConfirm'];
const pwdFieldNames = ['Old password', 'New password', 'Confirm new password'];
const pwdFieldChecks = [checkPassword, checkPasswordNew, checkPasswordNew];
const pwdFieldMsg = ['Leave this field empty if you do not have an old password', '', ''];
function initPwdForm() {
  for (let i=0; i<numPwdFields; i++) {
    var field = {};
    field.id = pwdFieldIds[i];
    field.name = pwdFieldNames[i];
    field.status = true;
    field.data = '';
    field.check = pwdFieldChecks[i];
    field.msg = pwdFieldMsg[i];
    vm.pwdForm.push(field);
  }
}
function postPwdChange() {
  vm.pwdFormWarn = '';
  var resume = true;
  var data = [];
  vm.pwdForm.forEach((item, i) => {
    item.check();
    if (item.status == false) { resume = false; }
    data.push(item.data);
    item.data = '';
  });
  if (!resume) return;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        vm.pwdFormStatus = true;
      } else if (this.status == 400) {
        vm.pwdFormWarn = 'Invalid field';
      } else if (this.status == 500) {
        vm.pwdFormWarn = 'Server error. Please try again later';
      } else if (this.status == 403) {
        vm.pwdFormWarn = 'Wrong old password';
        vm.pwdForm[0].status = false;
      }
    }
  };
  xhttp.open('POST', '/users/change/password', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify({
    passwordOld: data[0],
    passwordNew: data[1],
  }));
}

// check in request to the server
function reqCheckin() {
  if (vm.checkin.code) {
    vm.checkin.msg = '';
    var code = vm.checkin.code;
    vm.checkin.code = '';
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          vm.checkin.status = true;
          vm.checkin.msg = 'You have checked in successfully.';
        } else if (this.status == 409) {
          vm.checkin.status = false;
          vm.checkin.msg = 'You can only check in at the same venue every 10 minutes.';
        } else if (this.status == 500) {
          vm.checkin.status = false;
          vm.checkin.msg = 'Server error. Please try again later.';
        } else if (this.status == 404) {
          vm.checkin.status = false;
          vm.checkin.msg = 'Invalid checkin code.';
        }
      }
    };
    xhttp.open('GET', `/users/checkin/${code}?type=num`);
    xhttp.send();
  } else {
    vm.checkin.status = false;
    vm.checkin.msg = 'Please enter a code.';
  }
}

// check in history from server
function initHistory() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        vm.history = JSON.parse(this.responseText);
        vm.history.forEach((record, i) => {
          record.time = new Date(record.time);
          record.popup = new mapboxgl.Popup()
          .setHTML(`
            <div>
              <h5 class="text-center">${record.venue.name}</h5>
              <hr class="m-0"/>
              <p>Check in at: ${record.time.toLocaleString()}</p>
            </div>
          `);
          record.marker = new mapboxgl.Marker({
            color: '#0047AB',
          }).setLngLat(record.venue.location).setPopup(record.popup).addTo(map);
        });
      } else {
        vm.historyStatus = false;
      }
    }
  };
  xhttp.open('GET', '/users/get/checkininfo', true);
  xhttp.send();
}

// call functions in the right order
fetchUserInfo();
initPwdForm();
initHistory();
