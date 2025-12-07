// ** React Imports
import { ReactNode } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import { Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Layout Imports
import Layout from 'src/@core/layouts/Layout'

// ** Navigation Imports
import VerticalNavItems from 'src/navigation/vertical'
import HorizontalNavItems from 'src/navigation/horizontal'

// ** Component Imports
import VerticalAppBarContent from './components/vertical/AppBarContent'
import HorizontalAppBarContent from './components/horizontal/AppBarContent'
import ChatAssistant from 'src/components/chatAssistant'
// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'

interface Props {
  children: ReactNode
  contentHeightFixed?: boolean
}

const UserLayout = ({ children, contentHeightFixed }: Props) => {
  const { settings, saveSettings } = useSettings()
  const router = useRouter()

  // Rutas donde ocultar el chat
  const HIDDEN_ROUTES = ['/login', '/register', '/auth']
  const shouldHideChat = HIDDEN_ROUTES.some(route =>
    router.pathname === route || router.pathname.startsWith(`${route}/`)
  )

  // Control de menu responsive
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  if (hidden && settings.layout === 'horizontal') {
    settings.layout = 'vertical'
  }

  return (
    <Layout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      contentHeightFixed={contentHeightFixed}
      verticalLayoutProps={{
        navMenu: {
          navItems: VerticalNavItems()
        },
        appBar: {
          content: props => (
            <VerticalAppBarContent
              hidden={hidden}
              settings={settings}
              saveSettings={saveSettings}
              toggleNavVisibility={props.toggleNavVisibility}
            />
          )
        }
      }}
      {...(settings.layout === 'horizontal' && {
        horizontalLayoutProps: {
          navMenu: {
            navItems: HorizontalNavItems()
          },
          appBar: {
            content: () => (
              <HorizontalAppBarContent hidden={hidden} settings={settings} saveSettings={saveSettings} />
            )
          }
        }
      })}
    >
      {children}

      {/* Chat persistente */}
      {!shouldHideChat && <ChatAssistant />}
    </Layout>
  )
}

export default UserLayout
