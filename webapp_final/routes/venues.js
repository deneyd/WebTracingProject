var express = require('express');
var router = express.Router();
var axios = require('axios');
const { body, validationResult, param } = require('express-validator');
const { customAlphabet } = require('nanoid');

// google related stuff
const googleAPIToken = 'AIzaSyBUIcMQ_vBmtdfma-m9H9yT8PyRP6UZ29c';

// setting up the check in code generator
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const checkinid = customAlphabet(alphabet, 8);

// queries
const getOwnedVenueSql = `
SELECT * FROM venues where owner = ?;
`;
const getVenueCheckinCodeSql = `
SELECT venue_id AS code FROM venues where venue_id = ?;
`;
const getBasicVenueInfoSql = `
SELECT u.first_name AS firstName, u.last_name AS lastName, v.name As venueName, v.description, v.checkin_code AS code, v.phone_number AS phone FROM venues AS v
INNER JOIN users AS u ON u.user_id = v.owner
WHERE venue_id = ?;
`;
const getVenueInfoSql = `
SELECT v.venue_id AS id, v.name, v.description, v.checkin_code AS checkinCode, CONCAT_WS(", ", a.street, a.suburb, CONCAT_WS(" ", a.state, a.postcode)) AS address, v.phone_number AS phone
FROM venues AS v
INNER JOIN addresses AS a ON v.address = a.address_id
WHERE v.owner = ?;
`;
const insertVenueSql = `
BEGIN;
INSERT INTO addresses (street, suburb, state, postcode, latitude, longitude)
VALUES (?, ?, ?, ?, ?, ?);
SET @aid=LAST_INSERT_ID();
INSERT INTO venues (owner, name, description, checkin_code, address, phone_number)
VALUES (?, ?, ?, ?, @aid, ?);
COMMIT;
`;
const removeVenueSql = `
DELETE v, a
FROM venues AS v
INNER JOIN addresses AS a ON v.address = a.address_id
WHERE venue_id = ?;
`;
const getVenueHistorySql = `
SELECT c.checkin_id AS id, u.last_name as userLastName, c.checkin_datetime AS time, c.method FROM checkins As c
INNER JOIN users AS u ON c.user = u.user_id
WHERE c.venue = ?;
`;



