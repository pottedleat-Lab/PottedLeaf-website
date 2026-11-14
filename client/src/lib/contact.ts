// Business contact details — shown on the About page and in the footer.
export const CONTACT = {
  business: 'VM Botanicals',
  name: 'Shalini Gupta',
  gstin: '09BAUPG4039G2ZE',
  email: 'thepottedleafs@gmail.com',
  phones: [
    { label: '+91 98895 06070', href: '+919889506070' },
    { label: '+91 87954 64248', href: '+918795464248' },
  ],
  address: '9/10 White Colony, Dada Nagar, Kanpur, Uttar Pradesh 208022, India',
};

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;
