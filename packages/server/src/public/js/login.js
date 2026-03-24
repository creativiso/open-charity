(function () {
  'use strict';
  const authForm = document.querySelector('.auth-form');
  const inputEmail = document.querySelector('.email');
  const inputPassword = document.querySelector('.password');
  const submitButton = document.querySelector('.submit-button');

  function showError(inputElement, className, message) {
    inputElement.classList.add('is-invalid');
    inputElement.classList.remove('is-valid');

    const element = document.querySelector(className);

    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  function clearError(inputElement, className) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');

    const element = document.querySelector(className);

    if (element) {
      element.textContent = '';
      element.style.display = 'none';
    }
  }

  function validateEmail() {
    const emailValue = inputEmail.value.trim();

    if (!emailValue) {
      showError(inputEmail, '.email-error', 'Имейлът е задължителен');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      showError(inputEmail, '.email-error', 'Въведете валиден имейл адрес');
      return false;
    }

    clearError(inputEmail, '.email-error');
    return true;
  }

  function validatePassword() {
    const passwordValue = inputPassword.value.trim();

    if (!passwordValue) {
      showError(inputPassword, '.password-error', 'Паролата е задължителна');
      return false;
    }

    clearError(inputPassword, '.password-error');
    return true;
  }

  document.querySelectorAll('.password-icon').forEach(function (iconButton) {
    iconButton.addEventListener('click', function () {
      const target = this.dataset.target;
      // console.log(this.dataset);

      let input;

      if (target) {
        input = document.getElementById(target);
      } else {
        input = this.closest('.input-group').querySelector('input');
      }

      if (!input) return;

      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  authForm.addEventListener('submit', function (e) {
    const areElementsValid = validateEmail() & validatePassword();

    if (!areElementsValid) {
      e.preventDefault();
      const firstInvalidElement = authForm.querySelector('.is-invalid');

      if (firstInvalidElement) {
        firstInvalidElement.focus();
      }

      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Зареждане...';
    }
  });
})();
