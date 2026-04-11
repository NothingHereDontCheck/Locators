require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Contact / Lead form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, city, budget, moveDate, bedrooms, message } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
  }

  // Optional: send email notification via nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
        subject: `New Lead from Metro Locators – ${name}`,
        html: `
          <h2>New Apartment Locator Lead</h2>
          <table cellpadding="8" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
            <tr><td><strong>City</strong></td><td>${city || 'N/A'}</td></tr>
            <tr><td><strong>Budget</strong></td><td>${budget || 'N/A'}</td></tr>
            <tr><td><strong>Move Date</strong></td><td>${moveDate || 'N/A'}</td></tr>
            <tr><td><strong>Bedrooms</strong></td><td>${bedrooms || 'N/A'}</td></tr>
            <tr><td><strong>Message</strong></td><td>${message || 'N/A'}</td></tr>
          </table>
        `,
      });
    } catch (err) {
      console.error('Email error:', err.message);
    }
  }

  console.log('New lead:', { name, email, phone, city, budget, moveDate, bedrooms });
  res.json({ success: true, message: 'Thanks! A locator will reach out within 24 hours.' });
});

// Featured listings API (static seed data — replace with DB later)
app.get('/api/listings', (req, res) => {
  const listings = [
    {
      id: 1,
      name: 'Skyline at Midtown',
      city: 'Atlanta, GA',
      price: '$1,250 – $2,100',
      beds: '1–3 Beds',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
      tag: 'Featured',
      amenities: ['Pool', 'Gym', 'Concierge'],
    },
    {
      id: 2,
      name: 'Ponce City Flats',
      city: 'Atlanta, GA',
      price: '$1,450 – $2,800',
      beds: 'Studio – 2 Beds',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
      tag: 'Hot Deal',
      amenities: ['Rooftop', 'Dog Park', 'EV Charging'],
    },
    {
      id: 3,
      name: 'Perimeter Park Residences',
      city: 'Dunwoody, GA',
      price: '$1,100 – $1,900',
      beds: '1–2 Beds',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      tag: 'Move-In Special',
      amenities: ['Gated', 'Gym', 'Business Center'],
    },
    {
      id: 4,
      name: 'Buckhead Commons',
      city: 'Buckhead, GA',
      price: '$1,700 – $3,200',
      beds: '1–3 Beds',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      tag: 'Luxury',
      amenities: ['Spa', 'Valet', 'Wine Cellar'],
    },
    {
      id: 5,
      name: 'The Grant at Sandy Springs',
      city: 'Sandy Springs, GA',
      price: '$1,200 – $2,000',
      beds: '1–2 Beds',
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80',
      tag: 'New Build',
      amenities: ['Pool', 'Coworking', 'Courtyard'],
    },
    {
      id: 6,
      name: 'East Atlanta Village Lofts',
      city: 'East Atlanta, GA',
      price: '$950 – $1,750',
      beds: 'Studio – 2 Beds',
      image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&q=80',
      tag: 'Best Value',
      amenities: ['Pet-Friendly', 'Gym', 'Bike Storage'],
    },
  ];

  const { city, beds, budget } = req.query;
  let results = listings;

  if (city) results = results.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
  if (beds) results = results.filter(l => l.beds.toLowerCase().includes(beds.toLowerCase()));

  res.json({ success: true, listings: results });
});

app.listen(PORT, () => {
  console.log(`Metro Locators running at http://localhost:${PORT}`);
});
