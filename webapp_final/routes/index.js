var express = require('express');
var router = express.Router();
var path = require('path');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
var argon2 = require('argon2');
const { customAlphabet } = require('nanoid');

/* google stuff */
const {OAuth2Client} = require('google-auth-library');
const G_CLIENT_ID = '655908017168-dt926ljpp3g6b9ao9mstlk6dfocnqmvg.apps.googleusercontent.com';
const client = new OAuth2Client(G_CLIENT_ID);
const googleAPIToken = 'AIzaSyBUIcMQ_vBmtdfma-m9H9yT8PyRP6UZ29c';

/* common queries */
const findEmailSql = `SELECT * FROM users WHERE email_address = ?;`;
const verifyUserSql = `SELECT user_id, user_type, password_hash, first_name, last_name FROM users WHERE email_address = ?;`;
const verifyOpenIdSql = `SELECT user_id, user_type, first_name, last_name FROM users WHERE email_address = ?;`;
const normalInsertNoAddressSql = `
  BEGIN;
  INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
  VALUES (?, ?, ?, ?, ?, 'normal');
  SET @last_user_id=LAST_INSERT_ID();
  INSERT INTO normal_users (user, gender, date_of_birth)
  VALUES (@last_user_id, ?, ?);
  COMMIT;
`;
const normalInsertAddressSql = `
  BEGIN;
  INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
  VALUES (?, ?, ?, ?, ?, 'normal');
  SET @last_user_id=LAST_INSERT_ID();
  INSERT INTO addresses (street, suburb, state, postcode, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?);
  SET @last_address_id=LAST_INSERT_ID();
  INSERT INTO normal_users (user, gender, date_of_birth, address)
  VALUES (@last_user_id, ?, ?, @last_address_id);
  COMMIT;
`;
const venueUserInsertSql = `
  BEGIN;
  INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
  VALUES (?, ?, ?, ?, ?, 'venue');
  SET @last_user_id=LAST_INSERT_ID();
  INSERT INTO addresses (street, suburb, state, postcode, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?);
  SET @last_address_id=LAST_INSERT_ID();
  INSERT INTO venues (owner, name, address, checkin_code, phone_number)
  VALUES (@last_user_id, ?, @last_address_id, ?, ?);
  COMMIT;
`;

const openIdInsertSql = `
  BEGIN;
  INSERT INTO users (first_name, last_name, email_address, user_type) VALUES (?, ?, ?, ?);
  SELECT LAST_INSERT_ID() AS user_id;
  COMMIT;
`;
const openIdInsertNormalSql = `
  INSERT INTO normal_users (user, gender) VALUES (?, "N");
`;

// setting up the check in code generator
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const checkinid = customAlphabet(alphabet, 8);

// redirect usr to login as the landing page of website
router.get('/', function(req, res, next) {
  res.redirect(301, '/login');
});

// get signup page
router.get('/signup', function(req, res, next) {
  res.sendFile(path.join(process.cwd(), 'public', 'signup.html'));
});

