import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';
import SignUpPage from './SignUpPage';
import PostList from './PostList';
import PostForm from './PostForm';
import ProfilePage from './ProfilePage';
import Navbar from './Navbar';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create-post" element={<PostForm />} />
            <Route path="/edit-post/:id" element={<PostForm />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>
);
