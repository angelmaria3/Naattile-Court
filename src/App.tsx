import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FileCase from './pages/FileCase'
import JoinCase from './pages/JoinCase'
import Courtroom from './pages/Courtroom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileCase />} />
        <Route path="/join" element={<JoinCase />} />
        <Route path="/courtroom" element={<Courtroom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App