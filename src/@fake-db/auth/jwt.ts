// ** JWT import Aqui se usan Mocks para simular usuarios y autenticarlos
import jwt from 'jsonwebtoken'

// ** Mock Adapter
import mock from 'src/@fake-db/mock'

// ** Default AuthConfig
import defaultAuthConfig from 'src/configs/auth'

// ** Types
import { UserDataType } from 'src/context/types'

const users: UserDataType[] = [
  {
    id: 1,
    ci: '1112233',
    fecha_ingreso: '2012-08-01',
    username: 'testuser',
    password: 'testpassword', // Simplified password for mock
    departmentId: 2,
    role: 'client',
    fullName: 'Miguel Lopez Ramirez',
    celular: '', // Cell phone left empty
    profesion: ''
  },
  {
    id: 3,
    ci: '9988776',
    fecha_ingreso: '2016-03-10',
    username: 'testSupervisor',
    password: 'supervisorpassword', // Simplified password for mock
    departmentId: 1,
    role: 'supervisor',
    fullName: 'Carmen Sanchez Guiterrez',
    celular: '', // Cell phone left empty
    profesion: ''
  },
  {
    id: 11,
    ci: '90909090',
    fecha_ingreso: '2017-04-10',
    username: 'cesar.leonel090',
    password: 'password', // Simplified password for mock
    departmentId: 1,
    role: 'client',
    fullName: 'Cesar Leonel Mamani Choque',
    celular: '', // Added cell phone number
    profesion: ''
  },
  {
    id: 6,
    ci: '56781234',
    fecha_ingreso: '2014-07-20',
    username: 'Patricia',
    password: 'supervisorpassword', // Simplified password for mock
    departmentId: 7,//2
    role: 'supervisor',
    fullName: 'Patricia Quispe Chavez',
    celular: '677788910', // Added cell phone number
    profesion: 'Docente de Química'
  },
  {
    id: 5,
    ci: '00000000',
    fecha_ingreso: '2016-03-10',
    username: 'admin',
    password: 'admin', // Simplified password for mock
    departmentId: 1,
    role: 'admin',
    fullName: 'Administrador',
    celular: '', // Cell phone left empty
    profesion: ''
  },
  {
    id: 8,
    ci: '12345678',
    fecha_ingreso: '2009-08-10',
    username: 'roberto_ramos',
    password: 'password',
    departmentId: 7,
    role: 'client',
    fullName: 'Roberto Ramos Castro',
    celular: '67891234',
    profesion: 'Físico'
  },
  {
    id: 9,
    ci: '87654321',
    fecha_ingreso: '2009-06-20',
    username: 'abad_santos',
    password: 'password',
    departmentId: 7,
    role: 'client',
    fullName: 'Abad Santos Ckacka Condori',
    celular: '67912345',
    profesion: 'Físico'
  },
  {
    id: 10,
    ci: '45678912',
    fecha_ingreso: '2014-08-01',
    username: 'quecana_oscar',
    password: 'password',
    departmentId: 16,
    role: 'client',
    fullName: 'Quecaña Carlo Oscar',
    celular: '69056789',
    profesion: 'Ingeniero en Minas'
  }
]

// ! These two secrets should be in .env file and not in any other file
const jwtConfig = {
  secret: process.env.NEXT_PUBLIC_JWT_SECRET,
  expirationTime: process.env.NEXT_PUBLIC_JWT_EXPIRATION,
  refreshTokenSecret: process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN_SECRET
}

type ResponseType = [number, { [key: string]: any }]

mock.onPost('/jwt/login').reply(request => {
  const { username, password } = JSON.parse(request.data)

  let error = {
    username: ['Something went wrong']
  }

  const user = users.find(u => u.username === username && u.password === password)

  if (user) {
    const accessToken = jwt.sign({ id: user.id }, jwtConfig.secret as string, { expiresIn: jwtConfig.expirationTime })

    // Store relevant user data
    const response = {
      accessToken,
      userData: { ...user, password: undefined }
    }

    // Store user data in localStorage (or any state management solution)
    window.localStorage.setItem('userData', JSON.stringify(response.userData));

    return [200, response]
  } else {
    error = {
      username: ['Username or Password is Invalid']
    }

    return [400, { error }]
  }
})

// mock.onPost('/jwt/register').reply(request => {
//   if (request.data.length > 0) {
//     const { email, password, username } = JSON.parse(request.data)
//     const isEmailAlreadyInUse = users.find(user => user.email === email)
//     const isUsernameAlreadyInUse = users.find(user => user.username === username)
//     const error = {
//       email: isEmailAlreadyInUse ? 'This email is already in use.' : null,
//       username: isUsernameAlreadyInUse ? 'This username is already in use.' : null
//     }

//     if (!error.username && !error.email) {
//       const { length } = users
//       let lastIndex = 0
//       if (length) {
//         lastIndex = users[length - 1].id
//       }
//       const userData = {
//         id: lastIndex + 1,
//         email,
//         password,
//         username,
//         avatar: null,
//         fullName: '',
//         role: 'admin'
//       }

//       users.push(userData)

//       const accessToken = jwt.sign({ id: userData.id }, jwtConfig.secret as string)

//       const user = { ...userData }
//       delete user.password

//       const response = { accessToken }

//       return [200, response]
//     }

//     return [200, { error }]
//   } else {
//     return [401, { error: 'Invalid Data' }]
//   }
// })

mock.onGet('/auth/me').reply(config => {
  // ** Get token from header
  // @ts-ignore
  const token = config.headers.Authorization as string

  // ** Default response
  let response: ResponseType = [200, {}]

  // ** Checks if the token is valid or expired
  jwt.verify(token, jwtConfig.secret as string, (err, decoded) => {
    // ** If token is expired
    if (err) {
      // ** If onTokenExpiration === 'logout' then send 401 error
      if (defaultAuthConfig.onTokenExpiration === 'logout') {
        // ** 401 response will logout user from AuthContext file
        response = [401, { error: { error: 'Invalid User' } }]
      } else {
        // ** If onTokenExpiration === 'refreshToken' then generate the new token
        const oldTokenDecoded = jwt.decode(token, { complete: true })

        // ** Get user id from old token
        // @ts-ignore
        const { id: userId } = oldTokenDecoded.payload

        // ** Get user that matches id in token
        const user = users.find(u => u.id === userId)

        // ** Sign a new token
        const accessToken = jwt.sign({ id: userId }, jwtConfig.secret as string, {
          expiresIn: jwtConfig.expirationTime
        })

        // ** Set new token in localStorage
        window.localStorage.setItem(defaultAuthConfig.storageTokenKeyName, accessToken)

        const obj = { userData: { ...user, password: undefined } }

        // ** return 200 with user data
        response = [200, obj]
      }
    } else {
      // ** If token is valid do nothing
      // @ts-ignore
      const userId = decoded.id

      // ** Get user that matches id in token
      const userData = JSON.parse(JSON.stringify(users.find((u: UserDataType) => u.id === userId)))

      delete userData.password

      // ** return 200 with user data
      response = [200, { userData }]
    }
  })

  return response
})
