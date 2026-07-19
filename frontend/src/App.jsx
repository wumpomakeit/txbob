import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Developers from './pages/Developers'

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-txblack text-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/developers" element={<Developers />} />
        </Routes>
        <Footer />
      </div>
    </ToastProvider>
  )
}
