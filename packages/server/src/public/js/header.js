(function () {
  const AVATAR_COLORS = ['#6b9080', '#81b29a', '#e9c46a', '#f4a261', '#84a59d', '#9b89b3'];

  const userNameElement = document.querySelector('.header-user-name');
  const userEmailElement = document.querySelector('.header-user-email');
  const desktopAvatar = document.querySelector('.header-user-avatar');
  const mobileAvatar = document.querySelector('.header-mobile-avatar');

  if (userNameElement && userEmailElement) {
    const name = userNameElement.dataset.username;
    const email = userEmailElement.dataset.email;

    const initials = getInitials(name, email);
    // console.log(initials);
    // console.log(getAvatarColor(initials));

    desktopAvatar.innerHTML = initials;
    mobileAvatar.innerHTML = initials;

    desktopAvatar.style.backgroundColor = getAvatarColor(initials);
    mobileAvatar.style.backgroundColor = getAvatarColor(initials);
  }

  function getInitials(name, email) {
    try {
      const initials = [];

      name = (name || '').toString().trim();
      email = (email || '').toString().trim();

      if (name.length > 0) {
        const isNameValid = name.replace(/[a-zA-Z\s.]/g, '').length === 0;

        if (isNameValid) {
          const parts = name.split(/\s+/).filter((part) => !part.includes(part.toLowerCase()));

          if (parts.length > 0) {
            initials.push(parts[0][0]);

            if (parts.length > 1) {
              initials.push(parts[parts.length - 1][0]);
            }
          }
        } else {
          return '?';
        }
      }

      if (!initials[0] && email.includes('@')) {
        const firstPartOfEmail = email.split('@')[0];
        const emailParts = firstPartOfEmail
          .split(/[.\-_]/)
          .map((part) => part.replace(/[^a-zA-Z]/g, ''));

        if (!initials[0] && emailParts.length > 0) {
          initials.push(emailParts[0][0]);

          if (emailParts.length > 1) {
            initials.push(emailParts[1][0]);
          }
        } else if (initials[0] && emailParts.length > 0) {
          let nextCharacter = emailParts.find(
            (part) => part[0].toUpperCase() !== initials[0].toUpperCase()
          );
          initials.push(nextCharacter ? nextCharacter[0] : emailParts[1] ? emailParts[1][0] : '');
        }
      }

      return initials.length > 0 ? initials.join('').toUpperCase() : '?';
    } catch (err) {
      return '?';
    }
  }

  function getAvatarColor(initials) {
    if (!initials) {
      return AVATAR_COLORS[0];
    }

    let sum = 0;
    for (let i = 0; i < initials.length; ++i) {
      sum += initials.charCodeAt(i);
    }

    const colorIndex = sum % AVATAR_COLORS.length;
    return AVATAR_COLORS[colorIndex];
  }

  // User dropdown
  const userButton = document.querySelector('.header-user-button');
  const dropdown = document.querySelector('.header-dropdown');

  if (userButton && dropdown) {
    userButton.addEventListener('click', function () {
      let open = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!open));

      dropdown.hidden = open;
    });

    document.addEventListener('click', function (e) {
      if (!userButton.contains(e.target) && !dropdown.contains(e.target)) {
        userButton.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        userButton.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
        userButton.focus();
      }
    });
  }

  // Hamburger
  const hamburger = document.querySelector('.header-hamburger');
  const mobile = document.querySelector('.header-mobile');
  const closeButton = document.querySelector('.header-mobile-close');

  function openMenu() {
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Затвори менюто');
    hamburger.classList.add('is-open');
    mobile.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Отвори менюто');
    hamburger.classList.remove('is-open');
    mobile.hidden = true;
    document.body.style.overflow = '';
  }

  if (hamburger && mobile) {
    hamburger.addEventListener('click', function () {
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeMenu);
  }
})();
