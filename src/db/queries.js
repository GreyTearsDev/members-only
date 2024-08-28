const pool = require("./index");
const bcryptjs = require("bcryptjs");
const colNames = require("../util/colNames");

exports.getUserBy = async (column, value) => {
  let result;
  try {
    switch (column) {
      case colNames.ID:
        result = await pool.query(
          `
            SELECT * FROM users WHERE id = $1
          `,
          [value],
        );
        return result.rows[0];

      case colNames.USERNAME:
        result = await pool.query(
          `
            SELECT * FROM users WHERE username = $1
          `,
          [value],
        );
        return result.rows[0];
    }
  } catch (e) {
    console.log(e);
  }
};

exports.insertUser = async (user) => {
  const query = `
    INSERT INTO users(username, first_name, last_name, password, is_admin, is_member)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  try {
    const hashedPassword = await bcryptjs.hash(user.password, 10);

    user.password = hashedPassword;

    await pool.query(query, [
      user.username,
      user.first_name,
      user.last_name,
      user.password,
      user.is_admin,
      user.is_member,
    ]);
  } catch (e) {
    console.log("Error during insertion: ", e);
  }
};

exports.grantPrivileges = async (userId, privilegesType) => {
  const admin_query = `
    UPDATE users 
    SET is_admin = true 
    WHERE id = $1;
  `;
  const member_query = `
    UPDATE users 
    SET is_member = true 
    WHERE id = $1;
  `;

  try {
    switch (privilegesType) {
      case colNames.IS_ADMIN:
        await pool.query(admin_query, [userId]);
        break;
      case colNames.IS_MEMBER:
        await pool.query(member_query, [userId]);
        break;
    }
  } catch (e) {
    throw new Error("Something when wrong while granting privilegess: ", e);
  }
};

exports.removePrivileges = async (userId, privilegesType) => {
  const admin_query = `
    UPDATE users 
    SET is_admin = false
    WHERE id = $1;
  `;
  const member_query = `
    UPDATE users 
    SET is_member = false 
    WHERE id = $1;
  `;

  try {
    switch (privilegesType) {
      case colNames.IS_ADMIN:
        await pool.query(admin_query, [userId]);
        break;
      case colNames.IS_MEMBER:
        await pool.query(member_query, [userId]);
        break;
    }
  } catch (e) {
    throw new Error("Something when wrong while removing privilegess: ", e);
  }
};

exports.getSecretPassword = async (columnName) => {
  const queryText = `
    SELECT password FROM secret_passwords WHERE name = $1;
  `;
  let result;

  try {
    switch (columnName) {
      case colNames.PASS_ADMIN:
        result = await pool.query(queryText, [columnName]);
        return result.rows[0].password;
      case colNames.PASS_MEMBER:
        result = await pool.query(queryText, [columnName]);
        return result.rows[0].password;
    }
  } catch (e) {
    throw new Error("Something when wrong while fetching secret password: ", e);
  }
};
