// ** React Imports
import { useEffect, ReactNode } from 'react'

// ** MUI Imports
import { Direction as MUIDirection } from '@mui/material'

// ** Emotion Imports
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

// ** RTL Plugin
import stylisRTLPlugin from 'stylis-plugin-rtl'

interface DirectionProps {
  children: ReactNode
  direction: MUIDirection
}

const styleCache = () =>
  createCache({
    key: 'rtl',
    prepend: true,
    stylisPlugins: [stylisRTLPlugin]
  })

const DirectionProvider = (props: DirectionProps) => {
  const { children, direction } = props

  useEffect(() => {
    document.dir = direction
  }, [direction])

  if (direction === 'rtl') {
    return <CacheProvider value={styleCache()}>{children}</CacheProvider>
  }

  return <>{children}</>
}

export default DirectionProvider
