(function () {
  const authForm = document.querySelector('.auth-form');

  if (!authForm) return;

  const inputName = document.querySelector('.name');
  const inputEmail = document.querySelector('.email');
  const inputPassword = document.querySelector('.password');
  const inputConfirmPassword = document.querySelector('.confirm-password');
  const passwordStrengthMeter = document.querySelector('.password-strength');

  if (!inputName || !inputEmail || !inputPassword || !inputConfirmPassword) return;

  const submitButton = document.querySelector('.submit-button');
  const strengthFill = document.querySelector('.strength-bar-fill');
  const strengthLabel = document.querySelector('.strength-label');

  const STRENGTH_LABELS = ['', 'Много слаба', 'Слаба', 'Добра', 'Силна'];

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

  function calculatePasswordStrength(password) {
    if (!password) return 0;

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    //const hasLettersAndNumbers = /[^A-Za-z0-9]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    let strength = 0;
    if (password.length >= minLength) strength++;
    if (password.length >= 12) strength++;
    if (hasUpperCase) strength++;
    if (hasNumber) strength++;
    if (hasLowerCase) strength++;

    if (strength <= 1) return 1;
    if (strength === 2) return 2;
    if (strength === 3) return 3;
    return 4;
  }

  function setStrengthClass(element, strength) {
    element.classList.remove('strength-1', 'strength-2', 'strength-3', 'strength-4');

    if (strength > 0) {
      element.classList.add('strength-' + strength);
    }
  }

  function updateStrength(password) {
    if (!strengthFill || !strengthLabel) return;

    const strength = calculatePasswordStrength(password);

    if (!password) {
      setStrengthClass(strengthFill, 0);
      setStrengthClass(strengthLabel, 0);
      strengthLabel.textContent = '';
      if (passwordStrengthMeter) {
        passwordStrengthMeter.classList.remove('visible');
      }
      return;
    }

    if (passwordStrengthMeter) {
      passwordStrengthMeter.classList.add('visible');
    }

    setStrengthClass(strengthFill, strength);
    setStrengthClass(strengthLabel, strength);
    strengthLabel.textContent = STRENGTH_LABELS[strength];
  }

  function isStrongEnough(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  function validateName() {
    const nameValue = inputName.value.trim();

    if (!nameValue) {
      showError(inputName, '.name-error', 'Името е задължително');
      return false;
    }

    if (nameValue.length < 2) {
      showError(inputName, '.name-error', 'Името трябва да е поне 2 символа');
      return false;
    }

    if (nameValue.length > 255) {
      showError(inputName, '.name-error', 'Името е твърде дълго (макс. 255 символа)');
      return false;
    }

    clearError(inputName, '.name-error');
    return true;
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

    if (!isStrongEnough(passwordValue)) {
      showError(
        inputPassword,
        '.password-error',
        'Минимум 8 символа с главна буква, малка буква и цифра'
      );
      return false;
    }

    clearError(inputPassword, '.password-error');
    return true;
  }

  function validateConfirmPassword() {
    if (inputConfirmPassword.value !== inputPassword.value) {
      showError(inputConfirmPassword, '.confirm-password-error', 'Паролите не съвпадат');
      return false;
    }
    clearError(inputConfirmPassword, '.confirm-password-error');
    return true;
  }

  inputPassword.addEventListener('input', function () {
    updateStrength(this.value);
    if (inputConfirmPassword.value) {
      validateConfirmPassword();
    }
  });

  inputConfirmPassword.addEventListener('input', function () {
    if (this.value) {
      validateConfirmPassword();
    }
  });

  document.querySelectorAll('.password-icon').forEach(function (iconButton) {
    iconButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

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
    const areElementsValid =
      validateName() & validateEmail() & validatePassword() & validateConfirmPassword();

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
