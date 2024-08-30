const { DateTime } = require("luxon");

/**
 * Formats a JavaScript Date object into a string with the format "dd-MM-yyyy".
 *
 * @param {Date} date - The date to format.
 * @returns {string} - A string representing the date in "dd-MM-yyyy" format. If the date is null or undefined, returns an empty string.
 *
 * @example
 * // Example usage
 * formJSDateToStringDYM(new Date(2024, 7, 14)); // returns "14-08-2024"
 */
const formJSDateToStringDMY = (date) => {
  return date ? DateTime.fromJSDate(date).toFormat("dd-MM-yyyy") : "";
};

/**
 * Formats a JavaScript Date object into a string with the format "yyyy-MM-dd".
 *
 * @param {Date} date - The date to format.
 * @returns {string} - A string representing the date in "yyyy-MM-dd" format. If the input date string is null or undefined, returns an empty string.
 *
 * @example
 * // Example usage
 * fromDMYToYMD(new Date("14-08-2024")); // returns "2024-08-14"
 */
const fromJSDateToStringYMD = (date) => {
  if (!date) return "";
  const stringDate = formJSDateToStringDMY(date);

  const [day, month, year] = stringDate.split("-");
  return `${year}-${month}-${day}`;
};

module.exports = {
  formJSDateToStringDMY,
  fromJSDateToStringYMD,
};
