import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AccountPage = () => {
  const URL = 'https://talabatak-ebon.vercel.app';
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('account');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [registering, setRegistering] = useState(false);

  const getUserFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return payload;
    } catch (error) {
      localStorage.removeItem("token");
      return null;
    }
  };

  const fetchData = async (decoded) => {
    try {
      const token = localStorage.getItem('token');
      const phone = localStorage.getItem('userPhone');
      if (!token || !decoded) return;

      const userRes = await axios.get(`${URL}/api/register/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {
        return { data: { name: localStorage.getItem('name') || 'مستخدم طلباتك', phone } };
      });
      setUser(userRes.data.data || userRes.data);

      const orderRes = await axios.get(`${URL}/api/order/myOrder/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orderRes.data.data || orderRes.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const decoded = getUserFromToken();
    console.log(decoded, "decoded");
    if (!decoded) {
      setStep('register');
      setLoading(false);
    } else {
      setStep('account');
      fetchData(decoded);
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (fullName.trim().split(/\s+/).length < 3) return alert('الاسم لازم ثلاثي');
    if (!regPhone) return alert('دخل رقم التلفون');
    setRegistering(true);
    try {
      const res = await axios.post(`${URL}/api/register`, { name: fullName, phone: regPhone });
      const token = res.data.token || res.data.data?.token;
      if (!token) return alert('في مشكلة في التسجيل');
      localStorage.setItem('token', token);
      localStorage.setItem('userPhone', regPhone);
      localStorage.setItem('name', fullName);
      const decoded = getUserFromToken();
      setStep('account');
      setLoading(true);
      fetchData(decoded);
    } catch (err) {
      console.log(err);
      alert('في مشكلة في التسجيل');
    } finally {
      setRegistering(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('name');
    localStorage.removeItem('userName');
    localStorage.removeItem('talabat_cart');
    localStorage.removeItem('talabat_cart_total');
    window.dispatchEvent(new Event('storage'));
    setUser(null);
    setOrders([]);
    setStep('register');
    setFullName('');
    setRegPhone('');
  };

  if (loading) return <div className="text-center p-5">جاري التحميل...</div>;

  // لو مش مسجل -> فورم التسجيل في نفس صفحة الأكونت
  if (step === 'register') {
    return (
      <div className="account-wrapper" dir="rtl">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-11 col-md-8 col-lg-5">
              <div className="account-card text-center py-5">
                <i className="bi bi-person-circle account-icon"></i>
                <h3 className="mt-3">انت مش مسجل دخول</h3>
                <p className="text-muted">سجل عشان تشوف طلباتك</p>
                <form onSubmit={handleRegister} className="text-start mt-3">
                  <input
                    className="form-control mb-2"
                    placeholder="الاسم ثلاثي"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <input
                    className="form-control mb-2"
                    placeholder="رقم التليفون"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                  <button className="btn btn-checkout w-100 mt-2" type="submit" disabled={registering}>
                    {registering ? 'جاري التسجيل...' : 'سجل دخول'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // لو مسجل -> صفحة الأكونت بتاعتك زي ما هي
  return (
    <div className="account-wrapper" dir="rtl">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-7 col-xl-6">
            <div className="account-card mb-4">
              <div className="d-flex align-items-center">
                <div className="avatar-circle">
                  {(user?.name || localStorage.getItem("name") || 'ط').charAt(0)}
                </div>
                <div className="me-3">
                  <h5 className="m-0 fw-bold">{user?.name || localStorage.getItem('name') || 'مستخدم طلباتك'}</h5>
                  <p className="m-0 text-muted phone-text">{user?.phone || localStorage.getItem('userPhone')}</p>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="stat-card text-center">
                  <h4 className="fw-bold m-0">{orders.length}</h4>
                  <small className="text-muted">عدد الطلبات</small>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card text-center">
                  <h4 className="fw-bold m-0">{orders.reduce((s, o) => s + (o.totalOrder || 0), 0)} ج.م</h4>
                  <small className="text-muted">اجمالي المشتريات</small>
                </div>
              </div>
            </div>

            <div className="account-card mb-4 p-0">
              <div className="list-group list-group-flush">
                <button className="list-item" onClick={() => navigate('/cart')}>
                  <span><i className="bi bi-bag-check ms-2"></i> طلباتي</span>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button className="list-item">
                  <span><i className="bi bi-geo-alt ms-2"></i> لتواصل</span>
                  <i className="bi bi-chevron-left fa-solid fa-phone"> 01023892300 </i>
                </button>
                <a className="list-item bi-whatsapp" href='https://wa.me/201153800576' target="_blank" rel="noreferrer">
                  <span>للشكاوى والدعم </span>
                  <i className="bi bi-whatsapp"></i>
                </a>
                <a className="list-item" href='https://www.facebook.com/profile.php?id=61596640550256' target="_blank" rel="noreferrer">
                  <span><i className="bi bi-headset ms-2"></i>فيسبوك</span>
                  <i className="bi bi-chevron-left"></i>
                </a>
              </div>
            </div>

            <button className="btn btn-logout w-100" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right ms-2"></i> تسجيل خروج
            </button>

            <div className="text-center mt-4 text-muted">
              <small>Talabatk v1.0</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;