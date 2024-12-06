var express = require('express');
var router = express.Router();
var path = require('path');
var argon2 = require('argon2');
var { query, param, validationResult, body } = require('express-validator');

// queries
const lastCheckinSql = `
SELECT MAX(checkin_datetime) AS lastCheckin FROM checkins
WHERE venue = ? AND user = ?;
`;
const findVenueSql = `
SELECT venue_id AS vid FROM venues WHERE checkin_code = ?;
`;
const checkinUserSql = `
INSERT INTO checkins (user, venue, method) VALUES (?, ?, ?);
`;
const getCheckinSql = `
SELECT v.name, CONCAT_WS(", ", a.street, a.suburb, CONCAT_WS(" ", a.state, a.postcode)) AS address, a.longitude, a.latitude, c.checkin_datetime AS time, c.method
FROM venues AS v
INNER JOIN (SELECT * FROM checkins WHERE user = ?) AS c
ON v.venue_id = c.venue
INNER JOIN addresses AS a
ON v.address = a.address_id;
`;
const getHotspotInfoSql = `
SELECT v.name, v.phone_number AS contact, h.start_datetime AS beginDate,
CONCAT_WS(", ", street, suburb, CONCAT_WS(" ", state, postcode)) AS address, longitude, latitude, CONCAT(" ", u.first_name, u.last_name) AS adminAdded
FROM hotspots AS h
INNER JOIN venues AS v
ON h.venue = v.venue_id
INNER JOIN addresses AS a
ON v.address = a.address_id
INNER JOIN users AS u
ON u.user_id = h.admin_added
WHERE h.end_datetime IS NULL;
`;
const getCommonUserInfoSql = `
SELECT first_name AS firstName, last_name AS lastName, email_address AS email, phone_number AS phone
FROM users
WHERE user_id = ?;
`;
const getNormalUserInfoSql = `
SELECT gender, date_of_birth AS birthDate, CONCAT_WS(", ", street, suburb, CONCAT_WS(" ", state, postcode)) AS address, longitude, latitude
FROM normal_users AS nu
LEFT JOIN addresses AS a
ON nu.address = a.address_id
WHERE nu.user = ?;
`;
const getPwdSql = `
SELECT password_hash from users WHERE user_id = ?;
`;

// cehck if use has logged in
router.use(function(req, res, next) {
  if ('user' in req.session) {
    next();
  } else {
    res.sendStatus(403);
  }
});

// logout user
router.get('/logout', function(req, res, next) {
  if ('provider' in req.session.user) {
    res.sendFile(path.join(process.cwd(), 'private', 'logout_loading.html'));
    delete req.session.user;
  } else {
    delete req.session.user;
    res.redirect('/login');
  }
});

// this route should send the relevant page
router.get('/', function(req, res, next) {
  if ('continue_qr_checkin' in req.cookies) {
    res.redirect('/users/qr');
  } else {
    res.redirect('/users/home');
  }
});

// get the home page for different types of user
router.get('/home', function(req, res, next) {
  switch (req.session.user.type) {
    case 'normal':
      res.sendFile(path.join(process.cwd(), 'private', 'home.normal.html'));
      break;
    case 'venue':
      res.sendFile(path.join(process.cwd(), 'private', 'home.venue.html'));
      break;
    case 'admin':
      res.sendFile(path.join(process.cwd(), 'private', 'home.admin.html'));
      break;
    default:
      res.sendStatus(500);
  }
});

// get the manage page
router.get('/manage', function(req, res, next) {
  switch (req.session.user.type) {
    case 'normal':
      res.sendFile(path.join(process.cwd(), 'private', 'myhealth.normal.html'));
      break;
    case 'venue':
      res.sendFile(path.join(process.cwd(), 'private', 'mymanage.venue.html'));
      break;
    case 'admin':
      res.sendFile(path.join(process.cwd(), 'private', 'mymanage.admin.html'));
      break;
    default:
      res.sendStatus(500);
  }
});


// get hotstpot page
router.get('/hotspots', function(req, res, next) {
  switch (req.session.user.type) {
    case 'normal':
      res.sendFile(path.join(process.cwd(), 'private', 'hotspots.normal.html'));
      break;
    case 'venue':
      res.sendFile(path.join(process.cwd(), 'private', 'hotspots.venue.html'));
      break;
    case 'admin':
      res.sendFile(path.join(process.cwd(), 'private', 'hotspots.admin.html'));
      break;
    default:
      res.sendStatus(500);
  }
});



// this gets the qr page
router.get('/qr', function(req, res, next) {
  if (req.session.user.type == 'normal') {
    res.sendFile(path.join(process.cwd(), 'private', 'qr_confirm.html'));
  } else {
    res.clearCookie('continue_qr_checkin', { path: '/users' });
    res.sendFile(path.join(process.cwd(), 'private', 'qr_failure.html'));
  }
});

