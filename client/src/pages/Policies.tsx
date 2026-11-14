import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, MAPS_URL } from '../lib/contact';

// Policy pages required by Razorpay website verification.
// Review the wording with the business owner — adjust timelines to what you actually offer.

const LAST_UPDATED = '14 November 2026';

function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container narrow section policy">
      <span className="eyebrow">Policies</span>
      <h1>{title}</h1>
      <p className="muted small">Last updated: {LAST_UPDATED}</p>
      {children}
      <hr />
      <p className="small muted">
        This website is operated by <strong>{CONTACT.business}</strong> (C/O {CONTACT.name}), GSTIN {CONTACT.gstin},{' '}
        {CONTACT.address}. Questions? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{' '}
        {CONTACT.phones.map((p) => p.label).join(' / ')}.
      </p>
      <nav className="policy-links">
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/refund-policy">Refund & Cancellation</Link>
        <Link to="/shipping-policy">Shipping & Delivery</Link>
        <Link to="/contact">Contact Us</Link>
      </nav>
    </div>
  );
}

export function Terms() {
  return (
    <PolicyPage title="Terms & Conditions">
      <p>
        Welcome to PottedLeaf. By using this website and placing an order you agree to these terms. "We", "us" and
        "our" refer to {CONTACT.business}; "you" refers to the customer.
      </p>
      <h3>1. Products</h3>
      <p>
        We sell live plants, seeds, pots, planters and gardening tools. Plants are living products: their size, shape,
        colour and number of leaves may vary slightly from the photos. Pot colours may differ slightly due to screen
        settings and handcrafting.
      </p>
      <h3>2. Prices & payment</h3>
      <p>
        All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise. Payments are processed
        securely by Razorpay using UPI, credit cards or debit cards. We do not store your card details. An order is
        confirmed only after the payment succeeds.
      </p>
      <h3>3. Orders</h3>
      <p>
        We may cancel an order if a product is out of stock, a price was displayed incorrectly, or we cannot deliver to
        your address. In that case the full amount is refunded to your original payment method.
      </p>
      <h3>4. Accounts</h3>
      <p>
        You are responsible for keeping your login secure and for the accuracy of the details you provide. We may
        suspend accounts that misuse the website.
      </p>
      <h3>5. Feedback & content</h3>
      <p>
        Feedback you post may be displayed publicly on the website. We may remove content that is offensive, false or
        unrelated.
      </p>
      <h3>6. Liability</h3>
      <p>
        We provide care guidance in good faith, but plant health after delivery depends on care and conditions beyond
        our control. Our liability for any order is limited to the amount paid for that order.
      </p>
      <h3>7. Governing law</h3>
      <p>These terms are governed by the laws of India. Courts in Kanpur, Uttar Pradesh have jurisdiction.</p>
    </PolicyPage>
  );
}

export function Privacy() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>This policy explains what personal information we collect and how we use it.</p>
      <h3>What we collect</h3>
      <ul>
        <li>Account details: name and email address (including when you sign in with Google).</li>
        <li>Order details: delivery address, phone number and the items you buy.</li>
        <li>Feedback you choose to post.</li>
      </ul>
      <p>
        Payment details (card numbers, UPI IDs) are entered on Razorpay's secure checkout and are <strong>never</strong>{' '}
        stored by us.
      </p>
      <h3>How we use it</h3>
      <ul>
        <li>To process, deliver and support your orders.</li>
        <li>To contact you about your order.</li>
        <li>To improve our products and website.</li>
      </ul>
      <h3>Sharing</h3>
      <p>
        We share only what is necessary with service providers who help us run the store: Razorpay (payments), Supabase
        (secure data hosting and login), Google (if you choose Google sign-in) and our delivery partners. We do not sell
        your personal data.
      </p>
      <h3>Cookies & storage</h3>
      <p>We use your browser's storage to keep you logged in and remember your cart. We do not use advertising cookies.</p>
      <h3>Your choices</h3>
      <p>
        You can ask us to view, correct or delete your personal data by emailing{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. Order records may be kept as required by tax law.
      </p>
    </PolicyPage>
  );
}

export function RefundPolicy() {
  return (
    <PolicyPage title="Refund & Cancellation Policy">
      <h3>Cancellations</h3>
      <p>
        You can cancel an order <strong>before it is dispatched</strong> by emailing or calling us with your order
        number. You will receive a full refund. Orders that have already been dispatched cannot be cancelled.
      </p>
      <h3>Damaged or wrong items</h3>
      <p>
        If a plant arrives damaged or dead, or you receive a wrong or broken item, contact us within{' '}
        <strong>48 hours of delivery</strong> with your order number and clear photos of the item and packaging. After
        checking, we will send a free replacement or issue a refund.
      </p>
      <h3>Returns</h3>
      <p>
        Because plants are living and perishable, we do not accept returns of healthy plants or seeds for a change of
        mind. Unused pots and tools in original condition may be returned within 7 days of delivery; return shipping is
        paid by the customer.
      </p>
      <h3>Refund timeline</h3>
      <p>
        Approved refunds are made to the <strong>original payment method</strong> (UPI, credit card or debit card) within{' '}
        <strong>5–7 business days</strong>. Your bank may take a few extra days to show the amount.
      </p>
      <p>
        If an item goes out of stock after you pay, the order is cancelled automatically and a full refund is started
        immediately.
      </p>
    </PolicyPage>
  );
}

export function ShippingPolicy() {
  return (
    <PolicyPage title="Shipping & Delivery Policy">
      <ul>
        <li>
          <strong>Delivery charges:</strong> free on all orders.
        </li>
        <li>
          <strong>Dispatch:</strong> orders are packed and dispatched within 1–3 business days of payment.
        </li>
        <li>
          <strong>Delivery time:</strong> usually 3–7 business days after dispatch, depending on your location. Kanpur and
          nearby areas are usually faster.
        </li>
        <li>
          <strong>Coverage:</strong> we deliver across India through courier partners. If we cannot deliver to your
          pincode, we will cancel the order and refund you in full.
        </li>
        <li>
          <strong>Packaging:</strong> plants are packed in protective, breathable packaging so they arrive healthy.
        </li>
        <li>
          <strong>Delays:</strong> weather, holidays or courier issues can occasionally delay delivery. We will keep you
          informed.
        </li>
      </ul>
      <p>
        For delivery questions, contact us with your order number at{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>
    </PolicyPage>
  );
}

export function Contact() {
  return (
    <PolicyPage title="Contact Us">
      <p>We're happy to help with orders, plant care questions and bulk or office enquiries.</p>
      <ul className="plain-list contact-list">
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
        <li>🕘 Monday – Saturday, 10 am – 7 pm</li>
      </ul>
    </PolicyPage>
  );
}