// a guard to check if the logged in user is venue user
router.use(function(req, res, next) {
  if (req.session.user) {
    if ((req.session.user.type === 'venue') || (req.session.user.type === 'admin')) {
      next();
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

// get all the information of owned venues
router.get(
  '/get/owned',
  async function(req, res, next) {
  try {
    const [rows, fields] = await req.pool.execute(getVenueInfoSql, [req.session.user.id]);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.post(
  '/register',
  body('name').notEmpty().isLength({ max: 64 }),
  body('addressStreet').notEmpty(),
  body('addressSuburb').notEmpty(),
  body('addressState').matches(/^(SA)|(WA)|(QLD)||(VIC)||(NSW)||(TAS)$/, 'g'),
  body('addressPostcode').matches(/^[0-9]{4}$/, 'g'),
  body('phone').exists().matches(/^((\+61)?0?[23478][0-9]{8})$/, 'g'),
  body('description').exists().matches(/^.{0,255}$/,'g'),
  async function(req, res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        let venueAddress = req.body.addressStreet+'+'+req.body.addressSuburb+'+'+ req.body.addressState+'+'+req.body.addressPostcode;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=${googleAPIToken}&address=${encodeURI(venueAddress)}&region=au`);
        if (response.status === 200) {
          const data = response.data;
          if (data.status == 'OK') {
            const results = data.results[0];
            let codedAddress = [];
            codedAddress.push(results.address_components[0].long_name+' '+results.address_components[1].long_name);
            codedAddress.push(results.address_components[2].long_name);
            codedAddress.push(results.address_components[4].long_name);
            codedAddress.push(results.address_components[6].long_name);
            codedAddress.push(results.geometry.location.lat);
            codedAddress.push(results.geometry.location.lng);
            let checkinCode = checkinid();
            let queryParams = [];
            queryParams = queryParams.concat(codedAddress, [req.session.user.id, req.body.name, req.body.description, checkinCode, req.body.phone]);
            const [rows, fields] = await req.pool.query(insertVenueSql, queryParams);
            res.end();
          } else if (data.status == 'ZERO_RESULTS') {
            res.status(400).json({ error: 'BAD ADDRESS' });
          }
        } else {
          res.sendStatus(500);
        }
      } else {
        res.status(400).json({ error: 'INVALID FIELDS' });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);


// a guard to check if the user owns the venue before doing venue specific actions
router.use(
  '/:id/*',
  param('id').isNumeric(),
  async function(req, res, next) {
    if (validationResult(req).isEmpty()) {
      try {
        const [rows, fields] = await req.pool.execute(getOwnedVenueSql, [req.session.user.id]);
        const found = rows.find(element => element.venue_id == req.params.id);
        if (found) {
          next();
        } else {
          res.sendStatus(403);
        }
      } catch (err) {
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(400);
    }
});


// get a qr page of a venue
router.get('/:id/qrpage', function(req, res, next) {
  res.set('content-type', 'text/html');
  res.send(`
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="utf-8">
      <title>QR Code Page</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-wEmeIV1mKuiNpC+IOBjI7aAzPcEZeedi5yW5f2yOq55WWLwNGmvvx4Um1vskeMj0" crossorigin="anonymous">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-p34f1UUtsS3wqzfto5wAAmdvj+osOnFyQFpp4Ua3gs/ZVWx6oOypYoCJhGGScy+8" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.js"></script>
      <script>const vid=${req.params.id}</script>
      <style>
        body { height: 297mm; width: 210mm; }
        .large { font-size: 15mm; }
        .medium { font-size: 10mm; }
        .small { font-size: 5mm; }
        .main { margin-top: -50px; }
      </style>
    </head>
    <body>
      <div id="app" class="h-100 d-flex flex-column justify-content-between bg-light bg-gradient">
        <header class="bg-primary bg-gradient rounded-bottom">
          <h1 class="py-3 text-center text-white large">CovidSAFE</h1>
          <hr class="m-0"/>
        </header>
        <main class="mx-auto main">
          <h2 class="text-center my-5 medium">Scan the QR code to check in</h2>
            <img class="mx-auto my-5 d-block border border-3 shadow rounded-3 shadow-sm" v-bind:src="qrCode.url" alt="A qr code for check in" v-bind:width="qrCode.width" v-bind:height=qrCode.height>
          <h2 class="medium text-center my-5">Venue Information</h2>
          <dl class="row" v-for="(value, name) in venue">
            <dt class="col small text-end">Venue {{ name }}:</dt>
            <dd class="col small text-start"><i>{{ value }}</i></dd>
          </dl>
        </main>
        <footer class="bg-primary bg-gradient rounded-top">
          <hr class="m-0"/>
          <p class="text-center text-white py-3 m-0">&copy CovidSAFE 2021</p>
        </footer>
      </div>
      <script>
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
              'check in code': 'Not available',
            }
          }
        });
        vm.qrCode.width = '300';
        vm.qrCode.height = '300';
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if ((this.readyState == 4) && (this.status == 200)) {
            const res = JSON.parse(this.responseText);
            vm.venue['check in code'] = res.venue.checkinCode;
            vm.venue.owner = res.owner.firstName + ' ' + res.owner.lastName;
            vm.venue.name = res.venue.name;
            if (res.venue.contact) vm.venue.contact = res.venue.contact;
            vm.qrCode.url = 'https://chart.googleapis.com/chart?cht=qr&chs='+vm.qrCode.width+'x'+vm.qrCode.height+'&chl='+encodeURI(location.protocol+'//'+location.hostname+':'+location.port+'/qr/'+vm.venue['check in code'])+'&chld=M|1';
          }
        }
        xhttp.open('GET', '/venues/'+vid+'/info/basic', true);
        xhttp.send();
      </script>
    </body>
  </html>
  `);
});


// get basic info for a venue
router.get('/:id/info/basic', async function(req, res, next) {
  try {
    const [rows, fields] = await req.pool.execute(getBasicVenueInfoSql, [req.params.id]);
    res.json({
      venue: { name: rows[0].venueName, description: rows[0].description, contact: rows[0].phone, checkinCode: rows[0].code }, owner: { firstName: rows[0].firstName, lastName: rows[0].lastName }
    });
  } catch (err) {
    res.sendStatus(500);
  }
});


// a dict to transform json notation to sql fields
const venuesLookup = {
  name: 'name',
  phone: 'phone_number',
  description: 'description',
};
// update the field of a specifc venue
router.post(
  '/:id/update',
  body('field').exists().matches(/(^name$)|(^phone$)|(^description$)/, 'g'),
  body('data').exists(),
  async function(req, res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        let regex;
        switch (req.body.field) {
          case 'name': regex = /^[A-Za-z\s0-9]{1,64}$/g; break;
          case 'phone': regex = /^$|^((\\+61)?0?[23478][0-9]{8})$/g; break;
          case 'description': regex = /^.{0,255}$/g; break;
        }
        if (regex.test(req.body.data)) {
          const updateVenueSql = `
          UPDATE venues SET ${venuesLookup[req.body.field]} = ? WHERE venue_id = ?;
          `;
          const [rows, fields] = await req.pool.execute(updateVenueSql, [req.body.data, req.params.id]);
          res.end();
        } else {
          res.sendStatus(400);
        }
      } else {
        res.sendStatus(400);
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);

// remove a venue
router.get('/:id/remove', async function(req, res, next) {
  try {
    const [rows, fields] = await req.pool.execute(removeVenueSql, [req.params.id]);
    res.end();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// get a venue's history
router.get('/:id/history', async function(req, res, next) {
  try {
    const [rows, fields] = await req.pool.execute(getVenueHistorySql, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});







module.exports = router;
