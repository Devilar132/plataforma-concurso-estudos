import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, BarChart3, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { authService } from '../services/auth';
import './TopNavigation.css';

const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const user = authService.getCurrentUser();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/study-hours', icon: Clock, label: 'Horas de Estudo' },
    { path: '/statistics', icon: BarChart3, label: 'Estatísticas' },
  ];

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Não fechar se o clique foi em um link ou dentro do menu mobile
      if (event.target.closest('a') || event.target.closest('.nav-mobile-menu')) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isMobileMenuOpen || isUserMenuOpen) {
      // Suportar tanto mouse quanto touch
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Usar requestAnimationFrame para evitar reflows que causam problemas com ResizeObserver
      requestAnimationFrame(() => {
        document.body.style.overflow = 'hidden';
      });
    } else {
      // Restaurar overflow de forma suave
      requestAnimationFrame(() => {
        document.body.style.overflow = '';
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isUserMenuOpen]);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <nav className="top-navigation" ref={menuRef}>
        {/* Logo/Brand */}
        <div className="nav-brand">
          <Link to="/dashboard" className="nav-brand-link">
            <span className="nav-brand-icon">📚</span>
            <div className="nav-brand-text">
              <span className="nav-brand-title">Metas</span>
              <span className="nav-brand-subtitle">Estudos</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-menu-desktop">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isActive && <div className="nav-item-indicator" />}
              </Link>
            );
          })}
        </div>

        {/* User Menu Desktop */}
        <div className="nav-user-desktop" ref={userMenuRef}>
          <button
            className="nav-user-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-expanded={isUserMenuOpen}
            aria-label="Menu do usuário"
          >
            <div className="nav-user-avatar">
              <User size={18} />
            </div>
            <span className="nav-user-name">{user?.name}</span>
            <ChevronDown 
              size={16} 
              className={`nav-user-chevron ${isUserMenuOpen ? 'open' : ''}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="nav-user-dropdown">
              <div className="nav-user-info">
                <div className="nav-user-info-name">{user?.name}</div>
                <div className="nav-user-info-email">{user?.email}</div>
              </div>
              <div className="nav-user-divider" />
              <button
                className="nav-user-logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="nav-mobile-overlay" 
            onClick={(e) => {
              // Só fechar se clicar diretamente no overlay, não em elementos filhos
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false);
              }
            }}
            onTouchStart={(e) => {
              // Só fechar se tocar diretamente no overlay
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false);
              }
            }}
          />
          <div 
            className={`nav-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={(e) => {
              // Prevenir que cliques no menu fechem o menu
              e.stopPropagation();
            }}
          >
            <div className="nav-mobile-header">
              <div className="nav-mobile-user">
                <div className="nav-mobile-avatar">
                  <User size={20} />
                </div>
                <div className="nav-mobile-user-info">
                  <div className="nav-mobile-user-name">{user?.name}</div>
                  <div className="nav-mobile-user-email">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="nav-mobile-content">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    className={`nav-mobile-item ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Navegar programaticamente para garantir que funcione
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {isActive && <div className="nav-mobile-indicator" />}
                  </div>
                );
              })}
            </div>

            <div className="nav-mobile-footer">
              <button
                className="nav-mobile-logout"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TopNavigation;
