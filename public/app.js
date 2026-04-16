// PeptideOpedia — Client-side functionality

(function() {
  'use strict';

  // Mobile menu toggle
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function() {
      const isOpen = mainNav.classList.toggle('open');
      this.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Search autocomplete
  const searchInput = document.getElementById('header-search-input');
  const autocomplete = document.getElementById('search-autocomplete');
  const autocompleteList = document.getElementById('autocomplete-list');
  
  let debounceTimer;
  
  if (searchInput && autocomplete && autocompleteList) {
    searchInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      const q = this.value.trim();
      
      if (q.length < 2) {
        autocomplete.hidden = true;
        return;
      }
      
      debounceTimer = setTimeout(function() {
        fetch('/api/peptides?q=' + encodeURIComponent(q))
          .then(function(res) { return res.json(); })
          .then(function(results) {
            if (results.length === 0) {
              autocomplete.hidden = true;
              return;
            }
            
            autocompleteList.innerHTML = results.map(function(p) {
              return '<li><a href="/peptides/' + p.slug + '">' +
                '<span class="ac-name">' + p.name + '</span>' +
                '<span class="ac-cats">' + p.categories.join(', ') + '</span>' +
                '</a></li>';
            }).join('');
            
            autocomplete.hidden = false;
          })
          .catch(function() {
            autocomplete.hidden = true;
          });
      }, 200);
    });
    
    // Close autocomplete on click outside
    document.addEventListener('click', function(e) {
      if (!autocomplete.contains(e.target) && e.target !== searchInput) {
        autocomplete.hidden = true;
      }
    });
    
    // Close on Escape
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        autocomplete.hidden = true;
      }
    });
  }

  // Smooth scroll for TOC links
  document.querySelectorAll('.toc a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, this.getAttribute('href'));
      }
    });
  });

  // Active TOC highlighting on scroll
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length > 0) {
    var sections = [];
    tocLinks.forEach(function(link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) sections.push({ el: section, link: link });
    });
    
    var onScroll = function() {
      var scrollPos = window.scrollY + 100;
      var current = null;
      
      sections.forEach(function(s) {
        if (s.el.offsetTop <= scrollPos) {
          current = s;
        }
      });
      
      tocLinks.forEach(function(l) { l.style.color = ''; l.style.fontWeight = ''; });
      if (current) {
        current.link.style.color = '#16537e';
        current.link.style.fontWeight = '600';
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
