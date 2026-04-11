require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const LISTINGS_PATH = path.join(__dirname, 'src', 'listings.json');
const ALL_LISTINGS = JSON.parse(fs.readFileSync(LISTINGS_PATH, 'utf8'));
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'j_rainey@outlook.com';

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
        to: NOTIFY_EMAIL,
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
  const { city, beds } = req.query;
  let results = [...ALL_LISTINGS];

  if (city) results = results.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
  if (beds) results = results.filter(l => l.beds.toLowerCase().includes(beds.toLowerCase()));

  res.json({ success: true, listings: results });
});

app.listen(PORT, () => {
  console.log(`Metro Locators running at http://localhost:${PORT}`);
});
