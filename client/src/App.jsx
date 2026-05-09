import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinQuiz from './pages/Quiz/JoinQuiz';
import PlayQuiz from './pages/Quiz/PlayQuiz';
import QuizResults from './pages/Quiz/QuizResults';
import MyQuizzes from './pages/Quiz/MyQuizzes';
import CreateQuiz from './pages/Quiz/CreateQuiz';
import AddQuestions from './pages/Quiz/AddQuestions';
import QuizLobby from './pages/Quiz/QuizLobby';
import QuizStats from './pages/Quiz/QuizStats';
import MyBoards from './pages/Board/MyBoards';
import JoinedBoards from './pages/Board/JoinedBoards';
import CreateBoard from './pages/Board/CreateBoard';
import JoinBoard from './pages/Board/JoinBoard';
import BoardDetail from './pages/Board/BoardDetail';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Quiz Modulu - Herkese Acik (PIN ile giris) */}
          <Route path="join-quiz" element={<JoinQuiz />} />
          <Route path="play-quiz/:quizId" element={<ErrorBoundary><PlayQuiz /></ErrorBoundary>} />
          <Route path="quiz-results/:quizId" element={<QuizResults />} />
          
          {/* Ogretmen Routes */}
          <Route path="my-quizzes" element={<ProtectedRoute><MyQuizzes /></ProtectedRoute>} />
          <Route path="create-quiz" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
          <Route path="quiz/:quizId/questions" element={<ProtectedRoute><AddQuestions /></ProtectedRoute>} />
          <Route path="quiz/:quizId/lobby" element={<ProtectedRoute><QuizLobby /></ProtectedRoute>} />
          <Route path="quiz/:quizId/stats" element={<ProtectedRoute><QuizStats /></ProtectedRoute>} />
          <Route path="my-boards" element={<ProtectedRoute><MyBoards /></ProtectedRoute>} />
          <Route path="create-board" element={<ProtectedRoute><CreateBoard /></ProtectedRoute>} />
          <Route path="joined-boards" element={<ProtectedRoute><JoinedBoards /></ProtectedRoute>} />
          
          {/* Public / Anonymous Routes */}
          <Route path="join-board" element={<JoinBoard />} />
          <Route path="board/:boardId" element={<BoardDetail />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
