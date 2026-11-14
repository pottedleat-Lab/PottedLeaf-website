// Business contact details — shown on the About page and in the footer.
export const CONTACT = {
  name: 'Shalini Gupta',
  email: 'thepottedleafs@gmail.com',
  phone: '+91 98385 06070',
  phoneHref: '+919838506070',
  address: 'Labour Colony, Dada Nagar, Kanpur, Uttar Pradesh, India',
};

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;
