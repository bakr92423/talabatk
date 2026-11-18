import React from 'react'
import './App.css';
import 'swiper/css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CartProvider } from 'react-use-cart';
import Home from './Pages/Home/Home';
import LayOut from './Components/LayOut/LayOut';
import StoresPage from './Pages/Stores/StoresPage';
import StoreMenuPage from './Pages/Stores/StoreMenuPage';
import CartPage from './Pages/Cart/CartPage';
import AccountPage from './Pages/Account/AccountPage';
import PreviousOrders from './Pages/Account/PreviousOrders';
import AddToHomeBanner from './Components/Banner/AddToHomeBanner';






const App = () => {

 

   const rout=createBrowserRouter([
    {path:"",element:<LayOut/>,children:[
      {path:"/",element:<Home/>},
      {path:"/stores",element:<StoresPage/>},
      {path:"/store/:slug/products",element:<StoreMenuPage/>},
      {path:"/cart",element:<CartPage/>},
      {path:"/account",element:<AccountPage/>},
      {path:"/previousOrders",element:<PreviousOrders/>},
    ]}
  ])


  return (
    <div>
       <CartProvider>
      <RouterProvider router={rout} ></RouterProvider>
      <AddToHomeBanner/>
        </CartProvider>
     
      
    
    
      
    </div>
  )
}

export default App
