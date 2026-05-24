import React, { Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'

const About = React.lazy(() => import('./pages/About'))

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Главная</Link> | <Link to="/about">О нас</Link>
      </nav>
      <Suspense fallback={<div>Загрузка страницы О нас...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App