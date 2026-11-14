import { Link } from 'react-router-dom';
import { CONTACT, MAPS_URL } from '../lib/contact';

export default function About() {
  return (
    <div className="container narrow section about">
      <span className="eyebrow">Our story</span>
      <h1>Plants grown with patience, delivered with care.</h1>
      <p>
        thePottedLeaf started as a small backyard nursery and grew into a home for hundreds of plant varieties, handcrafted
        pots and the tools that help them thrive. Every plant is nursery-raised, hardened for home conditions and checked
        by hand before it's packed.
      </p>
      <div className="about-grid">
        <div className="card">
          <h3>🌱 Healthy-plant promise</h3>
          <p>If your plant arrives damaged, send us a photo within 48 hours and we'll replace it.</p>
        </div>
        <div className="card">
          <h3>🏺 Pots that breathe</h3>
          <p>Our terracotta is sourced from local potters and fired for strength and airflow.</p>
        </div>
        <div className="card">
          <h3>💬 Real advice</h3>
          <p>Watch our <Link to="/vlogs">vlogs</Link> or message us — we're happy to help you pick the right plant.</p>
        </div>
      </div>
      <h2>Contact us</h2>
      <ul className="plain-list">
        <li>
          🏢 <strong>{CONTACT.business}</strong> (C/O {CONTACT.name})
        </li>
        <li>
          📧 <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </li>
        <li>
          📞{' '}
          {CONTACT.phones.map((p, i) => (
            <span key={p.href}>
              {i > 0 && ' · '}
              <a href={`tel:${p.href}`}>{p.label}</a>
            </span>
          ))}
        </li>
        <li>
          📍{' '}
          <a href={MAPS_URL} target="_blank" rel="noreferrer">
            {CONTACT.address}
          </a>
        </li>
        <li>🧾 GSTIN: {CONTACT.gstin}</li>
      </ul>
    </div>
  );
}
