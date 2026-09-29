import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { formatCurrency, getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import {
  UPI_PROVIDERS,
  buildUpiPaymentLink,
  getUpiProviderConfig,
  shouldAllowDirectBookingConfirmation,
  shouldShowUpiPaymentSelector,
} from '../../utils/upiPayment';

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      reject(new Error('Could not load Razorpay checkout. Check your internet connection.'));
    };
    document.body.appendChild(script);
  });

const BookingPage = () => {
  const { cameraId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [selectedUpiProvider, setSelectedUpiProvider] = useState('phonepe');
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

  useEffect(() => {
    if (!cameraId || !form.startDate || !form.endDate) {
      setAvailability(null);
      return undefined;
    }

    if (form.endDate < form.startDate) {
      setAvailability({ available: false, message: 'End date must be on or after start date.' });
      return undefined;
    }

    const controller = new AbortController();
    setAvailability({ loading: true });
    api
      .get('/bookings/check-availability', {
        params: { cameraId, startDate: form.startDate, endDate: form.endDate },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setAvailability({ available: data.available });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability({ error: true });
      });

    return () => controller.abort();
  }, [cameraId, form.startDate, form.endDate]);

  const totalDays = useMemo(
    () => calcDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  const totalAmount = useMemo(() => {
    if (!camera || !totalDays) return 0;
    return camera.pricePerDay * totalDays * Number(form.quantity || 1) + camera.securityDeposit;
  }, [camera, totalDays, form.quantity]);

  const selectedUpiConfig = useMemo(
    () => getUpiProviderConfig(selectedUpiProvider, import.meta.env),
    [selectedUpiProvider]
  );

  const paymentLink = useMemo(() => {
    if (form.paymentMethod !== 'upi' || !totalAmount) return '';

    return buildUpiPaymentLink({
      provider: selectedUpiProvider,
      amount: totalAmount,
      label: 'Camera Booking',
      env: import.meta.env,
    });
  }, [form.paymentMethod, selectedUpiProvider, totalAmount]);

  const upiQrUrl = useMemo(() => {
    if (!paymentLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentLink)}`;
  }, [paymentLink]);

  const set = (key, value) => {
    if (key === 'startDate' || key === 'endDate') setAvailability(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleOnlinePayment = async () => {
    if (availability?.loading || availability?.available === false) {
      toast.error(availability?.loading ? 'Checking date availability...' : availability.message || 'Camera is already booked for the selected dates');
      return;
    }
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
    let bookingId;
    let paymentId;
    let checkoutCancelled = false;
    let gatewayPaymentCompleted = false;
    const cancelCheckout = async () => {
      if (checkoutCancelled) return;
      checkoutCancelled = true;
      try {
        if (paymentId) {
          await api.put(`/payments/${paymentId}/cancel`);
        } else if (bookingId) {
          await api.put(`/bookings/${bookingId}`, { bookingStatus: 'Cancelled' });
        }
      } catch (cancelError) {
        console.error('Could not cancel pending checkout:', cancelError);
      }
    };

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
      bookingId = data.booking._id;

      const { data: paymentData } = await api.post('/payments', {
        bookingId,
        paymentMethod: 'razorpay',
      });
      paymentId = paymentData.payment._id;

      if (!paymentData.gateway?.ready || !paymentData.gateway.keyId || !paymentData.gateway.orderId) {
        throw new Error(paymentData.gateway?.note || 'Online payment is not available right now.');
      }

      await loadRazorpayCheckout();
      await new Promise((resolve, reject) => {
        let checkoutFinished = false;
        const checkout = new window.Razorpay({
          key: paymentData.gateway.keyId,
          amount: paymentData.gateway.amount,
          currency: paymentData.gateway.currency || 'INR',
          name: 'LensHire',
          description: `Camera booking: ${camera.name}`,
          order_id: paymentData.gateway.orderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          notes: { bookingId },
          theme: { color: '#167d66' },
          handler: async (response) => {
            gatewayPaymentCompleted = true;
            checkoutFinished = true;
            try {
              await api.put(`/payments/${paymentId}/confirm`, { gatewayResponse: response });
              resolve();
            } catch (confirmError) {
              reject(new Error(confirmError.response?.data?.message || 'Payment was received but could not be verified. Contact support.'));
            }
          },
          modal: {
            ondismiss: async () => {
              if (checkoutFinished) return;
              checkoutFinished = true;
              await cancelCheckout();
              reject(new Error('Payment was cancelled. No amount was charged.'));
            },
          },
        });

        checkout.on('payment.failed', async (response) => {
          if (checkoutFinished) return;
          checkoutFinished = true;
          await cancelCheckout();
          reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
        });
        checkout.open();
      });

      toast.success('Payment successful. Your booking is confirmed.');
      navigate('/my-bookings');
      return data;
    } catch (err) {
      if (!gatewayPaymentCompleted) await cancelCheckout();
      toast.error(err.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUPIPayment = () => {
    if (!paymentLink) {
      toast.error('Please select a UPI app or configure the UPI ID.');
      return;
    }

    window.location.href = paymentLink;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availability?.loading || availability?.available === false) {
      toast.error(availability?.loading ? 'Checking date availability...' : availability.message || 'Camera is already booked for the selected dates');
      return;
    }
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
        await api.post('/payments', {
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

      if (form.paymentMethod === 'online') {
        toast.success('Booking created successfully. Online payment is confirmed.');
        navigate('/my-bookings');
        return data;
      }

      if (form.paymentMethod === 'upi') {
        toast.success(`Booking created successfully. ${selectedUpiConfig.label} payment is ready.`);
        navigate('/my-bookings');
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
                {availability?.loading && (
                  <div className="col-12">
                    <div className="alert alert-info mb-0" role="status">Checking date availability...</div>
                  </div>
                )}
                {availability?.available && (
                  <div className="col-12">
                    <div className="alert alert-success mb-0" role="status">These dates are available.</div>
                  </div>
                )}
                {availability?.available === false && (
                  <div className="col-12">
                    <div className="alert alert-danger mb-0" role="alert">
                      {availability.message || 'Camera is already booked for the selected dates. Please choose different dates.'}
                    </div>
                  </div>
                )}
                {availability?.error && (
                  <div className="col-12">
                    <div className="alert alert-warning mb-0" role="status">
                      Could not check dates now. Availability will be verified when you submit the booking.
                    </div>
                  </div>
                )}
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
                    { value: 'online', label: 'Online Payment' },
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

              {form.paymentMethod === 'online' && (
                <div className="alert alert-primary border-0 shadow-sm mb-4">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                      <h6 className="mb-1">Pay online</h6>
                      <small className="text-muted">
                        Secure checkout will open to complete payment by card, UPI or net banking.
                      </small>
                    </div>
                    <span className="badge bg-primary rounded-pill fs-6">{formatCurrency(totalAmount)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg mt-3 w-100"
                    onClick={handleOnlinePayment}
                    disabled={submitting || availability?.loading || availability?.available === false}
                  >
                    {submitting ? 'Opening secure checkout...' : 'Continue to payment'}
                  </button>
                </div>
              )}

              {shouldShowUpiPaymentSelector(form.paymentMethod) && (
                <div className="alert alert-info border-0 shadow-sm mb-4">
                  <div className="d-flex flex-column gap-2 mb-3">
                    <h6 className="mb-1">Choose a UPI app</h6>
                    <small className="text-muted">
                      Select a preferred UPI app and complete payment for {formatCurrency(totalAmount)}.
                    </small>
                  </div>

                  <div className="row g-3 mb-3">
                    {UPI_PROVIDERS.map((option) => (
                      <div className="col-md-6 col-xl-4" key={option.value}>
                        <button
                          type="button"
                          className={`btn w-100 h-100 text-start ${
                            selectedUpiProvider === option.value ? 'btn-primary' : 'btn-outline-secondary'
                          }`}
                          style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                            minHeight: 72,
                          }}
                          onClick={() => setSelectedUpiProvider(option.value)}
                        >
                          <span className="d-flex align-items-center gap-3">
                            <img
                              src={option.logoUrl}
                              alt={option.label}
                              onError={(event) => {
                                event.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(option.fallbackSvg)}`;
                              }}
                              style={{
                                width: 46,
                                height: 46,
                                objectFit: 'contain',
                                borderRadius: 12,
                                background: option.logoBackground || '#ffffff',
                                padding: option.logoPadding || 8,
                                border: `1px solid ${option.logoBorder || 'rgba(15, 23, 42, 0.08)'}`,
                                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
                                display: 'block',
                              }}
                            />
                            <span>{option.label}</span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {upiQrUrl && (
                    <div className="mt-3 d-flex flex-column flex-md-row align-items-center gap-3 justify-content-center justify-content-md-start">
                      <img
                        src={upiQrUrl}
                        alt={`${selectedUpiConfig.label} QR code`}
                        className="rounded border bg-white p-2"
                        style={{ width: 220, height: 220, objectFit: 'contain' }}
                      />
                      <button type="button" className="btn btn-primary btn-lg" onClick={handleUPIPayment}>
                        Pay via {selectedUpiConfig.label}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {shouldAllowDirectBookingConfirmation(form.paymentMethod) && (
                <button
                  type="submit"
                  className="btn btn-warning btn-lg px-4"
                  disabled={submitting || availability?.loading || availability?.available === false}
                >
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