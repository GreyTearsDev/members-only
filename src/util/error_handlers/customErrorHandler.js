class CustomHTTPErrorHandler extends Error {
  constructor(title, message, status) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.title = title;
    this.status = status;
    this.message = message;
  }
}

const pageNotFound = () => {
  return new CustomHTTPErrorHandler(
    "Page Not Found",
    "The page you are looking for does not exist",
    404,
  );
};

const notLoggedIn = () => {
  return new CustomHTTPErrorHandler(
    "Unauthorized route",
    "You're have to be logged in to see this page",
    403,
  );
};

const alreadyLoggedIn = () => {
  return new CustomHTTPErrorHandler(
    "Unauthorized route",
    "You're already logged in",
    403,
  );
};

const actionNotAllowed = () => {
  return new CustomHTTPErrorHandler(
    "Unauthorized route",
    "You're not allowed to perform this action",
    403,
  );
};

const internalError = () => {
  return new CustomHTTPErrorHandler(
    "Something blew up",
    "We are trying to figure out what happened",
    500,
  );
};

module.exports = {
  pageNotFound,
  alreadyLoggedIn,
  notLoggedIn,
  internalError,
  actionNotAllowed,
};
