/* ============================================
   MAEVEN — Theme JavaScript
   ============================================ */

(function() {
  'use strict';

  /* === Header Scroll Effect === */
  const header = document.querySelector('.header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* === Mobile Nav === */
  const menuToggle = document.querySelector('.header__menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavClose = document.querySelector('.mobile-nav__close');
  const mobileNavOverlay = document.querySelector('.mobile-nav__overlay');

  function openMobileNav() {
    if (mobileNav) {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    if (mobileNav) {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

  /* ================================================
     GLOBAL CART DRAWER SYSTEM
     Shared across all pages and product templates
     ================================================ */

  const cartDrawer = document.getElementById('cart-drawer');
  const cartDrawerBody = document.getElementById('cart-drawer-body');
  const cartToggleBtns = document.querySelectorAll('[data-cart-toggle]');
  const cartCloseBtns = document.querySelectorAll('[data-cart-close]');

  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    if (cartDrawer) {
      cartDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  cartToggleBtns.forEach(btn => btn.addEventListener('click', function() {
    refreshCartDrawer().then(() => openCart());
  }));
  cartCloseBtns.forEach(btn => btn.addEventListener('click', closeCart));

  /* --- Render cart drawer contents from /cart.js --- */
  function renderCartDrawer(cart) {
    if (!cartDrawerBody) return;

    // Update header cart count badges
    document.querySelectorAll('.header__cart-count, .cart-count').forEach(el => {
      el.textContent = cart.item_count;
      el.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });

    if (!cart.items || cart.items.length === 0) {
      cartDrawerBody.innerHTML = '<p class="cart-drawer__empty">Your cart is empty</p>';
      return;
    }

    let html = '';
    cart.items.forEach(item => {
      const imgSrc = item.featured_image
        ? item.featured_image.url + '&width=200'
        : '';
      const variantTitle = item.variant_title || '';
      const linePrice = (item.final_line_price / 100).toFixed(2);

      const priceHTML = `<span>$${linePrice}</span>`;

      html += `
        <div class="cart-item" data-key="${item.key}">
          <div class="cart-item__image">
            ${imgSrc ? `<img src="${imgSrc}" alt="${item.product_title}" width="80" loading="lazy">` : ''}
          </div>
          <div class="cart-item__details">
            <div class="cart-item__title">${item.product_title}</div>
            ${variantTitle ? `<div class="cart-item__variant">${variantTitle}</div>` : ''}
            <div class="cart-item__price">${priceHTML}</div>
            <div class="cart-item__quantity">
              <button type="button" class="cart-item__qty-btn" data-action="minus" data-key="${item.key}" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-value">${item.quantity}</span>
              <button type="button" class="cart-item__qty-btn" data-action="plus" data-key="${item.key}" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>`;
    });

    cartDrawerBody.innerHTML = html;

    // Attach qty button listeners
    cartDrawerBody.querySelectorAll('.cart-item__qty-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const key = this.dataset.key;
        const action = this.dataset.action;
        const qtyEl = this.closest('.cart-item__quantity').querySelector('.cart-item__qty-value');
        let qty = parseInt(qtyEl.textContent);

        if (action === 'minus') qty = Math.max(0, qty - 1);
        if (action === 'plus') qty += 1;

        try {
          const res = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key, quantity: qty })
          });
          const data = await res.json();
          renderCartDrawer(data);
          // Update footer total
          updateCartFooter(data);
        } catch (err) {
          console.error('Cart update error:', err);
        }
      });
    });

    // Update footer total
    updateCartFooter(cart);
  }

  function updateCartFooter(cart) {
    const footer = cartDrawer?.querySelector('.cart-drawer__footer');
    if (!footer) return;

    const subtotal = (cart.total_price / 100).toFixed(2);
    const freeShipThreshold = 54.99;
    const remaining = Math.max(0, freeShipThreshold - cart.total_price / 100);
    const progress = Math.min(100, (cart.total_price / 100 / freeShipThreshold) * 100);
    const qualified = remaining <= 0;

    const shippingHTML = qualified
      ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:0.8125rem;color:#16A34A;font-weight:600;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
          You've unlocked FREE shipping!
        </div>`
      : `<div style="margin-bottom:14px;">
          <div style="font-size:0.8125rem;color:#555;margin-bottom:6px;">Add <strong>$${remaining.toFixed(2)}</strong> more for <strong>FREE shipping</strong></div>
          <div style="height:6px;background:#e5e5e5;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#16A34A,#22c55e);border-radius:3px;transition:width .4s;"></div>
          </div>
        </div>`;

    footer.innerHTML = `
      <div class="cart-drawer__subtotal" style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9375rem;">
        <span style="font-weight:600;">Subtotal</span>
        <span style="font-weight:700;">$${subtotal}</span>
      </div>
      ${shippingHTML}
      <a href="/checkout" class="btn btn--full btn--primary">Checkout</a>`;
  }

  /* --- Fetch fresh cart and render --- */
  function refreshCartDrawer() {
    return fetch('/cart.js')
      .then(res => res.json())
      .then(data => {
        renderCartDrawer(data);
        return data;
      })
      .catch(err => console.error('Cart fetch error:', err));
  }

  /* --- Update cart count badge only (lightweight) --- */
  function updateCartCount() {
    fetch('/cart.js')
      .then(res => res.json())
      .then(data => {
        document.querySelectorAll('.header__cart-count, .cart-count').forEach(el => {
          el.textContent = data.item_count;
          el.style.display = data.item_count > 0 ? 'flex' : 'none';
        });
      });
  }

  /* --- AJAX Add to Cart (returns a Promise) --- */
  function addToCart(variantId, quantity) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: parseInt(variantId), quantity: parseInt(quantity) || 1 }] })
    })
    .then(res => {
      if (!res.ok) throw new Error('Add to cart failed');
      return res.json();
    });
  }

  /* Expose CartDrawer globally so product-specific JS can use it */
  window.CartDrawer = {
    open: openCart,
    close: closeCart,
    refresh: refreshCartDrawer,
    add: addToCart,
    updateCount: updateCartCount
  };

  /* === Product Page: Bundle Selection === */
  const bundleOptions = document.querySelectorAll('.bundle-option');
  bundleOptions.forEach(option => {
    option.addEventListener('click', function() {
      bundleOptions.forEach(o => o.classList.remove('active'));
      this.classList.add('active');

      // Update price display
      const price = this.dataset.price;
      const addBtn = document.querySelector('.add-to-cart__btn');
      if (addBtn && price) {
        const priceSpan = addBtn.querySelector('.add-to-cart__price');
        if (priceSpan) priceSpan.textContent = '$' + price;
      }
    });
  });

  /* === Color Swatch Selection === */
  document.querySelectorAll('.color-swatches').forEach(group => {
    const swatches = group.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', function() {
        swatches.forEach(s => s.classList.remove('active'));
        this.classList.add('active');

        // Update label
        const label = this.closest('.variant-group')?.querySelector('.variant-group__label span');
        if (label) {
          label.textContent = this.dataset.color || '';
        }
      });
    });
  });

  /* === Size Option Selection === */
  document.querySelectorAll('.size-options').forEach(group => {
    const options = group.querySelectorAll('.size-option:not(.disabled)');
    options.forEach(option => {
      option.addEventListener('click', function() {
        options.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
      });
    });
  });

  /* === Product Accordion === */
  document.querySelectorAll('.product-accordion__trigger').forEach(trigger => {
    trigger.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const isOpen = this.classList.contains('open');

      this.classList.toggle('open');
      content.classList.toggle('open');

      if (!isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
      }
    });
  });

  /* === Product Gallery Thumbs === */
  document.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', function() {
      const gallery = this.closest('.product-gallery');
      gallery.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const mainImg = gallery.querySelector('.product-gallery__main img');
      if (mainImg && this.dataset.image) {
        mainImg.src = this.dataset.image;
      }
    });
  });

  /* === Store-wide Add to Cart (product-template.liquid form) === */
  document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
    // Skip forms managed by product-specific JS (cc-product-form, etc.)
    if (form.id === 'cc-product-form' || form.id === 'cc-dynamic-checkout-form') return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const btn = this.querySelector('[type="submit"]');
      if (!btn || btn.disabled) return;

      const variantInput = this.querySelector('[name="id"]');
      if (!variantInput) return;

      const origHTML = btn.innerHTML;
      btn.textContent = 'Adding...';
      btn.disabled = true;

      addToCart(variantInput.value, 1)
        .then(() => {
          btn.textContent = 'Added ✓';
          btn.style.background = '#16A34A';
          return refreshCartDrawer();
        })
        .then(() => {
          openCart();
          setTimeout(() => {
            btn.innerHTML = origHTML;
            btn.style.background = '';
            btn.disabled = false;
          }, 2000);
        })
        .catch(err => {
          console.error('ATC error:', err);
          showToast('Error adding to cart');
          btn.innerHTML = origHTML;
          btn.style.background = '';
          btn.disabled = false;
        });
    });
  });

  /* === Product-template.liquid ATC (uses {% form 'product' %}) === */
  document.querySelectorAll('.add-to-cart__btn').forEach(btn => {
    const form = btn.closest('form');
    if (!form || form.getAttribute('action') === '/cart/add') return; // already handled above

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (this.disabled) return;

      const variantInput = form.querySelector('[name="id"]');
      if (!variantInput) return;

      const origHTML = this.innerHTML;
      this.classList.add('loading');
      this.disabled = true;

      addToCart(variantInput.value, 1)
        .then(() => {
          this.classList.remove('loading');
          this.innerHTML = 'Added ✓';
          this.style.background = '#16A34A';
          return refreshCartDrawer();
        })
        .then(() => {
          openCart();
          setTimeout(() => {
            this.innerHTML = origHTML;
            this.style.background = '';
            this.disabled = false;
          }, 2000);
        })
        .catch(err => {
          console.error('ATC error:', err);
          this.classList.remove('loading');
          this.innerHTML = origHTML;
          this.style.background = '';
          this.disabled = false;
          showToast('Error adding to cart');
        });
    });
  });

  /* === Quick-Add via Product Cards === */
  document.addEventListener('click', function(e) {
    const quickAddBtn = e.target.closest('.pc-quick-add');
    if (!quickAddBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const variantId = quickAddBtn.dataset.variantId;
    if (!variantId) return;

    // Save original icon
    const origHTML = quickAddBtn.innerHTML;
    quickAddBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>';

    addToCart(variantId, 1)
      .then(() => {
        quickAddBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
        return refreshCartDrawer();
      })
      .then(() => {
        openCart();
        setTimeout(() => { quickAddBtn.innerHTML = origHTML; }, 1500);
      })
      .catch(err => {
        console.error('Quick add error:', err);
        quickAddBtn.innerHTML = origHTML;
        showToast('Error adding to cart');
      });
  });

  /* === Toast Notification === */
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  /* === Intersection Observer for Animations === */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .pc-card, .testimonial-card, .value-prop').forEach(el => {
    observer.observe(el);
  });

  /* === Announcement Bar - pause on hover === */
  const announcementTrack = document.querySelector('.announcement-bar__track');
  if (announcementTrack) {
    announcementTrack.addEventListener('mouseenter', () => {
      announcementTrack.style.animationPlayState = 'paused';
    });
    announcementTrack.addEventListener('mouseleave', () => {
      announcementTrack.style.animationPlayState = 'running';
    });
  }

  /* === Initial cart count on page load === */
  updateCartCount();

})();
