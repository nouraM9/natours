const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`); // Fixed typo: toUpperCae -> toUpperCase
    }
  } catch (err) {
    // Check if the response and message exist before accessing them
    const errorMessage = err.response?.data?.message || 'An error occurred';
    showAlert('error', errorMessage);
  }
};

const updateForm = document.querySelector('.form-user-data');
if (updateForm) {
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
  });
}

const passwordChange = document.querySelector('.form-user-settings');
if (passwordChange) {
  passwordChange.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = '...Updating';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password',
    );
    // Clear the form inputs
    document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
