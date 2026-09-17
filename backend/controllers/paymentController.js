const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { isAdminRole } = require('../utils/roles');

const createRazorpayOrder = async ({ amount, receipt }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: String(receipt),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create Razorpay order');
  }

  return response.json();
};

const buildPhonePeGateway = ({ paymentId, amount }) => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const baseUrl = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!merchantId) {
    return {
      ready: false,
      note: 'Configure PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX, and PHONEPE_BASE_URL to enable live PhonePe checkout.',
    };
  }

  return {
    ready: true,
    note: 'PhonePe ready for live checkout',
    merchantId,
    baseUrl,
    amount: Math.round(Number(amount) * 100),
    merchantTransactionId: paymentId,
    callbackUrl: `${clientUrl}/payment-status?paymentId=${paymentId}`,
    redirectUrl: `${clientUrl}/payment-status?paymentId=${paymentId}`,
  };
};

/**
 * Modular payment layer — ready for Razorpay / Stripe integration.
 * Currently supports creating a payment record and marking it paid (manual/cash).
 */

exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod = 'other' } = req.body;

    if (!bookingId || amount == null) {
      return res.status(400).json({ success: false, message: 'bookingId and amount are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!isAdminRole(req.user.role) && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payment = await Payment.create({
      bookingId,
      amount,
      paymentMethod,
      paymentStatus: 'Pending',
    });

    booking.paymentId = payment._id;
    await booking.save();

    const gateway = {
      provider: paymentMethod,
      ready: false,
      note: 'Gateway not configured yet',
    };

    if (paymentMethod === 'phonepe') {
      const phonepeGateway = buildPhonePeGateway({ paymentId: payment._id.toString(), amount });

      if (!phonepeGateway.ready) {
        gateway.note = phonepeGateway.note;
      } else {
        gateway.ready = true;
        gateway.note = 'PhonePe gateway configuration detected';
        gateway.merchantId = phonepeGateway.merchantId;
        gateway.baseUrl = phonepeGateway.baseUrl;
        gateway.amount = phonepeGateway.amount;
        gateway.merchantTransactionId = phonepeGateway.merchantTransactionId;
        gateway.callbackUrl = phonepeGateway.callbackUrl;
        gateway.redirectUrl = phonepeGateway.redirectUrl;
      }
    }

    if (paymentMethod === 'paytm') {
      gateway.note = 'Configure Paytm merchant credentials and Paytm payment API details to enable live Paytm checkout.';
    }

    if (paymentMethod === 'razorpay') {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(201).json({
          success: true,
          message: 'Payment initiated. Configure Razorpay keys to enable live checkout.',
          payment,
          gateway: {
            ...gateway,
            note: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment to enable Razorpay checkout.',
          },
        });
      }

      try {
        const order = await createRazorpayOrder({
          amount,
          receipt: payment._id.toString(),
        });

        gateway.ready = true;
        gateway.keyId = process.env.RAZORPAY_KEY_ID;
        gateway.orderId = order.id;
        gateway.amount = order.amount;
        gateway.currency = order.currency;
        gateway.note = 'Razorpay order created';
      } catch (error) {
        return res.status(502).json({
          success: false,
          message: 'Failed to create Razorpay order',
          error: error.message,
          payment,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment initiated',
      payment,
      gateway,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { transactionId, gatewayResponse } = req.body;
    const payment = await Payment.findById(req.params.id).populate('bookingId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const booking = payment.bookingId;
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found for this payment' });
    }

    const isAdmin = isAdminRole(req.user.role);
    const isOwner = booking.user && booking.user.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const razorpaySignature = gatewayResponse?.razorpay_signature || req.body.razorpay_signature;
    const razorpayOrderId = gatewayResponse?.razorpay_order_id || req.body.razorpay_order_id;
    const razorpayPaymentId = gatewayResponse?.razorpay_payment_id || req.body.razorpay_payment_id;
    const phonepeSuccess = gatewayResponse?.success ?? req.body.success ?? false;

    if (
      payment.paymentMethod === 'razorpay' &&
      process.env.RAZORPAY_KEY_SECRET &&
      razorpaySignature &&
      razorpayOrderId &&
      razorpayPaymentId
    ) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
      }
    }

    if (payment.paymentMethod === 'phonepe' && !phonepeSuccess) {
      return res.status(400).json({
        success: false,
        message: 'PhonePe payment has not been confirmed yet',
      });
    }

    payment.paymentStatus = 'Paid';
    payment.transactionId = transactionId || razorpayPaymentId || `TXN-${Date.now()}`;
    payment.paidAt = new Date();
    if (gatewayResponse) payment.gatewayResponse = gatewayResponse;
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: 'Paid',
      paymentId: payment._id,
      bookingStatus: 'Confirmed',
    });

    res.json({ success: true, message: 'Payment confirmed', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('bookingId');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'camera', select: 'name brand' },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
