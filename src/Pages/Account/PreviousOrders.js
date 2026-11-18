import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PreviousOrders = () => {
  const URL = 'https://talabatak-ebon.vercel.app';
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrev = async () => {
      try {
        const token = localStorage.getItem('token');
        let apiOrders = [];

        // 1- من الباك اند
        if (token) {
          try {
            const res = await axios.get(`${URL}/api/orders/my-orders`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            apiOrders = res.data.data || res.data || [];
          } catch (e) { console.log(e); }
        }

        // 2- من اللوكال ستورج (الطريقة القديمة اللي كنت عاملها)
        const localOrder = localStorage.getItem('talabatk_last_order');
        if (localOrder) {
          const parsed = JSON.parse(localOrder);
          // حوله لشكل اوردر
          if (apiOrders.length === 0) {
            apiOrders = [{
              _id: 'local_' + Date.now(),
              store: { name: parsed.storeName },
              totalOrder: parsed.total,
              deliveryFee: 15,
              status: 'delivered',
              createdAt: parsed.date,
              orderItems: Object.keys(parsed.items).map(id => ({ quantity: parsed.items[id] }))
            }];
          }
        }

        setOrders(apiOrders);
      } finally {
        setLoading(false);
      }
    };
    fetchPrev();
  }, []);

  const getStatus = (s) => {
    if (s === 'delivered') return { text: 'تم التوصيل', cls: 'delivered' };
    if (s === 'cancelled') return { text: 'ملغي', cls: 'cancelled' };
    return { text: 'مكتمل', cls: 'delivered' };
  };

  if (loading) return <div className="text-center p-5">جاري تحميل الطلبات السابقة...</div>;

  return (
    <div className="prev-wrapper" dir="rtl">
      <div className="container">
        <div className="row justify-content-center">
          {/* ده اللي انت عايزه col col-md col-lg */}
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            
            <h4 className="fw-bold mb-3">الطلبات السابقة</h4>

            {orders.length === 0 ? (
              <div className="prev-empty">
                <div className="col-12 text-center py-5">
                  <p className="text-muted">لسه معملتش اي طلب</p>
                  <button className="btn btn-main" onClick={() => navigate('/')}>اطلب دلوقتي</button>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {orders.map(order => {
                  const st = getStatus(order.status);
                  return (
                    <div className="col-12 col-md-6 col-lg-6" key={order._id}>
                      <div className="prev-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="store-name">{order.store?.name || order.store?.storeName || 'aldywan'}</span>
                          <span className={`status-badge ${st.cls}`}>{st.text}</span>
                        </div>

                        <div className="mt-2 small text-muted">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG')} - {new Date(order.createdAt).toLocaleTimeString('ar-EG').slice(0,5)}
                        </div>

                        <div className="d-flex justify-content-between align-items-end mt-3">
                          <div>
                            <div className="small text-muted">الاجمالي</div>
                            <div className="price">{order.totalOrder} جنيه</div>
                          </div>
                          <button className="btn btn-reorder" onClick={() => navigate(`/store/${order.store?.storeId || 'aldywan'}/products`)}>
                            اعادة الطلب
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviousOrders;
