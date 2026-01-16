import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Clock, BarChart3, User, LogOut, Home } from 'lucide-react';
import { authService } from '../services/auth';
import './HamburgerMenu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    authService.logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          <div className="hamburger-overlay" onClick={() => setIsOpen(false)} />
          <nav className={`hamburger-menu ${isOpen ? 'open' : ''}`} ref={menuRef}>
            <div className="hamburger-header">
              <div className="hamburger-header-top">
                <div className="hamburger-logo">
                  <span className="hamburger-logo-icon">📚</span>
                  <div className="hamburger-logo-text">
                    <span className="hamburger-logo-title">Metas</span>
                    <span className="hamburger-logo-subtitle">Estudos</span>
                  </div>
                </div>
                <button
                  className="hamburger-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="hamburger-user">
                <div className="hamburger-avatar">
                  <User size={20} />
                </div>
                <div className="hamburger-user-info">
                  <div className="hamburger-user-name">{user?.name}</div>
                  <div className="hamburger-user-email">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="hamburger-content">
              <Link
                to="/dashboard"
                className={`hamburger-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <Home size={20} />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/study-hours"
                className={`hamburger-item ${location.pathname === '/study-hours' ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <Clock size={20} />
                <span>Horas de Estudo</span>
              </Link>

              <Link
                to="/statistics"
                className={`hamburger-item ${location.pathname === '/statistics' ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BarChart3 size={20} />
                <span>Estatísticas</span>
              </Link>
            </div>

            <div className="hamburger-footer">
              <button
                className="hamburger-item hamburger-logout"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default HamburgerMenu;
