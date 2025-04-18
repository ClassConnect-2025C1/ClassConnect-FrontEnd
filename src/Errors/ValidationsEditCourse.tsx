export const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10) === dateString;
};

export const validateFields = (
  title,
  description,
  eligibilityCriteria,
  startDate,
  endDate,
) => {
  const newErrors = {};

  if (title.length < 3) {
    newErrors.title = 'Title must be at least 3 characters';
  }

  if (description.length < 3) {
    newErrors.description = 'Description must be at least 3 characters';
  }

  if (eligibilityCriteria.length < 3) {
    newErrors.eligibilityCriteria =
      'Eligibility criteria must be at least 3 characters';
  }

  if (!isValidDate(startDate)) {
    newErrors.startDate = 'Start date must be valid (YYYY-MM-DD)';
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
  }

  if (!isValidDate(endDate)) {
    newErrors.endDate = 'End date must be valid (YYYY-MM-DD)';
  } else if (endDate < startDate) {
    newErrors.endDate = 'End date cannot be before start date';
  }

  return newErrors;
};
