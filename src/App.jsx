import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import FileCase from './pages/FileCase';
import CreateCase from './pages/CreateCase';
import JoinCase from './pages/JoinCase';
import JoinCourtroom from './pages/JoinCourtroom';
import CourtroomNew from './pages/Courtroom.tsx';
import CourtroomLocal from './pages/Courtroom.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Home page: Cinematic Landing screen with desktop ratio background */}
        <Route path="/" element={<Landing />} />

        {/* Case filing routes */}
        <Route path="/file-case" element={<FileCase />} />
        <Route path="/create-case" element={<CreateCase />} />

        {/* Case join routes */}
        <Route path="/join" element={<JoinCase />} />
        <Route path="/join-courtroom" element={<JoinCourtroom />} />

        {/* Courtroom session with evidence, jury, witnesses */}
        <Route path="/courtroom/:caseId" element={<CourtroomNew />} />
        <Route path="/courtroom" element={<CourtroomLocal />} />
      </Routes>
    </Router>
  );
}
