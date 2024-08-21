const { argv, argv0 } = require("node:process");
const { Pool } = require("pg");

const usersTable = `
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username VARCHAR(40) NOT NULL,
      first_name VARCHAR(40) NOT NULL,
      last_name VARCHAR(40) NOT NULL,
      password TEXT NOT NULL,
      name TEXT GENERATED ALWAYS  AS (first_name || ' ' || last_name) STORED,
      is_admin BOOL
    )
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

const createDefaultUsers = `
  INSERT INTO users(username, first_name, last_name, password, is_admin)
  VALUES 
    ('greytearsdev', 'Tirso', 'Samalungo', 'mycoolpass', true),
    ('coolguy', 'Josh', 'Doe', 'notsocoolpass', false);
`;

const createDefaultMessages = `
  INSERT INTO messages(user_id, title, message)
  VALUES (
          1, 
          'Unsalted French Fries are Morally Wrong: A Rant 🍟', 
          'Alright, hear me out. Unsalted French fries are an absolute travesty, and I’m here to make the case. 
          
          First off, the potato. This humble spud goes through so much—peeled, sliced, and deep-fried in boiling oil—all to reach its final form: the glorious French fry. But then, some cruel soul decides to withhold the salt? That’s just wrong. It’s like taking a victory lap and refusing to break the tape at the finish line. A bland, soulless chunk of potato. It’s a betrayal, plain and simple. 

          And let’s not forget the unspoken social contract here. When you order fries, it’s universally understood that they’ll be salted. It’s tradition! Unsalted fries are a slap in the face to generations of fry enthusiasts.
          
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
    console.log("-----------Creating tables---------------");
    await pool.query(usersTable); // creates a table named `users`
    await pool.query(messagesTable); // creates a table named `messages`
    console.log("-----------Creating default users---------------");
    await pool.query(createDefaultUsers);
    console.log("-----------Creating default messages---------------\n");
    await pool.query(createDefaultMessages);
    console.log("-----The database has been successfully populated------");
  } catch (e) {
    console.log("Connection error: ", e);
  }
}

main();
