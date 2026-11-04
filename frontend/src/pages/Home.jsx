import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, peso } from '../api';

const packageImages = [
  "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1000&auto=format&fit=crop"
];

export default function Home() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  useEffect(() => {
    api('/packages').then(setPackages).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <img src="/hero-bg.jpg" alt="Catering setup" className="hero-image" />
        <div className="hero-overlay"></div>
        
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">✦ EFFORTLESS CATERING MANAGEMENT</span>
            <h1>Smart catering management, made <em>simple.</em></h1>
            <p>Explore thoughtfully crafted catering packages, book your celebration, and track every detail in one place.</p>
            <div className="hero-actions">
              <a className="button light" href="#packages">Explore packages <span aria-hidden="true">↗</span></a>
              <span className="hero-note">Loved by event planners</span>
            </div>
          </div>
          
          <div className="hero-mockup-wrapper" aria-hidden="true">
            <div className="mockup-glow"></div>
            <div className="mockup-window">
              <div className="mockup-top-bar">
                <div className="mockup-dots"><span></span><span></span><span></span></div>
                <div className="mockup-title">CaterEase Dashboard</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar-mini">
                  <div className="mockup-nav-item active"></div>
                  <div className="mockup-nav-item"></div>
                  <div className="mockup-nav-item"></div>
                </div>
                <div className="mockup-content-mini">
                  <div className="mockup-stat-card">
                    <div className="mockup-stat-label">Total Bookings</div>
                    <div className="mockup-stat-value">128</div>
                    <div className="mockup-stat-trend">↑ 12% this month</div>
                  </div>
                  <div className="mockup-stat-card">
                    <div className="mockup-stat-label">Confirmed Value</div>
                    <div className="mockup-stat-value">₱64,350</div>
                    <div className="mockup-stat-trend">↑ 8% this month</div>
                  </div>
                  <div className="mockup-chart-placeholder">
                    <div className="mockup-bar" style={{ height: '40%' }}></div>
                    <div className="mockup-bar" style={{ height: '70%' }}></div>
                    <div className="mockup-bar" style={{ height: '55%' }}></div>
                    <div className="mockup-bar" style={{ height: '90%' }}></div>
                    <div className="mockup-bar" style={{ height: '80%' }}></div>
                    <div className="mockup-bar" style={{ height: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="shell section reveal" id="packages">
        <div className="section-heading">
          <div>
            <span className="eyebrow green">CURATED FOR EVERY CELEBRATION</span>
            <h2>Find your perfect package.</h2>
          </div>
          <p>From intimate get-togethers to grand gatherings, explore a menu made for your occasion.</p>
        </div>
        
        {loading && <div className="empty">Loading catering packages...</div>}
        {error && <div className="notice warning">{error} Check the MySQL connection and backend terminal.</div>}
        {!loading && !error && !packages.length && <div className="empty">No packages yet. Run <strong>database/seed.sql</strong> in MySQL Workbench to add samples.</div>}
        
        <div className="package-grid">
          {packages.map((item, index) => (
            <article className="package-card stagger-item" style={{ animationDelay: `${index * 0.15}s` }} key={item.package_id}>
              <div className="package-image-wrapper">
                <img 
                  src={packageImages[index % 4]} 
                  alt={item.name} 
                  className="package-image" 
                />
              </div>
              <div className="package-body">
                <span className="eyebrow green">PACKAGE {String(index + 1).padStart(2, '0')}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="package-bottom">
                  <div>
                    <strong>{peso(item.price_per_guest)}</strong>
                    <small>per guest · min. {item.minimum_guests} guests</small>
                  </div>
                  <Link className="button small" to={`/book?package=${item.package_id}`}>Book now ↗</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section bento-section reveal">
        <div className="section-heading" style={{ textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}>
          <span className="eyebrow green">EVERYTHING YOU NEED</span>
          <h2>Features of CaterEase</h2>
          <p style={{ textAlign: 'center', margin: '16px auto 0', maxWidth: '600px' }}>Effortlessly manage your catering business from booking to payment.</p>
        </div>
        
        <div className="bento-grid">
          <article className="bento-card bento-large">
            <div className="bento-text">
              <span className="eyebrow green">BOOKING MANAGEMENT</span>
              <h3>Track every event with ease.</h3>
              <p>Customers can submit requests, and staff can update statuses in real-time from the operations center.</p>
            </div>
            <div className="bento-visual">
              <div className="bento-mini-card">
                <div className="bento-mini-header">
                  <span className="bento-dot green"></span> Booking #12
                </div>
                <div className="bento-mini-line"></div>
                <div className="bento-mini-line short"></div>
                <span className="status status-confirmed" style={{ marginTop: '12px', display: 'inline-block' }}>Confirmed</span>
              </div>
            </div>
          </article>

          <article className="bento-card bento-small">
            <div className="bento-text">
              <span className="eyebrow green">SECURE PAYMENTS</span>
              <h3>Simulated cash tracking.</h3>
              <p>Staff can record payments once an event is completed, keeping your financials perfectly organized.</p>
            </div>
          </article>

          <article className="bento-card bento-small">
            <div className="bento-text">
              <span className="eyebrow green">ADMIN INSIGHTS</span>
              <h3>Real-time analytics.</h3>
              <p>Monitor total revenue, upcoming events, and active packages from a beautiful command center.</p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}