// singup as normal user
const convertNull = ['address', 'phoneNumber', 'birthDate'];
router.post(
  '/signup/normal',
  body('role').notEmpty().matches(/^normal$/, 'g'),
  body('firstName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('lastName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('address').exists(),
  body('phoneNumber').exists().if(body('phoneNumber').notEmpty()).matches(/^((\+61)?0?[23478][0-9]{8})$/, 'g'),
  body('birthDate').exists().if(body('birthDate').isDate()).isBefore(),
  body('gender').exists().if(body('gender').notEmpty()).matches(/^[MFN]$/, 'g'),
  body('acceptTC').exists().isBoolean(),
  async function(req, res, next) {
    if (validationResult(req).isEmpty() && req.body.acceptTC) {
      for (let field of convertNull) if (req.body[field].length == 0) req.body[field] = null;
      try {
        const [rows, fields] = await req.pool.execute(findEmailSql, [req.body.email]);
        if (rows.length != 0) {
          res.status(400).json({ error: 'USER ALREADY EXISTS' });
        } else {
          if (req.body.address) {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=${googleAPIToken}&address=${encodeURI(req.body.address)}&region=au`);
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
                const hash = await argon2.hash(req.body.password);
                let queryParams = [];
                queryParams = queryParams.concat([req.body.firstName, req.body.lastName, req.body.email, hash, req.body.phoneNumber], codedAddress, [req.body.gender, req.body.birthDate]);
                const [rows, fields] = await req.pool.query(normalInsertAddressSql, queryParams);
                res.end();
                } else if (data.status == 'ZERO_RESULTS') {
                  res.status(400).json({ error: 'BAD ADDRESS' });
                }
              } else {
                res.sendStatus(500);
              }
            } else {
              const hash = await argon2.hash(req.body.password);
              const [rows, fields] = await req.pool.query(normalInsertNoAddressSql, [req.body.firstName, req.body.lastName, req.body.email, hash, req.body.phoneNumber, req.body.gender, req.body.birthDate]);
              res.end();
            }
          }
        } catch (err) {
          res.sendStatus(500);
        }
    } else {
      res.status(400).json({ error: 'INVALID FIELDS' });
    }
});

// signup as venue user
router.post(
  '/signup/venue',
  body('role').notEmpty().matches(/^venue$/, 'g'),
  body('firstName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('lastName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('phoneNumber').notEmpty().matches(/^((\+61)?0?[23478][0-9]{8})$/, 'g'),
  body('venueName').notEmpty().isLength({ max: 64 }),
  body('venueAddressStreet').notEmpty(),
  body('venueAddressSuburb').notEmpty(),
  body('venueAddressState').matches(/^(SA)|(WA)|(QLD)|(VIC)|(NSW)|(TAS)$/, 'g'),
  body('venueAddressPostcode').matches(/^[0-9]{4}$/, 'g'),
  body('venuePhoneNumber').matches(/^((\+61)?0?[23478][0-9]{8})$/, 'g'),
  body('acceptTC').exists().isBoolean(),
  async function(req, res, next) {
    if (validationResult(req).isEmpty() && req.body.acceptTC) {
      try {
        const [rows, fields] = await req.pool.execute(findEmailSql, [req.body.email]);
          if (rows.length != 0) {
            res.status(400).json({ error: 'USER ALREADY EXISTS' });
          } else {
            let venueAddress = req.body.venueAddressStreet+'+'+req.body.venueAddressSuburb+'+'+ req.body.venueAddressState+'+'+req.body.venueAddressPostcode;
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
                const hash = await argon2.hash(req.body.password);
                let checkinCode = checkinid();
                let queryParams = [];
                queryParams = queryParams.concat([req.body.firstName, req.body.lastName, req.body.email, hash, req.body.phoneNumber], codedAddress, [req.body.venueName, checkinCode], [req.body.venuePhoneNumber]);
                const [rows, fields] = await req.pool.query(venueUserInsertSql, queryParams);
                res.end();
              } else if (data.status == 'ZERO_RESULTS') {
                res.status(400).json({ error: 'BAD ADDRESS' });
              }
            } else {
              res.sendStatus(500);
            }
          }
      } catch (err) {
        res.sendStatus(500);
      }
    } else {
      res.status(400).json({ error: 'INVALID FIELDS' });
    }
});

// route to log a person in
router.post(
  '/login',
  body('password').isLength({ min: 8 }),
  body('email').isEmail().normalizeEmail(),
  async function(req, res, next) {
    if (validationResult(req).isEmpty()) {
      if (!('user' in req.session)) {
        try {
          const [rows, fields] = await req.pool.execute(verifyUserSql, [req.body.email]);
          if (rows.length == 1) {
            if (await argon2.verify(rows[0].password_hash, req.body.password)) {
              req.session.user = { id: rows[0].user_id, type: rows[0].user_type, firstName: rows[0].first_name, lastName: rows[0].last_name };
              res.end();
            } else {
              res.sendStatus(404);
            }
          } else {
            res.sendStatus(404);
          }
        } catch (err) {
            res.sendStatus(500);
        }
      } else {
        res.status(304).redirect('/users');
      }
    } else {
      res.sendStatus(400);
    }
});

// get login page (the landing page)
router.get('/login', function(req, res, next) {
  if ('user' in req.session) {
    res.redirect(302, '/users');
    return;
  }
  res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
});

// google log in
router.post(
  '/login/google',
  async function(req, res, next) {
    if (req.body.token) {
      const token = req.body.token;
      if (req.session.user) {
        res.status(301).json({ status: 'ALREADY LOGGED' });
      } else if (req.session.openid) {
        res.status(200).json({ status: 'REQUIRE INFO' });
      } else {
        try {
          const ticket = await client.verifyIdToken({
              idToken: token,
              audience: G_CLIENT_ID  // Specify the CLIENT_ID of the app that accesses the backend
          });
          const payload = ticket.getPayload();
          const email = payload['email'];
          const firstName = payload['given_name'];
          const lastName = payload['family_name'];
          const [rows, fields] = await req.pool.execute(verifyOpenIdSql, [email]);
          if (rows.length == 0) {
            req.session.openid = { email: email, firstName: firstName, lastName: lastName, provider: 'google' };
            res.status(200).json({ status: 'REQUIRE INFO' });
          } else {
            req.session.user = { id: rows[0].user_id, type: rows[0].user_type, firstName: rows[0].first_name, lastName: rows[0].last_name, provider: 'google' };
            res.status(200).json({ status: 'OK', path: '/users' });
          }
        } catch(err) {
          res.sendStatus(500);
        }
      }
    } else {
      res.sendStatus(400);
    }
});

// facebook log in
router.post(
  '/login/facebook',
  body('token').exists(),
  body('id').exists(),
  async function(req, res, next) {
    if (validationResult(req).isEmpty()) {
      if (req.session.user) {
        res.status(301).json({ status: 'ALREADY LOGGED' });
      } else if (req.session.openid) {
        res.status(200).json({ status: 'REQUIRE INFO' });
      } else {
        try {
          const response = await axios.get(`https://graph.facebook.com/${encodeURI(req.body.id)}?fields=first_name,last_name,email&access_token=${encodeURI(req.body.token)}`);
          if (response.status === 200) {
            const email = decodeURIComponent(response.data.email);
            const firstName = decodeURIComponent(response.data.first_name);
            const lastName = decodeURIComponent(response.data.last_name);
            const [rows, fields] = await req.pool.execute(verifyOpenIdSql, [email]);
            if (rows.length == 0) {
              req.session.openid = { email: email, firstName: firstName, lastName: lastName, provider: 'facebook' };
              res.status(200).json({ status: 'REQUIRE INFO' });
            } else {
              req.session.user = { id: rows[0].user_id, type: rows[0].user_type, firstName: rows[0].first_name, lastName: rows[0].last_name, provider: 'facebook' };
              res.status(200).json({ status: 'OK', path: '/users' });
            }
          } else {
            res.sendStatus(400);
          }
        } catch (err) {
          res.sendStatus(500);
        }
      }
    } else {
      res.sendStatus(400);
    }
});

// route to register the role of the user on the first time when using google/facebook
router.post(
  '/signup/openid',
  body('user_type').matches(/(^normal$)|(^venue$)/, 'g'),
  async function(req, res, next) {
  if (validationResult(req).isEmpty()) {
    if (req.session.openid) {
      try {
        const o = req.session.openid;
        req.body.email = o.email;
        req.body.firstName = o.firstName;
        req.body.lastName = o.lastName;
        req.body.provider = o.provider;
        delete req.session.openid;
        await body('firstName').notEmpty();
        await body('lastName').notEmpty();
        await body('email').normalizeEmail();
        if (validationResult(req).isEmpty()) {
          const [rows, fields] = await req.pool.query(openIdInsertSql, [req.body.firstName, req.body.lastName, req.body.email, req.body.user_type]);
          const id = rows[2][0].user_id;
          if (req.body.user_type === 'normal') {
            const [rows, fields] = await req.pool.execute(openIdInsertNormalSql, [id]);
          }
          req.session.user = { id: id, type: req.body.user_type, firstName: req.body.firstName, lastName: req.body.lastName, provider: req.body.provider };
          res.status(200).json({ status: 'OK', path: '/users' });
        } else {
          res.sendStatus(400);
        }
      } catch (err) {
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// route to cancel openid registering process
router.get('/signup/openid/cancel', function(req, res, next) {
  if (req.session.openid) {
    delete req.session.openid;
  }
  res.sendStatus(200);
});

// this sets a cookie when user scan qr
router.get('/qr/:code', function(req, res, next) {
  res.cookie('continue_qr_checkin', req.params.code, {
    path: '/users',
    secure: false,
  });
  res.redirect('/login');
});

module.exports = router;
