// utils/donor_utils.js
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(date1, date2) {
  const d1 = new Date(date1).setHours(0,0,0,0);
  const d2 = new Date(date2).setHours(0,0,0,0);
  return Math.round(Math.abs(d2 - d1) / MS_PER_DAY);
}

/**
 * Check if a donor is eligible based on:
 *  - age >= 18
 *  - last_donation_date either null or >= 90 days ago
 */
function isEligibleForDonation(donor) {
  if (!donor) return false;
  if (typeof donor.age === 'number' && donor.age < 18) return false;
  const last = donor.last_donation_date || donor.last_donation;
  if (!last) return true;
  // days since last donation
  const days = daysBetween(last, new Date());
  return days >= 90;
}

module.exports = { isEligibleForDonation, daysBetween };
