'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import {
    Box,
    Paper,
    TextField,
    Typography,
    IconButton,
    Avatar,
    InputAdornment,
    Chip,
    alpha,
    useTheme,
    Fade,
    Slide,
    Badge,
    Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'

// ** Icons
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// ** Framer Motion
import { motion, AnimatePresence } from 'framer-motion'

// ** Hook
import useUser from 'src/hooks/useUser'

// ** Navigation Imports
import VerticalNavItems from 'src/navigation/vertical'
import HorizontalNavItems from 'src/navigation/horizontal'

// ** Tipos
import {
    NavLink as CoreNavLink,
    NavGroup as CoreNavGroup,
    NavSectionTitle as CoreNavSectionTitle,
    NavGroup,
    NavSectionTitle
} from 'src/@core/layouts/types'
import { grey } from '@mui/material/colors'

// Extender el tipo NavLink
interface ExtendedNavLink extends CoreNavLink {
    category?: string;
    meta?: {
        description?: string;
        [key: string]: any;
    };
}

// ------------------------
// Estilos personalizados
const FloatingButton = styled(IconButton)(({ theme }) => ({
    position: 'fixed',
    bottom: 32,
    right: 32,
    width: 60,
    height: 60,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    zIndex: 1500,
    boxShadow: theme.shadows[10],
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[16]
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}))

