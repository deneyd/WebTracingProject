// init vue instance
var vm = new Vue({
  el: '#app',
  data: {
    roleSelected: 0,
    roleConfirmed: 0,
    normalSignUp: [],
    normalSignUpStatus: true,
    normalSignUpWarning: '',
    venueSignUp: [],
    venueSignUpStatus: true,
    venueSignUpWarning: '',
    isLoading: false,
    signupSuccess: false,
  },
});

// create fucntions for validating inputs
var checkName = function(name) {
  let regex = /^[A-Za-z\s0-9]{1,64}$/g;
  return regex.test(name);
};
var checkEmail = function(email) {
  let regex = /^[A-Za-z0-9\-._]+@[A-Za-z0-9\-_.]+\.[A-Za-z]{2,6}$/g;
  return regex.test(email);
};
var checkPassword = function(password) {
  let regex = /^.{8,}$/g;
  return regex.test(password);
};
var checkPasswordSameNormal = function(password) {
  if (password.length != 0) {
    return (vm.normalSignUp[3].data == password);
  }
  return false;
};
var checkAddress = function(address) {
  let regex = /^$|.+$/g;
  return regex.test(address);
};
var checkPhoneNumber = function(phone) {
  let regex = /^$|^((\+61)?0?[23478][0-9]{8})$/g;
  return regex.test(phone);
};
var checkBirthDate = function(date) {
  if (date.length != 0) {
    var now = new Date().getTime();
    var birth = new Date(date).getTime();
    return now > birth;
  }
  return true;
};
var checkGender = function(gender) {
  switch (gender) {
    case 'M' :
    case 'F' :
    case 'N' :
    case '' :
      return true;
    default :
      return false;
  }
};
var checkAccepted = function(accepted) {
  if (accepted) return true; else return false;
};
var checkPasswordSameVenue = function(password) {
  if (password.length != 0) {
    return (vm.venueSignUp[3].data == password);
  }
  return false;
};
var checkVenueName = function(name) {
  let regex = /^.{1,64}$/g;
  return regex.test(name);
};

var checkVenueAddress = function(address) {
  let regex = /^.+$/g;
  return regex.test(address);
};

var checkPostcode = function(postcode) {
  let regex = /^[0-9]{4}$/g;
  return regex.test(postcode);
};

var checkPhoneNotEmpty = function(phone) {
  let regex = /^((\+61)?0?[23478][0-9]{8})$/g;
  return regex.test(phone);
};

function FormField() {
  this.id = '';
  this.type = '';
  this.msg = '';
  this.width = '';
  this.name = '';
  this.check = '';
  this.required = '';
  this.data = '';
  this.status = true;
}

/* populate the form control for normal user sign up */
var numNormalFields = 10;
var normalFieldIds = ['firstName', 'lastName', 'email', 'password', 'passwordConfirm', 'address', 'phoneNumber', 'birthDate', 'gender', 'acceptTC'];
var normalFieldNames = ['First name', 'Last name', 'Email address', 'Password', 'Confirm password', 'Address', 'Phone number', 'Date of Birth', 'Gender', 'Accept Terms and Conditions'];
var normalFieldTypes = ['text', 'text', 'email', 'password', 'password', 'text', 'text', 'date', 'select', 'checkbox'];
var normalFieldMsg = ['', '', 'An email must contains an @', 'An alphanuermic password which must be at least 8 characters long', '', 'An Australian address', '', '', '', ''];
var normalFieldWidths = ['6', '6', '12', '6', '6', '12', '12', '6', '6', '12'];
var normalFieldChecks = [checkName, checkName, checkEmail, checkPassword, checkPasswordSameNormal, checkAddress, checkPhoneNumber, checkBirthDate, checkGender, checkAccepted ];
var normalFieldRequireds = [true, true, true, true, true, false, false, false, false, true];
for (let i=0; i<numNormalFields; i++) {
  var field = new FormField();
  field.id = normalFieldIds[i];
  field.type = normalFieldTypes[i];
  field.msg = normalFieldMsg[i];
  field.width = 'col-md-'+normalFieldWidths[i];
  field.name = normalFieldNames[i];
  field.check = normalFieldChecks[i];
  field.required = normalFieldRequireds[i];
  vm.normalSignUp.push(field);
}
vm.normalSignUp[8].data = 'N';

// function to subit the normal signup form
function submitNormalSignUp() {
  vm.isLoading = true;
  let form = vm.normalSignUp;
  vm.normalSignUpStatus = true;
  vm.normalSignUpWarning = '';
  for (let i=0; i<numNormalFields; i++) {
    let status = form[i].check(form[i].data);
    if (!status) {
      form[i].status = status;
      vm.normalSignUpStatus = false;
      vm.normalSignUpWarning = 'Please fill in the form correctly.';
    }
  }
  if (!vm.normalSignUpStatus) { vm.isLoading = false; vm.normalSignUp[3].data = ''; vm.normalSignUp[4].data = '';return; }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      vm.isLoading = false;
      if (this.status == 200) {
        vm.signupSuccess = true;
      } else if (this.status == 500) {
        vm.normalSignUpStatus = false;
        vm.normalSignUpWarning = 'Server error. Please try again later.';
      } else if (this.status == 400) {
        vm.normalSignUpStatus = false;
        let err = JSON.parse(this.responseText);
        err = err.error;
        if (err == 'BAD ADDRESS') {
          form[5].status = false;
          vm.normalSignUpWarning = 'Server cannot recognise the address.';
        } else if (err == 'USER ALREADY EXISTS') {
          form[2].status = false;
          vm.normalSignUpWarning = 'User with the same email already exists.';
        } else if (err == 'UNACCEPTED TC') {
          form[9].status = false;
          vm.normalSignUpWarning = 'Accept the terms and conditions to proceed';
        }
      }
    }
  };
  var packet = {};
  packet.role = 'normal';
  for (let i=0; i<numNormalFields; i++) {
    packet[normalFieldIds[i]] = form[i].data;
  }
  xhttp.open('POST', '/signup/normal', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify(packet));
  vm.normalSignUp[3].data = '';
  vm.normalSignUp[4].data = '';
}


