const ContactMessage = require('../models/ContactMessage');

exports.createContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, subject, email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email and message required',
      });
    }

    const contactMessage = await ContactMessage.create({
      firstName,
      lastName,
      subject,
      email,
      message,
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: subject || 'Contact Form',
        html: `
          <h3>New Contact Message</h3>
          <p><b>Name:</b> ${firstName || ''} ${lastName || ''}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b> ${message}</p>
        `,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message received',
      contactMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markContactMessageRead = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { isRead } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: Boolean(isRead) },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
