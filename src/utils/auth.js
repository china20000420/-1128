import axios from 'axios'

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

export const getToken = () => localStorage.getItem('token')

export const isAdmin = () => localStorage.getItem('is_admin') === 'true'

export const setUserInfo = (isAdmin) => {
  localStorage.setItem('is_admin', isAdmin)
}

export const logout = () => {
  setAuthToken(null)
  localStorage.removeItem('is_admin')
}

if (getToken()) {
  setAuthToken(getToken())
}
