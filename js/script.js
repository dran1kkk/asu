document.addEventListener('DOMContentLoaded', () => {
  // 1. Управление темой оформления
  const themeBtn = document.getElementById('theme-btn');
  const savedTheme = localStorage.getItem('ais_theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('ais_theme', isDark ? 'dark' : 'light');
    });
  }

  // 2. Интерактивный тренажер экспресс-проверки знаний
  const quizBox = document.getElementById('quiz-box');

  if (quizBox) {
    const questions = [
      {
        q: "Какой транспортный протокол и порт назначения использует клиент DHCP при отправке запроса DHCPDISCOVER?",
        options: [
          "TCP порт 67",
          "UDP порт 67",
          "UDP порт 68",
          "TCP порт 80"
        ],
        correct: 1,
        explanation: "Клиент рассылает DHCPDISCOVER по протоколу UDP на 67 порт сервера (сам ожидает ответ DHCPOFFER на 68 порту)."
      },
      {
        q: "Какой порт и транспортный протокол использует служба DNS для стандартных клиентских запросов?",
        options: [
          "TCP порт 80",
          "UDP порт 53",
          "TCP порт 443",
          "UDP порт 67"
        ],
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
        options: [
          "RID Master",
          "PDC Emulator",
          "Schema Master",
          "Infrastructure Master"
        ],
        correct: 0,
        explanation: "RID Master выделяет пулы относительных идентификаторов (Relative ID) контроллерам домена для генерации уникальных SID новых учетных записей."
      },
      {
        q: "Какой уровень RAID обеспечивает одновременное чередование с распределенным контролем четности без выделенного диска четности?",
        options: [
          "RAID 0",
          "RAID 1",
          "RAID 5",
          "RAID 6"
        ],
        correct: 2,
        explanation: "В массиве RAID 5 данные и контрольные суммы циклически распределяются по всем дискам (требуется минимум 3 накопителя)."
      }
    ];

    let currentIndex = 0;
    let score = 0;

    const progressEl = document.getElementById('quiz-progress');
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    function loadQuestion() {
      feedbackEl.style.display = 'none';
      feedbackEl.className = 'quiz-feedback';
      nextBtn.style.display = 'none';
      optionsEl.innerHTML = '';

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
    }

    function handleAnswer(selectedIndex, clickedBtn) {
      const current = questions[currentIndex];
      const allButtons = optionsEl.querySelectorAll('.quiz-opt-btn');

      // Блокируем кнопки после ответа
      allButtons.forEach(b => b.disabled = true);

      const isCorrect = selectedIndex === current.correct;

      if (isCorrect) {
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

      if (currentIndex < questions.length - 1) {
        nextBtn.textContent = 'Следующий вопрос →';
      } else {
        nextBtn.textContent = 'Посмотреть результат';
      }
      nextBtn.style.display = 'inline-block';
    }

    function showResults() {
      if (progressEl) progressEl.textContent = 'Тестирование завершено';
      if (questionEl) questionEl.textContent = `Ваш результат: ${score} из ${questions.length}`;
      optionsEl.innerHTML = '';

      let resultMessage = '';
      if (score === questions.length) {
        resultMessage = 'Отличный результат! Материал усвоен полностью.';
        feedbackEl.className = 'quiz-feedback success';
      } else if (score >= 3) {
        resultMessage = 'Хороший результат, но рекомендуется повторить некоторые темы.';
        feedbackEl.className = 'quiz-feedback success';
      } else {
        resultMessage = 'Рекомендуется повторить лекционный материал и методические указания.';
        feedbackEl.className = 'quiz-feedback error';
      }

      feedbackEl.innerHTML = resultMessage;
      feedbackEl.style.display = 'block';

      nextBtn.textContent = 'Пройти заново ↻';
      nextBtn.style.display = 'inline-block';
    }

    // Единый слушатель клика кнопки действий
    nextBtn.addEventListener('click', () => {
      // Если тест завершен — корректно сбрасываем и начинаем строго с 1-го вопроса
      if (currentIndex >= questions.length) {
        currentIndex = 0;
        score = 0;
        loadQuestion();
        return;
      }

      // Переход к следующему вопросу или финальному экрану
      currentIndex++;
      if (currentIndex < questions.length) {
        loadQuestion();
      } else {
        showResults();
      }
    });

    // Первоначальный запуск
    loadQuestion();
  }
});