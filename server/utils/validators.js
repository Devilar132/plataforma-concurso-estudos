const validateGoal = (goalData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || goalData.title !== undefined) {
    if (!goalData.title || goalData.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Título é obrigatório' });
    }
  }

  if (!isUpdate || goalData.date !== undefined) {
    if (!goalData.date) {
      errors.push({ field: 'date', message: 'Data é obrigatória' });
    }
  }

  return errors;
};

module.exports = {
  validateGoal
};