// this route only accessible by normal users and check in
router.get(
  '/checkin/:code',
  param('code').exists().isAlphanumeric(),
  query('type').exists().matches(/(^qr$)|(^num$)/, 'g'),
  async function(req, res, next) {
    if (req.session.user.type == 'normal') {
      if (validationResult(req).isEmpty()) {
        try {
          var [rows, fields] = await req.pool.execute(findVenueSql, [req.params.code]);
          if (rows.length == 1) {
            const vid = rows[0].vid;
            [rows, fields] = await req.pool.execute(lastCheckinSql, [vid, req.session.user.id]);
            if (rows[0].lastCheckin === null) {
              [rows, fields] = await req.pool.execute(checkinUserSql, [req.session.user.id, vid, req.query.type]);
              res.end();
            } else {
              let now = new Date();
              let last = new Date(rows[0].lastCheckin);
              if (now.getTime()-last.getTime() > 1000*60*10) {
                [rows, fields] = await req.pool.execute(checkinUserSql, [req.session.user.id, vid, req.query.type]);
                res.end();
              } else {
                res.status(409).json({ status: 'ALREADY CHECKIN' });
              }
            }
          } else {
            res.sendStatus(404);
          }
        } catch (err) {
          res.sendStatus(500);
        }
      } else {
        res.sendStatus(400);
      }
    } else {
      res.sendStatus(403);
    }
});

// get all current hotspots
router.get('/get/hotspots', async function(req, res ,next) {
  try {
    const [rows, fields] = await req.pool.execute(getHotspotInfoSql);
    let results = [];
    for(let item of rows) {
      results.push({
        name: item.name,
        contact: item.contact,
        beginDate: item.beginDate,
        address: {
          formatted: item.address,
          location: [
            item.longitude,
            item.latitude
          ]
        }
      });
    }
    res.json(results);
  } catch (err) {
    res.sendStatus(500);
  }
});

// get current session user information
router.get('/get/userinfo', async function(req, res ,next) {
  try {
    let [rows, fields] = await req.pool.execute(getCommonUserInfoSql, [req.session.user.id]);
    let results = {...rows[0]};
    if (req.session.user.type === 'normal') {
      let [rows, fields] = await req.pool.execute(getNormalUserInfoSql, [req.session.user.id]);
      results.gender = rows[0].gender;
      results.birthDate = rows[0].birthDate ? rows[0].birthDate.toLocaleDateString() : null;
      if (rows[0].address) {
        results.address = {
          formatted: rows[0].address,
          location: [
            rows[0].longitude,
            rows[0].latitude
          ]
        };
      } else {
        results.address = null;
      }
      res.json(results);
    } else if (req.session.user.type === 'venue') {
      res.json(results);
    } else if (req.session.user.type === 'admin') {
      res.json(results);
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

// route to change user information in users table
const fieldLookup = {
  'firstName': 'first_name',
  'lastName': 'last_name',
  'email': 'email_address',
  'phone': 'phone_number',
};
router.post(
  '/change/userinfo',
  body('field').exists().matches(/(^firstName$)|(^lastName$)|(^phone$)/, 'g'),
  body('data').exists(),
  async function(req, res, next) {
    try {
      if (!validationResult(req).isEmpty()) {
        res.status(400).send('Wrong format');
      } else {
        let regex;
        if ((req.body.field === 'firstName' )|| (req.body.field == 'lastName')) {
          regex = /^[A-Za-z\s0-9]{1,64}$/g;
        } else if (req.body.field === 'phone') {
          regex = /^$|^((\+61)?0?[23478][0-9]{8})$/g;
        }
        if (regex.test(req.body.data)) {
          if (req.body.data.length == 0) {
            req.body.data = null;
          }
          let updateSql = `UPDATE users SET ${fieldLookup[req.body.field]} = ? WHERE user_id = ?;`;
          const [rows, fields] = await req.pool.execute(updateSql, [req.body.data, req.session.user.id]);
          res.send('Successful');
        } else {
          res.status(400).send('Invalid value');
        }
      }
    } catch (err) {
      res.sendStatus(500);
    }
});

// route to change password
router.post(
  '/change/password',
  body('passwordOld').exists().matches(/^$|^.{8,}$/, 'g'),
  body('passwordNew').exists().matches(/^.{8,}$/, 'g'),
  async function(req, res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        const [rows, fields] = await req.pool.execute(getPwdSql, [req.session.user.id]);
        const hash = await argon2.hash(req.body.passwordNew);
        let updateSql = `UPDATE users SET password_hash = ? WHERE user_id = ?;`;
        if (rows[0].password_hash !== null) {
          if (await argon2.verify(rows[0].password_hash, req.body.passwordOld)) {
            const [rows, fields] = await req.pool.execute(updateSql, [hash, req.session.user.id]);
            res.end();
          } else {
            res.status(403).send('Wrong old password');
          }
        } else {
          const [rows, fields] = await req.pool.execute(updateSql, [hash, req.session.user.id]);
          res.end();
        }
      } else {
        res.status(400).send('Invalid fields');
      }
    } catch (err) {
      res.status(500).send('Server error');
    }
});


// get normal user's check in history
router.get('/get/checkininfo', async function(req, res, next) {
  try {
    if (req.session.user.type == 'normal') {
      const [rows, fields] = await req.pool.execute(getCheckinSql, [req.session.user.id]);
      var results = [];
      rows.forEach((row, i) => {
        var record = {
          venue: {
            name: row.name,
            address: row.address,
            location: [row.longitude, row.latitude],
          },
          time: row.time,
          method: row.method
        };
        results.push(record);
      });
      res.json(results);
    } else {
      res.sendStatus(403);
    }
  } catch (err) {
    res.sendStatus(500);
  }
});

module.exports = router;
