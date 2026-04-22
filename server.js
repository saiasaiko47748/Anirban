/**
 * Anirban's Biriyani & Caterers
 * Backend Server – Node.js + Express
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- Simple file-based "database" (swap for MongoDB/MySQL in production) ----
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readDB(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeDB(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ---- API: Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: "Anirban's Biriyani API is running 🍛" });
});

// ---- API: Reservations ----
app.post('/api/reservations', (req, res) => {
  const { fname, lname, phone, email, date, time, guests, location, notes } = req.body;

  if (!fname || !phone || !date || !time || !guests || !location) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }

  const reservation = {
    id: Date.now().toString(),
    name: `${fname} ${lname}`.trim(),
    phone,
    email: email || '',
    date,
    time,
    guests,
    location,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  const reservations = readDB('reservations.json');
  reservations.push(reservation);
  writeDB('reservations.json', reservations);

  console.log(`✅ New Reservation: ${reservation.name} for ${reservation.date} at ${reservation.location}`);

  res.json({
    success: true,
    message: `Reservation confirmed for ${reservation.name} on ${reservation.date}. We'll call you at ${reservation.phone} to confirm.`,
    id: reservation.id
  });
});

app.get('/api/reservations', (req, res) => {
  const reservations = readDB('reservations.json');
  res.json({ success: true, data: reservations, total: reservations.length });
});

// ---- API: Contact Messages ----
app.post('/api/contact', (req, res) => {
  const { name, contact, subject, message } = req.body;

  if (!name || !contact || !message) {
    return res.status(400).json({ success: false, message: 'Name, contact, and message are required.' });
  }

  const msg = {
    id: Date.now().toString(),
    name,
    contact,
    subject: subject || 'General Enquiry',
    message,
    createdAt: new Date().toISOString(),
    read: false
  };

  const messages = readDB('messages.json');
  messages.push(msg);
  writeDB('messages.json', messages);

  console.log(`📩 New Message from: ${msg.name} — ${msg.subject}`);

  res.json({ success: true, message: 'Your message has been received. We will get back to you shortly!' });
});

// ---- API: Catering Enquiries ----
app.post('/api/catering', (req, res) => {
  const { name, phone, email, eventType, guestCount, eventDate, notes } = req.body;

  if (!name || !phone || !eventType) {
    return res.status(400).json({ success: false, message: 'Name, phone, and event type are required.' });
  }

  const enquiry = {
    id: Date.now().toString(),
    name, phone,
    email: email || '',
    eventType,
    guestCount: guestCount || 'Not specified',
    eventDate: eventDate || 'Flexible',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    status: 'new'
  };

  const enquiries = readDB('catering-enquiries.json');
  enquiries.push(enquiry);
  writeDB('catering-enquiries.json', enquiries);

  console.log(`🎉 New Catering Enquiry: ${enquiry.name} — ${enquiry.eventType} for ${enquiry.guestCount} guests`);

  res.json({ success: true, message: 'Catering enquiry received! Our team will contact you within 24 hours.', id: enquiry.id });
});

// ---- API: Menu (served from static data) ----
app.get('/api/menu', (req, res) => {
  const menu = {
    categories: [
      {
        id: 'biryani',
        name: 'Biriyani',
        items: [
          { name: 'Special Mutton Biriyani', price: 350, description: 'Large mutton piece, long-grain Basmati, dum-cooked with aromatic whole spices.', badge: 'Bestseller', inclGST: true },
          { name: 'Mutton Biriyani (Regular)', price: 280, description: 'Classic dum biryani with tender mutton, unlimited rice.' },
          { name: 'Special Chicken Biriyani', price: 220, description: 'Juicy chicken, aromatic Basmati, slow-cooked.' },
          { name: 'Chicken Biriyani (Regular)', price: 180, description: 'Classic chicken dum biryani.' },
          { name: 'Egg Biriyani', price: 120, description: 'Fragrant Basmati with perfectly boiled eggs.' },
          { name: 'Veg Biriyani', price: 100, description: 'Aromatic rice with seasonal vegetables.' },
        ]
      },
      {
        id: 'starters',
        name: 'Starters',
        items: [
          { name: 'Fish Fry', price: 28, description: 'Crispy golden coating, melt-in-the-mouth fish.' },
          { name: 'Chicken Cutlet', price: 60, description: 'Seasoned minced chicken, pan-fried to golden perfection.' },
          { name: 'Egg Chop', price: 35, description: 'Kolkata-style boiled egg chop.' },
          { name: 'Chicken Tikka', price: 180, description: 'Marinated chicken tikka, grilled in tandoor.' },
          { name: 'Mutton Seekh Kebab', price: 160, description: 'Minced mutton seekh skewered and grilled.' },
          { name: 'Prawn Fry', price: 120, description: 'Crispy fried prawns with spiced batter.' },
        ]
      },
      {
        id: 'mains',
        name: 'Main Course',
        items: [
          { name: 'Mutton Kosha', price: 250, description: 'Slow-cooked dry mutton curry, deeply flavourful.', badge: 'Must Try' },
          { name: 'Chicken Kosha', price: 180, description: 'Rich dry-style chicken curry.' },
          { name: 'Mutton Curry', price: 220, description: 'Traditional Bengali-style mutton curry with potato.' },
          { name: 'Chicken Curry', price: 160, description: 'Home-style chicken curry.' },
          { name: 'Egg Curry', price: 80, description: 'Boiled eggs in rich onion-tomato gravy.' },
          { name: 'Dal Fry', price: 60, description: 'Tempered yellow dal with ghee.' },
          { name: 'Paneer Butter Masala', price: 160, description: 'Cottage cheese in creamy tomato gravy.' },
          { name: 'Roti', price: 15, description: 'Freshly made whole wheat roti.' },
          { name: 'Paratha', price: 25, description: 'Freshly made layered paratha.' },
        ]
      },
      {
        id: 'kebabs',
        name: 'Kebabs & Chaap',
        items: [
          { name: 'Malai Chicken Kebab', price: 200, description: 'Soft and creamy malai-marinated chicken.', badge: 'Fan Favourite' },
          { name: 'Reshmi Kebab', price: 180, description: 'Silky smooth chicken with saffron marinade.' },
          { name: 'Chicken Tikka Kebab', price: 180, description: 'Perfectly grilled with signature smoky char.' },
          { name: 'Mutton Boti Kebab', price: 220, description: 'Tender mutton cubes grilled on skewers.' },
          { name: 'Chicken Chaap', price: 180, description: 'Slow-cooked in poppy seed and cashew gravy.' },
          { name: 'Mutton Chaap', price: 240, description: 'Melt-in-mouth mutton in aromatic brown gravy.' },
          { name: 'Tandoori Chicken (Half)', price: 200, description: 'Classic tandoori with charred edges.' },
        ]
      },
      {
        id: 'seafood',
        name: 'Seafood',
        items: [
          { name: 'Fish Fry (Bhetki)', price: 28, description: "Crispy golden Bhetki fillet, Bengal's most beloved." },
          { name: 'Fish Curry', price: 120, description: 'Traditional Bengali fish curry with mustard gravy.' },
          { name: 'Prawn Curry', price: 180, description: 'Juicy prawns in rich golden gravy.' },
          { name: 'Prawn Biriyani', price: 280, description: 'Dum biryani with tiger prawns.' },
        ]
      },
      {
        id: 'desserts',
        name: 'Desserts',
        items: [
          { name: 'Phirni / Firni', price: 60, description: 'Creamy rice pudding set in earthen bowls.', badge: 'Must Have' },
          { name: 'Mishti Doi', price: 40, description: 'Classic Bengali sweet yoghurt.' },
          { name: 'Gulab Jamun', price: 50, description: 'Soft khoya dumplings in rose syrup.' },
          { name: 'Rasmalai', price: 60, description: 'Soft cottage cheese in saffron milk.' },
        ]
      },
      {
        id: 'beverages',
        name: 'Beverages',
        items: [
          { name: 'Lime Soda', price: 40, description: 'Fresh lime, chilled soda, hint of black salt.', badge: 'House Special' },
          { name: 'Mocktails', price: 80, description: 'Seasonal rotating mocktails.' },
          { name: 'Sweet Lassi', price: 50, description: 'Thick chilled yoghurt lassi.' },
          { name: 'Mango Lassi', price: 70, description: 'Alphonso mango blended with creamy yoghurt.' },
          { name: 'Masala Chai', price: 20, description: 'Spiced ginger tea the traditional way.' },
          { name: 'Cold Coffee', price: 60, description: 'Chilled blended coffee with milk.' },
          { name: 'Mineral Water', price: 20, description: 'Chilled bottled mineral water.' },
        ]
      }
    ]
  };
  res.json({ success: true, data: menu });
});

// ---- Admin: Basic stats ----
app.get('/api/admin/stats', (req, res) => {
  const reservations = readDB('reservations.json');
  const messages = readDB('messages.json');
  const enquiries = readDB('catering-enquiries.json');

  res.json({
    success: true,
    stats: {
      totalReservations: reservations.length,
      pendingReservations: reservations.filter(r => r.status === 'pending').length,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => !m.read).length,
      cateringEnquiries: enquiries.length,
      newEnquiries: enquiries.filter(e => e.status === 'new').length
    }
  });
});

// ---- Serve index.html for all other routes (SPA fallback) ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`\n🍛 Anirban's Biriyani & Caterers — Server Started`);
  console.log(`🌐 Running at: http://localhost:${PORT}`);
  console.log(`📂 Serving frontend from: ${path.join(__dirname, '../frontend')}`);
  console.log(`📡 API base: http://localhost:${PORT}/api\n`);
});

module.exports = app;
