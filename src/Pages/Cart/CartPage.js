import axios from 'axios';
import React, { useEffect, useState } from 'react'

const CartPage = () => {
  const URL='https://talabatak-ebon.vercel.app'
  const [productsDetails, setProductsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [storeOrdered,setStoreOrdered]=useState("")
  const CART_KEY = 'talabat_cart';

  const [cartData, setCartData] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : { storeId: null, storeName: null, items: {} };
    } catch {
      return { storeId: null, storeName: null, items: {} };
    }
  });

  console.log(cartData,"cartData");
  const getNameStore=async()=>{
    if(!cartData.storeDbId) return
    const getData=await axios.get(`${URL}/api/store/${cartData.storeDbId}`)
    const resData=getData.data.data
    setStoreOrdered(resData)
  }

  useEffect(()=>{
    getNameStore()
  },[])
  

  const [step, setStep] = useState('cart');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  const token=localStorage.getItem("token")
  let decoded=null
  try{
    if(token){
      const payload=token.split(".")[1]
   decoded=JSON.parse(atob(payload))
    }
  }catch(e){
    decoded=null
  }
  
  // --- الجديد: تحويل السلة لسطور، كل سطر = منتج + حجم ---
  // cartKey = productId أو productId__size
  const getCartLines = () => {
    return Object.entries(cartData.items).map(([cartKey, qty]) => {
      const [pid, size] = cartKey.split('__')
      const product = productsDetails.find(p => (p._id || p.id) == pid)
      if (!product) return null
      const variant = size ? product.variants?.find(v => v.size === size) : null
      const unitPrice = Number(variant?.priceAfterDiscount || variant?.price || product.price)
      return { cartKey, pid, product, variant, size, qty, unitPrice }
    }).filter(Boolean)
  }
  const cartLines = getCartLines()

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (!cartData.storeId || Object.keys(cartData.items).length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${URL}/api/store/${cartData.storeId}/products`);
        const allProducts = res.data.data;
        // هات المنتجات اللي الـ id بتاعها موجود في أي مفتاح سلة
        const idsInCart = Object.keys(cartData.items).map(k => k.split('__')[0])
        const inCart = allProducts.filter(p => {
          const pid = p._id || p.id;
          return idsInCart.includes(String(pid));
        });
        setProductsDetails(inCart);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCartProducts();
  }, [cartData]);

  useEffect(()=>{
    if(step === 'checkout'){
      const fetchZones = async()=>{
        try{
          const res = await axios.get(`${URL}/api/location`, { params: { storeId: cartData.storeId } });
          setZones(res.data.data || res.data);
        }catch(e){
          console.log(e);
        }
      }
      fetchZones();
      setPhone(localStorage.getItem('userPhone') || '');
    }
  },[step]);

  const updateQty = (cartKey, delta) => {
    setCartData(prev => {
      const newItems = { ...prev.items };
      const currentQty = newItems[cartKey] || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        delete newItems[cartKey];
      } else {
        newItems[cartKey] = newQty;
      }
      if (Object.keys(newItems).length === 0) {
        const empty = { storeId: null, storeName: null, items: {} };
        localStorage.setItem(CART_KEY, JSON.stringify(empty));
        window.dispatchEvent(new Event('storage'));
        return empty;
      }
      const updated = { ...prev, items: newItems };
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return updated;
    });
  };

  const clearCart = () => {
    const empty = { storeId: null, storeName: null, items: {} };
    setCartData(empty);
    localStorage.setItem(CART_KEY, JSON.stringify(empty));
    localStorage.removeItem("talabat_cart_total");
    window.dispatchEvent(new Event('storage'));
  };

  const subtotal = cartLines.reduce((acc, line) => acc + (line.unitPrice * line.qty), 0);

  useEffect(()=>{
    localStorage.setItem("talabat_cart_total", subtotal);
    window.dispatchEvent(new Event("storage"));
  },[subtotal])

  const deliveryFee = selectedZone?.fee || selectedZone?.price || 0;
  const total = subtotal + deliveryFee;
  const itemsCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

   const handleRegister = async() => {
    if(fullName.trim().split(/\s+/).length < 3) return alert('الاسم لازم ثلاثي');
    if(!regPhone) return alert('دخل رقم التلفون');
    try{
      const res = await axios.post(`${URL}/api/register`, { name: fullName, phone: regPhone });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userPhone', regPhone);
      localStorage.setItem('name', fullName);
      setStep('checkout');
    }catch(err){
      localStorage.setItem('token', 'temp_token');
      localStorage.setItem('userPhone', regPhone);
      setStep('checkout');
    }
  };

  const handleCreateOrder = async () => {
    if(!address || !phone || !selectedZone) return alert('كمل البيانات');
    try {
      setOrdering(true);
      const token = localStorage.getItem('token');
      let realStoreId = cartData.storeDbId

      // جهز المنتجات - مع الحجم
      const orderItems = cartLines.map(line => ({
        product: line.pid,
        quantity: line.qty,
        price: Number(line.unitPrice),
        variant: line.size || undefined,
        size: line.size || undefined,
        name: line.size ? `${line.product.name} - ${line.size}` : line.product.name
      }));

      const { data } = await axios.post(`${URL}/api/order`, {
        store: realStoreId,
        user:decoded.id,
        orderItems,
        totalOrder: total,
        deliveryFee: deliveryFee,
        address,
        phone,
        status:"pending",
        location: selectedZone._id || selectedZone.id
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      alert(`تم الطلب بنجاح من ${storeOrdered.name} بقيمة ${total} جنيه انتظر مكالمة خلال دقائق `);
      clearCart();
      setStep('cart');
    } catch(err) {
      console.log(err.response?.data || err);
      alert(err.response?.data?.message || "فشل ارسال الطلب");
    } finally {
      setOrdering(false);
    }
  }

  if (loading) return <div className="cart-container text-center p-5">جاري تحميل السلة...</div>;

  if (itemsCount === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-container text-center py-5">
          <h3>السلة فاضية</h3>
          <p className="text-muted">ضيف منتجات من المتاجر</p>
          <a href="/" className="btn btn-checkout mt-3">تصفح المتاجر</a>
        </div>
      </div>
    );
  }

  if(step === 'register'){
    return (
      <div className="cart-page-wrapper">
        <div className="cart-container">
          <h2 className="cart-title mb-4">التسجيل</h2>
          <input className="form-control mb-3 p-3" placeholder="الاسم ثلاثي" value={fullName} onChange={e=>setFullName(e.target.value)} />
          <input className="form-control mb-3 p-3" placeholder="رقم التلفون" value={regPhone} onChange={e=>setRegPhone(e.target.value)} />
          <button className="btn btn-checkout w-100" onClick={handleRegister}>متابعة</button>
          <button className="btn w-100 mt-2" onClick={()=>setStep('cart')}>رجوع للسلة</button>
        </div>
      </div>
    )
  }

  if(step === 'checkout'){
    return (
      <div className="cart-page-wrapper">
        <div className="cart-container">
          <h2 className="cart-title mb-4">متابعة الطلب</h2>
          <input className="form-control mb-3 p-3" placeholder="العنوان" value={address} onChange={e=>setAddress(e.target.value)} />
          <input className="form-control mb-3 p-3" placeholder="رقم التلفون" value={phone} onChange={e=>setPhone(e.target.value)} />
          
          <select className="form-select mb-3 p-3 text-center" value={selectedZone?._id || selectedZone?.id || ""} onChange={e=> setSelectedZone(zones.find(z=> (z._id || z.id) == e.target.value))}>
            <option value="">اختر المنطقة</option>
            {zones.map(z=> <option key={z._id || z.id} value={z._id || z.id}>{z.name} - {z.fee || z.price} جنيه</option>)}
          </select>

          <div className="summary-card card border-0 shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2"><span>المجموع</span><span>{subtotal} جنيه</span></div>
              <div className="d-flex justify-content-between mb-3"><span>رسوم التوصيل</span><span>{deliveryFee} جنيه</span></div>
              <div className="d-flex justify-content-between total-row pt-3"><span className="fw-bold">الإجمالي</span><span className="total-price fw-bold">{total} جنيه</span></div>
            </div>
          </div>

          <button className="btn btn-checkout w-100 mt-4" onClick={handleCreateOrder} disabled={ordering}>
            {ordering ? "جاري الارسال..." : `اتمام الطلب - ${total} جنيه`}
          </button>
          <button className="btn w-100 mt-2" onClick={()=>setStep('cart')}>رجوع للسلة</button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page-wrapper">
      <div className="cart-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="cart-title m-0">سلة التسوق</h2>
          <button className="btn-delete" onClick={clearCart}><i className="bi bi-trash"></i> مسح</button>
        </div>

        <p className="store-name-badge">بتطلب من: {storeOrdered.name}</p>
        <p className="cart-count">{itemsCount} عناصر</p>

        {cartLines.map(line => {
          return (
            <div className="cart-item card border-0 shadow-sm mb-3" key={line.cartKey}>
              <div className="card-body d-flex align-items-center">
                <img src={line.product.img || line.product.image} alt={line.product.name} className="cart-img" />
                <div className="flex-grow-1 me-3">
                  <h5 className="item-name mb-1">{line.product.name} {line.size ? `- ${line.size}` : ''}</h5>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="item-price">{line.unitPrice} جنيه {line.qty > 1 ? `x ${line.qty} = ${line.unitPrice * line.qty}` : ''}</span>
                    <div className="qty-control">
                      <button className="qty-btn qty-plus" onClick={() => updateQty(line.cartKey, 1)}>+</button>
                      <span className="qty-num">{line.qty}</span>
                      <button className="qty-btn qty-minus" onClick={() => updateQty(line.cartKey, -1)}>-</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <h4 className="summary-title mt-4">ملخص الطلب</h4>
        <div className="summary-card card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>المجموع</span>
              <span>{subtotal} جنيه</span>
            </div>
            <div className="d-flex justify-content-between total-row pt-3">
              <span className="fw-bold">الإجمالي</span>
              <span className="total-price fw-bold">{subtotal} جنيه</span>
            </div>
          </div>
        </div>

        <button className="btn btn-checkout w-100 mt-4" onClick={() => {
          const token = localStorage.getItem('token');
          if(!token) setStep('register');
          else setStep('checkout');
        }}>التالي</button>
      </div>
    </div>
  )
}

export default CartPage
