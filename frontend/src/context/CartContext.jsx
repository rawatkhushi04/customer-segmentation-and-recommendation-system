import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])   // [{stock_code, description, unit_price, quantity}]
  const [isOpen, setIsOpen] = useState(false)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.stock_code === product.stock_code)
      if (existing) {
        return prev.map(i =>
          i.stock_code === product.stock_code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsOpen(true)
  }

  const removeFromCart = (stock_code) => {
    setCart(prev => prev.filter(i => i.stock_code !== stock_code))
  }

  const updateQuantity = (stock_code, qty) => {
    if (qty < 1) return removeFromCart(stock_code)
    setCart(prev => prev.map(i =>
      i.stock_code === stock_code ? { ...i, quantity: qty } : i
    ))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart, isOpen, setIsOpen,
      addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