/* populate the form control for venue user sign up */
var numVenueFields = 13;
var venueFieldIds = ['firstName', 'lastName', 'email', 'password', 'passwordConfirm', 'phoneNumber', 'venueName', 'venueAddressStreet', 'venueAddressSuburb', 'venueAddressState', 'venueAddressPostcode', 'venuePhoneNumber', 'acceptTC'];

var venueFieldNames = ['First name', 'Last name', 'Email address', 'Password', 'Confirm password', 'Phone number', 'Business name', 'Business address street', 'Business address suburb/city', 'Business address state', 'Business address postcode', 'Business contact number', 'Accept Terms and Conditions'];

var venueFieldTypes = ['text', 'text', 'email', 'password', 'password', 'text', 'text', 'text', 'text', 'select', 'text', 'text', 'checkbox'];

var venueFieldMsg = ['', '', 'An email must contains an @', 'An alphanuermic password which must be at least 8 characters long', '', '', '', '', '', '', '', 'Select a state', '', '', ''];

var venueFieldWidths = ['6', '6', '12', '6', '6', '12', '12', '12', '12', '6', '6', '12', '12'];
var venueFieldChecks = [checkName,  checkName, checkEmail, checkPassword, checkPasswordSameVenue, checkPhoneNotEmpty, checkVenueName, checkVenueAddress, checkVenueAddress, checkVenueAddress, checkPostcode, checkPhoneNotEmpty, checkAccepted];
for (let i=0; i<numVenueFields; i++) {
  var field2 = new FormField();
  field2.id = venueFieldIds[i];
  field2.type = venueFieldTypes[i];
  field2.msg = venueFieldMsg[i];
  field2.width = 'col-md-'+venueFieldWidths[i];
  field2.name = venueFieldNames[i];
  field2.check = venueFieldChecks[i];
  vm.venueSignUp.push(field2);
}
vm.venueSignUp[9].selectOptions = [
  {
    state: 'New South Wales',
    id: 'NSW'
  },
  {
    state: 'Queensland',
    id: 'QLD'
  },
  {
    state: 'Victoria',
    id: 'VIC'
  },
  {
    state: 'Tasmania',
    id: 'TAS'
  },
  {
    state: 'South Australia',
    id: 'SA'
  },
  {
    state: 'Western Australia',
    id: 'WA'
  }
];

// function to submit venue signup form
function submitVenueSignUp() {
  vm.isLoading = true;
  let form = vm.venueSignUp;
  vm.venueSignUpStatus = true;
  vm.venueSignUpWarning = '';
  for (let i=0; i<numVenueFields; i++) {
    let status = form[i].check(form[i].data);
    if (!status) {
      form[i].status = status;
      vm.venueSignUpStatus = false;
      vm.venueSignUpWarning = 'Please fill in the form correctly.';
    }
  }
  if (!vm.venueSignUpStatus) { vm.isLoading = false;  vm.venueSignUp[3].data = ''; vm.venueSignUp[4].data = ''; return; }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      vm.isLoading = false;
      if (this.status == 200) {
        vm.signupSuccess = true;
      } else if (this.status == 500) {
        vm.venueSignUpStatus = false;
        vm.venueSignUpWarning = 'Server error. Please try again later.';
      } else if (this.status == 400) {
        vm.venueSignUpStatus = false;
        let err = JSON.parse(this.responseText);
        err = err.error;
        if (err == 'BAD ADDRESS') {
          form[7].status = false;
          form[8].status = false;
          form[9].status = false;
          form[10].status = false;
          vm.venueSignUpWarning = 'Server cannot recognise the address.';
        } else if (err == 'USER ALREADY EXISTS') {
          form[2].status = false;
          vm.venueSignUpWarning = 'User with the same email already exists.';
        } else if (err == 'UNACCEPTED TC') {
          form[12].status = false;
          vm.venueSignUpWarning = 'Accept the terms and conditions to proceed';
        }
      }
    }
  };
  var packet = {};
  packet.role = 'venue';
  for (let i=0; i<numVenueFields; i++) {
    packet[venueFieldIds[i]] = form[i].data;
  }
  xhttp.open('POST', '/signup/venue', true);
  xhttp.setRequestHeader('content-type', 'application/json');
  xhttp.send(JSON.stringify(packet));
  vm.venueSignUp[3].data = '';
  vm.venueSignUp[4].data = '';
}

// go to login
function goLogin() {
  window.location.assign(window.location.protocol+'//'+window.location.hostname+':'+window.location.port);
}
