import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const StoreMenuPage = () => {
  const {slug}=useParams()
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["الكل"]);
  const [selectedCat, setSelectedCat] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const URL='https://talabatak-ebon.vercel.app'

  const [cartData, setCartData] = useState(() => {
    try {
      const saved = localStorage.getItem('talabat_cart');
      return saved ? JSON.parse(saved) : { storeId: null, storeName: null, items: {} };
    } catch {
      return { storeId: null, storeName: null, items: {} };
    }
  });
  const [showClearModal, setShowClearModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [pendingVariant, setPendingVariant] = useState(null);
  // الجديد: المنتج اللي هنختار حجمه
  const [selectedProduct, setSelectedProduct] = useState(null);

  // دالة تجيب مفتاح السلة - لو فيه حجم يبقى productId__size
  const getCartKey = (productId, variant) => {
    if (!variant) return productId
    return `${productId}__${variant.size}`
  }

  // دالة تجيب سعر المنتج حسب الحجم
  const getPriceForKey = (product, cartKey) => {
    if (!cartKey.includes('__')) return Number(product?.price || 0)
    const size = cartKey.split('__')[1]
    const variant = product?.variants?.find(v => v.size === size)
    return Number(variant?.priceAfterDiscount || variant?.price || product?.price || 0)
  }

  // ده اهم useEffect - بيحفظ السلة والتوتال للـ Nav لحظيا
  useEffect(() => {
    localStorage.setItem('talabat_cart', JSON.stringify(cartData));
    
    // احسب التوتال من المنتجات الموجودة - بالحجم
    const total = Object.entries(cartData.items).reduce((sum, [key, qty]) => {
      const productId = key.split('__')[0]
      const pr = products.find(p => (p._id || p.id) == productId);
      return sum + (pr ? getPriceForKey(pr, key) * qty : 0);
    }, 0);
    
    localStorage.setItem('talabat_cart_total', total);
    window.dispatchEvent(new Event('storage'));
  }, [cartData, products]);

  const cart = cartData.items;

  // دالة تجيب كمية منتج معين - مجموع كل أحجامه
  const getProductQty = (productId) => {
    return Object.entries(cart).reduce((sum, [key, qty]) => {
      if (key === productId || key.startsWith(productId + '__')) return sum + qty
      return sum
    }, 0)
  }

  const addToCart = (productId, variant = null) => {
    const product = products.find(p => p._id === productId)
    // لو المنتج ليه أحجام ومفيش variant مختار، افتح نافذة الاختيار
    if (product?.variants?.length > 0 && !variant) {
      setSelectedProduct(product)
      return
    }

    const realStoreId = product?.store?._id || product?.store
    const cartKey = getCartKey(productId, variant)
    
    if (!cartData.storeId || cartData.storeId === slug) {
      setCartData(prev => ({
        ...prev,
        storeId: slug,
        storeName: slug,
        storeDbId: realStoreId,
        items: { ...prev.items, [cartKey]: (prev.items[cartKey] || 0) + 1 }
      }));
      setSelectedProduct(null)
    } else {
      setPendingProduct(productId);
      setPendingVariant(variant);
      setShowClearModal(true);
    }
  };

  const removeFromCart = (productId, variant = null) => {
    // لو المنتج ليه أحجام، هننقص من آخر حجم اتضاف - أو نفتح النافذة
    // للتبسيط: لو ليه أحجام، بنفتح نافذة الاختيار عشان يختار هينقص من انهي حجم
    const product = products.find(p => p._id === productId)
    if (product?.variants?.length > 0 && !variant) {
      // هنقص من أول حجم موجود في السلة
      const keys = Object.keys(cart).filter(k => k.startsWith(productId + '__'))
      if (keys.length === 0) return
      // لو فيه حجم واحد بس، نقص منه على طول
      if (keys.length === 1) {
        const key = keys[0]
        setCartData(prev => {
          const newItems = { ...prev.items };
          if (newItems[key] > 1) newItems[key]--;
          else delete newItems[key];
          if (Object.keys(newItems).length === 0) return { storeId: null, storeName: null, items: {} };
          return { ...prev, items: newItems };
        });
        return
      }
      // لو أكتر من حجم، افتح النافذة وخليه يختار
      setSelectedProduct(product)
      return
    }

    const cartKey = getCartKey(productId, variant)
    setCartData(prev => {
      const newItems = { ...prev.items };
      if (newItems[cartKey] > 1) {
        newItems[cartKey]--;
      } else {
        delete newItems[cartKey];
      }
      if (Object.keys(newItems).length === 0) {
        return { storeId: null, storeName: null, items: {} };
      }
      return { ...prev, items: newItems };
    });
  };

  const confirmClearCart = () => {
    const cartKey = getCartKey(pendingProduct, pendingVariant)
    setCartData({
      storeId: slug,
      storeName: slug,
      items: { [cartKey]: 1 }
    });
    setShowClearModal(false);
    setPendingProduct(null);
    setPendingVariant(null);
    setSelectedProduct(null)
  };

  const filteredProducts = products.filter(p=>p.isActive !== false && (  selectedCat === "الكل" || p.category?.name === selectedCat));

  const getProducts=async()=>{
    const getData=await axios.get(`${URL}/api/store/${slug}/products`,{headers: { "Content-Type": "application/json"} })
    const resData=getData.data.data
    setProducts(resData)
    const cats=[...new Set(resData.map(p=>p.category?.name||"عام"))]
    setCategories(["الكل",...cats])
  }

  useEffect(()=>{
    getProducts()
  },[slug])

  return (
    <>
      <div className="store-page d-flex col-12 flex-column align-items-center">
        <div className="categories-bar">
          {categories.map(cat => (
            <button key={cat} className={`cat-btn ${selectedCat === cat ? 'active' : ''}`} onClick={() => setSelectedCat(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <div className="d-flex justify-content-center col-12 my-3 flex-wrap">
          {filteredProducts.map(product => {
            const productId = product._id || product.id;
            const qty = getProductQty(productId);
            const hasVariants = product.variants && product.variants.length > 0
            const displayPrice = hasVariants ? Math.min(...product.variants.map(v => Number(v.price))) : product.price
            return (
              <div key={productId} className="product-card col-6 col-md-4 col-lg-2  mb-2 ">
                <div className="product-img">
                  <img src={product.img || product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="price">{hasVariants ? `من ${displayPrice} جنيه` : `${product.price} جنيه`}</p>
                
                {qty === 0 ? (
                  <button className="add-btn" onClick={() => addToCart(productId)}>{hasVariants ? 'اختر الحجم +' : 'إضافة +'}</button>
                ) : (
                  <div className="qty-control">
                    <button onClick={() => addToCart(productId)}>+</button>
                    <span>{qty}</span>
                    <button onClick={() => removeFromCart(productId)}>-</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* نافذة اختيار الحجم */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={()=>setSelectedProduct(null)}>
          <div className="modal-box" onClick={(e)=>e.stopPropagation()} dir="rtl">
            <h3>{selectedProduct.name}</h3>
            <p>اختر الحجم</p>
            <div className="d-flex flex-column gap-2">
              {selectedProduct.variants.map((v, i)=>{
                const cartKey = getCartKey(selectedProduct._id, v)
                const vQty = cart[cartKey] || 0
                return (
                  <div key={i} className="d-flex justify-content-between align-items-center border rounded p-2">
                    <div>
                      <div className="fw-bold">{v.size}</div>
                      <div>{v.price} جنيه</div>
                    </div>
                    {vQty === 0 ? (
                      <button className="add-btn" onClick={()=>addToCart(selectedProduct._id, v)}>إضافة</button>
                    ) : (
                      <div className="qty-control">
                        <button onClick={()=>addToCart(selectedProduct._id, v)}>+</button>
                        <span>{vQty}</span>
                        <button onClick={()=>removeFromCart(selectedProduct._id, v)}>-</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="modal-actions mt-3">
              <button className="cancel-btn" onClick={()=>setSelectedProduct(null)}>تم</button>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>تغيير المطعم؟</h3>
            <p>عندك منتجات في سلة {cartData.storeName}، لو كملت السلة القديمة هتتمسح.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {setShowClearModal(false); setPendingVariant(null)}}>إلغاء</button>
              <button className="confirm-btn" onClick={confirmClearCart}>امسح وضيف</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StoreMenuPage