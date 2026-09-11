import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CreateCase from './pages/CreateCase'
import JoinCase from './pages/JoinCase'
import Courtroom from './pages/Courtroom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateCase />} />
        <Route path="/join" element={<JoinCase />} />
        <Route path="/courtroom/:caseId" element={<Courtroom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App