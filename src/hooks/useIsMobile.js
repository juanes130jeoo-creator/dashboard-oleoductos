import { useState, useEffect } from 'react'

export default function useIsMobile() {
  // Inicializamos con el valor real para evitar el flash si se puede
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Listener
    window.addEventListener('resize', handleResize)
    
    // Check inicial por si acaso
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}
