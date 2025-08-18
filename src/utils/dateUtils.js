export const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  // Handles both 'YYYY-MM-DD' and full ISO strings by taking the first 10 characters
  const [year, month, day] = dateString.substring(0, 10).split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};
