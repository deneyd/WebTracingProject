var express = require('express');
var router = express.Router();
var path = require('path');
var { query, param, validationResult, body } = require('express-validator');
var argon2 = require('argon2');

// guard for admin users
router.use(function(req, res, next) {
  if (req.session.user) {
    if (req.session.user.type === 'admin') {
      next();
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

// queries
const getUserinfoSql = `
SELECT user_id AS id, first_name AS firstName, last_name AS lastName, email_address AS email, phone_number AS phone, user_type AS type FROM users;
`;
const getVenueinfoSql = `
SELECT v.venue_id AS id, v.owner AS ownerId,
v.name AS venueName, CONCAT_WS(", ", a.street, a.suburb, CONCAT_WS(" ", a.state, a.postcode)) AS venueAddress,
v.checkin_code AS checkinCode, v.phone_number AS venuePhone
FROM venues AS v
INNER JOIN addresses AS a
ON v.address = a.address_id
`;
const getCheckinSql = `
SELECT checkin_id AS id, CONCAT_WS(" ", u.first_name, u.last_name) AS user,  v.name AS venue, c.checkin_datetime AS time, c.method
FROM checkins AS c
INNER JOIN venues AS v
ON c.venue = v.venue_id
INNER JOIN users AS u
ON c.user = u.user_id
WHERE DATE(checkin_datetime) <= ?;
`;
const insertAdminSql = `
INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES (?, ?, ?, ?, ?, "admin");
`;
const findEmailSql = `SELECT * FROM users WHERE email_address = ?;`;
const getHotspotsSql = `
SELECT v.venue_id AS id, h.start_datetime AS hotspotStartTime, CONCAT_WS(" ", u.first_name, u.last_name) AS owner, v.name,
CONCAT_WS(", ", a.street, a.suburb, CONCAT_WS(" ", a.state, a.postcode)) AS address, v.phone_number AS phone
FROM venues AS v
LEFT JOIN (SELECT * FROM hotspots WHERE end_datetime IS NULL) AS h
ON v.venue_id = h.venue
INNER JOIN users AS u
ON u.user_id = v.owner
INNER JOIN addresses AS a
ON a.address_id = v.address
`;
const removeHotspotSql = `
UPDATE hotspots SET end_datetime = NOW() WHERE venue = ?;
`;
const verifyHotspotExistSql = `
SELECT venue FROM hotspots WHERE end_datetime IS NULL AND venue = ?;
`;
const verifyVenue = `
SELECT venue_id FROM venues WHERE venue_id = ?;
`;
const addHotspotSql = `
INSERT INTO hotspots (venue, admin_added) VALUES (?, ?);
`;

// get all users information
router.get(
  '/get/usersinfo',
  async function(req, res, next) {
    try {
      const [rows, fields] = await req.pool.execute(getUserinfoSql);
      res.send(rows);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);

// get all venues information
router.get(
  '/get/venuesinfo',
  async function(req, res, next) {
    try {
      const [rows, fields] = await req.pool.execute(getVenueinfoSql);
      res.send(rows);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);

// retrieve all check in history
router.get(
  '/get/history',
  query('date').exists().isDate(),
  async function(req, res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        const [rows, fields] = await req.pool.execute(getCheckinSql, [req.query.date]);
        res.json(rows);
      } else {
        console.log(validationResult(req).mapped());
        console.log(req.params.date);
        res.sendStatus(400);
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
);


// sign up another admin
router.post(
  '/signup',
  body('firstName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('lastName').notEmpty().matches(/^[A-Za-z\s0-9]{1,64}$/, 'g'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('phone').matches(/^((\+61)?0?[23478][0-9]{8})$/, 'g'),
  async function(req, res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        const [rows, fields] = await req.pool.execute(findEmailSql, [req.body.email]);
        if (rows.length == 0) {
          const hash = await argon2.hash(req.body.password);
          const [rows, fields] = await req.pool.execute(insertAdminSql, [req.body.firstName, req.body.lastName, req.body.email, hash, req.body.phone]);
          res.end();
        } else {
          res.sendStatus(403);
        }
      } else {
        res.sendStatus(400);
      }
    } catch(err) {
      console.log(err);
      res.sendStatus(500);

    }
  }
);

// get venues along with their hotspot information
router.get('/get/venuesforhotspot', async function(req, res, next) {
  try {
    const [rows, fields] = await req.pool.execute(getHotspotsSql);
    res.send(rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// guard to check if the id exists
router.use(
  '/hotspot/*/:id',
  param('id').exists().isNumeric(),
  async function(req ,res, next) {
    try {
      if (validationResult(req).isEmpty()) {
        const [rows, field] = await req.pool.execute(verifyVenue, [req.params.id]);
        if (rows.length == 0) {
          res.sendStatus(404);
        } else {
          next();
        }
      } else {
        res.sendStatus(403);
      }
    } catch (err) {
      res.sendStatus(500);
      console.log(err);
    }
  }
);

// add a hotspot from existing venues
router.get(
  '/hotspot/add/:id',
  async function(req, res, next) {
    try {
      const [rows, fields] = await req.pool.execute(verifyHotspotExistSql, [req.params.id]);
      if (rows.length == 0) {
        const [rows, fields] = await req.pool.execute(addHotspotSql, [req.params.id, req.session.user.id]);
        res.end();
      } else {
        res.sendStatus(403);
      }
    } catch (err) {
      res.sendStatus(500);
      console.log(err);
    }
  }
);

// remove a current hotspot
router.get(
  '/hotspot/remove/:id',
  async function(req, res, next) {
    try {
      const [rows, fields] = await req.pool.execute(verifyHotspotExistSql, [req.params.id]);
      if (rows.length == 0) {
        res.sendStatus(403);
      } else {
        const [rows, fields] = await req.pool.execute(removeHotspotSql, [req.params.id]);
        res.end();
      }
    } catch (err) {
      res.sendStatus(500);
      console.log(err);
    }
  }
);

module.exports = router;
