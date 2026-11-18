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
                 const getData=await axios.get(`${URL}/api/store?limit=5&skip=1`,{headers: { "Content-Type": "application/json"} })  
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
        <div className="offer-banner mt-3">
          <div>
            <h5 className="m-0 fw-bold">اطلب من طلباتك </h5>
            <small>ومتنساش عروض الجمعة</small>
          </div>
          <div className="banner-img">🍔</div>
        </div>

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
          <h5 className="fw-bold m-0">المطاعم القريبة منك</h5>

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