const MessageBubble = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'type'
})<{ isUser?: boolean; type?: string }>(({ theme, isUser, type }) => ({
    maxWidth: '85%',
    padding: theme.spacing(1.5, 2),
    borderRadius: 18,
    borderBottomRightRadius: isUser ? 4 : 18,
    borderBottomLeftRadius: isUser ? 18 : 4,
    backgroundColor: isUser
        ? theme.palette.primary.main
        : type === 'navigation'
            ? alpha(theme.palette.success.light, 0.1)
            : theme.palette.background.paper,
    color: isUser ? theme.palette.common.white : theme.palette.text.primary,
    border: `1px solid ${isUser ? 'transparent' : alpha(theme.palette.divider, 0.3)}`,
    boxShadow: isUser
        ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
        : `0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        [isUser ? 'right' : 'left']: -6,
        width: 12,
        height: 12,
        backgroundColor: 'inherit',
        borderBottomRightRadius: isUser ? '50%' : 0,
        borderBottomLeftRadius: isUser ? 0 : '50%',
        borderTopRightRadius: '50%',
        borderTopLeftRadius: '50%',
        border: `inherit`,
        borderTop: 'none',
        borderLeft: isUser ? 'inherit' : 'none',
        borderRight: isUser ? 'none' : 'inherit'
    }
}))

const ChatAssistant = () => {
    const router = useRouter()
    const user = useUser()
    const theme = useTheme()

    const [open, setOpen] = useState(false)
    const [inputText, setInputText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [searchMode, setSearchMode] = useState(false)
    const [showQuickAccess, setShowQuickAccess] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // ------------------------
    // Mensajes iniciales del chat
    const [messages, setMessages] = useState<{
        id: string
        from: 'user' | 'assistant'
        text: string
        timestamp: Date
        type?: 'suggestion' | 'navigation' | 'help' | 'search'
    }[]>([
        {
            id: '1',
            from: 'assistant',
            text: `¡Hola${user?.username ? ` ${user.username}` : ''}! 👋 Soy tu asistente inteligente.`,
            timestamp: new Date(),
            type: 'help'
        },
        {
            id: '2',
            from: 'assistant',
            text: 'Puedo ayudarte a encontrar secciones, navegar o responder preguntas. ¿En qué te puedo ayudar hoy?',
            timestamp: new Date(Date.now() + 1000),
            type: 'help'
        }
    ])

    // ------------------------
    // Aplanar rutas recursivamente
    const flattenRoutes = useCallback((items: Array<CoreNavLink | NavGroup | NavSectionTitle>): ExtendedNavLink[] => {
        let routes: ExtendedNavLink[] = []

        items.forEach(item => {
            if ('path' in item && item.path) {
                routes.push({
                    ...item,
                    category: 'category' in item ? (item as any).category : 'General',
                    meta: 'meta' in item ? (item as any).meta : {}
                })
            } else if ('children' in item && Array.isArray(item.children)) {
                routes.push(...flattenRoutes(item.children))
            }
        })

        return routes
    }, [])

    const allRoutes: ExtendedNavLink[] = useMemo(
        () => flattenRoutes([...VerticalNavItems(), ...HorizontalNavItems()]),
        [flattenRoutes]
    )

    const allowedRoutes: ExtendedNavLink[] = useMemo(() =>
        allRoutes.filter(r => r.path && r.title),
        [allRoutes]
    )

    // ------------------------
    // Búsqueda inteligente
    const searchResults = useMemo(() => {
        if (!inputText.trim() || !searchMode) return []

        const query = inputText.toLowerCase()
        return allowedRoutes
            .filter(route => {
                const titleMatch = route.title.toLowerCase().includes(query)
                const pathMatch = route.path && route.path.toLowerCase().includes(query)
                const descriptionMatch = route.meta?.description?.toLowerCase().includes(query)
                const keywordsMatch = route.meta?.keywords?.some((kw: string) => kw.toLowerCase().includes(query))

                return titleMatch || pathMatch || descriptionMatch || keywordsMatch
            })
            .slice(0, 5)
    }, [allowedRoutes, inputText, searchMode])


    // ------------------------
    // Sugerencias contextuales basadas en la conversación
    const contextualSuggestions = useMemo(() => {
        const lastMessage = messages[messages.length - 1]
        const suggestions = []

        if (lastMessage?.from === 'assistant') {
            if (lastMessage.text.includes('Dashboard') || lastMessage.text.includes('Inicio')) {
                suggestions.push(
                    { text: 'Ir al Dashboard', icon: <DashboardIcon />, action: 'navigate' },
                    { text: 'Ver estadísticas', icon: <DashboardIcon />, action: 'chat' }
                )
            }
            if (lastMessage.text.includes('configuración') || lastMessage.text.includes('settings')) {
                suggestions.push(
                    { text: 'Ajustes generales', icon: <SettingsIcon />, action: 'navigate' },
                    { text: 'Preferencias', icon: <SettingsIcon />, action: 'chat' }
                )
            }
        }

        // Sugerencias por defecto
        if (suggestions.length === 0) {
            suggestions.push(
                { text: 'Dashboard', icon: <DashboardIcon />, action: 'navigate' },
                { text: 'Configuración', icon: <SettingsIcon />, action: 'navigate' },
                { text: 'Necesito ayuda', icon: <HelpOutlineIcon />, action: 'chat' },
                { text: 'Buscar secciones', icon: <SearchIcon />, action: 'search' }
            )
        }

        return suggestions.slice(0, 4)
    }, [messages])

    // ------------------------
    // Efectos
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [open])

    // ------------------------
    // Funciones del chat
    const addMessage = (from: 'user' | 'assistant', text: string, type?: 'suggestion' | 'navigation' | 'help' | 'search') => {
        const newMessage = {
            id: Date.now().toString(),
            from,
            text,
            timestamp: new Date(),
            type
        }
        setMessages(prev => [...prev, newMessage])
    }

    const navigateToRoute = (route: ExtendedNavLink) => {
        addMessage('user', `Ir a ${route.title}`)
        setIsTyping(true)

        setTimeout(() => {
            addMessage('assistant', `Te llevo a **${route.title}**. ¡Listo!`, 'navigation')
            setIsTyping(false)

            setTimeout(() => {
                if (route.path) {
                    router.push(route.path)
                    setOpen(false)
                }
            }, 1000)
        }, 800)
    }

    const handleSend = (customText?: string, isSearch: boolean = false) => {
        const textToSend = customText || inputText
        if (!textToSend.trim()) return

        if (isSearch) {
            setSearchMode(true)
            addMessage('user', `Buscar: ${textToSend}`, 'search')
        } else {
            addMessage('user', textToSend)
        }

        if (!customText) setInputText('')
        setIsTyping(true)

        setTimeout(() => {
            handleAssistantResponse(textToSend, isSearch)
        }, 800)
    }

    const handleAssistantResponse = (userInput: string, isSearch: boolean = false) => {
        const input = userInput.toLowerCase()
        let response = ''
        let type: 'suggestion' | 'navigation' | 'help' | 'search' = 'help'

        // Modo búsqueda
        if (isSearch || searchMode) {
            const results = searchResults
            if (results.length > 0) {
                response = `Encontré ${results.length} resultados para "${userInput}":\n\n` +
                    results.map((r, i) => `${i + 1}. **${r.title}** - ${r.meta?.description || 'Sin descripción'}`).join('\n')
                type = 'search'
            } else {
                response = `No encontré resultados para "${userInput}". Prueba con otros términos o pídeme ayuda específica.`
                type = 'help'
            }
            setSearchMode(false)
        }
        // Navegación directa
        else {
            const exactMatch = allowedRoutes.find(r =>
                r.title.toLowerCase() === input ||
                r.title.toLowerCase().includes(input) ||
                r.meta?.keywords?.some((kw: string) => kw.toLowerCase() === input)
            )


            if (exactMatch) {
                response = `Perfecto, te llevo a **${exactMatch.title}**.`
                type = 'navigation'

                setTimeout(() => {
                    if (exactMatch.path) {
                        router.push(exactMatch.path)
                        setOpen(false)
                    }
                }, 1500)
            }
            // Palabras clave
            else if (input.includes('ayuda') || input.includes('help') || input.includes('?')) {
                response = 'Te ayudo con:\n• **Navegación** entre secciones\n• **Búsqueda** de funcionalidades\n• **Guías** rápidas\n\n¿Qué necesitas?'
                type = 'help'
            }
            else if (input.includes('buscar') || input.includes('encontrar') || input.includes('dónde')) {
                response = 'Puedo ayudarte a buscar. Escribe lo que necesitas encontrar o usa el botón de búsqueda.'
                type = 'search'
                setSearchMode(true)
            }
            else {
                const suggestions = allowedRoutes
                    .filter(r =>
                        r.title.toLowerCase().includes(input.slice(0, 3)) ||
                        r.meta?.keywords?.some((kw: string) => kw.toLowerCase().includes(input.slice(0, 3)))
                    )
                    .slice(0, 3)
                    .map(r => `**${r.title}**`)
                    .join(', ')


                response = suggestions
                    ? `¿Te refieres a ${suggestions}? O puedes buscar más específicamente.`
                    : 'No estoy seguro de lo que necesitas. ¿Puedes ser más específico o buscar algo en particular?'
                type = 'help'
            }
        }

        addMessage('assistant', response, type)
        setIsTyping(false)
    }

    const handleQuickSuggestion = (suggestion: any) => {
        if (suggestion.action === 'search') {
            setSearchMode(true)
            setInputText('')
            addMessage('user', 'Buscar secciones')
        } else if (suggestion.action === 'navigate') {
            const route = allowedRoutes.find(r =>
                r.title.toLowerCase().includes(suggestion.text.toLowerCase())
            )
            if (route) {
                navigateToRoute(route)
            } else {
                handleSend(suggestion.text)
            }
        } else {
            handleSend(suggestion.text)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend(undefined, searchMode)
        }
    }

    const clearSearch = () => {
        setSearchMode(false)
        setInputText('')
    }

    return (
        <>
            <FloatingButton onClick={() => setOpen(!open)}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={open ? 'close' : 'chat'}
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 180, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {open ? <CloseIcon /> : <ChatIcon />}
                    </motion.div>
                </AnimatePresence>
            </FloatingButton>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300
                        }}
                        style={{
                            position: 'fixed',
                            bottom: 100,
                            right: 32,
                            width: 420,
                            height: '75vh',
                            maxHeight: 650,
                            minHeight: 500,
                            zIndex: 1400,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Paper
                            elevation={24}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                        >
                            {/* Header */}
                            <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                <Avatar
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        bgcolor: 'white',
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    <SmartToyIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='h6' fontWeight={700} color={'white'}>
                                        Asistente Inteligente
                                    </Typography>
                                    <Typography variant='caption' sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }} color={'white'}>
                                        <span>Beta</span>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.light' }} />
                                    </Typography>
                                </Box>
                                <Tooltip title={searchMode ? "Modo búsqueda activo" : "Cambiar modo"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchMode(!searchMode)}
                                        sx={{
                                            bgcolor: searchMode ? 'white' : alpha('#fff', 0.2),
                                            color: searchMode ? theme.palette.primary.main : 'white',
                                            '&:hover': { bgcolor: searchMode ? 'grey.100' : alpha('#fff', 0.3) }
                                        }}
                                    >
                                        <SearchIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {/* Contenido principal - Chat */}
                            <Box
                                ref={chatContainerRef}
                                sx={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Área de mensajes */}
                                <Box sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2.5
                                }}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                display: 'flex',
                                                gap: 12,
                                                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '90%'
                                            }}
                                        >
                                            {msg.from === 'assistant' && (
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main
                                                    }}
                                                >
                                                    <SmartToyIcon fontSize="small" />
                                                </Avatar>
                                            )}

                                            {/* Estilo completo mejorado para el mensaje */}
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '90%'
                                            }}>
                                                <Typography variant='caption' color='text.secondary' sx={{
                                                    ml: 1,
                                                    display: 'block',
                                                    mb: 0.5,
                                                    color: msg.from === 'user' ? alpha(theme.palette.primary.main, 0.8) : 'text.secondary'
                                                }}>
                                                    {msg.from === 'assistant' ? 'Asistente' : 'Tú'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>

                                                <MessageBubble isUser={msg.from === 'user'}>
                                                    <Box sx={{
                                                        color: msg.from === 'user' ? 'white' : 'text.primary',
                                                        '& .user-text-bold': {
                                                            color: 'white !important',
                                                            fontWeight: 600
                                                        },
                                                        '& .assistant-text-bold': {
                                                            color: 'primary.main',
                                                            fontWeight: 700
                                                        }
                                                    }}>
                                                        {msg.text.split('**').map((part, i) => {
                                                            if (i % 2 === 1) {
                                                                return (
                                                                    <span
                                                                        key={i}
                                                                        className={msg.from === 'user' ? 'user-text-bold' : 'assistant-text-bold'}
                                                                    >
                                                                        {part}
                                                                    </span>
                                                                );
                                                            }
                                                            return part;
                                                        })}
                                                    </Box>
                                                </MessageBubble>
                                            </Box>
                                            {msg.from === 'user' && (
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: theme.palette.secondary.main,
                                                        color: 'white'
                                                    }}
                                                >
                                                    <PersonIcon fontSize="small" />
                                                </Avatar>
                                            )}
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <Box sx={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main
                                                }}
                                            >
                                                <SmartToyIcon fontSize="small" />
                                            </Avatar>
                                            <MessageBubble>
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                                    >
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                    </motion.div>
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                    >
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                    </motion.div>
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                    >
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                    </motion.div>
                                                </Box>
                                            </MessageBubble>
                                        </Box>
                                    )}

                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* Resultados de búsqueda en tiempo real */}
                                {searchMode && inputText.trim() && searchResults.length > 0 && (
                                    <Slide direction="up" in={searchMode && inputText.trim().length > 0}>
                                        <Box sx={{
                                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            bgcolor: alpha(theme.palette.background.paper, 0.95),
                                            backdropFilter: 'blur(10px)'
                                        }}>
                                            <Box sx={{ p: 2, maxHeight: 200, overflowY: 'auto' }}>
                                                <Typography variant='subtitle2' sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <SearchIcon fontSize="small" />
                                                    Resultados ({searchResults.length})
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {searchResults.map((route, index) => (
                                                        <Chip
                                                            key={route.path}
                                                            label={route.title}
                                                            onClick={() => navigateToRoute(route)}
                                                            sx={{
                                                                justifyContent: 'flex-start',
                                                                borderRadius: 2,
                                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                    transform: 'translateX(4px)'
                                                                },
                                                                transition: 'all 0.2s'
                                                            }}
                                                        // Solo quitar deleteIcon/onDelete si no se necesita eliminar
                                                        />

                                                    ))}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Slide>
                                )}
                            </Box>

                            {/* Sugerencias contextuales */}
                            <Fade in={showQuickAccess && contextualSuggestions.length > 0}>
                                <Box sx={{
                                    p: 2,
                                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    bgcolor: alpha(theme.palette.background.default, 0.5)
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1
                                    }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            SUGERENCIAS
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowQuickAccess(!showQuickAccess)}
                                            sx={{ width: 24, height: 24 }}
                                        >
                                            {showQuickAccess ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>

                                    {showQuickAccess && (
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {contextualSuggestions.map((item, index) => (
                                                <Chip
                                                    key={index}
                                                    icon={item.icon}
                                                    label={item.text}
                                                    onClick={() => handleQuickSuggestion(item)}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: 2,
                                                        borderColor: alpha(theme.palette.primary.main, 0.2),
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                            borderColor: theme.palette.primary.main
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Fade>

                            {/* Input de mensaje */}
                            <Box sx={{ p: 2.5 }}>
                                <TextField
                                    fullWidth
                                    inputRef={inputRef}
                                    placeholder={searchMode ? "Buscar en la aplicación..." : "Escribe tu mensaje..."}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isTyping}
                                    InputProps={{
                                        startAdornment: searchMode && (
                                            <InputAdornment position="start">
                                                <SearchIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {searchMode && inputText && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={clearSearch}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    onClick={() => handleSend(undefined, searchMode)}
                                                    disabled={!inputText.trim() || isTyping}
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        color: 'white',
                                                        '&:hover': { bgcolor: 'primary.dark' },
                                                        '&.Mui-disabled': { bgcolor: 'action.disabled' }
                                                    }}
                                                >
                                                    <SendIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 3,
                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: alpha(theme.palette.divider, 0.2)
                                            }
                                        }
                                    }}
                                    size="small"
                                />
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ChatAssistant