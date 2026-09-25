import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { formatCurrency, getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

const BookingPage = () => {
  const { cameraId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    api
      .get(`/cameras/${cameraId}`)
      .then((res) => {
        setCamera(res.data.camera);
        setForm((f) => ({
          ...f,
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || '',
        }));
      })
      .catch(() => toast.error('Camera not found'))
      .finally(() => setLoading(false));
  }, [cameraId, user]);

  const totalDays = useMemo(
    () => calcDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  const totalAmount = useMemo(() => {
    if (!camera || !totalDays) return 0;
    return camera.pricePerDay * totalDays * Number(form.quantity || 1) + camera.securityDeposit;
  }, [camera, totalDays, form.quantity]);

  const phonePeUpiId = useMemo(
    () => import.meta.env.VITE_PHONEPE_UPI_ID || import.meta.env.VITE_UPI_ID || 'camera.booking@upi',
    []
  );

  const paytmUpiId = useMemo(
    () => import.meta.env.VITE_PAYTM_UPI_ID || 'camera.booking@upi',
    []
  );

  const paymentLink = useMemo(() => {
    if (!['online', 'upi'].includes(form.paymentMethod) || !totalAmount) return '';

    const upiId = phonePeUpiId;
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Camera Booking')}&am=${Number(totalAmount).toFixed(2)}&cu=INR`;
  }, [form.paymentMethod, totalAmount, phonePeUpiId]);

  const upiQrUrl = useMemo(() => {
    if (!paymentLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentLink)}`;
  }, [paymentLink]);

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        "script[src='https://checkout.razorpay.com/v1/checkout.js']"
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
      document.body.appendChild(script);
    });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleInstantPayment = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error('Please select dates');
      return;
    }
    if (totalDays < 1) {
      toast.error('End date must be on or after start date');
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      toast.error('Customer details are required');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/bookings', {
        cameraId,
        startDate: form.startDate,
        endDate: form.endDate,
        quantity: Number(form.quantity),
        customerDetails: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        notes: form.notes,
      });

      try {
        const paymentResponse = await api.post('/payments', {
          bookingId: data.booking._id,
          amount: totalAmount,
          paymentMethod: form.paymentMethod,
        });

        if (paymentResponse?.data?.payment?._id) {
          await api.put(`/payments/${paymentResponse.data.payment._id}/confirm`, {
            transactionId: `UPI-${Date.now()}`,
            gatewayResponse: {
              paymentMethod: form.paymentMethod,
              success: true,
            },
          });
        }
      } catch (paymentErr) {
        console.error('Instant payment confirmation failed:', paymentErr);
      }

      if (paymentLink) {
        toast.success('Booking created successfully. UPI payment is being processed.');
        window.location.href = paymentLink;
        return;
      }

      toast.success('Booking created successfully');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Please select dates');
      return;
    }
    if (totalDays < 1) {
      toast.error('End date must be on or after start date');
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      toast.error('Customer details are required');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', {
        cameraId,
        startDate: form.startDate,
        endDate: form.endDate,
        quantity: Number(form.quantity),
        customerDetails: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        notes: form.notes,
      });

      let paymentResponse = null;
      try {
        paymentResponse = await api.post('/payments', {
          bookingId: data.booking._id,
          amount: totalAmount,
          paymentMethod: form.paymentMethod,
        });
      } catch (paymentErr) {
        console.error('Payment initiation failed:', paymentErr);
        toast.warning('Booking created. Payment option was saved but payment entry could not be created.');
      }

      if (form.paymentMethod === 'cash') {
        toast.success('Booking created successfully. Payment will be collected on delivery.');
        navigate('/my-bookings');
        return data;
      }

      if (['online', 'upi'].includes(form.paymentMethod)) {
        const paymentName = form.paymentMethod === 'upi' ? 'UPI' : 'online';
        toast.success(`Booking created successfully. ${paymentName} payment is processing.`);
        if (paymentLink) {
          window.location.href = paymentLink;
        } else {
          navigate('/my-bookings');
        }
        return data;
      }

      toast.success('Booking created successfully');
      navigate('/my-bookings');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader full />;
  if (!camera) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-4">Book Camera</h1>
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <img
              src={getImageUrl(camera.images?.[0])}
              className="card-img-top"
              alt={camera.name}
              style={{ height: 220, objectFit: 'cover' }}
            />
            <div className="card-body">
              <h5>{camera.name}</h5>
              <p className="text-muted small mb-2">
                {camera.brand} · {camera.model}
              </p>
              <p className="mb-1">
                <strong>{formatCurrency(camera.pricePerDay)}</strong> / day
              </p>
              <p className="mb-0 small text-muted">
                Deposit: {formatCurrency(camera.securityDeposit)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="mb-3">Rental Details</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={today}
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={form.startDate || today}
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={camera.stock || 1}
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    required
                  />
                </div>
              </div>

              <h5 className="mb-3">Customer Details</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-light rounded p-3 mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span>Booking days</span>
                  <strong>{totalDays || '—'}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Rental ({formatCurrency(camera.pricePerDay)} × {totalDays || 0} × {form.quantity})</span>
                  <strong>
                    {formatCurrency(camera.pricePerDay * (totalDays || 0) * Number(form.quantity || 1))}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Security deposit</span>
                  <strong>{formatCurrency(camera.securityDeposit)}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between fs-5">
                  <span>Total</span>
                  <strong className="text-primary">{formatCurrency(totalAmount)}</strong>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Payment Method</label>
                <div className="row g-2">
                  {[
                    { value: 'cash', label: 'Cash on Delivery' },
                    { value: 'online', label: 'Cash on Forward (Online)' },
                    { value: 'upi', label: 'UPI' },
                  ].map((option) => (
                    <div className="col-md-6 col-xl-4" key={option.value}>
                      <label className="border rounded p-2 d-flex align-items-center gap-2 h-100 mb-0">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.value}
                          checked={form.paymentMethod === option.value}
                          onChange={(e) => set('paymentMethod', e.target.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {['online', 'upi'].includes(form.paymentMethod) && (
                <div className="alert alert-info border-0 shadow-sm mb-4">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                      <h6 className="mb-1">
                        {form.paymentMethod === 'upi' ? 'Pay with UPI' : 'Pay Online'}
                      </h6>
                      <small className="text-muted">
                        {form.paymentMethod === 'upi'
                          ? `Scan the QR code or tap the UPI button below to pay ${formatCurrency(totalAmount)}.`
                          : `Pay online for cash-on-forward booking of ${formatCurrency(totalAmount)}.`}
                      </small>
                    </div>
                    <div className="text-end">
                      <small className="d-block text-muted">UPI ID</small>
                    </div>
                  </div>
                  {upiQrUrl && (
                    <div className="mt-3 d-flex flex-column flex-md-row align-items-center gap-3 justify-content-center justify-content-md-start">
                      <img
                        src={upiQrUrl}
                        alt="UPI QR code"
                        className="rounded border bg-white p-2"
                        style={{ width: 220, height: 220, objectFit: 'contain' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={submitting}
                        onClick={handleInstantPayment}
                      >
                        {submitting ? 'Booking...' : 'Pay via UPI'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!['online', 'upi'].includes(form.paymentMethod) && (
                <button type="submit" className="btn btn-warning btn-lg px-4" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
