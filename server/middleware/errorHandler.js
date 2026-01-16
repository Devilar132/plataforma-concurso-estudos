const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Erro de validação
  if (err.message.includes('obrigatório') || err.message.includes('inválido')) {
    return res.status(400).json({
      error: err.message
    });
  }

  // Erro de não encontrado
  if (err.message.includes('não encontrada') || err.message.includes('não encontrado')) {
    return res.status(404).json({
      error: err.message
    });
  }

  // Erro de permissão
  if (err.message.includes('permitido') || err.message.includes('não autorizado')) {
    return res.status(403).json({
      error: err.message
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor'
      : err.message
  });
};

module.exports = errorHandler;
