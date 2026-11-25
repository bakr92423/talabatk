import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const Home = () => {
    const [stores,setStores]=useState([])
    const [typeStore,setTypeStore]=useState([])
    const [ads,setAds]=useState([])
    const [keyword,setKeyword]=useState("")
    const [result,setResult]=useState(0)
    const URL='https://talabatak-ebon.vercel.app'
    const navigate=useNavigate()
    


   const getStore=async()=>{
          
        try{
    
         if(keyword!==''){
            const getData=await axios.get(`${URL}/api/store?keyword=${keyword}`,{headers: { "Content-Type": "application/json"} })
             const resData=getData.data.data
              setStores(resData)
              setResult(getData.data.result)
    
              }else{
                 const getData=await axios.get(`${URL}/api/store?limit=10&skip=1`,{headers: { "Content-Type": "application/json"} })  
                 const resData=getData.data.data
                  setStores(resData)
                    setResult(getData.data.result)
    
                    }
    
               
          
                  }catch(error){
                      alert("خطأ في جلب البيانات")
          
                  }
          
                }
   const getTypeStore=async()=>{
    const getData =await axios.get(`${URL}/api/typeStore`,{headers: { "Content-Type": "application/json"} })  
         const resData=getData.data.data
         console.log(resData);
         
          setTypeStore(resData)
   }
   const getAds=async()=>{
    const getData =await axios.get(`${URL}/api/ads`,{headers: { "Content-Type": "application/json"} })  
         const resData=getData.data
         console.log(resData);
         
          setAds(resData)
   }
      
        useEffect(()=>{
            getStore()
         },[keyword])
        useEffect(()=>{
            getTypeStore()
            getAds()
         },[])


  return (
     <div className="home-page" dir="rtl">
      <div className="container pb-5">

        {/* 1- سيرش بار */}
        <div className="search-bar mt-3">
          <span>🔍</span>
          <input placeholder="ابحث عن مطعم أو مطبخ..." value={keyword} onChange={(e)=>setKeyword(e.target.value)} />
        </div>

        {/* 2- بانر عروض */}
       <a 
  href="https://wa.me/201023892300"
  target="_blank" 
  rel="noopener noreferrer"
  style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
>
  <div className="offer-banner mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF3E0', padding: '14px 16px', borderRadius: '12px', direction: 'rtl' }}>
    <div style={{ textAlign: 'right', flex: 1 }}>
      <h5 style={{ margin: 0, fontWeight: 'bold', color: '#000', fontSize: '17px' }}>اضغط هنا لطلب عن طريق الواتساب</h5>
      <small style={{ color: '#555', fontSize: '13px' }}>مطاعم - سوبر ماركت - صيدليات</small>
    </div>
    <div className="banner-img" style={{ marginLeft: '10px', flexShrink: 0 }}>
      <svg width="42" height="42" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </div>
  </div>
</a>

        {/* 3- الأقسام */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <h6 className="fw-bold m-0">اكتشف حسب الفئة</h6>
        </div>

        <div className="categories justify-content-center fw-bold   mt-2">
          {typeStore.map((item)=>{
            return(
              <div className="cat active fw-bold " onClick={()=>navigate(`/stores?type=${item.slug}`)} ><img className="imgCatCategory" src={item.image} /><span>{item.name}</span></div>
            )
          })}

        </div>

 
{/* 5-  الاعلانات */}
        <div className='ads-banner mt-3' >  
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={12}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}

          >

            {ads.map((item)=>{
              return(
                  <SwiperSlide>
          <img src={item.image} />
        </SwiperSlide>

              )
            })}

     



          </Swiper>
        </div>

        {/* 5- المطاعم القريبة */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <h5 className="fw-bold m-0">المتاجر القريبة منك</h5>

        </div>

        <div className="restaurants d-flex align-items-center col-12 ">

          {stores.map((item)=>{
            return(
              <div className="res-card col-11 col-md-8 col-lg-8 d-flex justify-content-between " onClick={()=>navigate(`/store/${item.slug}/products`)} >
            <div className="col-lg-3 " ><img src={item.image} className="res-img col-lg-12 " /> <span className="res-offer"></span></div>
            <div className="res-info  col-lg-5 p-2">
              <div className="d-flex justify-content-between">
                <strong>{item.name}</strong>
                <span className="rate">⭐ 4.8</span>
              </div>
              <small className="text-muted">{item.description}</small>
              <div className="d-flex gap-2 mt-1">
                <small>🕒 {item.estimatedDeliveryTime} دقيقة </small>
                <small>•</small>
              </div>
            </div>
          </div>
            )
          })}
         
         
        </div>

      </div>
    </div>
  )
}

export default Home

