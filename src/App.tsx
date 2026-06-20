import { Routes, Route } from 'react-router-dom';
import { LayoutRoot } from './components/layout/LayoutRoot';
import { HomePage } from './pages/HomePage';
import { CompetitionPage } from './pages/CompetitionPage';
import { PlanningPage } from './pages/PlanningPage';
import { ResultatsClassementPage } from './pages/ResultatsClassementPage';
import { AdminEnrolementPage } from './pages/AdminEnrolementPage';
import { InscriptionEquipePage } from './pages/InscriptionEquipePage';
import { AdminPage } from './pages/AdminPage';
import { AdminEquipesPage } from './pages/AdminEquipesPage';
import { AdminTourPage } from './pages/AdminTourPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { PhaseFinalePage } from './pages/PhaseFinalePage';
import { AdminFinalePage } from './pages/AdminFinalePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

export default function App() {
  return (
    <LayoutRoot>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/competition" element={<CompetitionPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/resultats" element={<ResultatsClassementPage />} />
        <Route path="/finale" element={<PhaseFinalePage />} />
        <Route path="/inscription" element={<InscriptionEquipePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/equipes" element={<AdminEquipesPage />} />
        <Route path="/admin/enrolement" element={<AdminEnrolementPage />} />
        <Route path="/admin/tour" element={<AdminTourPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/finale" element={<AdminFinalePage />} />
      </Routes>
    </LayoutRoot>
  );
}
