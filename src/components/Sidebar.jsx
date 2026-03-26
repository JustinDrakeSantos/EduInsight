import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Study Tracker', to: '/study-tracker' },
  { label: 'Notes', to: '/notes' },
  { label: 'Flashcards', to: '/flashcards' },
  { label: 'Exam Scores', to: '/exam-scores' },
  { label: 'Recommendations', to: '/recommendations' }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <div className="brand-icon">S</div>
        <div>
          <h1>StudyFlow</h1>
          <p>Intentional studying</p>
        </div>
      </div>

      <nav className="nav-list">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer card subtle-card">
        <h3>Focus goal</h3>
        <p>Log each session and let the dashboard fill itself from your database data.</p>
      </div>
    </aside>
  );
}

export default Sidebar;
