import { useEffect } from 'react'
import { ContactSection } from './components/ContactSection.tsx'
import { Hero } from './components/Hero.tsx'
import { Navbar } from './components/Navbar.tsx'
import { ProjectsSection } from './components/ProjectsSection.tsx'

function App() {
  useEffect(() => {
    const hash = window.location.hash

    if (hash.length <= 1) {
      return
    }

    let id: string

    try {
      id = decodeURIComponent(hash.slice(1))
    } catch {
      return
    }

    document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProjectsSection />
        <ContactSection />
      </main>
    </>
  )
}

export default App
