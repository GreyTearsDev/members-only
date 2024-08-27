const { argv } = require("node:process");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const createUserSessions = `
CREATE TABLE "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire");
`;
const usersTable = `
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username VARCHAR(40) NOT NULL,
      first_name VARCHAR(40) NOT NULL,
      last_name VARCHAR(40) NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOL,
      is_member BOOL
    )
  `;

const secretPasswordsTable = `
  CREATE TABLE IF NOT EXISTS secret_passwords(
    admin TEXT NOT NULL,
    membership TEXT NOT NULL
  );
`;

const messagesTable = `
    CREATE TABLE IF NOT EXISTS messages(
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users (id) ON DELETE RESTRICT,
      title VARCHAR(100) NOT NULL,
      message VARCHAR(2000) NOT NULL,
      posted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

const createDefaultMessages = `
  INSERT INTO messages(user_id, title, message)
  VALUES (
          1, 
          'Unsalted French Fries are Morally Wrong: A Rant 🍟', 
          'Alright, hear me out. Unsalted French fries are an absolute travesty, and I’m here to make the case. 
          
          This humble spud goes through so much—peeled, sliced, and deep-fried in boiling oil—all to reach its final form: the glorious French fry. But then, some cruel soul decides to withhold the salt? That’s just wrong. A bland, soulless chunk of potato. It’s a betrayal, plain and simple. 

          When you order fries, it’s universally understood that they’ll be salted. It’s tradition! Unsalted fries are a slap in the face to generations of fry enthusiasts.
          
          Salt those fries, people! 🍟✨'
        );
`;

async function main() {
  console.log(
    "Connecting to the database *__________________________________*",
  );
  const pool = new Pool({
    connectionString: argv[2],
  });
  console.log("---Connected--- \n*__________________________________*");

  try {
    const default_user_pass_hashed = await bcrypt.hash("notsocoolpass", 10);
    const createDefaultUsers = `
      INSERT INTO users(username, first_name, last_name, password, is_admin, is_member)
      VALUES 
        ('coolguy', 'Josh', 'Doe', '${default_user_pass_hashed}', false, false);
    `;
    const admin_pass_hashed = await bcrypt.hash("cooladmin", 10);
    const member_pass_hashed = await bcrypt.hash("coolmember", 10);
    const createSecretPasswords = `
    INSERT INTO secret_passwords(admin, membership)
    VALUES ('${admin_pass_hashed}', '${member_pass_hashed}');
  `;
    console.log("-----------Creating tables---------------");
    await pool.query(usersTable); // creates a table named `users`
    await pool.query(messagesTable); // creates a table named `messages`
    await pool.query(secretPasswordsTable);

    console.log("-----------Creating user_sessions table---------------\n");
    await pool.query(createUserSessions);

    console.log("-----------Creating default users---------------");
    await pool.query(createDefaultUsers);
    console.log("-----------Creating default messages---------------\n");
    await pool.query(createSecretPasswords);
    console.log("-----------Creating secret passwords---------------\n");

    await pool.query(createDefaultMessages);
    console.log("-----The database has been successfully populated------");
  } catch (e) {
    console.log("Connection error: ", e);
  }
}

main();
