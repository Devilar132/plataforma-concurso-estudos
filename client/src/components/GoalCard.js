import React, { useState } from 'react';
import { Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import './GoalCard.css';

const GoalCard = ({ goal, onToggle, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const isToday = goal.date === today;
  // Pode marcar como concluída apenas se for hoje
  // Pode desmarcar metas de qualquer dia
  const canMarkComplete = isToday || goal.completed;

  const handleToggle = (e) => {
    e.stopPropagation();
    // Não permite marcar como concluída se não for hoje
    if (!goal.completed && !isToday) {
      return;
    }
    onToggle(goal.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(goal);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(goal.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
      <div className="goal-card-header">
        <label className={`checkbox-container ${!canMarkComplete ? 'disabled' : ''}`}>
          <input
            type="checkbox"
            checked={goal.completed}
            onChange={handleToggle}
            disabled={!canMarkComplete}
          />
          <div className="checkbox-custom">
            {goal.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </div>
        </label>
        <div className="goal-card-actions">
          <button onClick={handleEdit} className="btn-icon" title="Editar">
            <Edit2 size={18} />
          </button>
          <button onClick={handleDelete} className="btn-icon btn-icon-danger" title="Excluir">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="goal-card-body">
        <h3 className="goal-title">{goal.title}</h3>
        {goal.description && (
          <p className="goal-description">{goal.description}</p>
        )}
        {goal.tag && (
          <span className="goal-tag">{goal.tag}</span>
        )}
        {goal.notes && (
          <div className="goal-notes">
            <strong>Notas:</strong> {goal.notes}
          </div>
        )}
      </div>
      <div className="goal-card-footer">
        <span className="goal-date">
          {new Date(goal.date).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Meta"
        message="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default GoalCard;
