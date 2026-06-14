import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NutritionPage from './pages/NutritionPage'
import FitnessPage from './pages/FitnessPage'
import SleepPage from './pages/SleepPage'
import MoodPage from './pages/MoodPage'
import AIChatPage from './pages/AIChatPage'
import TodoPage from './pages/TodoPage'
import SettingsPage from './pages/SettingsPage'
import AchievementsPage from './pages/AchievementsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/nutrition" element={<NutritionPage />} />
                  <Route path="/fitness" element={<FitnessPage />} />
                  <Route path="/sleep" element={<SleepPage />} />
                  <Route path="/mood" element={<MoodPage />} />
                  <Route path="/ai" element={<AIChatPage />} />
                  <Route path="/todos" element={<TodoPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App