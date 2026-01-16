import React, { useState, useEffect } from 'react';
import { showError } from '../utils/toast';
import './GoalForm.css';

const GoalForm = ({ goal, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tag: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        tag: goal.tag || '',
        date: goal.date || new Date().toISOString().split('T')[0],
        notes: goal.notes || ''
      });
    }
  }, [goal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value.trim()) {
          error = 'O título é obrigatório';
        } else if (value.trim().length < 3) {
          error = 'O título deve ter pelo menos 3 caracteres';
        }
        break;
      case 'date':
        if (!value) {
          error = 'A data é obrigatória';
        }
        break;
      default:
        break;
    }
    setErrors({ ...errors, [name]: error });
    return !error;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar todos os campos
    const isTitleValid = validateField('title', formData.title);
    const isDateValid = validateField('date', formData.date);
    
    if (!isTitleValid || !isDateValid) {
      showError('Por favor, corrija os erros no formulário');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="goal-form-container">
      <form className="goal-form" onSubmit={handleSubmit}>
        <h2>{goal ? 'Editar Meta' : 'Nova Meta'}</h2>
        
        <div className="form-group">
          <label htmlFor="title">Título *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Estudar Direito Constitucional"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detalhes sobre a meta..."
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Data *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.date && touched.date ? 'input-error' : ''}
              required
            />
            {errors.date && touched.date && (
              <span className="error-message">{errors.date}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tag">Tag/Matéria</label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={formData.tag}
              onChange={handleChange}
              placeholder="Ex: Direito Constitucional"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notas Rápidas</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Anotações importantes..."
            rows="2"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {goal ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;
