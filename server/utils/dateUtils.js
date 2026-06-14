/**
 * Get the date parameter from query string or default to today
 * @param {string} dateParam - Date parameter from query string
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function getDateParam(dateParam) {
  return dateParam || new Date().toISOString().split('T')[0]
}

module.exports = { getDateParam }
