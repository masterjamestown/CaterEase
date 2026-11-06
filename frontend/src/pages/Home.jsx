import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, peso } from '../api';

const TESTIMONIALS = [
  {
    headline: '“I really enjoy it”',
    review: 'CaterEase made our wedding day truly special. The food was a sensation, and their attention to detail was impeccable. They turned our vision into reality. Highly recommended!',
    author: 'Peter Jackson',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000&auto=format&fit=crop',
  },
  {
    headline: '“Seamless from start to finish”',
    review: 'Our corporate gala for 120 guests went off without a hitch. The Golden Occasion menu was a hit and the staff handled every dietary request with grace.',
    author: 'Elena Villanueva',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop',
  },
  {
    headline: '“Unforgettable family reunion”',
    review: 'Booking was effortless and the Grand Feast spread had everyone talking. We will definitely book CaterEase again for our next milestone!',
    author: 'Marco Santos',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop',
  },
];

export default function Home() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [inquiry, setInquiry] = useState({ name: '', number: '', email: '', eventType: '', message: '' });
  const [inquirySent, setInquirySent] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api('/packages').then(setPackages).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySent(true);
    setInquiry({ name: '', number: '', email: '', eventType: '', message: '' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <div className="ce-page">
      <header className="ce-hero">
        <div className="ce-container">
          <span className="ce-eyebrow">✦ EFFORTLESS CATERING MANAGEMENT</span>
          <h1 className="ce-hero-title">
            Smart catering management, made <span className="ce-gold-italic">simple.</span>
          </h1>
          <p className="ce-hero-subtitle">
            Explore thoughtfully crafted catering packages, book your celebration, and track every detail in one place.
          </p>
          <div className="ce-hero-actions">
            <a href="#packages" className="ce-btn ce-btn-gold">Explore packages ↗</a>
            <Link to="/book" className="ce-btn ce-btn-outline">Book Now</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="ce-section ce-gallery-section" id="gallery">
          <div className="ce-container">
            <span className="ce-eyebrow">EXPLORE OUR GALLERY</span>
            <h2 className="ce-section-title">Delight in Our <span className="ce-gold">Culinary Creations</span></h2>
            <div className="ce-gallery-grid">
              <div className="ce-gallery-tall">
                <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=900&auto=format&fit=crop" alt="Appetizers" />
              </div>
              <div className="ce-gallery-stack">
                <div className="ce-gallery-wide">
                  <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop" alt="Entrees" />
                </div>
                <div className="ce-gallery-wide">
                  <img src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=900&auto=format&fit=crop" alt="Buffet" />
                </div>
              </div>
              <div className="ce-gallery-tall">
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900&auto=format&fit=crop" alt="Banquet" />
              </div>
            </div>
          </div>
        </section>

        <section className="ce-section ce-packages-section" id="packages">
          <div className="ce-container">
            <div className="ce-section-header">
              <div>
                <span className="ce-eyebrow">CURATED FOR EVERY CELEBRATION</span>
                <h2 className="ce-section-title">Find Your <span className="ce-gold">Perfect Package</span></h2>
              </div>
              <p className="ce-section-desc">From intimate get-togethers to grand gatherings, explore a menu made for your occasion.</p>
            </div>

            {loading && <div className="empty">Loading packages...</div>}
            {error && <div className="notice warning">{error}</div>}

            <div className="ce-packages-grid">
              {packages.map((pkg, index) => (
                <article className="ce-package-card" key={pkg.package_id}>
                  <div className="ce-package-img">
                    <img src={['https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1000&auto=format&fit=crop'][index % 4]} alt={pkg.name} />
                  </div>
                  <div className="ce-package-body">
                    <span className="ce-eyebrow">PACKAGE {String(index + 1).padStart(2, '0')}</span>
                    <h3>{pkg.name}</h3>
                    <p>{pkg.description}</p>
                    <div className="ce-package-footer">
                      <div>
                        <strong className="ce-price">{peso(pkg.price_per_guest)}</strong>
                        <span className="ce-min-guests">per guest · min. {pkg.minimum_guests} guests</span>
                      </div>
                      <Link to={`/book?package=${pkg.package_id}`} className="ce-btn ce-btn-gold ce-btn-sm">Book now ↗</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ce-section ce-chef-section" id="chefs">
          <div className="ce-container ce-chef-grid">
            <div className="ce-chef-copy">
              <span className="ce-eyebrow">MEET OUR CHEF</span>
              <h2 className="ce-section-title">The Chefs Behind <span className="ce-gold">Culinary Brilliance</span></h2>
              <p>Meet the creative genius behind our exceptional cuisine. Chef Isabella and Chef Dominic craft unforgettable dishes that delight every palate.</p>
              <a href="#inquiry" className="ce-btn ce-btn-gold">More about us ↗</a>
            </div>
            <div className="ce-chef-cards">
              <article className="ce-chef-card">
                <div className="ce-chef-photo">
                  <img src="https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=800&auto=format&fit=crop" alt="Isabella Sanchez" />
                </div>
                <h3>Isabella Sanchez</h3>
                <span>Executive Chef</span>
              </article>
              <article className="ce-chef-card">
                <div className="ce-chef-photo">
                  <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=800&auto=format&fit=crop" alt="Dominic Rossi" />
                </div>
                <h3>Dominic Rossi</h3>
                <span>Sous Chef</span>
              </article>
            </div>
          </div>
        </section>

        <section className="ce-banner">
          <div className="ce-banner-overlay" />
          <div className="ce-container ce-banner-content">
            <h2>Ready to book the catering for your event?</h2>
            <Link to="/book" className="ce-btn ce-btn-gold">Book Now</Link>
          </div>
        </section>

        <section className="ce-section ce-testimonial-section" id="testimonials">
          <div className="ce-container">
            <span className="ce-eyebrow">WHAT THEY SAY?</span>
            <h2 className="ce-section-title">Exquisite Catering, <br /><span className="ce-gold">Unforgettable Memories</span></h2>
            <div className="ce-testimonial-wrapper">
              <div className="ce-quote-mark" aria-hidden="true">“</div>
              <article className="ce-testimonial-card">
                <div className="ce-testimonial-content">
                  <h3>{currentTestimonial.headline}</h3>
                  <p>{currentTestimonial.review}</p>
                  <div className="ce-testimonial-footer">
                    <strong>{currentTestimonial.author}</strong>
                    <div className="ce-testimonial-controls">
                      <button type="button" className="ce-arrow-btn" onClick={handlePrevTestimonial} aria-label="Previous testimonial">←</button>
                      <button type="button" className="ce-arrow-btn ce-arrow-btn-gold" onClick={handleNextTestimonial} aria-label="Next testimonial">→</button>
                    </div>
                  </div>
                </div>
                <div className="ce-testimonial-image">
                  <img src={currentTestimonial.image} alt={currentTestimonial.author} />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="ce-section ce-inquiry-section" id="inquiry">
          <div className="ce-container">
            <div className="ce-inquiry-card">
              <h2>Tell Us about your event, so we can give you references about the catering</h2>
              {inquirySent && <div className="ce-alert-success" role="status">Thank you! Your inquiry has been received. We will send tailored catering references shortly.</div>}
              <form className="ce-inquiry-form" onSubmit={handleInquirySubmit}>
                <input type="text" required placeholder="Your name" value={inquiry.name} onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })} />
                <div className="ce-form-row">
                  <input type="tel" required placeholder="Number" value={inquiry.number} onChange={(e) => setInquiry({ ...inquiry, number: e.target.value })} />
                  <input type="email" required placeholder="Email" value={inquiry.email} onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })} />
                </div>
                <select required value={inquiry.eventType} onChange={(e) => setInquiry({ ...inquiry, eventType: e.target.value })}>
                  <option value="">Select your event</option>
                  <option value="wedding">Wedding Reception</option>
                  <option value="birthday">Birthday Celebration</option>
                  <option value="corporate">Corporate Gala</option>
                  <option value="reunion">Family Reunion</option>
                  <option value="anniversary">Anniversary Dinner</option>
                </select>
                <textarea rows={4} required placeholder="Message" value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} />
                <button type="submit" className="ce-btn ce-btn-gold ce-btn-full">Send message</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="ce-footer">
        <div className="ce-container">
          <div className="ce-footer-top">
            <div className="ce-footer-newsletter">
              <h4>Newsletter subscription</h4>
              <p>Receive our seasonal menus &amp; event updates in your inbox</p>
              <form className="ce-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input type="email" required placeholder="Email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} />
                <button type="submit" className="ce-btn ce-btn-gold">Subscribe Now</button>
              </form>
              {subscribed && <small className="ce-subscribed-msg">Subscribed! Thank you for joining CaterEase.</small>}
            </div>
          </div>
          <div className="ce-footer-grid">
            <div>
              <div className="ce-footer-brand"><span className="ce-brand-mark">✳</span> Cater<span className="ce-gold">Ease</span></div>
              <p className="ce-footer-tagline">Beautiful events start with simple planning and unforgettable culinary experiences.</p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#packages">Packages</a></li>
                <li><a href="#chefs">Our Chefs</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4>Customer Support</h4>
              <ul>
                <li><a href="#inquiry">Contact Us</a></li>
                <li><a href="#packages">FAQs</a></li>
                <li><a href="#inquiry">Privacy Policy</a></li>
                <li><a href="#inquiry">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact Information</h4>
              <ul>
                <li>Email: hello@caterease.com</li>
                <li>Phone: +63 (02) 8123-4567</li>
                <li>Address: 123 Celebration Ave, Makati</li>
              </ul>
            </div>
          </div>
          <div className="ce-footer-bottom">
            <span>© 2026 CaterEase. All rights reserved.</span>
            <span>Catering Management System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}