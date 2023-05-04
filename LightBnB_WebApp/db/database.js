const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});

//pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => { console.log(response); });
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * from users where email = $1;`, [email])
    .then((response) => {
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};


// const getUserWithEmail1 = function(email) {
//   let resolvedUser = null;
//   for (const userId in users) {
//     const user = users[userId];
//     if (user && user.email && user.email.toLowerCase() === email.toLowerCase()) {
//       resolvedUser = user;
//     }
//   }
//   return Promise.resolve(resolvedUser);
// };

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function(id) {
  return pool
    .query(`SELECT * from users where id = $1;`, [id])
    .then((response) => {
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool
    .query(`INSERT INTO users (name, password, email) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.password, user.email])
    .then(response => {
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

// const addUser1 = function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// };

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;`, [guest_id, limit])
    .then(response => {
      return response.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


const getAllProperties = function(options, limit) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    const min_price = options.minimum_price_per_night * 100;
    queryParams.push(`${min_price}`);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    const max_price = options.maximum_price_per_night * 100;
    queryParams.push(`${max_price}`);
    queryString += `AND cost_per_night <= $${queryParams.length}  `;
  }
  // 4

  queryString += `
  GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  // 5

  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
    .then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return pool
    .query(`INSERT INTO properties (owner_id, title,description,thumbnail_photo_url,cover_photo_url,
                                  cost_per_night, street, city, province, post_code, country, 
                                  parking_spaces, number_of_bathrooms, number_of_bedrooms) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`,
      [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url,
      property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country,
      property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
    .then(response => {
      //console.log(response.rows);
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};



module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
