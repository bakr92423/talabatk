import { useEffect, useState } from "react";

const AddToHomeBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // لو الزبون ضافه قبل كده، متظهرش تاني
    const isAdded = localStorage.getItem("pwa-added");
    if (isAdded) return;

    const handler = (e) => {
      e.preventDefault(); // امنع البنر بتاع المتصفح الافتراضي
      setDeferredPrompt(e);
      setShowBanner(true); // اظهر البنر بتاعك انت
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleAdd = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // افتح نافذة الإضافة
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("الزبون وافق");
      localStorage.setItem("pwa-added", "true");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
    // متظهرش تاني لمدة يوم
    localStorage.setItem("pwa-added-temp", Date.now());
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#fff", padding: "15px",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
      zIndex: 9999, display: "flex",
      justifyContent: "space-between", alignItems: "center",
      direction: "rtl"
    }}>
      <div>
        <strong>أضف طلباتك للشاشة الرئيسية</strong>
        <p style={{ margin: 0, fontSize: "12px" }}>للوصول السريع وطلب أسهل</p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleClose} style={{ background: "#eee", border: 0, padding: "8px 12px", borderRadius: "8px" }}>لاحقاً</button>
        <button onClick={handleAdd} style={{ background: "#FF6B00", color: "#fff", border: 0, padding: "8px 16px", borderRadius: "8px" }}>إضافة</button>
      </div>
    </div>
  );
};

export default AddToHomeBanner;