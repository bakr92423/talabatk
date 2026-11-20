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
  const [selectedProduct, setSelectedProduct] = useState(null);

  // === الجديد: ويندو عرض الصنف ===
  const [viewProduct, setViewProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [modalVariant, setModalVariant] = useState(null);

  const openProductModal = (product) => {
    setViewProduct(product);
    setModalQty(1);
    setModalNote('');
    // لو ليه أحجام اختار أول حجم افتراضي
    setModalVariant(product?.variants?.length > 0 ? product.variants[0] : null);
  };

  const closeProductModal = () => {
    setViewProduct(null);
    setModalQty(1);
    setModalNote('');
    setModalVariant(null);
  };

  // سعر الصنف اللي في الويندو
  const getModalPrice = () => {
    if (!viewProduct) return 0;
    if (modalVariant) return Number(modalVariant?.priceAfterDiscount || modalVariant?.price || 0);
    return Number(viewProduct?.priceAfterDiscount || viewProduct?.price || 0);
  };

  // إضافة من داخل الويندو بالكمية والملاحظة
  const addFromModal = () => {
    if (!viewProduct) return;
    const productId = viewProduct._id || viewProduct.id;
    const variant = modalVariant;
    const realStoreId = viewProduct?.store?._id || viewProduct?.store;
    const cartKey = getCartKey(productId, variant);

    // جهز الملاحظة - هنحفظها مع الصنف لو عندك notes في السلة
    // لو مش عندك نظام ملاحظات في السلة، الملاحظة هتتخزن هنا مؤقتا
    const noteToSave = modalNote.trim();

    if (!cartData.storeId || cartData.storeId === slug) {
      setCartData(prev => ({
        ...prev,
        storeId: slug,
        storeName: slug,
        storeDbId: realStoreId,
        items: { ...prev.items, [cartKey]: (prev.items[cartKey] || 0) + modalQty },
        // خزن الملاحظات لو حابب تستخدمها في صفحة السلة / الطلب
        notes: { ...(prev.notes || {}), [cartKey]: noteToSave }
      }));
      closeProductModal();
    } else {
      setPendingProduct(productId);
      setPendingVariant(variant);
      // هنحتاج نضيف الكمية بعد المسح - خزنها مؤقتا
      setPendingProduct({ id: productId, qty: modalQty, variant, note: noteToSave });
      setShowClearModal(true);
    }
  };

  const getCartKey = (productId, variant) => {
    if (!variant) return productId
    return `${productId}__${variant.size}`
  }

  const getPriceForKey = (product, cartKey) => {
    if (!cartKey.includes('__')) return Number(product?.price || 0)
    const size = cartKey.split('__')[1]
    const variant = product?.variants?.find(v => v.size === size)
    return Number(variant?.priceAfterDiscount || variant?.price || product?.price || 0)
  }

  useEffect(() => {
    localStorage.setItem('talabat_cart', JSON.stringify(cartData));
    const total = Object.entries(cartData.items).reduce((sum, [key, qty]) => {
      const productId = key.split('__')[0]
      const pr = products.find(p => (p._id || p.id) == productId);
      return sum + (pr ? getPriceForKey(pr, key) * qty : 0);
    }, 0);
    localStorage.setItem('talabat_cart_total', total);
    window.dispatchEvent(new Event('storage'));
  }, [cartData, products]);

  const cart = cartData.items;

  const getProductQty = (productId) => {
    return Object.entries(cart).reduce((sum, [key, qty]) => {
      if (key === productId || key.startsWith(productId + '__')) return sum + qty
      return sum
    }, 0)
  }

  const addToCart = (productId, variant = null) => {
    const product = products.find(p => p._id === productId)
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
    const product = products.find(p => p._id === productId)
    if (product?.variants?.length > 0 && !variant) {
      const keys = Object.keys(cart).filter(k => k.startsWith(productId + '__'))
      if (keys.length === 0) return
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
    // لو جاي من ويندو الصنف
    if (pendingProduct && typeof pendingProduct === 'object') {
      const cartKey = getCartKey(pendingProduct.id, pendingProduct.variant)
      setCartData({
        storeId: slug,
        storeName: slug,
        items: { [cartKey]: pendingProduct.qty || 1 },
        notes: { [cartKey]: pendingProduct.note || '' }
      });
    } else {
      const cartKey = getCartKey(pendingProduct, pendingVariant)
      setCartData({
        storeId: slug,
        storeName: slug,
        items: { [cartKey]: 1 }
      });
    }
    setShowClearModal(false);
    setPendingProduct(null);
    setPendingVariant(null);
    setSelectedProduct(null)
    closeProductModal();
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
              <div key={productId} className="product-card col-6 col-md-4 col-lg-2 mb-2" onClick={() => openProductModal(product)} style={{cursor:'pointer'}}>
                <div className="product-img">
                  <img src={product.img || product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="price">{hasVariants ? `من ${displayPrice} جنيه` : `${product.price} جنيه`}</p>
                
                {qty === 0 ? (
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(productId); }}>{hasVariants ? 'اختر الحجم +' : 'إضافة +'}</button>
                ) : (
                  <div className="qty-control" onClick={(e) => e.stopPropagation()}>
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

      {/* === ويندو عرض الصنف - زي الصورة بالظبط === */}
      {viewProduct && (
        <div className="product-modal-overlay" onClick={closeProductModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
            <button className="product-modal-close" onClick={closeProductModal}>✕</button>
            
            <div className="product-modal-img">
              <img src={viewProduct.img || viewProduct.image} alt={viewProduct.name} />
            </div>

            <div className="product-modal-body">
              <h2>{viewProduct.name}</h2>
              <p className="product-modal-desc">{viewProduct.description || viewProduct.desc || ''}</p>

              {/* اختيار الحجم لو موجود */}
              {viewProduct.variants?.length > 0 && (
                <div className="product-modal-variants">
                  {viewProduct.variants.map((v, i) => (
                    <button
                      key={i}
                      className={`variant-btn ${modalVariant?.size === v.size ? 'active' : ''}`}
                      onClick={() => setModalVariant(v)}
                    >
                      {v.size} - {v.price} ج
                    </button>
                  ))}
                </div>
              )}

              <div className="product-modal-note-row">
                <span>لديك ملاحظات إضافية؟</span>
                <button type="button" onClick={() => document.getElementById('product-note-input')?.focus()}>أضف ملاحظة</button>
              </div>
              <input
                id="product-note-input"
                className="product-modal-note-input"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="مثال: من غير بصل..."
              />

              <div className="product-modal-footer">
                <div className="product-modal-qty">
                  <button onClick={() => setModalQty(q => q + 1)}>+</button>
                  <span>{modalQty}</span>
                  <button onClick={() => setModalQty(q => Math.max(1, q - 1))}>−</button>
                </div>
                <button className="product-modal-add" onClick={addFromModal}>
                  أضف ... {(getModalPrice() * modalQty).toFixed(2)} ج.م
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة اختيار الحجم القديمة - لزرار + السريع */}
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
              <button className="cancel-btn" onClick={() => {setShowClearModal(false); setPendingVariant(null); setPendingProduct(null)}}>إلغاء</button>
              <button className="confirm-btn" onClick={confirmClearCart}>امسح وضيف</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StoreMenuPage
