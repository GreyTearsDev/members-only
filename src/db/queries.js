const pool = require("./index");
const bcryptjs = require("bcryptjs");
const colNames = require("../util/colNames");
const date = require("../util/date_formatting");
const Error = require("../util/error_handlers/customErrorHandler");

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
    return Error.internalError();
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
    return Error.internalError();
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
    return Error.internalError();
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
    return Error.internalError();
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
    return Error.internalError();
  }
};

exports.getAllMessages = async () => {
  const messagesQueryText = `
    SELECT * FROM messages ORDER BY posted_on;
  `;
  const usersQueryText = `
    SELECT * FROM users ORDER BY id;
  `;

  try {
    const messagesQueryResult = await pool.query(messagesQueryText);
    const usersQueryResult = await pool.query(usersQueryText);
    const users = usersQueryResult.rows;
    const rawMessages = messagesQueryResult.rows;

    return rawMessages.map((message) => {
      const user = users.find((u) => (u.id = message.user_id));

      if (!user) {
        return Error.internalError();
      }

      message.username = user.username;
      message.user_is_admin = user.is_admin;
      message.user_is_member = user.is_member;
      message.posted_on = date.formJSDateToStringDMY(message.posted_on);

      return message;
    });
  } catch (e) {
    return Error.internalError();
  }
};

exports.addNewMessage = async (title, message, user_id) => {
  const queryText = `
    INSERT INTO messages(title, message, user_id)
    VALUES ($1, $2, $3);
  `;
  try {
    return await pool.query(queryText, [title, message, user_id]);
  } catch (e) {
    return Error.internalError();
  }
};

exports.deleteMessage = async (message_id) => {
  const queryText = `
    DELETE FROM messages WHERE id = $1
  `;
  try {
    return await pool.query(queryText, [message_id]);
  } catch (e) {
    return Error.internalError();
  }
};
