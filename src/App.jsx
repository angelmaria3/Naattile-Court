import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import FileCase from './pages/FileCase';
import JoinCourtroom from './pages/JoinCourtroom';
import Courtroom from './pages/Courtroom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/file-case" element={<FileCase />} />
        <Route path="/join" element={<JoinCourtroom />} />
        <Route path="/courtroom" element={<Courtroom />} />
      </Routes>
    </Router>
  );
}
