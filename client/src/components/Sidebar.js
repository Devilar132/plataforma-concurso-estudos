import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, BarChart3, LogOut, User } from 'lucide-react';
import { authService } from '../services/auth';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1200;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsDesktop(width > 1200);
    };
    
    // Verificar imediatamente
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/study-hours', icon: Clock, label: 'Horas de Estudo' },
    { path: '/statistics', icon: BarChart3, label: 'Estatísticas' },
  ];

  // Não renderizar em mobile/tablet - retornar null
  if (!isDesktop) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📚</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Metas</span>
            <span className="sidebar-logo-subtitle">Estudos</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {isActive && <div className="sidebar-item-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <User size={18} />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
