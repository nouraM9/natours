/* eslint-disable */
// import { showAlert } from './alerts';
const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: { email, password },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      localStorage.setItem('jwt', res.data.token);

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log(err);

    showAlert('error', err.message);
  }
};

// Check if the login form exists before adding the event listener
const loginForm = document.querySelector('.form--login');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
};

// Check if the logout button exists before adding the event listener
const logoutButton = document.querySelector('.nav__el--logout');
if (logoutButton) {
  logoutButton.addEventListener('click', (e) => {
    logout();
  });
}
