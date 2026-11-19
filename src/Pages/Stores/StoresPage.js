import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const StoresPage = () => {

    const [stores,setStores]=useState([])
    const [searchParams]=useSearchParams()
    const typeSlug=searchParams.get("type")
    
    const URL='https://talabatak-ebon.vercel.app'
    const navigate=useNavigate()

   const getStore=async()=>{
          
        try{
          console.log(typeSlug,"typeSlug");
          
    
               const getData=await axios.get(`${URL}/api/store?type=${typeSlug}`,{headers: { "Content-Type": "application/json"} })  
                 const resData=getData.data.data
                  setStores(resData)
                  console.log(resData);
                  
      
                  }catch(error){
                      alert("خطأ في جلب البيانات")
          
                  }
          
      }

    useEffect(()=>{
         getStore()
    },[typeSlug])


  return (
    <div className="bg-white min-vh-100 text-center " dir="rtl">
      
 

      {/* التصنيفات المدورة */}
      <div className="d-flex col-12  justify-content-center storesBanner gap-3 overflow-auto px-3 pb-2 hide-scroll py-5">
        <img src='/Images/Banner6.jpg' />
      </div>



      {/* ليستة المطاعم */}
      <div className="p-3 d-flex align-items-center flex-column gap-4">

        {stores.map((item)=>{
            return(
                <div className="d-flex col-11 col-md-8   gap-3 cardStore " onClick={()=>navigate(`/store/${item.slug}/products`)} >
          <div className="position-relative flex-shrink-0" style={{width: '90px', height: '90px'}}>
            <img src={item.image} className="w-100 h-100 rounded-3 object-fit-cover" alt="" />
            <div className="store-logo">
              <img src={item.image} className="w-100 h-100 object-fit-contain" alt="" />
            </div>
            <div className="fav-icon">♡</div>
          </div>
          <div className="d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold m-0">{item.name}</h6>
            </div>
            <div className="d-flex align-items-center gap-1 small text-secondary mt-1 flex-wrap">
              <span className="text-warning">★</span>
              <span className="fw-bold text-dark">{item.sold||5.0}</span>
              <span className="text-muted">(1k+)</span>
              <span>•</span><span>{item.estimatedDeliveryTime} دقيقة</span><span>•</span>
            </div>
          </div>
        </div>
            )
        })}



      </div>
    </div>
  )
}

export default StoresPage



