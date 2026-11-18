import React, { useEffect, useState } from 'react'
import { Link, useNavigate,NavLink, useLocation } from 'react-router-dom'

const Nav = ({show,onClose}) => {

  const [showMenu,setShowMenu]=useState(false)
  const [cartCount,setCartCount]=useState()
  const [cartTotal,setCartTotal]=useState()
  const navigate=useNavigate()
  const location=useLocation()


const updateNaveCart = async () => {
  try {
    const saved = JSON.parse(localStorage.getItem("talabat_cart"));
    if (!saved || !saved.items || Object.keys(saved.items).length === 0) {
      setCartCount(0);
      setCartTotal(0);
      return;
    }
    const count = Object.values(saved.items).reduce((a,b) => {
      return a + (typeof b === 'object' ? b.qty : b);
    }, 0);
    setCartCount(count);

    // حاول تجيب التوتال من الكارت نفسه لو متخزن
    let total = Number(localStorage.getItem("talabat_cart_total"));
    
    // لو بصفر وانت ضايف حاجات، احسبه من الـ API
    if (!total && saved.storeId) {
      try {
        const res = await fetch(`https://api.talabatk.com/api/products?store=${saved.storeId}`);
        const data = await res.json();
        const products = data.products || data || [];
        total = Object.entries(saved.items).reduce((sum, [id, val]) => {
          const qty = typeof val === 'object' ? val.qty : val;
          const prod = products.find(p => (p._id || p.id) == id);
          return sum + (prod ? Number(prod.price) * qty : 0);
        }, 0);
      } catch {}
    }
    setCartTotal(isNaN(total) ? 0 : total);
  } catch {
    setCartCount(0);
    setCartTotal(0);
  }
};
  useEffect(()=>{
    updateNaveCart()
    window.addEventListener("storage",updateNaveCart)
    const interval=setInterval(updateNaveCart,1000)
    return()=>{
      window.removeEventListener("storage",updateNaveCart)
      clearInterval(interval)
    }
  },[])



  return (
     <>
      {/* ===== النافبار فوق ===== */}
      <header className="top-navbar sticky-top">
        <div className="container d-flex justify-content-between align-items-center">
          
          {/* اليمين */}
          <div className="d-flex align-items-center gap-3">
            <h2 className="logo m-0">Talabatk <span className="p-1 fw-200 " >TK</span></h2>
          </div>

          {/* الشمال - كمبيوتر فقط */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <button className="cart-btn-desktop" onClick={()=>navigate("/cart")} >
              🛒 السلة
              {cartCount > 0 && <span className="badge-cart">{cartCount}</span>}
            </button>
            <span className="fw-bold">{cartTotal} ج.م</span>
            <span className="icon">🔔</span>
          </div>

          {/* الشمال - موبايل */}
          <div className="d-flex d-lg-none">
            <span className="icon">🔔</span>
          </div>
        </div>
      </header>

      {/* سلة موبايل عائمة */}
      {cartCount > 0 && location.pathname !=="/cart" && (
        <div className="cart-mobile-float d-lg-none" onClick={()=>navigate("/cart")}>
          <button className="cart-mobile-btn">
            <span>🛒 عرض السلة</span>
            <span>{cartCount} • {cartTotal} ج.م</span>
          </button>
        </div>
      )}

      {/* ===== النافبار تحت ===== */}
      <nav className="bottom-navbar d-flex d-lg-none">
       <NavLink to={`/`} end className={({isActive})=> "nav-item " + (isActive? "active" :" ")}>
          <span className="nav-icon"><i className="fa-solid fa-house" ></i></span>
          <span className="nav-label">الرئيسية</span>
        </NavLink>
    
        <NavLink to={`/previousOrders`} className={({isActive})=>"nav-item " + (isActive?"active":"")}>
          <span className="nav-icon"><i className="fa-solid fa-clipboard-list" ></i></span>
          <span className="nav-label">الطلبات</span>
        </NavLink>

        <NavLink to={`/account`} className={({isActive})=>"nav-item " + (isActive?"active":"")}>
          <span className="nav-icon"><i className="fa-solid fa-circle-user" ></i></span>
          <span className="nav-label">الحساب</span>
        </NavLink>
      </nav>
    </>
  )
}

export default Nav
