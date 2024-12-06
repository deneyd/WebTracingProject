var vm = new Vue({
  el: '#app',
  data: {
    qrCode: {
      width: '',
      height: '',
      url: '',
    },
    venue: {
      name: 'Not available',
      owner: 'Not available',
      contact: 'Not available',
      code: '',
    }
  }
});

vm.qrCode.width = '300';
vm.qrCode.height = '300';

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if ((this.status == 200) && (this.responseState)) {
    const res = JSON.parse(this.responseText);
    vm.venue.code = res.venue.checkinCode;
    vm.venue.owner = res.owner.firstName + ' ' + res.owner.lastName;
    vm.venue.name = res.venue.name;
    vm.qrCode.url = 'https://chart.googleapis.com/chart?cht=qr&chs='+vm.qrCode.width+'x'+vm.qrCode.height+'&chl='+encodeURI(${location.protocol}+'//'+location.hostname+':'+location.port+'/users/checkin?code='+vm.venue.code)+'&chld=M|1';
  }
}
xhttp.open('GET', '/venues/'+vid+'/info/basic', true);
xhttp.send();
