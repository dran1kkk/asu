document.addEventListener('DOMContentLoaded', () => {
  // Безопасные обёртки для работы с localStorage (не падают при запрете хранилища)
  const safeGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeSet = (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch {
      // Игнорируем ошибку, если хранилище заблокировано политиками браузера
    }
  };

  // 1. Управление темой оформления и синхронизация между вкладками
  const themeBtn = document.getElementById('theme-btn');

  const applyTheme = (isDark) => {
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
  };

  applyTheme(safeGet('ais_theme') === 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = !document.documentElement.classList.contains('dark-mode');
      applyTheme(isDark);
      safeSet('ais_theme', isDark ? 'dark' : 'light');
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'ais_theme') {
      applyTheme(e.newValue === 'dark');
    }
  });

  // 2. Бейдж семестра в реальном времени
  const semesterEl = document.getElementById('semester-status');
  if (semesterEl) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let period = 'Каникулы';
    if (month >= 9) period = 'Осенний семестр';
    else if (month === 1) period = 'Зимняя сессия';
    else if (month <= 5) period = 'Весенний семестр';
    else if (month === 6) period = 'Летняя сессия';

    semesterEl.textContent = `${period} ${year} г.`;
  }

  // 3. Эффект 3D + Spotlight (расчёт строго не чаще 1 раза за кадр)
  const canTilt = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;

  if (canTilt) document.querySelectorAll('.tilt-card').forEach(card => {
    let rafId = null;

    card.addEventListener('mousemove', (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3.5;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3.5;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        rafId = null;
      });
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      card.style.transform = '';
    });
  });

  // 4. Интерактивный трекер лабораторных работ
  const trackerGrid = document.getElementById('tracker-grid');
  if (trackerGrid) {
    const checkboxes = Array.from(trackerGrid.querySelectorAll('input[type="checkbox"]'));
    const barEl = document.getElementById('tracker-bar');
    const countEl = document.getElementById('tracker-count');
    const resetBtn = document.getElementById('tracker-reset');
    const STORAGE_KEY = 'ais_labs_progress';

    const loadSavedLabs = () => {
      let savedLabs = [];
      try {
        const raw = safeGet(STORAGE_KEY);
        savedLabs = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(savedLabs)) savedLabs = [];
      } catch {
        savedLabs = [];
      }
      checkboxes.forEach(cb => {
        cb.checked = savedLabs.includes(cb.dataset.lab);
      });
    };

    const renderTracker = () => {
      const total = checkboxes.length;
      const done = checkboxes.filter(cb => cb.checked).length;
      const percent = total ? Math.round((done / total) * 100) : 0;

      if (barEl) barEl.style.width = `${percent}%`;
      if (countEl) countEl.textContent = `${done} / ${total} (${percent}%)`;
    };

    const saveAndRenderTracker = () => {
      const completed = checkboxes.filter(cb => cb.checked).map(cb => cb.dataset.lab);
      safeSet(STORAGE_KEY, JSON.stringify(completed));
      renderTracker();
    };

    loadSavedLabs();
    renderTracker();

    checkboxes.forEach(cb => cb.addEventListener('change', saveAndRenderTracker));

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => { cb.checked = false; });
        saveAndRenderTracker();
      });
    }

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        loadSavedLabs();
        renderTracker();
      }
    });
  }

  // 5. Интерактивный тренажер самоконтроля
  const quizBox = document.getElementById('quiz-box');
  if (quizBox) {
    const questions = [
      {
        q: "Какой транспортный протокол и порт назначения использует клиент DHCP при отправке запроса DHCPDISCOVER?",
        options: ["TCP порт 67", "UDP порт 67", "UDP порт 68", "TCP порт 80"],
        correct: 1,
        explanation: "Клиент рассылает DHCPDISCOVER по протоколу UDP на 67 порт сервера (сам ожидает ответ DHCPOFFER на 68 порту)."
      },
      {
        q: "Какой порт и транспортный протокол использует служба DNS для стандартных клиентских запросов?",
        options: ["TCP порт 80", "UDP порт 53", "TCP порт 443", "UDP порт 67"],
        correct: 1,
        explanation: "Клиентские запросы к DNS выполняются по протоколу UDP на 53 порт. TCP 53 используется преимущественно для зонных передач (zone transfer)."
      },
      {
        q: "Какая команда Cisco IOS задает статический маршрут по умолчанию (шлюз последней надежды)?",
        options: [
          "ip route 255.255.255.255 0.0.0.0 <IP_шлюза>",
          "router default-gateway <IP_шлюза>",
          "ip route 0.0.0.0 0.0.0.0 <IP_шлюза>",
          "ip default-network 192.168.0.0"
        ],
        correct: 2,
        explanation: "Синтаксис 'ip route 0.0.0.0 0.0.0.0 <IP>' направляет весь трафик с неизвестным назначением на указанный Next-Hop шлюз."
      },
      {
        q: "Какая роль хозяина операций (FSMO) в Active Directory отвечает за уникальность идентификаторов объектов в домене?",
        options: ["RID Master", "PDC Emulator", "Schema Master", "Infrastructure Master"],
        correct: 0,
        explanation: "RID Master выделяет пулы относительных идентификаторов (Relative ID) контроллерам домена для генерации уникальных SID новых учетных записей."
      },
      {
        q: "Какой уровень RAID использует одинарную распределенную контрольную сумму (четность) и требует минимум 3 диска?",
        options: ["RAID 0", "RAID 1", "RAID 5", "RAID 10"],
        correct: 2,
        explanation: "В RAID 5 данные и одинарная четность циклически распределяются по всем дискам, при отказе одного диска массив сохраняется. RAID 6 использует двойную четность и требует минимум 4 диска."
      }
    ];

    let currentIndex = 0;
    let score = 0;

    const progressEl = document.getElementById('quiz-progress');
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    const loadQuestion = () => {
      feedbackEl.style.display = 'none';
      feedbackEl.className = 'quiz-feedback';
      nextBtn.style.display = 'none';
      optionsEl.textContent = '';

      const current = questions[currentIndex];
      if (progressEl) progressEl.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
      if (questionEl) questionEl.textContent = current.q;

      current.options.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt-btn';
        btn.textContent = optText;
        btn.addEventListener('click', () => handleAnswer(index, btn));
        optionsEl.appendChild(btn);
      });
    };

    const handleAnswer = (selectedIndex, clickedBtn) => {
      const current = questions[currentIndex];
      const allButtons = optionsEl.querySelectorAll('.quiz-opt-btn');
      allButtons.forEach(b => { b.disabled = true; });

      if (selectedIndex === current.correct) {
        score++;
        clickedBtn.classList.add('correct');
        feedbackEl.className = 'quiz-feedback success';
        feedbackEl.innerHTML = `<strong>Верно!</strong> ${current.explanation}`;
      } else {
        clickedBtn.classList.add('wrong');
        allButtons[current.correct].classList.add('correct');
        feedbackEl.className = 'quiz-feedback error';
        feedbackEl.innerHTML = `<strong>Неверно.</strong> ${current.explanation}`;
      }

      feedbackEl.style.display = 'block';
      nextBtn.textContent = currentIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Посмотреть результат';
      nextBtn.style.display = 'inline-block';
    };

    const showResults = () => {
      if (progressEl) progressEl.textContent = 'Тестирование завершено';
      if (questionEl) questionEl.textContent = `Ваш результат: ${score} из ${questions.length}`;
      optionsEl.textContent = '';

      if (score === questions.length) {
        feedbackEl.textContent = 'Отличный результат! Материал усвоен полностью.';
        feedbackEl.className = 'quiz-feedback success';
      } else if (score >= 3) {
        feedbackEl.textContent = 'Хороший результат, но рекомендуется повторить некоторые темы.';
        feedbackEl.className = 'quiz-feedback success';
      } else {
        feedbackEl.textContent = 'Рекомендуется повторить лекционный материал и методические указания.';
        feedbackEl.className = 'quiz-feedback error';
      }

      feedbackEl.style.display = 'block';
      nextBtn.textContent = 'Пройти заново ↻';
      nextBtn.style.display = 'inline-block';
    };

    nextBtn.addEventListener('click', () => {
      if (currentIndex >= questions.length) {
        currentIndex = 0;
        score = 0;
        loadQuestion();
        return;
      }

      currentIndex++;
      if (currentIndex < questions.length) {
        loadQuestion();
      } else {
        showResults();
      }
    });

    loadQuestion();
  }

  // 6. Интерактивный калькулятор подсетей IPv4 / CIDR
  const calcIpInput = document.getElementById('calc-ip');
  const calcSlider = document.getElementById('calc-cidr-range');
  const calcCidrVal = document.getElementById('calc-cidr-val');

  if (calcIpInput && calcSlider) {
    const resMask = document.getElementById('res-mask');
    const resWildcard = document.getElementById('res-wildcard');
    const resNet = document.getElementById('res-net');
    const resBcast = document.getElementById('res-bcast');
    const resRange = document.getElementById('res-range');
    const resHosts = document.getElementById('res-hosts');

    const ipToInt = (octets) => octets.reduce((acc, oct) => ((acc << 8) + oct) >>> 0, 0);
    const intToIp = (int) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');

    const updateCalculator = () => {
      const rawIp = calcIpInput.value.trim();
      const cidr = parseInt(calcSlider.value, 10);
      calcCidrVal.textContent = `/${cidr}`;

      // Маска, обратная маска и число хостов зависят только от префикса и считаются всегда
      const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
      const wildcardInt = (~maskInt) >>> 0;
      const usableHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.pow(2, 32 - cidr) - 2;

      resMask.textContent = intToIp(maskInt);
      resWildcard.textContent = intToIp(wildcardInt);
      resHosts.textContent = usableHosts.toLocaleString('ru-RU');

      // Строгая валидация десятичных октетов без экспонент (1e2), hex (0x10) и ведущих нулей
      const ipParts = rawIp.split('.');
      const parsedOctets = [];
      const isValidIp = ipParts.length === 4 && ipParts.every(part => {
        if (!/^(0|[1-9]\d{0,2})$/.test(part)) return false;
        const num = Number(part);
        if (num < 0 || num > 255) return false;
        parsedOctets.push(num);
        return true;
      });

      if (!isValidIp) {
        calcIpInput.classList.add('input-error');
        resNet.textContent = 'Некорректный IP';
        resBcast.textContent = '—';
        resRange.textContent = '—';
        return;
      }

      calcIpInput.classList.remove('input-error');
      const ipIntVal = ipToInt(parsedOctets);
      const netInt = (ipIntVal & maskInt) >>> 0;
      const bcastInt = (netInt | wildcardInt) >>> 0;

      resNet.textContent = intToIp(netInt);
      resBcast.textContent = intToIp(bcastInt);

      resRange.textContent = cidr <= 30
        ? `${intToIp(netInt + 1)} — ${intToIp(bcastInt - 1)}`
        : cidr === 31
          ? `${intToIp(netInt)} — ${intToIp(bcastInt)} (point-to-point)`
          : `${intToIp(netInt)} (один хост)`;
    };

    calcIpInput.addEventListener('input', updateCalculator);
    calcSlider.addEventListener('input', updateCalculator);
    updateCalculator();
  }
});