import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Landing.css'
import Logo from './Logo'
import api from '../services/api'

function Landing() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.listCourses()
        const all = res.courses || []
        const adminCreated = all.filter(c => c.created_by)
        setCourses(adminCreated)
      } catch (err) {
        console.error('Failed to load courses', err)
      }
    }
    load()
  }, [])

  const getImage = (c) => c.image_url || (c.description||'').match(/Image:\s*([^;]*)/)?.[1] || ''

  return (
    <div className="landing-wrap">
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="brand">
            <Logo />
          </div>
          <nav className="landing-nav">
            <Link to="/signin" className="landing-cta">Sign in</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1>
                Learn Latest<br />
                In-demand<br />
                Technology
              </h1>
              <p className="hero-sub">
                E-Tech a platform owned by Izzy Tech Team is bringing the classroom right to your room
              </p>
              <Link to="/signin" className="hero-button">Browse Courses</Link>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <img className="hero-illustration" alt="Student learning online at a desk" src="https://images.unsplash.com/photo-1587614382346-4ec70e388b28?q=80&w=1200&auto=format&fit=crop" />
            </div>
          </div>
          <div className="hero-wave" />
        </section>

        <section className="popular" id="courses">
          <h2>Popular Courses</h2>
          <div className="cards">
            {(courses.length > 0 ? courses.slice(0,3) : []).map((c) => (
              <article key={c.id} className="card">
                {getImage(c) && <img className="card-visual" alt={c.title} src={getImage(c)} />}
                <h3>{c.title}</h3>
                <p>{(c.description||'').split(';')[0] || 'Learn with E-TECH'}</p>
                <Link to="/signin" className="card-button">Enroll Now</Link>
              </article>
            ))}
            {courses.length === 0 && (
              <>
                <article className="card">
                  <img className="card-visual" alt="Web development" src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop" />
                  <h3>Web Development</h3>
                  <p>Frontend and Backend Development</p>
                  <Link to="/signin" className="card-button">Enroll Now</Link>
                </article>
                <article className="card">
                  <img className="card-visual" alt="Mobile app development" src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop" />
                  <h3>Mobile/Desktop App Development</h3>
                  <p>React Native,Electron etc</p>
                  <Link to="/signin" className="card-button">Enroll Now</Link>
                </article>
                <article className="card">
                  <img className="card-visual" alt="Data science" src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop" />
                  <h3>Data Science</h3>
                  <p>Data Science and Machine Learning</p>
                  <Link to="/signin" className="card-button">Enroll Now</Link>
                </article>
              </>
            )}
          </div>
        </section>

        <footer className="landing-footer" id="contact" />
      </main>
    </div>
  )
}

export default Landing
